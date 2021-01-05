# k8s

Kubernetes infrastructure

Setup/Teardown of Kubernetes Cluster.

## Team Information

| Name                           | NEU ID    | Email Address                    |
| ------------------------------ | --------- | -------------------------------- |
| Viraj Rajopadhye               | 001373609 | rajopadhye.v@northeastern.edu    |
| Pranali Ninawe                 | 001377887 | ninawe.p@northeastern.edu        |
| Harsha vardhanram kalyanaraman | 001472407 | kalyanaraman.ha@northeastern.edu |

## 1. Useful Commands

### 1. PIP3 AND BOTO3 INSTALLATION (ANSIBLE PRERQ)
```bash
$ sudo apt install python3-pip
$ pip3 install boto3
$ pip3 show boto3
$ pip3 install boto
```
### 2. KOPS setup AWS

```bash
--Change profile
aws ec2 describe-instances --profile <working_profile>

prefix-example-com-state-store will be subDomain.your domainName.tld

--Setting the AWS_PROFILE environment variable at the command line
$ export AWS_PROFILE=<working_profile>
$ export KOPS_STATE_STORE=s3://prefix-example-com-state-store
$ env | grep -i kops
$ export NAME=prefix-example-com-state-store
$ env | grep -i name

-- Kops IAM user and group setup

$ aws iam create-group --group-name kops

$ aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess --group-name kops

$ aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonRoute53FullAccess --group-name kops

$ aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess --group-name kops

$ aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/IAMFullAccess --group-name kops

$ aws iam attach-group-policy --policy-arn arn:aws:iam::aws:policy/AmazonVPCFullAccess --group-name kops

--create kops user

$ aws iam create-user --user-name kops

$ aws iam add-user-to-group --user-name kops --group-name kops

$ aws iam create-access-key --user-name kops

--create cluster state s3 bucket

$ aws s3api create-bucket \
  --bucket prefix-example-com-state-store \
  --region us-east-1

--Enable versioning of cluster state s3 bucket
$ aws s3api put-bucket-versioning --bucket prefix-example-com-state-store --region us-east-1  --versioning-configuration Status=Enabled

-- Enable encryption of cluster state s3 bucket
$ aws s3api put-bucket-encryption --bucket prefix-example-com-state-store --region us-east-1 --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

```

### 3. Kops Commands
```bash
-- Create cluster file
$ kops create cluster  --zones=us-east-1a ${NAME}
# A config file is created

-- To get cluster information
$ kops get cluster

-- To edit cluster config
$ kops edit cluster subdomain.yourdomain.tld

-- To upgade to the latest version of k8 to run in the cluster
$ kops upgrade cluster --name --yes

-- To configure the cluster
$ kops update cluster --name=${NAME} --name subdomain.yourdomain.tld --yes

-- To perform rolling update to the cluster after changing the state
$ kops rolling-update cluster --name=${NAME} --name subdomain.yourdomain.tld

-- To Validate cluster
$ watch -n 5 kops validate cluster --name=${NAME}

-- To Terminate the cluster
$ kops delete cluster --name ${NAME} --yes

-- To add or remove instances from worker node or master node edit Instance groups
-- To Get instancegroups
$ kops get instancegroups --name subdomain.yourdomain.tld

-- To edit instancegroups
$ kops edit instancegroups nodes --name subdomain.yourdomain.tld
$ kops edit ig nodes --name subdomain.yourdomain.tld

-- Changes to existing cluster will perform a rolling update
Order goes by : 
CHANGES to the cluster config yaml file-->
$ kops update cluster --name subdomain.yourdomain.tld --yes-->
$ kops rolling-update cluster --name subdomain.yourdomain.tld
```

### 4. Kubernetes Dashboard setup

```bash
-- To get all contexts of clusters from kube config file
$ kubectl config get-contexts

-- Install Dashboard
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.4/aio/deploy/recommended.yaml

-- Create a SA for the dahboard user
$ cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
EOF

-- Create a admin cluster role binding for the dashboard user
$ cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF

-- Run proxy on localhost
$ kubectl proxy

-- Get token for the SA for dashboard user
$ kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')

-- Kubernetes dashboard endpoint

http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

```

### 5. Bastion Host SSH forwarding
```bash
--Get ELB address created for bastion node
$ bastion_elb_url=`aws elb --output=table describe-load-balancers|grep DNSName.\*bastion|awk '{print $4}'`

--Use ssh-agent to access bastion
$ eval `ssh-agent -s`

--Add AWS key pair .pem file
Mac:
$ ssh-add -K <keypair>.pem

Ubuntu:
$	ssh-add  <keypair>.pem
--verify key has been added to agent
$ ssh-add -l
--ssh to bastion
$ ssh -A ubuntu@${bastion_elb_url}
$ ssh to master or worker nodes
$ ssh -A ubuntu@<master_ip>
$ ssh -A ubuntu@<node_ip>
```

### 6. Ansible Host-key checking and ansible python interpreter
* Ansible has host key checking enabled by default.

* If a host is reinstalled and has a different key in ‘known_hosts’, this will result in an error message until corrected. If a host is not initially in ‘known_hosts’ this will result in prompting for confirmation of the key, which results in an interactive experience if using Ansible, from say, cron. You might not want this.

* If you understand the implications and wish to disable this behavior, you can do so by editing /etc/ansible/ansible.cfg or ~/.ansible.cfg:

  [defaults]<br/>
  host_key_checking = False<br/>

  Alternatively this can be set by the ANSIBLE_HOST_KEY_CHECKING environment variable:<br/>
  $ export ANSIBLE_HOST_KEY_CHECKING=False

* If ansible fails to recognise the python interpreter:
can do so by editing /etc/ansible/ansible.cfg or ~/.ansible.cfg:

  [localhost]<br/>
  ansible_python_interpreter=/usr/bin/python3
  <br/>

  Alternatively this can be set by the  -e command line option to manually set the python interpreter when you run a command<br/>
  $ ansible-playbook sample-playbook.yml -e 'ansible_python_interpreter=/usr/bin/python3'

### 7. To start from a task in ansible
Include  --start-at-task="task_name" while executing the playbook

### 8. yq Install
* yq is useful for editing yaml files and for editing cluster file
```bash
$ sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CC86BB64
$ sudo add-apt-repository ppa:rmescandon/yq
$ sudo apt update
$ sudo apt install yq -y
```

## 2. Cluster Setup
```bash
ansible-playbook -i <path_to_inventory> setup-k8s-cluster.yml -e \
"clustername=<cluster-name> \
state_store=<s3://subdomain.domain> \
node_count=<compute-node-count> \
node_size=<compute-node-instance-type> \
master_size=<master-node-instance-type> \
dns_zone_id=<zone-id/zone-domain-name> \
profile=<aws-profile> \
k8s_version=<kubernetes-version> \
ssh_path=<ssh-public-key-path> \
region=<aws-region> \"
db_username=<db(RDS)-user-name> \
db_password=<db(RDS)-password>  \
webapp_domain=<your full webapp domain with subdomain>"-vvv
```

## Delete Cluster

```bash
$ ansible-playbook -i <path_to_inventory> delete-k8s-cluster.yml -e \ "clustername=<cluster-name>
profile=<aws-profile>
region=<aws-region>" -vvv

$ ansible-playbook delete-k8s-cluster.yml -e "clustername=<cluster-name> profile=<aws-profile> region=<aws-region>" -vvv
```
