const { GarminConnect } = require('garmin-connect');

// Combined login + MFA verify + import endpoint for Vercel serverless
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
        const { email, password, workouts, mfaSession, mfaCode } = req.body;

        // Step 2: MFA verification flow
        if (mfaSession && mfaCode) {
            return await handleMfaVerifyAndImport(req, res, mfaSession, mfaCode, workouts);
        }

        // Step 1: Initial login flow
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

        return await handleLoginAndImport(req, res, email, password, workouts);

    } catch (error) {
        console.error('Garmin import error:', error.message);

        const msg = (error.message || '').toLowerCase();
        let errorMessage = '匯入失敗';

        if (msg.includes('credentials') || msg.includes('password') || msg.includes('401')) {
            errorMessage = 'Email 或密碼錯誤';
        } else if (msg.includes('captcha') || msg.includes('robot')) {
            errorMessage = 'Garmin 需要驗證碼，請使用手動匯入方式';
        } else if (msg.includes('blocked') || msg.includes('forbidden')) {
            errorMessage = 'Garmin 暫時封鎖此連線，請使用手動匯入';
        } else if (msg.includes('mfa_secret_key')) {
            errorMessage = '伺服器未設定 MFA_SECRET_KEY 環境變數';
        } else if (msg.includes('accountlocked')) {
            errorMessage = '帳號已被鎖定，請至 Garmin Connect 網站解鎖';
        }

        return res.status(401).json({
            success: false,
            error: errorMessage,
            detail: 'Garmin Connect API 失敗，建議使用「複製 JSON」或「下載 .json」功能手動匯入'
        });
    }
};

// Step 1: Login and check for MFA
async function handleLoginAndImport(req, res, email, password, workouts) {
    const GC = new GarminConnect({
        username: email,
        password: password
    });

    const result = await GC.login();

    // Check if MFA is required (ravenyeh/garmin-connect returns { needsMFA, mfaSession })
    if (result && result.needsMFA) {
        return res.status(200).json({
            success: false,
            needsMfa: true,
            mfaSession: result.mfaSession,
            message: 'Garmin 已發送驗證碼到您的 Email，請輸入驗證碼'
        });
    }

    // Login successful, proceed to import workouts
    return await importWorkouts(res, GC, workouts, email);
}

// Step 2: Verify MFA then import
async function handleMfaVerifyAndImport(req, res, mfaSession, mfaCode, workouts) {
    if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
        return res.status(400).json({
            success: false,
            error: '請提供訓練資料'
        });
    }

    // Create a new GarminConnect instance (credentials not needed for MFA verification)
    const GC = new GarminConnect({ username: '', password: '' });

    // Verify MFA with session and code - dedicated error handling
    try {
        await GC.verifyMFA(mfaSession, mfaCode);
    } catch (mfaError) {
        const msg = (mfaError.message || '').toLowerCase();
        console.error('MFA verify error:', mfaError.message);

        let errorMessage = '驗證碼錯誤，請重新輸入';
        let canRetry = true;

        if (msg.includes('expired') || msg.includes('過期')) {
            errorMessage = '驗證碼已過期，請重新登入';
            canRetry = false;
        } else if (msg.includes('invalid') || msg.includes('corrupted')) {
            errorMessage = 'MFA session 無效，請重新登入';
            canRetry = false;
        } else if (msg.includes('mfa_secret_key')) {
            errorMessage = '伺服器未設定 MFA_SECRET_KEY 環境變數';
            canRetry = false;
        }

        return res.status(401).json({
            success: false,
            mfaError: true,
            canRetry: canRetry,
            error: errorMessage
        });
    }

    // MFA verified, proceed to import workouts
    return await importWorkouts(res, GC, workouts, null);
}

// Import workouts using authenticated GC instance
async function importWorkouts(res, GC, workouts, email) {
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
                    const scheduleUrl = `https://connect.garmin.com/modern/proxy/workout-service/schedule/${createdWorkout.workoutId}`;
                    const scheduleBody = { date: scheduledDate };
                    try {
                        await GC.post(scheduleUrl, scheduleBody);
                        scheduled = true;
                    } catch (e1) {
                        console.log('GC.post schedule failed, trying client.post:', e1.message);
                        if (GC.client && GC.client.post) {
                            await GC.client.post(scheduleUrl, scheduleBody);
                            scheduled = true;
                        }
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

    // Get user profile
    let user = null;
    try {
        const userProfile = await GC.getUserProfile();

        let socialProfile = null;
        if (userProfile.displayName) {
            try {
                const socialUrl = `https://connect.garmin.com/modern/proxy/userprofile-service/socialProfile/${userProfile.displayName}`;
                socialProfile = await GC.get(socialUrl);
            } catch (e) {
                // Social profile fetch is optional
            }
        }

        user = {
            displayName: userProfile.displayName || (email ? email.split('@')[0] : 'User'),
            fullName: socialProfile?.fullName || socialProfile?.userProfileFullName || userProfile.fullName || null,
            profileImageUrl: socialProfile?.profileImageUrlSmall || userProfile.profileImageUrlSmall || null
        };
    } catch (e) {
        // User profile fetch is optional
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
}
