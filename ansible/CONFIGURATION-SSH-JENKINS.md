# Configuration SSH pour Jenkins

## ⚠️ Situation Actuelle

Vous essayez de configurer SSH vers `172.20.216.6` (WSL worker), mais :
1. **Ce worker n'est pas nécessaire** pour un déploiement simple
2. L'IP WSL change à chaque démarrage
3. Vous ne connaissez pas le mot de passe root

## ✅ Solution : Retirer le Worker et Configurer la VM Master

### Option 1 : Déploiement Simple (RECOMMANDÉ pour débuter)

Pour un déploiement sur une seule machine (la VM), vous n'avez **pas besoin de workers**.

#### Étape 1 : Mettre à jour inventory.ini

Modifiez `inventory.ini` pour retirer le worker :

```ini
[master]
# Si Jenkins s'exécute sur la VM, utilisez localhost
localhost ansible_connection=local ansible_user=asaph

# OU si Jenkins s'exécute sur Windows et se connecte à la VM :
# vm-master ansible_host=192.168.171.128 ansible_user=asaph ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519

[workers]
# Pas de workers pour l'instant - commenté
# 172.20.216.6 ansible_user=root ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

#### Étape 2 : Configurer sudo NOPASSWD sur la VM

Sur la VM, exécutez :
```bash
sudo visudo
```

Ajoutez cette ligne à la fin :
```
asaph ALL=(ALL) NOPASSWD: ALL
```

Sauvegardez (Ctrl+X, Y, Entrée).

#### Étape 3 : Tester

```bash
cd ansible
ansible all -i inventory.ini -m ping
```

### Option 2 : Si Vous Voulez Vraiment Utiliser le Worker WSL

#### Trouver le mot de passe root de WSL

Si vous utilisez WSL2, le mot de passe root peut être :

1. **Le mot de passe que vous avez défini** lors de la configuration WSL
2. **Réinitialiser le mot de passe root** dans WSL :

```bash
# Dans WSL
sudo passwd root
```

3. **Ou utiliser votre utilisateur WSL** au lieu de root :

Dans `inventory.ini`, changez :
```ini
[workers]
172.20.216.6 ansible_user=VOTRE_USER_WSL ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

#### Configurer SSH dans WSL

Dans WSL, installez et démarrez SSH :

```bash
# Dans WSL
sudo apt update
sudo apt install openssh-server
sudo systemctl start ssh
sudo systemctl enable ssh
```

#### Copier la clé SSH

Depuis la VM (Jenkins) :

```bash
# Utiliser votre utilisateur WSL au lieu de root
sudo -u jenkins ssh-copy-id -i /var/lib/jenkins/.ssh/id_ed25519.pub VOTRE_USER_WSL@172.20.216.6
```

**Mais attention** : L'IP WSL change à chaque démarrage ! Il faudra :
1. Configurer une IP statique dans WSL
2. Ou utiliser le nom d'hôte WSL

## 🎯 Recommandation

**Pour l'instant, ignorez le worker WSL** et concentrez-vous sur :

1. ✅ Configurer l'IP statique sur la VM (fait)
2. ✅ Configurer sudo NOPASSWD sur la VM
3. ✅ Retirer le worker de l'inventory
4. ✅ Tester le déploiement sur la VM seule

Une fois que le déploiement fonctionne sur la VM, vous pourrez ajouter des workers plus tard.

## 📝 Configuration Recommandée pour inventory.ini

```ini
[master]
# Si Jenkins s'exécute sur la VM
localhost ansible_connection=local ansible_user=asaph

# Variables spécifiques au master
[master:vars]
kubeconfig_path=/etc/kubernetes/admin.conf

# Pas de workers pour l'instant
[workers]
# Commenté - pas de workers pour l'instant
# worker1 ansible_host=192.168.171.129 ansible_user=asaph ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519

[workers:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'

[k8s_cluster:children]
master
# workers  # Décommentez quand vous ajouterez des workers

[k8s_cluster:vars]
k8s_version=1.28
pod_network_cidr=10.244.0.0/16
```

## 🔍 Vérification

Après avoir retiré le worker et configuré sudo NOPASSWD :

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
```

Pas d'erreur concernant le worker inaccessible.



