# Busca da imagem oficial mais recente do Ubuntu 22.04 LTS
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "api_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public_subnet.id
  vpc_security_group_ids      = [aws_security_group.api_sg.id]
  associate_public_ip_address = true
  key_name                    = var.ec2_key_name

  tags = {
    Name = "${var.project_name}-api-server"
  }

  # Script de inicializacao automatica: Docker, Docker Compose e dependencias
  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update
              sudo apt-get install -y ca-certificates curl gnupg ec2-instance-connect

              # Adicionar chave oficial do Docker
              sudo install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              sudo chmod a+r /etc/apt/keyrings/docker.gpg

              # Adicionar repositorio do Docker
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

              sudo apt-get update
              sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

              sudo systemctl start docker
              sudo systemctl enable docker
              sudo usermod -aG docker ubuntu
              EOF
}
