import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { useTasks } from './hooks/useTasks';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  /**
   * Main App component that orchestrates the todo list application.
   * Manages overall layout and provides context for task management.
   */
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const [filter, setFilter] = useState('all'); // all, active, completed

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <TaskForm onAddTask={addTask} />
          
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Tasks ({tasks.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeTasks.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedTasks.length})
            </button>
          </div>

          <TaskList 
            tasks={filteredTasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onToggleTask={toggleTask}
            filter={filter}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
