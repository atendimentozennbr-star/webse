// Módulo de Hábitos

let habitsData = [];
let habitLogsData = [];
let editingHabitId = null;

const HABIT_ICONS = ['💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎯', '✍️', '🎵', '🌱', '🧠'];
const HABIT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#00ff88', '#06b6d4'];

// Inicializa módulo de hábitos
function initHabits() {
  habitsData = load(KEYS.HABITS, []);
  habitLogsData = load(KEYS.HABIT_LOGS, []);
  renderHabitsSection();
}

// Cria novo hábito
function createHabit(data) {
  const habit = {
    id: generateId(),
    name: data.name,
    description: data.description || '',
    icon: data.icon || '💪',
    color: data.color || '#7c3aed',
    frequency: data.frequency || 'daily',
    createdAt: new Date().toISOString()
  };
  habitsData.push(habit);
  save(KEYS.HABITS, habitsData);
  return habit;
}

// Atualiza hábito existente
function updateHabit(id, updates) {
  const index = habitsData.findIndex(h => h.id === id);
  if (index === -1) return null;
  habitsData[index] = { ...habitsData[index], ...updates };
  save(KEYS.HABITS, habitsData);
  return habitsData[index];
}

// Remove hábito e seus logs
function deleteHabit(id) {
  habitsData = habitsData.filter(h => h.id !== id);
  habitLogsData = habitLogsData.filter(l => l.habitId !== id);
  save(KEYS.HABITS, habitsData);
  save(KEYS.HABIT_LOGS, habitLogsData);
}

// Registra conclusão de hábito para uma data
function logHabit(habitId, date = new Date()) {
  const dateStr = formatDateForInput(date);
  const existing = habitLogsData.find(l => l.habitId === habitId && l.date === dateStr);

  if (existing) {
    habitLogsData = habitLogsData.filter(l => !(l.habitId === habitId && l.date === dateStr));
  } else {
    habitLogsData.push({ habitId, date: dateStr, completed: true, loggedAt: new Date().toISOString() });
  }
  save(KEYS.HABIT_LOGS, habitLogsData);
  return !existing;
}

// Verifica se hábito foi concluído em uma data
function isHabitDone(habitId, date = new Date()) {
  const dateStr = formatDateForInput(date);
  return habitLogsData.some(l => l.habitId === habitId && l.date === dateStr);
}

// Obtém logs de um hábito
function getHabitLogs(habitId) {
  return habitLogsData.filter(l => l.habitId === habitId);
}

// Calcula streak atual de um hábito
function getCurrentStreak(habitId) {
  const today = new Date();
  let streak = 0;
  let current = new Date(today);

  // Verifica hoje primeiro
  if (!isHabitDone(habitId, current)) {
    current.setDate(current.getDate() - 1);
  }

  while (isHabitDone(habitId, current)) {
    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 365) break;
  }

  return streak;
}

// Calcula maior streak de um hábito
function getLongestStreak(habitId) {
  const logs = getHabitLogs(habitId);
  if (logs.length === 0) return 0;

  const dates = logs.map(l => l.date).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  return longest;
}

// Calcula taxa de conclusão nos últimos 30 dias
function getCompletionRate(habitId, days = 30) {
  let completed = 0;
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (isHabitDone(habitId, d)) completed++;
  }

  return Math.round((completed / days) * 100);
}

// Gera dados para o gráfico de contribuição (últimas 12 semanas)
function getContributionData(habitId) {
  const weeks = 15;
  const today = new Date();
  const data = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const week = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + d));
      week.push({
        date: new Date(date),
        done: isHabitDone(habitId, date),
        future: date > today
      });
    }
    week.reverse();
    data.push(week);
  }

  return data;
}

// Renderiza seção de hábitos
function renderHabitsSection() {
  const container = document.getElementById('habits-container');
  if (!container) return;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
        Hábitos
      </h2>
      <button class="btn btn-primary" onclick="openHabitModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Novo Hábito
      </button>
    </div>

    <div class="habits-today glass-card">
      <h3>Hábitos de Hoje</h3>
      <div class="habits-today-list">
        ${habitsData.length === 0
          ? '<p class="text-muted">Nenhum hábito cadastrado ainda.</p>'
          : habitsData.map(h => renderHabitTodayItem(h)).join('')}
      </div>
    </div>

    <div class="habits-grid">
      ${habitsData.map(h => renderHabitCard(h)).join('')}
      ${habitsData.length === 0 ? '<div class="empty-state"><div class="empty-icon">⭐</div><p>Comece criando seu primeiro hábito!</p><button class="btn btn-primary" onclick="openHabitModal()">Criar hábito</button></div>' : ''}
    </div>
  `;
}

// Renderiza item de hábito na lista de hoje
function renderHabitTodayItem(habit) {
  const done = isHabitDone(habit.id);
  return `
    <div class="habit-today-item ${done ? 'habit-done' : ''}" onclick="toggleHabitToday('${habit.id}')">
      <span class="habit-icon">${habit.icon}</span>
      <span class="habit-name">${escapeHtml(habit.name)}</span>
      <span class="habit-check ${done ? 'checked' : ''}">
        ${done
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`}
      </span>
    </div>
  `;
}

// Renderiza card completo de hábito
function renderHabitCard(habit) {
  const streak = getCurrentStreak(habit.id);
  const longest = getLongestStreak(habit.id);
  const rate = getCompletionRate(habit.id);
  const contribution = getContributionData(habit.id);

  return `
    <div class="habit-card glass-card">
      <div class="habit-card-header" style="border-left: 4px solid ${habit.color}">
        <div class="habit-card-title">
          <span class="habit-icon-large">${habit.icon}</span>
          <div>
            <h3>${escapeHtml(habit.name)}</h3>
            ${habit.description ? `<p class="habit-card-desc">${escapeHtml(habit.description)}</p>` : ''}
          </div>
        </div>
        <div class="habit-card-actions">
          <button class="btn-icon" onclick="openHabitModal('${habit.id}')" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-danger" onclick="confirmDeleteHabit('${habit.id}')" title="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>

      <div class="habit-stats">
        <div class="habit-stat">
          <span class="habit-stat-value">🔥 ${streak}</span>
          <span class="habit-stat-label">Streak atual</span>
        </div>
        <div class="habit-stat">
          <span class="habit-stat-value">🏆 ${longest}</span>
          <span class="habit-stat-label">Maior streak</span>
        </div>
        <div class="habit-stat">
          <span class="habit-stat-value">${rate}%</span>
          <span class="habit-stat-label">30 dias</span>
        </div>
      </div>

      <div class="contribution-graph">
        <div class="contribution-weeks">
          ${contribution.map(week => `
            <div class="contribution-week">
              ${week.map(day => `
                <div class="contribution-day ${day.done ? 'contrib-done' : ''} ${day.future ? 'contrib-future' : ''} ${isToday(day.date) ? 'contrib-today' : ''}"
                     style="${day.done ? `background: ${habit.color}` : ''}"
                     title="${formatDate(day.date)}${day.done ? ' ✓' : ''}">
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Alterna conclusão de hábito para hoje
function toggleHabitToday(habitId) {
  const done = logHabit(habitId);
  showToast(done ? '✅ Hábito marcado!' : '↩️ Hábito desmarcado', done ? 'success' : 'info');
  renderHabitsSection();
  updateDashboard();
}

// Abre modal de hábito
function openHabitModal(id = null) {
  editingHabitId = id;
  const habit = id ? habitsData.find(h => h.id === id) : null;

  document.getElementById('habit-modal-title').textContent = id ? 'Editar Hábito' : 'Novo Hábito';
  document.getElementById('habit-name-input').value = habit?.name || '';
  document.getElementById('habit-desc-input').value = habit?.description || '';
  document.getElementById('habit-frequency-input').value = habit?.frequency || 'daily';

  // Renderiza seletor de ícones
  const iconPicker = document.getElementById('habit-icon-picker');
  iconPicker.innerHTML = HABIT_ICONS.map(icon => `
    <button type="button" class="icon-btn ${(habit?.icon || '💪') === icon ? 'selected' : ''}"
            onclick="selectHabitIcon('${icon}', this)">${icon}</button>
  `).join('');

  // Renderiza seletor de cores
  const colorPicker = document.getElementById('habit-color-picker');
  colorPicker.innerHTML = HABIT_COLORS.map(color => `
    <button type="button" class="color-btn ${(habit?.color || '#7c3aed') === color ? 'selected' : ''}"
            style="background: ${color}" onclick="selectHabitColor('${color}', this)"></button>
  `).join('');

  document.getElementById('selected-habit-icon').value = habit?.icon || '💪';
  document.getElementById('selected-habit-color').value = habit?.color || '#7c3aed';

  document.getElementById('habit-modal').classList.add('modal-open');
}

// Seleciona ícone de hábito
function selectHabitIcon(icon, btn) {
  document.querySelectorAll('#habit-icon-picker .icon-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('selected-habit-icon').value = icon;
}

// Seleciona cor de hábito
function selectHabitColor(color, btn) {
  document.querySelectorAll('#habit-color-picker .color-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('selected-habit-color').value = color;
}

// Fecha modal de hábito
function closeHabitModal() {
  document.getElementById('habit-modal').classList.remove('modal-open');
  editingHabitId = null;
}

// Salva hábito do formulário
function saveHabit() {
  const name = document.getElementById('habit-name-input').value.trim();
  if (!name) { showToast('O nome do hábito é obrigatório.', 'error'); return; }

  const data = {
    name,
    description: document.getElementById('habit-desc-input').value.trim(),
    frequency: document.getElementById('habit-frequency-input').value,
    icon: document.getElementById('selected-habit-icon').value,
    color: document.getElementById('selected-habit-color').value
  };

  if (editingHabitId) {
    updateHabit(editingHabitId, data);
    showToast('Hábito atualizado!', 'success');
  } else {
    createHabit(data);
    showToast('Hábito criado!', 'success');
  }

  closeHabitModal();
  renderHabitsSection();
  updateDashboard();
}

// Confirma exclusão de hábito
function confirmDeleteHabit(id) {
  const habit = habitsData.find(h => h.id === id);
  if (!habit) return;
  if (confirm(`Excluir o hábito "${habit.name}" e todos seus registros?`)) {
    deleteHabit(id);
    showToast('Hábito excluído.', 'info');
    renderHabitsSection();
    updateDashboard();
  }
}

// Obtém dados de streaks para o dashboard
function getHabitSummary() {
  const totalHabits = habitsData.length;
  const doneToday = habitsData.filter(h => isHabitDone(h.id)).length;
  const topStreak = habitsData.reduce((max, h) => {
    const s = getCurrentStreak(h.id);
    return s > max.streak ? { name: h.name, streak: s, icon: h.icon } : max;
  }, { name: '', streak: 0, icon: '🔥' });

  return { totalHabits, doneToday, topStreak };
}
