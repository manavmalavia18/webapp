#!/bin/bash

# Update the package repository
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install MariaDB Server
sudo apt install -y mariadb-server

# Secure MariaDB installation (you will be prompted for settings)
sudo mariadb_secure_installation

# Install Node.js modules using npm
sudo apt install nodejs npm -y

# Install the 'unzip' utility (if not already installed)
sudo apt install -y unzip
