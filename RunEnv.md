# 🚀 Commandes pour faire fonctionner le pipeline

## 1. **Démarrer tous les services**
```bash
# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker

# Démarrer Minikube (Kubernetes)
minikube start --driver=docker

# Démarrer Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

## 2. **Vérifier que tout fonctionne**
```bash
# Vérifier Docker
docker ps
docker run hello-world

# Vérifier Kubernetes
kubectl get nodes
kubectl cluster-info

# Vérifier Jenkins
sudo systemctl status jenkins
# Accéder à: http://localhost:8080
```

## 3. **Créer le déploiement Kubernetes (une seule fois)**
```bash
# Créer le déploiement s'il n'existe pas
kubectl create deployment donlocal-api --image=asaphkouokam/donlocal-api:latest

# OU avec le fichier YAML
kubectl apply -f deployment.yml
```

## 4. **Commandes pour tester manuellement**
```bash
# Tester Docker Hub
docker pull asaphkouokam/donlocal-api:latest

# Tester Kubernetes
kubectl set image deployment/donlocal-api donlocal-api=asaphkouokam/donlocal-api:latest --dry-run=client

# Vérifier l'état actuel
kubectl get deployments
kubectl get pods
```

## 5. **Pipeline fonctionnel minimal**
```groovy
pipeline {
    agent any
    
    stages {
        stage('Deploy') {
            steps {
                script {
                    sh """
                        # Pull l'image
                        docker pull asaphkouokam/donlocal-api:latest
                        
                        # Déployer
                        kubectl set image deployment/donlocal-api donlocal-api=asaphkouokam/donlocal-api:latest --record
                        kubectl rollout status deployment/donlocal-api --timeout=300s
                    """
                }
            }
        }
    }
}
```

## 6. **Si problèmes de permissions**
```bash
# Donner les permissions à Jenkins
sudo usermod -aG docker jenkins
sudo usermod -aG docker $USER

# Donner l'accès kubectl à Jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# Redémarrer
sudo systemctl restart jenkins
```

## 7. **Commandes rapides de vérification**
```bash
# Tout vérifier en 30 secondes
docker ps && echo "---" && kubectl get pods && echo "---" && sudo systemctl is-active jenkins
```

## 8. **URLs d'accès**
```bash
# Jenkins
echo "Jenkins: http://localhost:8080"

# Minikube Dashboard
minikube dashboard --url

# Service API
minikube service donlocal-api --url
```

## 9. **Si le pipeline bloque**
```bash
# Annuler les builds en cours
# Via interface Jenkins ou:
sudo pkill -f "docker build"
sudo pkill -f "kubectl"

# Vider le workspace Jenkins
sudo rm -rf /var/lib/jenkins/workspace/deploy-donlocal/*
```

## 10. **Commandes essentielles résumées**
```bash
# 1. Démarrer tout
minikube start && sudo systemctl start jenkins

# 2. Tester
docker pull asaphkouokam/donlocal-api:latest
kubectl get deployments

# 3. Déployer manuellement (équivalent pipeline)
kubectl set image deployment/donlocal-api donlocal-api=asaphkouokam/donlocal-api:latest
kubectl rollout status deployment/donlocal-api

# 4. Vérifier
kubectl get pods
curl $(minikube service donlocal-api --url)
```

**🎯 Pour faire fonctionner le pipeline maintenant :**

1. **Exécutez ces 3 commandes :**
```bash
minikube start --driver=docker
sudo systemctl start jenkins
docker pull asaphkouokam/donlocal-api:latest
```

2. **Vérifiez avec :**
```bash
kubectl get deployments
```

3. **Lancez le pipeline dans Jenkins**

Le pipeline fera juste :
- `docker pull` (télécharge l'image)
- `kubectl set image` (met à jour le déploiement)
- `kubectl rollout status` (attend le déploiement)

je crois que la règle de detection de changement dans jenkins cause problème: le risque de déclencher le pipeline alors git n'a pas encore déploiyer l'image sur docker
je pense à la configuration des webhooks et l'utilisation de ngrok pour avoir le domaine de jenkins
