# poller
This is the poller application developed for CSYE 7125 course. We have used node.js and express.js to create Kafka services for the application. We are using MySql for the database.
## Team Information

| Name | NEU ID | Email Address |
| --- | --- | --- |
| Viraj Rajopadhye| 001373609 | rajopadhye.v@northeastern.edu |
| Pranali Ninawe | 001377887 | ninawe.p@northeastern.edu |
| Harsha vardhanram kalyanaraman | 001472407 | kalyanaraman.ha@northeastern.edu | 


* In order to run the application, clone the poller ($ cd git@github.com:CSYE7125/poller.git) navigate to the poller (cd poller) folder install dependencies "npm install" and run "npm start".

* Jenkins is setup to push docker images to docker hub. The images are tagged with both git commit number and latest tag.

* The latest image can be pulled and run locally.

* if running the application locally, create a .env file at the root of the project with the following variables

```bash
DB_USERNAME =<username>
DB_HOST_POLLER =<Database Endpoint>
DB_NAME_POLLER =<Database Name>
DB_PASS =<Database password>
BROKER1=<Kafka_broker 1 Endpoint>:<port>
BROKER2=<Kafka_broker 2 Endpoint>:<port>
BROKER3=<Kafka_broker 3 Endpoint>:<port>
OW_API_KEY=<Openweather_api_key>
WEATHER_POLL_TIME=<Time_between poller requesting weather deatails from openweatherAPI>
```
The project requires running a kafka cluster locally which can be brought up using the following docker compose file authored by simplesteph


https://github.com/simplesteph/kafka-stack-docker-compose/blob/master/zk-multiple-kafka-multiple.yml

```bash
docker-compose -f zk-single-kafka-single.yml up
docker-compose -f zk-single-kafka-single.yml down

docker-compose -f zk-multiple-kafka-multiple.yml up
docker-compose -f zk-multiple-kafka-multiple.yml down
```

# Docker Commands using Dockerfile

## Docker build
```bash
$ docker build <username>/<repo_path>:<tag> .
```
## Docker run
```bash
$ docker run --network=host --env-file <path_to_env_file> -d -p <your_host_port>:<container_app_port> <username>/<repo_path>:<tag> 
```
## Docker stop
```bash
$ docker stop <username>/<repo_path>:<tag> 
```
## Docker push
```bash
Note: if its a private repo run 
$ docker login --username=<user username> --email=<user email address>
$ docker push <username>/<repo_path>:<tag>
```
## Docker kill
```bash
$ docker kill <container_name or non_repeating_prefix_id>
```
## Docker Remove all containers and images
```bash
$ docker rm $(docker ps -a -q)
$ docker rmi $(docker images -a -q)
```

# Jenkins setup

1. A private repository should be created at Dockerhub
2. Commit to a poller on any branch will trigger a pipeline to build and push the image to that private repository
3. The pipeline is extended to run helm upgrade command to deploy changes to the cluster whenever there's change to the source code

Note: The Jenkins pipeline setup can be found in this repo: https://github.com/CSYE7125/jenkins

# Horizontal pod auto scaler

1. The poller is deployed with the HPA resource
2. To put load on the poller to trigger HPA
```bash
$ kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -n <poller-namespace> -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://<poller-service>/health; done"
```
3. to watch HPA
```bash
watch -n 5 kubectl describe hpa -n <poller-namespace> 
```

# Helm Installation

```bash
$ helm install poller ./helm/poller-helm/ --set DB_HOST_POLLER=<DB_HOST_POLLER>,
DB_USERNAME=<DBUSERNAME>,
DB_PASS=<DBPASSWORD>,
imageCredentials.Docker_username=<DOCKERUSERNAME>,
imageCredentials.Docker_password=<DOCKERPASSWORD or DOCKER_ACCESS_TOKEN>,OW_API_KEY=<Openweather_api_key>,
pollerDockerImage=<BACKEND_IMAGE_POLLER>,
pollerDeployment.replicationSet.replicas=<REPLICATION_SET_REPLICA_COUNT>
```