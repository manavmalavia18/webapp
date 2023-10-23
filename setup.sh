#!/bin/bash

# Reload systemd to apply changes to service unit files
sudo systemctl daemon-reload

# Start the service
sudo systemctl start webapp_start

# Enable the service to start on boot
sudo systemctl enable webapp_start
