# WebApp - CSYE 6225

## Contents

- [Introduction](#introduction)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Requirements](#requirements)
  - [Initial Setup](#initial-setup)
    - [Repo Cloning](#repo-cloning)
    - [Environment Setup](#environment-setup)
    - [File Preparation](#file-preparation)
  - [Application Launch](#application-launch)

## Overview

This project is a RESTful API for managing assignment tasks, enabling users to create, read, update, and delete assignment entries.

## Requirements

Ensure these tools and services are available before starting:
- Node.js (version 18)
- MariaDB
- A Debian 12-based DigitalOcean Droplet!

## Initial Setup

### Repo Cloning

1. Get the code repository:
   ```bash
   git clone https://github.com/csye6225-002769231/webapp.git

Import command for certificate:
sudo aws acm import-certificate --certificate fileb://demo_manavmalavia_me/demo_manavmalavia_me.crt --private-key fileb://demo_manavmalavia_me/private.key --profile demo --region us-west-2