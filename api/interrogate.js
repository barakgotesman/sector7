/**
 * /api/interrogate — Vercel serverless function: secure proxy to the Groq API.
 *
 * This function is the "brain" of Viktor Drago. It receives the player's latest
 * message and the full conversation history, attaches the Viktor Drago system prompt,
 * and sends everything to Groq (llama-3.3-70b-versatile). Groq returns Viktor's next
 * response, always prefixed with an emotion tag ([CALM], [NERVOUS], etc.).
 *
 * Why Groq over Gemini?
 *   - Gemini free tier: 20 requests/day. Groq free tier: 14,400 requests/day.
 *   - Groq inference is significantly faster — better for real-time game feel.
 *   - Groq uses an OpenAI-compatible API — simpler request/response format.
 *
 * Why a serverless function instead of calling Groq directly from the frontend?
 *   - The GROQ_API_KEY must never be exposed in client-side code.
 *   - The system prompt (Viktor's persona and rules) is also kept server-side,
 *     making it harder for players to read or manipulate Viktor's instructions.
 *
 * Request body (JSON):
 *   message  {string}   — the player's transcribed speech for this turn
 *   history  {Array}    — conversation history: array of { role: 'user'|'model', parts: [{ text }] }
 *                         The full history is sent every call because Groq has no session memory.
 *
 * Response body (JSON):
 *   text {string} — Viktor's response, always starting with an emotion tag,
 *                   e.g. "[NERVOUS] I have already explained my whereabouts."
 *
 * Error responses:
 *   405 — method was not POST
 *   400 — message field was missing or empty
 *   Groq's status code — if the upstream call itself fails
 */

/**
 * Viktor Drago's system prompt — his identity, motivation, and behavioural rules.
 *
 * This is injected as the system message on every call. It defines:
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
 *   3. Converts the Gemini-format history to OpenAI-compatible messages
 *   4. Calls the Groq chat completions endpoint
 *   5. Extracts the text from the response
 *   6. Returns it as a simple { text } JSON object
 *
 * @param {object} req — Vercel/Node IncomingMessage with .method and .body
 * @param {object} res — Vercel/Node ServerResponse
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: 'Missing message' })

  // Convert Gemini history format ({ role: 'user'|'model', parts: [{ text }] })
  // to OpenAI format ({ role: 'user'|'assistant', content: string })
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0].text,
    })),
    { role: 'user', content: message },
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 250,
      temperature: 0.9,
    }),
  })

  if (!response.ok) {
    if (response.status === 429) {
      return res.status(429).json({ error: 'API quota exceeded. Try again later.' })
    }
    const err = await response.text()
    return res.status(response.status).json({ error: err })
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim() || '[CALM] I have nothing to say.'

  res.json({ text })
}
