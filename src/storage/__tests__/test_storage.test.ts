import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  addTodo,
  clearTodos,
  createTodo,
  deleteTodo,
  getCounts,
  getTodoById,
  loadTodos,
  queryTodos,
  saveTodos,
  toggleComplete,
  updateTodo,
  listTodosSorted,
  readRawStorageValue,
  type Todo,
  type TodoCreateInput,
  type TodoQuery,
} from "../index";

describe("Storage Module", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Constants and Schema", () => {
    it("should have correct storage key and schema version", () => {
      expect(STORAGE_KEY).toBe("todo-list-web-app.todos");
      expect(SCHEMA_VERSION).toBe(1);
    });
  });

  describe("createTodo", () => {
    it("should create a valid todo with minimal input", () => {
      const input: TodoCreateInput = { title: "Test Todo" };
      const todo = createTodo(input);

      expect(todo).toMatchObject({
        title: "Test Todo",
        priority: "medium",
        completed: false,
      });
      expect(todo.id).toMatch(/^[0-9a-z]+-[0-9a-z]+$/);
      expect(new Date(todo.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(todo.updatedAt).getTime()).toBeGreaterThan(0);
      expect(todo.createdAt).toBe(todo.updatedAt);
    });

    it("should create a todo with full input", () => {
      const input: TodoCreateInput = {
        title: "  Test Todo  ",
        description: "  Test description  ",
        priority: "high",
      };
      const todo = createTodo(input);

      expect(todo).toMatchObject({
        title: "Test Todo",
        description: "  Test description  ", // Description is not trimmed in createTodo
        priority: "high",
        completed: false,
      });
    });

    it("should handle empty description", () => {
      const todo = createTodo({ title: "Test", description: "" });
      expect(todo.description).toBeUndefined();
    });

    it("should trim whitespace from title", () => {
      const todo = createTodo({
        title: "   Test Title   ",
        description: "   Test Description   ",
      });
      expect(todo.title).toBe("Test Title");
      expect(todo.description).toBe("   Test Description   "); // Description is not trimmed
    });
  });

  describe("loadTodos and saveTodos", () => {
    it("should return empty array when no todos in storage", () => {
      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    it("should save and load todos correctly", () => {
      const todo = createTodo({ title: "Test Todo" });
      saveTodos([todo]);

      const loaded = loadTodos();
      expect(loaded).toHaveLength(1);
      expect(loaded[0]).toEqual(todo);
    });

    it("should handle corrupted storage data", () => {
      localStorage.setItem(STORAGE_KEY, "invalid json");
      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    it("should migrate legacy array format", () => {
      const legacyTodo = {
        id: "test-id",
        title: "Legacy Todo",
        completed: false,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyTodo]));

      const todos = loadTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0]).toMatchObject({
        id: "test-id",
        title: "Legacy Todo",
        priority: "medium", // default priority added
        completed: false,
      });
    });

    it("should normalize invalid todo data", () => {
      const invalidData = {
        schemaVersion: 1,
        todos: [
          { id: "valid", title: "Valid Todo" },
          { id: "", title: "Invalid - empty ID" },
          { title: "Invalid - no ID" },
          { id: "valid2", title: "", completed: "not-boolean" },
          { id: "valid3", title: "Valid Todo 2", priority: "invalid" },
        ],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidData));

      const todos = loadTodos();
      expect(todos).toHaveLength(2); // Only valid todos should be loaded
      expect(todos[0].id).toBe("valid");
      expect(todos[1].id).toBe("valid3");
      expect(todos[1].priority).toBe("medium"); // Invalid priority normalized
    });
  });

  describe("addTodo", () => {
    it("should add a todo and persist to storage", () => {
      const result = addTodo({ title: "New Todo" });
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New Todo");
      
      const loaded = loadTodos();
      expect(loaded).toEqual(result);
    });

    it("should add todo to the beginning of the list", () => {
      addTodo({ title: "First Todo" });
      const result = addTodo({ title: "Second Todo" });
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Second Todo");
      expect(result[1].title).toBe("First Todo");
    });
  });

  describe("getTodoById", () => {
    it("should find todo by ID", () => {
      const todos = [createTodo({ title: "Test Todo" })];
      saveTodos(todos);

      const found = getTodoById(todos[0].id);
      expect(found).toEqual(todos[0]);
    });

    it("should return undefined for non-existent ID", () => {
      const found = getTodoById("non-existent");
      expect(found).toBeUndefined();
    });
  });

  describe("updateTodo", () => {
    let todoId: string;

    beforeEach(() => {
      const result = addTodo({ title: "Original Title", priority: "low" });
      todoId = result[0].id;
    });

    it("should update todo title", () => {
      const result = updateTodo(todoId, { title: "Updated Title" });
      expect(result[0].title).toBe("Updated Title");
      expect(result[0].priority).toBe("low"); // unchanged
    });

    it("should update todo description", () => {
      const result = updateTodo(todoId, { description: "New description" });
      expect(result[0].description).toBe("New description");
    });

    it("should update todo priority", () => {
      const result = updateTodo(todoId, { priority: "high" });
      expect(result[0].priority).toBe("high");
    });

    it("should update completion status", () => {
      const result = updateTodo(todoId, { completed: true });
      expect(result[0].completed).toBe(true);
    });

    it("should update updatedAt timestamp", () => {
      const original = getTodoById(todoId)!;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        const result = updateTodo(todoId, { title: "Updated" });
        expect(new Date(result[0].updatedAt).getTime()).toBeGreaterThan(
          new Date(original.updatedAt).getTime()
        );
      }, 10);
    });

    it("should remove description when set to empty string", () => {
      updateTodo(todoId, { description: "Some description" });
      const result = updateTodo(todoId, { description: "" });
      expect(result[0].description).toBeUndefined();
    });

    it("should do nothing for non-existent ID", () => {
      const original = loadTodos();
      const result = updateTodo("non-existent", { title: "Won't work" });
      expect(result).toEqual(original);
    });
  });

  describe("toggleComplete", () => {
    it("should toggle completion status", () => {
      const result = addTodo({ title: "Test Todo" });
      const todoId = result[0].id;

      // Toggle to completed
      const completed = toggleComplete(todoId);
      expect(completed[0].completed).toBe(true);

      // Toggle back to incomplete
      const incomplete = toggleComplete(todoId);
      expect(incomplete[0].completed).toBe(false);
    });

    it("should do nothing for non-existent ID", () => {
      const original = loadTodos();
      const result = toggleComplete("non-existent");
      expect(result).toEqual(original);
    });
  });

  describe("deleteTodo", () => {
    it("should delete todo by ID", () => {
      const firstTodo = addTodo({ title: "First Todo" });
      const secondTodo = addTodo({ title: "Second Todo" });
      
      const result = deleteTodo(firstTodo[0].id);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Second Todo");
    });

    it("should return unchanged array for non-existent ID", () => {
      const todos = addTodo({ title: "Test Todo" });
      const result = deleteTodo("non-existent");
      expect(result).toEqual(todos);
    });
  });

  describe("clearTodos", () => {
    it("should clear all todos from storage", () => {
      addTodo({ title: "Test Todo" });
      expect(loadTodos()).toHaveLength(1);
      
      clearTodos();
      expect(loadTodos()).toHaveLength(0);
      // After clearTodos + loadTodos, an empty payload is saved
      const raw = readRawStorageValue();
      expect(raw).toContain('"todos":[]');
    });
  });

  describe("queryTodos", () => {
    beforeEach(() => {
      const todos = [
        createTodo({ title: "Active High", priority: "high" }),
        createTodo({ title: "Active Medium", priority: "medium" }),
        { ...createTodo({ title: "Completed Low", priority: "low" }), completed: true },
        createTodo({ title: "Active with Description", description: "Find me" }),
      ];
      saveTodos(todos);
    });

    it("should filter by completion status", () => {
      const activeQuery: TodoQuery = { completed: false };
      const completedQuery: TodoQuery = { completed: true };
      
      const active = queryTodos(activeQuery);
      const completed = queryTodos(completedQuery);
      
      expect(active).toHaveLength(3);
      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe("Completed Low");
    });

    it("should filter by priority", () => {
      const highQuery: TodoQuery = { priority: "high" };
      const result = queryTodos(highQuery);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Active High");
    });

    it("should search by text in title and description", () => {
      const searchQuery: TodoQuery = { searchText: "find me" };
      const result = queryTodos(searchQuery);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Active with Description");
    });

    it("should combine multiple filters", () => {
      const combinedQuery: TodoQuery = { 
        completed: false, 
        priority: "medium" 
      };
      const result = queryTodos(combinedQuery);
      
      // There are 2 medium priority active todos: "Active Medium" and "Active with Description" (defaults to medium)
      expect(result).toHaveLength(2);
      const titles = result.map(t => t.title);
      expect(titles).toContain("Active Medium");
    });
  });

  describe("listTodosSorted", () => {
    beforeEach(() => {
      const todos = [
        createTodo({ title: "B Todo", priority: "low" }),
        createTodo({ title: "A Todo", priority: "high" }),
        createTodo({ title: "C Todo", priority: "medium" }),
      ];
      saveTodos(todos);
    });

    it("should sort by title ascending", () => {
      const result = listTodosSorted({ 
        sortKey: "title", 
        direction: "asc" 
      });
      
      expect(result.map(t => t.title)).toEqual(["A Todo", "B Todo", "C Todo"]);
    });

    it("should sort by priority descending", () => {
      const result = listTodosSorted({ 
        sortKey: "priority", 
        direction: "desc" 
      });
      
      expect(result.map(t => t.priority)).toEqual(["high", "medium", "low"]);
    });

    it("should combine query and sorting", () => {
      const result = listTodosSorted({ 
        query: { priority: "medium" },
        sortKey: "title",
        direction: "asc"
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("C Todo");
    });
  });

  describe("getCounts", () => {
    it("should return correct counts for empty storage", () => {
      const counts = getCounts();
      expect(counts).toEqual({ total: 0, completed: 0, active: 0 });
    });

    it("should return correct counts with mixed todos", () => {
      const todos = [
        createTodo({ title: "Active 1" }),
        createTodo({ title: "Active 2" }),
        { ...createTodo({ title: "Completed 1" }), completed: true },
      ];
      saveTodos(todos);

      const counts = getCounts();
      expect(counts).toEqual({ total: 3, completed: 1, active: 2 });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle localStorage quota exceeded", () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("Quota exceeded");
      });

      // Should not throw, just silently fail
      expect(() => {
        saveTodos([createTodo({ title: "Test" })]);
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it("should handle localStorage access denied", () => {
      const originalGetItem = localStorage.getItem;
      const mockGetItem = vi.fn().mockImplementation(() => {
        throw new Error("Access denied");
      });
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          ...localStorage,
          getItem: mockGetItem
        },
        writable: true
      });

      // Should return empty array when storage access fails
      const todos = loadTodos();
      expect(todos).toEqual([]);

      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          ...localStorage,
          getItem: originalGetItem
        },
        writable: true
      });
    });
  });

  describe("readRawStorageValue", () => {
    it("should return raw storage value", () => {
      const testData = JSON.stringify({ test: "data" });
      localStorage.setItem(STORAGE_KEY, testData);
      
      const raw = readRawStorageValue();
      expect(raw).toBe(testData);
    });

    it("should return null for empty storage", () => {
      localStorage.removeItem(STORAGE_KEY);
      const raw = readRawStorageValue();
      expect(raw).toBeNull();
    });
  });
});
