# simple-todo-list-app-51946-51965

Todo List Web App (React + Vite)

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Test
```bash
npm run test
```

## LocalStorage persistence utilities

Todo persistence is implemented in a framework-agnostic module under `src/storage`.

### Usage snippet

```ts
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  loadTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleComplete,
} from "./src/storage";

console.log("Using key:", STORAGE_KEY, "schema:", SCHEMA_VERSION);

const initial = loadTodos();

const afterAdd = addTodo({ title: "Buy milk", priority: "high" });

const afterEdit = updateTodo(afterAdd[0].id, {
  description: "2% if available",
});

const afterToggle = toggleComplete(afterAdd[0].id);

const afterDelete = deleteTodo(afterAdd[0].id);
```

Notes:
- `loadTodos()` performs safe JSON parsing, validates items, applies defaults, and performs minimal schema migration.
- All CRUD functions persist to `localStorage` and return the updated list.
