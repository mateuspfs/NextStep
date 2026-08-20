# NextStep - Plataforma de Gestão do Conhecimento

> Projeto de Trabalho de Conclusão de Curso (TCC) para o curso de Análise e Desenvolvimento de Sistemas (ADS) pela FATEC Praia Grande.

NextStep é uma plataforma inteligente voltada para a gestão e facilitação do conhecimento no ambiente corporativo e acadêmico. O projeto é construído sobre uma arquitetura moderna dividida entre uma aplicação cliente interativa e uma API robusta.

---

## 🛠️ Arquitetura do Projeto

O ecossistema do **NextStep** está estruturado de forma desacoplada em duas partes principais:

*   **`frontend/`**: Aplicação Single Page Application (SPA) desenvolvida em **React** (TypeScript). Focada em uma experiência de usuário (UX) moderna, fluida e com design responsivo de alta qualidade.
*   **`api/`**: Back-end robusto construído com **.NET** (C#). Responsável pela API RESTful, lógica de negócio, autenticação, persistência de dados e segurança da informação.
*   **`docs/`**: Central de documentação contendo regras de negócio, especificações técnicas, fluxos de tela e diretrizes para desenvolvimento.

---

## 📁 Estrutura do Repositório

```
NextStep -TCC/
├── api/                      # Back-end (.NET Web API)
├── frontend/                 # Front-end (React SPA)
├── docs/                     # Documentação do Projeto
│   ├── Fase 1 - Kick-off/    # Planejamento inicial e especificações de ferramentas
│   ├── Resumo - Pré-Projeto/ # Visão geral e contextualização acadêmica
│   └── ai-agents/            # Instruções de comportamento para Agentes de IA
├── .gitignore                # Regras de exclusão do Git para React e .NET
└── README.md                 # Instruções de inicialização do projeto
```

---

## 🤖 Desenvolvimento com Agentes de IA (Vibe Coding)

Este projeto adota a estratégia de **Vibe Coding**, onde o desenvolvimento de funcionalidades é acelerado através do uso cooperativo de Agentes de Inteligência Artificial.

Os agentes personalizados do projeto estão organizados na pasta [.github/agents/](.github/agents/) e foram estruturados com frontmatter, identificadores e instruções formais para melhor integração com o GitHub Copilot e outros assistentes compatíveis.

*   [**Coder Agent**](.github/agents/coder_agent.md): Implementa funcionalidades com padrões de código limpo, tipagem forte, tratamento de erros e aderência à stack React + .NET.
*   [**Reviewer Agent**](.github/agents/reviewer_agent.md): Revisa segurança, qualidade, performance e aderência aos padrões de arquitetura e manutenção.
*   [**Architect Agent**](.github/agents/architect_agent.md): Define diretrizes de arquitetura, separação de camadas, clean architecture e decisões técnicas do sistema.

Ao acionar um assistente de IA para criar novas funcionalidades, você pode referenciar estes agentes ou pedir para que ele os utilize como contexto base de desenvolvimento.

---

## 📖 Documentação do Projeto

Toda a especificação de negócio e técnica foi convertida para o formato Markdown para melhor indexação e leitura de IA:
*   [Especificações das Ferramentas, Regras Padrões e Fluxos](file:///c:/laragon/www/Projetos%20Fatec/NextStep%20-TCC/docs/Fase%201%20-%20Kick-off/Especificações%20das%20ferramentas,%20regras%20padrões%20e%20fluxos%20de%20tela.md)
*   [Início - Planejamento Técnico](file:///c:/laragon/www/Projetos%20Fatec/NextStep%20-TCC/docs/Fase%201%20-%20Kick-off/Início%20planejamento%20técnico.md)
*   [NextStep - Plataforma de Gestão do Conhecimento](file:///c:/laragon/www/Projetos%20Fatec/NextStep%20-TCC/docs/Resumo%20-%20Pré-Projeto%20(Oficial)/NextStep%20-%20Plataforma%20de%20Gestão%20do%20Conhecimento.md)
