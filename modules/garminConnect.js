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

// Login and save credentials
export async function garminLoginAndSave(email, password, dayIndex, trainingData, convertToGarminWorkout, showWorkoutModal, getTrainingDate) {
    if (!email || !password) {
        updateGarminStatus('請輸入 Email 和密碼', true);
        return false;
    }

    updateGarminStatus('登入並匯入中...', false);

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
        const response = await fetch('/api/garmin/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                workouts: workoutPayloads
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            updateGarminStatus('伺服器錯誤，請稍後再試', true);
            clearGarminCredentials();
            return false;
        }

        const data = await response.json();

        if (data.oauth2Token) {
            setGarminToken(data.oauth2Token);
        }
        if (data.user) {
            setGarminUser(data.user);
        }

        if (data.success) {
            updateGarminStatus('✅ ' + (data.message || '登入成功並已匯入訓練！'), false);
            setTimeout(() => {
                if (showWorkoutModal) {
                    showWorkoutModal(dayIndex);
                }
            }, 1500);
            return true;
        } else {
            clearGarminCredentials();
            clearGarminUser();
            updateGarminStatus(`登入失敗：${data.error}`, true);
            return false;
        }
    } catch (error) {
        clearGarminCredentials();
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
