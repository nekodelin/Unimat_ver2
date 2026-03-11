import { create } from 'zustand'
import { DEFAULT_SELECTED_MODULE_ZONE_ID } from '../data/zones'
import type { AppTab, DataSnapshot, ScenarioId } from '../types/app'
import {
  AlarmMachineStates,
  type AlarmMachineState,
  syncAlarmMachineState,
  toggleAlarmSoundState,
} from '../utils/alarmMachine'

interface AppStoreState {
  activeTab: AppTab
  scenarioId: ScenarioId
  decodedChannels: DataSnapshot['decodedChannels']
  channels: DataSnapshot['channels']
  journalEntries: DataSnapshot['journalEntries']
  trainZones: DataSnapshot['trainZones']
  moduleZones: DataSnapshot['moduleZones']
  technicalSignals: DataSnapshot['technicalSignals']
  moduleInfoByZone: DataSnapshot['moduleInfoByZone']
  updatedAt: DataSnapshot['updatedAt']
  connectionDiagnostics: DataSnapshot['connectionDiagnostics']
  summary: DataSnapshot['summary']
  actions: DataSnapshot['actions']
  connectionState: DataSnapshot['connectionState']
  error: DataSnapshot['error']
  alarmMachine: AlarmMachineState
  moduleOpen: boolean
  noDataOpen: boolean
  selectedModuleZoneId: string
  setTab: (tab: AppTab) => void
  applySnapshot: (snapshot: DataSnapshot) => void
  toggleAlarmSound: () => void
  openModule: () => void
  closeModule: () => void
  openNoData: () => void
  closeNoData: () => void
  selectModuleZone: (zoneId: string) => void
}

export const useAppStore = create<AppStoreState>((set) => ({
  activeTab: 'train',
  scenarioId: 'one-fault',
  decodedChannels: [],
  channels: [],
  journalEntries: [],
  trainZones: [],
  moduleZones: [],
  technicalSignals: [],
  moduleInfoByZone: {},
  updatedAt: null,
  connectionDiagnostics: null,
  summary: {
    status: 'offline',
    modulesOnline: 0,
    modulesTotal: 0,
    faults: 0,
  },
  actions: {
    tifon: undefined,
  },
  connectionState: 'offline',
  error: null,
  alarmMachine: AlarmMachineStates.NoAlarm,
  moduleOpen: false,
  noDataOpen: false,
  selectedModuleZoneId: DEFAULT_SELECTED_MODULE_ZONE_ID,
  setTab: (tab) => set({ activeTab: tab }),
  applySnapshot: (snapshot) => {
    const hasActiveAlarm = snapshot.technicalSignals.some((signal) => signal.isFault)

    set((state) => ({
      scenarioId: snapshot.scenarioId,
      decodedChannels: snapshot.decodedChannels,
      channels: snapshot.channels,
      journalEntries: snapshot.journalEntries,
      trainZones: snapshot.trainZones,
      moduleZones: snapshot.moduleZones,
      technicalSignals: snapshot.technicalSignals,
      moduleInfoByZone: snapshot.moduleInfoByZone,
      updatedAt: snapshot.updatedAt,
      connectionDiagnostics: snapshot.connectionDiagnostics,
      summary: snapshot.summary,
      actions: snapshot.actions,
      connectionState: snapshot.connectionState,
      error: snapshot.error,
      alarmMachine: syncAlarmMachineState(state.alarmMachine, hasActiveAlarm),
      selectedModuleZoneId:
        snapshot.moduleZones.find((zone) => zone.id === state.selectedModuleZoneId)?.id ??
        snapshot.moduleZones.find((zone) => zone.status === 'fault')?.id ??
        snapshot.moduleZones[0]?.id ??
        state.selectedModuleZoneId,
    }))
  },
  toggleAlarmSound: () =>
    set((state) => ({
      alarmMachine: toggleAlarmSoundState(state.alarmMachine),
    })),
  openModule: () => set({ moduleOpen: true, noDataOpen: false }),
  closeModule: () => set({ moduleOpen: false }),
  openNoData: () => set({ noDataOpen: true, moduleOpen: false }),
  closeNoData: () => set({ noDataOpen: false }),
  selectModuleZone: (zoneId) => set({ selectedModuleZoneId: zoneId }),
}))

