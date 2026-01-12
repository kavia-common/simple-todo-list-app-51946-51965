const TASKS_STORAGE_KEY = 'todolist_tasks';

// PUBLIC_INTERFACE
export const loadTasksFromStorage = () => {
  /**
   * Loads tasks from browser localStorage.
   * Returns an empty array if no tasks are found or if there's an error.
   * 
   * @returns {Array} Array of task objects
   */
  try {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('Error loading tasks from localStorage:', error);
    return [];
  }
};

// PUBLIC_INTERFACE
export const saveTasksToStorage = (tasks) => {
  /**
   * Saves tasks array to browser localStorage.
   * Handles errors gracefully and logs them to console.
   * 
   * @param {Array} tasks - Array of task objects to save
   */
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
    // Could implement fallback storage strategy here
  }
};

// PUBLIC_INTERFACE
export const clearTasksFromStorage = () => {
  /**
   * Removes all tasks from localStorage.
   * Used for complete data reset.
   */
  try {
    localStorage.removeItem(TASKS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing tasks from localStorage:', error);
  }
};

// PUBLIC_INTERFACE
export const getInitialTasks = () => {
  /**
   * Returns initial demo tasks for better user experience.
   * These tasks help users understand the application functionality.
   * 
   * @returns {Array} Array of demo task objects
   */
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-1',
      title: 'Welcome to TodoList!',
      description: 'This is a sample task to help you get started. You can edit this task or create new ones.',
      completed: false,
      createdAt: now
    },
    {
      id: 'demo-2',
      title: 'Try editing a task',
      description: 'Click the edit button (✎) to modify this task or add more details.',
      completed: false,
      createdAt: now
    },
    {
      id: 'demo-3',
      title: 'Mark tasks as complete',
      description: 'Click the checkbox to mark this task as done. Completed tasks will move to the bottom.',
      completed: true,
      createdAt: now
    }
  ];
};
