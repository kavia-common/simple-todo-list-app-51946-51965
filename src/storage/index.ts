/**
 * Framework-agnostic Todo persistence utilities for browser localStorage.
 *
 * This module is intentionally UI-independent: React components (or any other UI)
 * can call these functions to manage Todos and persist them locally.
 */

export const STORAGE_KEY = "todo-list-web-app.todos";
export const SCHEMA_VERSION = 1 as const;

export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  completed: boolean;
  /** ISO string */
  createdAt: string;
  /** ISO string */
  updatedAt: string;
}

type StoredPayloadV1 = {
  schemaVersion: typeof SCHEMA_VERSION;
  todos: Todo[];
};

const DEFAULT_PRIORITY: TodoPriority = "medium";

/** In non-browser environments (SSR/tests), localStorage may be unavailable. */
function getStorage(): Storage | null {
  try {
    // eslint-disable-next-line no-restricted-globals
    return typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : null;
  } catch {
    return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Simple ID generator.
 * Not cryptographically secure; adequate for local-only storage.
 */
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Safe JSON parsing with fallback.
 * Returns `fallback` if parsing fails or the parsed value is not an object/array/primitive as expected by caller.
 */
function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPriority(value: unknown): value is TodoPriority {
  return value === "low" || value === "medium" || value === "high";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toIsoOrNow(value: unknown): string {
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return nowIso();
}

/**
 * Validate and normalize a Todo-like object.
 * Returns null if it cannot be coerced into a valid Todo.
 */
function normalizeTodo(value: unknown): Todo | null {
  if (!isObject(value)) return null;

  const id = value.id;
  const title = value.title;

  if (!isNonEmptyString(id) || !isNonEmptyString(title)) return null;

  const description =
    typeof value.description === "string" && value.description.trim().length > 0
      ? value.description
      : undefined;

  const priority: TodoPriority = isPriority(value.priority)
    ? value.priority
    : DEFAULT_PRIORITY;

  const completed = typeof value.completed === "boolean" ? value.completed : false;

  // Ensure timestamps exist and are valid ISO strings
  const createdAt = toIsoOrNow(value.createdAt);
  const updatedAt = toIsoOrNow(value.updatedAt);

  return {
    id,
    title: title.trim(),
    description,
    priority,
    completed,
    createdAt,
    updatedAt,
  };
}

/**
 * Minimal migration/versioning support:
 * - If value is an array: treat as legacy "todos only" storage and wrap into v1.
 * - If value is an object but missing/unknown schemaVersion: attempt best-effort to read `todos`.
 * - Always re-save normalized v1 payload on successful load to keep data clean.
 */
function normalizePayload(raw: unknown): StoredPayloadV1 {
  // Legacy format: raw todos array
  if (Array.isArray(raw)) {
    const todos = raw.map(normalizeTodo).filter((t): t is Todo => t !== null);
    return { schemaVersion: SCHEMA_VERSION, todos };
  }

  // Current format (object)
  if (isObject(raw)) {
    const todosRaw = raw.todos;
    const todosArr = Array.isArray(todosRaw) ? todosRaw : [];
    const todos = todosArr
      .map(normalizeTodo)
      .filter((t): t is Todo => t !== null);

    // Unknown/missing schemaVersion is treated as legacy-ish but accepted.
    return { schemaVersion: SCHEMA_VERSION, todos };
  }

  return { schemaVersion: SCHEMA_VERSION, todos: [] };
}

/** Persist a normalized payload. */
function savePayload(payload: StoredPayloadV1): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or serialization errors; callers can continue using in-memory state.
  }
}

// PUBLIC_INTERFACE
export function loadTodos(): Todo[] {
  /** Load and validate todos from localStorage (with migration and normalization). */
  const storage = getStorage();
  if (!storage) return [];

  const raw = safeJsonParse<unknown>(storage.getItem(STORAGE_KEY), null);
  const payload = normalizePayload(raw);

  // Re-save normalized payload (migration + cleanup)
  savePayload(payload);

  return payload.todos;
}

// PUBLIC_INTERFACE
export function saveTodos(todos: Todo[]): void {
  /** Save todos to localStorage (assumes todos are already valid). */
  const payload: StoredPayloadV1 = {
    schemaVersion: SCHEMA_VERSION,
    todos,
  };
  savePayload(payload);
}

function upsertById(todos: Todo[], todo: Todo): Todo[] {
  const idx = todos.findIndex((t) => t.id === todo.id);
  if (idx === -1) return [todo, ...todos];
  const next = todos.slice();
  next[idx] = todo;
  return next;
}

// PUBLIC_INTERFACE
export function addTodo(input: {
  title: string;
  description?: string;
  priority?: TodoPriority;
}): Todo[] {
  /** Create a todo, persist, and return the updated list. */
  const todos = loadTodos();

  const ts = nowIso();
  const todo: Todo = {
    id: createId(),
    title: input.title.trim(),
    description:
      typeof input.description === "string" && input.description.trim().length > 0
        ? input.description
        : undefined,
    priority: input.priority ?? DEFAULT_PRIORITY,
    completed: false,
    createdAt: ts,
    updatedAt: ts,
  };

  const next = [todo, ...todos];
  saveTodos(next);
  return next;
}

// PUBLIC_INTERFACE
export function updateTodo(
  id: string,
  patch: Partial<Pick<Todo, "title" | "description" | "priority" | "completed">>,
): Todo[] {
  /** Update an existing todo by id (no-op if not found), persist, and return the updated list. */
  const todos = loadTodos();
  const existing = todos.find((t) => t.id === id);
  if (!existing) return todos;

  const updated: Todo = {
    ...existing,
    title:
      typeof patch.title === "string" ? patch.title.trim() : existing.title,
    description:
      patch.description === undefined
        ? existing.description
        : typeof patch.description === "string" && patch.description.trim().length > 0
          ? patch.description
          : undefined,
    priority: patch.priority ?? existing.priority,
    completed: patch.completed ?? existing.completed,
    updatedAt: nowIso(),
  };

  const next = upsertById(todos, updated);
  saveTodos(next);
  return next;
}

// PUBLIC_INTERFACE
export function deleteTodo(id: string): Todo[] {
  /** Delete a todo by id, persist, and return the updated list. */
  const todos = loadTodos();
  const next = todos.filter((t) => t.id !== id);
  // Avoid unnecessary write if nothing changed
  if (next.length === todos.length) return todos;
  saveTodos(next);
  return next;
}

// PUBLIC_INTERFACE
export function toggleComplete(id: string): Todo[] {
  /** Toggle completion for a todo by id, persist, and return the updated list. */
  const todos = loadTodos();
  const existing = todos.find((t) => t.id === id);
  if (!existing) return todos;

  const updated: Todo = {
    ...existing,
    completed: !existing.completed,
    updatedAt: nowIso(),
  };

  const next = upsertById(todos, updated);
  saveTodos(next);
  return next;
}
