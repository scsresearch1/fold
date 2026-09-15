import { translateEmailToAction } from './actionItems'
import type { RawEmail, Task } from '../types'

export function rawEmailsToTasks(emails: RawEmail[]): Task[] {
  return emails.map((email) => {
    const action = translateEmailToAction({
      subject: email.subject,
      snippet: email.snippet,
      from: email.from,
    })

    const completed = email.replied === true || email.unread === false

    return {
      id: email.id,
      threadId: email.threadId,
      title: action.title,
      summary: action.summary,
      verb: action.verb,
      originalSubject: action.originalSubject,
      from: email.from,
      date: email.date,
      completed,
    }
  })
}

/** Merge fresh unread-derived tasks with previous ones; mail that left unread becomes completed. */
export function mergeMailboxTasks(previous: Task[], incoming: Task[]): Task[] {
  const byId = new Map<string, Task>()

  for (const task of previous) {
    byId.set(task.id, task)
  }

  const incomingIds = new Set(incoming.map((t) => t.id))

  for (const task of incoming) {
    byId.set(task.id, task)
  }

  for (const [id, task] of byId) {
    if (!incomingIds.has(id) && !task.completed) {
      byId.set(id, { ...task, completed: true })
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}
