import React, { useState } from 'react';
import './TaskForm.css';

// PUBLIC_INTERFACE
const TaskForm = ({ onAddTask }) => {
  /**
   * TaskForm component that allows users to create new tasks.
   * Provides form fields for task title and optional description.
   * 
   * @param {Function} onAddTask - Callback function to add a new task
   */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    });

    setTitle('');
    setDescription('');
    setShowDescription(false);
  };

  return (
    <div className="task-form-container">
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="task-input"
            maxLength={200}
            required
          />
          <button 
            type="button"
            className="description-toggle"
            onClick={() => setShowDescription(!showDescription)}
            aria-label={showDescription ? 'Hide description field' : 'Add description'}
          >
            {showDescription ? '−' : '+'}
          </button>
        </div>

        {showDescription && (
          <div className="form-group">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description (optional)..."
              className="task-description"
              maxLength={500}
              rows={3}
            />
          </div>
        )}

        <button type="submit" className="add-button" disabled={!title.trim()}>
          <span className="add-icon">+</span>
          Add Task
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
