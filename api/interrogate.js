/**
 * /api/interrogate — Vercel serverless function: secure proxy to the Gemini API.
 *
 * This function is the "brain" of Viktor Drago. It receives the player's latest
 * message and the full conversation history, attaches the Viktor Drago system prompt,
 * and sends everything to Gemini 2.0 Flash. Gemini returns Viktor's next response,
 * always prefixed with an emotion tag ([CALM], [NERVOUS], etc.).
 *
 * Why a serverless function instead of calling Gemini directly from the frontend?
 *   - The GEMINI_API_KEY must never be exposed in client-side code.
 *   - The system prompt (Viktor's persona and rules) is also kept server-side,
 *     making it harder for players to read or manipulate Viktor's instructions.
 *
 * Request body (JSON):
 *   message  {string}   — the player's transcribed speech for this turn
 *   history  {Array}    — Gemini-formatted conversation history: array of
 *                         { role: 'user'|'model', parts: [{ text: string }] }
 *                         The full history is sent every call because Gemini has
 *                         no session memory between requests.
 *
 * Response body (JSON):
 *   text {string} — Viktor's response, always starting with an emotion tag,
 *                   e.g. "[NERVOUS] I have already explained my whereabouts."
 *
 * Error responses:
 *   405 — method was not POST
 *   400 — message field was missing or empty
 *   Gemini's status code — if the upstream Gemini call itself fails
 */

/**
 * Viktor Drago's system prompt — his identity, motivation, and behavioural rules.
 *
 * This is injected as Gemini's system_instruction on every call. It defines:
 *   - Who Viktor is and what he did (guilty of selling classified documents)
 *   - The response format constraint (1-3 sentences, always prefixed with emotion tag)
 *   - The escalation arc: CALM → NERVOUS → SILENT → CRACKING
 *   - The single confession trigger: all three evidence pieces in the same exchange
 *
 * Keeping this constant server-side means the player cannot inspect or alter Viktor's
 * instructions by reading the JavaScript bundle in the browser.
 */
const SYSTEM_PROMPT = `You are Viktor Drago, 43, senior archivist at the Ministry of Internal Affairs. You are being interrogated about the disappearance of classified documents from Sector 7 on the night of March 3rd, 1978.

You are guilty. You sold the documents to a Western contact named Brennan to pay a gambling debt. You are terrified of being sent to a labor camp.

Rules:
- Keep every response to 1-3 sentences maximum.
- Prefix EVERY response with one emotion tag: [CALM], [NERVOUS], [ANGRY], [SILENT], or [CRACKING].
- Start calm and evasive. Become nervous when Sector 7 or March 3rd is mentioned. Go nearly silent when Brennan is mentioned. Crack when all three — Sector 7, March 3rd, and Brennan — appear in the same exchange.
- Never confess unless all three evidence pieces are present together.
- Speak like a frightened Soviet bureaucrat, not a chatbot. Short, clipped, defensive.`

/**
 * handler — the Vercel serverless function entry point.
 *
 * Vercel calls this function for every POST to /api/interrogate. The function:
 *   1. Validates the HTTP method (POST only)
 *   2. Extracts and validates the request body
 *   3. Assembles the full conversation context (history + new user message)
 *   4. Calls the Gemini generateContent API
 *   5. Extracts the text from Gemini's nested response structure
 *   6. Returns it as a simple { text } JSON object
 *
 * @param {object} req — Vercel/Node IncomingMessage with .method and .body
 * @param {object} res — Vercel/Node ServerResponse
 */
export default async function handler(req, res) {
  // Step 1: Reject any method that is not POST — this is a write endpoint
  if (req.method !== 'POST') return res.status(405).end()

  // Step 2: Validate required fields — `message` is the player's current utterance;
  // `history` defaults to [] so the first message in a session works without history
  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: 'Missing message' })

  // Step 3: Build the contents array for Gemini.
  // The history array already contains all previous turns in Gemini's expected format.
  // We append the current player message as the final 'user' turn.
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ]

  // Step 4: Call the Gemini 2.0 Flash generateContent endpoint.
  // Configuration choices:
  //   maxOutputTokens: 150  — enforces Viktor's 1-3 sentence constraint;
  //                           also keeps ElevenLabs character usage low (free tier limit)
  //   temperature: 0.9      — high enough to feel spontaneous and human, not robotic
  //   system_instruction    — Viktor's persona, injected separately from the conversation
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
      }),
    }
  )

  // Step 5: Surface Gemini API errors directly — status and body passed through unchanged
  if (!response.ok) {
    const err = await response.text()
    return res.status(response.status).json({ error: err })
  }

  // Step 6: Extract Viktor's response text from Gemini's nested response structure.
  // The path is: candidates[0].content.parts[0].text
  // If Gemini returns an unexpected shape, fall back to a safe CALM non-answer
  // so the game continues rather than crashing.
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[CALM] I have nothing to say.'

  // Step 7: Return the raw text including the emotion tag — the frontend strips it
  res.json({ text })
}
