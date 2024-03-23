packer {
  required_plugins {
    amazon = {
      version = ">= 0.1.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}


variable "aws_region" {
  type = string
  # default = "us-west-2"
}

variable "source_ami" {
  type    = string
  default = "ami-0b6edd8449255b799"
}
variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "subnet_id" {
  type = string
  # default = "subnet-06ccf8aab10478919"
}
variable "database_host" {
  type = string
}

variable "database_pass" {
  type = string
}

variable "database_user" {
  type = string
}
source "amazon-ebs" "my-ami" {
  ami_name        = "csye6225_debianami-${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "ami from csye6225"
  region          = "${var.aws_region}"

  instance_type = "t2.micro"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"

  # ami_regions = [
  #   "us-west-2",
  # ]

  # ami_users = [
  #   "518683749434",
  # ]

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }



  launch_block_device_mappings {
    device_name           = "/dev/xvda"
    delete_on_termination = true
    volume_size           = 8
    volume_type           = "gp2"
  }


}


build {
  sources = ["source.amazon-ebs.my-ami"]


  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1",
    ]

    inline = [
      "sudo apt-get update",
      "sudo apt install nodejs npm -y",
      "sudo apt install -y unzip",
      "sudo groupadd csye6225_users",
      "sudo useradd -s /bin/false -g csye6225_users -d /opt/webapp -m csye6225_manav",
    ]
  }
  provisioner "file" {
    source      = "webapp.zip"
    destination = "~/"
  }

  provisioner "shell" {
    inline = [
      "sudo apt-get install -y gpg",
      "wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i -E amazon-cloudwatch-agent.deb",
      "sudo systemctl enable amazon-cloudwatch-agent",
      "sudo systemctl start amazon-cloudwatch-agent",
    ]
  }

  provisioner "shell" {
    inline = [
      "echo web app zip process",
      "sudo ls -al",
      "sudo cp webapp.zip /opt/webapp",
      "cd /opt/webapp",
      "sudo unzip webapp.zip",
      "sudo mv user.csv /opt",
      "sudo mv webapp.service /etc/systemd/system",
      "sudo npm install",
      "sudo npm install nodemon",
      "sudo chown -R csye6225_manav:csye6225_users /opt/webapp",
      "sudo chmod g+x /opt/webapp",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable webapp",
      "sudo systemctl start webapp",
    ]
  }

}