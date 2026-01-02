# Configuration du Worker WSL

## 📋 Situation

Le déploiement se fait sur le master (la VM), et vous voulez ajouter un worker WSL (`172.20.216.6`).

## ⚠️ Problèmes à Résoudre

### 1. Mot de passe root inconnu

Le worker WSL nécessite le mot de passe root pour `ssh-copy-id`.

### 2. IP WSL changeante

L'IP `172.20.216.6` peut changer à chaque démarrage de WSL.

## ✅ Solutions

### Solution 1 : Configurer le mot de passe root dans WSL

Dans WSL, exécutez :

```bash
# Dans WSL
sudo passwd root
```

Entrez un nouveau mot de passe root (notez-le quelque part).

### Solution 2 : Utiliser votre utilisateur WSL au lieu de root

**Option A : Modifier inventory.ini pour utiliser votre utilisateur WSL**

Dans `inventory.ini`, remplacez :
```ini
[workers]
172.20.216.6 ansible_user=VOTRE_USER_WSL ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

**Option B : Configurer sudo NOPASSWD dans WSL**

Dans WSL :
```bash
sudo visudo
```

Ajoutez :
```
VOTRE_USER_WSL ALL=(ALL) NOPASSWD: ALL
```

### Solution 3 : Copier la clé SSH

Depuis la VM (où Jenkins s'exécute) :

```bash
# Si vous utilisez root
sudo -u jenkins ssh-copy-id -i /var/lib/jenkins/.ssh/id_ed25519.pub root@172.20.216.6

# OU si vous utilisez votre utilisateur WSL
sudo -u jenkins ssh-copy-id -i /var/lib/jenkins/.ssh/id_ed25519.pub VOTRE_USER_WSL@172.20.216.6
```

### Solution 4 : Configurer une IP statique dans WSL (RECOMMANDÉ)

L'IP WSL change à chaque démarrage. Pour la fixer :

#### Dans WSL, créez/modifiez `/etc/netplan/50-wsl.yaml` :

```bash
sudo nano /etc/netplan/50-wsl.yaml
```

Ajoutez :
```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 172.20.216.6/20  # IP statique souhaitée
      routes:
        - to: default
          via: 172.20.0.1  # Passerelle WSL (généralement .1)
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

Appliquez :
```bash
sudo netplan apply
```

**Note** : Si le fichier n'existe pas, créez-le. WSL utilise parfois une configuration différente.

#### Alternative : Utiliser le nom d'hôte WSL

Si l'IP change, vous pouvez utiliser le nom d'hôte WSL dans l'inventory :

```ini
[workers]
wsl-worker ansible_host=wsl-hostname.local ansible_user=root ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

Puis ajoutez dans `/etc/hosts` de la VM :
```
172.20.216.6  wsl-hostname.local
```

## 🧪 Tests

### Test 1 : Vérifier la connectivité SSH

Depuis la VM :
```bash
sudo -u jenkins ssh -i /var/lib/jenkins/.ssh/id_ed25519 root@172.20.216.6
# OU
sudo -u jenkins ssh -i /var/lib/jenkins/.ssh/id_ed25519 VOTRE_USER_WSL@172.20.216.6
```

### Test 2 : Tester avec Ansible

```bash
cd ansible
ansible all -i inventory.ini -m ping
```

Vous devriez voir :
```
localhost | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
172.20.216.6 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
```

## 📝 Checklist

- [ ] Mot de passe root configuré dans WSL OU utilisateur WSL configuré
- [ ] Clé SSH copiée vers le worker WSL
- [ ] IP statique configurée dans WSL (recommandé)
- [ ] Test SSH réussi
- [ ] Test Ansible ping réussi
- [ ] Worker ajouté dans inventory.ini

## 🔧 Dépannage

### Si la connexion SSH échoue

1. Vérifiez que SSH est installé et démarré dans WSL :
   ```bash
   # Dans WSL
   sudo apt install openssh-server
   sudo systemctl start ssh
   sudo systemctl enable ssh
   ```

2. Vérifiez le pare-feu Windows :
   - Autorisez le port 22 dans le pare-feu Windows

3. Vérifiez que l'IP est correcte :
   ```bash
   # Dans WSL
   hostname -I
   ```

### Si l'IP change toujours

1. Vérifiez la configuration netplan dans WSL
2. Utilisez le nom d'hôte au lieu de l'IP
3. Ou configurez un script pour mettre à jour l'inventory automatiquement

## 🎯 Configuration Recommandée

Pour un déploiement stable :

1. **IP statique dans WSL** : Configurez une IP fixe
2. **Utilisateur avec sudo NOPASSWD** : Plus sécurisé que root
3. **Clé SSH** : Accès sans mot de passe
4. **Test avant déploiement** : Vérifiez avec `ansible ping`

Une fois tout configuré, le worker rejoindra automatiquement le cluster lors du déploiement.

