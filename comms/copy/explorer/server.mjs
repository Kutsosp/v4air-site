// V4AIR copy explorer: static server + save + generate.
// Run: node comms/copy/explorer/server.mjs   then open http://localhost:4141
// Needs ANTHROPIC_API_KEY in the environment. No dependencies.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const COPY_FILE = path.join(here, 'copy.json')
const MASTER_FILE = path.join(here, '..', 'asset-02-long-announcement.md')
const MODEL = 'claude-opus-5-5'
const PORT = 4141

const mime = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' }

function readBody(req) {
  return new Promise((resolve) => {
    let s = ''
    req.on('data', (c) => (s += c))
    req.on('end', () => resolve(s))
  })
}

function context() {
  const master = fs.existsSync(MASTER_FILE) ? fs.readFileSync(MASTER_FILE, 'utf8') : ''
  return { master }
}

// {{asset:ID}} or {{asset:ID.field}} in a prompt inserts the saved copy of another asset.
// Returns the expanded text and a list of unresolved references.
function expandAssetRefs(text, copy, assets) {
  const missing = []
  const out = String(text || '').replace(/\{\{asset:([\w-]+)(?:\.(\w+))?\}\}/g, (m, id, field) => {
    const a = assets.find((x) => x.id === id)
    const vals = copy[id]
    if (!a || !vals) { missing.push(m); return m }
    const fmt = (v) => (Array.isArray(v) ? v.map((x) => `- ${x}`).join('\n') : String(v ?? ''))
    if (field) {
      if (!(field in vals)) { missing.push(m); return m }
      return fmt(vals[field])
    }
    const body = Object.entries(vals).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}:\n${fmt(v)}`).join('\n\n')
    return `--- ${a.name} (${a.type}) ---\n${body}\n--- end of ${a.name} ---`
  })
  return { out, missing }
}

// key messages whose audience list overlaps the asset's audiences, and the hooks that belong to them
function relevantMessages(asset, keyMessages = [], hooks = []) {
  const aud = new Set(asset.audiences || [])
  const kms = keyMessages.filter((k) => k.audiences.some((a) => aud.has(a)))
  const nums = new Set(kms.map((k) => k.n))
  return { kms, hooks: hooks.filter((h) => nums.has(h.km)) }
}

async function generate({ asset, channel, shared, variables, fields, current, target, instructions, assetPrompt, keyMessages, hooks, university, careerStages, allAssets, useExamples }) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  const { master } = context()
  const rel = relevantMessages(asset, keyMessages, hooks)

  // resolve {{asset:...}} references in the asset prompt and the field instructions from the saved copy
  const copy = fs.existsSync(COPY_FILE) ? JSON.parse(fs.readFileSync(COPY_FILE, 'utf8')) : {}
  const unresolved = []
  const ap = expandAssetRefs(assetPrompt, copy, allAssets || [])
  assetPrompt = ap.out; unresolved.push(...ap.missing)
  instructions = Object.fromEntries(Object.entries(instructions || {}).map(([k, v]) => { const r = expandAssetRefs(v, copy, allAssets || []); unresolved.push(...r.missing); return [k, r.out] }))
  if (unresolved.length) throw new Error(`Unknown or empty asset reference: ${[...new Set(unresolved)].join(', ')}. Save that asset first, and use its id from the "All assets" list.`)
  // with examples off, key message 2's microcopy (the biologist/historian sentence) is replaced so it is not copied as a pattern
  const kmText = rel.kms
    .map((k) => {
      const micro = !useExamples && /biologist|historian/i.test(k.microcopy) ? 'Whatever your field, if you apply AI in your research, this meetup is for you.' : k.microcopy
      return `${k.n}. ${k.message}\n   Main idea: ${k.idea}\n   Problem/solution framing: ${k.problem_solution}\n   Headline: ${k.headline}\n   Microcopy: ${micro}`
    })
    .join('\n')
  const hookText = rel.hooks.map((h) => `[${h.km}] ${h.hook}  (${h.type}, ${h.awareness})`).join('\n')

  const wanted = target ? fields.filter((f) => f.key === target) : fields
  const schemaLines = wanted
    .map((f) => {
      const note = (instructions || {})[f.key]
      return `- ${f.key}: ${f.label}${f.max ? ` (max ${f.max} ${f.type === 'lines' ? 'items' : 'characters'})` : ''}${f.type === 'lines' ? ', return as an array of strings' : ''}${note ? `\n  Instruction for this field: ${note}` : ''}`
    })
    .join('\n')

  const varNames = Object.keys(variables || {})
  const system = `You write communication copy for V4AIR, an academic meetup. Plain English, declarative sentences, no marketing filler.
Rules:
- Use only facts from the shared facts, the key messages and the master text below. Invent nothing: no numbers, names, quotes or claims that are not there.
- Build the copy on the key messages given for this asset's target groups. Do not bring in messages aimed at other groups.
- Never use an em dash (U+2014). Use commas, colons or full stops.
- Never use these words: delve, leverage, robust, unlock, unleash, game-changer, cutting-edge, seamless, empower.
- No rhetorical questions stacked in a row, no "X, not Y" contrast lines, no exclamation marks.
- Respect every character limit. Count a variable placeholder as the length of its example value.
- Write for the audience and channel named. Match the register of that channel.
- Address the reader directly as "you". Never refer to the reader in the third person as "applicants", "participants" or "students" when the text is speaking to them. In particular, the programme is shaped by the reader: say "what you want to learn", "who you want to meet", "you take part in shaping the programme", never "what applicants want" or "applicants' answers". Third person is acceptable only in the press release and in text addressed to university leadership.
- Personalisation: the copy is reused at several universities. Where the text refers to the reader's university, city, country or similar, write the placeholder literally, for example {{university}} or {{country}}, instead of the example value. Available placeholders: ${varNames.map((v) => `{{${v}}}`).join(', ')}. Use them where they make the text more relevant; do not force them in.
${useExamples
    ? '- Relatable examples: the placeholder {{examples}} expands to two example personas built from the reader\'s university and career stage, as a noun phrase ("a postdoc in ecology training models on field data and a master\'s student in linguistics probing what models learn"). You may use {{examples}} once, only where an illustration of who belongs at V4AIR helps the specific field you are writing. Do not write your own example personas; the placeholder is filled per university.'
    : '- Do not include example personas (such as "a biologist training models on field data") and do not use the {{examples}} placeholder. State who the event is for in plain terms instead.'}
- Call to action placement: in a "body" field, write {{CTA}} on its own line where the apply button should appear. Put it where the reader has enough information to act, typically after the funding or eligibility part; do not repeat the apply URL in the text. If {{CTA}} is absent, the button is placed at the end. The button label comes from the cta_apply field, so do not write a button label into the body.
- Nomination line: {{NOMINATE}} on its own line in a body marks where the nomination line goes. Use it once in email and web bodies, where a reader who is not going to apply themselves would still pass the call on. Do not write a nomination sentence into the body itself. The sentence lives in the nominate_text field: when asked to write that field, write one sentence of at most 160 characters and put the words that carry the link in square brackets, for example "Know someone who should come? [Nominate them], it takes two minutes." If {{NOMINATE}} is absent, the line is placed after the apply button.
- Funding wording in body text: "covered by the project". Name the International Visegrad Fund only in the acknowledgement line (which every asset already carries), in the press release, and in text addressed to university leadership.
Return JSON only, one key per requested field, no commentary.`

  const user = `ASSET: ${asset.name} (${asset.type})
AUDIENCE: ${asset.audience}
TARGET GROUPS FOR MESSAGING: ${(asset.audiences || []).join(', ')}
CHANNEL: ${asset.channel}
CHANNEL SCHEMA: ${channel.label}
${assetPrompt ? `\nINSTRUCTIONS FOR THIS ASSET:\n${assetPrompt}\n` : ''}
FIELDS TO WRITE:
${schemaLines}

CURRENT VALUES OF ALL FIELDS (keep the ones not requested consistent with these):
${JSON.stringify(current, null, 2)}

PLACEHOLDER EXAMPLE VALUES (for length and register only; write the placeholders, not these values):
${JSON.stringify(variables || {}, null, 2)}

READER CONTEXT FOR THIS RENDERING (for register; the copy must still work for the other universities through placeholders):
- Career stages addressed: ${(careerStages || []).join(', ') || 'not specified'}
- Fields at the example university with a typical AI use: ${(university?.fields || []).map(([f, u]) => `${f} (${u})`).join('; ') || 'not specified'}

SHARED FACTS:
${JSON.stringify(shared, null, 2)}

KEY MESSAGES FOR THESE TARGET GROUPS (use these; other key messages exist for other audiences and are deliberately left out):
${kmText || '(none)'}

HOOKS FOR THESE KEY MESSAGES (reuse or adapt; the number links a hook to its key message):
${hookText || '(none)'}

MASTER TEXT (asset 2, long announcement):
${useExamples ? master : master.replace(/^.*A biologist training models on field data.*$/m, '')}`

  const properties = {}
  const required = []
  for (const f of wanted) {
    properties[f.key] = f.type === 'lines' ? { type: 'array', items: { type: 'string' } } : { type: 'string' }
    required.push(f.key)
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: { type: 'object', properties, required, additionalProperties: false } },
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `API error ${res.status}`)
  if (data.stop_reason === 'refusal') throw new Error('The model refused the request')
  const text = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  return JSON.parse(text)
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x')
      if (req.method === 'GET' && url.pathname === '/api/copy') {
        const body = fs.existsSync(COPY_FILE) ? fs.readFileSync(COPY_FILE, 'utf8') : '{}'
        res.writeHead(200, { 'content-type': 'application/json' })
        return res.end(body)
      }
      if (req.method === 'POST' && url.pathname === '/api/copy') {
        const body = await readBody(req)
        JSON.parse(body)
        fs.writeFileSync(COPY_FILE, body)
        res.writeHead(200, { 'content-type': 'application/json' })
        return res.end('{"ok":true}')
      }
      if (req.method === 'POST' && url.pathname === '/api/generate') {
        const body = JSON.parse(await readBody(req))
        const out = await generate(body)
        res.writeHead(200, { 'content-type': 'application/json' })
        return res.end(JSON.stringify(out))
      }
      // static
      let p = url.pathname === '/' ? '/index.html' : url.pathname
      const file = path.join(here, p)
      if (!file.startsWith(here) || !fs.existsSync(file)) {
        res.writeHead(404)
        return res.end('not found')
      }
      res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' })
      res.end(fs.readFileSync(file))
    } catch (e) {
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: String(e.message || e) }))
    }
  })
  .listen(PORT, () => console.log(`V4AIR copy explorer: http://localhost:${PORT}  (model ${MODEL})`))
