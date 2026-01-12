import React, { useEffect, useRef } from "react";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
};

// PUBLIC_INTERFACE
export function ConfirmDialog(props: ConfirmDialogProps) {
  /** Accessible confirmation dialog with keyboard navigation support. */
  const {
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    onConfirm,
    onCancel,
  } = props;

  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default for safety
      cancelButtonRef.current?.focus();
      
      // Trap focus within dialog
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        
        if (e.key === "Tab") {
          const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean);
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog" ref={dialogRef}>
        <header className="dialog__header">
          <h2 id="dialog-title" className="dialog__title">
            {title}
          </h2>
        </header>

        <div className="dialog__body">
          <p className="dialog__message">{message}</p>
        </div>

        <footer className="dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`btn ${variant === "danger" ? "btn--danger" : variant === "warning" ? "btn--warning" : "btn--primary"}`}
            onClick={() => {
              onConfirm();
              onCancel(); // Close dialog after confirm
            }}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
