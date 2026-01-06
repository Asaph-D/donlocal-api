# Configuration d'un nouveau Worker Kubernetes

Remplacez `WORKER_IP`, `WORKER_USER` (ex: `ubuntu` ou `ansible`), et les chemins de clés au besoin.

## 1️⃣ Sur le nouveau worker (exécuté en root ou via sudo)

### Installer et activer SSH

```bash
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
```

### Créer l'utilisateur Ansible (si nécessaire)

```bash
sudo useradd -m -s /bin/bash ansible || true
```

### Préparer le dossier `.ssh` pour l'utilisateur Ansible

```bash
sudo mkdir -p /home/ansible/.ssh
sudo chmod 700 /home/ansible/.ssh
sudo touch /home/ansible/.ssh/authorized_keys
sudo chmod 600 /home/ansible/.ssh/authorized_keys
sudo chown -R ansible:ansible /home/ansible/.ssh
```

### Autoriser sudo sans mot de passe (optionnel)

```bash
echo "ansible ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ansible
sudo chmod 440 /etc/sudoers.d/ansible
```

### Ouvrir SSH au firewall (si ufw activé)

```bash
sudo ufw allow OpenSSH || true
```

---

## 2️⃣ Depuis le master ou Jenkins : ajouter les clés publiques

Vous devez ajouter les clés publiques du **master** et de **Jenkins** dans le fichier `/home/ansible/.ssh/authorized_keys` du worker.

### Option A : Utiliser `ssh-copy-id` (si accès SSH direct)

```bash
# Depuis le master
ssh-copy-id -i ~/.ssh/id_rsa.pub ansible@WORKER_IP

# Depuis la machine Jenkins (si différente)
ssh-copy-id -i /var/lib/jenkins/.ssh/id_rsa.pub ansible@WORKER_IP
```

### Option B : Coller manuellement les clés

1. **Récupérez les clés publiques** depuis le master et Jenkins :

```bash
# Sur le master
cat ~/.ssh/id_rsa.pub

# Sur Jenkins
sudo cat /var/lib/jenkins/.ssh/id_rsa.pub
```

2. **Ajoutez-les manuellement** sur le worker (en tant que root ou sudo) :

```bash
echo "ssh-rsa AAAA... master_key_here" | sudo tee -a /home/ansible/.ssh/authorized_keys
echo "ssh-rsa AAAA... jenkins_key_here" | sudo tee -a /home/ansible/.ssh/authorized_keys
sudo chown ansible:ansible /home/ansible/.ssh/authorized_keys
sudo chmod 600 /home/ansible/.ssh/authorized_keys
```

---

## 3️⃣ Mettre à jour `known_hosts` (optionnel)

Cela évite le prompt interactif lors du premier SSH.

### Sur le master

```bash
ssh-keyscan -H WORKER_IP >> ~/.ssh/known_hosts
```

### Sur la machine Jenkins

```bash
sudo -u jenkins ssh-keyscan -H WORKER_IP >> /var/lib/jenkins/.ssh/known_hosts
```

---

## 4️⃣ Tester la connexion SSH

### Depuis le master

```bash
ssh -o BatchMode=yes ansible@WORKER_IP 'hostname && id'
```

### Depuis Jenkins

```bash
sudo -u jenkins ssh -o BatchMode=yes ansible@WORKER_IP 'hostname && id'
```

---

## 5️⃣ Ajouter le worker à `ansible/inventory.ini`

Ouvrez `ansible/inventory.ini` et ajoutez une entrée sous le groupe `[workers]` :

```ini
[workers]
WORKER_IP ansible_user=ansible ansible_ssh_private_key_file=/home/youruser/.ssh/id_rsa
```

**Exemple concret** :

```ini
[workers]
192.168.171.50 ansible_user=ansible ansible_ssh_private_key_file=/root/.ssh/id_rsa
```

---

## 6️⃣ Intégrer le worker au cluster Kubernetes (optionnel)

Une fois l'IP ajoutée à `ansible/inventory.ini`, lancez le playbook de déploiement :

```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml -l workers --limit WORKER_IP
```

Cela exécutera les tâches de configuration Kubernetes sur le nouveau worker (installation kubelet, kubeadm, rejoindre le cluster, etc.).
