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

        stage('Apply Kubernetes Configuration') {
            steps {
                script {
                    echo "🔧 Application de la configuration Kubernetes..."
                    sh """
                        kubectl apply -f kubernetes-config.yaml
                        sleep 10
                    """
                }
            }
        }

        stage('Wait for PostgreSQL') {
            steps {
                script {
                    echo "⏳ Attente de PostgreSQL..."
                    sh """
                        kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n ${env.KUBE_NAMESPACE} || true
                        sleep 10
                    """
                }
            }
        }

        stage('Initialize Database') {
            steps {
                script {
                    echo "🗄️ Initialisation de la base de données..."
                    sh """
                        POSTGRES_POD=\$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}' -n ${env.KUBE_NAMESPACE})
                        
                        if [ -z "\$POSTGRES_POD" ]; then
                            echo "❌ Pod PostgreSQL non trouvé"
                            exit 1
                        fi
                        
                        echo "Pod PostgreSQL: \$POSTGRES_POD"
                        
                        # Attendre que PostgreSQL soit vraiment prêt
                        kubectl exec -it \$POSTGRES_POD -n ${env.KUBE_NAMESPACE} -- bash -c 'for i in {1..30}; do pg_isready -U postgres && break || sleep 2; done'
                        
                        echo "✅ PostgreSQL est prêt"
                    """
                }
            }
        }

        stage('Ensure Deployment Exists') {
            steps {
                script {
                    echo "🔧 Vérification du déploiement..."

                    sh """
                        # Le déploiement est déjà créé par la configuration Kubernetes
                        kubectl get deployment ${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
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
                        echo "⚠️ Impossible de pull l'image ${env.IMAGE_NAME}"
                        echo "Assurez-vous que l'image est disponible sur Docker Hub"
                        // Ne pas échouer ici, continuer avec la version locale si disponible
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
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE} || true
                        sleep 10
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s || true
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=30 || echo "Pas de logs disponibles"
                    """
                }
            }
        }

        stage('Check Application Health') {
            steps {
                script {
                    echo '🏥 Vérification de la santé de l\'application...'
                    sh '''
                        echo "=== Pods ==="
                        kubectl get pods -l app=donlocal-api -o wide
                        
                        echo ""
                        echo "=== Logs de l'API ==="
                        kubectl logs deployment/donlocal-api --tail=50 --timestamps=true || echo "Pas de logs"
                        
                        echo ""
                        echo "=== Services ==="
                        kubectl get services
                        
                        echo ""
                        echo "=== Endpoints PostgreSQL ==="
                        kubectl get endpoints postgres-service
                        
                        MINIKUBE_IP=$(minikube ip)
                        SERVICE_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].nodePort}')
                        
                        echo ""
                        echo "📱 API disponible sur: http://${MINIKUBE_IP}:${SERVICE_PORT}"
                        echo "PostgreSQL disponible sur: ${MINIKUBE_IP}:5432"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement réussi!"
            sh '''
                echo ""
                echo "=== INFORMATIONS DE CONNEXION ==="
                MINIKUBE_IP=$(minikube ip)
                API_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].nodePort}')
                echo "🌐 API URL: http://${MINIKUBE_IP}:${API_PORT}"
                echo "🐘 PostgreSQL: ${MINIKUBE_IP}:5432"
                echo "👤 DB User: postgres"
                echo "🔑 DB Password: 1234"
                echo "🗄️  Database: donlocal"
            '''
        }
        failure {
            echo "💥 Déploiement échoué"

            script {
                sh """
                    echo "=== DÉBOGAGE DÉTAILLÉ ==="
                    echo ""
                    echo "=== Pods ==="
                    kubectl get pods --all-namespaces
                    
                    echo ""
                    echo "=== Événements ==="
                    kubectl get events --sort-by='.lastTimestamp'
                    
                    echo ""
                    echo "=== Logs PostgreSQL ==="
                    kubectl logs deployment/postgres --tail=50 || true
                    
                    echo ""
                    echo "=== Logs API ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=50 || true
                    
                    echo ""
                    echo "=== Description Deployment API ==="
                    kubectl describe deployment ${env.DEPLOYMENT_NAME}
                """
            }
        }
    }
}

