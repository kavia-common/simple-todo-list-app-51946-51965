import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Todo, TodoPriority } from "../../storage";

type TodoFormMode = "add" | "edit";

type TodoDraft = {
  title: string;
  description: string;
  priority: TodoPriority;
};

type TodoFormProps = {
  mode: TodoFormMode;
  initial?: Todo | null;
  onSubmit: (draft: { title: string; description?: string; priority: TodoPriority }) => void;
  onCancel?: () => void;
};

// PUBLIC_INTERFACE
export function TodoForm(props: TodoFormProps) {
  /** Form for adding or editing a Todo. */
  const { mode, initial, onSubmit, onCancel } = props;

  const titleId = useId();
  const descId = useId();
  const priorityId = useId();

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const initialDraft: TodoDraft = useMemo(() => {
    if (mode === "edit" && initial) {
      return {
        title: initial.title ?? "",
        description: initial.description ?? "",
        priority: initial.priority ?? "medium",
      };
    }
    return { title: "", description: "", priority: "medium" };
  }, [mode, initial]);

  const [draft, setDraft] = useState<TodoDraft>(initialDraft);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setDraft(initialDraft);
    setTouched(false);
  }, [initialDraft]);

  useEffect(() => {
    // Autofocus is helpful on load; in edit mode, it speeds up changes.
    titleInputRef.current?.focus();
  }, [mode]);

  const titleError =
    touched && draft.title.trim().length === 0 ? "Title is required." : null;

  const submitLabel = mode === "edit" ? "Save changes" : "Add todo";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    const title = draft.title.trim();
    if (title.length === 0) {
      titleInputRef.current?.focus();
      return;
    }

    const description = draft.description.trim();
    onSubmit({
      title,
      description: description.length > 0 ? description : undefined,
      priority: draft.priority,
    });

    if (mode === "add") {
      setDraft({ title: "", description: "", priority: draft.priority });
      setTouched(false);
      titleInputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
    
    // Cancel edit on Escape
    if (e.key === "Escape" && mode === "edit" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} aria-label="Todo form">
      <div className="form__grid">
        <div className="field">
          <label className="label" htmlFor={titleId}>
            Title <span className="req" aria-hidden="true">*</span>
          </label>
          <input
            ref={titleInputRef}
            id={titleId}
            className={`input ${titleError ? "input--error" : ""}`}
            value={draft.title}
            placeholder="What needs doing?"
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? `${titleId}-error` : undefined}
            aria-required="true"
          />
          {titleError ? (
            <div id={`${titleId}-error`} className="field__error" role="alert">
              {titleError}
            </div>
          ) : null}
        </div>

        <div className="field">
          <label className="label" htmlFor={priorityId}>
            Priority
          </label>
          <select
            id={priorityId}
            className="select"
            value={draft.priority}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                priority: e.target.value as TodoPriority,
              }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="field form__full">
          <label className="label" htmlFor={descId}>
            Description <span className="hint">(optional)</span>
          </label>
          <textarea
            id={descId}
            className="textarea"
            value={draft.description}
            placeholder="Add more details…"
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            rows={3}
          />
        </div>
      </div>

      <div className="form__actions">
        {mode === "edit" ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}

        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
