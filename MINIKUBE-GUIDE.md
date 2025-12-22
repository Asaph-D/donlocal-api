# Guide de Configuration DonLocal sur Minikube

## 📋 Prérequis

- Minikube installé et configuré
- kubectl installé
- Docker (pour construire les images)
- 2GB de RAM minimum pour Minikube
- 10GB d'espace disque disponible

## 🚀 Démarrage rapide

### 1. Démarrer Minikube

```bash
minikube start --memory=2048 --cpus=2
```

### 2. Vérifier le statut

```bash
minikube status
kubectl cluster-info
```

### 3. Déployer l'application

```bash
# Depuis la racine du projet
./deploy-minikube.sh
```

## 📦 Structure de la Configuration Kubernetes

### ConfigMap: `donlocal-config`
Contient les variables d'environnement de l'application:
- `NODE_ENV`: production
- `PORT`: 5000
- `DB_HOST`: postgres-service
- `DB_PORT`: 5432
- `DB_NAME`: donlocal
- `POSTGRES_URI`: URI de connexion PostgreSQL

### Secret: `donlocal-secrets`
Contient les données sensibles:
- `DB_PASSWORD`: 1234 (à changer en production)
- `JWT_SECRET`: À configurer en production

### PersistentVolumeClaim: `postgres-pvc`
- Stockage persistant pour PostgreSQL
- Taille: 1Gi (à augmenter en production)
- Mode: ReadWriteOnce

### Deployment: `postgres`
- Image: postgres:15
- Replicas: 1
- Montages: /var/lib/postgresql/data
- Probes de santé: livenessProbe et readinessProbe

### Deployment: `donlocal-api`
- Image: asaphkouokam/donlocal-api
- Replicas: 2 (rolling update)
- Variables d'environnement via ConfigMap et Secret
- Init container pour attendre PostgreSQL
- Probes de santé HTTP

### Services
- `postgres-service`: ClusterIP (interne)
- `donlocal-api`: NodePort 30080

### Ingress: `donlocal-ingress`
- Host: donlocal.local
- Route vers donlocal-api:5000

## 🔧 Configuration Détaillée

### Augmenter la Mémoire pour Minikube

```bash
minikube stop
minikube delete
minikube start --memory=4096 --cpus=4
```

### Activer l'Ingress Controller

```bash
minikube addons enable ingress
```

### Configurer donlocal.local dans /etc/hosts

```bash
sudo nano /etc/hosts

# Ajouter:
<MINIKUBE_IP> donlocal.local
```

Pour obtenir l'IP Minikube:
```bash
minikube ip
```

## 📝 Commandes Utiles

### Afficher les logs

```bash
# Logs de l'API
kubectl logs deployment/donlocal-api -f --timestamps=true

# Logs de PostgreSQL
kubectl logs deployment/postgres -f --timestamps=true

# Logs d'un pod spécifique
kubectl logs <pod-name> -f
```

### Accéder à la Base de Données

```bash
# Obtenir le nom du pod PostgreSQL
POSTGRES_POD=$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Lancer psql
kubectl exec -it $POSTGRES_POD -- psql -U postgres -d donlocal

# Exécuter une requête SQL
kubectl exec -it $POSTGRES_POD -- psql -U postgres -d donlocal -c "SELECT * FROM users;"
```

### Redémarrer les Déploiements

```bash
# Redémarrer l'API
kubectl rollout restart deployment/donlocal-api

# Redémarrer PostgreSQL
kubectl rollout restart deployment/postgres

# Attendre la fin du rollout
kubectl rollout status deployment/donlocal-api --timeout=300s
```

### Supprimer Tout

```bash
kubectl delete -f kubernetes-config.yaml
```

### Nettoyer Minikube Complètement

```bash
minikube stop
minikube delete
minikube start
```

## 🐛 Débogage

### Vérifier l'état des pods

```bash
kubectl get pods -o wide
kubectl describe pod <pod-name>
```

### Voir les événements du cluster

```bash
kubectl get events --sort-by='.lastTimestamp'
kubectl describe node
```

### Vérifier la connectivité PostgreSQL

```bash
# Depuis un pod dans le cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  sh -c "nc -zv postgres-service 5432"
```

### Exporter les logs

```bash
# Tous les logs
kubectl logs deployment/donlocal-api > api.log
kubectl logs deployment/postgres > postgres.log

# Avec timestamps
kubectl logs deployment/donlocal-api --timestamps=true > api-timestamped.log
```

## 📊 Monitoring

### Ouvrir le Dashboard Minikube

```bash
minikube dashboard
```

### Utiliser Kubernetes Dashboard

```bash
kubectl proxy
# Puis accéder à: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

## 🔐 Sécurité (Production)

1. **Changer le mot de passe PostgreSQL**
   - Modifier `DB_PASSWORD` dans le Secret
   - Régénérer les secrets Kubernetes

2. **Utiliser une image API spécifique**
   - Remplacer `asaphkouokam/donlocal-api:latest` par une version taguée
   - Utiliser `imagePullPolicy: IfNotPresent`

3. **Configurer les ressources**
   ```yaml
   resources:
     requests:
       memory: "512Mi"
       cpu: "500m"
     limits:
       memory: "1Gi"
       cpu: "1000m"
   ```

4. **Augmenter la persistance PostgreSQL**
   ```yaml
   resources:
     requests:
       storage: 10Gi
   ```

5. **Configurer RBAC (Role-Based Access Control)**
   - Créer des ServiceAccounts
   - Définir les permissions appropriées

## 📈 Métriques de Performance

### Utilisation des Ressources

```bash
kubectl top nodes
kubectl top pods
kubectl top pod <pod-name> --containers
```

## 🔄 CI/CD avec Jenkins

Le Jenkinsfile est configuré pour:
1. Checker le code
2. Appliquer la configuration Kubernetes
3. Attendre PostgreSQL
4. Déployer l'image Docker
5. Vérifier la santé

Voir le stage `stages` du Jenkinsfile pour plus de détails.

## 📞 Support et Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -i :5000
sudo kill -9 <PID>
```

### Image Docker non trouvée

```bash
# Construire l'image localement
docker build -t asaphkouokam/donlocal-api:latest .

# Ou la charger dans Minikube
minikube image load asaphkouokam/donlocal-api:latest
```

### Pods qui crashent

```bash
# Voir les logs précédents
kubectl logs <pod-name> --previous

# Voir l'état complet
kubectl get pod <pod-name> -o yaml
```

### Nettoyage de Minikube en cas de problème

```bash
minikube ssh
docker system prune -a
exit
minikube restart
```

## 📚 Ressources Supplémentaires

- [Documentation Minikube](https://minikube.sigs.k8s.io/)
- [Documentation Kubernetes](https://kubernetes.io/docs/)
- [PostgreSQL sur Kubernetes](https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/)
- [Ingress Controller](https://kubernetes.io/docs/concepts/services-networking/ingress/)
