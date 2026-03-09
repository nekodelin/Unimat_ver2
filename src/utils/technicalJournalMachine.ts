export const TechnicalJournalScreens = {
  Collapsed: 'collapsed',
  Intro: 'intro',
  Auth: 'auth',
  ModeSelect: 'mode_select',
  JournalView: 'journal_view',
} as const

export type TechnicalJournalScreen =
  (typeof TechnicalJournalScreens)[keyof typeof TechnicalJournalScreens]

export type JournalViewMode = 'current' | 'period'

export interface TechnicalJournalState {
  screen: TechnicalJournalScreen
  mode: JournalViewMode
  login: string
  password: string
  periodLabel: string
}

export type TechnicalJournalAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'GO_AUTH' }
  | { type: 'SET_LOGIN'; value: string }
  | { type: 'SET_PASSWORD'; value: string }
  | { type: 'SUBMIT_AUTH' }
  | { type: 'OPEN_CURRENT_FAULTS' }
  | { type: 'SET_PERIOD_LABEL'; value: string }
  | { type: 'OPEN_PERIOD_FAULTS' }
  | { type: 'BACK_TO_MODE_SELECT' }

export function createInitialTechnicalJournalState(): TechnicalJournalState {
  return {
    screen: TechnicalJournalScreens.Collapsed,
    mode: 'current',
    login: '',
    password: '',
    periodLabel: '12.12.2025 - 12.01.2026',
  }
}

export function technicalJournalReducer(
  state: TechnicalJournalState,
  action: TechnicalJournalAction,
): TechnicalJournalState {
  switch (action.type) {
    case 'OPEN':
      if (state.screen !== TechnicalJournalScreens.Collapsed) {
        return state
      }

      return { ...state, screen: TechnicalJournalScreens.Intro }

    case 'CLOSE':
      return { ...state, screen: TechnicalJournalScreens.Collapsed }

    case 'GO_AUTH':
      if (state.screen !== TechnicalJournalScreens.Intro) {
        return state
      }

      return { ...state, screen: TechnicalJournalScreens.Auth }

    case 'SET_LOGIN':
      return { ...state, login: action.value }

    case 'SET_PASSWORD':
      return { ...state, password: action.value }

    case 'SUBMIT_AUTH':
      if (state.screen !== TechnicalJournalScreens.Auth) {
        return state
      }

      return { ...state, screen: TechnicalJournalScreens.ModeSelect }

    case 'OPEN_CURRENT_FAULTS':
      if (state.screen !== TechnicalJournalScreens.ModeSelect) {
        return state
      }

      return {
        ...state,
        mode: 'current',
        screen: TechnicalJournalScreens.JournalView,
      }

    case 'SET_PERIOD_LABEL':
      return { ...state, periodLabel: action.value }

    case 'OPEN_PERIOD_FAULTS':
      if (state.screen !== TechnicalJournalScreens.ModeSelect) {
        return state
      }

      return {
        ...state,
        mode: 'period',
        screen: TechnicalJournalScreens.JournalView,
      }

    case 'BACK_TO_MODE_SELECT':
      if (state.screen !== TechnicalJournalScreens.JournalView) {
        return state
      }

      return { ...state, screen: TechnicalJournalScreens.ModeSelect }

    default:
      return state
  }
}
