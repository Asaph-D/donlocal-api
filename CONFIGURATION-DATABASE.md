# Configuration PostgreSQL - Résolution des Erreurs

## ❌ Erreur : "client password must be a string"

### Cause
Le mot de passe PostgreSQL est `undefined` au lieu d'une chaîne de caractères. Sequelize exige que le mot de passe soit toujours une chaîne, même si c'est une chaîne vide.

### Solution

#### 1. Créer un fichier `.env` à la racine du projet

```bash
cd donlocal-api
cp .env.example .env
```

#### 2. Configurer les variables d'environnement

Éditez le fichier `.env` et configurez :

```env
# Configuration PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=donlocal
DB_USER=postgres
DB_PASSWORD=1234
```

**Important** : 
- Si votre PostgreSQL n'a pas de mot de passe, utilisez `DB_PASSWORD=`
- Le mot de passe doit être une chaîne, jamais `undefined`

#### 3. Vérifier que le fichier `.env` est chargé

Le fichier `server.js` doit avoir en première ligne :
```javascript
require('dotenv').config();
```

#### 4. Vérifier les variables d'environnement

Testez si les variables sont chargées :

```bash
node -e "require('dotenv').config(); console.log('DB_PASSWORD:', typeof process.env.DB_PASSWORD, process.env.DB_PASSWORD)"
```

Vous devriez voir :
```
DB_PASSWORD: string 1234
```

Si vous voyez `undefined`, le fichier `.env` n'est pas chargé correctement.

## 🔧 Corrections Apportées

### 1. Configuration database.js

**Avant** :
```javascript
password: process.env.DB_PASSWORD || undefined, // ❌ Problème
```

**Après** :
```javascript
password: process.env.DB_PASSWORD || '', // ✅ Chaîne vide par défaut
```

### 2. Amélioration de la gestion d'erreurs

- Messages d'erreur plus clairs
- Affichage des variables manquantes
- Ne pas quitter en développement pour faciliter le debug

## 📝 Checklist de Configuration

- [ ] Fichier `.env` créé à la racine de `donlocal-api/`
- [ ] Variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` définies
- [ ] `DB_PASSWORD` est une chaîne (même vide : `DB_PASSWORD=`)
- [ ] PostgreSQL est démarré et accessible
- [ ] La base de données `donlocal` existe
- [ ] L'utilisateur `postgres` a les permissions nécessaires

## 🧪 Test de Connexion

### Test 1 : Vérifier que PostgreSQL est accessible

```bash
psql -h localhost -U postgres -d donlocal
```

### Test 2 : Vérifier les variables d'environnement

```bash
cd donlocal-api
node -e "require('dotenv').config(); console.log(process.env.DB_PASSWORD)"
```

### Test 3 : Tester la connexion depuis Node.js

```bash
node -e "
require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'donlocal',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});
sequelize.authenticate().then(() => console.log('✅ Connecté')).catch(e => console.error('❌', e.message));
"
```

## 🐛 Dépannage

### Erreur : "password authentication failed"

**Solution** : Vérifier le mot de passe dans `.env`

### Erreur : "database donlocal does not exist"

**Solution** : Créer la base de données :
```sql
CREATE DATABASE donlocal;
```

### Erreur : "connection refused"

**Solution** : 
1. Vérifier que PostgreSQL est démarré
2. Vérifier `DB_HOST` et `DB_PORT`
3. Vérifier le pare-feu

### Les variables d'environnement ne sont pas chargées

**Solutions** :
1. Vérifier que `.env` est à la racine de `donlocal-api/`
2. Vérifier que `require('dotenv').config()` est en première ligne de `server.js`
3. Redémarrer le serveur après modification de `.env`

## ✅ Après Correction

Une fois corrigé, vous devriez voir :
```
🚀 Serveur démarré sur le port 5000
✅ PostgreSQL Connected successfully
📊 Database: donlocal
🏠 Host: localhost:5432
```

