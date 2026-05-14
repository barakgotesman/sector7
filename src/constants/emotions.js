/**
 * Emotion states that Viktor Drago can express during interrogation.
 *
 * These are not just visual tags — they drive the silhouette animation,
 * control the green glow intensity on the CCTV image, and tell the player
 * (without words) how close they are to breaking the suspect.
 *
 * Gemini is instructed to prefix every response with one of these tags
 * in the format [EMOTION], e.g. [NERVOUS]. The frontend strips the tag
 * before displaying the response text, then uses the extracted value here
 * to transition the silhouette into the matching animation variant.
 */
export const EMOTIONS = {
  // Default state — Viktor is composed, evasive, giving nothing away.
  CALM: 'CALM',

  // Triggered when Sector 7 or March 3rd enters the conversation.
  // The silhouette shakes subtly; breathing quickens.
  NERVOUS: 'NERVOUS',

  // Viktor pushes back — defensive aggression, not guilt.
  // Silhouette leans forward; glow brightens to maximum green.
  ANGRY: 'ANGRY',

  // Viktor shuts down entirely, usually right after Brennan is named.
  // Silhouette turns slightly away; opacity drops — presence recedes.
  SILENT: 'SILENT',

  // All three evidence pieces (Sector 7, March 3rd, Brennan) are in play.
  // Viktor is losing control. Silhouette flickers, shakes hard, glows white-hot.
  CRACKING: 'CRACKING',
}

/**
 * Regex used to detect and extract the emotion prefix Gemini attaches to every response.
 *
 * Gemini is instructed to open every line with [CALM], [NERVOUS], etc.
 * This pattern matches the tag at the very start of the returned string (^)
 * so a stray mention of "NERVOUS" mid-sentence does not count as a tag.
 *
 * Usage:
 *   const match = raw.match(EMOTION_REGEX)
 *   const emotion  = match ? match[1] : 'CALM'   // captured group — the word
 *   const text     = raw.replace(EMOTION_REGEX, '').trim()  // remaining speech
 */
export const EMOTION_REGEX = /^\[(CALM|NERVOUS|ANGRY|SILENT|CRACKING)\]/
