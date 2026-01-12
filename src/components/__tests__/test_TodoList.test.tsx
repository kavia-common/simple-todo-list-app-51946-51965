import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoList } from "../todo/TodoList";
import type { Todo } from "../../storage";

describe("TodoList Component", () => {
  const mockTodos: Todo[] = [
    {
      id: "1",
      title: "First Todo",
      description: "First description",
      priority: "high",
      completed: false,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Second Todo",
      priority: "medium",
      completed: true,
      createdAt: "2023-01-02T00:00:00.000Z",
      updatedAt: "2023-01-02T00:00:00.000Z",
    },
  ];

  const mockHandlers = {
    onToggleComplete: vi.fn(),
    onStartEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("With Todos", () => {
    it("should render list of todos", () => {
      render(
        <TodoList
          todos={mockTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      const list = screen.getByRole("list", { name: /todo list/i });
      expect(list).toBeInTheDocument();

      expect(screen.getByText("First Todo")).toBeInTheDocument();
      expect(screen.getByText("Second Todo")).toBeInTheDocument();
    });

    it("should pass correct props to TodoItems", () => {
      render(
        <TodoList
          todos={mockTodos}
          editingId="1"
          {...mockHandlers}
        />
      );

      // Check that first todo is marked as editing
      const firstEditButton = screen.getAllByRole("button", { name: /edit todo/i })[0];
      expect(firstEditButton).toBeDisabled(); // Should be disabled when editing

      // Check that second todo is not marked as editing
      const secondEditButton = screen.getAllByRole("button", { name: /edit todo/i })[1];
      expect(secondEditButton).not.toBeDisabled();
    });

    it("should handle interactions correctly", async () => {
      const user = userEvent.setup();
      render(
        <TodoList
          todos={mockTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      const firstCheckbox = screen.getAllByRole("checkbox")[0];
      await user.click(firstCheckbox);
      expect(mockHandlers.onToggleComplete).toHaveBeenCalledWith("1");

      const firstEditButton = screen.getAllByRole("button", { name: /edit todo/i })[0];
      await user.click(firstEditButton);
      expect(mockHandlers.onStartEdit).toHaveBeenCalledWith("1");

      const firstDeleteButton = screen.getAllByRole("button", { name: /delete todo/i })[0];
      await user.click(firstDeleteButton);
      expect(mockHandlers.onDelete).toHaveBeenCalledWith("1");
    });

    it("should maintain correct order of todos", () => {
      render(
        <TodoList
          todos={mockTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(2);
      
      // TodoItems should be rendered in the same order as the todos array
      expect(listItems[0]).toHaveTextContent("First Todo");
      expect(listItems[1]).toHaveTextContent("Second Todo");
    });
  });

  describe("Empty State", () => {
    it("should show default empty state when no todos", () => {
      render(
        <TodoList
          todos={[]}
          editingId={null}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("No todos yet")).toBeInTheDocument();
      expect(screen.getByText("Add your first task using the form above.")).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("should show custom empty state", () => {
      render(
        <TodoList
          todos={[]}
          editingId={null}
          emptyTitle="Custom Empty Title"
          emptyDescription="Custom empty description"
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Custom Empty Title")).toBeInTheDocument();
      expect(screen.getByText("Custom empty description")).toBeInTheDocument();
    });

    it("should show empty state without description", () => {
      render(
        <TodoList
          todos={[]}
          editingId={null}
          emptyTitle="Just a title"
          emptyDescription=""
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Just a title")).toBeInTheDocument();
      expect(screen.queryByText("Add your first task using the form above.")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(
        <TodoList
          todos={mockTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      const list = screen.getByLabelText("Todo list");
      expect(list).toHaveRole("list");
    });

    it("should have proper empty state labeling", () => {
      render(
        <TodoList
          todos={[]}
          editingId={null}
          {...mockHandlers}
        />
      );

      const emptyState = screen.getByLabelText("Empty state");
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single todo", () => {
      render(
        <TodoList
          todos={[mockTodos[0]]}
          editingId={null}
          {...mockHandlers}
        />
      );

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("First Todo")).toBeInTheDocument();
    });

    it("should handle editing state changes", () => {
      const { rerender } = render(
        <TodoList
          todos={mockTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      // Initially no todos are being edited
      const editButtons = screen.getAllByRole("button", { name: /edit todo/i });
      editButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });

      // Rerender with editing state
      rerender(
        <TodoList
          todos={mockTodos}
          editingId="1"
          {...mockHandlers}
        />
      );

      // First todo should now be disabled (editing), second should not
      const updatedEditButtons = screen.getAllByRole("button", { name: /edit todo/i });
      expect(updatedEditButtons[0]).toBeDisabled();
      expect(updatedEditButtons[1]).not.toBeDisabled();
    });

    it("should handle todos with missing optional fields", () => {
      const minimalTodos: Todo[] = [
        {
          id: "minimal",
          title: "Minimal Todo",
          priority: "medium",
          completed: false,
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
      ];

      render(
        <TodoList
          todos={minimalTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      expect(screen.getByText("Minimal Todo")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
    });
  });

  describe("Performance Considerations", () => {
    it("should handle large number of todos", () => {
      const manyTodos: Todo[] = Array.from({ length: 100 }, (_, i) => ({
        id: `todo-${i}`,
        title: `Todo ${i}`,
        priority: "medium" as const,
        completed: false,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      }));

      render(
        <TodoList
          todos={manyTodos}
          editingId={null}
          {...mockHandlers}
        />
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(100);
    });
  });
});
