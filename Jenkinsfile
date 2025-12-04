pipeline {
    agent any

    environment {
        DOCKER_USER = "asaphkouokam"
        IMAGE_REPO = "donlocal-api"
        DEPLOYMENT_NAME = "donlocal-api"
        KUBE_NAMESPACE = "default"
        SERVICE_PORT = "5000"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                
                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:${env.IMAGE_TAG}"
                    
                    echo "📦 Commit: ${env.IMAGE_TAG}"
                    echo "🐳 Image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Ensure Deployment Exists') {
            steps {
                script {
                    echo "🔧 Vérification/Création du déploiement..."
                    
                    sh """
                        # Créer ou mettre à jour le déploiement avec le port
                        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${env.DEPLOYMENT_NAME}
  labels:
    app: ${env.DEPLOYMENT_NAME}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${env.DEPLOYMENT_NAME}
  template:
    metadata:
      labels:
        app: ${env.DEPLOYMENT_NAME}
    spec:
      containers:
      - name: ${env.DEPLOYMENT_NAME}
        image: ${env.DOCKER_USER}/${env.IMAGE_REPO}:latest
        ports:
        - containerPort: ${env.SERVICE_PORT.toInteger()}
        imagePullPolicy: Always
EOF

                        # Créer le service si nécessaire
                        if ! kubectl get service ${env.DEPLOYMENT_NAME} >/dev/null 2>&1; then
                            kubectl expose deployment ${env.DEPLOYMENT_NAME} --type=NodePort --port=${env.SERVICE_PORT}
                        fi
                    """
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "⬇️ Pull de l'image: ${env.IMAGE_NAME}"
                    
                    def status = sh(script: "docker pull ${env.IMAGE_NAME}", returnStatus: true)
                    
                    if (status != 0) {
                        echo "🔁 Tag non trouvé, utilisation de 'latest'"
                        env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:latest"
                        sh "docker pull ${env.IMAGE_NAME}"
                    } else {
                        echo "✅ Image pull réussie: ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Déploiement avec l'image: ${env.IMAGE_NAME}"
                    
                    sh """
                        # Mettre à jour l'image
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE}
                        
                        # Attendre avec plus de patience (l'application Express met du temps à démarrer)
                        sleep 10
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=180s
                        
                        # Vérifier les logs
                        echo "=== Logs de l'application ==="
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=20 || echo "Pas de logs disponibles"
                    """
                }
            }
        }

        stage('Setup Ingress') {
            steps {
                script {
                    echo '🌐 Configuration Ingress...'
                    sh '''
                        # Activer ingress sur minikube si pas déjà fait
                        minikube addons enable ingress -p donlocal 2>/dev/null || echo "Ingress déjà activé ou erreur"
                        
                        # Attendre que l'ingress controller soit prêt
                        sleep 15
                        
                        # Vérifier si le service expose le port 80
                        if ! kubectl get service ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[?(@.port==80)].port}' &>/dev/null; then
                            echo "⚠️ Le service n'expose pas le port 80, création d'un service web..."
                            cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: donlocal-api-web
spec:
  selector:
    app: donlocal-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: ${env.SERVICE_PORT}
  type: ClusterIP
EOF
                            SERVICE_NAME="donlocal-api-web"
                        else
                            SERVICE_NAME="${env.DEPLOYMENT_NAME}"
                        fi
                        
                        # Appliquer l'ingress
                        cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: donlocal-api-ingress
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${SERVICE_NAME}
            port:
              number: 80
EOF
                        
                        # Obtenir l'IP de l'ingress
                        echo "Attente de l'assignation de l'IP (peut prendre 1-2 minutes)..."
                        sleep 30
                        
                        MAX_RETRIES=10
                        INGRESS_IP=""
                        
                        for i in \$(seq 1 \$MAX_RETRIES); do
                            INGRESS_IP=\$(kubectl get ingress donlocal-api-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
                            if [ ! -z "\$INGRESS_IP" ]; then
                                break
                            fi
                            echo "Tentative \$i/\$MAX_RETRIES: IP non assignée..."
                            sleep 10
                        done
                        
                        if [ -z "\$INGRESS_IP" ]; then
                            # Pour minikube, utiliser l'IP du minikube
                            INGRESS_IP=\$(minikube ip -p donlocal 2>/dev/null || echo "")
                            if [ -z "\$INGRESS_IP" ]; then
                                INGRESS_IP="localhost"
                                echo "⚠️ Utilisation de localhost pour minikube"
                            fi
                        fi
                        
                        echo "================================================"
                        echo "🌐 ACCÈS VIA INGRESS :"
                        echo "================================================"
                        echo "URL: http://\${INGRESS_IP}"
                        echo "Test: curl -f http://\${INGRESS_IP} || echo 'Test échoué - application peut être en cours de démarrage'"
                        echo "================================================"
                    '''
                }
            }
        }

        stage('Check Application Health') {
            steps {
                script {
                    echo '🏥 Vérification de la santé de l\'application...'
                    sh '''
                        sleep 30
                        
                        # Vérifier le statut du pod
                        kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o wide
                        
                        # Afficher les logs récents
                        echo "=== Logs récents ==="
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=30
                        
                        # Vérifier si l'application est en cours d'exécution
                        echo "=== Vérification de l'application ==="
                        POD_NAME=$(kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
                        
                        if [ ! -z "$POD_NAME" ]; then
                            echo "Pod: $POD_NAME"
                            
                            # Vérifier si le conteneur est prêt
                            READY=$(kubectl get pod $POD_NAME -o jsonpath='{.status.containerStatuses[0].ready}')
                            echo "Conteneur prêt: $READY"
                            
                            if [ "$READY" = "true" ]; then
                                # Tester l'application à l'intérieur du pod
                                echo "Test interne de l'application..."
                                kubectl exec $POD_NAME -- sh -c "curl -s http://localhost:${env.SERVICE_PORT} || echo 'Application non accessible depuis l\'intérieur'" || true
                            fi
                        fi
                        
                        # Récupérer le port NodePort
                        NODE_PORT=$(kubectl get service ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")
                        
                        if [ ! -z "$NODE_PORT" ]; then
                            # Méthode 1: Essayer d'obtenir l'IP du node
                            NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "")
                            
                            if [ -z "$NODE_IP" ]; then
                                # Méthode 2: Utiliser localhost
                                NODE_IP="localhost"
                            fi
                            
                            echo "📱 API disponible sur NodePort: http://\${NODE_IP}:\${NODE_PORT}"
                            echo "Pour tester: curl http://\${NODE_IP}:\${NODE_PORT}"
                        fi
                        
                        # Afficher les services pour vérification
                        echo "=== Services ==="
                        kubectl get svc -l app=${env.DEPLOYMENT_NAME}
                        
                        # Afficher l'ingress
                        echo "=== Ingress ==="
                        kubectl get ingress donlocal-api-ingress 2>/dev/null || echo "Ingress non trouvé"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement réussi!"
            
            script {
                sh '''
                    # Afficher les informations d'accès finales
                    echo "================================================"
                    echo "📊 INFORMATIONS D'ACCÈS FINALES"
                    echo "================================================"
                    
                    # Ingress
                    INGRESS_IP=$(kubectl get ingress donlocal-api-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
                    if [ -z "$INGRESS_IP" ]; then
                        INGRESS_IP=$(minikube ip -p donlocal 2>/dev/null || echo "localhost")
                    fi
                    echo "Ingress URL: http://$INGRESS_IP"
                    
                    # NodePort
                    NODE_PORT=$(kubectl get service ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "N/A")
                    NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")
                    echo "NodePort URL: http://$NODE_IP:$NODE_PORT"
                    
                    # ClusterIP interne
                    CLUSTER_IP=$(kubectl get service ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "N/A")
                    echo "ClusterIP interne: $CLUSTER_IP:${env.SERVICE_PORT}"
                    
                    # Port-forward option
                    echo ""
                    echo "Pour un accès local via port-forward:"
                    echo "kubectl port-forward service/${env.DEPLOYMENT_NAME} 8080:${env.SERVICE_PORT}"
                    echo "Puis accédez à: http://localhost:8080"
                    
                    echo "================================================"
                '''
            }
        }
        failure {
            echo "💥 Déploiement échoué"
            
            script {
                sh """
                    echo "=== DÉBOGAGE DÉTAILLÉ ==="
                    
                    # Décrire le pod
                    kubectl describe pods -l app=${env.DEPLOYMENT_NAME}
                    
                    # Logs détaillés
                    echo "=== LOGS COMPLETS ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=100 || true
                    
                    # Vérifier les conteneurs précédents
                    echo "=== LOGS CONTENEURS PRÉCÉDENTS ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --previous --tail=50 2>/dev/null || echo "Pas de conteneurs précédents"
                    
                    # Événements
                    echo "=== ÉVÉNEMENTS RÉCENTS ==="
                    kubectl get events --field-selector=involvedObject.name=${env.DEPLOYMENT_NAME} --sort-by='.lastTimestamp' --tail=20
                    
                    # Exécuter une commande dans le pod pour diagnostiquer
                    echo "=== DIAGNOSTIC INTERNE ==="
                    POD_NAME=\$(kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
                    if [ ! -z "\$POD_NAME" ]; then
                        echo "Décrire le pod:"
                        kubectl describe pod \$POD_NAME
                        
                        echo "État du pod:"
                        kubectl get pod \$POD_NAME -o jsonpath='{.status.phase}{" - "}{.status.containerStatuses[0].state}{" - ready:"}{.status.containerStatuses[0].ready}'
                        
                        echo "Ports dans le pod:"
                        kubectl get pod \$POD_NAME -o jsonpath='{.spec.containers[0].ports[0].containerPort}' || echo "Ports non définis"
                    fi
                    
                    echo "=== CONFIGURATION DE L'APPLICATION ==="
                    echo "IMAGE: ${env.IMAGE_NAME}"
                    echo "PORT: ${env.SERVICE_PORT}"
                    echo "DÉPLOIEMENT: ${env.DEPLOYMENT_NAME}"
                """
            }
        }
    }
}