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

        try {
            await GC.login();
        } catch (loginError) {
            console.error('Login error:', loginError.message);
            return res.status(401).json({
                success: false,
                error: '登入失敗：請確認 Email 和密碼是否正確'
            });
        }

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

                // Schedule if date provided
                let scheduled = false;
                if (scheduledDate && createdWorkout && createdWorkout.workoutId) {
                    try {
                        if (typeof GC.scheduleWorkout === 'function') {
                            await GC.scheduleWorkout(
                                { workoutId: createdWorkout.workoutId },
                                new Date(scheduledDate)
                            );
                            scheduled = true;
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
            message += `，${scheduledCount} 個已排程到日曆`;
        }

        // Get OAuth2 token for client-side storage
        const oauth2Token = GC.client?.oauth2Token || null;

        // Get user profile
        let user = null;
        try {
            const userProfile = await GC.getUserProfile();
            user = {
                displayName: userProfile.displayName || email.split('@')[0],
                fullName: userProfile.fullName || null,
                profileImageUrl: userProfile.profileImageUrlSmall || null
            };
        } catch (e) {
            user = { displayName: email.split('@')[0] };
        }

        return res.status(200).json({
            success: successCount > 0,
            message: message,
            results: results,
            summary: {
                total: workouts.length,
                imported: successCount,
                scheduled: scheduledCount,
                failed: workouts.length - successCount
            },
            oauth2Token: oauth2Token,
            user: user
        });

    } catch (error) {
        console.error('Garmin import error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || '伺服器錯誤'
        });
    }
};
