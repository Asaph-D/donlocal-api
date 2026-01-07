# Configuration CORS pour les Requêtes OPTIONS (Preflight)

## 🔍 Problème Identifié

Le navigateur envoie automatiquement une requête **OPTIONS** (preflight) avant chaque requête cross-origin pour vérifier les permissions CORS. Si le backend ne répond pas correctement à cette requête OPTIONS, la requête principale échoue avec "Failed to load response".

## ✅ Solution Implémentée

### 1. Configuration CORS Complète

La configuration CORS a été améliorée dans `server.js` pour :

- ✅ Gérer explicitement les requêtes OPTIONS
- ✅ Autoriser les méthodes HTTP nécessaires (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- ✅ Autoriser les headers requis (Content-Type, Authorization, etc.)
- ✅ Configurer le cache preflight (24 heures)
- ✅ Exclure les requêtes OPTIONS du rate limiting

### 2. Ordre des Middlewares

**IMPORTANT** : L'ordre des middlewares est crucial :

```javascript
// 1. CORS EN PREMIER
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Helmet (avec configuration pour ne pas bloquer CORS)
app.use(helmet({...}));

// 3. Autres middlewares
app.use(express.json());
app.use(rateLimit({ skip: (req) => req.method === 'OPTIONS' }));
```

### 3. Configuration CORS Détaillée

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:4200',
      'http://localhost:3000',
      'http://192.168.142.61:4200',
      'http://192.168.142.61:3000'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  maxAge: 86400, // Cache preflight 24h
  optionsSuccessStatus: 204 // Réponse 204 pour OPTIONS
};
```

## 🧪 Test de la Configuration

### Test 1 : Vérifier que OPTIONS fonctionne

```bash
curl -X OPTIONS http://192.168.142.61:30631/api/resources \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Réponse attendue** :
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, ...
Access-Control-Max-Age: 86400
```

### Test 2 : Requête réelle après OPTIONS

```bash
curl -X GET http://192.168.142.61:30631/api/resources \
  -H "Origin: http://localhost:4200" \
  -H "Content-Type: application/json" \
  -v
```

## 🔧 Dépannage

### Problème : "Failed to load response"

**Causes possibles** :
1. ❌ CORS pas configuré correctement
2. ❌ Requêtes OPTIONS bloquées par Helmet
3. ❌ Rate limiter bloque les requêtes OPTIONS
4. ❌ Headers non autorisés

**Solutions** :
1. ✅ Vérifier que CORS est configuré AVANT Helmet
2. ✅ Vérifier que `app.options('*', cors(corsOptions))` est présent
3. ✅ Exclure OPTIONS du rate limiting
4. ✅ Vérifier les headers autorisés

### Problème : "CORS policy blocked"

**Solution** : Ajouter l'origine du frontend dans `allowedOrigins`

### Problème : OPTIONS retourne 404

**Solution** : S'assurer que `app.options('*', cors(corsOptions))` est avant les routes

## 📝 Checklist

- [x] CORS configuré avec toutes les méthodes nécessaires
- [x] Requêtes OPTIONS gérées explicitement
- [x] Headers autorisés correctement
- [x] Rate limiting exclut OPTIONS
- [x] Helmet configuré pour ne pas bloquer CORS
- [x] Ordre des middlewares correct (CORS avant tout)
- [x] Cache preflight configuré (24h)

## 🎯 Résultat

Avec cette configuration :
- ✅ Les requêtes OPTIONS (preflight) sont correctement gérées
- ✅ Le navigateur reçoit une réponse 204 No Content
- ✅ Les requêtes réelles (GET, POST, etc.) peuvent être envoyées
- ✅ Plus d'erreur "Failed to load response"

