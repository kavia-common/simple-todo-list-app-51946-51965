import React from "react";
import type { Todo } from "../../storage";
import { EmptyState } from "./EmptyState";
import { TodoItem } from "./TodoItem";

type TodoListProps = {
  todos: Todo[];
  editingId: string | null;
  onToggleComplete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onDelete: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

// PUBLIC_INTERFACE
export function TodoList(props: TodoListProps) {
  /** Renders the todo list with an empty state. */
  const {
    todos,
    editingId,
    onDelete,
    onStartEdit,
    onToggleComplete,
    emptyTitle = "No todos yet",
    emptyDescription = "Add your first task using the form above.",
  } = props;

  if (todos.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="list" aria-label="Todo list">
      {todos.map((t) => (
        <TodoItem
          key={t.id}
          todo={t}
          isEditing={editingId === t.id}
          onDelete={onDelete}
          onStartEdit={onStartEdit}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </ul>
  );
}
