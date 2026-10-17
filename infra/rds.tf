resource "aws_db_instance" "mysql" {
  allocated_storage      = 20
  db_name                = "nextstep"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro" # Coberto pelo Free Tier da AWS
  username               = "admin"
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  skip_final_snapshot    = true
  publicly_accessible    = false

  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  tags = {
    Name = "${var.project_name}-rds-mysql"
  }
}
