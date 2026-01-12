import React from "react";
import type { Todo } from "../../storage";

type TodoItemProps = {
  todo: Todo;
  isEditing: boolean;
  onToggleComplete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

// PUBLIC_INTERFACE
export function TodoItem(props: TodoItemProps) {
  /** Single todo list row with actions. */
  const { todo, isEditing, onDelete, onStartEdit, onToggleComplete } = props;

  return (
    <li
      className={[
        "todo",
        todo.completed ? "todo--completed" : "",
        isEditing ? "todo--editing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="todo__left">
        <label className="check">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id)}
            aria-label={
              todo.completed ? "Mark as not completed" : "Mark as completed"
            }
          />
          <span className="check__box" aria-hidden="true" />
        </label>

        <div className="todo__content">
          <div className="todo__titleRow">
            <span className="todo__title">{todo.title}</span>
            <span
              className={[
                "badge",
                todo.priority === "high"
                  ? "badge--high"
                  : todo.priority === "low"
                    ? "badge--low"
                    : "badge--med",
              ].join(" ")}
              title={`Priority: ${todo.priority}`}
            >
              {todo.priority}
            </span>
          </div>

          {todo.description ? (
            <div className="todo__desc">{todo.description}</div>
          ) : null}

          <div className="todo__meta">
            Updated {new Date(todo.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="todo__actions" aria-label="Todo actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onStartEdit(todo.id)}
          disabled={isEditing}
          aria-disabled={isEditing}
          title="Edit todo"
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => onDelete(todo.id)}
          title="Delete todo"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
