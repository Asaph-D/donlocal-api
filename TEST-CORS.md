# Tests CORS - Vérification des Requêtes OPTIONS

## 🧪 Tests à Effectuer

### Test 1 : Requête OPTIONS (Preflight)

```bash
curl -X OPTIONS http://192.168.142.61:30631/api/resources \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Réponse attendue** :
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Test 2 : Requête GET après OPTIONS

```bash
curl -X GET http://192.168.142.61:30631/api/resources \
  -H "Origin: http://localhost:4200" \
  -H "Content-Type: application/json" \
  -v
```

**Réponse attendue** :
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
Content-Type: application/json

{
  "success": true,
  "count": 8,
  "data": [...]
}
```

### Test 3 : Requête POST avec Authorization

```bash
curl -X POST http://192.168.142.61:30631/api/resources \
  -H "Origin: http://localhost:4200" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test","description":"..."}' \
  -v
```

## 🔍 Vérification dans le Navigateur

### Chrome DevTools

1. Ouvrir DevTools (F12)
2. Onglet Network
3. Filtrer par "XHR" ou "Fetch"
4. Faire une requête depuis le frontend
5. Vérifier :
   - Une requête OPTIONS apparaît d'abord (status 204)
   - Puis la requête réelle (GET, POST, etc.) avec status 200

### Erreurs CORS Communes

#### Erreur : "Access to fetch at ... has been blocked by CORS policy"
**Cause** : Origine non autorisée
**Solution** : Ajouter l'origine dans `allowedOrigins`

#### Erreur : "Method OPTIONS is not allowed"
**Cause** : OPTIONS non géré
**Solution** : Vérifier que `app.options('*', cors(corsOptions))` est présent

#### Erreur : "Request header field Authorization is not allowed"
**Cause** : Header non autorisé
**Solution** : Ajouter 'Authorization' dans `allowedHeaders`

## ✅ Checklist de Vérification

- [ ] Requête OPTIONS retourne 204 No Content
- [ ] Headers CORS présents dans la réponse OPTIONS
- [ ] Requête réelle (GET, POST) fonctionne après OPTIONS
- [ ] Headers Authorization acceptés
- [ ] Credentials autorisés (si nécessaire)
- [ ] Pas d'erreur "Failed to load response" dans le navigateur

## 🐛 Dépannage

### Le backend ne répond pas aux OPTIONS

1. Vérifier que CORS est configuré AVANT les routes
2. Vérifier que `app.options('*', cors(corsOptions))` est présent
3. Vérifier les logs du serveur pour voir si la requête arrive

### Les headers CORS ne sont pas dans la réponse

1. Vérifier l'ordre des middlewares (CORS avant Helmet)
2. Vérifier que Helmet ne bloque pas CORS
3. Vérifier la configuration `corsOptions`

### Rate limiting bloque OPTIONS

1. Vérifier que `skip: (req) => req.method === 'OPTIONS'` est dans le limiter
2. Tester sans rate limiting pour confirmer

