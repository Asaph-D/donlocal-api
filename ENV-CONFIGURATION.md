# Configuration d'Environnement pour DonLocal API

## 📋 Variables d'Environnement

### Développement Local (.env)
```bash
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database (PostgreSQL)
POSTGRES_URI=postgres://postgres:1234@localhost:5432/donlocal
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=donlocal

# JWT
JWT_SECRET=your_development_jwt_secret_key

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email Service (optionnel)
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Client Configuration
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production (Kubernetes)
Les variables sont définie dans `kubernetes-config.yaml`:

**ConfigMap: `donlocal-config`**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: donlocal-config
data:
  NODE_ENV: "production"
  PORT: "5000"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_USER: "postgres"
  DB_NAME: "donlocal"
  POSTGRES_URI: "postgres://postgres:1234@postgres-service:5432/donlocal"
  CLIENT_URL: "http://yourdomain.com"
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
```

**Secret: `donlocal-secrets`**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: donlocal-secrets
type: Opaque
stringData:
  DB_PASSWORD: "strong_password_here"
  JWT_SECRET: "strong_jwt_secret_here"
  CLOUDINARY_API_KEY: "your_key"
  CLOUDINARY_API_SECRET: "your_secret"
```

## 🔐 Sécurité en Production

### 1. Régénérer les Secrets

```bash
# Générer un JWT_SECRET fort
openssl rand -base64 32

# Générer un mot de passe PostgreSQL fort
openssl rand -base64 16

# Mettre à jour le Secret Kubernetes
kubectl create secret generic donlocal-secrets \
  --from-literal=DB_PASSWORD='<strong_password>' \
  --from-literal=JWT_SECRET='<strong_jwt_secret>' \
  -n default \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

### 2. Configurer Cloudinary

```bash
# S'inscrire sur https://cloudinary.com
# Obtenir les credentials
# Ajouter au Secret

kubectl patch secret donlocal-secrets \
  -p "{\"data\": {\"CLOUDINARY_API_KEY\": \"$(echo -n '<key>' | base64)\"}}"
```

### 3. Configurer le Service Email

```bash
# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Ou utiliser Sendgrid, Mailgun, etc.
```

## 🐘 Configuration PostgreSQL

### Minikube (Développement)
```
POSTGRES_URI=postgres://postgres:1234@postgres-service:5432/donlocal
DB_HOST=postgres-service
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
```

### Production avec Service Managé (AWS RDS)
```
POSTGRES_URI=postgres://user:pass@mydb.xxxxx.us-east-1.rds.amazonaws.com:5432/donlocal
DB_HOST=mydb.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=<strong_password>
```

### Production avec Kubernetes et Statefulset
Voir la documentation pour un déploiement PostgreSQL en HA

## 🚀 Fichier .env pour Docker

```bash
# .env.docker
NODE_ENV=production
PORT=5000
API_URL=http://donlocal.com

POSTGRES_URI=postgres://postgres:password@db:5432/donlocal
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=donlocal

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://donlocal.com

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Matrice d'Environnement

| Variable | Dev Local | Minikube | Production |
|----------|-----------|----------|------------|
| NODE_ENV | development | production | production |
| PORT | 5000 | 5000 | 5000 |
| DB_HOST | localhost | postgres-service | RDS Endpoint |
| DB_PASSWORD | 1234 | 1234 | Strong Hash |
| JWT_SECRET | dev-key | dev-key | Strong Random |
| CLIENT_URL | localhost:3000 | <MINIKUBE_IP> | yourdomain.com |
| CLOUDINARY_* | empty | empty | configured |
| EMAIL_* | empty | empty | configured |

## 🔧 Commandes de Configuration

### Mise à Jour du ConfigMap
```bash
kubectl create configmap donlocal-config \
  --from-literal=NODE_ENV=production \
  --from-literal=DB_HOST=postgres-service \
  --from-literal=PORT=5000 \
  -n default \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

### Mise à Jour du Secret
```bash
kubectl create secret generic donlocal-secrets \
  --from-literal=DB_PASSWORD='<password>' \
  --from-literal=JWT_SECRET='<secret>' \
  -n default \
  --dry-run=client \
  -o yaml | kubectl apply -f -
```

### Voir les Valeurs Actuelles
```bash
# ConfigMap
kubectl get configmap donlocal-config -o yaml

# Secret (masqué en base64)
kubectl get secret donlocal-secrets -o yaml

# Décoder un secret
kubectl get secret donlocal-secrets -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

## 📝 Checklist de Mise en Production

- [ ] Changer le mot de passe PostgreSQL (au minimum 16 caractères)
- [ ] Générer un JWT_SECRET fort
- [ ] Configurer Cloudinary pour les uploads
- [ ] Configurer le service email
- [ ] Augmenter la limite de stockage PostgreSQL (>= 10Gi)
- [ ] Configurer les resource limits et requests
- [ ] Activer HTTPS/TLS avec cert-manager
- [ ] Configurer un backup automatique PostgreSQL
- [ ] Mettre en place la monitoring (Prometheus, Grafana)
- [ ] Configurer les logs centralisés (ELK, CloudWatch)
- [ ] Tester le failover de PostgreSQL
- [ ] Configurer l'autoscaling de l'API
- [ ] Mettre en place les tests de charge
- [ ] Documenter les procedures de récupération
- [ ] Configurer les alertes

## 🔄 Rotation des Secrets

### Tous les 90 jours
1. Générer un nouveau JWT_SECRET
2. Déployer avec l'ancienne clé pendant 24h
3. Générer un nouveau token avec la nouvelle clé
4. Retirer l'ancienne clé

### Renouvellement du Mot de Passe PostgreSQL
1. Créer un nouvel utilisateur PostgreSQL
2. Copier les privilèges
3. Mettre à jour le Secret Kubernetes
4. Tester la connexion
5. Supprimer l'ancien utilisateur

## 📚 Ressources Supplémentaires

- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://owasp.org/www-community/attacks/Secrets_management)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)