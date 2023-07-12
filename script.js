document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  const taskTimeInput = document.getElementById('task-time');
  const taskContentInput = document.getElementById('task-content');
  const addButton = document.getElementById('add-button');
  const deleteAllButton = document.getElementById('delete-all-button');
  const taskList = document.querySelector('#list tbody');
  const clock = document.getElementById('clock');

  // Initialize IndexedDB
  const dbName = 'todoListDB';
  const dbVersion = 1;
  let db;

  const openDBRequest = indexedDB.open(dbName, dbVersion);

  openDBRequest.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('tasks', { keyPath: 'time' });
    objectStore.createIndex('content', 'content', { unique: false });
  };

  openDBRequest.onsuccess = function (event) {
    db = event.target.result;
    loadTasksFromDB();
  };

  // Load tasks from IndexedDB
  function loadTasksFromDB() {
    const transaction = db.transaction('tasks', 'readonly');
    const objectStore = transaction.objectStore('tasks');
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = function () {
      const tasks = getAllRequest.result;
      tasks.forEach(task => {
        addTaskToList(task);
      });
    };
  }

  // Save task to IndexedDB
  function saveTaskToDB(task) {
    const transaction = db.transaction('tasks', 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    objectStore.put(task);
  }

  // Delete task from IndexedDB
  function deleteTaskFromDB(taskTime) {
    const transaction = db.transaction('tasks', 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    objectStore.delete(taskTime);
  }

  // Add task to list
  function addTaskToList(task) {
    const row = document.createElement('tr');
    row.dataset.time = task.time;

    const timeCell = document.createElement('td');
    timeCell.textContent = formatDateTime(task.time);
    row.appendChild(timeCell);

    const contentCell = document.createElement('td');
    contentCell.style.width = '80%';
    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');
    taskContent.textContent = task.content;

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('material-icons');
    deleteIcon.textContent = 'delete';
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', () => {
      row.remove();
      deleteTaskFromDB(task.time);
    });
    taskContent.appendChild(deleteButton);

    contentCell.appendChild(taskContent);
    row.appendChild(contentCell);

    taskList.appendChild(row);
  }

  // Format date and time
  function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const options = {
      hour12: false,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };
    return date.toLocaleString('en-US', options);
  }

  // Update clock
  function updateClock() {
    const now = new Date();
    const options = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };
    clock.textContent = now.toLocaleString('en-US', options);
  }

  // Add task button event listener
  addButton.addEventListener('click', () => {
    const task = {
      time: taskTimeInput.value,
      content: taskContentInput.value
    };

    addTaskToList(task);
    saveTaskToDB(task);

    taskTimeInput.value = '';
    taskContentInput.value = '';
    addButton.disabled = true;
  });

  // Delete all button event listener
  deleteAllButton.addEventListener('click', () => {
    taskList.innerHTML = '';
    const transaction = db.transaction('tasks', 'readwrite');
    const objectStore = transaction.objectStore('tasks');
    objectStore.clear();
  });

  // Input event listeners for enabling/disabling add task button
  taskTimeInput.addEventListener('input', toggleAddButton);
  taskContentInput.addEventListener('input', toggleAddButton);

  function toggleAddButton() {
    addButton.disabled = !taskTimeInput.value || !taskContentInput.value;
  }

  // Update clock
  setInterval(updateClock, 1000);
  updateClock();
}
