// ===========================================
// Running Pace Zone Calculator
// ===========================================

// Helper to parse pace string "M:SS" to seconds
export function parsePaceToSeconds(paceStr) {
    if (!paceStr) return null;
    const parts = paceStr.split(':');
    if (parts.length !== 2) return null;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Helper to format seconds to pace string "M:SS"
export function formatSecondsToPace(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get training params from localStorage or use defaults
export function getTrainingParams() {
    const storedMarathonPace = localStorage.getItem('userMarathonPace');

    return {
        // Default: 4:15/km for SUB3 marathon
        MARATHON_PACE_SEC: storedMarathonPace ? parsePaceToSeconds(storedMarathonPace) : 255
    };
}

// Dynamic TRAINING_PARAMS that reads from localStorage
export const TRAINING_PARAMS = getTrainingParams();

// Run Pace Zones (based on Marathon Pace)
// These multipliers adjust the pace relative to marathon pace
export const RUN_PACE_ZONES = {
    RECOVERY: { multiplier: 1.30, name: '恢復跑', description: 'Z1 Recovery' },
    EASY: { multiplier: 1.18, name: '輕鬆跑', description: 'Z1-2 Easy' },
    AEROBIC: { multiplier: 1.10, name: '有氧跑', description: 'Z2-3 Aerobic' },
    LONG_RUN: { multiplier: 1.08, name: '長距離', description: 'Z2 Long Run' },
    MARATHON: { multiplier: 1.00, name: '馬拉松配速', description: 'Z4 Marathon Pace' },
    TEMPO: { multiplier: 0.98, name: '節奏跑', description: 'Z4 Tempo' },
    THRESHOLD: { multiplier: 0.94, name: '閾值', description: 'Z4 Threshold' },
    INTERVAL: { multiplier: 0.90, name: '間歇', description: 'Z5 Interval' },
    SPEED: { multiplier: 0.85, name: '速度跑', description: 'Z5 Speed' },
    REP: { multiplier: 0.82, name: '反覆跑', description: 'Z5 Repetition' }
};

// Zone to intensity mapping
export const INTENSITY_TO_ZONE = {
    'Z1': 'RECOVERY',
    'Z1-2': 'EASY',
    'Z2': 'LONG_RUN',
    'Z2-3': 'AEROBIC',
    'Z3': 'AEROBIC',
    'Z4': 'TEMPO',
    'Z5': 'SPEED',
    'Z2-4': 'MARATHON',
    'Z2 / all out': 'EASY'
};

// ===========================================
// Pace Calculation Helpers
// ===========================================

// Convert run pace (seconds/km) to speed (m/s) for Garmin API
export function runPaceToSpeed(paceSecondsPerKm) {
    return 1000 / paceSecondsPerKm;
}

// Get run pace target object for Garmin API
// Uses pace.zone (workoutTargetTypeId: 6) to display as min/km
export function getRunPaceTarget(zone) {
    const zoneData = RUN_PACE_ZONES[zone] || RUN_PACE_ZONES.EASY;
    const paceSeconds = TRAINING_PARAMS.MARATHON_PACE_SEC * zoneData.multiplier;
    const fastPace = paceSeconds * 0.97;
    const slowPace = paceSeconds * 1.03;
    return {
        targetType: { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' },
        targetValueOne: runPaceToSpeed(slowPace),
        targetValueTwo: runPaceToSpeed(fastPace)
    };
}

// Get run pace target from specific pace in seconds
export function getRunPaceFromSeconds(paceSeconds, variancePercent = 3) {
    const fastPace = paceSeconds * (1 - variancePercent / 100);
    const slowPace = paceSeconds * (1 + variancePercent / 100);
    return {
        targetType: { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' },
        targetValueOne: runPaceToSpeed(slowPace),
        targetValueTwo: runPaceToSpeed(fastPace)
    };
}

// Get pace from intensity zone string
export function getPaceFromIntensity(intensity) {
    const zone = INTENSITY_TO_ZONE[intensity] || 'EASY';
    return getRunPaceTarget(zone);
}

// Parse pace from content like "@ 4:10/km"
export function parseRunPaceFromContent(content) {
    const paceMatch = content.match(/@\s*(\d+):(\d+)\/km/);
    if (paceMatch) {
        const paceSeconds = parseInt(paceMatch[1]) * 60 + parseInt(paceMatch[2]);
        return {
            paceSeconds,
            target: getRunPaceFromSeconds(paceSeconds)
        };
    }
    return null;
}

// Parse interval details from content
// e.g., "12x800m @ 3:35/km (rest 90s, every 4th set rest 3mins)"
export function parseIntervalFromContent(content) {
    // Match patterns like "12x800m", "9x1.6km", "6x2km"
    const intervalMatch = content.match(/(\d+)\s*[xX×]\s*([\d.]+)\s*(m|km)/i);
    if (!intervalMatch) return null;

    const reps = parseInt(intervalMatch[1]);
    let distance = parseFloat(intervalMatch[2]);
    const unit = intervalMatch[3].toLowerCase();

    // Convert to meters
    if (unit === 'km') {
        distance = distance * 1000;
    }

    // Parse pace
    const paceData = parseRunPaceFromContent(content);

    // Parse rest time
    let restSeconds = 90; // default
    const restMatch = content.match(/rest\s*(\d+)\s*s/i);
    if (restMatch) {
        restSeconds = parseInt(restMatch[1]);
    }

    // Parse extended rest (every nth set)
    let extendedRest = null;
    const extendedMatch = content.match(/every\s*(\d+)(?:st|nd|rd|th)\s*set\s*rest\s*(\d+)\s*min/i);
    if (extendedMatch) {
        extendedRest = {
            every: parseInt(extendedMatch[1]),
            restMinutes: parseInt(extendedMatch[2])
        };
    }

    return {
        reps,
        distance,
        pace: paceData,
        restSeconds,
        extendedRest
    };
}

// Parse tempo workout details
// e.g., "2km WU + 2km CD\n10km tempo @ 4:10/km"
export function parseTempoFromContent(content) {
    // Parse warmup
    const warmupMatch = content.match(/(\d+)\s*km\s*WU/i);
    const warmupKm = warmupMatch ? parseInt(warmupMatch[1]) : 2;

    // Parse cooldown
    const cooldownMatch = content.match(/(\d+)\s*km\s*CD/i);
    const cooldownKm = cooldownMatch ? parseInt(cooldownMatch[1]) : 2;

    // Parse main tempo distance and pace
    const tempoMatch = content.match(/(\d+)\s*km\s*tempo\s*@\s*(\d+):(\d+)\/km/i);
    if (tempoMatch) {
        const tempoKm = parseInt(tempoMatch[1]);
        const paceSeconds = parseInt(tempoMatch[2]) * 60 + parseInt(tempoMatch[3]);
        return {
            warmupDistance: warmupKm * 1000,
            tempoDistance: tempoKm * 1000,
            cooldownDistance: cooldownKm * 1000,
            paceSeconds,
            target: getRunPaceFromSeconds(paceSeconds)
        };
    }

    // Parse repeated tempo blocks
    // e.g., "3x4km tempo @ 4:20/km (1km float)"
    const repeatedTempoMatch = content.match(/(\d+)\s*[xX×]\s*(\d+)\s*km.*@\s*(\d+):(\d+)\/km.*\((\d+)\s*km\s*float\)/i);
    if (repeatedTempoMatch) {
        const reps = parseInt(repeatedTempoMatch[1]);
        const blockKm = parseInt(repeatedTempoMatch[2]);
        const paceSeconds = parseInt(repeatedTempoMatch[3]) * 60 + parseInt(repeatedTempoMatch[4]);
        const floatKm = parseInt(repeatedTempoMatch[5]);
        return {
            warmupDistance: warmupKm * 1000,
            cooldownDistance: cooldownKm * 1000,
            reps,
            blockDistance: blockKm * 1000,
            floatDistance: floatKm * 1000,
            paceSeconds,
            target: getRunPaceFromSeconds(paceSeconds),
            isRepeated: true
        };
    }

    return null;
}

// Parse long run with progression
// e.g., "10km Z2, 8km Z3, 6km Z4"
export function parseLongRunProgression(content) {
    const segments = [];
    const pattern = /(\d+)\s*km\s*(Z\d(?:-\d)?)/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
        const distance = parseInt(match[1]) * 1000;
        const zone = match[2];
        const paceZone = INTENSITY_TO_ZONE[zone] || 'LONG_RUN';
        segments.push({
            distance,
            zone,
            paceTarget: getRunPaceTarget(paceZone)
        });
    }

    // Check for MP finish
    // e.g., "32km (last 8km @ MP)"
    const mpMatch = content.match(/last\s*(\d+)\s*km\s*@\s*MP/i);
    if (mpMatch && segments.length === 0) {
        const mpDistance = parseInt(mpMatch[1]) * 1000;
        const totalMatch = content.match(/^(\d+)\s*km/);
        if (totalMatch) {
            const totalDistance = parseInt(totalMatch[1]) * 1000;
            const easyDistance = totalDistance - mpDistance;
            segments.push({
                distance: easyDistance,
                zone: 'Z2',
                paceTarget: getRunPaceTarget('LONG_RUN')
            });
            segments.push({
                distance: mpDistance,
                zone: 'MP',
                paceTarget: getRunPaceTarget('MARATHON')
            });
        }
    }

    return segments.length > 0 ? segments : null;
}

// Calculate estimated duration based on distance and pace
export function calculateDuration(distanceMeters, paceSecondsPerKm) {
    return Math.round((distanceMeters / 1000) * paceSecondsPerKm);
}

// Export default marathon pace for display
export function getDefaultMarathonPace() {
    return formatSecondsToPace(TRAINING_PARAMS.MARATHON_PACE_SEC);
}
