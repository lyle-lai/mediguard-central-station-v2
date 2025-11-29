import { Parameter, AlarmThresholdItem, AlarmCategory, AlarmPriority } from '../types';

// --- RULE ENGINE ---
export const checkAlarmRules = (params: Parameter[], thresholds: AlarmThresholdItem[], violations: Record<string, number>): {
    activeAlarm?: { message: string, category: AlarmCategory, priority: AlarmPriority },
    newViolations: Record<string, number>,
    triggeredParams: string[]
} => {
    const newViolations = { ...violations };
    const triggeredParams: string[] = [];
    let highestPriorityAlarm: { message: string, category: AlarmCategory, priority: AlarmPriority } | undefined = undefined;

    const isHigherPriority = (a: AlarmPriority, b: AlarmPriority) => {
        if (a === AlarmPriority.CRITICAL) return true;
        if (a === AlarmPriority.WARNING && b === AlarmPriority.NORMAL) return true;
        return false;
    };

    thresholds.forEach(rule => {
        if (!rule.enabled) return;

        const param = params.find(p => p.id === rule.paramId);
        if (!param || typeof param.value !== 'number') {
            newViolations[rule.paramId] = 0;
            return;
        }

        const val = param.value;
        let violating = false;
        let msg = '';

        if (rule.max !== undefined && rule.max !== null && val > rule.max) {
            violating = true;
            msg = `${rule.label} 过高 (${val} > ${rule.max})`;
        } else if (rule.min !== undefined && rule.min !== null && val < rule.min) {
            violating = true;
            msg = `${rule.label} 过低 (${val} < ${rule.min})`;
        }

        if (violating) {
            newViolations[rule.paramId] = (newViolations[rule.paramId] || 0) + 0.1;

            if (newViolations[rule.paramId] >= rule.delay) {
                triggeredParams.push(rule.paramId);
                if (!highestPriorityAlarm || isHigherPriority(rule.priority, highestPriorityAlarm.priority)) {
                    highestPriorityAlarm = {
                        message: msg,
                        category: AlarmCategory.PHYSIOLOGICAL,
                        priority: rule.priority
                    };
                }
            }
        } else {
            newViolations[rule.paramId] = 0;
        }
    });

    return { activeAlarm: highestPriorityAlarm, newViolations, triggeredParams };
};