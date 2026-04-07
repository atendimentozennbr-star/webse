// Módulo Pomodoro Timer

let pomodoroState = {
  mode: 'idle',         // idle, working, short-break, long-break
  timeLeft: 25 * 60,    // segundos
  totalTime: 25 * 60,
  sessionCount: 0,
  isRunning: false,
  timer: null,
  selectedTaskId: null
};

let pomodoroSettings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4
};

let pomodoroSessions = [];

// Inicializa módulo pomodoro
function initPomodoro() {
  pomodoroSettings = load(KEYS.SETTINGS, {})?.pomodoro || pomodoroSettings;
  pomodoroSessions = load(KEYS.POMODORO_SESSIONS, []);
  pomodoroState.timeLeft = pomodoroSettings.workDuration * 60;
  pomodoroState.totalTime = pomodoroSettings.workDuration * 60;
  renderPomodoroSection();
}

// Renderiza seção pomodoro
function renderPomodoroSection() {
  const container = document.getElementById('pomodoro-container');
  if (!container) return;

  const tasks = getAllTasks ? getAllTasks().filter(t => t.status !== 'done') : [];
  const todaySessions = pomodoroSessions.filter(s => {
    const d = new Date(s.completedAt);
    return isToday(d);
  });

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        Pomodoro
      </h2>
    </div>

    <div class="pomodoro-layout">
      <div class="pomodoro-main">
        <div class="pomodoro-card glass-card">
          <div class="pomodoro-mode-tabs">
            <button class="pomo-tab ${pomodoroState.mode === 'idle' || pomodoroState.mode === 'working' ? 'active' : ''}"
                    onclick="setPomodoroMode('working')">Foco</button>
            <button class="pomo-tab ${pomodoroState.mode === 'short-break' ? 'active' : ''}"
                    onclick="setPomodoroMode('short-break')">Pausa curta</button>
            <button class="pomo-tab ${pomodoroState.mode === 'long-break' ? 'active' : ''}"
                    onclick="setPomodoroMode('long-break')">Pausa longa</button>
          </div>

          <div class="pomodoro-timer-wrapper">
            <svg class="pomodoro-svg" viewBox="0 0 200 200">
              <circle class="pomo-track" cx="100" cy="100" r="85" fill="none" stroke-width="10"/>
              <circle class="pomo-progress" cx="100" cy="100" r="85" fill="none" stroke-width="10"
                      stroke-dasharray="${2 * Math.PI * 85}"
                      stroke-dashoffset="${getPomodoroDashOffset()}"
                      stroke-linecap="round"
                      style="stroke: ${getPomodoroColor()}"/>
            </svg>
            <div class="pomodoro-time-display">
              <div class="pomo-time">${formatPomodoroTime(pomodoroState.timeLeft)}</div>
              <div class="pomo-mode-label">${getPomodoroModeLabel()}</div>
            </div>
          </div>

          <div class="pomodoro-controls">
            <button class="btn-icon-lg" onclick="resetPomodoro()" title="Reiniciar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-5"></path></svg>
            </button>
            <button class="btn-pomo-start ${pomodoroState.isRunning ? 'running' : ''}" onclick="togglePomodoro()">
              ${pomodoroState.isRunning
                ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
                : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`}
              ${pomodoroState.isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button class="btn-icon-lg" onclick="skipPomodoro()" title="Pular">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
            </button>
          </div>

          <div class="pomodoro-session-count">
            ${Array.from({ length: pomodoroSettings.sessionsBeforeLong }, (_, i) => `
              <div class="session-dot ${isSessionDotFilled(i) ? 'filled' : ''}"></div>
            `).join('')}
          </div>
        </div>

        <div class="pomodoro-task-select glass-card">
          <h3>Tarefa em foco</h3>
          <select class="filter-select w-full" onchange="pomodoroState.selectedTaskId=this.value; renderPomodoroSection()">
            <option value="">Nenhuma tarefa selecionada</option>
            ${tasks.map(t => `<option value="${t.id}" ${pomodoroState.selectedTaskId === t.id ? 'selected' : ''}>${escapeHtml(t.title)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="pomodoro-sidebar">
        <div class="pomodoro-settings glass-card">
          <h3>Configurações</h3>
          <div class="pomo-setting">
            <label>Foco (min)</label>
            <input type="number" class="filter-input" min="1" max="90" value="${pomodoroSettings.workDuration}"
                   onchange="updatePomodoroSettings('workDuration', this.value)">
          </div>
          <div class="pomo-setting">
            <label>Pausa curta (min)</label>
            <input type="number" class="filter-input" min="1" max="30" value="${pomodoroSettings.shortBreak}"
                   onchange="updatePomodoroSettings('shortBreak', this.value)">
          </div>
          <div class="pomo-setting">
            <label>Pausa longa (min)</label>
            <input type="number" class="filter-input" min="1" max="60" value="${pomodoroSettings.longBreak}"
                   onchange="updatePomodoroSettings('longBreak', this.value)">
          </div>
          <div class="pomo-setting">
            <label>Sessões por ciclo</label>
            <input type="number" class="filter-input" min="1" max="10" value="${pomodoroSettings.sessionsBeforeLong}"
                   onchange="updatePomodoroSettings('sessionsBeforeLong', this.value)">
          </div>
        </div>

        <div class="pomodoro-history glass-card">
          <h3>Hoje: ${todaySessions.length} sessão(ões)</h3>
          <div class="pomo-history-list">
            ${todaySessions.length === 0
              ? '<p class="text-muted">Nenhuma sessão hoje ainda.</p>'
              : todaySessions.slice(-10).reverse().map(s => `
                <div class="pomo-history-item">
                  <span class="pomo-history-icon">🍅</span>
                  <span class="pomo-history-info">
                    <strong>${s.duration} min</strong>
                    ${s.taskTitle ? `<span class="text-muted"> - ${escapeHtml(s.taskTitle)}</span>` : ''}
                  </span>
                  <span class="pomo-history-time">${formatDateTime(new Date(s.completedAt)).split(' ')[1]}</span>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Determina se o ponto de sessão deve estar preenchido
function isSessionDotFilled(dotIndex) {
  const completedInCycle = pomodoroState.sessionCount % pomodoroSettings.sessionsBeforeLong;
  const cycleComplete = completedInCycle === 0 && pomodoroState.sessionCount > 0;
  return dotIndex < completedInCycle || cycleComplete;
}

// Retorna offset SVG para o progresso circular
function getPomodoroDashOffset() {
  const circumference = 2 * Math.PI * 85;
  const progress = pomodoroState.timeLeft / pomodoroState.totalTime;
  return circumference * (1 - progress);
}

// Retorna cor baseada no modo atual
function getPomodoroColor() {
  switch (pomodoroState.mode) {
    case 'working': return '#ef4444';
    case 'short-break': return '#10b981';
    case 'long-break': return '#3b82f6';
    default: return '#7c3aed';
  }
}

// Retorna label do modo atual
function getPomodoroModeLabel() {
  switch (pomodoroState.mode) {
    case 'working': return 'FOCO';
    case 'short-break': return 'PAUSA CURTA';
    case 'long-break': return 'PAUSA LONGA';
    default: return 'PRONTO';
  }
}

// Formata segundos em MM:SS
function formatPomodoroTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Alterna start/pause
function togglePomodoro() {
  if (pomodoroState.isRunning) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

// Inicia timer
function startPomodoro() {
  if (pomodoroState.mode === 'idle') {
    setPomodoroMode('working');
  }
  pomodoroState.isRunning = true;

  pomodoroState.timer = setInterval(() => {
    if (pomodoroState.timeLeft > 0) {
      pomodoroState.timeLeft--;
      updatePomodoroDisplay();
    } else {
      onPomodoroComplete();
    }
  }, 1000);

  renderPomodoroSection();
}

// Pausa timer
function pausePomodoro() {
  pomodoroState.isRunning = false;
  clearInterval(pomodoroState.timer);
  renderPomodoroSection();
}

// Reseta timer
function resetPomodoro() {
  pausePomodoro();
  pomodoroState.mode = 'idle';
  pomodoroState.timeLeft = pomodoroSettings.workDuration * 60;
  pomodoroState.totalTime = pomodoroSettings.workDuration * 60;
  renderPomodoroSection();
}

// Pula sessão atual
function skipPomodoro() {
  pausePomodoro();
  onPomodoroComplete(true);
}

// Define modo do pomodoro
function setPomodoroMode(mode) {
  pausePomodoro();
  pomodoroState.mode = mode;

  switch (mode) {
    case 'working':
      pomodoroState.timeLeft = pomodoroSettings.workDuration * 60;
      pomodoroState.totalTime = pomodoroSettings.workDuration * 60;
      break;
    case 'short-break':
      pomodoroState.timeLeft = pomodoroSettings.shortBreak * 60;
      pomodoroState.totalTime = pomodoroSettings.shortBreak * 60;
      break;
    case 'long-break':
      pomodoroState.timeLeft = pomodoroSettings.longBreak * 60;
      pomodoroState.totalTime = pomodoroSettings.longBreak * 60;
      break;
  }

  renderPomodoroSection();
}

// Chamado quando uma sessão termina
function onPomodoroComplete(skipped = false) {
  clearInterval(pomodoroState.timer);
  pomodoroState.isRunning = false;

  if (pomodoroState.mode === 'working' && !skipped) {
    // Salva sessão
    const task = pomodoroState.selectedTaskId ? getTask(pomodoroState.selectedTaskId) : null;
    const session = {
      id: generateId(),
      duration: pomodoroSettings.workDuration,
      taskId: pomodoroState.selectedTaskId || null,
      taskTitle: task?.title || null,
      completedAt: new Date().toISOString()
    };
    pomodoroSessions.push(session);
    save(KEYS.POMODORO_SESSIONS, pomodoroSessions);

    pomodoroState.sessionCount++;

    // Notificação
    notifyPomodoroEnd('Sessão de foco concluída! 🍅 Hora de descansar.');

    // Determina próxima pausa
    if (pomodoroState.sessionCount % pomodoroSettings.sessionsBeforeLong === 0) {
      setPomodoroMode('long-break');
    } else {
      setPomodoroMode('short-break');
    }
    showToast('🍅 Pomodoro concluído! Hora de uma pausa.', 'success');
  } else if (pomodoroState.mode !== 'working' && !skipped) {
    notifyPomodoroEnd('Pausa encerrada! Hora de focar. 💪');
    setPomodoroMode('working');
    showToast('⏰ Pausa encerrada! Vamos trabalhar!', 'info');
  }

  renderPomodoroSection();
}

// Envia notificação do navegador
function notifyPomodoroEnd(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('ZennBR Pomodoro', { body: message });
  }
}

// Atualiza apenas o display sem re-renderizar tudo
function updatePomodoroDisplay() {
  const timeEl = document.querySelector('.pomo-time');
  const svgProgress = document.querySelector('.pomo-progress');

  if (timeEl) timeEl.textContent = formatPomodoroTime(pomodoroState.timeLeft);

  if (svgProgress) {
    const circumference = 2 * Math.PI * 85;
    const progress = pomodoroState.timeLeft / pomodoroState.totalTime;
    svgProgress.style.strokeDashoffset = circumference * (1 - progress);
    svgProgress.style.stroke = getPomodoroColor();
  }

  // Atualiza título da aba
  document.title = `${formatPomodoroTime(pomodoroState.timeLeft)} - ${getPomodoroModeLabel()} | ZennBR`;
}

// Atualiza configurações do pomodoro
function updatePomodoroSettings(key, value) {
  pomodoroSettings[key] = parseInt(value) || pomodoroSettings[key];

  // Salva nas configurações gerais
  const settings = load(KEYS.SETTINGS, {});
  settings.pomodoro = pomodoroSettings;
  save(KEYS.SETTINGS, settings);

  if (!pomodoroState.isRunning) {
    resetPomodoro();
  }
}

// Solicita permissão de notificação
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
