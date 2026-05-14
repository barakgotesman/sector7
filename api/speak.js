/**
 * /api/speak — Vercel serverless function: secure proxy to the ElevenLabs TTS API.
 *
 * This function converts Viktor Drago's text response into audio using ElevenLabs'
 * text-to-speech API. It acts as a proxy for two reasons:
 *   1. The ELEVENLABS_API_KEY must never be exposed in client-side code.
 *   2. The voice ID and model ID are locked server-side so the frontend cannot
 *      request a different voice or model.
 *
 * The audio is returned as raw MP3 bytes (not a URL), which the frontend wraps in a
 * Blob and plays via the Web Audio API (see useAudio.js → playSuspectAudio).
 *
 * Request body (JSON):
 *   text {string} — Viktor's response text with the emotion tag already stripped
 *                   (stripping happens in App.jsx before this call is made)
 *
 * Response:
 *   Binary MP3 audio data with Content-Type: audio/mpeg
 *   The client receives this as an ArrayBuffer.
 *
 * Error responses:
 *   405 — method was not POST
 *   400 — text field was missing or empty
 *   ElevenLabs' status code — if the upstream TTS call itself fails
 */

/**
 * Viktor Drago's ElevenLabs voice ID.
 *
 * This specific voice was chosen for its qualities: slightly gravelly, Eastern European
 * character, carries both nervousness and authority depending on the text content.
 * The Vercel environment variable ELEVENLABS_VOICE_ID also holds this value, but it is
 * hardcoded here as a constant so the function does not depend on an env var for a
 * value that should never change between environments.
 */
const VOICE_ID = 'OPl534sov4A0jA4MY2k2'

/**
 * The ElevenLabs model used for synthesis.
 *
 * eleven_multilingual_v2 is chosen specifically because the game is bilingual —
 * the same voice and model handles both English and Hebrew utterances. This means
 * we do not need separate voice IDs per language. The model detects language
 * automatically from the input text.
 */
const MODEL_ID = 'eleven_multilingual_v2'

/**
 * handler — the Vercel serverless function entry point.
 *
 * Vercel calls this for every POST to /api/speak. The function:
 *   1. Validates the HTTP method (POST only)
 *   2. Extracts and validates the text from the request body
 *   3. Calls the ElevenLabs text-to-speech API
 *   4. Streams the raw audio bytes back to the client as audio/mpeg
 *
 * @param {object} req — Vercel/Node IncomingMessage with .method and .body
 * @param {object} res — Vercel/Node ServerResponse
 */
export default async function handler(req, res) {
  // Step 1: Reject any method that is not POST — this is a write endpoint
  if (req.method !== 'POST') return res.status(405).end()

  // Step 2: Validate that text was provided — there is no meaningful fallback for empty TTS
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'Missing text' })

  // Step 3: Call ElevenLabs text-to-speech.
  // The URL path includes the VOICE_ID to select Viktor's voice.
  // Voice settings:
  //   stability: 0.5        — mid-range; allows natural variation without sounding unstable
  //   similarity_boost: 0.75 — high similarity to the reference voice ensures Viktor always
  //                            sounds like the same person even with emotional variation
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY, // secret — never exposed to the frontend
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,         // balanced — human-sounding but consistent
          similarity_boost: 0.75, // stays close to Viktor's reference voice
        },
      }),
    }
  )

  // Step 4: Surface ElevenLabs errors directly — pass status and body through unchanged
  if (!response.ok) {
    const err = await response.text()
    return res.status(response.status).json({ error: err })
  }

  // Step 5: Read the raw MP3 bytes from ElevenLabs' response and stream them to the client.
  // Buffer.from(arrayBuffer) converts the raw bytes into a Node.js Buffer that res.send()
  // can write directly to the HTTP response body.
  // Content-Type: audio/mpeg tells the client (useAudio.js) how to interpret the bytes
  // when wrapping them in a Blob for Web Audio playback.
  const audioBuffer = await response.arrayBuffer()
  res.setHeader('Content-Type', 'audio/mpeg')
  res.send(Buffer.from(audioBuffer))
}
