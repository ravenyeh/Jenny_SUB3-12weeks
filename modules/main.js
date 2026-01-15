// Main entry point - Marathon Training Plan
import { trainingData, weeklySummary, motivationQuotes, getMotivationQuote, getRaceDate, DEFAULT_RACE_DATE } from './trainingData.js';
import { convertToGarminWorkout, downloadWorkoutJson } from './workoutBuilder.js';
import { formatSecondsToPace, TRAINING_PARAMS, GOAL_PRESETS, refreshTrainingParams } from './paceZones.js';

// Make data available globally
window.trainingData = trainingData;
window.convertToGarminWorkout = convertToGarminWorkout;

// ============================================
// User Settings Management
// ============================================

function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'block' : 'none';

        // If showing panel, set the current values
        if (isHidden) {
            const goalSelect = document.getElementById('goalSelect');
            const currentGoal = localStorage.getItem('userGoal') || 'sub3';
            if (goalSelect) {
                goalSelect.value = currentGoal;
            }

            const raceDateInput = document.getElementById('raceDateInput');
            const currentRaceDate = getRaceDate();
            if (raceDateInput) {
                raceDateInput.value = currentRaceDate;
            }
        }
    }
}

function saveUserSettings() {
    const goalSelect = document.getElementById('goalSelect');
    const raceDateInput = document.getElementById('raceDateInput');

    if (goalSelect) {
        const selectedGoal = goalSelect.value;
        localStorage.setItem('userGoal', selectedGoal);

        // Save race date
        if (raceDateInput && raceDateInput.value) {
            localStorage.setItem('userRaceDate', raceDateInput.value);
        }

        // Refresh training params
        const newParams = refreshTrainingParams();

        // Update display
        updateSettingsDisplay();

        // Restart countdown with new date
        updateCountdown();

        // Refresh schedule table with new dates
        populateSchedule();

        // Refresh today's training display
        displayTodayTraining();

        // Hide panel
        toggleSettingsPanel();

        // Show confirmation
        const raceDate = getRaceDate();
        const formattedDate = formatRaceDateDisplay(raceDate);
        alert(`設定已儲存！\n目標：${GOAL_PRESETS[selectedGoal].name}\n配速：${GOAL_PRESETS[selectedGoal].paceStr}/km\n比賽日期：${formattedDate}`);
    }
}

// Format race date for display (YYYY-MM-DD -> YYYY/MM/DD)
function formatRaceDateDisplay(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

// Format race date with weekday (YYYY年M月D日 (週X))
function formatRaceDateFull(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (週${weekday})`;
}

function updateSettingsDisplay() {
    const params = TRAINING_PARAMS;
    const raceDate = getRaceDate();

    // Update goal display
    const displayGoal = document.getElementById('displayGoal');
    const displayPace = document.getElementById('displayPace');
    const displayRaceDate = document.getElementById('displayRaceDate');

    if (displayGoal) {
        displayGoal.textContent = params.GOAL_NAME;
    }
    if (displayPace) {
        displayPace.textContent = params.MARATHON_PACE_STR;
    }
    if (displayRaceDate) {
        displayRaceDate.textContent = formatRaceDateDisplay(raceDate);
    }

    // Update hero section
    const raceTitle = document.getElementById('raceTitle');
    const raceDateDisplay = document.getElementById('raceDateDisplay');
    if (raceTitle) {
        raceTitle.textContent = `${params.GOAL_NAME} 馬拉松訓練`;
    }
    if (raceDateDisplay) {
        raceDateDisplay.textContent = formatRaceDateDisplay(raceDate);
    }

    // Update hero stats
    const heroStats = document.querySelectorAll('.hero-stats .stat');
    if (heroStats.length >= 3) {
        heroStats[1].querySelector('.stat-value').textContent = params.GOAL_NAME;
        heroStats[2].querySelector('.stat-value').textContent = `~${params.MARATHON_PACE_STR}/km`;
    }

    // Update race day section
    const raceInfoTitle = document.getElementById('raceInfoTitle');
    const raceDetailDate = document.getElementById('raceDetailDate');
    const raceDetailGoal = document.getElementById('raceDetailGoal');
    const raceDetailPace = document.getElementById('raceDetailPace');

    if (raceInfoTitle) {
        raceInfoTitle.textContent = `🏁 馬拉松比賽`;
    }
    if (raceDetailDate) {
        raceDetailDate.textContent = formatRaceDateFull(raceDate);
    }
    if (raceDetailGoal) {
        const goalPreset = GOAL_PRESETS[localStorage.getItem('userGoal') || 'sub3'];
        raceDetailGoal.textContent = `${goalPreset.time.slice(0, -3)}:xx (${params.GOAL_NAME})`;
    }
    if (raceDetailPace) {
        raceDetailPace.textContent = `~${params.MARATHON_PACE_STR}/km`;
    }
}

// Make settings functions globally available
window.toggleSettingsPanel = toggleSettingsPanel;
window.saveUserSettings = saveUserSettings;

// ============================================
// Countdown Timer
// ============================================

function updateCountdown() {
    const raceDateStr = getRaceDate();
    const raceDate = new Date(raceDateStr + 'T06:00:00');
    const now = new Date();
    const diff = raceDate - now;

    if (diff <= 0) {
        document.getElementById('countdown-days').textContent = '0';
        document.getElementById('countdown-hours').textContent = '00';
        document.getElementById('countdown-minutes').textContent = '00';
        document.getElementById('countdown-seconds').textContent = '00';
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countdown-days').textContent = days;
    document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');
}

// ============================================
// Date Calculation & Formatting
// ============================================

// Calculate training date based on race date and day index
// Training plan has 84 days (12 weeks), race day is the last day (index 83)
function getTrainingDate(dayIndex) {
    const raceDate = new Date(getRaceDate());
    const totalDays = trainingData.length; // 84 days
    const daysBeforeRace = totalDays - 1 - dayIndex;
    const trainingDate = new Date(raceDate);
    trainingDate.setDate(raceDate.getDate() - daysBeforeRace);
    return trainingDate;
}

// Format date object to string for display
function formatDateFromObj(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} (${weekday})`;
}

function formatDateShortFromObj(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} (${weekday})`;
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ============================================
// Today's Training Display
// ============================================

function displayTodayTraining() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's training using dynamic dates
    let todayTrainingIndex = -1;
    for (let i = 0; i < trainingData.length; i++) {
        const trainingDate = getTrainingDate(i);
        trainingDate.setHours(0, 0, 0, 0);
        if (trainingDate.getTime() === today.getTime()) {
            todayTrainingIndex = i;
            break;
        }
    }

    const todayTrainingDiv = document.getElementById('todayTraining');
    const todayLabel = document.getElementById('todayLabel');
    const todayPhase = document.getElementById('todayPhase');
    const todayIntensity = document.getElementById('todayIntensity');
    const todayDescription = document.getElementById('todayDescription');
    const todayRun = document.getElementById('todayRun');
    const todayType = document.getElementById('todayType');
    const todayMotivation = document.getElementById('todayMotivation');

    if (!todayTrainingDiv) return;

    if (todayTrainingIndex >= 0) {
        const todayTraining = trainingData[todayTrainingIndex];
        todayLabel.textContent = '今日訓練';
        todayPhase.textContent = todayTraining.phase;
        todayIntensity.textContent = todayTraining.intensity;
        todayDescription.innerHTML = todayTraining.content.replace(/\n/g, '<br>');
        todayRun.textContent = `🏃 ${todayTraining.distance}km`;
        todayType.textContent = todayTraining.type;
        todayMotivation.textContent = `💪 ${getMotivationQuote(todayTrainingIndex)}`;
        todayTrainingDiv.style.display = 'block';
    } else {
        // Check if we're before training starts or after race
        const firstDate = getTrainingDate(0);
        firstDate.setHours(0, 0, 0, 0);
        const lastDate = getTrainingDate(trainingData.length - 1);
        lastDate.setHours(0, 0, 0, 0);

        if (today < firstDate) {
            todayLabel.textContent = '訓練即將開始';
            todayPhase.textContent = '準備期';
            todayIntensity.textContent = '';
            todayDescription.textContent = `訓練將於 ${formatDateFromObj(firstDate)} 開始`;
            todayRun.textContent = '';
            todayType.textContent = '';
            todayMotivation.textContent = '💪 做好準備，迎接挑戰！';
        } else if (today > lastDate) {
            todayLabel.textContent = '訓練完成';
            todayPhase.textContent = '比賽日';
            todayIntensity.textContent = '';
            todayDescription.textContent = '恭喜完成12週訓練！';
            todayRun.textContent = '';
            todayType.textContent = '';
            todayMotivation.textContent = '🏆 你做到了！';
        } else {
            // Find next training day
            let nextTrainingIndex = -1;
            for (let i = 0; i < trainingData.length; i++) {
                const trainingDate = getTrainingDate(i);
                trainingDate.setHours(0, 0, 0, 0);
                if (trainingDate > today) {
                    nextTrainingIndex = i;
                    break;
                }
            }

            if (nextTrainingIndex >= 0) {
                const nextTraining = trainingData[nextTrainingIndex];
                const nextDate = getTrainingDate(nextTrainingIndex);
                todayLabel.textContent = '下次訓練';
                todayPhase.textContent = nextTraining.phase;
                todayIntensity.textContent = nextTraining.intensity;
                todayDescription.innerHTML = `${formatDateFromObj(nextDate)}<br>${nextTraining.content.replace(/\n/g, '<br>')}`;
                todayRun.textContent = `🏃 ${nextTraining.distance}km`;
                todayType.textContent = nextTraining.type;
                todayMotivation.textContent = `💪 ${getMotivationQuote(nextTrainingIndex)}`;
            }
        }
        todayTrainingDiv.style.display = 'block';
    }
}

// ============================================
// Schedule Table
// ============================================

function getTypeBadgeClass(type) {
    const typeMap = {
        'Easy 輕鬆跑': 'easy',
        'Speed 速度跑': 'speed',
        'Tempo 節奏跑': 'tempo',
        'Long Run 長距離': 'long-run',
        'Race 比賽': 'race',
        'Race Day': 'race',
        'Aerobic 有氧跑': 'aerobic',
        'Threshold 閾值間歇': 'threshold',
        'MP Intervals': 'mp',
        'Easy + Tempo': 'tempo',
        'Shakeout': 'shakeout'
    };
    return typeMap[type] || 'easy';
}

function populateSchedule(filter = 'all') {
    const tbody = document.getElementById('scheduleBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Create array with original indices for date calculation
    const dataWithIndices = trainingData.map((item, idx) => ({ ...item, originalIndex: idx }));

    const filteredData = filter === 'all'
        ? dataWithIndices
        : dataWithIndices.filter(item => item.phase === filter);

    let currentWeek = '';

    filteredData.forEach((item) => {
        const row = document.createElement('tr');

        // Calculate dynamic date based on race date
        const trainingDate = getTrainingDate(item.originalIndex);

        // Add special classes
        if (item.type === 'Race 比賽' || item.type === 'Race Day') {
            row.classList.add('race-day');
        }
        if (item.isRaceDay) {
            row.classList.add('race-day');
        }

        // Check if this is a new week
        const showWeek = item.week !== currentWeek;
        currentWeek = item.week;

        // Find weekly total (show only on last day of week)
        const isLastDayOfWeek = item.day === 'Sun';
        const weeklyTotalDisplay = isLastDayOfWeek ? `${item.weeklyTotal}km` : '';

        row.innerHTML = `
            <td>${showWeek ? item.week : ''}</td>
            <td>${formatDateShortFromObj(trainingDate)}</td>
            <td>${item.day}</td>
            <td><span class="type-badge ${getTypeBadgeClass(item.type)}">${item.type}</span></td>
            <td class="content-cell">${item.content.replace(/\n/g, '<br>')}</td>
            <td><span class="intensity-badge intensity-${item.intensity}">${item.intensity}</span></td>
            <td>${item.distance}km</td>
            <td>${weeklyTotalDisplay}</td>
        `;

        tbody.appendChild(row);
    });
}

window.populateSchedule = populateSchedule;

// ============================================
// Filter Buttons
// ============================================

function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Filter the schedule
            const filter = btn.dataset.filter;
            populateSchedule(filter);
        });
    });
}

// ============================================
// Weekly Mileage Chart
// ============================================

function createWeeklyChart() {
    const ctx = document.getElementById('weeklyMileageChart');
    if (!ctx) return;

    const phaseColors = {
        '基礎期': '#4caf50',
        '強化期': '#ff9800',
        '巔峰期': '#e91e63',
        '減量期': '#2196f3'
    };

    const backgroundColors = weeklySummary.map(w => phaseColors[w.phase] || '#666');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklySummary.map(w => `W${w.week}`),
            datasets: [{
                label: '週跑量 (km)',
                data: weeklySummary.map(w => w.total),
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const weekData = weeklySummary[context.dataIndex];
                            return `${weekData.phase}: ${context.raw}km`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 180,
                    ticks: {
                        callback: function(value) {
                            return value + 'km';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// Summary Card Click Handler
// ============================================

function setupSummaryCards() {
    const cards = document.querySelectorAll('.summary-card');
    const filterBtns = document.querySelectorAll('.filter-btn');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const phase = card.dataset.phase;
            if (!phase) return;

            // Update filter buttons
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === phase) {
                    btn.classList.add('active');
                }
            });

            // Filter schedule
            populateSchedule(phase);

            // Scroll to schedule
            document.getElementById('schedule').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ============================================
// Workout Modal with Garmin Export
// ============================================

// Store current workout data for download
let currentWorkoutData = null;

function showWorkoutModal(dayIndex) {
    const training = trainingData[dayIndex];
    if (!training) return;

    const modal = document.getElementById('workoutModal');
    const modalContent = document.getElementById('workoutModalContent');
    if (!modal || !modalContent) return;

    const quote = getMotivationQuote(dayIndex);

    // Generate Garmin workout
    const workouts = convertToGarminWorkout(training, dayIndex);
    currentWorkoutData = workouts.length > 0 ? workouts[0].data : null;

    // Render workout steps preview
    let stepsPreviewHtml = '';
    if (currentWorkoutData && currentWorkoutData.workoutSegments) {
        const steps = currentWorkoutData.workoutSegments[0]?.workoutSteps || [];
        stepsPreviewHtml = renderStepsPreview(steps);
    }

    // Get dynamic training date
    const trainingDate = getTrainingDate(dayIndex);

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Garmin 訓練計劃</h3>
            <button class="modal-close" onclick="closeWorkoutModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="training-info" style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <div class="training-date" style="font-weight: 700;">${formatDateFromObj(trainingDate)}</div>
                <span class="phase-badge phase-${training.phase}">${training.phase}</span>
                <span class="intensity-badge intensity-${training.intensity}">${training.intensity}</span>
            </div>
            ${quote ? `<div style="background: var(--primary-color); color: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;">💪 ${quote}</div>` : ''}
            <div style="margin-bottom: 15px;">
                <strong>訓練類型：</strong> ${training.type}
            </div>
            <div style="margin-bottom: 15px; line-height: 1.8;">
                <strong>訓練內容：</strong><br>
                ${training.content.replace(/\n/g, '<br>')}
            </div>
            <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                <div><strong>距離：</strong> ${training.distance}km</div>
                <div><strong>預估時間：</strong> ${currentWorkoutData ? Math.round(currentWorkoutData.estimatedDurationInSecs / 60) : '-'} 分鐘</div>
            </div>
            ${training.race ? `<div style="background: #fff3e0; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;"><strong>🏁 比賽：</strong> ${training.race}</div>` : ''}
            ${training.note ? `<div style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 15px;"><em>備註：${training.note}</em></div>` : ''}

            ${stepsPreviewHtml}

            ${currentWorkoutData ? `
            <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <h4 style="margin-bottom: 10px;">📥 匯出 Garmin 訓練</h4>
                <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 15px;">下載 JSON 檔案後，可匯入 Garmin Connect 使用</p>
                <button class="btn-download-workout" onclick="downloadCurrentWorkout(${dayIndex})">
                    下載 Garmin Workout JSON
                </button>
            </div>
            ` : ''}
        </div>
        <div class="modal-footer">
            <button class="btn-close" onclick="closeWorkoutModal()">關閉</button>
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Render workout steps preview
function renderStepsPreview(steps) {
    if (!steps || steps.length === 0) return '';

    let html = `<div class="steps-preview">
        <div class="steps-header">訓練步驟</div>`;

    steps.forEach(step => {
        html += renderStep(step);
    });

    html += '</div>';
    return html;
}

function renderStep(step) {
    const stepType = step.stepType?.stepTypeKey || 'interval';

    // Handle repeat groups
    if (stepType === 'repeat' && step.workoutSteps) {
        return renderRepeatGroup(step);
    }

    const label = getStepLabel(stepType);
    const duration = formatStepDuration(step);
    const target = formatStepTarget(step);

    return `
        <div class="step-item step-type-${stepType}">
            <div class="step-color-bar ${stepType}"></div>
            <div class="step-content">
                <div class="step-label">${label}</div>
                <div class="step-duration">${duration}</div>
                ${target ? `<div class="step-target">${target}</div>` : ''}
                ${step.description ? `<div class="step-description">${step.description}</div>` : ''}
            </div>
        </div>
    `;
}

function renderRepeatGroup(step) {
    const reps = step.numberOfIterations || 1;
    const childSteps = step.workoutSteps || [];

    let html = `
        <div class="step-repeat-group">
            <div class="repeat-header">
                <span class="repeat-times">${reps}x</span>
                <span>重複訓練</span>
            </div>
            <div class="repeat-steps">
    `;
    childSteps.forEach(childStep => {
        html += renderStep(childStep);
    });
    html += '</div></div>';
    return html;
}

function getStepLabel(stepType) {
    const labels = {
        'warmup': '熱身',
        'cooldown': '緩和',
        'interval': '主課表',
        'rest': '休息',
        'recovery': '恢復',
        'active': '動態恢復'
    };
    return labels[stepType] || stepType;
}

function formatStepDuration(step) {
    const condition = step.endCondition?.conditionTypeKey;
    const value = step.endConditionValue;

    if (!condition || !value) return '';

    if (condition === 'distance') {
        return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${value} m`;
    } else if (condition === 'time') {
        if (value >= 60) {
            const mins = Math.floor(value / 60);
            const secs = value % 60;
            return secs > 0 ? `${mins}分${secs}秒` : `${mins} 分鐘`;
        }
        return `${value} 秒`;
    }
    return '';
}

function formatStepTarget(step) {
    if (!step.targetType || step.targetType.workoutTargetTypeKey === 'no.target') {
        return '';
    }

    if (step.targetType.workoutTargetTypeKey === 'pace.zone') {
        // Convert speed (m/s) back to pace (min/km)
        const slowSpeed = step.targetValueOne;
        const fastSpeed = step.targetValueTwo;
        if (slowSpeed && fastSpeed) {
            const slowPace = formatSecondsToPace(1000 / slowSpeed);
            const fastPace = formatSecondsToPace(1000 / fastSpeed);
            return `配速: ${fastPace} - ${slowPace} /km`;
        }
    }

    return '';
}

// Download current workout
function downloadCurrentWorkout(dayIndex) {
    if (!currentWorkoutData) return;

    const training = trainingData[dayIndex];
    const filename = `${training.week}_${training.day}_${training.type.replace(/\s+/g, '_')}`;

    downloadWorkoutJson(currentWorkoutData, filename);
}

window.downloadCurrentWorkout = downloadCurrentWorkout;
window.showWorkoutModal = showWorkoutModal;

function closeWorkoutModal() {
    const modal = document.getElementById('workoutModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

window.closeWorkoutModal = closeWorkoutModal;

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('workoutModal');
    if (modal && e.target === modal) {
        closeWorkoutModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWorkoutModal();
    }
});

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Update settings display from localStorage
    updateSettingsDisplay();

    // Start countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Display today's training
    displayTodayTraining();

    // Populate schedule
    populateSchedule();

    // Setup filter buttons
    setupFilterButtons();

    // Setup summary card clicks
    setupSummaryCards();

    // Create weekly chart
    createWeeklyChart();

    console.log('Marathon Training Plan loaded successfully!');
});
