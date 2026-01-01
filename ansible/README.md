# Configuration Ansible pour DonLocal - Déploiement Multi-Machines

Cette configuration Ansible permet de déployer l'application DonLocal sur un cluster Kubernetes multi-machines avec PostgreSQL.

## 📋 Structure

```
ansible/
├── deploy.yml                    # Playbook principal (orchestre tout)
├── 01-prerequisites.yml          # Installation des prérequis (Docker, k8s)
├── 02-k8s-init-master.yml        # Initialisation du cluster Kubernetes
├── 03-k8s-join-workers.yml       # Ajout des workers au cluster
├── 04-deploy-postgres.yml        # Déploiement PostgreSQL (StatefulSet)
├── 05-deploy-backend.yml         # Déploiement de l'API backend
├── 06-postgres-cluster.yml       # Configuration cluster PostgreSQL (optionnel)
├── inventory.ini                 # Configuration des machines
├── group_vars/
│   └── all.yml                   # Variables globales
└── k8s/
    ├── postgres.yml              # Manifest Kubernetes pour PostgreSQL
    ├── postgres-secret.yml       # Secret pour credentials PostgreSQL
    └── backend.yml.j2            # Template pour le backend
```

## 🚀 Utilisation

### Déploiement complet (recommandé)

Depuis le répertoire `ansible/`:

```bash
cd ansible
ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=asaphkouokam/donlocal-api:latest"
```

### Déploiement étape par étape

```bash
cd ansible

# 1. Installer les prérequis sur toutes les machines
ansible-playbook -i inventory.ini 01-prerequisites.yml

# 2. Initialiser le cluster Kubernetes sur le master
ansible-playbook -i inventory.ini 02-k8s-init-master.yml

# 3. Joindre les workers au cluster
ansible-playbook -i inventory.ini 03-k8s-join-workers.yml

# 4. Déployer PostgreSQL
ansible-playbook -i inventory.ini 04-deploy-postgres.yml

# 5. Déployer le backend
IMAGE_NAME=asaphkouokam/donlocal-api:latest ansible-playbook -i inventory.ini 05-deploy-backend.yml
```

### Déploiement partiel (ignorer certaines étapes)

```bash
# Ignorer l'installation des prérequis
SKIP_PREREQUISITES=true ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=..."

# Ignorer l'initialisation du cluster
SKIP_CLUSTER_INIT=true ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=..."

# Ignorer le déploiement PostgreSQL
SKIP_POSTGRES=true ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=..."

# Ignorer le déploiement backend
SKIP_BACKEND=true ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=..."
```

## ⚙️ Configuration

### Inventory (`inventory.ini`)

Configurez vos machines dans `inventory.ini`:

```ini
[master]
localhost ansible_connection=local ansible_user=asaph

[workers]
192.168.1.11 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
192.168.1.12 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

### Variables (`group_vars/all.yml`)

Personnalisez les variables dans `group_vars/all.yml`:

- `postgres_replicas`: Nombre de répliques PostgreSQL (1 pour single instance)
- `app_replicas`: Nombre de répliques de l'API
- `postgres_storage_size`: Taille du volume persistant PostgreSQL
- `storage_class_name`: Classe de stockage Kubernetes

## 🔐 Prérequis

### Sur la machine de contrôle (où Ansible s'exécute)

- Ansible installé
- kubectl installé
- Accès SSH aux machines distantes (si applicable)

### Sur toutes les machines (master + workers)

- Ubuntu/Debian (ou distribution Linux compatible)
- Accès root ou utilisateur avec sudo
- Connexion SSH configurée
- Ports ouverts entre master et workers:
  - 6443 (API server)
  - 10250 (Kubelet API)
  - 2379-2380 (etcd)
  - 10251 (kube-scheduler)
  - 10252 (kube-controller-manager)

### Configuration SSH

1. Générer une clé SSH (si pas déjà fait):
   ```bash
   ssh-keygen -t ed25519
   ```

2. Copier la clé sur les machines:
   ```bash
   ssh-copy-id user@host
   ```

3. Tester la connexion:
   ```bash
   ansible all -i inventory.ini -m ping
   ```

## 🗄️ PostgreSQL Multi-Machines

### Configuration actuelle

PostgreSQL est déployé en **single instance** avec:
- StatefulSet pour garantir l'ordre et les volumes persistants
- Volume persistant pour la persistance des données
- Service ClusterIP pour l'accès interne

### Communication entre machines

PostgreSQL est accessible depuis tous les pods du cluster via le service Kubernetes `postgres` sur le port `5432`. Kubernetes gère automatiquement la résolution DNS et le routage.

### Pour un vrai cluster PostgreSQL

Si vous avez besoin d'un cluster PostgreSQL avec réplication:

1. **Option 1: Opérateur PostgreSQL**
   - Utilisez Crunchy Data PostgreSQL Operator
   - Ou Zalando PostgreSQL Operator

2. **Option 2: Patroni + etcd**
   - Configurez Patroni pour la haute disponibilité
   - Utilisez etcd pour la coordination

3. **Option 3: Streaming Replication manuelle**
   - Configurez manuellement la réplication PostgreSQL
   - Utilisez des StatefulSets multiples

Voir `06-postgres-cluster.yml` pour un exemple de configuration.

## 🔍 Vérification

### Vérifier l'état du cluster

```bash
kubectl get nodes -o wide
kubectl get pods -o wide
kubectl get services
```

### Vérifier PostgreSQL

```bash
kubectl get statefulset postgres
kubectl get pods -l app=postgres
kubectl logs statefulset/postgres
```

### Vérifier l'API

```bash
kubectl get deployment donlocal-api
kubectl get pods -l app=donlocal-api
kubectl logs deployment/donlocal-api
```

### Tester la connectivité

```bash
# Depuis un pod de l'API
kubectl exec -it deployment/donlocal-api -- sh -c "nc -zv postgres 5432"
```

## 🐛 Dépannage

### Problème: Les workers ne peuvent pas joindre le cluster

1. Vérifiez les ports ouverts entre master et workers
2. Vérifiez que la commande `kubeadm join` est correcte
3. Vérifiez les logs: `journalctl -u kubelet`

### Problème: PostgreSQL ne démarre pas

1. Vérifiez les volumes persistants: `kubectl get pvc`
2. Vérifiez les logs: `kubectl logs statefulset/postgres`
3. Vérifiez les événements: `kubectl get events`

### Problème: L'API ne peut pas se connecter à PostgreSQL

1. Vérifiez que le service PostgreSQL existe: `kubectl get svc postgres`
2. Vérifiez la résolution DNS: `kubectl exec -it deployment/donlocal-api -- nslookup postgres`
3. Vérifiez les variables d'environnement: `kubectl describe deployment donlocal-api`

## 📝 Notes

- Le playbook principal (`deploy.yml`) peut être exécuté plusieurs fois (idempotent)
- Les étapes peuvent être ignorées individuellement via les variables d'environnement
- PostgreSQL utilise des volumes persistants pour garantir la persistance des données
- Le cluster Kubernetes gère automatiquement la distribution des pods sur les machines

## 🔗 Intégration Jenkins

Le Jenkinsfile est configuré pour utiliser ce playbook. Voir `../Jenkinsfile` pour plus de détails.
