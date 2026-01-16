// ===========================================
// Garmin Workout Builder for Running
// ===========================================

import {
    TRAINING_PARAMS,
    RUN_PACE_ZONES,
    getRunPaceTarget,
    getRunPaceFromSeconds,
    getPaceFromIntensity,
    parseRunPaceFromContent,
    parseIntervalFromContent,
    parseTempoFromContent,
    parseEasyPlusTempoFromContent,
    parseLongRunProgression,
    calculateDuration,
    formatSecondsToPace
} from './paceZones.js';

let stepIdCounter = 1;

// Helper to get display name for training zones
function getZoneDisplayName(zone) {
    const names = {
        'Z1': '輕鬆跑',
        'Z2': '輕鬆跑',
        'Z3': '有氧跑',
        'Z4': '節奏跑',
        'Z5': '速度跑',
        'MP': '馬拉松配速'
    };
    return names[zone] || zone;
}

export function resetStepIdCounter() {
    stepIdCounter = 1;
}

// Format a workout step with required Garmin API fields
export function formatStep(step) {
    const isRepeatGroup = step.stepType?.stepTypeKey === 'repeat' && step.workoutSteps;

    const formatted = {
        type: isRepeatGroup ? 'RepeatGroupDTO' : 'ExecutableStepDTO',
        stepId: stepIdCounter++,
        stepOrder: step.stepOrder || 1,
        childStepId: null,
        stepType: step.stepType || { stepTypeId: 3, stepTypeKey: 'interval' },
        endCondition: step.endCondition,
        targetType: step.targetType || { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' }
    };

    if (step.endConditionValue !== undefined) {
        formatted.endConditionValue = step.endConditionValue;
    }
    if (step.targetValueOne !== undefined) {
        formatted.targetValueOne = step.targetValueOne;
    }
    if (step.targetValueTwo !== undefined) {
        formatted.targetValueTwo = step.targetValueTwo;
    }
    if (step.description) {
        formatted.description = step.description;
    }

    // Handle repeat groups
    if (isRepeatGroup) {
        formatted.numberOfIterations = step.numberOfIterations || 2;
        formatted.workoutSteps = step.workoutSteps.map(s => formatStep(s));
        delete formatted.endCondition;
        delete formatted.targetType;
    }

    return formatted;
}

// Generate easy run workout
export function generateEasyRunSteps(totalDistance, content, intensity) {
    const steps = [];
    let stepOrder = 1;

    const hasStrides = content.includes('strides') || content.includes('衝刺');
    const paceTarget = getPaceFromIntensity(intensity);

    if (hasStrides) {
        // Main easy portion
        const mainDistance = totalDistance - 1000; // Reserve 1km for strides
        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 1, stepTypeKey: 'warmup' },
            endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
            endConditionValue: mainDistance,
            ...paceTarget
        });

        // Strides - 5x200m
        const strideMatch = content.match(/(\d+)\s*[xX×]\s*(\d+)\s*m\s*strides/i);
        const strideReps = strideMatch ? parseInt(strideMatch[1]) : 5;
        const strideDistance = strideMatch ? parseInt(strideMatch[2]) : 200;

        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 6, stepTypeKey: 'repeat' },
            numberOfIterations: strideReps,
            workoutSteps: [
                {
                    stepOrder: 1,
                    stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                    endConditionValue: strideDistance,
                    ...getRunPaceTarget('REP'),
                    description: 'Stride - 快跑'
                },
                {
                    stepOrder: 2,
                    stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                    endConditionValue: strideDistance,
                    ...getRunPaceTarget('RECOVERY'),
                    description: '恢復慢跑'
                }
            ]
        });
    } else {
        // Simple easy run
        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
            endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
            endConditionValue: totalDistance,
            ...paceTarget
        });
    }

    return steps;
}

// Generate interval/speed workout
export function generateIntervalSteps(totalDistance, content) {
    const steps = [];
    let stepOrder = 1;

    const intervalData = parseIntervalFromContent(content);
    if (!intervalData) {
        // Fallback to simple run
        return generateEasyRunSteps(totalDistance, content, 'Z2-3');
    }

    // Parse warmup/cooldown
    const warmupMatch = content.match(/(\d+)\s*km\s*WU/i);
    const cooldownMatch = content.match(/(\d+)\s*km\s*CD/i);
    const warmupDistance = warmupMatch ? parseInt(warmupMatch[1]) * 1000 : 2000;
    const cooldownDistance = cooldownMatch ? parseInt(cooldownMatch[1]) * 1000 : 2000;

    // Warmup
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 1, stepTypeKey: 'warmup' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: warmupDistance,
        ...getRunPaceTarget('EASY'),
        description: '熱身'
    });

    // Main intervals
    const { reps, distance, pace, restSeconds, extendedRest } = intervalData;

    if (extendedRest) {
        // Complex intervals with extended rest every nth set
        const groupSize = extendedRest.every;
        const fullGroups = Math.floor(reps / groupSize);
        const remainingReps = reps % groupSize;

        for (let g = 0; g < fullGroups; g++) {
            steps.push({
                stepOrder: stepOrder++,
                stepType: { stepTypeId: 6, stepTypeKey: 'repeat' },
                numberOfIterations: groupSize,
                workoutSteps: [
                    {
                        stepOrder: 1,
                        stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                        endConditionValue: distance,
                        ...(pace ? pace.target : getRunPaceTarget('SPEED')),
                        description: `間歇 ${distance}m`
                    },
                    {
                        stepOrder: 2,
                        stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                        endCondition: { conditionTypeId: 2, conditionTypeKey: 'time' },
                        endConditionValue: restSeconds,
                        targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
                        description: `休息 ${restSeconds}s`
                    }
                ]
            });

            // Extended rest between groups (except after last full group if no remaining)
            if (g < fullGroups - 1 || remainingReps > 0) {
                steps.push({
                    stepOrder: stepOrder++,
                    stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                    endCondition: { conditionTypeId: 2, conditionTypeKey: 'time' },
                    endConditionValue: extendedRest.restMinutes * 60,
                    targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
                    description: `長休息 ${extendedRest.restMinutes}min`
                });
            }
        }

        // Remaining reps
        if (remainingReps > 0) {
            steps.push({
                stepOrder: stepOrder++,
                stepType: { stepTypeId: 6, stepTypeKey: 'repeat' },
                numberOfIterations: remainingReps,
                workoutSteps: [
                    {
                        stepOrder: 1,
                        stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                        endConditionValue: distance,
                        ...(pace ? pace.target : getRunPaceTarget('SPEED')),
                        description: `間歇 ${distance}m`
                    },
                    {
                        stepOrder: 2,
                        stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                        endCondition: { conditionTypeId: 2, conditionTypeKey: 'time' },
                        endConditionValue: restSeconds,
                        targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
                        description: `休息 ${restSeconds}s`
                    }
                ]
            });
        }
    } else {
        // Simple intervals
        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 6, stepTypeKey: 'repeat' },
            numberOfIterations: reps,
            workoutSteps: [
                {
                    stepOrder: 1,
                    stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                    endConditionValue: distance,
                    ...(pace ? pace.target : getRunPaceTarget('SPEED')),
                    description: `間歇 ${distance}m`
                },
                {
                    stepOrder: 2,
                    stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                    endCondition: { conditionTypeId: 2, conditionTypeKey: 'time' },
                    endConditionValue: restSeconds,
                    targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
                    description: `休息 ${restSeconds}s`
                }
            ]
        });
    }

    // Cooldown
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 2, stepTypeKey: 'cooldown' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: cooldownDistance,
        ...getRunPaceTarget('EASY'),
        description: '緩和'
    });

    return steps;
}

// Generate tempo workout
export function generateTempoSteps(totalDistance, content) {
    const steps = [];
    let stepOrder = 1;

    const tempoData = parseTempoFromContent(content);
    if (!tempoData) {
        return generateEasyRunSteps(totalDistance, content, 'Z4');
    }

    // Warmup
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 1, stepTypeKey: 'warmup' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: tempoData.warmupDistance,
        ...getRunPaceTarget('EASY'),
        description: '熱身'
    });

    if (tempoData.isPyramid) {
        // Pyramid float workout (e.g., 1-2-3-2-1 float)
        const segments = tempoData.pyramidSegments;
        const paceStr = `${formatSecondsToPace(tempoData.paceSecondsHigh)}-${formatSecondsToPace(tempoData.paceSecondsLow)}/km`;

        segments.forEach((km, index) => {
            // Tempo segment
            steps.push({
                stepOrder: stepOrder++,
                stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                endConditionValue: km * 1000,
                ...tempoData.target,
                description: `${km}km @ ${paceStr}`
            });

            // Float recovery (except after last segment)
            if (index < segments.length - 1) {
                steps.push({
                    stepOrder: stepOrder++,
                    stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                    endConditionValue: tempoData.floatDistance,
                    ...getRunPaceTarget('EASY'),
                    description: 'Float 恢復'
                });
            }
        });
    } else if (tempoData.isRepeated) {
        // Repeated tempo blocks with float recovery
        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 6, stepTypeKey: 'repeat' },
            numberOfIterations: tempoData.reps,
            workoutSteps: [
                {
                    stepOrder: 1,
                    stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                    endConditionValue: tempoData.blockDistance,
                    ...tempoData.target,
                    description: `節奏跑 @ ${formatSecondsToPace(tempoData.paceSeconds)}/km`
                },
                {
                    stepOrder: 2,
                    stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                    endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                    endConditionValue: tempoData.floatDistance,
                    ...getRunPaceTarget('EASY'),
                    description: 'Float 恢復'
                }
            ]
        });
    } else {
        // Single tempo block
        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
            endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
            endConditionValue: tempoData.tempoDistance,
            ...tempoData.target,
            description: `節奏跑 @ ${formatSecondsToPace(tempoData.paceSeconds)}/km`
        });
    }

    // Cooldown
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 2, stepTypeKey: 'cooldown' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: tempoData.cooldownDistance,
        ...getRunPaceTarget('EASY'),
        description: '緩和'
    });

    return steps;
}

// Generate easy + tempo finish workout
// e.g., "18km easy + 6km @ 4:10/km"
export function generateEasyPlusTempoSteps(totalDistance, content) {
    const steps = [];
    let stepOrder = 1;

    const data = parseEasyPlusTempoFromContent(content);
    if (!data) {
        return generateEasyRunSteps(totalDistance, content, 'Z2');
    }

    // Easy portion
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: data.easyDistance,
        ...getRunPaceTarget('EASY'),
        description: `輕鬆跑 ${data.easyDistance / 1000}km`
    });

    // Tempo finish
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: data.tempoDistance,
        ...data.target,
        description: `節奏跑 ${data.tempoDistance / 1000}km @ ${formatSecondsToPace(data.paceSeconds)}/km`
    });

    return steps;
}

// Generate long run workout
export function generateLongRunSteps(totalDistance, content) {
    const steps = [];
    let stepOrder = 1;

    const progression = parseLongRunProgression(content);

    if (progression && progression.length > 0) {
        // Progression long run - all segments are 'interval' type with descriptive labels
        progression.forEach((segment, index) => {
            const zoneName = getZoneDisplayName(segment.zone);
            steps.push({
                stepOrder: stepOrder++,
                stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                endConditionValue: segment.distance,
                ...segment.paceTarget,
                description: `${zoneName} ${segment.distance / 1000}km`
            });
        });
    } else {
        // Simple long run
        steps.push({
            stepOrder: stepOrder++,
            stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
            endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
            endConditionValue: totalDistance,
            ...getRunPaceTarget('LONG_RUN'),
            description: `長距離 ${totalDistance / 1000}km`
        });
    }

    return steps;
}

// Generate aerobic run workout
export function generateAerobicSteps(totalDistance, content) {
    const steps = [];

    steps.push({
        stepOrder: 1,
        stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: totalDistance,
        ...getRunPaceTarget('AEROBIC'),
        description: '有氧跑'
    });

    return steps;
}

// Generate hill sprint workout
export function generateHillSprintSteps(totalDistance, content) {
    const steps = [];
    let stepOrder = 1;

    // Parse warmup
    const warmupMatch = content.match(/(\d+)\s*km\s*WU/i);
    const warmupDistance = warmupMatch ? parseInt(warmupMatch[1]) * 1000 : 3000;

    // Parse cooldown
    const cooldownMatch = content.match(/(\d+)\s*km\s*CD/i);
    const cooldownDistance = cooldownMatch ? parseInt(cooldownMatch[1]) * 1000 : 2000;

    // Parse hill reps
    const hillMatch = content.match(/(\d+)\s*[xX×]\s*(\d+)\s*m\s*hill/i);
    const reps = hillMatch ? parseInt(hillMatch[1]) : 12;
    const hillDistance = hillMatch ? parseInt(hillMatch[2]) : 400;

    // Warmup
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 1, stepTypeKey: 'warmup' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: warmupDistance,
        ...getRunPaceTarget('EASY'),
        description: '熱身'
    });

    // Hill sprints
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 6, stepTypeKey: 'repeat' },
        numberOfIterations: reps,
        workoutSteps: [
            {
                stepOrder: 1,
                stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
                endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                endConditionValue: hillDistance,
                ...getRunPaceTarget('REP'),
                description: '上坡衝刺'
            },
            {
                stepOrder: 2,
                stepType: { stepTypeId: 4, stepTypeKey: 'recovery' },
                endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
                endConditionValue: hillDistance,
                ...getRunPaceTarget('RECOVERY'),
                description: '下坡恢復'
            }
        ]
    });

    // Cooldown
    steps.push({
        stepOrder: stepOrder++,
        stepType: { stepTypeId: 2, stepTypeKey: 'cooldown' },
        endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
        endConditionValue: cooldownDistance,
        ...getRunPaceTarget('EASY'),
        description: '緩和'
    });

    return steps;
}

// Main function to convert training day to Garmin workout
export function convertToGarminWorkout(training, dayIndex, overrideDate = null) {
    if (!training || !training.distance) return [];

    resetStepIdCounter();

    const totalDistance = training.distance * 1000; // Convert km to meters
    const content = training.content;
    const type = training.type;

    let steps = [];

    // Check for special content patterns first
    const hasEasyPlusTempo = /\d+\s*km\s*easy\s*\+\s*\d+\s*km\s*@/.test(content);
    const hasPyramidFloat = /\d+(?:-\d+)+\s*float/.test(content);

    // Determine workout type and generate appropriate steps
    if (hasEasyPlusTempo) {
        // Easy + tempo finish workout (e.g., "18km easy + 6km @ 4:10/km")
        steps = generateEasyPlusTempoSteps(totalDistance, content);
    } else if (hasPyramidFloat) {
        // Pyramid float workout (e.g., "1-2-3-2-1 float 1km @ 4:00-3:50/km")
        steps = generateTempoSteps(totalDistance, content);
    } else if (type.includes('Speed') || type.includes('速度')) {
        if (content.includes('hill')) {
            steps = generateHillSprintSteps(totalDistance, content);
        } else {
            steps = generateIntervalSteps(totalDistance, content);
        }
    } else if (type.includes('Tempo') || type.includes('節奏') || type.includes('Threshold') || type.includes('閾值') || type.includes('MP Intervals')) {
        steps = generateTempoSteps(totalDistance, content);
    } else if (type.includes('Long Run') || type.includes('長距離')) {
        steps = generateLongRunSteps(totalDistance, content);
    } else if (type.includes('Aerobic') || type.includes('有氧')) {
        steps = generateAerobicSteps(totalDistance, content);
    } else if (type.includes('Easy') || type.includes('輕鬆') || type.includes('Shakeout')) {
        steps = generateEasyRunSteps(totalDistance, content, training.intensity);
    } else if (type.includes('Race')) {
        // Race day - simple structure
        steps = [{
            stepOrder: 1,
            stepType: { stepTypeId: 3, stepTypeKey: 'interval' },
            endCondition: { conditionTypeId: 3, conditionTypeKey: 'distance' },
            endConditionValue: totalDistance,
            ...getRunPaceTarget('MARATHON'),
            description: training.race || '比賽'
        }];
    } else {
        // Default to easy run
        steps = generateEasyRunSteps(totalDistance, content, training.intensity);
    }

    // Format steps for Garmin API
    const formattedSteps = steps.map(step => formatStep(step));

    // Calculate estimated duration
    const avgPaceSeconds = TRAINING_PARAMS.MARATHON_PACE_SEC * 1.1;
    const estimatedDuration = calculateDuration(totalDistance, avgPaceSeconds);

    // Build workout object
    const workoutDate = overrideDate || training.date;
    const dateObj = new Date(workoutDate);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

    const workout = {
        sportType: { sportTypeId: 1, sportTypeKey: 'running' },
        subSportType: null,
        workoutName: `${training.week} ${training.day} - ${type}`,
        description: `${dateStr} | ${content.replace(/\n/g, ' | ')}`,
        estimatedDistanceInMeters: totalDistance,
        estimatedDurationInSecs: estimatedDuration,
        workoutSegments: [{
            segmentOrder: 1,
            sportType: { sportTypeId: 1, sportTypeKey: 'running' },
            workoutSteps: formattedSteps
        }]
    };

    return [{
        type: 'run',
        data: workout
    }];
}

// Export workout as JSON file
export function downloadWorkoutJson(workout, filename) {
    const blob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
