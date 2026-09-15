import { formatRelative } from '../utils/format'
import type { Task } from '../types'

type TaskItemProps = {
  task: Task
  index: number
  onToggle: (id: string) => void
}

export function TaskItem({ task, index, onToggle }: TaskItemProps) {
  return (
    <li
      className={`task-item ${task.completed ? 'is-done' : ''}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <label className="task-check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <span className="task-box" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </label>

      <div className="task-body">
        <div className="task-meta">
          <span className={`verb-chip verb-${task.verb.toLowerCase().replace(/\s+/g, '-')}`}>
            {task.verb}
          </span>
          <span className="task-from">{task.from}</span>
          <span className="task-dot" aria-hidden="true" />
          <time dateTime={task.date}>{formatRelative(task.date)}</time>
        </div>
        <h3 className="task-title">{task.title}</h3>
        <p className="task-summary">{task.summary}</p>
        {task.originalSubject !== task.title && (
          <p className="task-original">
            From email: <span>{task.originalSubject}</span>
          </p>
        )}
      </div>
    </li>
  )
}
