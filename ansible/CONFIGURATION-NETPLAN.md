# Configuration Netplan pour IP Statique

## ⚠️ Problèmes Détectés

1. **Permissions trop ouvertes** : Le fichier netplan doit avoir des permissions restrictives
2. **Syntaxe dépréciée** : `gateway4` est déprécié, utiliser `routes` à la place
3. **IP toujours dynamique** : L'IP doit être configurée comme statique

## ✅ Solution Complète

### Étape 1 : Vérifier le contenu actuel du fichier

```bash
sudo cat /etc/netplan/01-netcfg.yaml
```

### Étape 2 : Éditer le fichier avec la syntaxe moderne

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

### Étape 3 : Configuration correcte

Remplacez le contenu par (adaptez selon votre interface et IP) :

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens33:  # Remplacez par votre interface (vérifiez avec: ip addr show)
      dhcp4: no
      addresses:
        - 192.168.171.128/24  # IP statique souhaitée
      routes:
        - to: default
          via: 192.168.171.1  # Passerelle (généralement .1 dans le réseau)
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

**Important** :
- Remplacez `ens33` par votre interface réseau (vérifiez avec `ip addr show`)
- Remplacez `192.168.171.128` par l'IP statique que vous voulez
- Remplacez `192.168.171.1` par votre passerelle (généralement l'IP de votre hôte Windows sur VMnet8)

### Étape 4 : Corriger les permissions

```bash
sudo chmod 600 /etc/netplan/01-netcfg.yaml
```

### Étape 5 : Valider la configuration

```bash
sudo netplan try
```

Cela vous donnera 120 secondes pour tester. Si tout fonctionne, appuyez sur Entrée pour confirmer.

### Étape 6 : Appliquer la configuration

```bash
sudo netplan apply
```

### Étape 7 : Vérifier

```bash
ip addr show ens33
```

Vous devriez voir :
```
inet 192.168.171.128/24 ... scope global noprefixroute ens33
```

**Note** : Il ne devrait plus y avoir "dynamic" dans la ligne.

### Étape 8 : Vérifier la connectivité

```bash
ping 192.168.171.1  # Ping vers la passerelle
ping 8.8.8.8        # Ping vers Internet
```

## 🔧 Dépannage

### Si l'IP est toujours dynamique

1. Vérifiez que `dhcp4: no` est bien présent
2. Vérifiez que l'interface est correcte (`ens33` dans votre cas)
3. Redémarrez le service réseau :
   ```bash
   sudo systemctl restart systemd-networkd
   ```

### Si la connexion Internet ne fonctionne pas

1. Vérifiez la passerelle :
   ```bash
   ip route show
   ```
   Vous devriez voir une route par défaut vers `192.168.171.1`

2. Vérifiez les DNS :
   ```bash
   cat /etc/resolv.conf
   ```

### Si systemd-networkd n'est pas en cours d'exécution

```bash
sudo systemctl enable systemd-networkd
sudo systemctl start systemd-networkd
sudo systemctl status systemd-networkd
```

## 📝 Exemple Complet

Basé sur votre configuration actuelle :

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    ens33:
      dhcp4: no
      addresses:
        - 192.168.171.128/24
      routes:
        - to: default
          via: 192.168.171.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

Puis :
```bash
sudo chmod 600 /etc/netplan/01-netcfg.yaml
sudo netplan try
# Attendre 120 secondes, tester la connexion, puis appuyer sur Entrée
# OU directement :
sudo netplan apply
```

