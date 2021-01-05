# Jenkins
Jenkins Codebase
Installation and Setup of Nginx-Jenkins Server using Ansible Playbooks.

## Team Information

| Name | NEU ID | Email Address |
| --- | --- | --- |
| Viraj Rajopadhye| 001373609 | rajopadhye.v@northeastern.edu |
| Pranali Ninawe | 001377887 | ninawe.p@northeastern.edu |
| Harsha vardhanram kalyanaraman | 001472407 | kalyanaraman.ha@northeastern.edu | 

# Instructions to setup the certificate manually

## Install Java
```bash
sudo apt install default-jdk -y
```
## Install Jenkins
```bash
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo apt-add-repository "deb http://pkg.jenkins-ci.org/debian binary/"
sudo apt install jenkins -y
sudo service jenkins start
sudo service jenkins status
```

## Install ngnix and certbot
```bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt install -y nginx python-certbot-nginx
```

## Edit below file
```bash
sudo vi /etc/nginx/sites-available/default
```

```vim
Edit the default file to have:

upstream jenkins {
  server 127.0.0.1:8080 fail_timeout=0;
}

server {
        listen 80 default_server;
        listen [::]:80 default_server;

        root /var/www/html;
        index index.html index.htm index.nginx-debian.html;

        server_name jenkins.csye7125-fall2020-khvr.xyz.;

        location / {
                proxy_set_header        Host $host:$server_port;
                proxy_set_header        X-Real-IP $remote_addr;
                proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header        X-Forwarded-Proto $scheme; 
                proxy_set_header        Upgrade $http_upgrade;
                proxy_set_header        Connection "upgrade";
                proxy_pass              http://jenkins;
        }
}
```


## Restart ngnix and use certbot to generate certificate
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d jenkins.example.com
```


# Instructions to run code through Ansible

### To create vpc and ec2 instance run command 

```
AWS_PROFILE=<profile_name> AWS_REGION=<region> ansible-playbook --key-file ~/.ssh/<private_key> -i <path_to_inventory> aws_network_ec2_setup.yml --extra-var "ec2_instance_size=<instance_size> key_pair=<ec2_key_pair> elastic_ip=<elastic_ip_address> route53_zone_name=<domain_name> route53_record_name=<jenkins.domain_name> letsencrypt_email=<your_email_id> domain_name=<jenkins.domain_name> staging_cert=false"  -vvv
```

### To teardown vpc and ec2 instance run command

```
AWS_PROFILE=<profile_name> AWS_REGION=<region> ansible-playbook -i <path_to_inventory> aws_network_ec2_teardown.yml --extra-var "key=app value=jenkins elastic_ip=<elastic_ip_address>" -vvv
```