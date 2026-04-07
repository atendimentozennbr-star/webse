// Módulo de Metas

let goalsData = [];
let editingGoalId = null;

const GOAL_CATEGORIES = ['Saúde', 'Carreira', 'Financeiro', 'Educação', 'Pessoal', 'Relacionamentos'];
const GOAL_TYPES = { personal: 'Pessoal', financial: 'Financeiro' };
const GOAL_STATUSES = { active: 'Ativa', completed: 'Concluída', archived: 'Arquivada' };

// Inicializa módulo de metas
function initGoals() {
  goalsData = load(KEYS.GOALS, []);
  renderGoalsSection();
}

// Cria meta
function createGoal(data) {
  const goal = {
    id: generateId(),
    title: data.title,
    description: data.description || '',
    type: data.type || 'personal',
    category: data.category || 'Pessoal',
    targetValue: parseFloat(data.targetValue) || 100,
    currentValue: parseFloat(data.currentValue) || 0,
    unit: data.unit || '%',
    deadline: data.deadline || null,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  goalsData.push(goal);
  save(KEYS.GOALS, goalsData);
  return goal;
}

// Atualiza meta
function updateGoal(id, updates) {
  const index = goalsData.findIndex(g => g.id === id);
  if (index === -1) return null;
  if (updates.targetValue !== undefined) updates.targetValue = parseFloat(updates.targetValue);
  if (updates.currentValue !== undefined) updates.currentValue = parseFloat(updates.currentValue);

  // Verifica se meta foi concluída
  const goal = { ...goalsData[index], ...updates };
  if (goal.currentValue >= goal.targetValue && goal.status === 'active') {
    updates.status = 'completed';
    showToast(`🎉 Meta "${goal.title}" concluída!`, 'success');
  }

  goalsData[index] = goal;
  save(KEYS.GOALS, goalsData);
  return goalsData[index];
}

// Remove meta
function deleteGoal(id) {
  goalsData = goalsData.filter(g => g.id !== id);
  save(KEYS.GOALS, goalsData);
}

// Calcula progresso de uma meta em porcentagem
function getGoalProgress(goal) {
  if (goal.targetValue === 0) return 100;
  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  return pct;
}

// Renderiza seção de metas
function renderGoalsSection() {
  const container = document.getElementById('goals-container');
  if (!container) return;

  const active = goalsData.filter(g => g.status === 'active');
  const completed = goalsData.filter(g => g.status === 'completed');
  const archived = goalsData.filter(g => g.status === 'archived');

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
        Metas
      </h2>
      <button class="btn btn-primary" onclick="openGoalModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nova Meta
      </button>
    </div>

    <div class="goals-stats glass-card">
      <div class="goal-stat">
        <span class="goal-stat-value">${active.length}</span>
        <span class="goal-stat-label">Ativas</span>
      </div>
      <div class="goal-stat">
        <span class="goal-stat-value">🏆 ${completed.length}</span>
        <span class="goal-stat-label">Concluídas</span>
      </div>
      <div class="goal-stat">
        <span class="goal-stat-value">${goalsData.length > 0 ? Math.round(active.reduce((s, g) => s + getGoalProgress(g), 0) / (active.length || 1)) : 0}%</span>
        <span class="goal-stat-label">Progresso médio</span>
      </div>
    </div>

    <div class="goals-chart-container glass-card">
      <h3>Progresso das Metas Ativas</h3>
      <div class="chart-wrapper-tall">
        <canvas id="goals-chart"></canvas>
      </div>
    </div>

    <div class="goals-sections">
      ${active.length > 0 ? `
        <h3 class="goals-section-title">🎯 Metas Ativas</h3>
        <div class="goals-grid">
          ${active.map(g => renderGoalCard(g)).join('')}
        </div>
      ` : ''}

      ${completed.length > 0 ? `
        <h3 class="goals-section-title">🏆 Metas Concluídas</h3>
        <div class="goals-grid">
          ${completed.map(g => renderGoalCard(g)).join('')}
        </div>
      ` : ''}

      ${goalsData.length === 0 ? '<div class="empty-state"><div class="empty-icon">🎯</div><p>Defina suas primeiras metas!</p><button class="btn btn-primary" onclick="openGoalModal()">Criar meta</button></div>' : ''}
    </div>
  `;

  setTimeout(() => updateGoalsChart(), 50);
}

// Renderiza card de meta
function renderGoalCard(goal) {
  const progress = getGoalProgress(goal);
  const daysLeft = goal.deadline ? daysDiff(new Date(), new Date(goal.deadline)) : null;
  const isOverdueGoal = daysLeft !== null && daysLeft < 0 && goal.status === 'active';

  const categoryColors = {
    'Saúde': '#10b981', 'Carreira': '#3b82f6', 'Financeiro': '#f59e0b',
    'Educação': '#7c3aed', 'Pessoal': '#ec4899', 'Relacionamentos': '#ef4444'
  };
  const color = categoryColors[goal.category] || '#7c3aed';

  return `
    <div class="goal-card glass-card ${goal.status === 'completed' ? 'goal-completed' : ''} ${isOverdueGoal ? 'goal-overdue' : ''}">
      <div class="goal-card-header">
        <div class="goal-info">
          <span class="goal-category-badge" style="background: ${color}22; color: ${color};">${escapeHtml(goal.category)}</span>
          <h4 class="goal-title">${escapeHtml(goal.title)}</h4>
          ${goal.description ? `<p class="goal-desc">${escapeHtml(goal.description)}</p>` : ''}
        </div>
        <div class="goal-actions">
          ${goal.status === 'active' ? `<button class="btn-icon" onclick="openUpdateProgressModal('${goal.id}')" title="Atualizar progresso">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          </button>` : ''}
          <button class="btn-icon" onclick="openGoalModal('${goal.id}')" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon btn-danger" onclick="confirmDeleteGoal('${goal.id}')" title="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>
      </div>

      <div class="goal-progress-section">
        <div class="goal-progress-info">
          <span class="goal-current">${goal.type === 'financial' ? formatCurrency(goal.currentValue) : goal.currentValue} ${goal.type !== 'financial' ? goal.unit : ''}</span>
          <span class="goal-target">de ${goal.type === 'financial' ? formatCurrency(goal.targetValue) : goal.targetValue + ' ' + goal.unit}</span>
          <span class="goal-pct" style="color: ${color}">${progress}%</span>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" style="--progress: ${progress}%; --color: ${color}">
            <div class="progress-fill" style="width: ${progress}%; background: linear-gradient(90deg, ${color}, ${color}88)"></div>
          </div>
        </div>
      </div>

      <div class="goal-footer">
        ${goal.deadline ? `
          <span class="goal-deadline ${isOverdueGoal ? 'overdue' : ''}">
            📅 ${isOverdueGoal ? `Atrasada ${Math.abs(daysLeft)} dias` : daysLeft === 0 ? 'Prazo hoje!' : `${daysLeft} dias restantes`}
          </span>
        ` : ''}
        <span class="goal-type-badge">${GOAL_TYPES[goal.type] || goal.type}</span>
        ${goal.status === 'completed' ? '<span class="goal-completed-badge">🏆 Concluída!</span>' : ''}
      </div>
    </div>
  `;
}

// Abre modal para atualizar progresso
function openUpdateProgressModal(goalId) {
  const goal = goalsData.find(g => g.id === goalId);
  if (!goal) return;

  const newValue = prompt(
    `Atualizar progresso de "${goal.title}"\n\nValor atual: ${goal.currentValue} ${goal.unit}\nMeta: ${goal.targetValue} ${goal.unit}\n\nNovo valor:`,
    goal.currentValue
  );

  if (newValue !== null && !isNaN(parseFloat(newValue))) {
    updateGoal(goalId, { currentValue: parseFloat(newValue) });
    renderGoalsSection();
    updateDashboard();
    showToast('Progresso atualizado!', 'success');
  }
}

// Abre modal de meta
function openGoalModal(id = null) {
  editingGoalId = id;
  const goal = id ? goalsData.find(g => g.id === id) : null;

  document.getElementById('goal-modal-title').textContent = id ? 'Editar Meta' : 'Nova Meta';
  document.getElementById('goal-title-input').value = goal?.title || '';
  document.getElementById('goal-desc-input').value = goal?.description || '';
  document.getElementById('goal-type-input').value = goal?.type || 'personal';
  document.getElementById('goal-category-input').value = goal?.category || 'Pessoal';
  document.getElementById('goal-target-input').value = goal?.targetValue || '';
  document.getElementById('goal-current-input').value = goal?.currentValue || 0;
  document.getElementById('goal-unit-input').value = goal?.unit || '%';
  document.getElementById('goal-deadline-input').value = goal?.deadline ? formatDateForInput(new Date(goal.deadline)) : '';

  // Mostra/oculta campo de unidade com base no tipo
  updateGoalUnitVisibility();
  document.getElementById('goal-type-input').addEventListener('change', updateGoalUnitVisibility);

  document.getElementById('goal-modal').classList.add('modal-open');
}

// Atualiza visibilidade do campo unidade
function updateGoalUnitVisibility() {
  const type = document.getElementById('goal-type-input').value;
  const unitField = document.getElementById('goal-unit-field');
  if (type === 'financial') {
    unitField.style.display = 'none';
    document.getElementById('goal-unit-input').value = 'R$';
  } else {
    unitField.style.display = '';
  }
}

// Fecha modal de meta
function closeGoalModal() {
  document.getElementById('goal-modal').classList.remove('modal-open');
  editingGoalId = null;
}

// Salva meta do formulário
function saveGoal() {
  const title = document.getElementById('goal-title-input').value.trim();
  if (!title) { showToast('O título da meta é obrigatório.', 'error'); return; }
  const target = parseFloat(document.getElementById('goal-target-input').value);
  if (!target || target <= 0) { showToast('O valor alvo deve ser positivo.', 'error'); return; }

  const deadlineVal = document.getElementById('goal-deadline-input').value;
  const data = {
    title,
    description: document.getElementById('goal-desc-input').value.trim(),
    type: document.getElementById('goal-type-input').value,
    category: document.getElementById('goal-category-input').value,
    targetValue: target,
    currentValue: parseFloat(document.getElementById('goal-current-input').value) || 0,
    unit: document.getElementById('goal-unit-input').value || '%',
    deadline: deadlineVal ? new Date(deadlineVal + 'T00:00:00').toISOString() : null
  };

  if (editingGoalId) {
    updateGoal(editingGoalId, data);
    showToast('Meta atualizada!', 'success');
  } else {
    createGoal(data);
    showToast('Meta criada!', 'success');
  }

  closeGoalModal();
  renderGoalsSection();
  updateDashboard();
}

// Confirma exclusão de meta
function confirmDeleteGoal(id) {
  const goal = goalsData.find(g => g.id === id);
  if (!goal) return;
  if (confirm(`Excluir a meta "${goal.title}"?`)) {
    deleteGoal(id);
    showToast('Meta excluída.', 'info');
    renderGoalsSection();
  }
}

// Retorna metas ativas para dashboard
function getActiveGoals() {
  return goalsData.filter(g => g.status === 'active').slice(0, 4);
}
