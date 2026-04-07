// Módulo de Gráficos (Chart.js)

let financePieChart = null;
let financeBarChart = null;
let habitsRadarChart = null;
let goalsBarChart = null;

// Configuração padrão de cores escuras para os gráficos
const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

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
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem despesas este mês', canvas.width / 2, canvas.height / 2);
    return;
  }

  financePieChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: CHART_COLORS.map(c => c + 'cc'),
        borderColor: CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e2e8f0',
            font: { size: 11 },
            padding: 12,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`
          }
        }
      },
      cutout: '60%'
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
          backgroundColor: '#10b98166',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Despesas',
          data: data.map(d => d.expense),
          backgroundColor: '#ef444466',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { size: 12 }, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: {
          ticks: {
            color: '#94a3b8',
            callback: v => formatCurrency(v)
          },
          grid: { color: 'rgba(255,255,255,0.06)' }
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
        backgroundColor: 'rgba(124, 58, 237, 0.25)',
        borderColor: '#7c3aed',
        borderWidth: 2,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { color: '#94a3b8', stepSize: 25, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: '#e2e8f0', font: { size: 11 } },
          angleLines: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#e2e8f0' } }
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
    ctx.font = '14px sans-serif';
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
        backgroundColor: progressValues.map(v => getProgressColor(v) + '66'),
        borderColor: progressValues.map(v => getProgressColor(v)),
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x}% concluído`
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: '#94a3b8', callback: v => v + '%' },
          grid: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          ticks: { color: '#e2e8f0' },
          grid: { color: 'rgba(255,255,255,0.06)' }
        }
      }
    }
  });
}

// Gráfico mini de balanço para o dashboard
function renderDashboardFinanceChart() {
  const canvas = document.getElementById('dashboard-finance-chart');
  if (!canvas || !isChartJsAvailable()) return;

  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  const data = getLast6MonthsData ? getLast6MonthsData() : [];

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Balanço',
        data: data.map(d => d.income - d.expense),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
        y: {
          ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => formatCurrency(v) },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}
