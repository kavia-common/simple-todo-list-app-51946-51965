import React from 'react';
import TaskItem from './TaskItem';
import './TaskList.css';

// PUBLIC_INTERFACE
const TaskList = ({ tasks, onUpdateTask, onDeleteTask, onToggleTask, filter }) => {
  /**
   * TaskList component that renders a list of tasks with appropriate grouping.
   * Displays tasks in sections for better organization and user experience.
   * 
   * @param {Array} tasks - Array of task objects to display
   * @param {Function} onUpdateTask - Callback to update a task
   * @param {Function} onDeleteTask - Callback to delete a task
   * @param {Function} onToggleTask - Callback to toggle task completion
   * @param {string} filter - Current filter type (all, active, completed)
   */
  
  if (tasks.length === 0) {
    const emptyMessages = {
      all: "No tasks yet. Add one above to get started!",
      active: "No active tasks. Great job staying on top of things!",
      completed: "No completed tasks yet. Complete some tasks to see them here."
    };

    return (
      <div className="task-list-empty">
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p className="empty-message">{emptyMessages[filter]}</p>
        </div>
      </div>
    );
  }

  // Group tasks by completion status for 'all' filter
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const renderTaskGroup = (groupTasks, title, showTitle = true) => {
    if (groupTasks.length === 0) return null;

    return (
      <div className="task-group">
        {showTitle && <h3 className="task-group-title">{title}</h3>}
        <div className="task-items">
          {groupTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onToggle={onToggleTask}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="task-list">
      {filter === 'all' ? (
        <>
          {renderTaskGroup(activeTasks, `Active Tasks (${activeTasks.length})`)}
          {renderTaskGroup(completedTasks, `Completed Tasks (${completedTasks.length})`)}
        </>
      ) : (
        renderTaskGroup(tasks, '', false)
      )}
    </div>
  );
};

export default TaskList;
