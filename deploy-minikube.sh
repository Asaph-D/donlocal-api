#!/bin/bash

# Script de déploiement complet pour DonLocal sur Minikube
# Usage: ./deploy-minikube.sh

set -e

echo "🚀 Déploiement de DonLocal sur Minikube"
echo "========================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que Minikube est en cours d'exécution
echo ""
echo -e "${YELLOW}⏳ Vérification de Minikube...${NC}"
if ! minikube status | grep -q "host: Running"; then
    echo -e "${RED}❌ Minikube n'est pas en cours d'exécution${NC}"
    echo "Démarrez-le avec: minikube start"
    exit 1
fi
echo -e "${GREEN}✅ Minikube est en cours d'exécution${NC}"

# Obtenir l'IP de Minikube
MINIKUBE_IP=$(minikube ip)
echo "Minikube IP: $MINIKUBE_IP"

# Vérifier que kubectl est disponible
echo ""
echo -e "${YELLOW}⏳ Vérification de kubectl...${NC}"
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ kubectl est disponible${NC}"

# Créer le namespace par défaut si nécessaire
echo ""
echo -e "${YELLOW}⏳ Vérification du namespace...${NC}"
kubectl get namespace default > /dev/null 2>&1 || kubectl create namespace default
echo -e "${GREEN}✅ Namespace 'default' vérifié${NC}"

# Appliquer la configuration Kubernetes
echo ""
echo -e "${YELLOW}⏳ Application de la configuration Kubernetes...${NC}"
if [ -f "kubernetes-config.yaml" ]; then
    kubectl apply -f kubernetes-config.yaml
    echo -e "${GREEN}✅ Configuration appliquée${NC}"
else
    echo -e "${RED}❌ Fichier kubernetes-config.yaml non trouvé${NC}"
    exit 1
fi

# Attendre que PostgreSQL soit prêt
echo ""
echo -e "${YELLOW}⏳ Attente de PostgreSQL...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n default || {
    echo -e "${RED}❌ PostgreSQL n'est pas prêt après 5 minutes${NC}"
    echo ""
    echo "Logs PostgreSQL:"
    kubectl logs -l app=postgres
    exit 1
}
echo -e "${GREEN}✅ PostgreSQL est prêt${NC}"

# Vérifier que PostgreSQL est vraiment fonctionnel
echo ""
echo -e "${YELLOW}⏳ Vérification de la connexion PostgreSQL...${NC}"
POSTGRES_POD=$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POSTGRES_POD -- bash -c 'for i in {1..30}; do pg_isready -U postgres && break || sleep 2; done' > /dev/null 2>&1
echo -e "${GREEN}✅ PostgreSQL est fonctionnel${NC}"

# Attendre que l'API soit déployée
echo ""
echo -e "${YELLOW}⏳ Attente du déploiement de l'API...${NC}"
kubectl rollout status deployment/donlocal-api -n default --timeout=300s || {
    echo -e "${YELLOW}⚠️ L'API n'est pas prête après 5 minutes${NC}"
    echo ""
    echo "Logs de l'API:"
    kubectl logs deployment/donlocal-api --tail=50
}

# Afficher l'état des pods
echo ""
echo -e "${YELLOW}📊 État des pods:${NC}"
kubectl get pods -o wide

# Afficher les services
echo ""
echo -e "${YELLOW}📊 Services:${NC}"
kubectl get services

# Obtenir les ports
echo ""
API_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].nodePort}')

# Afficher les informations de connexion
echo ""
echo -e "${GREEN}🎉 Déploiement terminé!${NC}"
echo ""
echo "========== INFORMATIONS DE CONNEXION =========="
echo ""
echo -e "${GREEN}API DonLocal:${NC}"
echo "  URL: http://$MINIKUBE_IP:$API_PORT"
echo "  Commande test: curl http://$MINIKUBE_IP:$API_PORT/api/resources"
echo ""
echo -e "${GREEN}PostgreSQL:${NC}"
echo "  Host: $MINIKUBE_IP"
echo "  Port: 5432"
echo "  User: postgres"
echo "  Password: 1234"
echo "  Database: donlocal"
echo "  URI: postgres://postgres:1234@$MINIKUBE_IP:5432/donlocal"
echo ""
echo -e "${GREEN}Accès à Minikube Dashboard:${NC}"
echo "  Commande: minikube dashboard"
echo ""
echo "========== COMMANDES UTILES =========="
echo ""
echo "Voir les logs de l'API:"
echo "  kubectl logs deployment/donlocal-api -f"
echo ""
echo "Voir les logs de PostgreSQL:"
echo "  kubectl logs deployment/postgres -f"
echo ""
echo "Se connecter à PostgreSQL:"
echo "  kubectl exec -it \$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -d donlocal"
echo ""
echo "Relancer les pods:"
echo "  kubectl rollout restart deployment/donlocal-api"
echo "  kubectl rollout restart deployment/postgres"
echo ""
echo "Supprimer tous les déploiements:"
echo "  kubectl delete -f kubernetes-config.yaml"
echo ""
