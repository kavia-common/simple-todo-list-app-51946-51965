import { useState, useEffect } from 'react';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  getInitialTasks 
} from '../utils/localStorage';

// PUBLIC_INTERFACE
export const useTasks = () => {
  /**
   * Custom hook for managing tasks with local storage persistence.
   * Provides state management and CRUD operations for tasks.
   * 
   * @returns {Object} Object containing tasks array and manipulation functions
   */
  const [tasks, setTasks] = useState([]);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = loadTasksFromStorage();
    if (savedTasks.length === 0) {
      // If no tasks exist, create some demo tasks for better UX
      const initialTasks = getInitialTasks();
      setTasks(initialTasks);
      saveTasksToStorage(initialTasks);
    } else {
      setTasks(savedTasks);
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      saveTasksToStorage(tasks);
    }
  }, [tasks]);

  const addTask = (newTask) => {
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const updateTask = (taskId, updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? updatedTask : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const toggleTask = (taskId) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              completed: !task.completed,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    );
  };

  const clearCompleted = () => {
    setTasks(prevTasks => prevTasks.filter(task => !task.completed));
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    clearCompleted
  };
};
