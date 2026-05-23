variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "forge"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain for ALB (optional)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "db_username" {
  type        = string
  default     = "forgeadmin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  type        = string
  default     = "db.t4g.micro"
}

variable "ecs_cpu" {
  type        = number
  default     = 256
}

variable "ecs_memory" {
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  type        = number
  default     = 2
}

variable "api_image" {
  description = "ECR image URI for API"
  type        = string
}

variable "frontend_url" {
  type        = string
  default     = "https://app.example.com"
}
