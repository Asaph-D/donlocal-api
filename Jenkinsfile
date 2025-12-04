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
                    env.COMMIT_HASH = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    // Utiliser uniquement 'latest' pour éviter le problème de tag
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:latest"
                    
                    echo "📦 Commit: ${env.COMMIT_HASH}"
                    echo "🐳 Image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Ensure Deployment Exists') {
            steps {
                script {
                    echo "🔧 Vérification/Création du déploiement..."
                    
                    // Créer ou mettre à jour le déploiement
                    sh """
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
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: donlocal-db-secret
              key: database-url
        imagePullPolicy: Always
EOF
                    """
                    
                    // Créer le service s'il n'existe pas
                    sh """
                        if ! kubectl get service ${env.DEPLOYMENT_NAME} >/dev/null 2>&1; then
                            kubectl expose deployment ${env.DEPLOYMENT_NAME} \\
                                --type=NodePort \\
                                --port=${env.SERVICE_PORT} \\
                                --target-port=${env.SERVICE_PORT}
                        fi
                    """
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "⬇️ Pull de l'image: ${env.IMAGE_NAME}"
                    sh "docker pull ${env.IMAGE_NAME} || echo '⚠️ Image non trouvée, le déploiement utilisera l\'image existante'"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Déploiement avec l'image: ${env.IMAGE_NAME}"
                    
                    sh """
                        # Mettre à jour l'image du déploiement
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} \\
                            ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} \\
                            -n ${env.KUBE_NAMESPACE}
                        
                        # Attendre le rollout
                        sleep 15
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} \\
                            -n ${env.KUBE_NAMESPACE} \\
                            --timeout=300s
                        
                        # Vérifier les logs
                        echo "=== Logs de démarrage ==="
                        sleep 10  # Donner du temps à l'application de démarrer
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=50 || echo "Pas encore de logs"
                    """
                }
            }
        }

        stage('Setup Simple Access') {
            steps {
                script {
                    echo '🔗 Configuration d\'accès simple...'
                    
                    sh """
                        # Créer un service sur le port 80 pour l'ingress
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
                        
                        # Créer un ingress simple
                        cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: donlocal-api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: donlocal-api-web
            port:
              number: 80
EOF
                        
                        # Attendre un peu
                        sleep 20
                        
                        # Afficher les informations d'accès
                        echo "================================================"
                        echo "🌐 INFORMATIONS D'ACCÈS"
                        echo "================================================"
                        
                        # 1. Port-forward simple
                        echo "1. Accès Port-Forward (immédiat):"
                        echo "   kubectl port-forward svc/donlocal-api-web 8080:80"
                        echo "   URL: http://localhost:8080"
                        echo ""
                        
                        # 2. NodePort
                        NODE_PORT=\$(kubectl get svc ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "N/A")
                        if [ "\$NODE_PORT" != "N/A" ]; then
                            echo "2. Accès NodePort:"
                            echo "   Port: \$NODE_PORT"
                            echo "   URL: http://<IP-DU-SERVEUR>:\$NODE_PORT"
                            echo ""
                        fi
                        
                        # 3. Ingress
                        echo "3. Ingress (si configuré):"
                        kubectl get ingress donlocal-api-ingress 2>/dev/null || echo "   Ingress en cours de configuration..."
                        echo ""
                        
                        echo "================================================"
                    """
                }
            }
        }

        stage('Check Application Health') {
            steps {
                script {
                    echo '🏥 Vérification de la santé de l\'application...'
                    
                    sh """
                        # Attendre que l'application démarre
                        echo "⏳ Attente du démarrage de l'application..."
                        sleep 45
                        
                        # Vérifier le statut du pod
                        echo "=== Statut des Pods ==="
                        kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o wide
                        
                        # Vérifier si le pod est en CrashLoopBackOff
                        POD_STATUS=\$(kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o jsonpath='{.items[0].status.containerStatuses[0].state.waiting.reason}' 2>/dev/null || echo "")
                        
                        if [ "\$POD_STATUS" = "CrashLoopBackOff" ]; then
                            echo "❌ L'application est en CrashLoopBackOff"
                            echo "=== Logs d'erreur ==="
                            kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=100
                            echo ""
                            echo "🔍 Problème probable : Configuration de la base de données"
                            echo "   Vérifiez votre fichier src/config/database.js"
                            echo "   Assurez-vous que DATABASE_URL est défini"
                            exit 1
                        fi
                        
                        # Vérifier les logs
                        echo "=== Logs récents ==="
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=30 || echo "Pas encore de logs"
                        
                        # Tester l'application
                        echo "=== Test de l'application ==="
                        POD_NAME=\$(kubectl get pods -l app=${env.DEPLOYMENT_NAME} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
                        
                        if [ ! -z "\$POD_NAME" ]; then
                            echo "Test interne sur le pod: \$POD_NAME"
                            kubectl exec \$POD_NAME -- sh -c "timeout 10 curl -s http://localhost:${env.SERVICE_PORT} || echo 'Application non encore prête'" || true
                        fi
                        
                        echo "✅ Vérification terminée"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement réussi!"
            
            script {
                sh """
                    echo "================================================"
                    echo "📊 RÉSUMÉ DU DÉPLOIEMENT"
                    echo "================================================"
                    echo "Application: ${env.DEPLOYMENT_NAME}"
                    echo "Image: ${env.IMAGE_NAME}"
                    echo "Port: ${env.SERVICE_PORT}"
                    echo "Commit: ${env.COMMIT_HASH}"
                    echo ""
                    echo "📡 POUR ACCÉDER À L'APPLICATION:"
                    echo ""
                    echo "1. Méthode la plus simple:"
                    echo "   kubectl port-forward svc/donlocal-api-web 8080:80"
                    echo "   Puis ouvrir: http://localhost:8080"
                    echo ""
                    echo "2. Via NodePort:"
                    NODE_PORT=\$(kubectl get svc ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null)
                    echo "   Port: \${NODE_PORT:-N/A}"
                    echo "   URL: http://<ip-du-serveur>:\${NODE_PORT:-N/A}"
                    echo ""
                    echo "================================================"
                """
            }
        }
        failure {
            echo "💥 Déploiement échoué"
            
            script {
                sh """
                    echo "=== DÉBOGAGE ==="
                    
                    # 1. Statut des pods
                    echo "1. Statut des pods:"
                    kubectl get pods -l app=${env.DEPLOYMENT_NAME}
                    
                    # 2. Décrire le pod
                    echo ""
                    echo "2. Détails du pod:"
                    kubectl describe pods -l app=${env.DEPLOYMENT_NAME} | head -100
                    
                    # 3. Logs
                    echo ""
                    echo "3. Logs de l'application:"
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=100 2>/dev/null || echo "Pas de logs disponibles"
                    
                    # 4. Événements
                    echo ""
                    echo "4. Événements récents:"
                    kubectl get events --field-selector=involvedObject.name=${env.DEPLOYMENT_NAME} --sort-by=.lastTimestamp 2>/dev/null | tail -10 || echo "Aucun événement"
                    
                    # 5. Services
                    echo ""
                    echo "5. Services:"
                    kubectl get svc -l app=${env.DEPLOYMENT_NAME}
                    
                    echo ""
                    echo "=== CAUSE PROBABLE ==="
                    echo "❌ L'application Node.js a une erreur de configuration"
                    echo "   Fichier problématique: src/config/database.js"
                    echo "   Erreur: DATABASE_URL est undefined"
                    echo ""
                    echo "=== SOLUTION ==="
                    echo "1. Vérifiez votre configuration de base de données"
                    echo "2. Assurez-vous que la variable DATABASE_URL est définie"
                    echo "3. Testez localement d'abord:"
                    echo "   docker run -e DATABASE_URL=postgres://... -p 5000:5000 ${env.IMAGE_NAME}"
                    echo "   curl http://localhost:5000"
                """
            }
        }
    }
}