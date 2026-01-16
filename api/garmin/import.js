const { GarminConnect } = require('@gooin/garmin-connect');

// Combined login + import endpoint for Vercel serverless
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, workouts } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '請提供 Email 和密碼'
            });
        }

        if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
            return res.status(400).json({
                success: false,
                error: '請提供訓練資料'
            });
        }

        // Initialize and login
        const GC = new GarminConnect({
            username: email,
            password: password
        });

        await GC.login();

        // Import each workout
        const results = [];
        for (const workoutData of workouts) {
            try {
                const { workout, scheduledDate } = workoutData;

                // Create workout
                let createdWorkout;
                try {
                    createdWorkout = await GC.addWorkout(workout);
                } catch (e) {
                    // Try alternative method if addWorkout doesn't exist
                    console.log('addWorkout failed, trying alternative:', e.message);

                    if (GC.client && GC.client.post) {
                        const response = await GC.client.post(
                            'https://connect.garmin.com/workout-service/workout',
                            { ...workout, workoutId: null, ownerId: null }
                        );
                        createdWorkout = response.data;
                    } else {
                        throw e;
                    }
                }

                // Schedule if date provided - use correct scheduleWorkout format
                let scheduled = false;
                if (scheduledDate && createdWorkout && createdWorkout.workoutId) {
                    try {
                        console.log('Scheduling workout:', createdWorkout.workoutId, 'to date:', scheduledDate);

                        // Correct format: first param is object with workoutId, second is Date object
                        if (typeof GC.scheduleWorkout === 'function') {
                            await GC.scheduleWorkout(
                                { workoutId: createdWorkout.workoutId },
                                new Date(scheduledDate)
                            );
                            scheduled = true;
                            console.log('Workout scheduled successfully');
                        } else {
                            console.log('scheduleWorkout method not available');
                        }
                    } catch (e) {
                        console.log('Schedule failed:', e.message);
                    }
                }

                results.push({
                    success: true,
                    workoutName: workout.workoutName,
                    workoutId: createdWorkout?.workoutId,
                    scheduledDate: scheduledDate || null,
                    scheduled: scheduled
                });
            } catch (e) {
                results.push({
                    success: false,
                    workoutName: workoutData.workout?.workoutName || 'Unknown',
                    error: e.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const scheduledCount = results.filter(r => r.success && r.scheduled).length;

        let message = `成功匯入 ${successCount}/${workouts.length} 個訓練`;
        if (scheduledCount > 0) {
            message += `，${scheduledCount} 個已排程`;
        } else if (successCount > 0) {
            message += '（排程功能暫不可用）';
        }

        // Get OAuth2 token for client-side storage
        const oauth2Token = GC.client?.oauth2Token || null;

        // Get user profile and social profile
        let user = null;
        try {
            const userProfile = await GC.getUserProfile();

            // Try to fetch social profile for fullName and avatar
            let socialProfile = null;
            if (userProfile.displayName) {
                try {
                    const socialUrl = `https://connect.garmin.com/modern/proxy/userprofile-service/socialProfile/${userProfile.displayName}`;
                    socialProfile = await GC.get(socialUrl);
                } catch (e) {
                    // Social profile fetch is optional, continue without it
                }
            }

            user = {
                displayName: userProfile.displayName || email.split('@')[0],
                fullName: socialProfile?.fullName || socialProfile?.userProfileFullName || userProfile.fullName || null,
                profileImageUrl: socialProfile?.profileImageUrlSmall || userProfile.profileImageUrlSmall || null
            };
        } catch (e) {
            // User profile fetch is optional, continue without it
        }

        return res.status(200).json({
            success: successCount > 0,
            message: message,
            results: results,
            summary: {
                total: workouts.length,
                imported: successCount,
                scheduled: scheduledCount
            },
            oauth2Token: oauth2Token,
            user: user
        });

    } catch (error) {
        console.error('Garmin import error:', error.message);

        let errorMessage = '匯入失敗';

        if (error.message) {
            const msg = error.message.toLowerCase();
            if (msg.includes('credentials') || msg.includes('password') || msg.includes('401')) {
                errorMessage = 'Email 或密碼錯誤';
            } else if (msg.includes('captcha') || msg.includes('robot')) {
                errorMessage = 'Garmin 需要驗證碼，請使用手動匯入方式';
            } else if (msg.includes('blocked') || msg.includes('forbidden')) {
                errorMessage = 'Garmin 暫時封鎖此連線，請使用手動匯入';
            }
        }

        return res.status(401).json({
            success: false,
            error: errorMessage,
            detail: 'Garmin Connect API 失敗，建議使用「複製 JSON」或「下載 .json」功能手動匯入'
        });
    }
};
