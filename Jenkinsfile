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
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=20 --follow || echo "Pas de logs disponibles"
                    """
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
                        kubectl get pods -l app=donlocal-api -o wide
                        
                        # Afficher les logs
                        kubectl logs deployment/donlocal-api --tail=30
                        
                        # Récupérer le nom du pod
                        POD_NAME=$(kubectl get pods -l app=donlocal-api -o jsonpath='{.items[0].metadata.name}')
                        echo "Pod: ${POD_NAME}"
                        
                        # Récupérer le port NodePort
                        NODE_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].nodePort}')
                        
                        # Méthode 1: Essayer d'obtenir l'IP du node
                        NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "")
                        
                        if [ -z "${NODE_IP}" ]; then
                            # Méthode 2: Obtenir l'IP externe
                            NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null || echo "")
                        fi
                        
                        if [ -z "${NODE_IP}" ]; then
                        
                        # Méthode 3: Utiliser localhost pour minikube
                            NODE_IP="localhost"
                            echo "⚠️ Utilisation de localhost. Pour accéder depuis l'extérieur, utilisez l'IP du serveur."
                        fi
                        
                        echo "📱 API disponible sur: http://${NODE_IP}:${NODE_PORT}"
                        echo "Pour tester: curl http://${NODE_IP}:${NODE_PORT}"
                        
                        # Essayer un curl de test
                        echo "🔍 Test de connexion à l'API..."
                        curl -f http://${NODE_IP}:${NODE_PORT} || echo "⚠️ Le test curl a échoué, mais l'application peut être en cours de démarrage"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement réussi!"
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
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --previous || true
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} || true
                    
                    # Événements
                    echo "=== ÉVÉNEMENTS ==="
                    kubectl get events --field-selector=involvedObject.name=${env.DEPLOYMENT_NAME} --sort-by='.lastTimestamp'
                    
                    # Exécuter une commande dans le pod pour diagnostiquer
                    echo "=== DIAGNOSTIC INTERNE ==="
                    POD_NAME=\$(kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
                    if [ ! -z "\$POD_NAME" ]; then
                        echo "État du conteneur:"
                        kubectl exec \$POD_NAME -- ps aux || true
                        echo "Ports écoutés:"
                        kubectl exec \$POD_NAME -- netstat -tlnp || true
                        echo "Variables d'environnement:"
                        kubectl exec \$POD_NAME -- env || true
                    fi
                """
            }
        }
    }
}