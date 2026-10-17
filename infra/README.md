# Infraestrutura como Código (IaC) - NextStep na AWS

Este diretório contém toda a definição da infraestrutura da plataforma **NextStep** na **AWS**, gerenciada como código através do **Terraform**.

---

## 🏛️ Recursos Provisionados

- **VPC (`vpc.tf`)**: Rede isolada para a aplicação (`10.0.0.0/16`), com 1 Subnet Pública e 2 Subnets Privadas em zonas de disponibilidade distintas.
- **EC2 (`ec2.tf`)**: Servidor `t3.micro` rodando Ubuntu 22.04 LTS na subnet pública. O script `user_data` instala e habilita automaticamente o Docker e Docker Compose.
- **RDS (`rds.tf`)**: Instância MySQL 8.0 gerenciada (`db.t3.micro`), alocada de forma segura nas subnets privadas sem IP público.
- **Security Groups (`security_groups.tf`)**: Firewall configurado para permitir tráfego HTTP (80), HTTPS (443) e SSH (22) na EC2, e tráfego MySQL (3306) apenas originado da EC2.
- **S3 (`s3.tf`)**: Bucket com hospedagem estática habilitada para o Frontend React/Vite.

---

## 🚀 Como Provisionar

### 1. Pré-requisitos
- Terraform instalado localmente (>= 1.5.0)
- AWS CLI instalado e autenticado (`aws configure`)
- Um Key Pair SSH criado na sua região da AWS (ex: `nextstep-key`)

### 2. Inicialização e Deploy
```bash
cd infra

# Inicializar os provedores do Terraform
terraform init

# Validar o plano de execução
terraform plan

# Aplicar e criar a infraestrutura na AWS
terraform apply
```
*Digite `yes` para confirmar a criação.*

---

## 📋 Outputs Gerados para o GitHub Actions

Ao final da execução do `terraform apply`, copie os valores exibidos no terminal e configure nos **Secrets** do GitHub:

- `ec2_public_ip` $\rightarrow$ Secret `EC2_HOST`
- `rds_endpoint` $\rightarrow$ Secret `DB_HOST`
- `s3_bucket_name` $\rightarrow$ Secret `S3_BUCKET_NAME`
- `s3_website_url` $\rightarrow$ URL de acesso aos usuários

---

## 🧹 Limpeza de Recursos

Para destruir todos os recursos criados e evitar custos:
```bash
terraform destroy
```
