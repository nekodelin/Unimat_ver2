export type Fault = {
  event: string
  reason: string
  fault: string
  action: string
}

export const faults: Record<string, Fault> = {}
