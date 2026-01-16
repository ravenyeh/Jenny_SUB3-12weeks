// Daily Motivation Quotes for Training Days
export const motivationQuotes = [
    "今天的汗水，是明天的榮耀！",
    "每一步都在靠近終點線！",
    "馬拉松精神，永不放棄！",
    "痛苦是暫時的，榮耀是永恆的！",
    "相信過程，成就自己！",
    "你比你想像的更強大！",
    "堅持就是勝利！",
    "今天的努力，決定明天的高度！",
    "突破極限，超越自我！",
    "每次訓練都是一次進化！",
    "累了就想想為什麼開始！",
    "慢慢來，比較快！",
    "專注當下，享受過程！",
    "強者不是不會累，而是累了也不放棄！",
    "今天練得苦，比賽才輕鬆！",
    "你的對手只有昨天的自己！",
    "一公里一公里，征服全程！",
    "汗水不會騙人！",
    "訓練是送給自己最好的禮物！",
    "每一次呼吸都是力量！",
    "跑得更遠，跑得更快，跑得更穩！",
    "心有多大，舞台就有多大！",
    "今天的配速，明天的獎牌！",
    "不怕慢，只怕站！",
    "用行動證明一切！",
    "這就是你想要的人生！",
    "挑戰自己，成為傳奇！",
    "訓練日就是成長日！",
    "把疲憊留在訓練場！",
    "你的毅力正在發光！",
    "每一滴汗都是進步的證明！",
    "SUB3不是夢，是練出來的！",
    "享受這趟旅程！",
    "今天的你會感謝現在努力的自己！",
    "穩定輸出，持續進步！",
    "把不可能變成可能！",
    "專注、堅持、突破！",
    "訓練越苦，比賽越甜！",
    "你正在書寫自己的故事！",
    "每個早起都值得！",
    "讓身體適應，讓心靈強大！",
    "距離終點又近了一天！",
    "用汗水澆灌夢想！",
    "這條路你不是一個人！",
    "相信訓練，相信自己！",
    "今天也要全力以赴！",
    "累積里程，累積實力！",
    "你的努力終將綻放！",
    "保持節奏，穩健前行！",
    "每一次訓練都是預演！",
    "心肺在變強，意志在成長！",
    "沒有捷徑，只有堅持！",
    "今天的辛苦是明天的資本！",
    "你選擇了不平凡的路！",
    "用速度追逐夢想！",
    "身體會記住每一次訓練！",
    "向著目標，奮力前進！",
    "越練越強，越來越好！",
    "這就是冠軍的日常！",
    "把壓力轉化為動力！",
    "訓練是最好的投資！",
    "每一天都在變強！",
    "讓努力成為習慣！",
    "你的堅持令人敬佩！",
    "終點線在等著你！",
    "今天也是成為更好自己的一天！",
    "用實力說話！",
    "保持飢渴，保持愚蠢！",
    "訓練的意義在於突破！",
    "你已經比昨天更強了！",
    "SUB3，我來了！",
    "目標馬拉松，等著我！",
    "42.195公里，我準備好了！",
    "每一公里都是勝利！",
    "配速穩定，心態穩定！",
    "長距離是耐力的考驗！",
    "速度訓練讓你更強！",
    "節奏跑塑造比賽配速！",
    "恢復也是訓練的一部分！",
    "相信課表，相信教練！",
    "12週後，見證奇蹟！",
    "每一天都在接近目標！",
    "跑步是最好的冥想！",
    "享受跑步的每一刻！"
];

// Get random motivation quote
export function getMotivationQuote(dayIndex) {
    return motivationQuotes[dayIndex % motivationQuotes.length];
}

// Race date configuration
export const DEFAULT_RACE_DATE = '2025-01-11';

// Get race date from localStorage or use default
export function getRaceDate() {
    return localStorage.getItem('userRaceDate') || DEFAULT_RACE_DATE;
}

// For backward compatibility
export const RACE_DATE = DEFAULT_RACE_DATE;

// Training Schedule Data - 12 Weeks Plan (October 20, 2024 - January 11, 2025)
export const trainingData = [
    // ============ Week 1 - 基礎期 (October 20-26, 2024) ============
    { week: "Week 1", day: "Mon", date: "October 20, 2024", type: "Easy 輕鬆跑", content: "12km easy", intensity: "Z1-2", distance: 12, phase: "基礎期", weeklyTotal: 110 },
    { week: "Week 1", day: "Tue", date: "October 21, 2024", type: "Speed 速度跑", content: "3km WU + 2km CD\n12x800m @ 3:35/km\n(rest 90s, every 4th set rest 3mins)", intensity: "Z5", distance: 14.6, phase: "基礎期", weeklyTotal: 110 },
    { week: "Week 1", day: "Wed", date: "October 22, 2024", type: "Aerobic 有氧跑", content: "21km aerobic", intensity: "Z2-3", distance: 21, phase: "基礎期", weeklyTotal: 110 },
    { week: "Week 1", day: "Thu", date: "October 23, 2024", type: "Tempo 節奏跑", content: "2km WU + 2km CD\n10km tempo @ 4:10/km", intensity: "Z4", distance: 14, phase: "基礎期", weeklyTotal: 110 },
    { week: "Week 1", day: "Fri", date: "October 24, 2024", type: "Easy 輕鬆跑", content: "12km easy", intensity: "Z1-2", distance: 12, phase: "基礎期", weeklyTotal: 110 },
    { week: "Week 1", day: "Sat", date: "October 25, 2024", type: "Easy 輕鬆跑", content: "15km easy", intensity: "Z2", distance: 15, phase: "基礎期", weeklyTotal: 110 },
    { week: "Week 1", day: "Sun", date: "October 26, 2024", type: "Long Run 長距離", content: "10km Z2, 8km Z3, 6km Z4", intensity: "Z2-4", distance: 24, phase: "基礎期", weeklyTotal: 110, note: "Total: 110km" },

    // ============ Week 2 - 基礎期 (October 27 - November 2, 2024) ============
    { week: "Week 2", day: "Mon", date: "October 27, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z1-2", distance: 16, phase: "基礎期", weeklyTotal: 120 },
    { week: "Week 2", day: "Tue", date: "October 28, 2024", type: "Speed 速度跑", content: "2km WU + 2km CD\n9x1.6km @ 4:05/km\n(rest 120s, every 3rd set rest 4mins)", intensity: "Z5", distance: 18.4, phase: "基礎期", weeklyTotal: 120 },
    { week: "Week 2", day: "Wed", date: "October 29, 2024", type: "Aerobic 有氧跑", content: "25km aerobic", intensity: "Z2-3", distance: 25, phase: "基礎期", weeklyTotal: 120 },
    { week: "Week 2", day: "Thu", date: "October 30, 2024", type: "Tempo 節奏跑", content: "2km WU + 2km CD\n3x4km tempo @ 4:20/km (1km float)", intensity: "Z4", distance: 17, phase: "基礎期", weeklyTotal: 120 },
    { week: "Week 2", day: "Fri", date: "October 31, 2024", type: "Easy 輕鬆跑", content: "12km easy", intensity: "Z1-2", distance: 12, phase: "基礎期", weeklyTotal: 120 },
    { week: "Week 2", day: "Sat", date: "November 1, 2024", type: "Easy 輕鬆跑", content: "5km easy + 5x200m strides 衝刺", intensity: "Z2 / all out", distance: 6, phase: "基礎期", weeklyTotal: 120 },
    { week: "Week 2", day: "Sun", date: "November 2, 2024", type: "Race 比賽", content: "2km WU + Garmin 21K", intensity: "Z4", distance: 23, phase: "基礎期", weeklyTotal: 120, note: "Total: 120km", race: "Garmin 21K" },

    // ============ Week 3 - 基礎期 (November 3-9, 2024) ============
    { week: "Week 3", day: "Mon", date: "November 3, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z1-2", distance: 16, phase: "基礎期", weeklyTotal: 130 },
    { week: "Week 3", day: "Tue", date: "November 4, 2024", type: "Threshold 閾值間歇", content: "2km WU + 2km CD\n2x5km @ 4:00/km (2km float)", intensity: "Z4", distance: 18, phase: "基礎期", weeklyTotal: 130 },
    { week: "Week 3", day: "Wed", date: "November 5, 2024", type: "Aerobic 有氧跑", content: "20km aerobic", intensity: "Z2-3", distance: 20, phase: "基礎期", weeklyTotal: 130 },
    { week: "Week 3", day: "Thu", date: "November 6, 2024", type: "Tempo 節奏跑", content: "2km WU + 2km CD\n12km tempo @ 4:10/km", intensity: "Z4", distance: 16, phase: "基礎期", weeklyTotal: 130 },
    { week: "Week 3", day: "Fri", date: "November 7, 2024", type: "Easy 輕鬆跑", content: "18km easy", intensity: "Z1-2", distance: 18, phase: "基礎期", weeklyTotal: 130 },
    { week: "Week 3", day: "Sat", date: "November 8, 2024", type: "Easy 輕鬆跑", content: "14km easy", intensity: "Z2", distance: 14, phase: "基礎期", weeklyTotal: 130 },
    { week: "Week 3", day: "Sun", date: "November 9, 2024", type: "Long Run 長距離", content: "12km Z2, 10km Z3, 8km Z4", intensity: "Z2-4", distance: 30, phase: "基礎期", weeklyTotal: 130, note: "Total: 130km" },

    // ============ Week 4 - 基礎期 Recovery (November 10-16, 2024) ============
    { week: "Week 4", day: "Mon", date: "November 10, 2024", type: "Easy 輕鬆跑", content: "12km easy", intensity: "Z1-2", distance: 12, phase: "基礎期", weeklyTotal: 100, note: "Recovery Week" },
    { week: "Week 4", day: "Tue", date: "November 11, 2024", type: "Speed 速度跑", content: "2km WU, 2km CD\n16x800m @ 3:35/km\n(rest 90s, every 4th set rest 3mins)", intensity: "Z5", distance: 16.8, phase: "基礎期", weeklyTotal: 100 },
    { week: "Week 4", day: "Wed", date: "November 12, 2024", type: "Aerobic 有氧跑", content: "10km aerobic", intensity: "Z2-3", distance: 10, phase: "基礎期", weeklyTotal: 100 },
    { week: "Week 4", day: "Thu", date: "November 13, 2024", type: "Easy 輕鬆跑", content: "18km easy", intensity: "Z1-2", distance: 18, phase: "基礎期", weeklyTotal: 100 },
    { week: "Week 4", day: "Fri", date: "November 14, 2024", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "基礎期", weeklyTotal: 100 },
    { week: "Week 4", day: "Sat", date: "November 15, 2024", type: "Easy 輕鬆跑", content: "13km easy", intensity: "Z2", distance: 13, phase: "基礎期", weeklyTotal: 100 },
    { week: "Week 4", day: "Sun", date: "November 16, 2024", type: "Long Run 長距離", content: "21km easy", intensity: "Z2", distance: 21, phase: "基礎期", weeklyTotal: 100, note: "Total: 100km (Recovery)" },

    // ============ Week 5 - 強化期 (November 17-23, 2024) ============
    { week: "Week 5", day: "Mon", date: "November 17, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z1-2", distance: 16, phase: "強化期", weeklyTotal: 121 },
    { week: "Week 5", day: "Tue", date: "November 18, 2024", type: "Speed 速度跑", content: "10km WU + 2km CD\n12x400m hill sprints", intensity: "Z5", distance: 16.8, phase: "強化期", weeklyTotal: 121 },
    { week: "Week 5", day: "Wed", date: "November 19, 2024", type: "Aerobic 有氧跑", content: "20km aerobic", intensity: "Z2-3", distance: 20, phase: "強化期", weeklyTotal: 121 },
    { week: "Week 5", day: "Thu", date: "November 20, 2024", type: "Tempo 節奏跑", content: "2km WU + 2km CD\n14km tempo @ 4:10/km", intensity: "Z4", distance: 18, phase: "強化期", weeklyTotal: 121 },
    { week: "Week 5", day: "Fri", date: "November 21, 2024", type: "Easy 輕鬆跑", content: "13km easy", intensity: "Z1-2", distance: 13, phase: "強化期", weeklyTotal: 121 },
    { week: "Week 5", day: "Sat", date: "November 22, 2024", type: "Easy 輕鬆跑", content: "15km easy", intensity: "Z2", distance: 15, phase: "強化期", weeklyTotal: 121 },
    { week: "Week 5", day: "Sun", date: "November 23, 2024", type: "Long Run 長距離", content: "22km easy", intensity: "Z2", distance: 22, phase: "強化期", weeklyTotal: 121, note: "Total: 121km" },

    // ============ Week 6 - 強化期 (November 24-30, 2024) ============
    { week: "Week 6", day: "Mon", date: "November 24, 2024", type: "Easy 輕鬆跑", content: "20km easy", intensity: "Z2", distance: 20, phase: "強化期", weeklyTotal: 133 },
    { week: "Week 6", day: "Tue", date: "November 25, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z2", distance: 16, phase: "強化期", weeklyTotal: 133 },
    { week: "Week 6", day: "Wed", date: "November 26, 2024", type: "Aerobic 有氧跑", content: "22km aerobic", intensity: "Z2-3", distance: 22, phase: "強化期", weeklyTotal: 133 },
    { week: "Week 6", day: "Thu", date: "November 27, 2024", type: "Easy 輕鬆跑", content: "14km easy", intensity: "Z1-2", distance: 14, phase: "強化期", weeklyTotal: 133 },
    { week: "Week 6", day: "Fri", date: "November 28, 2024", type: "Easy 輕鬆跑", content: "10km easy + 5x200m strides 衝刺", intensity: "Z1-2", distance: 11, phase: "強化期", weeklyTotal: 133 },
    { week: "Week 6", day: "Sat", date: "November 29, 2024", type: "Race 比賽", content: "2km WU + 3km CD\nRubber Run 10K", intensity: "Z5", distance: 15, phase: "強化期", weeklyTotal: 133, race: "Rubber Run 10K" },
    { week: "Week 6", day: "Sun", date: "November 30, 2024", type: "Long Run 長距離", content: "20km Z2, 10km Z3, 5km Z4", intensity: "Z2-4", distance: 35, phase: "強化期", weeklyTotal: 133, note: "Total: 133km" },

    // ============ Week 7 - 強化期 (December 1-7, 2024) ============
    { week: "Week 7", day: "Mon", date: "December 1, 2024", type: "Easy 輕鬆跑", content: "20km easy", intensity: "Z1-2", distance: 20, phase: "強化期", weeklyTotal: 146 },
    { week: "Week 7", day: "Tue", date: "December 2, 2024", type: "Speed 速度跑", content: "3km WU + 3km CD\n6x2km @ 3:50/km (1km float)", intensity: "Z5", distance: 24, phase: "強化期", weeklyTotal: 146 },
    { week: "Week 7", day: "Wed", date: "December 3, 2024", type: "Aerobic 有氧跑", content: "21km aerobic", intensity: "Z2-3", distance: 21, phase: "強化期", weeklyTotal: 146 },
    { week: "Week 7", day: "Thu", date: "December 4, 2024", type: "Easy + Tempo", content: "18km easy + 6km @ 4:10/km", intensity: "Z2 & 4", distance: 24, phase: "強化期", weeklyTotal: 146 },
    { week: "Week 7", day: "Fri", date: "December 5, 2024", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "強化期", weeklyTotal: 146 },
    { week: "Week 7", day: "Sat", date: "December 6, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z2", distance: 16, phase: "強化期", weeklyTotal: 146 },
    { week: "Week 7", day: "Sun", date: "December 7, 2024", type: "Long Run 長距離", content: "12km Z2, 10km Z3, 10km Z4", intensity: "Z2-4", distance: 32, phase: "強化期", weeklyTotal: 146, note: "Total: 146km" },

    // ============ Week 8 - 強化期 Recovery (December 8-14, 2024) ============
    { week: "Week 8", day: "Mon", date: "December 8, 2024", type: "Easy 輕鬆跑", content: "14km easy", intensity: "Z1-2", distance: 14, phase: "強化期", weeklyTotal: 120, note: "Recovery Week" },
    { week: "Week 8", day: "Tue", date: "December 9, 2024", type: "Speed 速度跑", content: "3km WU + 3km CD\n1-2-3-2-1 float 1km @ 4:00-3:50/km", intensity: "Z4", distance: 15, phase: "強化期", weeklyTotal: 120 },
    { week: "Week 8", day: "Wed", date: "December 10, 2024", type: "Aerobic 有氧跑", content: "20km aerobic", intensity: "Z2-3", distance: 20, phase: "強化期", weeklyTotal: 120 },
    { week: "Week 8", day: "Thu", date: "December 11, 2024", type: "Easy 輕鬆跑", content: "14km easy", intensity: "Z1-2", distance: 14, phase: "強化期", weeklyTotal: 120, note: "圖片中標示 Z4 可能是誤植" },
    { week: "Week 8", day: "Fri", date: "December 12, 2024", type: "Easy 輕鬆跑", content: "10km easy + 5x200m strides 衝刺", intensity: "Z1-2", distance: 11, phase: "強化期", weeklyTotal: 120 },
    { week: "Week 8", day: "Sat", date: "December 13, 2024", type: "Race 比賽", content: "2km WU + 3km CD\nYamaha 10K", intensity: "Z5", distance: 15, phase: "強化期", weeklyTotal: 120, race: "Yamaha 10K" },
    { week: "Week 8", day: "Sun", date: "December 14, 2024", type: "Race 比賽", content: "2km WU + 10km CD\nCIDB 21K", intensity: "Z4", distance: 33, phase: "強化期", weeklyTotal: 120, note: "Total: 120km (Recovery)", race: "CIDB 21K" },

    // ============ Week 9 - 巔峰期 (December 15-21, 2024) ============
    { week: "Week 9", day: "Mon", date: "December 15, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z1-2", distance: 16, phase: "巔峰期", weeklyTotal: 150 },
    { week: "Week 9", day: "Tue", date: "December 16, 2024", type: "MP Intervals", content: "3km WU + 3km CD\n4x3km @ 4:00/km (1km float)", intensity: "Z4", distance: 22, phase: "巔峰期", weeklyTotal: 150, note: "MP = Marathon Pace" },
    { week: "Week 9", day: "Wed", date: "December 17, 2024", type: "Aerobic 有氧跑", content: "21km aerobic", intensity: "Z2-3", distance: 21, phase: "巔峰期", weeklyTotal: 150 },
    { week: "Week 9", day: "Thu", date: "December 18, 2024", type: "Tempo 節奏跑", content: "3km WU + 3km CD\n2x8km @ 4:15/km (2km float)", intensity: "Z4", distance: 24, phase: "巔峰期", weeklyTotal: 150 },
    { week: "Week 9", day: "Fri", date: "December 19, 2024", type: "Easy 輕鬆跑", content: "21km easy", intensity: "Z1-2", distance: 21, phase: "巔峰期", weeklyTotal: 150 },
    { week: "Week 9", day: "Sat", date: "December 20, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z2", distance: 16, phase: "巔峰期", weeklyTotal: 150 },
    { week: "Week 9", day: "Sun", date: "December 21, 2024", type: "Long Run 長距離", content: "32km (last 8km @ MP)", intensity: "Z2-4", distance: 32, phase: "巔峰期", weeklyTotal: 150, note: "Total: 150km" },

    // ============ Week 10 - 巔峰期 (December 22-28, 2024) ============
    { week: "Week 10", day: "Mon", date: "December 22, 2024", type: "Easy 輕鬆跑", content: "16km easy", intensity: "Z1-2", distance: 16, phase: "巔峰期", weeklyTotal: 160 },
    { week: "Week 10", day: "Tue", date: "December 23, 2024", type: "MP Intervals", content: "3km WU + 3km CD\n3x5km @ 4:15/km (1km float)", intensity: "Z4", distance: 23, phase: "巔峰期", weeklyTotal: 160 },
    { week: "Week 10", day: "Wed", date: "December 24, 2024", type: "Aerobic 有氧跑", content: "21km aerobic", intensity: "Z2-3", distance: 21, phase: "巔峰期", weeklyTotal: 160 },
    { week: "Week 10", day: "Thu", date: "December 25, 2024", type: "Speed 速度跑", content: "8km WU + 3km CD\n10x1km @ 3:50/km", intensity: "Z5", distance: 21, phase: "巔峰期", weeklyTotal: 160, holiday: "聖誕節" },
    { week: "Week 10", day: "Fri", date: "December 26, 2024", type: "Easy 輕鬆跑", content: "22km easy", intensity: "Z1-2", distance: 22, phase: "巔峰期", weeklyTotal: 160 },
    { week: "Week 10", day: "Sat", date: "December 27, 2024", type: "Easy 輕鬆跑", content: "22km easy", intensity: "Z2", distance: 22, phase: "巔峰期", weeklyTotal: 160 },
    { week: "Week 10", day: "Sun", date: "December 28, 2024", type: "Long Run 長距離", content: "35km (last 10km @ MP)", intensity: "Z2-4", distance: 35, phase: "巔峰期", weeklyTotal: 160, note: "Total: 160km" },

    // ============ Week 11 - 減量期 Taper (December 29 - January 4, 2025) ============
    { week: "Week 11", day: "Mon", date: "December 29, 2024", type: "Easy 輕鬆跑", content: "12km easy", intensity: "Z1-2", distance: 12, phase: "減量期", weeklyTotal: 105, note: "Taper Week 1" },
    { week: "Week 11", day: "Tue", date: "December 30, 2024", type: "MP Intervals", content: "2km WU + 2km CD\n4x4km @ 4:00/km (1km float)", intensity: "Z4", distance: 24, phase: "減量期", weeklyTotal: 105 },
    { week: "Week 11", day: "Wed", date: "December 31, 2024", type: "Aerobic 有氧跑", content: "15km aerobic", intensity: "Z2-3", distance: 15, phase: "減量期", weeklyTotal: 105, holiday: "跨年夜" },
    { week: "Week 11", day: "Thu", date: "January 1, 2025", type: "Easy 輕鬆跑", content: "15km easy + 5x200m strides 衝刺", intensity: "Z1-2", distance: 16, phase: "減量期", weeklyTotal: 105, holiday: "元旦" },
    { week: "Week 11", day: "Fri", date: "January 2, 2025", type: "Easy 輕鬆跑", content: "12km easy", intensity: "Z1-2", distance: 12, phase: "減量期", weeklyTotal: 105 },
    { week: "Week 11", day: "Sat", date: "January 3, 2025", type: "Easy 輕鬆跑", content: "14km easy", intensity: "Z2", distance: 14, phase: "減量期", weeklyTotal: 105 },
    { week: "Week 11", day: "Sun", date: "January 4, 2025", type: "Tempo 節奏跑", content: "2km WU + 2km CD\n2x5km @ 4:05/km (1km float)", intensity: "Z2-4", distance: 15, phase: "減量期", weeklyTotal: 105, note: "Total: 105km (Taper)" },

    // ============ Week 12 - 賽前週 Race Week (January 5-11, 2025) ============
    { week: "Week 12", day: "Mon", date: "January 5, 2025", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "減量期", weeklyTotal: 100, note: "Race Week" },
    { week: "Week 12", day: "Tue", date: "January 6, 2025", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "減量期", weeklyTotal: 100 },
    { week: "Week 12", day: "Wed", date: "January 7, 2025", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "減量期", weeklyTotal: 100 },
    { week: "Week 12", day: "Thu", date: "January 8, 2025", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "減量期", weeklyTotal: 100 },
    { week: "Week 12", day: "Fri", date: "January 9, 2025", type: "Easy 輕鬆跑", content: "10km easy", intensity: "Z1-2", distance: 10, phase: "減量期", weeklyTotal: 100 },
    { week: "Week 12", day: "Sat", date: "January 10, 2025", type: "Shakeout", content: "6km easy + 5x200m strides 衝刺", intensity: "Z1-2", distance: 7, phase: "減量期", weeklyTotal: 100, note: "Race Eve" },
    { week: "Week 12", day: "Sun", date: "January 11, 2025", type: "Race Day", content: "Marathon of My Goal\n@ ~4:15/km", intensity: "Z4", distance: 42.195, phase: "減量期", weeklyTotal: 100, note: "Total: 100km ('A' Race)", race: "目標馬拉松", isRaceDay: true }
];

// Weekly summary data for chart
export const weeklySummary = [
    { week: 1, phase: "基礎期", total: 110 },
    { week: 2, phase: "基礎期", total: 120 },
    { week: 3, phase: "基礎期", total: 130 },
    { week: 4, phase: "基礎期", total: 100 },
    { week: 5, phase: "強化期", total: 121 },
    { week: 6, phase: "強化期", total: 133 },
    { week: 7, phase: "強化期", total: 146 },
    { week: 8, phase: "強化期", total: 120 },
    { week: 9, phase: "巔峰期", total: 150 },
    { week: 10, phase: "巔峰期", total: 160 },
    { week: 11, phase: "減量期", total: 105 },
    { week: 12, phase: "減量期", total: 100 }
];

// Export total distance
export const totalDistance = trainingData.reduce((sum, day) => sum + (day.distance || 0), 0);
