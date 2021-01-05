# advcc_kops
* This repo consists of depolyment over AWS using KOPS
* Managed Configuration using Ansible to setup and destroy A) Jenkins Server with elastic ip B) Kubernetes Cluster using kops and automated the installation of metrics server, cluster autoscaler, Nginx ingress controller and Letsencrypt cluster certificate issuer C) three RDS instances running on separate VPC peered to Cluster VPC

* Deployed the pre requisites for the applications using helm charts such as Kafka, Zookeeper, Metrics Stack ­ Prometheus, Grafana and Logging Stack ­ EFK (ElasticSearch, Fluentd, Kibana)

* Developed Helm charts to deploy 3 Micro services developed using Nodejs and containerized image is stored on a private Docker hub repository, installing deployments, services, Horizontal pod Autoscaler’s and Ingress resource, to establish path based routing

* Decoupled the front end micro­service from other services by implementing Kafka streaming between then and used Jenkins to implement a CICD pipeline to build, push docker images to Docker Hub and perform rolling update style deployments on the Kubernetes cluster