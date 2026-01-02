# 🔍 Diagnostic des Problèmes de Communication

## ❌ Problèmes Identifiés

### 1. **Erreur de Syntaxe Ansible** (CORRIGÉ)
- **Fichier** : `03-k8s-join-workers.yml` ligne 20
- **Erreur** : `failed_msg` n'est pas une syntaxe valide dans Ansible
- **Solution** : Utiliser une tâche `fail` séparée (corrigé)

### 2. **Problème de Communication SSH** ⚠️

#### Symptômes observés :
```
ssh -i ~/.ssh/id_ed25519 ubuntu@192.168.56.10
kex_exchange_identification: read: Connection reset
```

#### Causes possibles :

**A. Adresses IP dynamiques (DHCP)**
- Les VMs obtiennent des IP différentes à chaque démarrage
- L'inventory Ansible utilise des IP fixes qui ne correspondent plus

**B. Problème de réseau entre hôte et VM**
- Le réseau NAT/VirtualBox peut avoir des problèmes
- Les règles de pare-feu bloquent les connexions
- Le service SSH n'est pas démarré sur la VM

**C. Configuration SSH incorrecte**
- La clé SSH n'est pas correctement copiée
- Le serveur SSH rejette la connexion
- Problème de configuration SSH sur la VM

## 🔧 Solutions

### Solution 1 : Configuration IP Statique (RECOMMANDÉ)

#### Sur la VM Master (Ubuntu) :

1. **Identifier l'interface réseau** :
```bash
ip addr show
# Notez le nom de l'interface (ex: enp0s3, eth0)
```

2. **Configurer une IP statique** :
```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

Ajoutez/modifiez :
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:  # Remplacez par votre interface
      dhcp4: no
      addresses:
        - 192.168.56.10/24  # IP fixe
      gateway4: 192.168.56.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

3. **Appliquer la configuration** :
```bash
sudo netplan apply
```

4. **Vérifier** :
```bash
ip addr show
# L'IP devrait être 192.168.56.10
```

### Solution 2 : Utiliser le nom d'hôte au lieu de l'IP

#### Modifier l'inventory.ini :

```ini
[master]
# Utiliser le nom d'hôte si configuré dans /etc/hosts
vm-master ansible_host=vm-master.local ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519

[workers]
# Utiliser le nom d'hôte
vm-worker1 ansible_host=vm-worker1.local ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

#### Sur la machine hôte (Windows), ajouter dans `C:\Windows\System32\drivers\etc\hosts` :
```
192.168.56.10  vm-master
192.168.56.11  vm-worker1
```

### Solution 3 : Vérifier la Connectivité SSH

#### Étape 1 : Vérifier que SSH fonctionne sur la VM

Sur la VM :
```bash
sudo systemctl status ssh
sudo systemctl start ssh
sudo systemctl enable ssh
```

#### Étape 2 : Vérifier depuis la machine hôte

```bash
# Test de connexion basique
ping 192.168.56.10

# Test SSH avec verbose pour voir l'erreur
ssh -vvv -i ~/.ssh/id_ed25519 ubuntu@192.168.56.10
```

#### Étape 3 : Copier la clé SSH correctement

```bash
# Depuis la machine hôte (Windows)
ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@192.168.56.10

# Si ça ne fonctionne pas, copier manuellement :
type ~/.ssh/id_ed25519.pub | ssh ubuntu@192.168.56.10 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Solution 4 : Configuration VirtualBox Network

#### Option A : Réseau NAT avec port forwarding

1. Dans VirtualBox : Settings → Network
2. Adapter 1 : NAT
3. Advanced → Port Forwarding
4. Ajouter :
   - Name: SSH
   - Protocol: TCP
   - Host IP: 127.0.0.1
   - Host Port: 2222
   - Guest IP: (vide)
   - Guest Port: 22

5. Se connecter via :
```bash
ssh -p 2222 -i ~/.ssh/id_ed25519 ubuntu@127.0.0.1
```

#### Option B : Réseau Host-Only (RECOMMANDÉ pour cluster)

1. Dans VirtualBox : File → Host Network Manager
2. Créer un réseau Host-Only (ex: vboxnet0)
3. Configurer l'IP : 192.168.56.1
4. Dans les settings de la VM : Network → Adapter 2 → Host-Only Adapter
5. Sur la VM, configurer une IP statique dans le réseau 192.168.56.x

### Solution 5 : Désactiver le Pare-feu (temporaire pour test)

Sur la VM :
```bash
sudo ufw disable  # Temporaire, pour tester
# Ou ouvrir le port SSH :
sudo ufw allow 22/tcp
```

## 🧪 Tests de Connectivité

### Test 1 : Ping
```bash
ping 192.168.56.10
```

### Test 2 : Test SSH avec Ansible
```bash
cd ansible
ansible all -i inventory.ini -m ping
```

### Test 3 : Test SSH manuel
```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@192.168.56.10
```

### Test 4 : Vérifier les ports Kubernetes
```bash
# Depuis la machine hôte
telnet 192.168.56.10 6443  # API server
telnet 192.168.56.10 10250 # Kubelet
```

## 📝 Configuration Recommandée pour Inventory

Une fois l'IP statique configurée, mettez à jour `inventory.ini` :

```ini
[master]
vm-master ansible_host=192.168.56.10 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519

[workers]
vm-worker1 ansible_host=192.168.56.11 ansible_user=ubuntu ansible_port=22 ansible_ssh_private_key_file=~/.ssh/id_ed25519
```

## ⚠️ Points Importants

1. **IP Statique** : Essentiel pour un cluster Kubernetes stable
2. **SSH sans mot de passe** : Requis pour Ansible
3. **Ports ouverts** : Les ports Kubernetes doivent être accessibles entre master et workers
4. **Réseau stable** : Éviter les changements d'IP pendant le déploiement

## 🔄 Prochaines Étapes

1. ✅ Corriger l'erreur de syntaxe (FAIT)
2. ⏳ Configurer une IP statique sur la VM master
3. ⏳ Tester la connexion SSH
4. ⏳ Mettre à jour l'inventory.ini avec la bonne IP
5. ⏳ Tester avec `ansible all -i inventory.ini -m ping`
6. ⏳ Relancer le déploiement Jenkins


