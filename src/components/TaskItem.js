import React, { useState } from 'react';
import './TaskItem.css';

// PUBLIC_INTERFACE
const TaskItem = ({ task, onUpdate, onDelete, onToggle }) => {
  /**
   * TaskItem component that displays an individual task with edit/delete capabilities.
   * Supports inline editing, completion toggling, and deletion with confirmation.
   * 
   * @param {Object} task - The task object to display
   * @param {Function} onUpdate - Callback to update the task
   * @param {Function} onDelete - Callback to delete the task
   * @param {Function} onToggle - Callback to toggle task completion
   */
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      return;
    }

    onUpdate(task.id, {
      ...task,
      title: editTitle.trim(),
      description: editDescription.trim(),
      updatedAt: new Date().toISOString()
    });

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(task.id);
    setShowConfirmDelete(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isEditing) {
    return (
      <div className="task-item editing">
        <div className="task-edit-form">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="task-edit-input"
            placeholder="Task title..."
            maxLength={200}
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="task-edit-description"
            placeholder="Description (optional)..."
            maxLength={500}
            rows={2}
          />
          <div className="task-edit-actions">
            <button 
              onClick={handleSaveEdit}
              className="save-btn"
              disabled={!editTitle.trim()}
            >
              Save
            </button>
            <button onClick={handleCancelEdit} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <button
          onClick={() => onToggle(task.id)}
          className="task-checkbox"
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed && <span className="checkmark">✓</span>}
        </button>
        
        <div className="task-details">
          <h4 className="task-title">{task.title}</h4>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
          <span className="task-date">
            {task.updatedAt 
              ? `Updated ${formatDate(task.updatedAt)}`
              : `Created ${formatDate(task.createdAt)}`
            }
          </span>
        </div>
      </div>

      <div className="task-actions">
        <button
          onClick={() => setIsEditing(true)}
          className="edit-btn"
          aria-label="Edit task"
        >
          ✎
        </button>
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="delete-btn"
          aria-label="Delete task"
        >
          🗑
        </button>
      </div>

      {showConfirmDelete && (
        <div className="delete-confirmation">
          <p>Delete this task?</p>
          <div className="confirmation-actions">
            <button onClick={handleDeleteConfirm} className="confirm-delete">
              Delete
            </button>
            <button onClick={() => setShowConfirmDelete(false)} className="cancel-delete">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
