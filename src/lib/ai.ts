import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return _client
}

/**
 * Generate text using GPT-4o-mini (fast + cheap for short structured messages).
 *
 * When systemPrompt is provided, it's sent as a separate system message.
 * This separates trusted brand instructions from untrusted job data,
 * protecting against prompt injection from Airtable content.
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const client = getClient()

  const messages: { role: 'system' | 'user'; content: string }[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1024,
    temperature: 0.7,
    messages,
  })

  const content = response.choices[0]?.message?.content
  if (content) {
    return content
  }
  throw new Error('No content in OpenAI response')
}
