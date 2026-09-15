import type { Task } from '../types'
import { TaskItem } from './TaskItem'

type TaskListProps = {
  tasks: Task[]
  onToggle: (id: string) => void
}

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-panel">
        <p className="empty-title">Inbox is clear</p>
        <p className="empty-copy">No messages to fold into tasks right now.</p>
      </div>
    )
  }

  return (
    <ul className="task-list" role="list">
      {tasks.map((task, index) => (
        <TaskItem key={task.id} task={task} index={index} onToggle={onToggle} />
      ))}
    </ul>
  )
}
