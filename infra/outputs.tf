output "ec2_public_ip" {
  value       = aws_instance.api_server.public_ip
  description = "IP Público da instância EC2 (Configurar no GitHub Secret EC2_HOST)"
}

output "rds_endpoint" {
  value       = aws_db_instance.mysql.address
  description = "Endereço Host do Banco de Dados RDS MySQL (Configurar no GitHub Secret DB_HOST)"
}

output "s3_website_url" {
  value       = aws_s3_bucket_website_configuration.frontend_web.website_endpoint
  description = "URL de acesso público ao Frontend no S3"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "Nome do Bucket S3 do Frontend (Configurar no GitHub Secret S3_BUCKET_NAME)"
}
