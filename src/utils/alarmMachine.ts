export const AlarmMachineStates = {
  NoAlarm: 'no-alarm',
  AlarmSoundOn: 'alarm-sound-on',
  AlarmSoundMuted: 'alarm-sound-muted',
} as const

export type AlarmMachineState = (typeof AlarmMachineStates)[keyof typeof AlarmMachineStates]

export const AlarmIndicatorStates = {
  Off: 'off',
  SolidBlue: 'solid-blue',
  BlinkingBlue: 'blinking-blue',
} as const

export type AlarmIndicatorState = (typeof AlarmIndicatorStates)[keyof typeof AlarmIndicatorStates]

export function syncAlarmMachineState(
  currentState: AlarmMachineState,
  alarmActive: boolean,
): AlarmMachineState {
  if (!alarmActive) {
    return AlarmMachineStates.NoAlarm
  }

  if (currentState === AlarmMachineStates.NoAlarm) {
    return AlarmMachineStates.AlarmSoundOn
  }

  return currentState
}

export function toggleAlarmSoundState(currentState: AlarmMachineState): AlarmMachineState {
  if (currentState === AlarmMachineStates.AlarmSoundOn) {
    return AlarmMachineStates.AlarmSoundMuted
  }

  if (currentState === AlarmMachineStates.AlarmSoundMuted) {
    return AlarmMachineStates.AlarmSoundOn
  }

  return AlarmMachineStates.NoAlarm
}

export function isAlarmActive(state: AlarmMachineState): boolean {
  return state !== AlarmMachineStates.NoAlarm
}

export function isSoundSignalOn(state: AlarmMachineState): boolean {
  return state === AlarmMachineStates.AlarmSoundOn
}

export function isAlarmButtonPressAvailable(state: AlarmMachineState): boolean {
  return isAlarmActive(state)
}

export function getAlarmIndicatorState(state: AlarmMachineState): AlarmIndicatorState {
  if (state === AlarmMachineStates.AlarmSoundOn) {
    return AlarmIndicatorStates.SolidBlue
  }

  if (state === AlarmMachineStates.AlarmSoundMuted) {
    return AlarmIndicatorStates.BlinkingBlue
  }

  return AlarmIndicatorStates.Off
}
