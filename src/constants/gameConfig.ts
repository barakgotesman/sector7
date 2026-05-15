import type { EvidenceKey } from '../types'

export const EVIDENCE_KEYS: EvidenceKey[] = ['sector7', 'march3', 'brennan']

export const EVIDENCE_LABELS: Record<EvidenceKey, string> = {
  sector7: 'Sector 7 connection',
  march3:  'March 3rd, 1978',
  brennan: 'Brennan contact',
}
