resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend" {
  bucket        = var.s3_bucket_name != "" ? var.s3_bucket_name : "${var.project_name}-frontend-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name = "${var.project_name}-frontend-bucket"
  }
}

# Hospedagem de site estático
resource "aws_s3_bucket_website_configuration" "frontend_web" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Desativar bloqueio de acesso público (Obrigatório para site estático no S3)
resource "aws_s3_bucket_public_access_block" "frontend_access" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Política de leitura pública para os objetos do bucket
resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.frontend.id

  depends_on = [aws_s3_bucket_public_access_block.frontend_access]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      },
    ]
  })
}
