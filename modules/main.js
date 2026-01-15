// Main entry point - Marathon Training Plan
import { trainingData, weeklySummary, motivationQuotes, getMotivationQuote, RACE_DATE, RACE_NAME } from './trainingData.js';

// Make data available globally
window.trainingData = trainingData;

// ============================================
// Countdown Timer
// ============================================

function updateCountdown() {
    const raceDate = new Date(RACE_DATE + 'T06:00:00');
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
// Date Formatting
// ============================================

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

    // Find today's training
    const todayTraining = trainingData.find(item => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
    });

    const todayTrainingDiv = document.getElementById('todayTraining');
    const todayLabel = document.getElementById('todayLabel');
    const todayPhase = document.getElementById('todayPhase');
    const todayIntensity = document.getElementById('todayIntensity');
    const todayDescription = document.getElementById('todayDescription');
    const todayRun = document.getElementById('todayRun');
    const todayType = document.getElementById('todayType');
    const todayMotivation = document.getElementById('todayMotivation');

    if (!todayTrainingDiv) return;

    if (todayTraining) {
        const dayIndex = trainingData.indexOf(todayTraining);
        todayLabel.textContent = '今日訓練';
        todayPhase.textContent = todayTraining.phase;
        todayIntensity.textContent = todayTraining.intensity;
        todayDescription.innerHTML = todayTraining.content.replace(/\n/g, '<br>');
        todayRun.textContent = `🏃 ${todayTraining.distance}km`;
        todayType.textContent = todayTraining.type;
        todayMotivation.textContent = `💪 ${getMotivationQuote(dayIndex)}`;
        todayTrainingDiv.style.display = 'block';
    } else {
        // Check if we're before training starts or after race
        const firstDate = new Date(trainingData[0].date);
        const lastDate = new Date(trainingData[trainingData.length - 1].date);

        if (today < firstDate) {
            todayLabel.textContent = '訓練即將開始';
            todayPhase.textContent = '準備期';
            todayIntensity.textContent = '';
            todayDescription.textContent = `訓練將於 ${formatDate(trainingData[0].date)} 開始`;
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
            const nextTraining = trainingData.find(item => {
                const itemDate = new Date(item.date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate > today;
            });

            if (nextTraining) {
                const dayIndex = trainingData.indexOf(nextTraining);
                todayLabel.textContent = '下次訓練';
                todayPhase.textContent = nextTraining.phase;
                todayIntensity.textContent = nextTraining.intensity;
                todayDescription.innerHTML = `${formatDate(nextTraining.date)}<br>${nextTraining.content.replace(/\n/g, '<br>')}`;
                todayRun.textContent = `🏃 ${nextTraining.distance}km`;
                todayType.textContent = nextTraining.type;
                todayMotivation.textContent = `💪 ${getMotivationQuote(dayIndex)}`;
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

    const filteredData = filter === 'all'
        ? trainingData
        : trainingData.filter(item => item.phase === filter);

    let currentWeek = '';

    filteredData.forEach((item, index) => {
        const row = document.createElement('tr');

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
            <td>${formatDateShort(item.date)}</td>
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
// Workout Modal
// ============================================

function showWorkoutModal(dayIndex) {
    const training = trainingData[dayIndex];
    if (!training) return;

    const modal = document.getElementById('workoutModal');
    const modalContent = document.getElementById('workoutModalContent');
    if (!modal || !modalContent) return;

    const quote = getMotivationQuote(dayIndex);

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>訓練詳情</h3>
            <button class="modal-close" onclick="closeWorkoutModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="training-info" style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <div class="training-date" style="font-weight: 700;">${formatDate(training.date)}</div>
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
            <div style="margin-bottom: 15px;">
                <strong>距離：</strong> ${training.distance}km
            </div>
            ${training.race ? `<div style="background: #fff3e0; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;"><strong>🏁 比賽：</strong> ${training.race}</div>` : ''}
            ${training.note ? `<div style="color: var(--text-light); font-size: 0.9rem;"><em>備註：${training.note}</em></div>` : ''}
        </div>
        <div class="modal-footer">
            <button class="btn-close" onclick="closeWorkoutModal()">關閉</button>
        </div>
    `;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

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
