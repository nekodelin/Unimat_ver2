export type FaultRecord = {
  signalId: string
  event: string
  reason: string
  fault: string
  action: string
}

export const faults: FaultRecord[] = []
