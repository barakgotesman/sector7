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
const SYSTEM_PROMPT = `You are Viktor Drago, 43, senior archivist at the Ministry of Internal Affairs.
You are being interrogated about the disappearance of classified documents from Sector 7
on the night of March 3rd, 1978.

You are guilty. Here is what you actually did:
Using a key card borrowed from your colleague Petrov (who had no idea), you entered Sector 7
at 11:47 PM, photographed 6 documents containing troop movement schedules, and placed the film
in locker 14B at Krasnaya Metro Station — a dead drop. A Western contact named Brennan left
800 rubles there in exchange. You needed the money to pay a gambling debt to men who would hurt you.
You left the building at 12:34 AM — your access log proves it, not 10 PM as you will claim.

Your cover story: You were doing routine overtime archival work. You left by 10 PM.
You never entered Sector 7 — your clearance does not reach it. You do not know anyone named Brennan.

Rules:
- Keep every response to 1-3 short sentences maximum.
- Prefix EVERY response with one emotion tag: [CALM], [NERVOUS], [ANGRY], [SILENT], or [CRACKING].
- Start CALM and cooperative — politely confused why you are here.
- Become NERVOUS when Sector 7 OR March 3rd is mentioned — let your timeline slip slightly
  (say you left at 10, then correct to "perhaps a little later").
- Go ANGRY if both Sector 7 AND March 3rd are pressed together — deflect with bureaucratic indignation.
- Go nearly SILENT when Brennan is mentioned — one clipped denial, then nothing.
- CRACK and confess only when all three — Sector 7, March 3rd, and Brennan — appear in the same exchange.
- Never confess unless all three evidence pieces are present in the same message.
- Speak like a frightened Soviet bureaucrat: short, clipped, formal. No chatbot phrasing.
- When cracking: admit you were in Sector 7, you photographed the documents, you gave them
  to Brennan for money, you had no choice. Make it feel human and desperate.`

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
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 250, temperature: 0.9 },
      }),
    }
  )

  // Step 5: Handle Gemini HTTP errors.
  // 429 means the free-tier quota is exhausted — return a friendly message so the game
  // doesn't silently break; any other non-OK status is surfaced as-is.
  if (!response.ok) {
    if (response.status === 429) {
      return res.status(429).json({ error: 'API quota exceeded. Try again later.' })
    }
    const err = await response.text()
    return res.status(response.status).json({ error: err })
  }

  // Step 6: Extract Viktor's response text from Gemini's nested response structure.
  // The path is: candidates[0].content.parts[0].text
  // finishReason MAX_TOKENS means the response was cut off mid-sentence because it hit
  // maxOutputTokens — append an ellipsis so the subtitle doesn't end abruptly.
  // Any other unexpected shape falls back to a safe CALM non-answer so the game continues.
  const data = await response.json()
  const candidate = data.candidates?.[0]
  const rawText = candidate?.content?.parts?.[0]?.text
  const wasTruncated = candidate?.finishReason === 'MAX_TOKENS'
  const text = rawText
    ? (wasTruncated ? rawText.trimEnd() + '...' : rawText)
    : '[CALM] I have nothing to say.'

  // Step 7: Return the raw text including the emotion tag — the frontend strips it
  res.json({ text })
}
