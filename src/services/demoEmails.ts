import { rawEmailsToTasks } from './emailToTasks'
import type { RawEmail, Task } from '../types'

/** Raw demo inbox messages — translated into action items at load time. */
const DEMO_EMAILS: RawEmail[] = [
  {
    id: 'demo-1',
    subject: 'Re: Q3 budget proposal',
    snippet:
      'Hi — attaching the latest numbers. Could you flag anything that looks off before we present on Friday?',
    from: 'Maya Chen',
    date: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'demo-2',
    subject: 'Design offsite venue',
    snippet:
      'The loft on Market still has Friday open. Reply yes and I will lock the deposit today.',
    from: 'Jordan Blake',
    date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'demo-3',
    subject: 'Beta login drop-off',
    snippet:
      'Beta users keep dropping at the magic-link step. Can we tighten the copy and retry UX this week?',
    from: 'Priya Nair',
    date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'demo-4',
    subject: 'Invoice #4821 — Acme Ops',
    snippet:
      'Accounts payable asked for the PDF again. Once you send it, we can close the month.',
    from: 'Finance Bot',
    date: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: 'demo-5',
    subject: 'Follow-up appointment',
    snippet:
      'Your cleaning is complete. Reply with a preferred time and we will confirm the chair for next Tuesday.',
    from: 'Bright Smile Clinic',
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: 'demo-6',
    subject: 'Investor update draft',
    snippet:
      'Keep it to three slides: growth, retention, and the hiring plan. Please review the outline by Thursday noon.',
    from: 'Alex Rivera',
    date: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
]

export const DEMO_TASKS: Omit<Task, 'completed'>[] = rawEmailsToTasks(DEMO_EMAILS)
