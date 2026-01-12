import React, { useEffect, useMemo, useReducer } from "react";
import "./styles/app.css";

import type { Todo, TodoPriority } from "./storage";
import {
  addTodo,
  clearTodos,
  deleteTodo,
  getCounts,
  loadTodos,
  toggleComplete,
  updateTodo,
} from "./storage";

import { Header, TodoForm, TodoList, ConfirmDialog } from "./components";

type Filter = "all" | "active" | "completed";
type SortKey = "updatedAt" | "createdAt" | "priority" | "title";
type SortDirection = "asc" | "desc";

type State = {
  todos: Todo[];
  filter: Filter;
  searchText: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
  editingId: string | null;
  confirmDialog: {
    isOpen: boolean;
    type: "clearAll" | "clearCompleted" | null;
    title: string;
    message: string;
  };
};

type Action =
  | { type: "INIT"; todos: Todo[] }
  | { type: "SET_FILTER"; filter: Filter }
  | { type: "SET_SEARCH"; searchText: string }
  | { type: "SET_SORT"; sortKey: SortKey; sortDirection: SortDirection }
  | { type: "START_EDIT"; id: string }
  | { type: "STOP_EDIT" }
  | { type: "APPLY_TODOS"; todos: Todo[] }
  | { type: "SHOW_CONFIRM"; dialogType: "clearAll" | "clearCompleted"; title: string; message: string }
  | { type: "HIDE_CONFIRM" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return { ...state, todos: action.todos };
    case "SET_FILTER":
      return { ...state, filter: action.filter, editingId: null };
    case "SET_SEARCH":
      return { ...state, searchText: action.searchText, editingId: null };
    case "SET_SORT":
      return {
        ...state,
        sortKey: action.sortKey,
        sortDirection: action.sortDirection,
      };
    case "START_EDIT":
      return { ...state, editingId: action.id };
    case "STOP_EDIT":
      return { ...state, editingId: null };
    case "APPLY_TODOS": {
      // If the currently edited todo was deleted, exit edit mode.
      const stillExists = state.editingId
        ? action.todos.some((t) => t.id === state.editingId)
        : true;
      return {
        ...state,
        todos: action.todos,
        editingId: stillExists ? state.editingId : null,
      };
    }
    case "SHOW_CONFIRM":
      return {
        ...state,
        confirmDialog: {
          isOpen: true,
          type: action.dialogType,
          title: action.title,
          message: action.message,
        },
      };
    case "HIDE_CONFIRM":
      return {
        ...state,
        confirmDialog: {
          isOpen: false,
          type: null,
          title: "",
          message: "",
        },
      };
    default:
      return state;
  }
}

function comparePriority(p: TodoPriority): number {
  if (p === "high") return 3;
  if (p === "medium") return 2;
  return 1;
}

function sortTodos(todos: Todo[], key: SortKey, dir: SortDirection): Todo[] {
  const mult = dir === "desc" ? -1 : 1;
  return todos.slice().sort((a, b) => {
    if (key === "priority") {
      return (comparePriority(a.priority) - comparePriority(b.priority)) * mult;
    }
    if (key === "title") {
      return a.title.localeCompare(b.title) * mult;
    }
    // ISO timestamps compare lexicographically
    return a[key].localeCompare(b[key]) * mult;
  });
}

function filterTodos(todos: Todo[], filter: Filter): Todo[] {
  if (filter === "active") return todos.filter((t) => !t.completed);
  if (filter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function searchTodos(todos: Todo[], searchText: string): Todo[] {
  const q = searchText.trim().toLowerCase();
  if (q.length === 0) return todos;
  return todos.filter((t) => {
    const hay = `${t.title} ${t.description ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

// PUBLIC_INTERFACE
export default function App() {
  /** Root application component implementing CRUD flows with localStorage persistence. */
  const [state, dispatch] = useReducer(reducer, {
    todos: [],
    filter: "all",
    searchText: "",
    sortKey: "updatedAt",
    sortDirection: "desc",
    editingId: null,
    confirmDialog: {
      isOpen: false,
      type: null,
      title: "",
      message: "",
    },
  });

  useEffect(() => {
    dispatch({ type: "INIT", todos: loadTodos() });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not editing and no dialog open
      if (state.editingId || state.confirmDialog.isOpen) return;
      
      // Handle keyboard shortcuts with Ctrl/Cmd key
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "1":
            e.preventDefault();
            dispatch({ type: "SET_FILTER", filter: "all" });
            break;
          case "2":
            e.preventDefault();
            dispatch({ type: "SET_FILTER", filter: "active" });
            break;
          case "3":
            e.preventDefault();
            dispatch({ type: "SET_FILTER", filter: "completed" });
            break;
          case "f":
            e.preventDefault();
            // Focus search input
            document.getElementById("search")?.focus();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.editingId, state.confirmDialog.isOpen]);

  const counts = useMemo(() => getCounts(), [state.todos]);

  const filtered = useMemo(() => {
    const byFilter = filterTodos(state.todos, state.filter);
    const bySearch = searchTodos(byFilter, state.searchText);
    return sortTodos(bySearch, state.sortKey, state.sortDirection);
  }, [
    state.todos,
    state.filter,
    state.searchText,
    state.sortKey,
    state.sortDirection,
  ]);

  const editingTodo = useMemo(() => {
    if (!state.editingId) return null;
    return state.todos.find((t) => t.id === state.editingId) ?? null;
  }, [state.editingId, state.todos]);

  function applyPersisted(next: Todo[]) {
    // Centralized state update after storage call.
    dispatch({ type: "APPLY_TODOS", todos: next });
  }

  function handleAdd(draft: {
    title: string;
    description?: string;
    priority: TodoPriority;
  }) {
    const next = addTodo({
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
    });
    applyPersisted(next);
  }

  function handleEdit(draft: {
    title: string;
    description?: string;
    priority: TodoPriority;
  }) {
    if (!state.editingId) return;
    const next = updateTodo(state.editingId, {
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
    });
    applyPersisted(next);
    dispatch({ type: "STOP_EDIT" });
  }

  function handleToggle(id: string) {
    const next = toggleComplete(id);
    applyPersisted(next);
  }

  function handleDelete(id: string) {
    const next = deleteTodo(id);
    applyPersisted(next);
  }

  function handleClearCompleted() {
    const completedCount = state.todos.filter((t) => t.completed).length;
    dispatch({
      type: "SHOW_CONFIRM",
      dialogType: "clearCompleted",
      title: "Clear Completed Todos?",
      message: `This will permanently delete ${completedCount} completed todo${completedCount === 1 ? "" : "s"}. This action cannot be undone.`,
    });
  }

  function handleClearAll() {
    const totalCount = state.todos.length;
    dispatch({
      type: "SHOW_CONFIRM",
      dialogType: "clearAll",
      title: "Clear All Todos?",
      message: `This will permanently delete all ${totalCount} todo${totalCount === 1 ? "" : "s"}. This action cannot be undone.`,
    });
  }

  function executeClearAction() {
    if (state.confirmDialog.type === "clearCompleted") {
      // No bulk API in storage layer by design; we do best-effort by filtering and saving via update/delete.
      // To keep persistence consistent, we delete completed items one-by-one using the existing API.
      const completedIds = state.todos.filter((t) => t.completed).map((t) => t.id);
      let next = state.todos;
      for (const id of completedIds) {
        next = deleteTodo(id);
      }
      applyPersisted(next);
    } else if (state.confirmDialog.type === "clearAll") {
      clearTodos();
      applyPersisted([]);
    }
    dispatch({ type: "STOP_EDIT" });
  }

  const hasAny = state.todos.length > 0;
  const hasCompleted = state.todos.some((t) => t.completed);

  return (
    <div className="app">
      <main className="card" role="main" aria-label="Todo List Web App">
        <Header
          title="Todo List"
          subtitle="Add tasks, set priority, and keep everything saved locally."
          counts={counts}
          onClearAll={handleClearAll}
          onClearCompleted={handleClearCompleted}
          hasAny={hasAny}
          hasCompleted={hasCompleted}
        />

        <section className="panel" aria-label="Add todo">
          <h2 className="sectionTitle">Add a todo</h2>
          <TodoForm mode="add" onSubmit={handleAdd} />
        </section>

        <section className="panel" aria-label="Controls">
          <div className="controls">
            <div className="seg" role="tablist" aria-label="Filter todos">
              <button
                type="button"
                className={`seg__btn ${state.filter === "all" ? "is-active" : ""}`}
                onClick={() => dispatch({ type: "SET_FILTER", filter: "all" })}
                role="tab"
                aria-selected={state.filter === "all"}
              >
                All
              </button>
              <button
                type="button"
                className={`seg__btn ${state.filter === "active" ? "is-active" : ""}`}
                onClick={() =>
                  dispatch({ type: "SET_FILTER", filter: "active" })
                }
                role="tab"
                aria-selected={state.filter === "active"}
              >
                Active
              </button>
              <button
                type="button"
                className={`seg__btn ${state.filter === "completed" ? "is-active" : ""}`}
                onClick={() =>
                  dispatch({ type: "SET_FILTER", filter: "completed" })
                }
                role="tab"
                aria-selected={state.filter === "completed"}
              >
                Completed
              </button>
            </div>

            <div className="controlRow">
              <label className="label label--inline" htmlFor="search">
                Search
              </label>
              <input
                id="search"
                className="input input--sm"
                value={state.searchText}
                placeholder="title or description…"
                onChange={(e) =>
                  dispatch({ type: "SET_SEARCH", searchText: e.target.value })
                }
              />
            </div>

            <div className="controlRow">
              <label className="label label--inline" htmlFor="sort">
                Sort
              </label>
              <select
                id="sort"
                className="select select--sm"
                value={`${state.sortKey}:${state.sortDirection}`}
                onChange={(e) => {
                  const [sortKey, sortDirection] = e.target.value.split(":") as [
                    SortKey,
                    SortDirection,
                  ];
                  dispatch({ type: "SET_SORT", sortKey, sortDirection });
                }}
              >
                <option value="updatedAt:desc">Recently updated</option>
                <option value="createdAt:desc">Recently created</option>
                <option value="priority:desc">Priority (high → low)</option>
                <option value="title:asc">Title (A → Z)</option>
              </select>
            </div>
          </div>
        </section>

        {state.editingId && editingTodo ? (
          <section className="panel panel--edit" aria-label="Edit todo">
            <h2 className="sectionTitle">Edit todo</h2>
            <TodoForm
              mode="edit"
              initial={editingTodo}
              onSubmit={handleEdit}
              onCancel={() => dispatch({ type: "STOP_EDIT" })}
            />
          </section>
        ) : null}

        <section className="panel" aria-label="Todo list">
          <h2 className="sectionTitle">Your todos</h2>
          <TodoList
            todos={filtered}
            editingId={state.editingId}
            onToggleComplete={handleToggle}
            onStartEdit={(id) => dispatch({ type: "START_EDIT", id })}
            onDelete={handleDelete}
            emptyTitle={
              state.searchText.trim().length > 0
                ? "No matching todos"
                : "No todos yet"
            }
            emptyDescription={
              state.searchText.trim().length > 0
                ? "Try a different search term."
                : "Add your first task using the form above."
            }
          />
        </section>

        <footer className="footer">
          <span className="footer__muted">
            Stored locally in your browser (localStorage).
          </span>
          <div className="footer__shortcuts" aria-label="Keyboard shortcuts">
            <span className="footer__muted">
              Shortcuts: Ctrl+1/2/3 (filter), Ctrl+F (search)
            </span>
          </div>
        </footer>

        <ConfirmDialog
          isOpen={state.confirmDialog.isOpen}
          title={state.confirmDialog.title}
          message={state.confirmDialog.message}
          confirmLabel={state.confirmDialog.type === "clearAll" ? "Delete All" : "Delete Completed"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={executeClearAction}
          onCancel={() => dispatch({ type: "HIDE_CONFIRM" })}
        />
      </main>
    </div>
  );
}
