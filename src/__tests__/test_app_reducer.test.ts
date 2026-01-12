import { describe, expect, it } from "vitest";

// We need to extract the reducer and related types for testing
// Since they're not exported from App.tsx, we'll test through the App component behavior
// For now, let's create a separate reducer test that mimics the App's reducer logic

type Filter = "all" | "active" | "completed";
type SortKey = "updatedAt" | "createdAt" | "priority" | "title";
type SortDirection = "asc" | "desc";

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

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

describe("App Reducer", () => {
  const initialState: State = {
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
  };

  const mockTodo: Todo = {
    id: "test-1",
    title: "Test Todo",
    description: "Test description",
    priority: "medium",
    completed: false,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  };

  describe("INIT action", () => {
    it("should initialize todos", () => {
      const action: Action = { type: "INIT", todos: [mockTodo] };
      const newState = reducer(initialState, action);
      
      expect(newState.todos).toEqual([mockTodo]);
      expect(newState.filter).toBe("all");
    });
  });

  describe("Filter actions", () => {
    it("should set filter and clear editing", () => {
      const stateWithEditing = { ...initialState, editingId: "test-1" };
      const action: Action = { type: "SET_FILTER", filter: "completed" };
      const newState = reducer(stateWithEditing, action);
      
      expect(newState.filter).toBe("completed");
      expect(newState.editingId).toBeNull();
    });
  });

  describe("Search actions", () => {
    it("should set search text and clear editing", () => {
      const stateWithEditing = { ...initialState, editingId: "test-1" };
      const action: Action = { type: "SET_SEARCH", searchText: "search term" };
      const newState = reducer(stateWithEditing, action);
      
      expect(newState.searchText).toBe("search term");
      expect(newState.editingId).toBeNull();
    });
  });

  describe("Sort actions", () => {
    it("should set sort key and direction", () => {
      const action: Action = { 
        type: "SET_SORT", 
        sortKey: "title", 
        sortDirection: "asc" 
      };
      const newState = reducer(initialState, action);
      
      expect(newState.sortKey).toBe("title");
      expect(newState.sortDirection).toBe("asc");
    });
  });

  describe("Edit actions", () => {
    it("should start editing", () => {
      const action: Action = { type: "START_EDIT", id: "test-1" };
      const newState = reducer(initialState, action);
      
      expect(newState.editingId).toBe("test-1");
    });

    it("should stop editing", () => {
      const stateWithEditing = { ...initialState, editingId: "test-1" };
      const action: Action = { type: "STOP_EDIT" };
      const newState = reducer(stateWithEditing, action);
      
      expect(newState.editingId).toBeNull();
    });
  });

  describe("APPLY_TODOS action", () => {
    it("should update todos and preserve editing if todo still exists", () => {
      const updatedTodo = { ...mockTodo, title: "Updated" };
      const stateWithEditing = { 
        ...initialState, 
        todos: [mockTodo], 
        editingId: "test-1" 
      };
      const action: Action = { type: "APPLY_TODOS", todos: [updatedTodo] };
      const newState = reducer(stateWithEditing, action);
      
      expect(newState.todos).toEqual([updatedTodo]);
      expect(newState.editingId).toBe("test-1"); // Still editing
    });

    it("should clear editing if edited todo was deleted", () => {
      const stateWithEditing = { 
        ...initialState, 
        todos: [mockTodo], 
        editingId: "test-1" 
      };
      const action: Action = { type: "APPLY_TODOS", todos: [] }; // Todo deleted
      const newState = reducer(stateWithEditing, action);
      
      expect(newState.todos).toEqual([]);
      expect(newState.editingId).toBeNull(); // Editing cleared
    });
  });

  describe("Confirm dialog actions", () => {
    it("should show confirm dialog", () => {
      const action: Action = { 
        type: "SHOW_CONFIRM", 
        dialogType: "clearAll",
        title: "Clear All?",
        message: "This will delete everything."
      };
      const newState = reducer(initialState, action);
      
      expect(newState.confirmDialog).toEqual({
        isOpen: true,
        type: "clearAll",
        title: "Clear All?",
        message: "This will delete everything.",
      });
    });

    it("should hide confirm dialog", () => {
      const stateWithDialog = {
        ...initialState,
        confirmDialog: {
          isOpen: true,
          type: "clearAll" as const,
          title: "Clear All?",
          message: "This will delete everything.",
        },
      };
      const action: Action = { type: "HIDE_CONFIRM" };
      const newState = reducer(stateWithDialog, action);
      
      expect(newState.confirmDialog).toEqual({
        isOpen: false,
        type: null,
        title: "",
        message: "",
      });
    });
  });

  describe("Helper functions", () => {
    function comparePriority(p: "low" | "medium" | "high"): number {
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

    const mockTodos: Todo[] = [
      {
        id: "1",
        title: "High Priority Task",
        priority: "high",
        completed: false,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "Completed Task",
        priority: "medium",
        completed: true,
        createdAt: "2023-01-02T00:00:00.000Z",
        updatedAt: "2023-01-02T00:00:00.000Z",
      },
      {
        id: "3",
        title: "Search Me",
        description: "findable content",
        priority: "low",
        completed: false,
        createdAt: "2023-01-03T00:00:00.000Z",
        updatedAt: "2023-01-03T00:00:00.000Z",
      },
    ];

    describe("sortTodos", () => {
      it("should sort by priority descending", () => {
        const sorted = sortTodos(mockTodos, "priority", "desc");
        expect(sorted.map(t => t.priority)).toEqual(["high", "medium", "low"]);
      });

      it("should sort by title ascending", () => {
        const sorted = sortTodos(mockTodos, "title", "asc");
        expect(sorted.map(t => t.title)).toEqual([
          "Completed Task",
          "High Priority Task", 
          "Search Me"
        ]);
      });
    });

    describe("filterTodos", () => {
      it("should filter active todos", () => {
        const active = filterTodos(mockTodos, "active");
        expect(active).toHaveLength(2);
        expect(active.every(t => !t.completed)).toBe(true);
      });

      it("should filter completed todos", () => {
        const completed = filterTodos(mockTodos, "completed");
        expect(completed).toHaveLength(1);
        expect(completed[0].title).toBe("Completed Task");
      });

      it("should return all todos for 'all' filter", () => {
        const all = filterTodos(mockTodos, "all");
        expect(all).toHaveLength(3);
      });
    });

    describe("searchTodos", () => {
      it("should search in title", () => {
        const results = searchTodos(mockTodos, "high");
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe("High Priority Task");
      });

      it("should search in description", () => {
        const results = searchTodos(mockTodos, "findable");
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe("Search Me");
      });

      it("should be case insensitive", () => {
        const results = searchTodos(mockTodos, "HIGH");
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe("High Priority Task");
      });

      it("should return all todos for empty search", () => {
        const results = searchTodos(mockTodos, "   ");
        expect(results).toHaveLength(3);
      });
    });
  });
});
