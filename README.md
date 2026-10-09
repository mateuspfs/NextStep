# NextStep - Plataforma de Gestão do Conhecimento

Plataforma web para gestão do conhecimento em equipes de suporte técnico, com base de conhecimento colaborativa, central de processos, atividades e gamificação.

## Visão Geral

O NextStep centraliza informações de um setor e apoia o desenvolvimento profissional dos colaboradores através de:
- Base de conhecimento colaborativa (estudos de caso, artigos, erros comuns)
- Central de processos
- Painel de atividades com quizzes e perguntas abertas
- Gamificação com NexPoints, missões diárias, loja e emblemas
- Dashboard com ranking e conquistas

## Arquitetura

```
NextStep -TCC/
├── api/                    # Back-end .NET 8 (Clean Architecture)
│   ├── NextStep.Domain/        # Entidades e regras de negócio
│   ├── NextStep.Application/   # Casos de uso, DTOs, interfaces
│   ├── NextStep.Infrastructure/ # EF Core, repositórios, serviços, seeders
│   └── NextStep.API/           # Controllers, Swagger, JWT
├── infra/                  # Infraestrutura como Código (Terraform)
├── frontend/               # Front-end React + Tailwind CSS
└── docs/                   # Documentação do projeto
```

## Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Terraform](https://www.terraform.io/downloads) >= 1.5.0
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) (para deploy)
- [Docker](https://www.docker.com/products/docker-desktop) (opcional, para container)
- MySQL 8.0+ (local ou Azure Database for MySQL)

## Back-end (.NET API)

### Executando Localmente

1. **Restaurar pacotes:**
   ```bash
   cd api
   dotnet restore
   ```

2. **Configurar banco de dados:**
   - Atualize a string de conexão em `NextStep.API/appsettings.json` ou `appsettings.Development.json`
   - Formato: `Server=localhost;Database=nextstep;User=root;Password=suasenha;`

3. **Configurar string de conexão para migrations:**
   ```bash
   # Windows (PowerShell)
   $env:NEXTCONNSTR="Server=localhost;Database=nextstep;User=root;Password=suasenha;"
   
   # Linux/macOS
   export NEXTCONNSTR="Server=localhost;Database=nextstep;User=root;Password=suasenha;"
   ```

4. **Criar e aplicar migrations:**
   ```bash
   # Criar migration inicial (se ainda não existe)
   dotnet ef migrations add InitialCreate --project NextStep.Infrastructure --startup-project NextStep.API --output-dir Data/Migrations
   
   # Aplicar migration ao banco de dados
   dotnet ef database update --project NextStep.Infrastructure --startup-project NextStep.API
   ```

   **Nota:** O projeto inclui uma `DesignTimeDbContextFactory` que usa a variável de ambiente `NEXTCONNSTR` para conectar ao banco durante as migrations.

4. **Executar a API:**
   ```bash
   dotnet run --project NextStep.API
   ```
   A API estará disponível em `https://localhost:7001` ou `http://localhost:5001`

5. **Acessar Swagger:**
   - Abra `https://localhost:7001/swagger` no navegador

### Executando com Docker

1. **Build da imagem:**
   ```bash
   cd api
   docker build -t nextstep-api .
   ```

2. **Executar o container:**
   ```bash
   docker run -p 8080:8080 -e "ConnectionStrings__DefaultConnection=Server=host.docker.internal;Database=nextstep;User=root;Password=suasenha;" nextstep-api
   ```

### Endpoints Principais

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/health` | Health check | Não |
| POST | `/api/auth/register` | Registro de usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| GET | `/api/contents` | Listar conteúdos | Não |
| GET | `/api/contents/{id}` | Obter conteúdo | Não |
| POST | `/api/contents` | Criar conteúdo | Admin |
| PUT | `/api/contents/{id}` | Atualizar conteúdo | Admin |
| DELETE | `/api/contents/{id}` | Excluir conteúdo | Admin |
| GET | `/api/categories` | Listar categorias | Não |
| POST | `/api/categories` | Criar categoria | Admin |
| GET | `/api/courses` | Listar cursos | Não |
| GET | `/api/courses/{id}` | Obter curso | Não |
| POST | `/api/courses` | Criar curso | Admin |
| POST | `/api/courses/{id}/enroll` | Inscrever-se em curso | Sim |
| GET | `/api/courses/user/{userId}` | Cursos do usuário | Sim |
| GET | `/api/badges` | Listar badges | Não |
| GET | `/api/badges/user/{userId}` | Badges do usuário | Sim |
| GET | `/api/ranks` | Listar ranks | Não |
| GET | `/api/ranks/user/{userId}` | Rank do usuário | Sim |
| GET | `/api/ranks/leaderboard` | Leaderboard | Sim |
| GET | `/api/stats/user/{userId}` | Estatísticas do usuário | Sim |

## Infraestrutura (Terraform)

### Configuração Inicial

1. **Instalar Terraform** e **Azure CLI**

2. **Login no Azure:**
   ```bash
   az login
   ```

3. **Criar storage account para estado do Terraform (primeira vez):**
   ```bash
   az group create --name nextstep-tfstate-rg --location brazilsouth
   az storage account create --name nextsteptfstate --resource-group nextstep-tfstate-rg --sku Standard_LRS
   az storage container create --name tfstate --account-name nextsteptfstate
   ```

4. **Configurar variáveis:**
   ```bash
   cd infra
   cp terraform.tfvars.example terraform.tfvars
   # Edite terraform.tfvars com seus valores
   ```

### Deploy da Infraestrutura

1. **Inicializar Terraform:**
   ```bash
   terraform init
   ```

2. **Validar configuração:**
   ```bash
   terraform validate
   ```

3. **Planejar mudanças:**
   ```bash
   terraform plan
   ```

4. **Aplicar infraestrutura:**
   ```bash
   terraform apply
   ```

5. **Obter outputs:**
   ```bash
   terraform output
   ```

### Recursos Criados

- **Resource Group**: Agrupamento de recursos
- **App Service Plan**: Plano de hospedagem para a API
- **Linux Web App**: Container da API .NET
- **MySQL Flexible Server**: Banco de dados gerenciado
- **Application Insights**: Monitoramento e telemetria
- **Key Vault**: Armazenamento seguro de segredos

## Gamificação

O NextStep inclui um sistema completo de gamificação:

- **Cursos**: Cursos com lições, progresso e XP
- **Badges**: Conquistas desbloqueadas por marcos (Primeiro Login, Quiz Master, Expert, etc.)
- **Ranks**: Sistema de níveis (Bronze, Prata, Ouro, Platina, Diamante, Lenda)
- **Leaderboard**: Ranking global de usuários por XP
- **Streaks**: Sequência de dias consecutivos de atividade
- **Estatísticas**: Dashboard com métricas do usuário

## Seeders

O banco de dados é populado automaticamente com dados iniciais ao iniciar a API:
- 5 categorias
- 5 usuários (1 admin, 4 comuns)
- 5 cursos
- 8 badges
- 6 ranks
- Estatísticas, inscrições, badges e ranks para cada usuário

## Segurança

- Autenticação via JWT (JSON Web Tokens)
- Senhas armazenadas com hash PBKDF2
- Variáveis sensíveis marcadas com `sensitive = true` no Terraform
- CORS configurável
- HTTPS obrigatório no App Service
- Health check configurado no Docker

## Contribuição

Este é um projeto acadêmico (TCC) da Fatec Praia Grande.

## Licença

Projeto acadêmico - Fatec Praia Grande
