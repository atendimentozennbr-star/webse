// Módulo de Gráficos (Chart.js)

let financePieChart = null;
let financeBarChart = null;
let habitsRadarChart = null;
let goalsBarChart = null;

// Configuração padrão de cores escuras para os gráficos
const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

// Configuração padrão para tema escuro
const CHART_DEFAULTS = {
  color: '#e2e8f0',
  borderColor: 'rgba(255,255,255,0.1)',
  plugins: {
    legend: {
      labels: { color: '#e2e8f0', font: { size: 12 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255,255,255,0.08)' }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255,255,255,0.08)' }
    }
  }
};

// Animação padrão para gráficos
const CHART_ANIMATION = {
  duration: 800,
  easing: 'easeOutQuart'
};

// Tooltip padrão estilizado
const CHART_TOOLTIP = {
  backgroundColor: 'rgba(15, 14, 23, 0.9)',
  titleColor: '#e2e8f0',
  bodyColor: '#94a3b8',
  borderColor: 'rgba(124, 58, 237, 0.3)',
  borderWidth: 1,
  cornerRadius: 8,
  padding: 10,
  titleFont: { size: 13, weight: '600' },
  bodyFont: { size: 12 },
  displayColors: true,
  boxPadding: 4
};

// Plugin para exibir texto no centro de gráficos doughnut
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    const centerConfig = chart.config.options.plugins.centerText;
    if (!centerConfig || !centerConfig.text) return;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Linha principal (valor)
    ctx.font = `bold ${centerConfig.fontSize || 20}px Inter, sans-serif`;
    ctx.fillStyle = centerConfig.color || '#e2e8f0';
    ctx.fillText(centerConfig.text, centerX, centerY - (centerConfig.subText ? 8 : 0));

    // Sublinha (label)
    if (centerConfig.subText) {
      ctx.font = `500 ${centerConfig.subFontSize || 10}px Inter, sans-serif`;
      ctx.fillStyle = centerConfig.subColor || '#64748b';
      ctx.fillText(centerConfig.subText, centerX, centerY + 12);
    }

    ctx.restore();
  }
};

// Verifica se Chart.js está disponível
function isChartJsAvailable() {
  return typeof Chart !== 'undefined';
}

// Destroi gráfico existente de forma segura
function destroyChart(chart) {
  if (chart && typeof chart.destroy === 'function') {
    try { chart.destroy(); } catch(e) {}
  }
  return null;
}

// Cria gradiente vertical para canvas
function createVerticalGradient(ctx, chartArea, colorTop, colorBottom) {
  if (!chartArea) return colorTop;
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, colorTop);
  gradient.addColorStop(1, colorBottom);
  return gradient;
}

// Atualiza gráficos financeiros
function updateFinanceCharts() {
  if (!isChartJsAvailable()) return;

  updateFinancePieChart();
  updateFinanceBarChart();
}

// Gráfico de pizza: despesas por categoria
function updateFinancePieChart() {
  const canvas = document.getElementById('finance-pie-chart');
  if (!canvas) return;

  financePieChart = destroyChart(financePieChart);

  const data = getExpensesByCategory ? getExpensesByCategory() : [];

  if (data.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem despesas este mês', canvas.width / 2, canvas.height / 2);
    return;
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  financePieChart = new Chart(canvas, {
    type: 'doughnut',
    plugins: [centerTextPlugin],
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: CHART_COLORS.map(c => c + 'cc'),
        borderColor: CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 12,
        hoverBorderWidth: 3,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: CHART_ANIMATION,
      plugins: {
        centerText: {
          text: formatCurrency(total),
          fontSize: 16,
          color: '#e2e8f0',
          subText: 'Total',
          subColor: '#64748b'
        },
        legend: {
          position: 'bottom',
          labels: {
            color: '#e2e8f0',
            font: { size: 11, family: 'Inter, sans-serif' },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => {
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// Gráfico de barras: receitas vs despesas (6 meses)
function updateFinanceBarChart() {
  const canvas = document.getElementById('finance-bar-chart');
  if (!canvas) return;

  financeBarChart = destroyChart(financeBarChart);

  const data = getLast6MonthsData ? getLast6MonthsData() : [];

  financeBarChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Receitas',
          data: data.map(d => d.income),
          backgroundColor: 'rgba(16, 185, 129, 0.25)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.45)'
        },
        {
          label: 'Despesas',
          data: data.map(d => d.expense),
          backgroundColor: 'rgba(239, 68, 68, 0.25)',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(239, 68, 68, 0.45)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: CHART_ANIMATION,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { size: 12, family: 'Inter, sans-serif' }, usePointStyle: true, padding: 16 }
        },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { display: false },
          border: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            callback: v => formatCurrency(v)
          },
          grid: { color: 'rgba(255,255,255,0.06)', drawBorder: false },
          border: { display: false }
        }
      }
    }
  });
}

// Gráfico de radar: hábitos
function updateHabitChart(habits, logs) {
  const canvas = document.getElementById('habits-radar-chart');
  if (!canvas || !isChartJsAvailable()) return;

  habitsRadarChart = destroyChart(habitsRadarChart);

  if (!habits || habits.length === 0) return;

  // Taxa de conclusão dos últimos 30 dias por hábito
  const habitRates = habits.slice(0, 8).map(h => ({
    name: `${h.icon} ${h.name}`,
    rate: getCompletionRate ? getCompletionRate(h.id, 30) : 0
  }));

  habitsRadarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: habitRates.map(h => h.name),
      datasets: [{
        label: 'Taxa de conclusão (%)',
        data: habitRates.map(h => h.rate),
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2.5,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#a78bfa',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: CHART_ANIMATION,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            color: '#94a3b8',
            stepSize: 25,
            backdropColor: 'transparent',
            font: { size: 10 }
          },
          grid: { color: 'rgba(255,255,255,0.08)', circular: true },
          pointLabels: {
            color: '#e2e8f0',
            font: { size: 11, family: 'Inter, sans-serif' }
          },
          angleLines: { color: 'rgba(255,255,255,0.08)' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { family: 'Inter, sans-serif' } }
        },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => ` ${ctx.parsed.r}% nos últimos 30 dias`
          }
        }
      }
    }
  });
}

// Retorna cor baseada no valor de progresso percentual
function getProgressColor(value) {
  if (value >= 100) return '#10b981';
  if (value >= 70) return '#3b82f6';
  if (value >= 40) return '#f59e0b';
  return '#ef4444';
}

// Gráfico de barras horizontais: progresso das metas
function updateGoalsChart() {
  const canvas = document.getElementById('goals-chart');
  if (!canvas || !isChartJsAvailable()) return;

  goalsBarChart = destroyChart(goalsBarChart);

  const goals = goalsData ? goalsData.filter(g => g.status === 'active') : [];

  if (goals.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma meta ativa', canvas.width / 2, canvas.height / 2);
    return;
  }

  const progressValues = goals.map(g => getGoalProgress ? getGoalProgress(g) : 0);

  goalsBarChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: goals.map(g => truncate(g.title, 20)),
      datasets: [{
        label: 'Progresso (%)',
        data: progressValues,
        backgroundColor: progressValues.map(v => getProgressColor(v) + '44'),
        borderColor: progressValues.map(v => getProgressColor(v)),
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: progressValues.map(v => getProgressColor(v) + '77')
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { ...CHART_ANIMATION, duration: 1000 },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: {
            label: ctx => ` ${ctx.parsed.x}% concluído`
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => v + '%' },
          grid: { color: 'rgba(255,255,255,0.06)', drawBorder: false },
          border: { display: false }
        },
        y: {
          ticks: { color: '#e2e8f0', font: { size: 12, family: 'Inter, sans-serif' } },
          grid: { display: false },
          border: { display: false }
        }
      }
    }
  });
}

// Gráfico de balanço financeiro para o dashboard
function renderDashboardFinanceChart() {
  const canvas = document.getElementById('dashboard-finance-chart');
  if (!canvas || !isChartJsAvailable()) return;

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const data = getLast6MonthsData ? getLast6MonthsData() : [];

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Receitas',
          data: data.map(d => d.income),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 6,
          order: 2,
          hoverBackgroundColor: 'rgba(16, 185, 129, 0.4)'
        },
        {
          label: 'Despesas',
          data: data.map(d => d.expense),
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 6,
          order: 2,
          hoverBackgroundColor: 'rgba(239, 68, 68, 0.4)'
        },
        {
          label: 'Saldo',
          data: data.map(d => d.income - d.expense),
          type: 'line',
          borderColor: '#6366f1',
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#a78bfa',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { size: 11, family: 'Inter, sans-serif' }, usePointStyle: true, padding: 14 }
        },
        tooltip: {
          ...CHART_TOOLTIP,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { display: false },
          border: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => formatCurrency(v) },
          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
          border: { display: false }
        }
      }
    }
  });
}
