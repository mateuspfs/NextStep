# Security Group para a EC2 (NextStep API)
resource "aws_security_group" "api_sg" {
  name        = "${var.project_name}-api-sg"
  description = "Permitir HTTP (80), HTTPS (443) e SSH (22)"
  vpc_id      = aws_vpc.nextstep_vpc.id

  ingress {
    description = "HTTP Publico"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Publico"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Acesso SSH para administracao e deploy"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Liberar trafego de saida para downloads de pacotes e ECR"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-api-sg"
  }
}

# Security Group para o RDS (MySQL)
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Permitir acesso MySQL (3306) apenas originado da API"
  vpc_id      = aws_vpc.nextstep_vpc.id

  ingress {
    description     = "MySQL apenas da API"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.api_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}
