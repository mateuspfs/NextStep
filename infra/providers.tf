terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "nextstep-tfstate-rg"
    storage_account_name = "nextsteptfstate"
    container_name       = "tfstate"
    key                  = "nextstep.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}
