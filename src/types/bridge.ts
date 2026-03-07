export type BridgeBits = {
  inv_in: number
  out: number
  dg: number
}

export type BridgeChannel = {
  ch: number
  name: string
  bits: BridgeBits
  state: string
  isFault: boolean
  faultKind: string | null
  displayRu: string
}

export type PumaBoardDecodedMessage = {
  type: 'puma_board_decoded'
  ts: number
  raw: {
    in: number
    inversed: number
    out: number
  }
  channels: BridgeChannel[]
  faultCount: number
}

export type PumaBoardActMessage = {
  type: 'puma_board_act'
  ts: number
  payload: Record<string, unknown>
}

export type BridgeIncomingMessage = PumaBoardDecodedMessage | PumaBoardActMessage

export type BridgeConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
