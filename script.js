const STORAGE_KEY = 'dadaab-digital-hub-todos-v1';

const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const emptyMessage = document.querySelector('#empty-message');
const taskCount = document.querySelector('#task-count');
const totalCount = document.querySelector('#total-count');
const clearCompletedButton = document.querySelector('#clear-completed');
const saveNote = document.querySelector('#save-note');
const filterButtons = document.querySelectorAll('[data-filter]');

let currentFilter = 'all';
let storageAvailable = true;
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((task) => task && typeof task.text === 'string')
      .map((task) => ({
        id: typeof task.id === 'string' ? task.id : createId(),
        text: task.text.trim().slice(0, 160),
        completed: Boolean(task.completed)
      }))
      .filter((task) => task.text.length > 0);
  } catch (error) {
    storageAvailable = false;
    return [];
  }
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageAvailable = true;
    saveNote.textContent = 'Tasks are saved in this browser on this device.';
  } catch (error) {
    storageAvailable = false;
    saveNote.textContent = 'Saving is unavailable. Your tasks will be lost when you close this page.';
  }
}

function renderTasks() {
  list.replaceChildren();

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  for (const task of visibleTasks) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-completed' : ''}`;
    item.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.className = 'task-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.text} as ${task.completed ? 'not done' : 'done'}`);

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteButton.textContent = '×';

    item.append(checkbox, text, deleteButton);
    list.append(item);
  }

  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
  totalCount.textContent = String(tasks.length);
  clearCompletedButton.disabled = !tasks.some((task) => task.completed);
  emptyState.hidden = visibleTasks.length > 0;

  if (tasks.length === 0) {
    emptyMessage.textContent = 'Your list is clear. Add a task to get started!';
  } else if (currentFilter === 'active') {
    emptyMessage.textContent = 'Nothing left to do. Great work!';
  } else if (currentFilter === 'completed') {
    emptyMessage.textContent = 'No completed tasks yet.';
  } else {
    emptyMessage.textContent = 'Your list is clear. Add a task to get started!';
  }

  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  if (!storageAvailable) {
    saveNote.textContent = 'Saving is unavailable. Your tasks will be lost when you close this page.';
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift({ id: createId(), text: text.slice(0, 160), completed: false });
  currentFilter = 'all';
  input.value = '';
  saveTasks();
  renderTasks();
  input.focus();
});

list.addEventListener('change', (event) => {
  if (!event.target.matches('.task-checkbox')) return;
  const item = event.target.closest('.task-item');
  const task = tasks.find((entry) => entry.id === item.dataset.id);
  if (!task) return;

  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="delete"]');
  if (!button) return;
  const item = button.closest('.task-item');
  tasks = tasks.filter((task) => task.id !== item.dataset.id);
  saveTasks();
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

clearCompletedButton.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

renderTasks();
