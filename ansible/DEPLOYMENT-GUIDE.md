# Guide de Déploiement Multi-Machines - DonLocal

Ce guide explique comment déployer DonLocal sur un cluster Kubernetes multi-machines.

## 🎯 Vue d'ensemble

Le déploiement se fait en plusieurs étapes :

1. **Prérequis** : Installation de Docker, Kubernetes (kubeadm, kubelet, kubectl) sur toutes les machines
2. **Initialisation du cluster** : Configuration du master Kubernetes
3. **Ajout des workers** : Connexion des machines workers au cluster
4. **PostgreSQL** : Déploiement de PostgreSQL avec volumes persistants
5. **Backend API** : Déploiement de l'application DonLocal

## 📋 Préparation

### 1. Configuration de l'inventory

Copiez `inventory.example.ini` vers `inventory.ini` et configurez vos machines :

```bash
cp inventory.example.ini inventory.ini
nano inventory.ini
```

Exemple de configuration pour 3 machines :

```ini
[master]
master.example.com ansible_host=192.168.1.10 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519

[workers]
worker1.example.com ansible_host=192.168.1.11 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
worker2.example.com ansible_host=192.168.1.12 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

### 2. Configuration SSH

Assurez-vous que vous pouvez vous connecter en SSH sans mot de passe à toutes les machines :

```bash
# Générer une clé SSH si nécessaire
ssh-keygen -t ed25519

# Copier la clé sur chaque machine
ssh-copy-id user@master.example.com
ssh-copy-id user@worker1.example.com
ssh-copy-id user@worker2.example.com

# Tester la connexion avec Ansible
ansible all -i inventory.ini -m ping
```

### 3. Configuration des variables

Personnalisez les variables dans `group_vars/all.yml` si nécessaire :

- `postgres_replicas` : Nombre de répliques PostgreSQL
- `app_replicas` : Nombre de répliques de l'API
- `postgres_storage_size` : Taille du volume PostgreSQL
- `storage_class_name` : Classe de stockage Kubernetes

## 🚀 Déploiement

### Déploiement complet (recommandé)

```bash
cd ansible
ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=asaphkouokam/donlocal-api:latest"
```

### Déploiement étape par étape

Si vous préférez exécuter les étapes manuellement :

```bash
cd ansible

# 1. Installer les prérequis
ansible-playbook -i inventory.ini 01-prerequisites.yml

# 2. Initialiser le cluster
ansible-playbook -i inventory.ini 02-k8s-init-master.yml

# 3. Ajouter les workers
ansible-playbook -i inventory.ini 03-k8s-join-workers.yml

# 4. Déployer PostgreSQL
ansible-playbook -i inventory.ini 04-deploy-postgres.yml

# 5. Déployer le backend
ansible-playbook -i inventory.ini 05-deploy-backend.yml -e "IMAGE_NAME=asaphkouokam/donlocal-api:latest"
```

## 🔍 Vérification

### Vérifier le cluster

```bash
# Sur le master
kubectl get nodes -o wide

# Vous devriez voir :
# NAME                STATUS   ROLES           AGE   VERSION   INTERNAL-IP
# master.example.com  Ready    control-plane   5m    v1.28.x   192.168.1.10
# worker1.example.com Ready    <none>          3m    v1.28.x   192.168.1.11
# worker2.example.com Ready    <none>          3m    v1.28.x   192.168.1.12
```

### Vérifier les pods

```bash
kubectl get pods -o wide --all-namespaces

# Les pods devraient être distribués sur les différentes machines
```

### Vérifier PostgreSQL

```bash
kubectl get statefulset postgres
kubectl get pods -l app=postgres -o wide
kubectl get pvc  # Volumes persistants
```

### Vérifier l'API

```bash
kubectl get deployment donlocal-api
kubectl get pods -l app=donlocal-api -o wide
kubectl get svc donlocal-api
```

## 🗄️ Communication PostgreSQL Multi-Machines

### Comment ça fonctionne

PostgreSQL est déployé comme un **StatefulSet** avec un **Service Kubernetes**. Cela signifie :

1. **Service DNS** : PostgreSQL est accessible via le nom de service `postgres` depuis n'importe quel pod du cluster
2. **Routage automatique** : Kubernetes route automatiquement les connexions vers le pod PostgreSQL
3. **Volumes persistants** : Les données PostgreSQL sont stockées dans un volume persistant qui suit le pod

### Accès depuis les pods de l'API

Les pods de l'API se connectent à PostgreSQL via :

```
DB_HOST=postgres  # Nom du service Kubernetes
DB_PORT=5432      # Port du service
```

Kubernetes résout automatiquement `postgres` vers l'IP du service, qui route vers le pod PostgreSQL.

### Distribution des pods

Kubernetes distribue automatiquement les pods sur les différentes machines :

- **PostgreSQL** : Un seul pod (StatefulSet) sur une machine
- **API** : Plusieurs pods (selon `app_replicas`) distribués sur les machines

Pour forcer la distribution, vous pouvez utiliser des `nodeSelector` ou `affinity` rules.

## 🔧 Configuration avancée

### Ajouter un nouveau worker

1. Ajoutez la machine dans `inventory.ini` :

```ini
[workers]
# ... machines existantes ...
new-worker.example.com ansible_host=192.168.1.13 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

2. Installez les prérequis :

```bash
ansible-playbook -i inventory.ini 01-prerequisites.yml --limit new-worker.example.com
```

3. Joignez au cluster :

```bash
ansible-playbook -i inventory.ini 03-k8s-join-workers.yml --limit new-worker.example.com
```

### Cluster PostgreSQL avec réplication

Pour un vrai cluster PostgreSQL avec réplication, consultez `06-postgres-cluster.yml` et considérez :

- Utiliser un opérateur PostgreSQL (Crunchy Data, Zalando)
- Configurer Patroni avec etcd
- Configurer manuellement la streaming replication

### Augmenter le nombre de répliques

Modifiez `group_vars/all.yml` :

```yaml
app_replicas: 4  # Augmenter le nombre de pods API
```

Puis redéployez :

```bash
ansible-playbook -i inventory.ini 05-deploy-backend.yml -e "IMAGE_NAME=..."
```

## 🐛 Dépannage

### Les workers ne peuvent pas joindre le cluster

1. Vérifiez les ports ouverts entre master et workers
2. Vérifiez la commande join : `cat /tmp/kube_join.sh` sur le master
3. Vérifiez les logs : `journalctl -u kubelet` sur les workers

### PostgreSQL ne démarre pas

1. Vérifiez les volumes : `kubectl get pvc`
2. Vérifiez les logs : `kubectl logs statefulset/postgres`
3. Vérifiez les événements : `kubectl describe pod postgres-0`

### L'API ne peut pas se connecter à PostgreSQL

1. Vérifiez le service : `kubectl get svc postgres`
2. Testez la résolution DNS : `kubectl exec -it deployment/donlocal-api -- nslookup postgres`
3. Testez la connectivité : `kubectl exec -it deployment/donlocal-api -- nc -zv postgres 5432`

## 📝 Notes importantes

- **Volumes persistants** : Les données PostgreSQL sont persistées dans des volumes. Si vous supprimez le StatefulSet, les données restent (sauf si vous supprimez aussi les PVC).
- **Distribution des pods** : Kubernetes distribue automatiquement les pods, mais vous pouvez utiliser des règles d'affinité pour contrôler la distribution.
- **Communication réseau** : Tous les pods peuvent communiquer entre eux via les services Kubernetes, même s'ils sont sur des machines différentes.

## 🔗 Intégration CI/CD

Le Jenkinsfile est configuré pour utiliser ce déploiement. Voir `../Jenkinsfile` pour plus de détails.


