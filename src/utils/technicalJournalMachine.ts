export const TechnicalJournalScreens = {
  Collapsed: 'collapsed',
  Auth: 'auth',
  JournalView: 'journal_view',
} as const

export type TechnicalJournalScreen =
  (typeof TechnicalJournalScreens)[keyof typeof TechnicalJournalScreens]

export interface TechnicalJournalState {
  screen: TechnicalJournalScreen
  login: string
  password: string
  dateFrom: string
  dateTo: string
}

export type TechnicalJournalAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SHOW_AUTH' }
  | { type: 'SHOW_JOURNAL' }
  | { type: 'SET_LOGIN'; value: string }
  | { type: 'SET_PASSWORD'; value: string }
  | { type: 'SET_DATE_FROM'; value: string }
  | { type: 'SET_DATE_TO'; value: string }
  | { type: 'RESET_FILTERS' }

export function createInitialTechnicalJournalState(): TechnicalJournalState {
  return {
    screen: TechnicalJournalScreens.Collapsed,
    login: '',
    password: '',
    dateFrom: '',
    dateTo: '',
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

      return { ...state, screen: TechnicalJournalScreens.Auth }

    case 'CLOSE':
      return { ...state, screen: TechnicalJournalScreens.Collapsed }

    case 'SHOW_AUTH':
      return { ...state, screen: TechnicalJournalScreens.Auth, password: '' }

    case 'SHOW_JOURNAL':
      return { ...state, screen: TechnicalJournalScreens.JournalView, password: '' }

    case 'SET_LOGIN':
      return { ...state, login: action.value }

    case 'SET_PASSWORD':
      return { ...state, password: action.value }

    case 'SET_DATE_FROM':
      return { ...state, dateFrom: action.value }

    case 'SET_DATE_TO':
      return { ...state, dateTo: action.value }

    case 'RESET_FILTERS':
      return { ...state, dateFrom: '', dateTo: '' }

    default:
      return state
  }
}
