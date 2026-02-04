# 套用 `ravenyeh/garmin-connect` MFA 指南

## 1. `package.json` - 換 dependency

```diff
- "@gooin/garmin-connect": "1.6.6"
+ "garmin-connect": "github:ravenyeh/garmin-connect"
```

## 2. Vercel 環境變數

```
MFA_SECRET_KEY=至少32個字元的任意字串
```

Library 用此 key 做 AES-256-GCM 加密 mfaSession（內含 cookies + CSRF token + signin params + timestamp）。

## 3. Backend API - 兩步驟架構

```javascript
const { GarminConnect } = require('garmin-connect');
// 注意：不是 require('@gooin/garmin-connect')
```

### Step 1 - 登入（偵測 MFA）

```javascript
const GC = new GarminConnect({ username: email, password: password });
const result = await GC.login();

if (result && result.needsMFA) {
    // library 自動把 cookies/CSRF/params 加密進 mfaSession
    return res.json({
        needsMfa: true,
        mfaSession: result.mfaSession,  // 加密字串，傳給前端暫存
        message: '請輸入驗證碼'
    });
}
// 沒有 MFA → 直接操作 GC.addWorkout() 等
```

### Step 2 - 驗證 OTP（不需要帳密）

```javascript
const GC = new GarminConnect({ username: '', password: '' });

try {
    await GC.verifyMFA(mfaSession, mfaCode);
    // library 自動：解密 mfaSession → 還原 cookies → POST 驗證碼 → 完成 OAuth
} catch (e) {
    const msg = e.message.toLowerCase();
    if (msg.includes('expired'))       // 5 分鐘過期
    if (msg.includes('invalid'))       // session 損毀
    if (msg.includes('mfa_secret_key')) // 環境變數未設定或 < 32 字元
}
// 驗證成功 → 正常操作 GC.addWorkout() 等
```

## 4. Frontend - 暫存 mfaSession（in-memory）

```javascript
let pendingMfaSession = null;  // 不存 localStorage，僅記憶體
let pendingWorkouts = null;

// Step 1 回來
if (data.needsMfa) {
    pendingMfaSession = data.mfaSession;
    pendingWorkouts = workoutPayloads;
    showOtpInput();  // 顯示 OTP 輸入框
}

// Step 2 送出
if (mfaCode && pendingMfaSession) {
    fetch('/api/garmin/import', {
        body: JSON.stringify({
            mfaSession: pendingMfaSession,
            mfaCode: mfaCode,
            workouts: pendingWorkouts
            // 不需要 email/password
        })
    });
}
```

## 5. 錯誤處理重點

| 情境 | 行為 |
|------|------|
| 驗證碼錯誤 | **保留** mfaSession，清空 OTP 輸入框讓使用者重試 |
| Session 過期（5 分鐘） | 清除 mfaSession，提示重新登入 |
| Session 無效/損毀 | 清除 mfaSession，提示重新登入 |
| 網路錯誤 | **保留** mfaSession，讓使用者重試 |

> **關鍵：step 2 失敗時不要隨便清除 mfaSession**，否則下次點擊會 fallback 回 step 1 重新登入 → Garmin 又寄一組新 OTP。

## 6. 與舊版 `@gooin/garmin-connect` 的差異

| | 舊版 `@gooin` | 新版 `ravenyeh` |
|---|---|---|
| MFA 偵測 | 從 error message 字串比對 | `login()` 直接回傳 `{ needsMFA, mfaSession }` |
| MFA 驗證 | `setMFACode()` 後重新 `login()` | `verifyMFA(session, code)` 獨立呼叫 |
| Session 保存 | 無（要重送帳密） | 加密在 mfaSession 裡（cookies + CSRF + params） |
| 環境變數 | 不需要 | 需要 `MFA_SECRET_KEY` (>= 32 chars) |
| 第二步要帳密 | 要 | 不要 |

## 7. mfaSession 內部結構（library 自動處理）

```
mfaSession (Base64 encoded) = AES-256-GCM encrypt({
    cookies: "序列化的 cookie jar (JSON)",
    csrfToken: "MFA 頁面的 CSRF token",
    signinParams: { /* 原始 signin 參數 */ },
    timestamp: 1234567890  // 用於 5 分鐘過期檢查
}, key=MFA_SECRET_KEY)
```

前端不需要知道內部結構，只需原封不動把 `mfaSession` 字串暫存並回傳即可。

## 8. 參考資源

- Library repo: https://github.com/ravenyeh/garmin-connect
- Examples: https://github.com/ravenyeh/garmin-connect/tree/master/examples
- `test-server.js`: Node.js HTTP server 範例（兩步驟 MFA）
- `api-example.js`: Express-style API 範例
- `mfa-test.html`: 前端 MFA 測試頁面
