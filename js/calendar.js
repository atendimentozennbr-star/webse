// Módulo de Calendário

let calendarEvents = [];
let currentCalendarDate = new Date();
let selectedCalendarDay = null;
let editingEventId = null;

const EVENT_TYPES = { appointment: 'Compromisso', task: 'Tarefa', reminder: 'Lembrete' };
const EVENT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// Inicializa módulo de calendário
function initCalendar() {
  calendarEvents = load(KEYS.EVENTS, []);
  renderCalendarSection();
}

// Cria novo evento
function createEvent(data) {
  const event = {
    id: generateId(),
    title: data.title,
    description: data.description || '',
    date: data.date,
    time: data.time || '',
    type: data.type || 'appointment',
    color: data.color || '#7c3aed',
    createdAt: new Date().toISOString()
  };
  calendarEvents.push(event);
  save(KEYS.EVENTS, calendarEvents);
  return event;
}

// Atualiza evento existente
function updateEvent(id, updates) {
  const index = calendarEvents.findIndex(e => e.id === id);
  if (index === -1) return null;
  calendarEvents[index] = { ...calendarEvents[index], ...updates };
  save(KEYS.EVENTS, calendarEvents);
  return calendarEvents[index];
}

// Remove evento
function deleteEvent(id) {
  calendarEvents = calendarEvents.filter(e => e.id !== id);
  save(KEYS.EVENTS, calendarEvents);
}

// Obtém eventos de uma data específica
function getEventsForDate(dateStr) {
  return calendarEvents.filter(e => e.date === dateStr);
}

// Obtém eventos do mês atual
function getEventsForMonth(year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return calendarEvents.filter(e => e.date && e.date.startsWith(prefix));
}

// Renderiza seção de calendário
function renderCalendarSection() {
  const container = document.getElementById('calendar-container');
  if (!container) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const monthEvents = getEventsForMonth(year, month);

  // Agrupa eventos por dia
  const eventsByDay = {};
  monthEvents.forEach(e => {
    const day = parseInt(e.date.split('-')[2]);
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  // Também inclui datas de vencimento de tarefas
  const tasks = getAllTasks ? getAllTasks() : [];
  tasks.forEach(t => {
    if (t.dueDate && t.status !== 'done') {
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push({ id: 'task_' + t.id, title: t.title, type: 'task', color: '#f59e0b', isTask: true });
      }
    }
  });

  const selectedStr = selectedCalendarDay || formatDateForInput(today);
  const selectedEvents = getEventsForDate(selectedStr);

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        Calendário
      </h2>
      <button class="btn btn-primary" onclick="openEventModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Novo Evento
      </button>
    </div>

    <div class="calendar-layout">
      <div class="calendar-main glass-card">
        <div class="calendar-nav">
          <button class="btn-icon" onclick="changeCalendarMonth(-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <h3 class="calendar-month-title">${getMonthName(month)} ${year}</h3>
          <button class="btn-icon" onclick="changeCalendarMonth(1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          <button class="btn btn-sm" onclick="goToToday()">Hoje</button>
        </div>

        <div class="calendar-grid">
          <div class="calendar-dow">Dom</div>
          <div class="calendar-dow">Seg</div>
          <div class="calendar-dow">Ter</div>
          <div class="calendar-dow">Qua</div>
          <div class="calendar-dow">Qui</div>
          <div class="calendar-dow">Sex</div>
          <div class="calendar-dow">Sáb</div>

          ${Array.from({ length: firstDay }, (_, i) => `<div class="calendar-day calendar-day-empty"></div>`).join('')}

          ${Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsByDay[day] || [];
            const isCurrentDay = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSelected = dateStr === selectedStr;

            return `
              <div class="calendar-day ${isCurrentDay ? 'calendar-today' : ''} ${isSelected ? 'calendar-selected' : ''}"
                   onclick="selectCalendarDay('${dateStr}')">
                <span class="calendar-day-num">${day}</span>
                <div class="calendar-day-dots">
                  ${dayEvents.slice(0, 3).map(e => `<span class="event-dot" style="background: ${e.color || '#7c3aed'}"></span>`).join('')}
                  ${dayEvents.length > 3 ? `<span class="event-dot-more">+${dayEvents.length - 3}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="calendar-sidebar glass-card">
        <h3 class="calendar-sidebar-title">
          ${selectedStr ? formatDate(parseInputDate(selectedStr)) : 'Selecione um dia'}
        </h3>
        <div class="calendar-events-list">
          ${selectedEvents.length === 0
            ? '<p class="text-muted">Nenhum evento neste dia.</p>'
            : selectedEvents.map(e => renderEventItem(e)).join('')}
        </div>
        <button class="btn btn-outline btn-block" onclick="openEventModal(null, selectedCalendarDay)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Adicionar evento
        </button>
      </div>
    </div>

    <div class="upcoming-events glass-card">
      <h3>Próximos Eventos</h3>
      <div class="upcoming-list">
        ${renderUpcomingEvents()}
      </div>
    </div>
  `;
}

// Renderiza item de evento na lista
function renderEventItem(event) {
  return `
    <div class="event-item" style="border-left: 3px solid ${event.color || '#7c3aed'}">
      <div class="event-item-info">
        <span class="event-type-badge">${EVENT_TYPES[event.type] || event.type}</span>
        <strong>${escapeHtml(event.title)}</strong>
        ${event.time ? `<span class="event-time">🕐 ${event.time}</span>` : ''}
        ${event.description ? `<p class="event-desc">${escapeHtml(event.description)}</p>` : ''}
      </div>
      <div class="event-item-actions">
        <button class="btn-icon" onclick="openEventModal('${event.id}')" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-icon btn-danger" onclick="confirmDeleteEvent('${event.id}')" title="Excluir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `;
}

// Renderiza próximos eventos
function renderUpcomingEvents() {
  const today = formatDateForInput(new Date());
  const upcoming = calendarEvents
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 8);

  if (upcoming.length === 0) return '<p class="text-muted">Nenhum evento próximo.</p>';

  return upcoming.map(e => `
    <div class="upcoming-item" style="border-left: 3px solid ${e.color || '#7c3aed'}">
      <div class="upcoming-date">
        <span class="upcoming-day">${parseInt(e.date.split('-')[2])}</span>
        <span class="upcoming-month">${getMonthShort(parseInt(e.date.split('-')[1]) - 1)}</span>
      </div>
      <div class="upcoming-info">
        <strong>${escapeHtml(e.title)}</strong>
        <span class="event-type-badge">${EVENT_TYPES[e.type] || e.type}</span>
        ${e.time ? `<span class="event-time">🕐 ${e.time}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// Seleciona dia no calendário
function selectCalendarDay(dateStr) {
  selectedCalendarDay = dateStr;
  renderCalendarSection();
}

// Navega mês
function changeCalendarMonth(direction) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
  renderCalendarSection();
}

// Vai para hoje
function goToToday() {
  currentCalendarDate = new Date();
  selectedCalendarDay = formatDateForInput(new Date());
  renderCalendarSection();
}

// Abre modal de evento
function openEventModal(id = null, dateStr = null) {
  editingEventId = id;
  const event = id ? calendarEvents.find(e => e.id === id) : null;

  document.getElementById('event-modal-title').textContent = id ? 'Editar Evento' : 'Novo Evento';
  document.getElementById('event-title-input').value = event?.title || '';
  document.getElementById('event-desc-input').value = event?.description || '';
  document.getElementById('event-date-input').value = event?.date || dateStr || formatDateForInput(new Date());
  document.getElementById('event-time-input').value = event?.time || '';
  document.getElementById('event-type-input').value = event?.type || 'appointment';

  const colorPicker = document.getElementById('event-color-picker');
  const currentColor = event?.color || '#7c3aed';
  colorPicker.innerHTML = EVENT_COLORS.map(color => `
    <button type="button" class="color-btn ${currentColor === color ? 'selected' : ''}"
            style="background: ${color}" onclick="selectEventColor('${color}', this)"></button>
  `).join('');
  document.getElementById('selected-event-color').value = currentColor;

  document.getElementById('event-modal').classList.add('modal-open');
}

// Seleciona cor do evento
function selectEventColor(color, btn) {
  document.querySelectorAll('#event-color-picker .color-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('selected-event-color').value = color;
}

// Fecha modal de evento
function closeEventModal() {
  document.getElementById('event-modal').classList.remove('modal-open');
  editingEventId = null;
}

// Salva evento do formulário
function saveEvent() {
  const title = document.getElementById('event-title-input').value.trim();
  if (!title) { showToast('O título do evento é obrigatório.', 'error'); return; }
  const date = document.getElementById('event-date-input').value;
  if (!date) { showToast('A data do evento é obrigatória.', 'error'); return; }

  const data = {
    title,
    description: document.getElementById('event-desc-input').value.trim(),
    date,
    time: document.getElementById('event-time-input').value,
    type: document.getElementById('event-type-input').value,
    color: document.getElementById('selected-event-color').value
  };

  if (editingEventId) {
    updateEvent(editingEventId, data);
    showToast('Evento atualizado!', 'success');
  } else {
    createEvent(data);
    showToast('Evento criado!', 'success');
  }

  closeEventModal();
  renderCalendarSection();
}

// Confirma exclusão de evento
function confirmDeleteEvent(id) {
  const event = calendarEvents.find(e => e.id === id);
  if (!event) return;
  if (confirm(`Excluir o evento "${event.title}"?`)) {
    deleteEvent(id);
    showToast('Evento excluído.', 'info');
    renderCalendarSection();
  }
}
