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


## SSL Certificate Import for AWS ACM

## Prerequisites

Before executing the command, ensure you have the following:

- AWS CLI installed and configured on your machine.
- Access to the necessary certificate files, which include:
  - Your SSL/TLS certificate (`.crt` file).
  - Your private key file (`.key`).
  - Your certificate chain file (`.ca-bundle`).
- Adequate AWS IAM permissions to import certificates into ACM.

## Usage

### Importing the Certificate

To import your SSL/TLS certificate into AWS ACM, use the following command structure:

```bash
sudo aws acm import-certificate --certificate fileb://(certificate_name).crt --private-key fileb://(private_key_filename).key --certificate-chain fileb://(ca_bundle_certificate_name).ca-bundle --region (region_imported_to) --profile (profile_imported_to)
```

Example:
```bash
sudo aws acm import-certificate --certificate fileb://demo_manavmalavia_me/demo_manavmalavia_me.crt --private-key fileb://demo_manavmalavia_me/private.key --profile demo --region us-west-2