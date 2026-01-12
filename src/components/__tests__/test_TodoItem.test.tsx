import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "../todo/TodoItem";
import type { Todo } from "../../storage";

describe("TodoItem Component", () => {
  const mockTodo: Todo = {
    id: "test-1",
    title: "Test Todo",
    description: "Test Description",
    priority: "medium",
    completed: false,
    createdAt: "2023-01-01T12:00:00.000Z",
    updatedAt: "2023-01-01T12:30:00.000Z",
  };

  const mockHandlers = {
    onToggleComplete: vi.fn(),
    onStartEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render todo with all information", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Test Todo")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    it("should render todo without description", () => {
      const todoWithoutDesc = { ...mockTodo, description: undefined };
      render(
        <TodoItem
          todo={todoWithoutDesc}
          isEditing={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Test Todo")).toBeInTheDocument();
      expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
    });

    it("should render checkbox unchecked for incomplete todo", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });

    it("should render checkbox checked for completed todo", () => {
      const completedTodo = { ...mockTodo, completed: true };
      render(
        <TodoItem
          todo={completedTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });
  });

  describe("Priority Badges", () => {
    it("should render high priority badge", () => {
      const highPriorityTodo = { ...mockTodo, priority: "high" as const };
      render(
        <TodoItem
          todo={highPriorityTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const badge = screen.getByText("high");
      expect(badge).toHaveClass("badge--high");
      expect(badge).toHaveAttribute("title", "Priority: high");
    });

    it("should render medium priority badge", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const badge = screen.getByText("medium");
      expect(badge).toHaveClass("badge--med");
    });

    it("should render low priority badge", () => {
      const lowPriorityTodo = { ...mockTodo, priority: "low" as const };
      render(
        <TodoItem
          todo={lowPriorityTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const badge = screen.getByText("low");
      expect(badge).toHaveClass("badge--low");
    });
  });

  describe("User Interactions", () => {
    it("should call onToggleComplete when checkbox is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(mockHandlers.onToggleComplete).toHaveBeenCalledWith("test-1");
    });

    it("should call onStartEdit when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit todo/i });
      await user.click(editButton);

      expect(mockHandlers.onStartEdit).toHaveBeenCalledWith("test-1");
    });

    it("should call onDelete when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete todo/i });
      await user.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith("test-1");
    });
  });

  describe("Editing State", () => {
    it("should apply editing class when isEditing is true", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={true}
          {...mockHandlers}
        />
      );

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("todo--editing");
    });

    it("should disable edit button when editing", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={true}
          {...mockHandlers}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit todo/i });
      expect(editButton).toBeDisabled();
      expect(editButton).toHaveAttribute("aria-disabled", "true");
    });

    it("should not disable delete button when editing", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={true}
          {...mockHandlers}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete todo/i });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("Completed State", () => {
    it("should apply completed class when todo is completed", () => {
      const completedTodo = { ...mockTodo, completed: true };
      render(
        <TodoItem
          todo={completedTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("todo--completed");
    });

    it("should have proper styling for completed todos", () => {
      const completedTodo = { ...mockTodo, completed: true };
      render(
        <TodoItem
          todo={completedTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      // The CSS classes should be applied - we can't test actual styling but can test classes
      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("todo--completed");
    });
  });

  describe("Accessibility", () => {
    it("should have proper checkbox labels", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const checkbox = screen.getByLabelText("Mark as completed");
      expect(checkbox).toBeInTheDocument();
    });

    it("should have proper checkbox label for completed todo", () => {
      const completedTodo = { ...mockTodo, completed: true };
      render(
        <TodoItem
          todo={completedTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const checkbox = screen.getByLabelText("Mark as not completed");
      expect(checkbox).toBeInTheDocument();
    });

    it("should have proper button labels", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole("button", { name: /edit todo/i })).toHaveAttribute("title", "Edit todo");
      expect(screen.getByRole("button", { name: /delete todo/i })).toHaveAttribute("title", "Delete todo");
    });

    it("should have proper actions labeling", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      const actionsContainer = screen.getByLabelText("Todo actions");
      expect(actionsContainer).toBeInTheDocument();
    });
  });

  describe("Timestamp Display", () => {
    it("should display formatted updated timestamp", () => {
      render(
        <TodoItem
          todo={mockTodo}
          isEditing={false}
          {...mockHandlers}
        />
      );

      // The timestamp should be formatted using toLocaleString
      const timestampElement = screen.getByText(/updated/i);
      expect(timestampElement).toBeInTheDocument();
      // We can't easily test the exact format since it's locale-dependent
    });
  });

  describe("Multiple States", () => {
    it("should handle completed and editing states together", () => {
      const completedTodo = { ...mockTodo, completed: true };
      render(
        <TodoItem
          todo={completedTodo}
          isEditing={true}
          {...mockHandlers}
        />
      );

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("todo--completed");
      expect(listItem).toHaveClass("todo--editing");
      
      const editButton = screen.getByRole("button", { name: /edit todo/i });
      expect(editButton).toBeDisabled();
    });
  });
});
