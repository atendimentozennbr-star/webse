// Módulo de Tarefas

const TASK_CATEGORIES = ['Trabalho', 'Pessoal', 'Saúde', 'Educação', 'Financeiro', 'Outro'];
const TASK_PRIORITIES = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const TASK_STATUSES = { pending: 'Pendente', 'in-progress': 'Em andamento', done: 'Concluída' };

let tasksData = [];
let taskFilters = { status: 'all', priority: 'all', category: 'all', search: '' };
let taskSort = 'createdAt_desc';
let editingTaskId = null;

// Inicializa módulo de tarefas
function initTasks() {
  tasksData = load(KEYS.TASKS, []);
  renderTasksSection();
}

// Cria nova tarefa
function createTask(taskData) {
  const task = {
    id: generateId(),
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    category: taskData.category || 'Pessoal',
    dueDate: taskData.dueDate || null,
    status: taskData.status || 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  tasksData.unshift(task);
  save(KEYS.TASKS, tasksData);
  return task;
}

// Atualiza tarefa existente
function updateTask(id, updates) {
  const index = tasksData.findIndex(t => t.id === id);
  if (index === -1) return null;

  if (updates.status === 'done' && tasksData[index].status !== 'done') {
    updates.completedAt = new Date().toISOString();
  } else if (updates.status && updates.status !== 'done') {
    updates.completedAt = null;
  }

  tasksData[index] = { ...tasksData[index], ...updates };
  save(KEYS.TASKS, tasksData);
  return tasksData[index];
}

// Remove tarefa
function deleteTask(id) {
  tasksData = tasksData.filter(t => t.id !== id);
  save(KEYS.TASKS, tasksData);
}

// Obtém tarefa por ID
function getTask(id) {
  return tasksData.find(t => t.id === id) || null;
}

// Obtém todas as tarefas
function getAllTasks() {
  return [...tasksData];
}

// Filtra tarefas
function filterTasks(tasks) {
  return tasks.filter(task => {
    if (taskFilters.status !== 'all' && task.status !== taskFilters.status) return false;
    if (taskFilters.priority !== 'all' && task.priority !== taskFilters.priority) return false;
    if (taskFilters.category !== 'all' && task.category !== taskFilters.category) return false;
    if (taskFilters.search) {
      const s = taskFilters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(s) && !task.description.toLowerCase().includes(s)) return false;
    }
    return true;
  });
}

// Ordena tarefas
function sortTasks(tasks) {
  const [field, dir] = taskSort.split('_');
  return [...tasks].sort((a, b) => {
    let valA, valB;
    if (field === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      valA = order[a.priority] ?? 1;
      valB = order[b.priority] ?? 1;
    } else if (field === 'dueDate') {
      valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    } else {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
    }
    return dir === 'asc' ? valA - valB : valB - valA;
  });
}

// Obtém estatísticas das tarefas
function getTaskStats() {
  const total = tasksData.length;
  const pending = tasksData.filter(t => t.status === 'pending').length;
  const inProgress = tasksData.filter(t => t.status === 'in-progress').length;
  const done = tasksData.filter(t => t.status === 'done').length;
  const overdue = tasksData.filter(t => t.status !== 'done' && t.dueDate && isOverdue(t.dueDate)).length;
  const highPriority = tasksData.filter(t => t.status !== 'done' && t.priority === 'high').length;
  return { total, pending, inProgress, done, overdue, highPriority };
}

// Obtém tarefas de hoje para dashboard
function getTodayTasks() {
  const today = new Date();
  return tasksData.filter(t => {
    if (t.status === 'done') return false;
    if (t.dueDate && isSameDay(new Date(t.dueDate), today)) return true;
    return t.priority === 'high' && t.status !== 'done';
  }).slice(0, 5);
}

// Renderiza a seção completa de tarefas
function renderTasksSection() {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  const stats = getTaskStats();
  const filtered = sortTasks(filterTasks(tasksData));

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        Tarefas
      </h2>
      <button class="btn btn-primary" onclick="openTaskModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nova Tarefa
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-pending">
        <span class="stat-number">${stats.pending}</span>
        <span class="stat-label">Pendentes</span>
      </div>
      <div class="stat-card stat-progress">
        <span class="stat-number">${stats.inProgress}</span>
        <span class="stat-label">Em andamento</span>
      </div>
      <div class="stat-card stat-done">
        <span class="stat-number">${stats.done}</span>
        <span class="stat-label">Concluídas</span>
      </div>
      <div class="stat-card stat-overdue">
        <span class="stat-number">${stats.overdue}</span>
        <span class="stat-label">Atrasadas</span>
      </div>
    </div>

    <div class="filters-bar glass-card">
      <div class="filter-group">
        <input type="text" class="filter-input" placeholder="🔍 Pesquisar tarefas..." value="${escapeHtml(taskFilters.search)}" oninput="taskFilters.search=this.value; renderTasksSection()">
      </div>
      <div class="filter-group">
        <select class="filter-select" onchange="taskFilters.status=this.value; renderTasksSection()">
          <option value="all" ${taskFilters.status==='all'?'selected':''}>Todos os status</option>
          <option value="pending" ${taskFilters.status==='pending'?'selected':''}>Pendente</option>
          <option value="in-progress" ${taskFilters.status==='in-progress'?'selected':''}>Em andamento</option>
          <option value="done" ${taskFilters.status==='done'?'selected':''}>Concluída</option>
        </select>
      </div>
      <div class="filter-group">
        <select class="filter-select" onchange="taskFilters.priority=this.value; renderTasksSection()">
          <option value="all" ${taskFilters.priority==='all'?'selected':''}>Todas as prioridades</option>
          <option value="high" ${taskFilters.priority==='high'?'selected':''}>Alta</option>
          <option value="medium" ${taskFilters.priority==='medium'?'selected':''}>Média</option>
          <option value="low" ${taskFilters.priority==='low'?'selected':''}>Baixa</option>
        </select>
      </div>
      <div class="filter-group">
        <select class="filter-select" onchange="taskFilters.category=this.value; renderTasksSection()">
          <option value="all" ${taskFilters.category==='all'?'selected':''}>Todas as categorias</option>
          ${TASK_CATEGORIES.map(c => `<option value="${c}" ${taskFilters.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <select class="filter-select" onchange="taskSort=this.value; renderTasksSection()">
          <option value="createdAt_desc" ${taskSort==='createdAt_desc'?'selected':''}>Mais recentes</option>
          <option value="createdAt_asc" ${taskSort==='createdAt_asc'?'selected':''}>Mais antigas</option>
          <option value="priority_asc" ${taskSort==='priority_asc'?'selected':''}>Por prioridade</option>
          <option value="dueDate_asc" ${taskSort==='dueDate_asc'?'selected':''}>Por prazo</option>
        </select>
      </div>
    </div>

    <div class="tasks-list">
      ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-icon">📋</div><p>Nenhuma tarefa encontrada</p><button class="btn btn-primary" onclick="openTaskModal()">Criar primeira tarefa</button></div>' : ''}
      ${filtered.map(task => renderTaskCard(task)).join('')}
    </div>
  `;
}

// Renderiza card de tarefa individual
function renderTaskCard(task) {
  const overdue = task.status !== 'done' && task.dueDate && isOverdue(task.dueDate);
  const dueDateText = task.dueDate ? relativeDays(task.dueDate) : '';

  const priorityColors = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
  const statusIcons = {
    pending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`,
    'in-progress': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    done: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="9 11 12 14 22 4"></polyline></svg>`
  };

  return `
    <div class="task-card glass-card ${task.status === 'done' ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}" data-id="${task.id}">
      <div class="task-check" onclick="toggleTaskStatus('${task.id}')">
        ${statusIcons[task.status]}
      </div>
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escapeHtml(truncate(task.description, 100))}</div>` : ''}
        <div class="task-meta">
          <span class="badge ${priorityColors[task.priority]}">${TASK_PRIORITIES[task.priority]}</span>
          <span class="badge badge-category">${escapeHtml(task.category)}</span>
          ${task.dueDate ? `<span class="badge ${overdue ? 'badge-overdue' : 'badge-date'}">📅 ${dueDateText}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon" onclick="openTaskModal('${task.id}')" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-icon btn-danger" onclick="confirmDeleteTask('${task.id}')" title="Excluir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `;
}

// Alterna status da tarefa (ciclo: pending -> in-progress -> done)
function toggleTaskStatus(id) {
  const task = getTask(id);
  if (!task) return;
  const cycle = { pending: 'in-progress', 'in-progress': 'done', done: 'pending' };
  updateTask(id, { status: cycle[task.status] });
  renderTasksSection();
  updateDashboard();
}

// Abre modal de tarefa (criar ou editar)
function openTaskModal(id = null) {
  editingTaskId = id;
  const task = id ? getTask(id) : null;

  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');

  document.getElementById('task-modal-title').textContent = id ? 'Editar Tarefa' : 'Nova Tarefa';
  document.getElementById('task-title-input').value = task?.title || '';
  document.getElementById('task-desc-input').value = task?.description || '';
  document.getElementById('task-priority-input').value = task?.priority || 'medium';
  document.getElementById('task-category-input').value = task?.category || 'Pessoal';
  document.getElementById('task-duedate-input').value = task?.dueDate ? formatDateForInput(new Date(task.dueDate)) : '';
  document.getElementById('task-status-input').value = task?.status || 'pending';

  modal.classList.add('modal-open');
}

// Fecha modal de tarefa
function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('modal-open');
  editingTaskId = null;
}

// Salva tarefa do formulário
function saveTask() {
  const title = document.getElementById('task-title-input').value.trim();
  if (!title) { showToast('O título da tarefa é obrigatório.', 'error'); return; }

  const dueDateVal = document.getElementById('task-duedate-input').value;

  const data = {
    title,
    description: document.getElementById('task-desc-input').value.trim(),
    priority: document.getElementById('task-priority-input').value,
    category: document.getElementById('task-category-input').value,
    dueDate: dueDateVal ? new Date(dueDateVal + 'T00:00:00').toISOString() : null,
    status: document.getElementById('task-status-input').value
  };

  if (editingTaskId) {
    updateTask(editingTaskId, data);
    showToast('Tarefa atualizada!', 'success');
  } else {
    createTask(data);
    showToast('Tarefa criada!', 'success');
  }

  closeTaskModal();
  renderTasksSection();
  updateDashboard();
}

// Confirma exclusão de tarefa
function confirmDeleteTask(id) {
  const task = getTask(id);
  if (!task) return;
  if (confirm(`Excluir a tarefa "${task.title}"?`)) {
    deleteTask(id);
    showToast('Tarefa excluída.', 'info');
    renderTasksSection();
    updateDashboard();
  }
}
