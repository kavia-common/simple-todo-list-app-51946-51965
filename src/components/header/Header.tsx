import React from "react";

export type HeaderCounts = {
  total: number;
  active: number;
  completed: number;
};

type HeaderProps = {
  title: string;
  subtitle?: string;
  counts: HeaderCounts;
  onClearCompleted: () => void;
  onClearAll: () => void;
  hasCompleted: boolean;
  hasAny: boolean;
};

// PUBLIC_INTERFACE
export function Header(props: HeaderProps) {
  /** Application header with counts and global actions. */
  const {
    title,
    subtitle,
    counts,
    onClearAll,
    onClearCompleted,
    hasCompleted,
    hasAny,
  } = props;

  return (
    <header className="header">
      <div className="header__text">
        <h1 className="title">{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>

      <div className="header__meta" aria-label="Todo summary">
        <div className="pill" title="Total">
          Total <strong>{counts.total}</strong>
        </div>
        <div className="pill" title="Active">
          Active <strong>{counts.active}</strong>
        </div>
        <div className="pill" title="Completed">
          Done <strong>{counts.completed}</strong>
        </div>
      </div>

      <div className="header__actions" aria-label="Todo actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onClearCompleted}
          disabled={!hasCompleted}
          aria-disabled={!hasCompleted}
          title="Remove all completed todos"
        >
          Clear completed
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={onClearAll}
          disabled={!hasAny}
          aria-disabled={!hasAny}
          title="Remove all todos"
        >
          Clear all
        </button>
      </div>
    </header>
  );
}
