variable "aws_region" {
  description = "Região da AWS para provisionamento"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "nextstep"
}

variable "environment" {
  description = "Ambiente de execução (prod, dev, staging)"
  type        = string
  default     = "prod"
}

variable "ec2_key_name" {
  description = "Nome do Key Pair SSH cadastrado na AWS para acesso à instância EC2"
  type        = string
  default     = "nextstep-key"
}

variable "db_password" {
  description = "Senha do administrador do banco de dados RDS MySQL"
  type        = string
  default     = "MudarSenhaNextStep2026!"
  sensitive   = true
}

variable "s3_bucket_name" {
  description = "Nome do bucket S3 para hospedagem do Frontend (deixe em branco para gerar com sufixo randômico único)"
  type        = string
  default     = ""
}
