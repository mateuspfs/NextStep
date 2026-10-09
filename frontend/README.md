# NextStep - Frontend

Plataforma de Gestão do Conhecimento - Interface Web

## Stack Tecnológica

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento SPA

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
npm install
```

## Executando em Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## Build de Produção

```bash
npm run build
```

Os arquivos gerados estarão na pasta `dist/`

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de UI (Card, Button, Badge, etc.)
│   ├── Layout.tsx      # Layout principal com sidebar e header
│   ├── Sidebar.tsx     # Menu lateral de navegação
│   └── Header.tsx      # Barra superior com busca e perfil
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Tela inicial (Home)
│   ├── KnowledgeBase.tsx  # Base de Conhecimento Colaborativa
│   ├── Processes.tsx   # Central de Processos
│   ├── Training.tsx    # Atividades e Treinamentos
│   └── AdminPanel.tsx  # Painel Administrativo
├── App.tsx             # Componente raiz com rotas
├── main.tsx            # Entry point
└── index.css           # Estilos globais + Tailwind
```

## Páginas Implementadas

### 1. Dashboard (Home)
- Saudação personalizada
- Card de destaque para novo processo
- Lista de principais processos
- Atividades em andamento com progresso

### 2. Base de Conhecimento
- Cards de estudos de caso com imagens
- Fórum de dúvidas com sistema de votos
- Seção de erros conhecidos com resolução rápida

### 3. Central de Processos
- Lista de processos com busca e filtros
- Filtros por categoria (Editorial, Técnico, Segurança)
- Paginação

### 4. Atividades e Treinamentos
- Gerador de treinamento com IA
- Lista de treinamentos disponíveis
- Ranking global de usuários
- Conquistas recentes

### 5. Painel Administrativo
- Estatísticas gerais
- Solicitações pendentes (aprovar/rejeitar)
- Gestão de usuários

## Integração com API

O frontend está configurado para consumir a API NextStep em `http://localhost:5001` (desenvolvimento) ou em produção via variável de ambiente.

## Design

Interface baseada nos protótipos de tela fornecidos, com:
- Paleta de cores: Azul (#2563eb) como cor principal
- Tipografia: Inter
- Layout responsivo
- Componentes com bordas suaves e sombras sutis
