// Gerenciamento de dados no LocalStorage

const KEYS = {
  TASKS: 'webse_tasks',
  HABITS: 'webse_habits',
  HABIT_LOGS: 'webse_habit_logs',
  EVENTS: 'webse_events',
  TRANSACTIONS: 'webse_transactions',
  GOALS: 'webse_goals',
  POMODORO_SESSIONS: 'webse_pomodoro_sessions',
  SETTINGS: 'webse_settings',
  MOTIVATIONAL_QUOTE: 'webse_quote'
};

// Salva dados no localStorage
function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Erro ao salvar dados:', e);
    return false;
  }
}

// Carrega dados do localStorage
function load(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    return defaultValue;
  }
}

// Remove dados do localStorage
function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Erro ao remover dados:', e);
    return false;
  }
}

// Exporta todos os dados como arquivo JSON
function exportAllData() {
  const data = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    data[key] = load(key);
  });
  data._exportedAt = new Date().toISOString();
  data._version = '1.0';

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zennbr_backup_${formatDateForInput(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Dados exportados com sucesso!', 'success');
}

// Importa dados de uma string JSON
function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    let imported = 0;

    Object.entries(KEYS).forEach(([name, key]) => {
      if (data[key] !== undefined) {
        save(key, data[key]);
        imported++;
      }
    });

    if (imported > 0) {
      showToast(`${imported} conjuntos de dados importados com sucesso!`, 'success');
      return true;
    } else {
      showToast('Nenhum dado válido encontrado no arquivo.', 'warning');
      return false;
    }
  } catch (e) {
    showToast('Erro ao importar dados. Verifique o arquivo JSON.', 'error');
    console.error('Erro ao importar:', e);
    return false;
  }
}

// Limpa todos os dados
function clearAll() {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  showToast('Todos os dados foram removidos.', 'info');
}

// Retorna tamanho aproximado dos dados em KB
function getStorageSize() {
  let total = 0;
  Object.values(KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) total += item.length * 2;
  });
  return (total / 1024).toFixed(2);
}
