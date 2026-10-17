# VPC da aplicação NextStep
resource "aws_vpc" "nextstep_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Subnet Pública: Onde o servidor da API (EC2) reside com IP público
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.nextstep_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# Subnets Privadas: Isolamento para o Banco de Dados (RDS MySQL)
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.nextstep_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.project_name}-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.nextstep_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.project_name}-private-subnet-2"
  }
}

# Internet Gateway para tráfego público na VPC
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.nextstep_vpc.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Tabela de roteamento pública
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.nextstep_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Associação da subnet pública com a tabela de rota
resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Grupo de subnets para o RDS (exige no mínimo 2 AZs diferentes)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}
