import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "../todo/TodoForm";
import type { Todo } from "../../storage";

describe("TodoForm Component", () => {
  const mockSubmit = vi.fn();
  const mockCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Add Mode", () => {
    it("should render form in add mode", () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add todo/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });

    it("should submit with valid title", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      const submitButton = screen.getByRole("button", { name: /add todo/i });
      
      await user.type(titleInput, "New Todo");
      await user.click(submitButton);
      
      expect(mockSubmit).toHaveBeenCalledWith({
        title: "New Todo",
        priority: "medium",
      });
    });

    it("should submit with title, description, and priority", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      await user.type(screen.getByPlaceholderText("What needs doing?"), "Important Task");
      await user.type(screen.getByPlaceholderText("Add more details…"), "Very important");
      await user.selectOptions(screen.getByDisplayValue("Medium"), "high");
      await user.click(screen.getByRole("button", { name: /add todo/i }));
      
      expect(mockSubmit).toHaveBeenCalledWith({
        title: "Important Task",
        description: "Very important",
        priority: "high",
      });
    });

    it("should show validation error for empty title", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const submitButton = screen.getByRole("button", { name: /add todo/i });
      await user.click(submitButton);
      
      expect(screen.getByText("Title is required.")).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("should trim whitespace from inputs", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      await user.type(screen.getByPlaceholderText("What needs doing?"), "   Trimmed Title   ");
      await user.type(screen.getByPlaceholderText("Add more details…"), "   Trimmed Description   ");
      await user.click(screen.getByRole("button", { name: /add todo/i }));
      
      expect(mockSubmit).toHaveBeenCalledWith({
        title: "Trimmed Title",
        description: "Trimmed Description",
        priority: "medium",
      });
    });

    it("should not include description if empty", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      await user.type(screen.getByPlaceholderText("What needs doing?"), "No Description");
      await user.click(screen.getByRole("button", { name: /add todo/i }));
      
      expect(mockSubmit).toHaveBeenCalledWith({
        title: "No Description",
        priority: "medium",
      });
    });

    it("should clear form after successful submission", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      const descInput = screen.getByPlaceholderText("Add more details…");
      
      await user.type(titleInput, "Test Todo");
      await user.type(descInput, "Test Description");
      await user.selectOptions(screen.getByDisplayValue("Medium"), "high");
      await user.click(screen.getByRole("button", { name: /add todo/i }));
      
      expect(titleInput).toHaveValue("");
      expect(descInput).toHaveValue("");
      expect(screen.getByDisplayValue("High")).toBeInTheDocument(); // Priority preserved
    });
  });

  describe("Edit Mode", () => {
    const mockTodo: Todo = {
      id: "test-1",
      title: "Original Title",
      description: "Original Description",
      priority: "high",
      completed: false,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    };

    it("should render form in edit mode with initial values", () => {
      render(
        <TodoForm 
          mode="edit" 
          initial={mockTodo}
          onSubmit={mockSubmit} 
          onCancel={mockCancel}
        />
      );
      
      expect(screen.getByDisplayValue("Original Title")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Original Description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("High")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should submit updated values", async () => {
      const user = userEvent.setup();
      render(
        <TodoForm 
          mode="edit" 
          initial={mockTodo}
          onSubmit={mockSubmit} 
          onCancel={mockCancel}
        />
      );
      
      const titleInput = screen.getByDisplayValue("Original Title");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      
      expect(mockSubmit).toHaveBeenCalledWith({
        title: "Updated Title",
        description: "Original Description",
        priority: "high",
      });
    });

    it("should handle cancel action", async () => {
      const user = userEvent.setup();
      render(
        <TodoForm 
          mode="edit" 
          initial={mockTodo}
          onSubmit={mockSubmit} 
          onCancel={mockCancel}
        />
      );
      
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      
      expect(mockCancel).toHaveBeenCalled();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("should reset to initial values when props change", () => {
      const { rerender } = render(
        <TodoForm 
          mode="edit" 
          initial={mockTodo}
          onSubmit={mockSubmit} 
          onCancel={mockCancel}
        />
      );
      
      const newTodo = { ...mockTodo, title: "New Title", description: "New Description" };
      rerender(
        <TodoForm 
          mode="edit" 
          initial={newTodo}
          onSubmit={mockSubmit} 
          onCancel={mockCancel}
        />
      );
      
      expect(screen.getByDisplayValue("New Title")).toBeInTheDocument();
      expect(screen.getByDisplayValue("New Description")).toBeInTheDocument();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should submit on Ctrl+Enter", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      await user.type(titleInput, "Keyboard Submit");
      
      fireEvent.keyDown(titleInput, { key: "Enter", ctrlKey: true });
      
      expect(mockSubmit).toHaveBeenCalledWith({
        title: "Keyboard Submit",
        priority: "medium",
      });
    });

    it("should cancel edit on Escape", async () => {
      const user = userEvent.setup();
      const mockTodo: Todo = {
        id: "test-1",
        title: "Test",
        priority: "medium",
        completed: false,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };
      
      render(
        <TodoForm 
          mode="edit" 
          initial={mockTodo}
          onSubmit={mockSubmit} 
          onCancel={mockCancel}
        />
      );
      
      const titleInput = screen.getByDisplayValue("Test");
      fireEvent.keyDown(titleInput, { key: "Escape" });
      
      expect(mockCancel).toHaveBeenCalled();
    });

    it("should not cancel add mode on Escape", async () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      fireEvent.keyDown(titleInput, { key: "Escape" });
      
      // Should not call anything since no cancel handler in add mode
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels and ARIA attributes", () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute("aria-required", "true");
      
      const prioritySelect = screen.getByLabelText(/priority/i);
      expect(prioritySelect).toBeInTheDocument();
      
      const descTextarea = screen.getByLabelText(/description/i);
      expect(descTextarea).toBeInTheDocument();
    });

    it("should show error state with ARIA attributes", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      await user.click(screen.getByRole("button", { name: /add todo/i }));
      
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute("aria-invalid", "true");
      expect(titleInput).toHaveAttribute("aria-describedby");
      
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toBeInTheDocument();
    });

    it("should have proper form labeling", () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const form = screen.getByRole("form");
      expect(form).toHaveAttribute("aria-label", "Todo form");
    });
  });

  describe("Priority Options", () => {
    it("should have all priority options", () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const prioritySelect = screen.getByLabelText(/priority/i);
      const options = screen.getAllByRole("option");
      
      expect(options).toHaveLength(3);
      expect(screen.getByRole("option", { name: "Low" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Medium" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "High" })).toBeInTheDocument();
    });

    it("should default to medium priority", () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      expect(screen.getByDisplayValue("Medium")).toBeInTheDocument();
    });
  });

  describe("Focus Management", () => {
    it("should focus title input on mount", () => {
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      expect(titleInput).toHaveFocus();
    });

    it("should focus title input after validation error", async () => {
      const user = userEvent.setup();
      render(<TodoForm mode="add" onSubmit={mockSubmit} />);
      
      const submitButton = screen.getByRole("button", { name: /add todo/i });
      await user.click(submitButton);
      
      const titleInput = screen.getByPlaceholderText("What needs doing?");
      expect(titleInput).toHaveFocus();
    });
  });
});
