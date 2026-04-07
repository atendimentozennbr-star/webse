// Módulo Financeiro

let transactionsData = [];
let financeFilters = { type: 'all', category: 'all', month: '' };
let editingTransactionId = null;

const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Vendas', 'Outros'];
const EXPENSE_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Educação', 'Saúde', 'Outros'];

// Inicializa módulo financeiro
function initFinance() {
  transactionsData = load(KEYS.TRANSACTIONS, []);
  renderFinanceSection();
}

// Cria transação
function createTransaction(data) {
  const tx = {
    id: generateId(),
    type: data.type,
    amount: parseFloat(data.amount),
    category: data.category,
    description: data.description || '',
    date: data.date,
    createdAt: new Date().toISOString()
  };
  transactionsData.unshift(tx);
  save(KEYS.TRANSACTIONS, transactionsData);
  return tx;
}

// Atualiza transação
function updateTransaction(id, updates) {
  const index = transactionsData.findIndex(t => t.id === id);
  if (index === -1) return null;
  if (updates.amount !== undefined) updates.amount = parseFloat(updates.amount);
  transactionsData[index] = { ...transactionsData[index], ...updates };
  save(KEYS.TRANSACTIONS, transactionsData);
  return transactionsData[index];
}

// Remove transação
function deleteTransaction(id) {
  transactionsData = transactionsData.filter(t => t.id !== id);
  save(KEYS.TRANSACTIONS, transactionsData);
}

// Calcula totais
function calculateTotals(transactions) {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

// Obtém resumo do mês atual
function getMonthlyTotals(year, month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthly = transactionsData.filter(t => t.date && t.date.startsWith(prefix));
  return calculateTotals(monthly);
}

// Obtém resumo dos últimos 6 meses para o gráfico de barras
function getLast6MonthsData() {
  const data = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthly = transactionsData.filter(t => t.date && t.date.startsWith(prefix));
    const totals = calculateTotals(monthly);
    data.push({
      label: `${getMonthShort(d.getMonth())}/${d.getFullYear()}`,
      income: totals.income,
      expense: totals.expense
    });
  }
  return data;
}

// Obtém gastos por categoria para o gráfico de pizza
function getExpensesByCategory() {
  const today = new Date();
  const prefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthlyExpenses = transactionsData.filter(t => t.type === 'expense' && t.date && t.date.startsWith(prefix));

  const byCat = {};
  monthlyExpenses.forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });

  return Object.entries(byCat).map(([cat, total]) => ({ category: cat, total }))
    .sort((a, b) => b.total - a.total);
}

// Verifica alertas financeiros
function checkFinancialAlerts() {
  const today = new Date();
  const totals = getMonthlyTotals(today.getFullYear(), today.getMonth());
  const alerts = [];

  if (totals.income > 0 && totals.expense >= totals.income * 0.8) {
    const pct = Math.round((totals.expense / totals.income) * 100);
    alerts.push({ type: 'warning', message: `⚠️ Você já gastou ${pct}% da sua renda este mês!` });
  }

  if (totals.balance < 0) {
    alerts.push({ type: 'error', message: `🚨 Saldo negativo de ${formatCurrency(Math.abs(totals.balance))} este mês!` });
  }

  return alerts;
}

// Filtra transações
function filterTransactions() {
  return transactionsData.filter(tx => {
    if (financeFilters.type !== 'all' && tx.type !== financeFilters.type) return false;
    if (financeFilters.category !== 'all' && tx.category !== financeFilters.category) return false;
    if (financeFilters.month && !tx.date.startsWith(financeFilters.month)) return false;
    return true;
  });
}

// Renderiza seção financeira
function renderFinanceSection() {
  const container = document.getElementById('finance-container');
  if (!container) return;

  const today = new Date();
  const monthlyTotals = getMonthlyTotals(today.getFullYear(), today.getMonth());
  const allTotals = calculateTotals(transactionsData);
  const alerts = checkFinancialAlerts();
  const filtered = filterTransactions();

  // Gera lista de meses para filtro
  const months = new Set();
  transactionsData.forEach(t => { if (t.date) months.add(t.date.substring(0, 7)); });
  const monthList = Array.from(months).sort().reverse();

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        Finanças
      </h2>
      <button class="btn btn-primary" onclick="openTransactionModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Nova Transação
      </button>
    </div>

    ${alerts.map(a => `<div class="alert alert-${a.type}">${a.message}</div>`).join('')}

    <div class="finance-summary">
      <div class="finance-card glass-card finance-income">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Receitas (mês)</span>
          <span class="finance-card-value income-value">${formatCurrency(monthlyTotals.income)}</span>
        </div>
      </div>
      <div class="finance-card glass-card finance-expense">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Despesas (mês)</span>
          <span class="finance-card-value expense-value">${formatCurrency(monthlyTotals.expense)}</span>
        </div>
      </div>
      <div class="finance-card glass-card finance-balance">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Saldo (mês)</span>
          <span class="finance-card-value ${monthlyTotals.balance >= 0 ? 'income-value' : 'expense-value'}">${formatCurrency(monthlyTotals.balance)}</span>
        </div>
      </div>
      <div class="finance-card glass-card">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Saldo total</span>
          <span class="finance-card-value ${allTotals.balance >= 0 ? 'income-value' : 'expense-value'}">${formatCurrency(allTotals.balance)}</span>
        </div>
      </div>
    </div>

    <div class="finance-charts-row">
      <div class="chart-container glass-card">
        <h3>Despesas por Categoria (mês atual)</h3>
        <div class="chart-wrapper">
          <canvas id="finance-pie-chart"></canvas>
        </div>
      </div>
      <div class="chart-container glass-card">
        <h3>Receitas vs Despesas (6 meses)</h3>
        <div class="chart-wrapper">
          <canvas id="finance-bar-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="transactions-section glass-card">
      <div class="transactions-header">
        <h3>Transações</h3>
        <div class="filters-bar-inline">
          <select class="filter-select" onchange="financeFilters.type=this.value; renderFinanceSection(); updateFinanceCharts()">
            <option value="all" ${financeFilters.type==='all'?'selected':''}>Todos</option>
            <option value="income" ${financeFilters.type==='income'?'selected':''}>Receitas</option>
            <option value="expense" ${financeFilters.type==='expense'?'selected':''}>Despesas</option>
          </select>
          <select class="filter-select" onchange="financeFilters.month=this.value; renderFinanceSection(); updateFinanceCharts()">
            <option value="">Todos os meses</option>
            ${monthList.map(m => {
              const parts = m.split('-');
              const label = `${getMonthName(parseInt(parts[1])-1)} ${parts[0]}`;
              return `<option value="${m}" ${financeFilters.month===m?'selected':''}>${label}</option>`;
            }).join('')}
          </select>
          <select class="filter-select" onchange="financeFilters.category=this.value; renderFinanceSection()">
            <option value="all">Todas categorias</option>
            ${[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c => `<option value="${c}" ${financeFilters.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="transactions-list">
        ${filtered.length === 0
          ? '<div class="empty-state"><div class="empty-icon">💰</div><p>Nenhuma transação encontrada</p></div>'
          : filtered.map(tx => renderTransactionItem(tx)).join('')}
      </div>
    </div>
  `;

  // Renderiza gráficos após inserir HTML
  setTimeout(() => updateFinanceCharts(), 50);
}

// Renderiza item de transação
function renderTransactionItem(tx) {
  return `
    <div class="transaction-item ${tx.type}">
      <div class="transaction-icon">
        ${tx.type === 'income'
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline></svg>`}
      </div>
      <div class="transaction-info">
        <strong>${escapeHtml(tx.description || tx.category)}</strong>
        <div class="transaction-meta">
          <span class="badge badge-category">${escapeHtml(tx.category)}</span>
          <span class="transaction-date">📅 ${formatDate(new Date(tx.date))}</span>
        </div>
      </div>
      <div class="transaction-amount ${tx.type === 'income' ? 'income-value' : 'expense-value'}">
        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
      </div>
      <div class="transaction-actions">
        <button class="btn-icon" onclick="openTransactionModal('${tx.id}')" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-icon btn-danger" onclick="confirmDeleteTransaction('${tx.id}')" title="Excluir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `;
}

// Abre modal de transação
function openTransactionModal(id = null) {
  editingTransactionId = id;
  const tx = id ? transactionsData.find(t => t.id === id) : null;

  document.getElementById('transaction-modal-title').textContent = id ? 'Editar Transação' : 'Nova Transação';
  document.getElementById('tx-type-input').value = tx?.type || 'expense';
  document.getElementById('tx-amount-input').value = tx?.amount || '';
  document.getElementById('tx-desc-input').value = tx?.description || '';
  document.getElementById('tx-date-input').value = tx?.date || formatDateForInput(new Date());

  updateTransactionCategoryOptions(tx?.type || 'expense', tx?.category);

  document.getElementById('tx-type-input').addEventListener('change', function() {
    updateTransactionCategoryOptions(this.value);
  });

  document.getElementById('transaction-modal').classList.add('modal-open');
}

// Atualiza opções de categoria baseado no tipo
function updateTransactionCategoryOptions(type, selectedCat) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const select = document.getElementById('tx-category-input');
  select.innerHTML = cats.map(c => `<option value="${c}" ${selectedCat === c ? 'selected' : ''}>${c}</option>`).join('');
}

// Fecha modal de transação
function closeTransactionModal() {
  document.getElementById('transaction-modal').classList.remove('modal-open');
  editingTransactionId = null;
}

// Salva transação do formulário
function saveTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount-input').value);
  if (!amount || amount <= 0) { showToast('Valor inválido.', 'error'); return; }
  const date = document.getElementById('tx-date-input').value;
  if (!date) { showToast('Data é obrigatória.', 'error'); return; }

  const data = {
    type: document.getElementById('tx-type-input').value,
    amount,
    category: document.getElementById('tx-category-input').value,
    description: document.getElementById('tx-desc-input').value.trim(),
    date
  };

  if (editingTransactionId) {
    updateTransaction(editingTransactionId, data);
    showToast('Transação atualizada!', 'success');
  } else {
    createTransaction(data);
    showToast('Transação adicionada!', 'success');
  }

  closeTransactionModal();
  renderFinanceSection();
  updateDashboard();
}

// Confirma exclusão de transação
function confirmDeleteTransaction(id) {
  const tx = transactionsData.find(t => t.id === id);
  if (!tx) return;
  if (confirm(`Excluir a transação "${tx.description || tx.category}"?`)) {
    deleteTransaction(id);
    showToast('Transação excluída.', 'info');
    renderFinanceSection();
    updateDashboard();
  }
}

// Obtém dados financeiros para o dashboard
function getFinanceSummary() {
  const today = new Date();
  return getMonthlyTotals(today.getFullYear(), today.getMonth());
}
