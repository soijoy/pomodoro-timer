const MODES = {
  work: { label: '作業', minutes: 25, color: '#e85d4e' },
  short: { label: '短休憩', minutes: 5, color: '#4e9be8' },
  long: { label: '長休憩', minutes: 15, color: '#6b4ee8' },
};

const STORAGE_KEY = 'pomodoro-history';
const CIRCUMFERENCE = 2 * Math.PI * 108;

const timeDisplay = document.getElementById('timeDisplay');
const progressRing = document.getElementById('progressRing');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const taskInput = document.getElementById('taskInput');
const currentTaskLabel = document.getElementById('currentTaskLabel');
const todayCountEl = document.getElementById('todayCount');
const totalCountEl = document.getElementById('totalCount');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const modeButtons = document.querySelectorAll('.mode-btn');

let currentMode = 'work';
let totalSeconds = MODES[currentMode].minutes * 60;
let remainingSeconds = totalSeconds;
let timerId = null;
let isRunning = false;

progressRing.style.strokeDasharray = `${CIRCUMFERENCE}`;

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  const progress = remainingSeconds / totalSeconds;
  progressRing.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - progress)}`;
}

function setMode(mode) {
  currentMode = mode;
  totalSeconds = MODES[mode].minutes * 60;
  remainingSeconds = totalSeconds;
  progressRing.style.stroke = MODES[mode].color;

  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  pauseTimer();
  updateDisplay();
}

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [0, 0.25, 0.5].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
    });
  } catch (e) { /* audio unsupported, ignore */ }
}

function tick() {
  remainingSeconds--;
  updateDisplay();
  if (remainingSeconds <= 0) {
    completeSession();
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  taskInput.disabled = true;
  timerId = setInterval(tick, 1000);
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerId);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  taskInput.disabled = false;
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = totalSeconds;
  updateDisplay();
}

function completeSession() {
  pauseTimer();
  playAlarm();
  remainingSeconds = 0;
  updateDisplay();

  if (currentMode === 'work') {
    const task = taskInput.value.trim() || '(タスク未入力)';
    addHistoryEntry(task);
    taskInput.value = '';
  }

  setTimeout(() => {
    remainingSeconds = totalSeconds;
    updateDisplay();
  }, 800);
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addHistoryEntry(task) {
  const history = loadHistory();
  history.unshift({ task, timestamp: Date.now() });
  saveHistory(history);
  renderHistory();
  renderStats();
}

function renderStats() {
  const history = loadHistory();
  totalCountEl.textContent = history.length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = history.filter(h => h.timestamp >= todayStart.getTime()).length;
  todayCountEl.textContent = todayCount;
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    const li = document.createElement('li');
    li.className = 'history-empty';
    li.textContent = 'まだ完了したセッションはありません';
    historyList.appendChild(li);
    return;
  }

  history.slice(0, 30).forEach(entry => {
    const li = document.createElement('li');
    const date = new Date(entry.timestamp);
    const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    const taskSpan = document.createElement('span');
    taskSpan.className = 'h-task';
    taskSpan.textContent = entry.task;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'h-time';
    timeSpan.textContent = timeStr;

    li.appendChild(taskSpan);
    li.appendChild(timeSpan);
    historyList.appendChild(li);
  });
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('履歴をすべて削除しますか?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
    renderStats();
  }
});

taskInput.addEventListener('input', () => {
  currentTaskLabel.textContent = taskInput.value.trim() ? `現在のタスク: ${taskInput.value.trim()}` : '';
});

setMode('work');
renderHistory();
renderStats();
