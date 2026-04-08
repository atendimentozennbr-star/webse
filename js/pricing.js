// Módulo de Precificação SaaS e Pró-Labore

let pricingPlans = [];
let proLaboreConfig = {};
let editingPlanId = null;

// Ciclos de cobrança disponíveis
const BILLING_CYCLES = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' }
];

// Inicializa módulo de precificação
function initPricing() {
  pricingPlans = load(KEYS.PRICING_PLANS, []);
  proLaboreConfig = load(KEYS.PRO_LABORE, {
    enabled: false,
    type: 'fixed',
    fixedValue: 0,
    percentage: 0,
    baseRevenue: 'total',
    description: ''
  });
}

// === CRUD de Planos ===

function createPlan(data) {
  const plan = {
    id: generateId(),
    name: data.name,
    description: data.description || '',
    monthlyPrice: parseFloat(data.monthlyPrice) || 0,
    annualPrice: parseFloat(data.annualPrice) || 0,
    billingCycle: data.billingCycle || 'monthly',
    features: data.features || [],
    isPopular: data.isPopular || false,
    isActive: data.isActive !== false,
    maxUsers: data.maxUsers || '',
    createdAt: new Date().toISOString()
  };
  pricingPlans.push(plan);
  save(KEYS.PRICING_PLANS, pricingPlans);
  return plan;
}

function updatePlan(id, updates) {
  const index = pricingPlans.findIndex(p => p.id === id);
  if (index === -1) return null;
  if (updates.monthlyPrice !== undefined) updates.monthlyPrice = parseFloat(updates.monthlyPrice);
  if (updates.annualPrice !== undefined) updates.annualPrice = parseFloat(updates.annualPrice);
  pricingPlans[index] = { ...pricingPlans[index], ...updates };
  save(KEYS.PRICING_PLANS, pricingPlans);
  return pricingPlans[index];
}

function deletePlan(id) {
  pricingPlans = pricingPlans.filter(p => p.id !== id);
  save(KEYS.PRICING_PLANS, pricingPlans);
}

// === Pró-Labore ===

function saveProLabore(config) {
  proLaboreConfig = {
    ...proLaboreConfig,
    ...config,
    fixedValue: parseFloat(config.fixedValue) || 0,
    percentage: parseFloat(config.percentage) || 0
  };
  save(KEYS.PRO_LABORE, proLaboreConfig);
  return proLaboreConfig;
}

// Calcula valor do pró-labore com base na receita
function calculateProLabore() {
  if (!proLaboreConfig.enabled) return 0;

  if (proLaboreConfig.type === 'fixed') {
    return proLaboreConfig.fixedValue;
  }

  // Tipo percentual - calcula sobre a receita
  let revenue = 0;
  if (proLaboreConfig.baseRevenue === 'total') {
    revenue = calculateTotalPlanRevenue();
  } else if (proLaboreConfig.baseRevenue === 'monthly') {
    revenue = calculateMonthlyPlanRevenue();
  }

  return (revenue * proLaboreConfig.percentage) / 100;
}

// Calcula receita total dos planos (estimativa mensal)
function calculateTotalPlanRevenue() {
  return pricingPlans
    .filter(p => p.isActive)
    .reduce((sum, p) => sum + (p.monthlyPrice || 0), 0);
}

// Alias para compatibilidade com diferentes bases de cálculo
function calculateMonthlyPlanRevenue() {
  return calculateTotalPlanRevenue();
}

// === Simulação de Receita ===

function simulateRevenue(plan, subscribers) {
  const monthly = plan.monthlyPrice * subscribers;
  const annual = (plan.annualPrice || plan.monthlyPrice * 12) * subscribers;
  return { monthly, annual };
}

// === Renderização Principal ===

function renderPricingSection() {
  const container = document.getElementById('pricing-container');
  if (!container) return;

  const totalMonthly = calculateMonthlyPlanRevenue();
  const proLaboreValue = calculateProLabore();
  const activePlans = pricingPlans.filter(p => p.isActive).length;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
        Precificação
      </h2>
      <div class="section-header-actions">
        <button class="btn btn-primary" onclick="openPlanModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo Plano
        </button>
      </div>
    </div>

    <!-- Resumo -->
    <div class="pricing-summary">
      <div class="finance-card glass-card">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Planos Ativos</span>
          <span class="finance-card-value">${activePlans}</span>
        </div>
      </div>
      <div class="finance-card glass-card finance-income">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Receita Mensal (planos)</span>
          <span class="finance-card-value income-value">${formatCurrency(totalMonthly)}</span>
        </div>
      </div>
      <div class="finance-card glass-card">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Pró-Labore</span>
          <span class="finance-card-value ${proLaboreConfig.enabled ? 'income-value' : ''}">${proLaboreConfig.enabled ? formatCurrency(proLaboreValue) : 'Não definido'}</span>
        </div>
      </div>
      <div class="finance-card glass-card finance-balance">
        <div class="finance-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
        <div class="finance-card-info">
          <span class="finance-card-label">Receita - Pró-Labore</span>
          <span class="finance-card-value income-value">${formatCurrency(totalMonthly - proLaboreValue)}</span>
        </div>
      </div>
    </div>

    <!-- Planos -->
    <div class="pricing-plans-section">
      <h3 class="pricing-section-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        Planos SaaS
      </h3>
      ${pricingPlans.length === 0
        ? `<div class="empty-state glass-card">
            <div class="empty-icon">🏷️</div>
            <p>Nenhum plano cadastrado</p>
            <p class="text-muted">Crie planos de assinatura para seus produtos SaaS</p>
            <button class="btn btn-primary" onclick="openPlanModal()" style="margin-top: 12px;">Criar primeiro plano</button>
          </div>`
        : `<div class="pricing-cards-grid">
            ${pricingPlans.map(plan => renderPlanCard(plan)).join('')}
          </div>`
      }
    </div>

    <!-- Pró-Labore -->
    <div class="prolabore-section glass-card">
      <div class="prolabore-header">
        <h3 class="pricing-section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
          Pró-Labore
        </h3>
        <button class="btn btn-outline btn-sm" onclick="openProLaboreModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Configurar
        </button>
      </div>
      <div class="prolabore-content">
        <p class="prolabore-description">
          O pró-labore é a remuneração do sócio/administrador da empresa pelo trabalho exercido.
          É diferente do lucro distribuído — representa o "salário" do empresário.
        </p>
        ${proLaboreConfig.enabled ? `
          <div class="prolabore-details">
            <div class="prolabore-detail-item">
              <span class="prolabore-detail-label">Tipo</span>
              <span class="prolabore-detail-value">${proLaboreConfig.type === 'fixed' ? 'Valor Fixo' : 'Percentual da Receita'}</span>
            </div>
            ${proLaboreConfig.type === 'fixed' ? `
              <div class="prolabore-detail-item">
                <span class="prolabore-detail-label">Valor Mensal</span>
                <span class="prolabore-detail-value income-value">${formatCurrency(proLaboreConfig.fixedValue)}</span>
              </div>
            ` : `
              <div class="prolabore-detail-item">
                <span class="prolabore-detail-label">Percentual</span>
                <span class="prolabore-detail-value">${proLaboreConfig.percentage}%</span>
              </div>
              <div class="prolabore-detail-item">
                <span class="prolabore-detail-label">Base de Cálculo</span>
                <span class="prolabore-detail-value">${proLaboreConfig.baseRevenue === 'total' ? 'Receita Total dos Planos' : 'Receita Mensal'}</span>
              </div>
              <div class="prolabore-detail-item">
                <span class="prolabore-detail-label">Valor Calculado</span>
                <span class="prolabore-detail-value income-value">${formatCurrency(proLaboreValue)}</span>
              </div>
            `}
            ${proLaboreConfig.description ? `
              <div class="prolabore-detail-item">
                <span class="prolabore-detail-label">Observação</span>
                <span class="prolabore-detail-value">${escapeHtml(proLaboreConfig.description)}</span>
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="prolabore-empty">
            <p class="text-muted">Pró-labore ainda não configurado.</p>
            <button class="btn btn-primary btn-sm" onclick="openProLaboreModal()" style="margin-top: 8px;">Definir Pró-Labore</button>
          </div>
        `}
      </div>
    </div>
  `;
}

// Renderiza card de plano
function renderPlanCard(plan) {
  const features = plan.features || [];
  const annualSaving = plan.annualPrice > 0 && plan.monthlyPrice > 0
    ? Math.round(100 - (plan.annualPrice / (plan.monthlyPrice * 12)) * 100)
    : 0;

  return `
    <div class="pricing-plan-card glass-card ${plan.isPopular ? 'plan-popular' : ''} ${!plan.isActive ? 'plan-inactive' : ''}">
      ${plan.isPopular ? '<div class="plan-badge">⭐ Popular</div>' : ''}
      ${!plan.isActive ? '<div class="plan-badge plan-badge-inactive">Inativo</div>' : ''}
      <div class="plan-card-header">
        <h4 class="plan-name">${escapeHtml(plan.name)}</h4>
        ${plan.description ? `<p class="plan-description">${escapeHtml(plan.description)}</p>` : ''}
      </div>
      <div class="plan-pricing">
        <div class="plan-price-main">
          <span class="plan-currency">R$</span>
          <span class="plan-amount">${plan.monthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span class="plan-period">/mês</span>
        </div>
        ${plan.annualPrice > 0 ? `
          <div class="plan-price-annual">
            ${formatCurrency(plan.annualPrice)}/ano
            ${annualSaving > 0 ? `<span class="plan-saving">Economia de ${annualSaving}%</span>` : ''}
          </div>
        ` : ''}
      </div>
      ${plan.maxUsers ? `
        <div class="plan-users">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Até ${escapeHtml(plan.maxUsers)} usuários
        </div>
      ` : ''}
      ${features.length > 0 ? `
        <ul class="plan-features">
          ${features.map(f => `
            <li class="plan-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${escapeHtml(f)}
            </li>
          `).join('')}
        </ul>
      ` : ''}
      <div class="plan-card-actions">
        <button class="btn btn-outline btn-sm" onclick="openPlanModal('${plan.id}')" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Editar
        </button>
        <button class="btn-icon btn-danger" onclick="confirmDeletePlan('${plan.id}')" title="Excluir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
      </div>
    </div>
  `;
}

// === Modais ===

function openPlanModal(id = null) {
  editingPlanId = id;
  const plan = id ? pricingPlans.find(p => p.id === id) : null;

  document.getElementById('plan-modal-title').textContent = id ? 'Editar Plano' : 'Novo Plano';
  document.getElementById('plan-name-input').value = plan?.name || '';
  document.getElementById('plan-desc-input').value = plan?.description || '';
  document.getElementById('plan-monthly-input').value = plan?.monthlyPrice || '';
  document.getElementById('plan-annual-input').value = plan?.annualPrice || '';
  document.getElementById('plan-maxusers-input').value = plan?.maxUsers || '';
  document.getElementById('plan-features-input').value = (plan?.features || []).join('\n');
  document.getElementById('plan-popular-input').checked = plan?.isPopular || false;
  document.getElementById('plan-active-input').checked = plan?.isActive !== false;

  document.getElementById('plan-modal').classList.add('modal-open');
}

function closePlanModal() {
  document.getElementById('plan-modal').classList.remove('modal-open');
  editingPlanId = null;
}

function savePlanFromModal() {
  const name = document.getElementById('plan-name-input').value.trim();
  if (!name) { showToast('Nome do plano é obrigatório.', 'error'); return; }

  const monthlyPrice = parseFloat(document.getElementById('plan-monthly-input').value);
  if (!monthlyPrice || monthlyPrice <= 0) { showToast('Preço mensal é obrigatório.', 'error'); return; }

  const featuresText = document.getElementById('plan-features-input').value.trim();
  const features = featuresText ? featuresText.split('\n').map(f => f.trim()).filter(f => f) : [];

  const data = {
    name,
    description: document.getElementById('plan-desc-input').value.trim(),
    monthlyPrice,
    annualPrice: parseFloat(document.getElementById('plan-annual-input').value) || 0,
    maxUsers: document.getElementById('plan-maxusers-input').value.trim(),
    features,
    isPopular: document.getElementById('plan-popular-input').checked,
    isActive: document.getElementById('plan-active-input').checked
  };

  if (editingPlanId) {
    updatePlan(editingPlanId, data);
    showToast('Plano atualizado!', 'success');
  } else {
    createPlan(data);
    showToast('Plano criado!', 'success');
  }

  closePlanModal();
  renderPricingSection();
}

function confirmDeletePlan(id) {
  const plan = pricingPlans.find(p => p.id === id);
  if (!plan) return;
  if (confirm(`Excluir o plano "${plan.name}"?`)) {
    deletePlan(id);
    showToast('Plano excluído.', 'info');
    renderPricingSection();
  }
}

// Modal de Pró-Labore
function openProLaboreModal() {
  document.getElementById('prolabore-enabled-input').checked = proLaboreConfig.enabled || false;
  document.getElementById('prolabore-type-input').value = proLaboreConfig.type || 'fixed';
  document.getElementById('prolabore-fixed-input').value = proLaboreConfig.fixedValue || '';
  document.getElementById('prolabore-pct-input').value = proLaboreConfig.percentage || '';
  document.getElementById('prolabore-base-input').value = proLaboreConfig.baseRevenue || 'total';
  document.getElementById('prolabore-desc-input').value = proLaboreConfig.description || '';

  toggleProLaboreFields();
  document.getElementById('prolabore-modal').classList.add('modal-open');
}

function closeProLaboreModal() {
  document.getElementById('prolabore-modal').classList.remove('modal-open');
}

function toggleProLaboreFields() {
  const type = document.getElementById('prolabore-type-input').value;
  const fixedGroup = document.getElementById('prolabore-fixed-group');
  const pctGroup = document.getElementById('prolabore-pct-group');
  const baseGroup = document.getElementById('prolabore-base-group');

  if (fixedGroup) fixedGroup.style.display = type === 'fixed' ? 'block' : 'none';
  if (pctGroup) pctGroup.style.display = type === 'percentage' ? 'block' : 'none';
  if (baseGroup) baseGroup.style.display = type === 'percentage' ? 'block' : 'none';
}

function saveProLaboreFromModal() {
  const config = {
    enabled: document.getElementById('prolabore-enabled-input').checked,
    type: document.getElementById('prolabore-type-input').value,
    fixedValue: document.getElementById('prolabore-fixed-input').value,
    percentage: document.getElementById('prolabore-pct-input').value,
    baseRevenue: document.getElementById('prolabore-base-input').value,
    description: document.getElementById('prolabore-desc-input').value.trim()
  };

  if (config.enabled) {
    if (config.type === 'fixed' && (!config.fixedValue || parseFloat(config.fixedValue) <= 0)) {
      showToast('Informe o valor fixo do pró-labore.', 'error');
      return;
    }
    if (config.type === 'percentage' && (!config.percentage || parseFloat(config.percentage) <= 0)) {
      showToast('Informe o percentual do pró-labore.', 'error');
      return;
    }
  }

  saveProLabore(config);
  showToast('Pró-labore configurado!', 'success');
  closeProLaboreModal();
  renderPricingSection();
}
