# ZennBR - Autogerenciamento Pessoal & Empresarial

Sistema completo de autogerenciamento pessoal e empresarial.

## 🚀 Como usar

Abra o arquivo `index.html` diretamente no navegador (funciona via `file://`).

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 📊 **Dashboard** | Visão geral com KPIs, gráficos financeiros, donuts de progresso, dicas financeiras e ações rápidas |
| ✅ **Tarefas** | CRUD completo com prioridades, categorias, datas de vencimento e status |
| ⭐ **Hábitos** | Rastreamento visual com streaks e gráfico de contribuição estilo GitHub |
| 📅 **Calendário** | Visão mensal com compromissos, tarefas e lembretes |
| 💰 **Finanças** | Controle de receitas/despesas com gráficos e alertas inteligentes |
| 🎯 **Metas** | Metas pessoais e financeiras com barras de progresso animadas |
| 🍅 **Pomodoro** | Timer focado com indicador circular SVG e histórico de sessões |
| ⚙️ **Configurações** | Tema dark/light, exportar/importar dados |

## 🛠 Tecnologias

- **HTML5 / CSS3 / JavaScript** puro (sem frameworks)
- **LocalStorage** para persistência de dados
- **Chart.js** (via CDN) para gráficos
- **PWA** com Service Worker para instalação offline

## 🎨 Design

- Tema escuro por padrão (com opção claro)
- Glassmorphism com `backdrop-filter: blur`
- Gradientes vibrantes: roxo, azul, verde neon
- Totalmente responsivo (mobile-first)
- Sidebar colapsável

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
│   ├── charts.js       # Gráficos Chart.js
│   ├── pomodoro.js     # Timer Pomodoro
│   ├── storage.js      # LocalStorage
│   └── utils.js        # Utilitários
├── manifest.json       # PWA manifest
└── sw.js               # Service Worker
```

## 💾 Dados

Todos os dados são salvos no `localStorage` do navegador. Use a opção **Exportar** para fazer backup em JSON.
