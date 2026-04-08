// Módulo principal - Orquestrador da aplicação

let currentSection = 'dashboard';
let appSettings = {};
let sidebarCollapsed = false;

// Inicializa toda a aplicação
document.addEventListener('DOMContentLoaded', () => {
  appSettings = load(KEYS.SETTINGS, { theme: 'dark' });
  applyTheme(appSettings.theme || 'dark');
  initAllModules();
  navigateTo('dashboard');
  setupEventListeners();
  requestNotificationPermission();
  setupPWAInstall();
});

// Inicializa todos os módulos
function initAllModules() {
  initTasks();
  initHabits();
  initCalendar();
  initFinance();
  initGoals();
  initPomodoro();
  initPricing();
  loadSettings();
}

// Configura listeners globais
function setupEventListeners() {
  // Fecha modais ao clicar fora
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('modal-open');
      }
    });
  });

  // Toggle sidebar no mobile
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMobileSidebar);
  }

  // Fecha sidebar ao clicar fora no mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebar.classList.remove('sidebar-open');
    }
  });
}

// Navega entre seções
function navigateTo(section) {
  // Esconde seção atual
  document.querySelectorAll('.section').forEach(s => s.classList.remove('section-active'));

  // Mostra nova seção
  const target = document.getElementById(`section-${section}`);
  if (target) {
    target.classList.add('section-active');
  }

  // Atualiza navegação ativa
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  currentSection = section;

  // Fecha sidebar no mobile
  document.getElementById('sidebar')?.classList.remove('sidebar-open');

  // Atualiza título da aba (apenas se não estiver no pomodoro)
  if (pomodoroState?.mode !== 'working' || !pomodoroState?.isRunning) {
    const titles = {
      dashboard: 'Dashboard', tasks: 'Tarefas', habits: 'Hábitos',
      calendar: 'Calendário', finance: 'Finanças', goals: 'Metas',
      pomodoro: 'Pomodoro', pricing: 'Precificação', settings: 'Configurações'
    };
    document.title = `${titles[section] || section} | ZennBR`;
  }

  // Re-renderiza seção se necessário
  switch(section) {
    case 'dashboard': updateDashboard(); break;
    case 'tasks': renderTasksSection(); break;
    case 'habits': renderHabitsSection(); break;
    case 'calendar': renderCalendarSection(); break;
    case 'finance': renderFinanceSection(); setTimeout(() => updateFinanceCharts(), 100); break;
    case 'goals': renderGoalsSection(); setTimeout(() => updateGoalsChart(), 100); break;
    case 'pomodoro': renderPomodoroSection(); break;
    case 'pricing': renderPricingSection(); break;
    case 'settings': renderSettingsSection(); break;
  }
}

// Atualiza o dashboard
async function updateDashboard() {
  renderDashboardContent();
}

// Renderiza conteúdo do dashboard
async function renderDashboardContent() {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  const taskStats = getTaskStats ? getTaskStats() : {};
  const habitSummary = getHabitSummary ? getHabitSummary() : {};
  const financeSummary = getFinanceSummary ? getFinanceSummary() : {};
  const todayTasks = getTodayTasks ? getTodayTasks() : [];
  const activeGoals = getActiveGoals ? getActiveGoals() : [];
  const financeTips = generateFinancialTips(financeSummary);
  const totalTasks = (taskStats.pending || 0) + (taskStats.inProgress || 0) + (taskStats.done || 0);
  const taskCompletionPct = totalTasks > 0 ? Math.round(((taskStats.done || 0) / totalTasks) * 100) : 0;
  const habitPct = habitSummary.totalHabits > 0 ? Math.round((habitSummary.doneToday / habitSummary.totalHabits) * 100) : 0;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bom dia' : greetingHour < 18 ? 'Boa tarde' : 'Boa noite';

  container.innerHTML = `
    <div class="dashboard-hero">
      <div class="dashboard-hero-content">
        <h1 class="greeting-text">${greeting}! 👋</h1>
        <p class="greeting-sub">${formatDate(new Date())} • ${getDayOfWeek(new Date())}</p>
      </div>
      <div class="dashboard-hero-quote">
        <p class="quote-text" id="quote-text"></p>
      </div>
    </div>

    <!-- Resumo Rápido -->
    <div class="dash-section">
      <h2 class="dash-section-label">Resumo</h2>
      <div class="dashboard-kpi-row">
        <div class="kpi-card glass-card" onclick="navigateTo('tasks')">
          <div class="kpi-icon kpi-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">${taskStats.pending || 0}</span>
            <span class="kpi-label">Tarefas Pendentes</span>
          </div>
          ${taskStats.overdue > 0 ? `<span class="kpi-badge kpi-badge-danger">${taskStats.overdue} atrasadas</span>` : ''}
        </div>
        <div class="kpi-card glass-card" onclick="navigateTo('habits')">
          <div class="kpi-icon kpi-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">${habitSummary.doneToday || 0}<span class="kpi-value-sub">/${habitSummary.totalHabits || 0}</span></span>
            <span class="kpi-label">Hábitos Hoje</span>
          </div>
          ${habitSummary.topStreak?.streak > 0 ? `<span class="kpi-badge kpi-badge-fire">🔥 ${habitSummary.topStreak.streak}d</span>` : ''}
        </div>
        <div class="kpi-card glass-card" onclick="navigateTo('finance')">
          <div class="kpi-icon kpi-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value kpi-currency ${(financeSummary.balance || 0) >= 0 ? 'income-value' : 'expense-value'}">${formatCurrency(financeSummary.balance || 0)}</span>
            <span class="kpi-label">Saldo do Mês</span>
          </div>
        </div>
        <div class="kpi-card glass-card" onclick="navigateTo('goals')">
          <div class="kpi-icon kpi-orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          </div>
          <div class="kpi-info">
            <span class="kpi-value">${activeGoals.length}</span>
            <span class="kpi-label">Metas Ativas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Ações Rápidas -->
    <div class="dash-section">
      <h2 class="dash-section-label">Ações Rápidas</h2>
      <div class="dashboard-actions-row">
        <button class="dash-action-btn dash-action-task" onclick="openTaskModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nova Tarefa
        </button>
        <button class="dash-action-btn dash-action-tx" onclick="openTransactionModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Lançamento
        </button>
        <button class="dash-action-btn dash-action-pomo" onclick="navigateTo('pomodoro')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Pomodoro
        </button>
        <button class="dash-action-btn dash-action-goal" onclick="openGoalModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          Nova Meta
        </button>
      </div>
    </div>

    <!-- Atividades do Dia -->
    <div class="dash-section">
      <h2 class="dash-section-label">Hoje</h2>
      <div class="dashboard-today-row">
        <div class="dash-panel glass-card dash-panel-tasks" onclick="navigateTo('tasks')">
          <h3 class="dash-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            Tarefas de Hoje
          </h3>
          ${todayTasks.length > 0 ? `
            <div class="dash-task-list">
              ${todayTasks.slice(0, 5).map(t => `
                <div class="dash-task-item priority-${t.priority}">
                  <span class="w-task-dot"></span>
                  <span class="dash-task-title">${escapeHtml(truncate(t.title, 40))}</span>
                  <span class="dash-task-badge badge-${t.priority}">${TASK_PRIORITIES[t.priority] || t.priority}</span>
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-muted dash-empty">Nenhuma tarefa para hoje. Aproveite para planejar! 🎯</p>'}
        </div>
        <div class="dash-panel glass-card dash-panel-goals">
          <h3 class="dash-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            Progresso das Metas
          </h3>
          ${activeGoals.length === 0
            ? '<p class="text-muted dash-empty">Defina metas para acompanhar seu progresso! 🚀</p>'
            : `<div class="dash-goals-list">
                ${activeGoals.map(g => {
                  const pct = getGoalProgress ? getGoalProgress(g) : 0;
                  return `
                    <div class="dash-goal-item" onclick="navigateTo('goals')">
                      <div class="dash-goal-info">
                        <span class="dash-goal-name">${escapeHtml(truncate(g.title, 30))}</span>
                        <span class="dash-goal-pct">${pct}%</span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${pct}%; background: linear-gradient(90deg, ${pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#7c3aed'}, ${pct >= 70 ? '#059669' : pct >= 40 ? '#ef4444' : '#4f46e5'})"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>`}
        </div>
      </div>
    </div>

    <!-- Gráficos e Análise -->
    <div class="dash-section">
      <h2 class="dash-section-label">Análise</h2>
      <div class="dashboard-charts-row">
        <div class="dash-chart-card glass-card">
          <h3 class="dash-chart-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            Balanço Financeiro (6 meses)
          </h3>
          <div class="dash-chart-wrapper">
            <canvas id="dashboard-finance-chart"></canvas>
          </div>
        </div>
        <div class="dash-chart-card glass-card">
          <h3 class="dash-chart-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 0 20"></path></svg>
            Progresso Geral
          </h3>
          <div class="dash-donuts-row">
            <div class="dash-donut-item">
              <canvas id="dashboard-tasks-donut" width="120" height="120"></canvas>
              <span class="dash-donut-label">Tarefas ${taskCompletionPct}%</span>
            </div>
            <div class="dash-donut-item">
              <canvas id="dashboard-habits-donut" width="120" height="120"></canvas>
              <span class="dash-donut-label">Hábitos ${habitPct}%</span>
            </div>
            <div class="dash-donut-item">
              <canvas id="dashboard-expenses-donut" width="120" height="120"></canvas>
              <span class="dash-donut-label">Despesas por Cat.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dicas Financeiras -->
    <div class="dash-section">
      <h2 class="dash-section-label">Dicas</h2>
      <div class="dash-panel glass-card dash-panel-tips">
        <h3 class="dash-panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          Dicas Financeiras
        </h3>
        <div class="dash-tips-grid">
          ${financeTips.map(tip => `
            <div class="dash-tip-item">
              <span class="dash-tip-icon">${tip.icon}</span>
              <div class="dash-tip-content">
                <strong>${escapeHtml(tip.title)}</strong>
                <p>${escapeHtml(tip.text)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Carrega gráficos e citação após renderizar
  setTimeout(() => {
    renderDashboardFinanceChart();
    renderDashboardTasksDonut(taskStats);
    renderDashboardHabitsDonut(habitSummary);
    renderDashboardExpensesDonut();
    loadDailyQuote();
  }, 100);
}

// Carrega citação diária
function loadDailyQuote() {
  const quoteEl = document.getElementById('quote-text');
  if (!quoteEl) return;
  setDefaultQuote(quoteEl);
}

// Define frase motivacional padrão
function setDefaultQuote(el) {
  const defaultQuotes = [
    'A disciplina é a ponte entre metas e realizações.',
    'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
    'Não espere. O momento nunca será perfeito.',
    'Você não precisa ser grande para começar, mas precisa começar para ser grande.',
    'Cada dia é uma nova oportunidade de mudar sua vida.',
    'A procrastinação é o ladrão do tempo. Aja agora!',
    'Invista em você. É o melhor retorno que existe.',
    'Quem controla seu dinheiro, controla seu futuro.',
    'Pequenos hábitos criam grandes transformações.',
    'Foque no progresso, não na perfeição.',
    'O melhor momento para começar é agora.',
    'Sua consistência de hoje é sua liberdade de amanhã.',
    'Gaste menos do que ganha. Invista a diferença.',
    'Planeje suas metas e trabalhe seu plano.'
  ];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  if (el) el.textContent = defaultQuotes[dayOfYear % defaultQuotes.length];
}

// Gera dicas financeiras baseadas nos dados do usuário
function generateFinancialTips(financeSummary) {
  const tips = [];
  const income = financeSummary.income || 0;
  const expense = financeSummary.expense || 0;
  const balance = financeSummary.balance || 0;

  if (income === 0 && expense === 0) {
    tips.push({ icon: '📊', title: 'Comece a registrar', text: 'Registre suas receitas e despesas para ter controle total das suas finanças.' });
    tips.push({ icon: '🎯', title: 'Defina metas financeiras', text: 'Crie metas de economia ou investimento para construir seu patrimônio.' });
    tips.push({ icon: '💡', title: 'Regra 50/30/20', text: 'Destine 50% para necessidades, 30% para desejos e 20% para poupança/investimentos.' });
    return tips;
  }

  if (balance < 0) {
    tips.push({ icon: '🚨', title: 'Atenção: Saldo negativo', text: 'Suas despesas superam suas receitas. Revise gastos não essenciais e corte o que puder.' });
    tips.push({ icon: '📉', title: 'Reduza dívidas', text: 'Priorize pagar dívidas com juros altos primeiro. Negocie condições melhores.' });
    tips.push({ icon: '💪', title: 'Renda extra', text: 'Considere freelances ou vender itens não utilizados para equilibrar as contas.' });
  } else if (income > 0 && expense >= income * 0.8) {
    const pct = Math.round((expense / income) * 100);
    tips.push({ icon: '⚠️', title: `Gastos altos: ${pct}%`, text: 'Você está gastando mais de 80% da sua renda. Tente reduzir gastos variáveis.' });
    tips.push({ icon: '🏦', title: 'Fundo de emergência', text: 'Reserve pelo menos 3 a 6 meses de despesas para imprevistos.' });
    tips.push({ icon: '📋', title: 'Revise assinaturas', text: 'Cancele serviços que você não usa com frequência.' });
  } else if (balance > 0) {
    tips.push({ icon: '✅', title: 'Parabéns! Saldo positivo', text: `Você economizou ${formatCurrency(balance)} este mês. Continue assim!` });
    tips.push({ icon: '📈', title: 'Invista o excedente', text: 'Coloque o dinheiro que sobra em investimentos para aumentar seu patrimônio.' });
    tips.push({ icon: '🏆', title: 'Aumente sua meta', text: 'Tente aumentar sua taxa de economia em 5% a cada mês.' });
  }

  if (income > 0 && tips.length < 3) {
    tips.push({ icon: '💰', title: 'Diversifique renda', text: 'Busque novas fontes de renda para não depender de uma única fonte.' });
  }

  return tips.slice(0, 3);
}

// Renderiza donut de tarefas no dashboard
function renderDashboardTasksDonut(taskStats) {
  const canvas = document.getElementById('dashboard-tasks-donut');
  if (!canvas || !isChartJsAvailable()) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const done = taskStats.done || 0;
  const pending = taskStats.pending || 0;
  const inProgress = taskStats.inProgress || 0;
  const total = done + pending + inProgress;

  if (total === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
    return;
  }

  const pct = Math.round((done / total) * 100);

  new Chart(canvas, {
    type: 'doughnut',
    plugins: [centerTextPlugin],
    data: {
      labels: ['Concluídas', 'Pendentes', 'Em andamento'],
      datasets: [{
        data: [done, pending, inProgress],
        backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(59, 130, 246, 0.7)'],
        borderColor: ['#10b981', '#f59e0b', '#3b82f6'],
        borderWidth: 2,
        hoverOffset: 6,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeOutQuart' },
      cutout: '70%',
      plugins: {
        centerText: {
          text: `${pct}%`,
          fontSize: 16,
          color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#e2e8f0'
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 14, 23, 0.9)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(124, 58, 237, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 8,
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` }
        }
      }
    }
  });
}

// Renderiza donut de hábitos no dashboard
function renderDashboardHabitsDonut(habitSummary) {
  const canvas = document.getElementById('dashboard-habits-donut');
  if (!canvas || !isChartJsAvailable()) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const done = habitSummary.doneToday || 0;
  const remaining = Math.max(0, (habitSummary.totalHabits || 0) - done);

  if (done === 0 && remaining === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
    return;
  }

  const total = done + remaining;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  new Chart(canvas, {
    type: 'doughnut',
    plugins: [centerTextPlugin],
    data: {
      labels: ['Feitos', 'Restantes'],
      datasets: [{
        data: [done, remaining],
        backgroundColor: ['rgba(124, 58, 237, 0.7)', 'rgba(255, 255, 255, 0.06)'],
        borderColor: ['#7c3aed', 'rgba(255, 255, 255, 0.12)'],
        borderWidth: 2,
        hoverOffset: 6,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeOutQuart' },
      cutout: '70%',
      plugins: {
        centerText: {
          text: `${pct}%`,
          fontSize: 16,
          color: pct >= 70 ? '#10b981' : pct >= 40 ? '#a78bfa' : '#e2e8f0'
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 14, 23, 0.9)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(124, 58, 237, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 8,
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` }
        }
      }
    }
  });
}

// Renderiza donut de despesas por categoria no dashboard
function renderDashboardExpensesDonut() {
  const canvas = document.getElementById('dashboard-expenses-donut');
  if (!canvas || !isChartJsAvailable()) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const data = getExpensesByCategory ? getExpensesByCategory() : [];

  if (data.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
    return;
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  new Chart(canvas, {
    type: 'doughnut',
    plugins: [centerTextPlugin],
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: CHART_COLORS.map(c => c + 'aa'),
        borderColor: CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 6,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeOutQuart' },
      cutout: '70%',
      plugins: {
        centerText: {
          text: data.length.toString(),
          fontSize: 18,
          color: '#e2e8f0',
          subText: 'categorias',
          subColor: '#64748b',
          subFontSize: 9
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 14, 23, 0.9)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(124, 58, 237, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 8,
          callbacks: {
            label: ctx => {
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// Aplica tema dark/light
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  appSettings.theme = theme;
}

// Alterna tema
function toggleTheme() {
  const newTheme = appSettings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  saveAppSettings();
  showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado.`, 'info');
}

// Toggle sidebar (desktop)
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  if (sidebar) sidebar.classList.toggle('collapsed', sidebarCollapsed);
  if (mainContent) mainContent.classList.toggle('sidebar-collapsed', sidebarCollapsed);
}

// Toggle sidebar (mobile)
function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('sidebar-open');
}

// Salva configurações do app
function saveAppSettings() {
  save(KEYS.SETTINGS, appSettings);
}

// Carrega e renderiza configurações
function loadSettings() {
  appSettings = load(KEYS.SETTINGS, { theme: 'dark' });
}

// Renderiza seção de configurações
function renderSettingsSection() {
  const container = document.getElementById('settings-container');
  if (!container) return;

  const settings = load(KEYS.SETTINGS, {});

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93l-1.41 1.41M17.66 17.66l1.41 1.41M4.93 4.93l1.41 1.41M6.34 17.66l-1.41 1.41M20 12h2M2 12h2M12 2v2M12 20v2"></path></svg>
        Configurações
      </h2>
    </div>

    <div class="settings-grid">

      <div class="settings-card glass-card">
        <h3>🎨 Aparência</h3>
        <div class="setting-item">
          <div class="setting-info">
            <strong>Tema</strong>
            <p>Alterne entre o tema escuro e claro</p>
          </div>
          <div class="theme-toggle-wrapper">
            <button class="btn ${settings.theme !== 'light' ? 'btn-primary' : 'btn-outline'}" onclick="applyTheme('dark'); saveAppSettings(); renderSettingsSection()">
              🌙 Escuro
            </button>
            <button class="btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-outline'}" onclick="applyTheme('light'); saveAppSettings(); renderSettingsSection()">
              ☀️ Claro
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card glass-card">
        <h3>📦 Dados</h3>
        <div class="settings-actions">
          <div class="setting-item">
            <div class="setting-info">
              <strong>Exportar dados</strong>
              <p>Baixe todos os seus dados em JSON</p>
            </div>
            <button class="btn btn-outline" onclick="exportAllData()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Exportar
            </button>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <strong>Importar dados</strong>
              <p>Restaure dados de um backup JSON</p>
            </div>
            <label class="btn btn-outline" for="import-file-input">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Importar
            </label>
            <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="handleImportFile(event)">
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <strong>Espaço usado</strong>
              <p>Armazenamento local utilizado</p>
            </div>
            <span class="storage-size">${getStorageSize ? getStorageSize() : '0'} KB</span>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <strong>Limpar todos os dados</strong>
              <p class="text-danger">Esta ação é irreversível!</p>
            </div>
            <button class="btn btn-danger" onclick="confirmClearAll()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
              Limpar tudo
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card glass-card">
        <h3>ℹ️ Sobre</h3>
        <div class="about-info">
          <p><strong>ZennBR</strong> v1.0</p>
          <p>Sistema de autogerenciamento pessoal & empresarial</p>
          <p class="text-muted">Todos os dados são armazenados localmente no seu dispositivo.</p>
          <p class="text-muted">PWA habilitado - você pode instalar o app no seu dispositivo.</p>
        </div>
      </div>

    </div>
  `;
}

// Importa arquivo de dados
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const success = importData(e.target.result);
    if (success) {
      initAllModules();
      renderSettingsSection();
    }
  };
  reader.readAsText(file);
}

// Confirma limpeza de todos os dados
function confirmClearAll() {
  if (confirm('⚠️ Tem certeza? Todos os seus dados serão removidos permanentemente!\n\nEsta ação NÃO pode ser desfeita.')) {
    if (confirm('Confirme novamente: REMOVER TODOS OS DADOS?')) {
      clearAll();
      initAllModules();
      navigateTo('dashboard');
    }
  }
}

// Configuração do PWA Install Prompt
let deferredInstallPrompt = null;

function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });
}

function showInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) banner.style.display = 'flex';
}

function installPWA() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        showToast('App instalado com sucesso!', 'success');
      }
      deferredInstallPrompt = null;
      const banner = document.getElementById('install-banner');
      if (banner) banner.style.display = 'none';
    });
  }
}

function dismissInstallBanner() {
  const banner = document.getElementById('install-banner');
  if (banner) banner.style.display = 'none';
}
