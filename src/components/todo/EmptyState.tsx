import React from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
};

// PUBLIC_INTERFACE
export function EmptyState(props: EmptyStateProps) {
  /** Simple empty state for list views. */
  const { title, description } = props;

  return (
    <section className="empty" aria-label="Empty state">
      <div className="empty__icon" aria-hidden="true">
        ✓
      </div>
      <h2 className="empty__title">{title}</h2>
      {description ? <p className="empty__desc">{description}</p> : null}
    </section>
  );
}
