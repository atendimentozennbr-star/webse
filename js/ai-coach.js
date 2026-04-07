// Módulo AI Coach (OpenAI GPT)

let aiHistory = [];
let isAiLoading = false;

const AI_SYSTEM_PROMPT = `Você é um coach pessoal e empresarial altamente motivado chamado ZennCoach. Seu objetivo é ajudar o usuário a superar a procrastinação, se desenvolver pessoal e profissionalmente, e nunca deixá-lo ser "mais um da atualidade". 

Seja direto, motivacional e prático. Use dados do usuário quando disponíveis para personalizar seus conselhos. Sempre desafie o usuário a ser melhor e a agir agora, não amanhã.

Regras:
- Responda sempre em português brasileiro
- Seja conciso mas impactante
- Use dados concretos quando o usuário fornecer
- Evite respostas genéricas - seja específico e acionável
- Use emojis com moderação para dar energia
- Nunca seja passivo ou permissivo com a procrastinação`;

// Inicializa módulo AI Coach
function initAICoach() {
  aiHistory = load(KEYS.AI_HISTORY, []);
  renderAICoachSection();
}

// Renderiza seção do AI Coach
function renderAICoachSection() {
  const container = document.getElementById('ai-coach-container');
  if (!container) return;

  const settings = load(KEYS.SETTINGS, {});
  const hasApiKey = !!settings.openaiApiKey;

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        AI Coach
      </h2>
      <button class="btn btn-outline" onclick="clearAIHistory()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        Limpar chat
      </button>
    </div>

    ${!hasApiKey ? `
      <div class="alert alert-warning">
        ⚠️ Configure sua chave da API OpenAI nas <a href="#" onclick="navigateTo('settings'); return false;"><strong>Configurações</strong></a> para usar o AI Coach.
      </div>
    ` : ''}

    <div class="ai-coach-layout">
      <div class="chat-container glass-card">
        <div class="chat-messages" id="chat-messages">
          ${aiHistory.length === 0 ? renderAIWelcome() : ''}
          ${aiHistory.map(msg => renderChatMessage(msg)).join('')}
          ${isAiLoading ? '<div class="chat-loading"><span></span><span></span><span></span></div>' : ''}
        </div>

        <div class="quick-actions">
          <button class="quick-action-btn" onclick="sendQuickMessage('Analise minha rotina atual e me dê um plano de ação')">
            📊 Analise minha rotina
          </button>
          <button class="quick-action-btn" onclick="sendQuickMessage('Me dê dicas financeiras baseadas nos meus gastos')">
            💰 Dicas financeiras
          </button>
          <button class="quick-action-btn" onclick="sendQuickMessage('Crie um plano de ação para eu ser mais produtivo hoje')">
            🎯 Plano de ação
          </button>
          <button class="quick-action-btn" onclick="sendQuickMessage('Estou procrastinando. Me motive agora!')">
            🔥 Me motive!
          </button>
        </div>

        <div class="chat-input-area">
          <textarea class="chat-input" id="ai-chat-input" placeholder="Pergunte qualquer coisa ao seu coach..." rows="1"
                    onkeydown="handleChatKeydown(event)"
                    oninput="autoResizeTextarea(this)"></textarea>
          <button class="btn-send ${isAiLoading ? 'loading' : ''}" onclick="sendChatMessage()" ${isAiLoading ? 'disabled' : ''}>
            ${isAiLoading
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`}
          </button>
        </div>
      </div>

      <div class="ai-sidebar">
        <div class="ai-context glass-card">
          <h3>🧠 Contexto do Coach</h3>
          <p class="text-muted">O AI Coach tem acesso aos seus dados para dar conselhos personalizados:</p>
          <ul class="context-list">
            <li>✅ ${getAllTasks ? getAllTasks().filter(t=>t.status!=='done').length : 0} tarefas pendentes</li>
            <li>🔥 ${habitsData ? habitsData.length : 0} hábitos ativos</li>
            <li>💰 Dados financeiros do mês</li>
            <li>🎯 ${goalsData ? goalsData.filter(g=>g.status==='active').length : 0} metas ativas</li>
          </ul>
        </div>

        <div class="ai-tips glass-card">
          <h3>💡 Como usar</h3>
          <ul class="tips-list">
            <li>Peça análise de suas tarefas atrasadas</li>
            <li>Solicite estratégias anti-procrastinação</li>
            <li>Discuta seus objetivos e bloqueios</li>
            <li>Peça um plano diário personalizado</li>
            <li>Solicite revisão dos seus hábitos</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  scrollChatToBottom();
}

// Mensagem de boas-vindas
function renderAIWelcome() {
  return `
    <div class="chat-welcome">
      <div class="ai-avatar">🤖</div>
      <div class="chat-bubble ai-bubble">
        <p>Olá! Sou o <strong>ZennCoach</strong>, seu coach pessoal e empresarial com IA.</p>
        <p>Estou aqui para te ajudar a superar a procrastinação, alcançar suas metas e ser sua melhor versão.</p>
        <p>Como posso te ajudar hoje? 💪</p>
      </div>
    </div>
  `;
}

// Renderiza mensagem do chat
function renderChatMessage(msg) {
  const isUser = msg.role === 'user';
  return `
    <div class="chat-message ${isUser ? 'user-message' : 'ai-message'}">
      ${!isUser ? '<div class="ai-avatar-sm">🤖</div>' : ''}
      <div class="chat-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}">
        ${formatAIMessage(msg.content)}
        <span class="message-time">${msg.timestamp ? formatDateTime(new Date(msg.timestamp)).split(' ')[1] : ''}</span>
      </div>
    </div>
  `;
}

// Formata texto da mensagem AI (markdown básico)
function formatAIMessage(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/^• /gm, '&#8226; ')
    .replace(/^- /gm, '&#8226; ');
}

// Trata tecla enter no chat
function handleChatKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

// Envia mensagem rápida
function sendQuickMessage(message) {
  const input = document.getElementById('ai-chat-input');
  if (input) input.value = message;
  sendChatMessage();
}

// Envia mensagem do usuário
async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;

  const message = input.value.trim();
  if (!message || isAiLoading) return;

  const settings = load(KEYS.SETTINGS, {});
  if (!settings.openaiApiKey) {
    showToast('Configure sua chave API OpenAI nas Configurações.', 'error');
    navigateTo('settings');
    return;
  }

  input.value = '';
  input.style.height = 'auto';

  // Adiciona mensagem do usuário ao histórico
  const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
  aiHistory.push(userMsg);

  isAiLoading = true;
  renderAICoachSection();
  scrollChatToBottom();

  try {
    const response = await sendMessage(message, settings.openaiApiKey);
    const aiMsg = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
    aiHistory.push(aiMsg);

    // Mantém apenas os últimos 50 pares de mensagens
    if (aiHistory.length > 100) {
      aiHistory = aiHistory.slice(-100);
    }

    save(KEYS.AI_HISTORY, aiHistory);
  } catch (err) {
    showToast('Erro ao conectar com AI: ' + (err.message || 'Erro desconhecido'), 'error');
    const errMsg = { role: 'assistant', content: `❌ Erro: ${err.message || 'Não foi possível conectar com a API OpenAI.'}`, timestamp: new Date().toISOString() };
    aiHistory.push(errMsg);
  } finally {
    isAiLoading = false;
    renderAICoachSection();
    scrollChatToBottom();
  }
}

// Chama a API OpenAI
async function sendMessage(message, apiKey) {
  // Prepara contexto do usuário
  const context = buildUserContext();

  // Prepara histórico de mensagens (últimas 10 trocas)
  const recentHistory = aiHistory.slice(-20).filter(m => m.role !== undefined).map(m => ({
    role: m.role,
    content: m.content
  }));

  const messages = [
    { role: 'system', content: AI_SYSTEM_PROMPT + '\n\n' + context },
    ...recentHistory
  ];

  // Se a última mensagem já é do usuário (a que acabamos de adicionar), não duplica
  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== 'user' || lastMsg.content !== message) {
    messages.push({ role: 'user', content: message });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.8
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sem resposta da API.';
}

// Constrói contexto do usuário para enviar ao AI
function buildUserContext() {
  const tasks = getAllTasks ? getAllTasks() : [];
  const pending = tasks.filter(t => t.status !== 'done');
  const overdue = pending.filter(t => t.dueDate && isOverdue(t.dueDate));
  const highPriority = pending.filter(t => t.priority === 'high');

  const finance = getFinanceSummary ? getFinanceSummary() : null;
  const goals = goalsData ? goalsData.filter(g => g.status === 'active') : [];
  const habits = habitsData ? habitsData : [];
  const todayHabits = habits.filter(h => isHabitDone && isHabitDone(h.id));

  let ctx = `\n## DADOS ATUAIS DO USUÁRIO:\n`;
  ctx += `- Tarefas pendentes: ${pending.length} (${overdue.length} atrasadas, ${highPriority.length} alta prioridade)\n`;

  if (overdue.length > 0) {
    ctx += `- Tarefas atrasadas: ${overdue.slice(0, 3).map(t => `"${t.title}"`).join(', ')}\n`;
  }

  if (finance) {
    ctx += `- Finanças do mês: Receita ${formatCurrency(finance.income)}, Despesa ${formatCurrency(finance.expense)}, Saldo ${formatCurrency(finance.balance)}\n`;
  }

  if (goals.length > 0) {
    ctx += `- Metas ativas: ${goals.map(g => `"${g.title}" (${getGoalProgress ? getGoalProgress(g) : 0}%)`).join(', ')}\n`;
  }

  if (habits.length > 0) {
    ctx += `- Hábitos hoje: ${todayHabits.length}/${habits.length} concluídos\n`;
  }

  return ctx;
}

// Obtém frase motivacional do AI
async function getMotivationalQuote() {
  const settings = load(KEYS.SETTINGS, {});
  if (!settings.openaiApiKey) return null;

  const cached = load(KEYS.MOTIVATIONAL_QUOTE, null);
  if (cached && cached.date === todayString()) return cached.quote;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um coach motivacional. Gere UMA frase motivacional poderosa e original em português brasileiro. Seja direto, impactante e anti-procrastinação. Máximo 2 linhas. Sem aspas na resposta.'
          },
          { role: 'user', content: 'Gere uma frase motivacional para hoje.' }
        ],
        max_tokens: 100,
        temperature: 0.9
      })
    });

    if (response.ok) {
      const data = await response.json();
      const quote = data.choices[0]?.message?.content?.trim();
      if (quote) {
        save(KEYS.MOTIVATIONAL_QUOTE, { quote, date: todayString() });
        return quote;
      }
    }
  } catch (e) {
    console.error('Erro ao buscar frase motivacional:', e);
  }

  return null;
}

// Limpa histórico do chat
function clearAIHistory() {
  if (confirm('Limpar todo o histórico do chat?')) {
    aiHistory = [];
    save(KEYS.AI_HISTORY, []);
    renderAICoachSection();
    showToast('Histórico limpo.', 'info');
  }
}

// Scrolla chat para o fim
function scrollChatToBottom() {
  setTimeout(() => {
    const msgs = document.getElementById('chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 50);
}

// Auto-resize textarea
function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
