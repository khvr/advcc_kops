# app-prereq-helm-charts

This is the pre-req helm chart to setup Kafka/Zookeeper on the Kubernetes cluster before application is installed/setup.

## Team Information

| Name                           | NEU ID    | Email Address                    |
| ------------------------------ | --------- | -------------------------------- |
| Viraj Rajopadhye               | 001373609 | rajopadhye.v@northeastern.edu    |
| Pranali Ninawe                 | 001377887 | ninawe.p@northeastern.edu        |
| Harsha vardhanram kalyanaraman | 001472407 | kalyanaraman.ha@northeastern.edu |

<br/>

# prereq Helm Charts

* This helm chart sets up the pre requisites for the microservice applications
1. Kafka - zookeeper
2. EFK stack - Elasticsearch FluentD Kibana, elastic search exporter
3. Metrics stack - Prometheus and Grafana

# kafka-zookeeper
## Useful commands
```bash
cd
wget https://downloads.apache.org/kafka/2.6.0/kafka_2.13-2.6.0.tgz  &&/
mkdir -p /usr/local/kafka-server && cd /usr/local/kafka-server &&/
tar -xvzf ~/kafka_2.13-2.6.0.tgz --strip 1

cd /usr/local/kafka-server
--list topics
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
--create topic
bin/kafka-topics.sh --create --topic csye7125-demo --bootstrap-server localhost:9092
--delete topic
bin/kafka-topics.sh --delete --topic csye7125-demo --bootstrap-server localhost:9092
--Describe topic
bin/kafka-topics.sh --describe --topic csye7125-demo --bootstrap-server localhost:9092
--create topic with paramerters
bin/kafka-topics.sh --create --topic csye7125-demo --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 \
--config max.message.bytes=64000 --config flush.messages=1
--create producer
bin/kafka-console-producer.sh --topic csye7125-demo --bootstrap-server localhost:9092
--create consumers
bin/kafka-console-consumer.sh --topic csye7125-demo --from-beginning --bootstrap-server localhost:9092 --group cg1
```

## Image used
### kafka
https://hub.docker.com/r/wurstmeister/kafka/<br>
https://www.github.com/wurstmeister/kafka-docker

### zookeeper
https://hub.docker.com/r/digitalwonderland/zookeeper/

## Setup

## 1. Install helm chart
```
helm install prereq ./helm/pre-req-helm/ --set imageCredentials.Docker_username=<docker_username>,
imageCredentials.Docker_password=<docker_password/docker_access_token>,
kafkaImage=<docker_username/custom_kafka_image:tag>
```

## 2. unistall helm chart
```
helm uninstall prereq
```


## 3. Accessing logging and metric stack using kubefwd
### 1. Install kubefwd bulk service port forwarding
kubefwd can be installed using the following links<br/>
https://github.com/txn2/kubefwd<br/>
https://kubefwd.com/
```bash
$ sudo -E ~/bin/kubefwd svc -n default -n logging
```

Services can be reached by:
1. Kibana - http://kibana.logging/
2. Grafana - http://prereq-grafana/
3. Prometheus - http://prereq-prometheus-server/

## 4. Using Port forwarding

```bash
$ kubectl port-forward services/prereq-grafana  3000:80
$ kubectl port-forward services/prereq-prometheus-server 9090:80
$ kubectl port-forward services/prereq-elasticsearch-exporter  9108
$ kubectl port-forward services/kibana  3001:80 -n logging
```
## 5. Grafana Dashboard
To login to grafana username: admin and password can be obtained by running:
```
$ kubectl get secret prereq-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo0
```

Grafana Datasource will be prometheus running at
http://prereq-prometheus-server

The dashboards for grafana is imported from the dashboard folders of the respective deployments:
1. Kafka
2. Elasticsearch
3. Webapp
4. Poller
5. Notifier

## 6. Kibana Dashboard
Steps to configure:
1. Elasticsearch index management : Create index pattern<br/>
  Step 1 of 2: Define index pattern<br/>
   ```bash
   logstash-*
   ```
    Step 2 of 2: Configure settings<br/>
    Time Filter field name
    ```bash
    @timestamp
    ```
    to create and index pattern

2. Click Discover
    * add log, kubernetes.namespace_name
    * filter by kubernetes.namespace.name is one of backed-webapp, poller , notifier