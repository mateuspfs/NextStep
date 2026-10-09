variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "nextstep"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "brazilsouth"
}

variable "app_service_sku" {
  description = "SKU for the App Service Plan"
  type        = string
  default     = "B1"
}

variable "mysql_admin_username" {
  description = "Administrator username for MySQL server"
  type        = string
  default     = "nextstepadmin"
}

variable "mysql_admin_password" {
  description = "Administrator password for MySQL server"
  type        = string
  sensitive   = true
}

variable "mysql_database_name" {
  description = "Name of the MySQL database"
  type        = string
  default     = "nextstep"
}

variable "jwt_secret_key" {
  description = "Secret key for JWT token generation"
  type        = string
  sensitive   = true
}

variable "docker_image" {
  description = "Docker image for the API"
  type        = string
  default     = "nextstep-api:latest"
}

variable "docker_registry_url" {
  description = "URL of the Docker registry"
  type        = string
  default     = ""
}

variable "docker_registry_username" {
  description = "Username for Docker registry"
  type        = string
  default     = ""
}

variable "docker_registry_password" {
  description = "Password for Docker registry"
  type        = string
  sensitive   = true
  default     = ""
}

variable "allowed_cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    project     = "NextStep"
    managed_by  = "terraform"
  }
}
