```markdown
# Configuration du Master Kubernetes (Version Corrigée et Complète)

---

## ⚠️ Prérequis Obligatoire : Reset Complet
Ne pas sauter cette étape.

```bash
sudo kubeadm reset -f
sudo rm -rf \
  ~/.kube \
  /etc/cni \
  /var/lib/cni \
  /var/lib/kubelet \
  /etc/kubernetes
sudo systemctl restart containerd kubelet
```

---

## 1️⃣ Initialisation du Cluster avec la Bonne IP

### Commande corrigée :
```bash
sudo kubeadm init \
  --apiserver-advertise-address=192.168.142.61 \
  --pod-network-cidr=10.244.0.0/16
```

### Explications :
- **`--apiserver-advertise-address=192.168.142.61`** : IP actuelle de ta VM en mode bridge.
- **`--pod-network-cidr=10.244.0.0/16`** : Réseau interne pour les Pods, utilisé par Flannel.

---

## 2️⃣ Activation des Paramètres Réseau Obligatoires

### Commandes :
```bash
# Charger les modules kernel
sudo modprobe overlay
sudo modprobe br_netfilter

# Configurer les paramètres réseau
sudo tee /etc/sysctl.d/kubernetes.conf <<EOF
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF

# Appliquer les changements
sudo sysctl --system
```

### Vérification :
```bash
cat /proc/sys/net/ipv4/ip_forward
cat /proc/sys/net/bridge/bridge-nf-call-iptables
```
Les deux commandes doivent retourner `1`.

---

## 3️⃣ Configuration de `kubectl` pour l'Utilisateur `asaph`

### Commandes :
```bash
mkdir -p /home/asaph/.kube
sudo cp /etc/kubernetes/admin.conf /home/asaph/.kube/config
sudo chown asaph:asaph /home/asaph/.kube/config
```

### Vérification :
```bash
kubectl get nodes
```
Résultat attendu : `STATUS: NotReady` (normal avant l'installation de Flannel).

---

## 4️⃣ Configuration de `kubectl` pour Jenkins

### Commandes :
```bash
# Créer le répertoire .kube pour Jenkins
sudo mkdir -p /var/lib/jenkins/.kube

# Copier le fichier admin.conf mis à jour
sudo cp /etc/kubernetes/admin.conf /var/lib/jenkins/.kube/config

# Mettre à jour les permissions
sudo chown jenkins:jenkins /var/lib/jenkins/.kube/config
```

### Vérification :
```bash
sudo -u jenkins kubectl config view --minify
sudo -u jenkins kubectl cluster-info
sudo -u jenkins kubectl get nodes -o wide
```
Résultat attendu :
- `kubectl cluster-info` : Affiche l'URL du serveur avec la nouvelle adresse IP (`https://192.168.142.61:6443`).
- `kubectl get nodes -o wide` : Affiche le nœud avec le statut `Ready`.

---

## 5️⃣ Installation du Réseau Pod (Flannel)

### Commande :
```bash
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/v0.25.5/Documentation/kube-flannel.yml
```

### Vérification :
```bash
kubectl get pods -n kube-system -o wide
```
Résultat attendu :
- `kube-flannel-ds` : `Running`
- `coredns` : `Running`

---

## 6️⃣ Vérification Finale

### Commande :
```bash
kubectl get nodes -o wide
```
Résultat attendu :
- `INTERNAL-IP` : `192.168.142.61`
- `STATUS` : `Ready`

---

## 7️⃣ Génération du Token de Jointure

### Commande :
```bash
sudo kubeadm token create --print-join-command
```

---

## 🟢 Explications Clés

### 1️⃣ **`--pod-network-cidr=10.244.0.0/16`**
- **Rôle** : Réseau interne pour les Pods, géré par Flannel.
- **Visibilité** : Invisible depuis ta machine (`ip addr`), car il est virtuel et isolé.
- **Utilisation** : Chaque Pod reçoit une IP dans ce range (ex: `10.244.1.2`).

### 2️⃣ **Pourquoi ces corrections ?**
- **IP correcte** : `192.168.142.61` (bridge) au lieu de `192.168.171.128` (NAT).
- **Pas de `--ignore-preflight-errors=all`** : Masquerait les erreurs réseau critiques.
- **Reset complet** : Évite les conflits de certificats et d'IP.

### 3️⃣ **Topologie Réseau**
| Niveau | Réseau | Rôle |
|--------|--------|------|
| Physique | `192.168.142.0/24` | LAN / VMware Bridge |
| Pods | `10.244.0.0/16` | Communication interne Kubernetes |
| Services | `10.96.0.0/12` | ClusterIP / DNS |

---

## 🔧 Résolution des Problèmes de Certificats pour Jenkins
Si Jenkins rencontre des erreurs de certificat (`x509: certificate signed by unknown authority`), il faut recopier le fichier `admin.conf` mis à jour dans son répertoire `.kube`. Cela garantit que Jenkins utilise les bons certificats pour se connecter au cluster.

---