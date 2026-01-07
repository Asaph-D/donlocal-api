# Correction des Variables d'Environnement pour Kubernetes

## 🔍 Problème Identifié

Le code Node.js cherchait les variables `DB_*` (DB_HOST, DB_PASSWORD, etc.) mais le template Kubernetes définissait seulement `POSTGRES_*` (POSTGRES_PASSWORD, etc.), causant des erreurs de connexion PostgreSQL.

## ✅ Solution Implémentée

### 1. Support des Deux Formats de Variables

Le code supporte maintenant **les deux formats** :
- **Format DB_*** : `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (développement local)
- **Format POSTGRES_*** : `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (Kubernetes)

**Priorité** : `DB_*` > `POSTGRES_*` > valeurs par défaut

### 2. Détection Automatique de Kubernetes

Le code détecte automatiquement si on est dans Kubernetes :
- Ne charge pas le fichier `.env` en Kubernetes
- Utilise les variables injectées par Kubernetes
- Affiche des logs de debug appropriés

### 3. Template Kubernetes Mis à Jour

Le template `backend.yml.j2` définit maintenant **les deux formats** pour garantir la compatibilité :

```yaml
env:
  # Variables DB_* (utilisées par le code Node.js)
  - name: DB_HOST
    value: "{{ DB_HOST | default('postgres') }}"
  - name: DB_PASSWORD
    value: "{{ DB_PASSWORD | default(postgres_password | default('1234')) }}"
  # Variables POSTGRES_* (compatibilité)
  - name: POSTGRES_PASSWORD
    value: "{{ postgres_password | default('1234') }}"
```

## 📝 Variables d'Environnement

### Développement Local (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=donlocal
DB_USER=postgres
DB_PASSWORD=1234
```

### Kubernetes (via Ansible)

Les variables sont définies dans `group_vars/all.yml` ou passées comme extra-vars :

```yaml
DB_HOST: postgres
DB_PORT: 5432
DB_NAME: donlocal
DB_USER: postgres
DB_PASSWORD: "1234"  # ou depuis un Secret
```

## 🔧 Utilisation avec Secrets Kubernetes

Pour utiliser des Secrets Kubernetes au lieu de valeurs en clair :

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: password
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: password
```

## ✅ Vérification

Après déploiement, vérifiez les logs :

```bash
kubectl logs deployment/donlocal-api -c api | grep "Configuration DB"
```

Vous devriez voir :
```
🔍 Configuration DB:
   Host: postgres
   Port: 5432
   Database: donlocal
   User: postgres
   Password: ***
   Source: POSTGRES_PASSWORD (ou DB_PASSWORD)
```

## 🐛 Dépannage

### Erreur : "client password must be a string"

**Cause** : Variable `DB_PASSWORD` ou `POSTGRES_PASSWORD` non définie ou `undefined`

**Solution** :
1. Vérifier que les variables sont définies dans le Deployment :
   ```bash
   kubectl get deployment donlocal-api -o yaml | grep -A 20 env:
   ```

2. Vérifier les valeurs :
   ```bash
   kubectl exec deployment/donlocal-api -c api -- env | grep -E "DB_|POSTGRES_"
   ```

3. Si nécessaire, mettre à jour le Deployment :
   ```bash
   kubectl set env deployment/donlocal-api DB_PASSWORD=1234 POSTGRES_PASSWORD=1234
   ```

### Les pods sont en CrashLoopBackOff

1. Vérifier les logs :
   ```bash
   kubectl logs deployment/donlocal-api -c api --tail=100
   ```

2. Vérifier que PostgreSQL est accessible :
   ```bash
   kubectl get pods -l app=postgres
   ```

3. Vérifier les variables d'environnement dans le pod :
   ```bash
   kubectl exec deployment/donlocal-api -c api -- printenv | grep -E "DB_|POSTGRES_"
   ```

## 📊 Résultat

Avec ces corrections :
- ✅ Le code fonctionne en développement local (avec `.env`)
- ✅ Le code fonctionne dans Kubernetes (avec variables injectées)
- ✅ Support des deux formats de variables pour compatibilité
- ✅ Détection automatique de l'environnement
- ✅ Messages d'erreur plus clairs

