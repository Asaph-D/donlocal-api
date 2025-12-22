# 📖 Guide d'Installation et Commandes - DonLocal API


## 🚀 Installation et Configuration

### 1. **Installation de Docker**
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Docker
sudo apt install docker.io -y

# Démarrer et activer Docker
sudo systemctl start docker
sudo systemctl enable docker

# Ajouter l'utilisateur au groupe docker (évite d'utiliser sudo)
sudo usermod -aG docker $USER
sudo usermod -aG docker jenkins

# Vérifier l'installation
docker --version
docker run hello-world
```

### 2. **Installation de Minikube (Kubernetes local)**
```bash
# Télécharger et installer Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Démarrer Minikube avec le driver Docker
minikube start --driver=docker

# Vérifier le cluster
minikube status
minikube dashboard  # Interface web
```

### 3. **Installation de kubectl**
```bash
# Télécharger kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Rendre exécutable et installer
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Vérifier l'installation
kubectl version --client
```

### 4. **Installation de Jenkins**
```bash
# Installation de Java
sudo apt install openjdk-17-jre -y

# Ajout du repository Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Installation
sudo apt update
sudo apt install jenkins -y

# Démarrer Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Mot de passe initial
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# URL d'accès
echo "Jenkins disponible sur: http://$(hostname -I | awk '{print $1}'):8080"
```

### 5. **Installation de Git**
```bash
sudo apt install git -y
git --version
```

## 🐳 **Commandes Docker Essentielles**

### Images Docker
```bash
# Lister les images
docker images
docker image ls

# Pull une image
docker pull asaphkouokam/donlocal-api:latest
docker pull asaphkouokam/donlocal-api:<commit-hash>

# Builder une image
docker build -t asaphkouokam/donlocal-api:latest .
docker build -t asaphkouokam/donlocal-api:v1.0 .

# Tagger une image
docker tag asaphkouokam/donlocal-api:latest asaphkouokam/donlocal-api:<commit-hash>

# Pousser vers Docker Hub
docker login
docker push asaphkouokam/donlocal-api:latest

# Supprimer des images
docker rmi <image-id>
docker image prune  # Nettoyer images non utilisées
```

### Conteneurs Docker
```bash
# Lister les conteneurs
docker ps          # En cours d'exécution
docker ps -a       # Tous les conteneurs

# Lancer un conteneur
docker run -d -p 3000:3000 --name donlocal-api asaphkouokam/donlocal-api:latest

# Arrêter/Supprimer
docker stop <container-id>
docker rm <container-id>
docker container prune  # Nettoyer conteneurs arrêtés

# Voir les logs
docker logs <container-id>
docker logs -f <container-id>  # Suivre en temps réel

# Exécuter une commande dans un conteneur
docker exec -it <container-id> sh
```

### Docker Hub
```bash
# Connexion
docker login
docker logout

# Informations
docker info
```

## ☸️ **Commandes Kubernetes (kubectl)**

### Bases
```bash
# Vérifier la connexion
kubectl cluster-info
kubectl version

# Configuration
kubectl config view
kubectl config current-context
```

### Déploiements
```bash
# Lister les déploiements
kubectl get deployments
kubectl get deployments -n default
kubectl get deploy  # Raccourci

# Créer un déploiement
kubectl create deployment donlocal-api --image=asaphkouokam/donlocal-api:latest

# Mettre à jour l'image
kubectl set image deployment/donlocal-api donlocal-api=asaphkouokam/donlocal-api:<new-tag>

# Rollout (déploiement)
kubectl rollout status deployment/donlocal-api
kubectl rollout history deployment/donlocal-api
kubectl rollout undo deployment/donlocal-api  # Rollback

# Scale
kubectl scale deployment/donlocal-api --replicas=3

# Décrire
kubectl describe deployment donlocal-api
```

### Pods
```bash
# Lister les pods
kubectl get pods
kubectl get pods -o wide
kubectl get pods -l app=donlocal-api

# Logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>  # Suivre en temps réel
kubectl logs deployment/donlocal-api  # Logs du déploiement

# Exécuter une commande
kubectl exec -it <pod-name> -- sh

# Décrire un pod
kubectl describe pod <pod-name>

# Supprimer
kubectl delete pod <pod-name>
```

### Services
```bash
# Lister les services
kubectl get services
kubectl get svc  # Raccourci

# Créer un service
kubectl expose deployment donlocal-api --type=NodePort --port=3000

# Accéder au service
minikube service donlocal-api --url
kubectl port-forward svc/donlocal-api 8080:3000
```

### Namespaces
```bash
kubectl get namespaces
kubectl create namespace staging
kubectl config set-context --current --namespace=staging
```

### Configuration YAML
```bash
# Appliquer un fichier YAML
kubectl apply -f deployment.yml
kubectl apply -f service.yml
kubectl apply -f k8s/  # Tous les fichiers d'un dossier

# Supprimer avec YAML
kubectl delete -f deployment.yml

# Éditer une ressource
kubectl edit deployment donlocal-api
```

## 🏗️ **Commandes Minikube**

```bash
# Démarrer/Arrêter
minikube start
minikube stop
minikube delete  # Supprimer le cluster

# Statut
minikube status
minikube dashboard  # Ouvrir le dashboard web

# Services
minikube service list
minikube service donlocal-api --url

# Tunnel (pour LoadBalancer)
minikube tunnel

# Addons
minikube addons list
minikube addons enable ingress
minikube addons enable metrics-server
```

## 🛠️ **Commandes Jenkins**

```bash
# Gestion du service
sudo systemctl start jenkins
sudo systemctl stop jenkins
sudo systemctl restart jenkins
sudo systemctl status jenkins

# Logs
sudo journalctl -u jenkins -f
sudo tail -f /var/log/jenkins/jenkins.log

# Configuration
sudo nano /etc/default/jenkins  # Variables d'environnement
sudo nano /var/lib/jenkins/config.xml  # Configuration principale

# Réinitialiser le mot de passe admin
# (si perdu, éditer le fichier config.xml)
```

## 🔄 **Pipeline de Déploiement**

### 1. **Déploiement Manuel Rapide**
```bash
# Récupérer le code
git clone https://github.com/Asaph-D/donlocal-api.git
cd donlocal-api

# Pull l'image Docker
docker pull asaphkouokam/donlocal-api:latest

# Déployer sur Kubernetes
kubectl set image deployment/donlocal-api donlocal-api=asaphkouokam/donlocal-api:latest --record
kubectl rollout status deployment/donlocal-api

# Vérifier
kubectl get pods
kubectl get services
```

### 2. **Script de Déploiement Automatique**
```bash
#!/bin/bash
# deploy.sh

# Variables
IMAGE_TAG=$(git rev-parse HEAD)
IMAGE_NAME="asaphkouokam/donlocal-api:${IMAGE_TAG}"

echo "🚀 Déploiement en cours..."
echo "📦 Tag: ${IMAGE_TAG}"
echo "🐳 Image: ${IMAGE_NAME}"

# Pull de l'image
docker pull asaphkouokam/donlocal-api:latest
docker tag asaphkouokam/donlocal-api:latest ${IMAGE_NAME}

# Déploiement Kubernetes
kubectl set image deployment/donlocal-api donlocal-api=${IMAGE_NAME} --record
kubectl rollout status deployment/donlocal-api --timeout=300s

echo "✅ Déploiement terminé!"
```

## 🧹 **Maintenance et Nettoyage**

```bash
# Nettoyer Docker
docker system prune -a  # Supprimer tout le cache
docker image prune      # Images non utilisées
docker container prune  # Conteneurs arrêtés
docker volume prune     # Volumes non utilisés

# Nettoyer Kubernetes
kubectl delete all --all  # Supprimer toutes les ressources dans le namespace
kubectl delete pods --all
kubectl delete deployments --all
kubectl delete services --all

# Redémarrer Minikube
minikube stop
minikube delete
minikube start

# Vérifier l'espace disque
df -h
docker system df
```

## 🔍 **Diagnostic et Dépannage**

```bash
# Vérifier la santé du système
docker info
kubectl get componentstatuses
minikube status

# Logs détaillés
journalctl -xe  # Logs système
docker events   # Événements Docker
kubectl get events  # Événements Kubernetes

# Tests de connexion
curl $(minikube service donlocal-api --url)
kubectl run test --image=busybox --rm -it --restart=Never -- wget -O- donlocal-api:3000
```

## 📁 **Structure des Fichiers**

```
donlocal-api/
├── Dockerfile                 # Configuration Docker
├── deployment.yml            # Déploiement Kubernetes
├── Jenkinsfile              # Pipeline Jenkins
├── deploy.sh               # Script de déploiement
└── k8s/                    # Configuration Kubernetes
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

## 🚨 **Commandes d'Urgence**

```bash
# Tout arrêter
docker stop $(docker ps -q)
minikube stop
sudo systemctl stop jenkins

# Tout redémarrer
sudo systemctl restart docker
minikube start
sudo systemctl restart jenkins

# Réinitialiser complètement
minikube delete && minikube start
sudo systemctl stop jenkins && sudo rm -rf /var/lib/jenkins/workspace/* && sudo systemctl start jenkins
```

## 📚 **Liens Utiles**

- **Docker Hub:** https://hub.docker.com/u/asaphkouokam
- **Repository Git:** https://github.com/Asaph-D/donlocal-api
- **Documentation Kubernetes:** https://kubernetes.io/docs/
- **Documentation Minikube:** https://minikube.sigs.k8s.io/docs/

---

**💡 Astuce:** Ajoutez ces commandes à votre `~/.bashrc` pour des alias pratiques :
```bash
alias k='kubectl'
alias kp='kubectl get pods'
alias kd='kubectl get deployments'
alias kl='kubectl logs -f'
alias kdesc='kubectl describe'
alias mks='minikube service --url'
alias dk='docker'
alias dkp='docker ps'
alias dkl='docker logs -f'
```

**🎯 Prochain déploiement:**
```bash
# Simple et efficace
git pull
docker pull asaphkouokam/donlocal-api:latest
kubectl set image deployment/donlocal-api donlocal-api=asaphkouokam/donlocal-api:latest
kubectl rollout status deployment/donlocal-api
```