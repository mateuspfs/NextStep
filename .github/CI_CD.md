# Integração e Entrega Contínuas (CI/CD) - NextStep na AWS

Este repositório contém as esteiras de **GitHub Actions** responsáveis pelo build, validação e implantação contínua (CI/CD) do backend (.NET) e frontend (React/Vite) na nuvem **AWS**.

---

## 🚀 Workflows Disponíveis

### 1. Deploy da API (.NET) no Amazon EC2 (`deploy-api.yml`)
Disparado automaticamente a cada push na branch `main` quando houver alterações em `api/**`, no `Dockerfile`, no `docker-compose.prod.yml` ou no workflow. Também pode ser executado manualmente via `workflow_dispatch`.

**Etapas do Fluxo:**
1. **Compilação e Validação:** Configura o SDK do .NET 10 e executa o restore e build da solução `api/NextStep.sln` em modo `Release`.
2. **Build e Push para o Amazon ECR:**
   - Autentica-se na AWS usando as credenciais do GitHub Secrets.
   - Cria o repositório `nextstep-api` no **Amazon ECR** caso ainda não exista.
   - Constrói a imagem Docker multi-stage otimizada e publica as tags `latest` e `${{ github.sha }}`.
3. **Deploy Contínuo no Amazon EC2:**
   - Conecta-se via SSH na instância EC2 de produção.
   - Copia o arquivo `docker-compose.prod.yml` atualizado para o servidor (`~/`).
   - Autentica o Docker da EC2 no ECR e executa `docker compose pull` e `docker compose up -d` com as variáveis de ambiente de banco de dados e JWT injetadas dinamicamente.

---

### 2. Deploy do Frontend (React/Vite) no Amazon S3 (`deploy-frontend.yml`)
Disparado a cada push na branch `main` com modificações em `frontend/**` ou no próprio workflow.

**Etapas do Fluxo:**
1. **Instalação e Build:** Configura o Node.js 20, executa `npm ci` para instalar dependências e roda `npm run build` injetando a URL da API da EC2 (`VITE_API_URL`).
2. **Sincronização com o Amazon S3:** Realiza o `aws s3 sync dist/ s3://${S3_BUCKET_NAME} --delete`, removendo arquivos obsoletos e servindo os arquivos estáticos compilados.
3. **Invalidação de Cache (Opcional):** Se o `CLOUDFRONT_DISTRIBUTION_ID` estiver configurado, invalida o cache da CDN global para entrega instantânea das novidades.

---

## 🔐 Segredos Necessários no GitHub (GitHub Secrets)

Para configurar, acesse o repositório no GitHub em:
**Settings > Secrets and variables > Actions > New repository secret**

| Secret | Descrição | Exemplo |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Chave de acesso IAM da AWS com permissão para ECR, S3 e CloudFront | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta IAM correspondente | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | Região da AWS onde os recursos estão provisionados | `us-east-1` ou `us-east-2` |
| `AWS_ACCOUNT_ID` | ID numérico de 12 dígitos da conta AWS | `123456789012` |
| `EC2_HOST` | IP público ou DNS da instância EC2 gerada pelo Terraform | `54.210.120.45` |
| `EC2_USERNAME` | Usuário SSH da instância EC2 (padrão Ubuntu) | `ubuntu` |
| `SSH_PRIVATE_KEY` | Chave privada SSH (.pem) associada à EC2 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DB_HOST` | Endpoint do RDS MySQL gerado pelo Terraform | `nextstep-rds-mysql.xxx.us-east-1.rds.amazonaws.com` |
| `DB_NAME` | Nome do banco de dados | `nextstep` |
| `DB_USER` | Usuário do banco de dados | `admin` |
| `DB_PASSWORD` | Senha configurada no RDS | `SuaSenhaSegura123!` |
| `DB_PORT` | Porta de conexão do banco de dados (opcional, padrão 3306) | `3306` |
| `JWT_SECRET_KEY` | Chave secreta para assinatura dos tokens JWT da API | `ChaveUltraSeguraNextStep2026!@#` |
| `S3_BUCKET_NAME` | Nome do bucket S3 estático gerado pelo Terraform | `nextstep-frontend-prod-12345` |
| `VITE_API_URL` | URL pública da **API na EC2** (não use a URL do S3). Se vazio, o deploy usa `http://<EC2_HOST>/api` | `http://54.210.120.45/api` |
| `CLOUDFRONT_DISTRIBUTION_ID` | *(Opcional)* ID da distribuição do CloudFront | `E1A2B3C4D5E6F7` |

---

## 🛠️ Arquitetura e Comunicação

```mermaid
flowchart TD
    Dev[Desenvolvedor] -->|git push main| GH[GitHub Actions]
    
    subgraph CI/CD [Pipelines GitHub Actions]
        GH -->|Job API| BuildAPI[Build & Test .NET 10]
        BuildAPI -->|Push Imagem| ECR[Amazon ECR: nextstep-api]
        ECR -->|Deploy SSH| EC2[Amazon EC2: Ubuntu + Docker Compose]
        
        GH -->|Job Frontend| BuildFront[Build React + Vite]
        BuildFront -->|Sync dist/| S3[Amazon S3 Static Website]
        S3 -->|Opcional| CF[Amazon CloudFront CDN]
    end
    
    subgraph AWS VPC [Nuvem AWS - VPC Isolada]
        EC2 -->|Conexão Interna 3306| RDS[(Amazon RDS MySQL)]
    end
    
    User[Usuários] -->|Acesso Web| S3
    User -->|Chamadas HTTP /api| EC2
```
