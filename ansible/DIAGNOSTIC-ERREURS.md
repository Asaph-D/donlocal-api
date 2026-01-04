# 🔍 Diagnostic des Erreurs Actuelles

## ❌ Problème 1 : Sudo demande un mot de passe sur localhost

**Erreur** :
```
fatal: [localhost]: FAILED! => {"ansible_facts": {}, "changed": false, "failed_modules": {"ansible.legacy.setup": {"failed": true, "module_stderr": "sudo: il est nécessaire de saisir un mot de passe\n"
```

**Raison** :
- Le playbook `01-prerequisites.yml` s'exécute sur `all` (donc localhost aussi)
- Il utilise `become: yes` (sudo) mais l'utilisateur `asaph` n'a pas configuré sudo NOPASSWD
- Ansible ne peut pas exécuter les commandes sudo sans mot de passe

**Solutions** :

### Solution A : Configurer sudo NOPASSWD (RECOMMANDÉ)

Sur la VM (localhost), exécutez :
```bash
sudo visudo
```

Ajoutez cette ligne à la fin :
```
asaph ALL=(ALL) NOPASSWD: ALL
```

### Solution B : Exclure localhost des prérequis (si tout est déjà installé)

Modifier `01-prerequisites.yml` pour exclure localhost si Jenkins a déjà tout installé.

---

## ❌ Problème 2 : Worker 172.20.216.6 inaccessible

**Erreur** :
```
fatal: [172.20.216.6]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: kex_exchange_identification: read: Connection reset by peer\r\nConnection reset by 172.20.216.6 port 22", "unreachable": true}
```

**Raison** :
- L'IP `172.20.216.6` est une adresse WSL qui n'est pas accessible depuis Jenkins
- Cette IP change probablement à chaque démarrage de WSL
- Le worker n'est pas nécessaire pour un déploiement simple

**Solutions** :

### Solution A : Retirer le worker de l'inventory (RECOMMANDÉ pour début)

Si vous n'avez qu'une seule machine (la VM), commentez le worker dans `inventory.ini`.

### Solution B : Configurer correctement WSL (si nécessaire)

Si vous voulez vraiment utiliser WSL comme worker, il faut :
1. Configurer une IP statique dans WSL
2. Configurer le port forwarding
3. Vérifier la connectivité SSH

---

## ❌ Problème 3 : Configuration réseau

**Situation actuelle** :
- Windows : VMware VMnet8 = 192.168.171.1
- VM : ens33 = 192.168.171.128 (dynamique, vous venez de configurer statique)

**Action requise** :
1. Appliquer la configuration netplan sur la VM
2. Mettre à jour l'inventory.ini avec l'IP statique de la VM

---

## ✅ Actions Immédiates

1. **Configurer sudo NOPASSWD sur la VM** :
   ```bash
   sudo visudo
   # Ajouter: asaph ALL=(ALL) NOPASSWD: ALL
   ```

2. **Appliquer la configuration réseau sur la VM** :
   ```bash
   sudo netplan apply
   ip addr show  # Vérifier que l'IP est bien statique
   ```

3. **Mettre à jour inventory.ini** :
   - Utiliser l'IP statique de la VM (192.168.171.128 ou celle que vous avez configurée)
   - Retirer ou commenter le worker 172.20.216.6 si non nécessaire

4. **Tester la connexion** :
   ```bash
   ansible all -i inventory.ini -m ping
   ```




