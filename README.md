# ZennBR - Autogerenciamento Pessoal & Empresarial

Sistema completo de autogerenciamento pessoal e empresarial com IA integrada.

## 🚀 Como usar

Abra o arquivo `index.html` diretamente no navegador (funciona via `file://`).

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 📊 **Dashboard** | Visão geral com widgets de tarefas, finanças, hábitos e citação motivacional |
| ✅ **Tarefas** | CRUD completo com prioridades, categorias, datas de vencimento e status |
| ⭐ **Hábitos** | Rastreamento visual com streaks e gráfico de contribuição estilo GitHub |
| 📅 **Calendário** | Visão mensal com compromissos, tarefas e lembretes |
| 💰 **Finanças** | Controle de receitas/despesas com gráficos e alertas inteligentes |
| 🎯 **Metas** | Metas pessoais e financeiras com barras de progresso animadas |
| 🍅 **Pomodoro** | Timer focado com indicador circular SVG e histórico de sessões |
| 🤖 **AI Coach** | Chat com GPT da OpenAI como coach anti-procrastinação |
| ⚙️ **Configurações** | Tema dark/light, chave API OpenAI, exportar/importar dados |

## 🛠 Tecnologias

- **HTML5 / CSS3 / JavaScript** puro (sem frameworks)
- **LocalStorage** para persistência de dados
- **Chart.js** (via CDN) para gráficos
- **OpenAI GPT-4o-mini** para IA (requer chave API própria)
- **PWA** com Service Worker para instalação offline

## 🎨 Design

- Tema escuro por padrão (com opção claro)
- Glassmorphism com `backdrop-filter: blur`
- Gradientes vibrantes: roxo, azul, verde neon
- Totalmente responsivo (mobile-first)
- Sidebar colapsável

## 🔑 Configuração do AI Coach

1. Acesse **Configurações** no menu lateral
2. Insira sua chave da API OpenAI (começa com `sk-`)
3. Clique em **Salvar**
4. Acesse o **AI Coach** e comece a conversar!

> Sua chave fica armazenada apenas localmente no seu dispositivo.

## 📦 Estrutura

```
├── index.html          # SPA principal
├── css/style.css       # Estilos completos
├── js/
│   ├── app.js          # Orquestrador principal
│   ├── tasks.js        # Módulo de tarefas
│   ├── habits.js       # Módulo de hábitos
│   ├── calendar.js     # Módulo de calendário
│   ├── finance.js      # Módulo financeiro
│   ├── goals.js        # Módulo de metas
│   ├── ai-coach.js     # Coach com IA
│   ├── charts.js       # Gráficos Chart.js
│   ├── pomodoro.js     # Timer Pomodoro
│   ├── storage.js      # LocalStorage
│   └── utils.js        # Utilitários
├── manifest.json       # PWA manifest
└── sw.js               # Service Worker
```

## 💾 Dados

Todos os dados são salvos no `localStorage` do navegador. Use a opção **Exportar** para fazer backup em JSON.
