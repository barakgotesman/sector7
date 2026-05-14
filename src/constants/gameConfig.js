/**
 * The three pieces of evidence the player must surface during interrogation
 * before the Accusation Panel unlocks.
 *
 * Each key corresponds to one critical detail of Viktor Drago's crime:
 *   - sector7  → the restricted archive he accessed without authorisation
 *   - march3   → the specific night the documents went missing
 *   - brennan  → the Western contact he sold the documents to
 *
 * Evidence is surfaced automatically when the matching keyword appears in
 * either the player's speech or Viktor's response (see handleTranscript
 * in App.jsx). The player does not need to tick checkboxes — the system
 * listens for the words and marks the evidence found.
 *
 * All three must be true for isUnlocked to flip to true in useGameState.
 */
export const EVIDENCE_KEYS = ['sector7', 'march3', 'brennan']

/**
 * Human-readable labels for each evidence key, shown in the Dossier Drawer
 * and referenced in the Accusation Panel's required-evidence checklist.
 *
 * These strings are what the player sees — they describe the evidence in
 * plain investigative terms rather than exposing the internal key names.
 */
export const EVIDENCE_LABELS = {
  sector7: 'Sector 7 connection',  // Viktor's access to the restricted archive
  march3:  'March 3rd, 1978',      // The date the documents disappeared
  brennan: 'Brennan contact',      // The Western handler Viktor sold to
}
