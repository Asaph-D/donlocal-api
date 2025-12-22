# Configuration Kubernetes et Jenkins pour DonLocal

## 📋 Fichiers Modifiés/Créés

### 1. **kubernetes-config.yaml** ✨ NOUVEAU
Configuration complète Kubernetes avec:
- ConfigMap pour les variables d'environnement
- Secret pour les données sensibles (DB_PASSWORD, JWT_SECRET)
- PersistentVolumeClaim pour la persistance PostgreSQL
- Deployment PostgreSQL 15 avec health checks
- Deployment DonLocal API avec 2 replicas et rolling updates
- Services (ClusterIP pour PostgreSQL, NodePort pour API)
- Ingress pour l'accès externe

### 2. **Jenkinsfile** 🔄 MODIFIÉ
Mise à jour avec:
- Stage "Apply Kubernetes Configuration" - applique kubernetes-config.yaml
- Stage "Wait for PostgreSQL" - attend que PostgreSQL soit prêt
- Stage "Initialize Database" - prépare la BD (futur)
- Meilleur débogage avec logs détaillés
- Informations de connexion post-déploiement
- Gestion améliorée des erreurs

### 3. **deploy-minikube.sh** ✨ NOUVEAU
Script d'automatisation pour Minikube:
- Vérifie Minikube et kubectl
- Applique la configuration Kubernetes
- Attend PostgreSQL et l'API
- Affiche l'état des pods et services
- Affiche les informations de connexion
- Couleurs et messages clairs

### 4. **MINIKUBE-GUIDE.md** 🔄 MODIFIÉ
Guide complet avec:
- Prérequis et démarrage rapide
- Configuration détaillée de Kubernetes
- Commandes utiles
- Débogage et troubleshooting
- Recommandations de sécurité
- Monitoring avec dashboard

### 5. **src/server.js** 🔄 MODIFIÉ
Ajout de:
- Route `/api/health` pour les health checks Kubernetes
- Compatible avec livenessProbe et readinessProbe

### 6. **src/DBInitializer.js** (Créé précédemment)
Initialisation de la BD avec:
- Définition des relations Sequelize
- Catégories, utilisateurs, ressources, messages par défaut
- Sécurisation des données sensibles

## 🚀 Flux de Déploiement

```
┌─────────────────────────────────────────────────────────┐
│ 1. Démarrer Minikube                                    │
│    minikube start --memory=2048 --cpus=2               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Exécuter le script de déploiement                    │
│    ./deploy-minikube.sh                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Appliquer kubernetes-config.yaml                     │
│    - ConfigMap                                          │
│    - Secret                                             │
│    - PersistentVolumeClaim                              │
│    - Deployment PostgreSQL                              │
│    - Deployment API                                     │
│    - Services                                           │
│    - Ingress                                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Attendre que PostgreSQL soit prêt                    │
│    - Init container vérifie pg_isready                  │
│    - Readiness probe check                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. API démarre avec health checks                       │
│    - Liveness probe: /api/health toutes les 10s        │
│    - Readiness probe: /api/health toutes les 5s        │
└─────────────────────────────────────────────────────────┘
```

## 📊 Architecture Kubernetes

```
Minikube Cluster
├── Namespace: default
│   ├── ConfigMap: donlocal-config
│   ├── Secret: donlocal-secrets
│   ├── PersistentVolumeClaim: postgres-pvc
│   ├── Deployment: postgres
│   │   ├── Service: postgres-service (ClusterIP:5432)
│   │   └── Pod: postgres-xxx
│   ├── Deployment: donlocal-api
│   │   ├── Pod: donlocal-api-xxx (Replica 1)
│   │   └── Pod: donlocal-api-xxx (Replica 2)
│   ├── Service: donlocal-api (NodePort:30080)
│   └── Ingress: donlocal-ingress → donlocal.local
└── Namespace: kube-system (CoreDNS, etc.)
```

## 🔌 Connectivité

```
Client
  ↓
  └─→ Minikube IP:30080 (NodePort)
        ↓
        Kubernetes Service: donlocal-api
        ↓
        Pods: donlocal-api (x2)
        ↓
        postgres-service:5432
        ↓
        PostgreSQL Pod
        ↓
        Persistent Volume (1Gi)
```

## 📝 Configuration de Base de Données

### Variables d'Environnement
```
DB_HOST=postgres-service
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234 (from Secret)
DB_NAME=donlocal
POSTGRES_URI=postgres://postgres:1234@postgres-service:5432/donlocal
```

### Données Initiales
- 5 Utilisateurs de démonstration
- 8 Catégories (Dons, Services, Échanges, Aide, etc.)
- 8 Ressources d'exemple
- 5 Messages de démonstration

## 🔐 Secrets Gérés

```yaml
Secret: donlocal-secrets
├── DB_PASSWORD: 1234
└── JWT_SECRET: À configurer
```

**À faire en production:**
- Générer un JWT_SECRET fort
- Changer le mot de passe PostgreSQL
- Utiliser un gestionnaire de secrets (HashiCorp Vault, AWS Secrets Manager)

## 🎯 Points d'Accès

### En Développement Local
- API: `http://localhost:<NodePort>`
- PostgreSQL: `localhost:5432`

### Via Minikube
- API: `http://<MINIKUBE_IP>:30080`
- PostgreSQL: `<MINIKUBE_IP>:5432`

### Via Ingress (si configuré)
- API: `http://donlocal.local`
- (Nécessite la configuration de /etc/hosts)

## 🧪 Tests de Santé

### Health Check Endpoint
```bash
curl http://<MINIKUBE_IP>:30080/api/health
```

Réponse attendue:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-12-22T12:00:00.000Z"
}
```

### PostgreSQL Check
```bash
kubectl exec -it <postgres-pod> -- psql -U postgres -d donlocal -c "SELECT 1"
```

## 📈 Scaling et Performance

### Augmenter les Replicas API
```bash
kubectl scale deployment donlocal-api --replicas=3
```

### Augmenter la Mémoire Minikube
```bash
minikube stop
minikube delete
minikube start --memory=4096 --cpus=4
```

### Augmenter le Stockage PostgreSQL
Modifier le `kubernetes-config.yaml`:
```yaml
storage: 10Gi  # Augmenter de 1Gi
```

## 🛠️ CI/CD avec Jenkins

### Pipeline Complet
1. **Checkout** - Clone le repo
2. **Apply Kubernetes Config** - Applique kubernetes-config.yaml
3. **Wait for PostgreSQL** - Vérifie que PostgreSQL est prêt
4. **Initialize Database** - Prépare la BD
5. **Ensure Deployment** - Crée le déploiement
6. **Docker Pull** - Récupère l'image Docker
7. **Deploy** - Déploie avec rolling update
8. **Health Check** - Vérifie la santé de l'application

### Post-Actions
- **Succès**: Affiche les informations de connexion
- **Échec**: Affiche les logs de débogage complets

## ✅ Checklist de Déploiement

- [ ] Minikube est démarré
- [ ] kubectl est configuré
- [ ] `kubernetes-config.yaml` est en place
- [ ] `deploy-minikube.sh` est exécutable
- [ ] `.env` contient les bons identifiants
- [ ] DBInitializer.js est prêt
- [ ] Route `/api/health` est disponible
- [ ] Jenkins est configuré avec le nouveau Jenkinsfile

## 🚀 Commandes Rapides

```bash
# Déployer
./deploy-minikube.sh

# Voir les logs
kubectl logs deployment/donlocal-api -f

# Accéder à PostgreSQL
kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -d donlocal

# Redémarrer
kubectl rollout restart deployment/donlocal-api

# Nettoyer
kubectl delete -f kubernetes-config.yaml
```

## 📞 Support

Pour les problèmes, consultez:
1. [MINIKUBE-GUIDE.md](MINIKUBE-GUIDE.md) - Guide détaillé
2. Logs avec `kubectl logs deployment/<name> -f`
3. Events avec `kubectl get events --sort-by='.lastTimestamp'`
