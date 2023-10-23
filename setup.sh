#!/bin/bash

# Reload systemd to apply changes to service unit files
sudo systemctl daemon-reload

# Start the service
sudo systemctl start systemd_packer

# Enable the service to start on boot
sudo systemctl enable systemd_packer
