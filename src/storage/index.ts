/**
 * Framework-agnostic Todo persistence utilities for browser localStorage.
 *
 * This module is intentionally UI-independent: React components (or any other UI)
 * can call these functions to manage Todos and persist them locally.
 *
 * Design goals:
 * - Stable API surface for UI (CRUD + helpers).
 * - Safe parsing and normalization to avoid runtime crashes on corrupt storage.
 * - Minimal schema versioning support and future-proof payload format.
 */

export const STORAGE_KEY = "todo-list-web-app.todos";
/**
 * Current schema version written to localStorage payload.
 * Increment when changing the payload shape or Todo model semantics.
 */
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

export type TodoPatch = Partial<
  Pick<Todo, "title" | "description" | "priority" | "completed">
>;

export type TodoCreateInput = {
  title: string;
  description?: string;
  priority?: TodoPriority;
};

export type TodoSortKey = "createdAt" | "updatedAt" | "title" | "priority";
export type SortDirection = "asc" | "desc";

export type TodoQuery = {
  /** Return only completed items, only incomplete items, or all if undefined. */
  completed?: boolean;
  /** Case-insensitive match against title and description. */
  searchText?: string;
  /** Exact match on priority. */
  priority?: TodoPriority;
};

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
 * Returns `fallback` if parsing fails.
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

function upsertById(todos: Todo[], todo: Todo): Todo[] {
  const idx = todos.findIndex((t) => t.id === todo.id);
  if (idx === -1) return [todo, ...todos];
  const next = todos.slice();
  next[idx] = todo;
  return next;
}

function priorityRank(p: TodoPriority): number {
  switch (p) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function normalizeSortKey(key: TodoSortKey): TodoSortKey {
  // Defensive: ensure we only ever sort by supported keys.
  if (key === "createdAt" || key === "updatedAt" || key === "title" || key === "priority") {
    return key;
  }
  return "createdAt";
}

function compareTodos(a: Todo, b: Todo, key: TodoSortKey, direction: SortDirection): number {
  const dir = direction === "desc" ? -1 : 1;

  if (key === "priority") {
    return (priorityRank(a.priority) - priorityRank(b.priority)) * dir;
  }

  if (key === "title") {
    return a.title.localeCompare(b.title) * dir;
  }

  // ISO timestamps compare lexicographically safely when both are ISO strings.
  const av = a[key];
  const bv = b[key];
  return av.localeCompare(bv) * dir;
}

function matchesQuery(todo: Todo, query: TodoQuery): boolean {
  if (query.completed !== undefined && todo.completed !== query.completed) return false;
  if (query.priority !== undefined && todo.priority !== query.priority) return false;

  const q = (query.searchText ?? "").trim().toLowerCase();
  if (q.length > 0) {
    const hay =
      `${todo.title} ${todo.description ?? ""}`.trim().toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

// PUBLIC_INTERFACE
export function getSchemaVersion(): number {
  /** Returns the current schema version used by this module. */
  return SCHEMA_VERSION;
}

// PUBLIC_INTERFACE
export function readRawStorageValue(): string | null {
  /** Read the raw localStorage string value stored under STORAGE_KEY (or null if unavailable). */
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function clearTodos(): void {
  /** Clear todo storage (removes localStorage key). */
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
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

// PUBLIC_INTERFACE
export function createTodo(input: TodoCreateInput): Todo {
  /**
   * Create a new Todo object in-memory (does not persist).
   * Useful for UI that wants to stage state before calling save/upsert.
   */
  const ts = nowIso();
  return {
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
}

// PUBLIC_INTERFACE
export function addTodo(input: TodoCreateInput): Todo[] {
  /** Create a todo, persist, and return the updated list. */
  const todos = loadTodos();
  const todo = createTodo(input);

  const next = [todo, ...todos];
  saveTodos(next);
  return next;
}

// PUBLIC_INTERFACE
export function getTodoById(id: string): Todo | undefined {
  /** Get a todo by id from storage (undefined if not found). */
  return loadTodos().find((t) => t.id === id);
}

// PUBLIC_INTERFACE
export function updateTodo(id: string, patch: TodoPatch): Todo[] {
  /** Update an existing todo by id (no-op if not found), persist, and return the updated list. */
  const todos = loadTodos();
  const existing = todos.find((t) => t.id === id);
  if (!existing) return todos;

  const updated: Todo = {
    ...existing,
    title: typeof patch.title === "string" ? patch.title.trim() : existing.title,
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

// PUBLIC_INTERFACE
export function setComplete(id: string, completed: boolean): Todo[] {
  /** Set completion state for a todo by id (no-op if not found), persist, and return updated list. */
  return updateTodo(id, { completed });
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
export function upsertTodo(todo: Todo): Todo[] {
  /**
   * Upsert a full Todo object (insert if missing, replace if exists), persist, and return updated list.
   * The Todo is assumed to already be valid.
   */
  const todos = loadTodos();
  const next = upsertById(todos, { ...todo, updatedAt: nowIso() });
  saveTodos(next);
  return next;
}

// PUBLIC_INTERFACE
export function replaceAllTodos(todos: Todo[]): Todo[] {
  /**
   * Replace the entire collection with the provided todos, persist, and return saved list.
   * Useful for bulk operations after sorting/filtering in UI.
   */
  saveTodos(todos);
  return todos;
}

// PUBLIC_INTERFACE
export function queryTodos(query: TodoQuery = {}): Todo[] {
  /** Query todos from storage using simple filters (completed/priority/searchText). */
  return loadTodos().filter((t) => matchesQuery(t, query));
}

// PUBLIC_INTERFACE
export function listTodosSorted(options?: {
  query?: TodoQuery;
  sortKey?: TodoSortKey;
  direction?: SortDirection;
}): Todo[] {
  /**
   * Load todos, optionally filter by query, then return a sorted copy.
   * Sorting is stable enough for UI lists and does not persist sorting.
   */
  const { query, sortKey = "createdAt", direction = "desc" } = options ?? {};
  const key = normalizeSortKey(sortKey);

  const base = query ? queryTodos(query) : loadTodos();
  return base.slice().sort((a, b) => compareTodos(a, b, key, direction));
}

// PUBLIC_INTERFACE
export function getCounts(): { total: number; completed: number; active: number } {
  /** Get counts useful for UI badges/filters. */
  const todos = loadTodos();
  const completed = todos.filter((t) => t.completed).length;
  return { total: todos.length, completed, active: todos.length - completed };
}

// PUBLIC_INTERFACE
export function storageApi(): {
  /** Current schema version. */
  schemaVersion: number;
  /** Load validated todos from storage. */
  loadTodos: typeof loadTodos;
  /** Save a provided todo list to storage. */
  saveTodos: typeof saveTodos;
  /** Create a Todo object without persisting. */
  createTodo: typeof createTodo;
  /** Create and persist a new todo. */
  addTodo: typeof addTodo;
  /** Get a todo by id. */
  getTodoById: typeof getTodoById;
  /** Update a todo by id. */
  updateTodo: typeof updateTodo;
  /** Toggle completion for a todo by id. */
  toggleComplete: typeof toggleComplete;
  /** Set completion state for a todo by id. */
  setComplete: typeof setComplete;
  /** Delete a todo by id. */
  deleteTodo: typeof deleteTodo;
  /** Upsert a full todo object. */
  upsertTodo: typeof upsertTodo;
  /** Replace all todos. */
  replaceAllTodos: typeof replaceAllTodos;
  /** Query todos. */
  queryTodos: typeof queryTodos;
  /** Query + sort. */
  listTodosSorted: typeof listTodosSorted;
  /** Count summary for UI. */
  getCounts: typeof getCounts;
  /** Clear storage. */
  clearTodos: typeof clearTodos;
  /** Read raw localStorage string under key (debug). */
  readRawStorageValue: typeof readRawStorageValue;
} {
  /**
   * Convenience "hook-like" accessor for UI modules:
   * `const api = storageApi(); api.addTodo(...);`
   *
   * This is not a React hook; it is safe to call anywhere and returns stable references.
   */
  return {
    schemaVersion: SCHEMA_VERSION,
    loadTodos,
    saveTodos,
    createTodo,
    addTodo,
    getTodoById,
    updateTodo,
    toggleComplete,
    setComplete,
    deleteTodo,
    upsertTodo,
    replaceAllTodos,
    queryTodos,
    listTodosSorted,
    getCounts,
    clearTodos,
    readRawStorageValue,
  };
}
