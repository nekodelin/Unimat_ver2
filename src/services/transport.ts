import type { DataSnapshot, ScenarioId } from '../types/app'

export type SnapshotListener = (snapshot: DataSnapshot) => void

export interface DataTransport {
  connect(): void
  disconnect(): void
  subscribe(listener: SnapshotListener): () => void
  setScenario?(scenarioId: ScenarioId): void
  getScenario?(): ScenarioId
}
