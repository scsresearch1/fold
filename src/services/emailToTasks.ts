import { translateEmailToAction } from './actionItems'
import type { RawEmail, Task } from '../types'

export function rawEmailsToTasks(emails: RawEmail[]): Task[] {
  return emails.map((email) => {
    const action = translateEmailToAction({
      subject: email.subject,
      snippet: email.snippet,
      from: email.from,
    })

    return {
      id: email.id,
      threadId: email.threadId,
      title: action.title,
      summary: action.summary,
      verb: action.verb,
      originalSubject: action.originalSubject,
      from: email.from,
      date: email.date,
      completed: false,
    }
  })
}
