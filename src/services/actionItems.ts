import type { ActionVerb } from '../types'

export type ActionItem = {
  title: string
  summary: string
  verb: ActionVerb
  originalSubject: string
}

type EmailInput = {
  subject: string
  snippet: string
  from: string
}

const PREFIX_RE = /^(re|fw|fwd|aw|sv|antw|答复|回复)\s*:\s*/i

function cleanSubject(subject: string): string {
  let s = subject.trim()
  while (PREFIX_RE.test(s)) {
    s = s.replace(PREFIX_RE, '').trim()
  }
  return s.replace(/\s+/g, ' ') || 'this email'
}

function cleanSnippet(snippet: string): string {
  return snippet
    .replace(/\s+/g, ' ')
    .replace(/^(hi|hello|hey|dear)\b[^,]*,?\s*/i, '')
    .replace(/^(thanks|thank you|cheers|best|regards).*$/i, '')
    .trim()
}

function firstSentence(text: string): string {
  const cleaned = cleanSnippet(text)
  if (!cleaned) return ''
  const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/)
  const sentence = (match?.[1] || cleaned).trim()
  return sentence.length > 160 ? `${sentence.slice(0, 157).trim()}…` : sentence
}

function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function ensurePeriod(text: string): string {
  if (!text) return text
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function stripQuestionFluff(text: string): string {
  return text
    .replace(/^(could you|can you|would you|will you|please)\s+/i, '')
    .replace(/\?+$/, '')
    .trim()
}

type Pattern = {
  verb: ActionVerb
  test: RegExp
  title: (subject: string, snippet: string, from: string) => string | null
}

const PATTERNS: Pattern[] = [
  {
    verb: 'Confirm',
    test: /\b(confirm|confirmation|rsvp|lock (the )?deposit|yes\/no)\b/i,
    title: (subject, snippet) => {
      const ask = snippet.match(/\b(confirm|reply yes|rsvp)\b[^.?!]*/i)
      if (ask) return capitalize(stripQuestionFluff(ask[0]))
      return `Confirm: ${subject}`
    },
  },
  {
    verb: 'Schedule',
    test: /\b(schedule|book|calendar|meeting|standup|appointment|availability|preferred time)\b/i,
    title: (subject, snippet) => {
      const timeAsk = snippet.match(/\b(book|schedule|reply with a preferred time)[^.?!]*/i)
      if (timeAsk) return capitalize(stripQuestionFluff(timeAsk[0]))
      return `Schedule: ${subject}`
    },
  },
  {
    verb: 'Send',
    test: /\b(send|share|attach|invoice|pdf|document|resend)\b/i,
    title: (subject, snippet) => {
      const sendAsk = snippet.match(/\b(send|share|resend)\b[^.?!]*/i)
      if (sendAsk) return capitalize(stripQuestionFluff(sendAsk[0]))
      if (/invoice/i.test(subject)) return `Send ${subject}`
      return `Send what was requested about ${subject}`
    },
  },
  {
    verb: 'Review',
    test: /\b(review|look over|feedback|flag|approve|proposal|draft|budget)\b/i,
    title: (subject, snippet) => {
      const reviewAsk = snippet.match(
        /\b(review|look over|flag|approve|give feedback on)\b[^.?!]*/i,
      )
      if (reviewAsk) return capitalize(stripQuestionFluff(reviewAsk[0]))
      return `Review ${subject}`
    },
  },
  {
    verb: 'Decide',
    test: /\b(decide|choose|pick|approve|go\/no-go|which option)\b/i,
    title: (subject) => `Decide on ${subject}`,
  },
  {
    verb: 'Reply',
    test: /\b(reply|respond|let me know|get back|thoughts\??|can you|could you|would you)\b/i,
    title: (subject, snippet, from) => {
      const ask = snippet.match(
        /\b((?:can|could|would|will) you|please|let me know)\b[^.?!]*/i,
      )
      if (ask) {
        const cleaned = stripQuestionFluff(ask[0])
        if (cleaned.length > 8) return capitalize(cleaned)
      }
      return `Reply to ${from} about ${subject}`
    },
  },
  {
    verb: 'Follow up',
    test: /\b(follow[- ]?up|reminder|waiting on|pending|nudge)\b/i,
    title: (subject) => `Follow up on ${subject}`,
  },
]

function pickVerb(subject: string, snippet: string): Pattern | null {
  const haystack = `${subject} ${snippet}`
  for (const pattern of PATTERNS) {
    if (pattern.test.test(haystack)) return pattern
  }
  return null
}

function buildSummary(from: string, subject: string, snippet: string, verb: ActionVerb): string {
  const bite = firstSentence(snippet)
  if (bite) {
    return ensurePeriod(`${from} wrote: ${bite}`)
  }
  return ensurePeriod(`${from} emailed you about “${subject}” — ${verb.toLowerCase()} when you can`)
}

/**
 * Turns a raw email into a plain-language action item.
 */
export function translateEmailToAction(input: EmailInput): ActionItem {
  const originalSubject = input.subject.trim() || '(No subject)'
  const subject = cleanSubject(originalSubject)
  const snippet = cleanSnippet(input.snippet || '')
  const from = input.from.trim() || 'Someone'

  const matched = pickVerb(subject, snippet)
  const verb = matched?.verb ?? (snippet ? 'Reply' : 'Read')

  let title =
    matched?.title(subject, snippet, from) ||
    (snippet
      ? `Reply to ${from} about ${subject}`
      : `Read email from ${from}: ${subject}`)

  title = title.replace(/\s+/g, ' ').trim()
  if (title.length > 110) title = `${title.slice(0, 107).trim()}…`
  title = capitalize(title)

  return {
    title,
    summary: buildSummary(from, subject, snippet, verb),
    verb,
    originalSubject,
  }
}
