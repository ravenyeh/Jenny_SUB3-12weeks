// Garmin Connect Integration Module

const GARMIN_TOKEN_KEY = 'garmin_oauth2_token';
const GARMIN_USER_KEY = 'garmin_user_info';
const GARMIN_CREDS_KEY = 'garmin_credentials';

// Get Garmin OAuth2 token from localStorage
export function getGarminToken() {
    try {
        const token = localStorage.getItem(GARMIN_TOKEN_KEY);
        return token ? JSON.parse(token) : null;
    } catch {
        return null;
    }
}

// Set Garmin OAuth2 token to localStorage
export function setGarminToken(token) {
    if (token) {
        localStorage.setItem(GARMIN_TOKEN_KEY, JSON.stringify(token));
    }
}

// Clear Garmin token
export function clearGarminToken() {
    localStorage.removeItem(GARMIN_TOKEN_KEY);
}

// Get Garmin user info from localStorage
export function getGarminUser() {
    try {
        const user = localStorage.getItem(GARMIN_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

// Set Garmin user info to localStorage
export function setGarminUser(user) {
    if (user) {
        localStorage.setItem(GARMIN_USER_KEY, JSON.stringify(user));
    }
}

// Clear Garmin user info
export function clearGarminUser() {
    localStorage.removeItem(GARMIN_USER_KEY);
}

// Get stored credentials (for quick re-login)
export function getGarminCredentials() {
    try {
        const creds = localStorage.getItem(GARMIN_CREDS_KEY);
        return creds ? JSON.parse(creds) : null;
    } catch {
        return null;
    }
}

// Set credentials to localStorage
export function setGarminCredentials(email, password) {
    if (email && password) {
        localStorage.setItem(GARMIN_CREDS_KEY, JSON.stringify({ email, password }));
    }
}

// Clear stored credentials
export function clearGarminCredentials() {
    localStorage.removeItem(GARMIN_CREDS_KEY);
}

// Check if we have valid login state
export function hasValidLogin() {
    const creds = getGarminCredentials();
    const user = getGarminUser();
    return !!(creds && creds.email && creds.password && user);
}

// Update Garmin status message
export function updateGarminStatus(message, isError = false) {
    const statusEl = document.getElementById('garminStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `garmin-status ${isError ? 'error' : 'success'}`;
        statusEl.style.display = message ? 'block' : 'none';
    }
}

// Import workout with credentials (one-click import)
export async function importWithCredentials(dayIndex, trainingData, convertToGarminWorkout, showWorkoutModal, getTrainingDate) {
    const creds = getGarminCredentials();

    if (!creds || !creds.email || !creds.password) {
        updateGarminStatus('請先登入 Garmin Connect', true);
        return false;
    }

    const training = trainingData[dayIndex];
    if (!training) {
        updateGarminStatus('找不到訓練資料', true);
        return false;
    }

    // Get the training date for this day
    const trainingDate = getTrainingDate(dayIndex);
    const scheduledDate = trainingDate.toISOString().split('T')[0];

    let workouts;
    try {
        workouts = convertToGarminWorkout(training, dayIndex);
    } catch (err) {
        updateGarminStatus(`生成訓練失敗：${err.message}`, true);
        return false;
    }

    if (!workouts || workouts.length === 0) {
        updateGarminStatus('沒有訓練可匯入', true);
        return false;
    }

    // Add scheduledDate to each workout
    const workoutPayloads = workouts.map(w => ({
        workout: { ...w.data, scheduledDate },
        scheduledDate: scheduledDate
    }));

    updateGarminStatus(`匯入 ${workouts.length} 個訓練中...`, false);

    try {
        const response = await fetch('/api/garmin/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: creds.email,
                password: creds.password,
                workouts: workoutPayloads
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            updateGarminStatus(`伺服器錯誤 (${response.status})，請稍後再試`, true);
            return false;
        }

        const data = await response.json();

        if (data.oauth2Token) {
            setGarminToken(data.oauth2Token);
        }
        if (data.user) {
            setGarminUser(data.user);
        }

        // Check if MFA is needed - user needs to re-login with OTP
        if (data.needsMfa) {
            // Clear credentials to force re-login
            clearGarminCredentials();
            clearGarminUser();
            updateGarminStatus('需要重新登入並輸入驗證碼', true);
            // Refresh the modal to show login form
            setTimeout(() => {
                if (showWorkoutModal) {
                    showWorkoutModal(dayIndex);
                    // Show OTP input after modal refreshes
                    setTimeout(() => {
                        showOtpInput();
                    }, 100);
                }
            }, 500);
            return false;
        }

        if (data.success) {
            updateGarminStatus('✅ ' + (data.message || '匯入成功！'), false);
            setTimeout(() => {
                if (showWorkoutModal) {
                    showWorkoutModal(dayIndex);
                }
            }, 1500);
            return true;
        } else {
            if (data.error && (data.error.includes('密碼') || data.error.includes('Email') || data.error.includes('登入'))) {
                clearGarminCredentials();
                clearGarminUser();
            }
            updateGarminStatus(`匯入失敗：${data.error}`, true);
            return false;
        }
    } catch (error) {
        updateGarminStatus(`連線錯誤：${error.message}`, true);
        return false;
    }
}

// Show OTP input container
export function showOtpInput() {
    const otpContainer = document.getElementById('garminOtpContainer');
    if (otpContainer) {
        otpContainer.style.display = 'block';
        // Focus on the OTP input
        setTimeout(() => {
            const otpInput = document.getElementById('garminOtp');
            if (otpInput) {
                otpInput.focus();
            }
        }, 100);
    }
}

// Hide OTP input container
export function hideOtpInput() {
    const otpContainer = document.getElementById('garminOtpContainer');
    if (otpContainer) {
        otpContainer.style.display = 'none';
    }
    // Clear OTP value
    const otpInput = document.getElementById('garminOtp');
    if (otpInput) {
        otpInput.value = '';
    }
}

// Login and save credentials
export async function garminLoginAndSave(email, password, dayIndex, trainingData, convertToGarminWorkout, showWorkoutModal, getTrainingDate, mfaCode = null) {
    if (!email || !password) {
        updateGarminStatus('請輸入 Email 和密碼', true);
        return false;
    }

    if (mfaCode) {
        updateGarminStatus('驗證中...', false);
    } else {
        updateGarminStatus('登入並匯入中...', false);
    }

    // Save credentials
    setGarminCredentials(email, password);

    // Import with credentials
    const training = trainingData[dayIndex];
    if (!training) {
        updateGarminStatus('找不到訓練資料', true);
        return false;
    }

    const trainingDate = getTrainingDate(dayIndex);
    const scheduledDate = trainingDate.toISOString().split('T')[0];

    let workouts;
    try {
        workouts = convertToGarminWorkout(training, dayIndex);
    } catch (err) {
        updateGarminStatus(`生成訓練失敗：${err.message}`, true);
        return false;
    }

    if (!workouts || workouts.length === 0) {
        updateGarminStatus('沒有訓練可匯入', true);
        return false;
    }

    const workoutPayloads = workouts.map(w => ({
        workout: { ...w.data, scheduledDate },
        scheduledDate: scheduledDate
    }));

    try {
        const requestBody = {
            email,
            password,
            workouts: workoutPayloads
        };

        // Add MFA code if provided
        if (mfaCode) {
            requestBody.mfaCode = mfaCode;
        }

        const response = await fetch('/api/garmin/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            updateGarminStatus('伺服器錯誤，請稍後再試', true);
            clearGarminCredentials();
            return false;
        }

        const data = await response.json();

        // Check if MFA is needed
        if (data.needsMfa) {
            updateGarminStatus(data.message || '請輸入 Email 收到的驗證碼', true);
            showOtpInput();
            return false;
        }

        if (data.oauth2Token) {
            setGarminToken(data.oauth2Token);
        }
        if (data.user) {
            setGarminUser(data.user);
        }

        if (data.success) {
            hideOtpInput();
            updateGarminStatus('✅ ' + (data.message || '登入成功並已匯入訓練！'), false);
            setTimeout(() => {
                if (showWorkoutModal) {
                    showWorkoutModal(dayIndex);
                }
            }, 1500);
            return true;
        } else {
            // Check if it's an MFA error
            if (data.needsMfa || (data.error && data.error.includes('驗證碼'))) {
                updateGarminStatus(data.message || data.error || '請輸入驗證碼', true);
                showOtpInput();
            } else {
                clearGarminCredentials();
                clearGarminUser();
                hideOtpInput();
                updateGarminStatus(`登入失敗：${data.error}`, true);
            }
            return false;
        }
    } catch (error) {
        clearGarminCredentials();
        hideOtpInput();
        updateGarminStatus(`連線錯誤：${error.message}`, true);
        return false;
    }
}

// Logout
export function garminLogout(showWorkoutModal, dayIndex) {
    clearGarminToken();
    clearGarminUser();
    clearGarminCredentials();
    updateGarminStatus('已登出 Garmin Connect', false);

    setTimeout(() => {
        if (showWorkoutModal && dayIndex !== undefined) {
            showWorkoutModal(dayIndex);
        }
    }, 500);
}

// Initialize global state
window.currentWorkoutDayIndex = undefined;
