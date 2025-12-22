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

        stage('Vérifier les outils') {
            steps {
                script {
                    echo "🔍 Vérification des outils..."
                    
                    sh """
                        # Vérifier qu'Ansible est installé
                        if ! command -v ansible-playbook >/dev/null 2>&1; then
                            echo "❌ ansible-playbook non trouvé"
                            exit 1
                        fi
                        
                        # Vérifier que le playbook existe
                        if [ ! -f "deploy.yml" ]; then
                            echo "❌ deploy.yml non trouvé dans le dépôt"
                            exit 1
                        fi
                        
                        # Vérifier kubectl
                        if ! command -v kubectl >/dev/null 2>&1; then
                            echo "❌ kubectl non trouvé"
                            exit 1
                        fi
                        
                        echo "✅ Tous les outils sont disponibles"
                    """
                }
            }
        }

        stage('Pull Docker Image') {
            steps {
                script {
                    echo "⬇️ Tentative de pull de l'image: ${env.IMAGE_NAME}"

                    // Essayer de pull l'image, mais ne pas échouer si impossible
                    sh """
                        if docker pull ${env.IMAGE_NAME} 2>/dev/null; then
                            echo "✅ Image pull réussie"
                        else
                            echo "⚠️ Impossible de pull l'image depuis Docker Hub"
                            echo "Kubernetes la téléchargera directement lors du déploiement"
                        fi
                    """
                }
            }
        }

        stage('Déployer avec Ansible') {
            steps {
                script {
                    echo "🚀 Déploiement avec Ansible..."
                    
                    sh """
                        echo "🎯 Exécution du playbook deploy.yml"
                        echo "📋 Paramètres:"
                        echo "  Image: ${env.IMAGE_NAME}"
                        echo "  Déploiement: ${env.DEPLOYMENT_NAME}"
                        echo "  Namespace: ${env.KUBE_NAMESPACE}"
                        
                        # Exécuter le playbook Ansible
                        ansible-playbook deploy.yml \
                          --extra-vars "IMAGE_NAME=${env.IMAGE_NAME}"
                    """
                }
            }
        }

        stage('Vérifier la santé de l\'application') {
            steps {
                script {
                    echo '🏥 Vérification de la santé...'
                    
                    // Attendre un peu pour laisser l'application démarrer
                    sleep 10
                    
                    sh '''
                        echo "=== État du déploiement ==="
                        kubectl get deployment donlocal-api -o wide
                        
                        echo ""
                        echo "=== Pods en cours d\'exécution ==="
                        kubectl get pods -l app=donlocal-api -o wide
                        
                        echo ""
                        echo "=== Derniers logs ==="
                        kubectl logs deployment/donlocal-api --tail=10 2>/dev/null || echo "Logs non disponibles"
                        
                        echo ""
                        echo "=== Test de connexion ==="
                        # Tenter de vérifier la santé via curl dans un pod
                        POD_NAME=$(kubectl get pods -l app=donlocal-api -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
                        if [ -n "$POD_NAME" ]; then
                            echo "Test de santé sur le pod: $POD_NAME"
                            if kubectl exec $POD_NAME -- curl -s -f http://localhost:5000/api/health >/dev/null 2>&1; then
                                echo "✅ Application en bonne santé"
                            else
                                echo "⚠️ Application non encore prête"
                            fi
                        fi
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
                
                # Obtenir l'adresse IP
                if MINIKUBE_IP=$(minikube ip 2>/dev/null); then
                    echo "Minikube IP: $MINIKUBE_IP"
                elif MINIKUBE_IP=$(kubectl get nodes -o jsonpath="{.items[0].status.addresses[?(@.type=='InternalIP')].address}" 2>/dev/null); then
                    echo "Cluster IP: $MINIKUBE_IP"
                else
                    MINIKUBE_IP="localhost"
                    echo "IP: $MINIKUBE_IP (localhost)"
                fi
                
                # Obtenir le port du service
                API_PORT=$(kubectl get service donlocal-api -o jsonpath="{.spec.ports[0].nodePort}" 2>/dev/null)
                if [ -n "$API_PORT" ]; then
                    echo "🌐 API URL: http://${MINIKUBE_IP}:${API_PORT}"
                    echo "🩺 Endpoint santé: http://${MINIKUBE_IP}:${API_PORT}/api/health"
                else
                    echo "🌐 API: Service non exposé ou port non disponible"
                fi
                
                echo ""
                echo "🐘 PostgreSQL: ${MINIKUBE_IP}:5432"
                echo "👤 DB User: postgres"
                echo "🔑 DB Password: 1234"
                echo "🗄️  Database: donlocal"
                echo ""
                echo "📊 Image déployée: ${IMAGE_NAME}"
            '''
        }
        failure {
            echo "💥 Déploiement échoué"

            script {
                sh """
                    echo "=== DÉBOGAGE DÉTAILLÉ ==="
                    echo ""
                    echo "=== État des pods ==="
                    kubectl get pods --all-namespaces 2>/dev/null || true
                    echo ""
                    echo "=== Événements récents ==="
                    kubectl get events --sort-by='.lastTimestamp' 2>/dev/null | tail -20 || true
                    echo ""
                    echo "=== Logs PostgreSQL ==="
                    kubectl logs deployment/postgres --tail=10 2>/dev/null || true
                    echo ""
                    echo "=== Logs API ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=30 2>/dev/null || true
                    echo ""
                    echo "=== Description du déploiement ==="
                    kubectl describe deployment ${env.DEPLOYMENT_NAME} 2>/dev/null || true
                    echo ""
                    echo "=== Description des pods API ==="
                    kubectl describe pods -l app=${env.DEPLOYMENT_NAME} 2>/dev/null || true
                """
            }
        }
        
        always {
            echo "🧹 Pipeline terminé"
            // Nettoyage optionnel
            sh '''
                echo "Date: $(date)"
                echo "Durée du pipeline: ${currentBuild.durationString}"
            '''
        }
    }
}