// Módulo principal - Orquestrador da aplicação

let currentSection = 'dashboard';
let appSettings = {};
let sidebarCollapsed = false;

// Inicializa toda a aplicação
document.addEventListener('DOMContentLoaded', () => {
  appSettings = load(KEYS.SETTINGS, { theme: 'dark', openaiApiKey: '' });
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
  initAICoach();
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
      pomodoro: 'Pomodoro', 'ai-coach': 'AI Coach', settings: 'Configurações'
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
    case 'ai-coach': renderAICoachSection(); break;
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

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bom dia' : greetingHour < 18 ? 'Boa tarde' : 'Boa noite';

  container.innerHTML = `
    <div class="dashboard-greeting">
      <h1 class="greeting-text">${greeting}! 👋</h1>
      <p class="greeting-sub">${formatDate(new Date())} • ${getDayOfWeek(new Date())}</p>
    </div>

    <div class="dashboard-widgets">

      <!-- Widget de tarefas -->
      <div class="widget glass-card widget-tasks" onclick="navigateTo('tasks')">
        <div class="widget-header">
          <div class="widget-icon widget-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <h3>Tarefas</h3>
        </div>
        <div class="widget-stats">
          <div class="w-stat">
            <span class="w-stat-num">${taskStats.pending || 0}</span>
            <span class="w-stat-label">Pendentes</span>
          </div>
          <div class="w-stat">
            <span class="w-stat-num">${taskStats.inProgress || 0}</span>
            <span class="w-stat-label">Em andamento</span>
          </div>
          <div class="w-stat ${taskStats.overdue > 0 ? 'overdue' : ''}">
            <span class="w-stat-num">${taskStats.overdue || 0}</span>
            <span class="w-stat-label">Atrasadas</span>
          </div>
        </div>
        ${todayTasks.length > 0 ? `
          <div class="widget-task-list">
            ${todayTasks.slice(0, 3).map(t => `
              <div class="w-task-item priority-${t.priority}">
                <span class="w-task-dot"></span>
                <span class="w-task-title">${escapeHtml(truncate(t.title, 35))}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Widget financeiro -->
      <div class="widget glass-card widget-finance" onclick="navigateTo('finance')">
        <div class="widget-header">
          <div class="widget-icon widget-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <h3>Finanças (mês)</h3>
        </div>
        <div class="widget-finance-values">
          <div class="w-finance-row">
            <span class="w-finance-label">Receitas</span>
            <span class="w-finance-val income-value">${formatCurrency(financeSummary.income || 0)}</span>
          </div>
          <div class="w-finance-row">
            <span class="w-finance-label">Despesas</span>
            <span class="w-finance-val expense-value">${formatCurrency(financeSummary.expense || 0)}</span>
          </div>
          <div class="w-finance-row w-finance-balance">
            <span class="w-finance-label">Saldo</span>
            <span class="w-finance-val ${(financeSummary.balance || 0) >= 0 ? 'income-value' : 'expense-value'}">${formatCurrency(financeSummary.balance || 0)}</span>
          </div>
        </div>
        <div class="widget-chart-mini">
          <canvas id="dashboard-finance-chart" height="60"></canvas>
        </div>
      </div>

      <!-- Widget de hábitos -->
      <div class="widget glass-card widget-habits" onclick="navigateTo('habits')">
        <div class="widget-header">
          <div class="widget-icon widget-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <h3>Hábitos Hoje</h3>
        </div>
        <div class="widget-habits-progress">
          <div class="habits-done-count">
            <span class="big-number">${habitSummary.doneToday || 0}</span>
            <span class="of-total">/ ${habitSummary.totalHabits || 0}</span>
          </div>
          ${habitSummary.totalHabits > 0 ? `
            <div class="progress-bar-wrapper">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${habitSummary.totalHabits > 0 ? Math.round((habitSummary.doneToday / habitSummary.totalHabits) * 100) : 0}%; background: linear-gradient(90deg, #3b82f6, #7c3aed)"></div>
              </div>
            </div>
          ` : ''}
          ${habitSummary.topStreak?.streak > 0 ? `
            <p class="streak-info">🔥 Maior streak: ${habitSummary.topStreak.icon} ${habitSummary.topStreak.streak} dias</p>
          ` : ''}
        </div>
      </div>

      <!-- Widget de metas -->
      <div class="widget glass-card widget-goals" onclick="navigateTo('goals')">
        <div class="widget-header">
          <div class="widget-icon widget-icon-orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          </div>
          <h3>Metas Ativas</h3>
        </div>
        <div class="widget-goals-list">
          ${activeGoals.length === 0
            ? '<p class="text-muted">Nenhuma meta ativa</p>'
            : activeGoals.map(g => `
              <div class="w-goal-item">
                <span class="w-goal-title">${escapeHtml(truncate(g.title, 28))}</span>
                <div class="w-goal-bar">
                  <div class="progress-fill w-goal-fill" style="width: ${getGoalProgress ? getGoalProgress(g) : 0}%"></div>
                </div>
                <span class="w-goal-pct">${getGoalProgress ? getGoalProgress(g) : 0}%</span>
              </div>
            `).join('')}
        </div>
      </div>

      <!-- Widget de citação motivacional -->
      <div class="widget glass-card widget-quote" id="quote-widget">
        <div class="widget-header">
          <div class="widget-icon widget-icon-neon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3>Motivação do Dia</h3>
        </div>
        <div class="quote-content" id="quote-content">
          <p class="quote-text" id="quote-text">Carregando frase do dia...</p>
        </div>
      </div>

      <!-- Widget de ação rápida -->
      <div class="widget glass-card widget-quick-actions">
        <div class="widget-header">
          <div class="widget-icon widget-icon-pink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <h3>Ações Rápidas</h3>
        </div>
        <div class="quick-actions-grid">
          <button class="quick-action-card" onclick="openTaskModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Tarefa
          </button>
          <button class="quick-action-card" onclick="openTransactionModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Lançamento
          </button>
          <button class="quick-action-card" onclick="navigateTo('pomodoro')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Pomodoro
          </button>
          <button class="quick-action-card" onclick="navigateTo('ai-coach')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            AI Coach
          </button>
        </div>
      </div>

    </div>
  `;

  // Carrega gráfico e citação após renderizar
  setTimeout(() => {
    renderDashboardFinanceChart();
    loadDailyQuote();
  }, 100);
}

// Carrega citação diária
async function loadDailyQuote() {
  const quoteEl = document.getElementById('quote-text');
  if (!quoteEl) return;

  // Tenta carregar do cache primeiro
  const cached = load(KEYS.MOTIVATIONAL_QUOTE, null);
  if (cached && cached.date === todayString()) {
    quoteEl.textContent = cached.quote;
    return;
  }

  const settings = load(KEYS.SETTINGS, {});
  if (settings.openaiApiKey) {
    try {
      const quote = await getMotivationalQuote();
      if (quote && quoteEl) quoteEl.textContent = quote;
    } catch(e) {
      setDefaultQuote(quoteEl);
    }
  } else {
    setDefaultQuote(quoteEl);
  }
}

// Define frase motivacional padrão
function setDefaultQuote(el) {
  const defaultQuotes = [
    'A disciplina é a ponte entre metas e realizações.',
    'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
    'Não espere. O momento nunca será perfeito.',
    'Você não precisa ser grande para começar, mas precisa começar para ser grande.',
    'Cada dia é uma nova oportunidade de mudar sua vida.',
    'A procrastinação é o ladrão do tempo. Aja agora!'
  ];
  const today = new Date().getDay();
  if (el) el.textContent = defaultQuotes[today % defaultQuotes.length];
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
  appSettings = load(KEYS.SETTINGS, { theme: 'dark', openaiApiKey: '' });
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
        <h3>🤖 OpenAI API</h3>
        <div class="setting-item setting-vertical">
          <div class="setting-info">
            <strong>Chave da API OpenAI</strong>
            <p>Necessária para o AI Coach e frases motivacionais diárias. Sua chave fica salva apenas localmente.</p>
          </div>
          <div class="api-key-input-wrapper">
            <input type="password" class="filter-input" id="openai-api-key-input"
                   placeholder="sk-..."
                   value="${escapeHtml(settings.openaiApiKey || '')}">
            <button class="btn btn-primary" onclick="saveApiKey()">Salvar</button>
            <button class="btn btn-outline" onclick="toggleApiKeyVisibility()">👁</button>
          </div>
          ${settings.openaiApiKey ? '<p class="text-success">✅ Chave configurada</p>' : '<p class="text-muted">❌ Chave não configurada</p>'}
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

// Salva chave da API
function saveApiKey() {
  const key = document.getElementById('openai-api-key-input')?.value?.trim();
  appSettings.openaiApiKey = key || '';
  saveAppSettings();
  showToast(key ? 'Chave da API salva!' : 'Chave da API removida.', key ? 'success' : 'info');
  renderSettingsSection();
}

// Alterna visibilidade da chave
function toggleApiKeyVisibility() {
  const input = document.getElementById('openai-api-key-input');
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
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
