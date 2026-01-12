import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// Mock the storage functions to avoid actual localStorage usage in tests
let mockTodos: any[] = [];

vi.mock("../storage", () => {
  return {
    loadTodos: vi.fn(() => mockTodos),
    saveTodos: vi.fn((todos) => { mockTodos = todos; }),
    addTodo: vi.fn((input) => {
      const newTodo = {
        id: `mock-${Date.now()}`,
        title: input.title,
        description: input.description,
        priority: input.priority || "medium",
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTodos = [newTodo, ...mockTodos];
      return mockTodos;
    }),
    updateTodo: vi.fn((id, patch) => {
      const index = mockTodos.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTodos[index] = { 
          ...mockTodos[index], 
          ...patch, 
          updatedAt: new Date().toISOString() 
        };
      }
      return mockTodos;
    }),
    deleteTodo: vi.fn((id) => {
      mockTodos = mockTodos.filter(t => t.id !== id);
      return mockTodos;
    }),
    toggleComplete: vi.fn((id) => {
      const index = mockTodos.findIndex(t => t.id === id);
      if (index !== -1) {
        mockTodos[index] = { 
          ...mockTodos[index], 
          completed: !mockTodos[index].completed,
          updatedAt: new Date().toISOString() 
        };
      }
      return mockTodos;
    }),
    clearTodos: vi.fn(() => { mockTodos = []; }),
    getCounts: vi.fn(() => {
      const completed = mockTodos.filter(t => t.completed).length;
      return {
        total: mockTodos.length,
        completed,
        active: mockTodos.length - completed,
      };
    }),
  };
});

describe("App UI Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock todos before each test
    mockTodos.length = 0;
  });

  describe("Initial Render", () => {
    it("should render the main application elements", () => {
      render(<App />);
      
      expect(screen.getByText("Todo List")).toBeInTheDocument();
      expect(screen.getByText("Add a todo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("What needs doing?")).toBeInTheDocument();
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should show empty state when no todos", () => {
      render(<App />);
      
      expect(screen.getByText("No todos yet")).toBeInTheDocument();
      expect(screen.getByText("Add your first task using the form above.")).toBeInTheDocument();
    });

    it("should display correct initial counts", () => {
      render(<App />);
      
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  describe("Adding Todos", () => {
    it("should add a new todo with title only", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      const addButton = screen.getByRole("button", { name: /add todo/i });
      
      await user.type(titleInput, "New Test Todo");
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText("New Test Todo")).toBeInTheDocument();
      });
    });

    it("should add a todo with title, description, and priority", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      const descriptionInput = screen.getByPlaceholderText("Add more details…");
      const prioritySelect = screen.getByDisplayValue("Medium");
      const addButton = screen.getByRole("button", { name: /add todo/i });
      
      await user.type(titleInput, "Important Task");
      await user.type(descriptionInput, "This is very important");
      await user.selectOptions(prioritySelect, "high");
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText("Important Task")).toBeInTheDocument();
        expect(screen.getByText("This is very important")).toBeInTheDocument();
        expect(screen.getByText("high")).toBeInTheDocument();
      });
    });

    it("should not add todo with empty title", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const addButton = screen.getByRole("button", { name: /add todo/i });
      await user.click(addButton);
      
      expect(screen.getByText("Title is required.")).toBeInTheDocument();
      expect(screen.getByText("No todos yet")).toBeInTheDocument();
    });

    it("should clear form after successful add", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      const descriptionInput = screen.getByPlaceholderText("Add more details…");
      const addButton = screen.getByRole("button", { name: /add todo/i });
      
      await user.type(titleInput, "Test Todo");
      await user.type(descriptionInput, "Test description");
      await user.click(addButton);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue("");
        expect(descriptionInput).toHaveValue("");
      });
    });
  });

  describe("Todo List Display", () => {
    beforeEach(async () => {
      const { addTodo } = require("../storage");
      addTodo({ title: "First Todo", priority: "high" });
      addTodo({ title: "Second Todo", description: "With description", priority: "low" });
    });

    it("should display todos with correct information", () => {
      render(<App />);
      
      expect(screen.getByText("Second Todo")).toBeInTheDocument();
      expect(screen.getByText("With description")).toBeInTheDocument();
      expect(screen.getByText("low")).toBeInTheDocument();
      
      expect(screen.getByText("First Todo")).toBeInTheDocument();
      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("should show checkboxes for completion", () => {
      render(<App />);
      
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(2);
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it("should show edit and delete buttons", () => {
      render(<App />);
      
      expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
    });
  });

  describe("Todo Completion", () => {
    beforeEach(async () => {
      const { addTodo } = require("../storage");
      addTodo({ title: "Test Todo" });
    });

    it("should toggle todo completion", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe("Todo Editing", () => {
    beforeEach(async () => {
      const { addTodo } = require("../storage");
      addTodo({ title: "Original Title", description: "Original description" });
    });

    it("should enter edit mode when edit button clicked", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);
      
      expect(screen.getByText("Edit todo")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Original Title")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Original description")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should save edited todo", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);
      
      const titleInput = screen.getByDisplayValue("Original Title");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");
      
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText("Updated Title")).toBeInTheDocument();
        expect(screen.queryByText("Edit todo")).not.toBeInTheDocument();
      });
    });

    it("should cancel editing", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);
      
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.getByText("Original Title")).toBeInTheDocument();
      expect(screen.queryByText("Edit todo")).not.toBeInTheDocument();
    });
  });

  describe("Todo Deletion", () => {
    beforeEach(async () => {
      const { addTodo } = require("../storage");
      addTodo({ title: "Todo to Delete" });
    });

    it("should delete todo", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      expect(screen.getByText("Todo to Delete")).toBeInTheDocument();
      
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText("Todo to Delete")).not.toBeInTheDocument();
        expect(screen.getByText("No todos yet")).toBeInTheDocument();
      });
    });
  });

  describe("Filtering", () => {
    beforeEach(async () => {
      const { addTodo, toggleComplete } = require("../storage");
      const todos = addTodo({ title: "Active Todo" });
      addTodo({ title: "Another Active" });
      toggleComplete(todos[0].id);
    });

    it("should filter active todos", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const activeButton = screen.getByRole("tab", { name: /active/i });
      await user.click(activeButton);
      
      expect(screen.getByText("Active Todo")).toBeInTheDocument();
      expect(screen.getByText("Another Active")).toBeInTheDocument();
    });

    it("should filter completed todos", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const completedButton = screen.getByRole("tab", { name: /completed/i });
      await user.click(completedButton);
      
      expect(screen.queryByText("Active Todo")).not.toBeInTheDocument();
      expect(screen.queryByText("Another Active")).not.toBeInTheDocument();
    });
  });

  describe("Search", () => {
    beforeEach(async () => {
      const { addTodo } = require("../storage");
      addTodo({ title: "Searchable Todo" });
      addTodo({ title: "Other Task", description: "findable content" });
    });

    it("should search todos by title", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const searchInput = screen.getByPlaceholderText("title or description…");
      await user.type(searchInput, "searchable");
      
      await waitFor(() => {
        expect(screen.getByText("Searchable Todo")).toBeInTheDocument();
        expect(screen.queryByText("Other Task")).not.toBeInTheDocument();
      });
    });

    it("should search todos by description", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const searchInput = screen.getByPlaceholderText("title or description…");
      await user.type(searchInput, "findable");
      
      await waitFor(() => {
        expect(screen.getByText("Other Task")).toBeInTheDocument();
        expect(screen.queryByText("Searchable Todo")).not.toBeInTheDocument();
      });
    });
  });

  describe("Confirm Dialogs", () => {
    beforeEach(async () => {
      const { addTodo, toggleComplete } = require("../storage");
      const todos = addTodo({ title: "Active Todo" });
      addTodo({ title: "Completed Todo" });
      toggleComplete(todos[0].id);
    });

    it("should show confirm dialog for clear completed", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const clearCompletedButton = screen.getByRole("button", { name: /clear completed/i });
      await user.click(clearCompletedButton);
      
      expect(screen.getByText("Clear Completed Todos?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete completed/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should show confirm dialog for clear all", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const clearAllButton = screen.getByRole("button", { name: /clear all/i });
      await user.click(clearAllButton);
      
      expect(screen.getByText("Clear All Todos?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeInTheDocument();
    });

    it("should cancel confirm dialog", async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const clearAllButton = screen.getByRole("button", { name: /clear all/i });
      await user.click(clearAllButton);
      
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.queryByText("Clear All Todos?")).not.toBeInTheDocument();
      expect(screen.getByText("Active Todo")).toBeInTheDocument();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should handle filter shortcuts", async () => {
      render(<App />);
      
      // Test Ctrl+1 for All filter
      fireEvent.keyDown(document, { key: "1", ctrlKey: true });
      expect(screen.getByRole("tab", { name: /all/i })).toHaveClass("is-active");
      
      // Test Ctrl+2 for Active filter
      fireEvent.keyDown(document, { key: "2", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /active/i })).toHaveClass("is-active");
      });
      
      // Test Ctrl+3 for Completed filter
      fireEvent.keyDown(document, { key: "3", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /completed/i })).toHaveClass("is-active");
      });
    });

    it("should focus search on Ctrl+F", async () => {
      render(<App />);
      
      fireEvent.keyDown(document, { key: "f", ctrlKey: true });
      
      const searchInput = screen.getByPlaceholderText("title or description…");
      expect(searchInput).toHaveFocus();
    });
  });
});
