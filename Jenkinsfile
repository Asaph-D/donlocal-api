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
                        
                        # Vérifier que le playbook principal existe
                        if [ ! -f "ansible/deploy.yml" ]; then
                            echo "❌ ansible/deploy.yml non trouvé dans le dépôt"
                            exit 1
                        fi
                        
                        # Vérifier que l'inventory existe
                        if [ ! -f "ansible/inventory.ini" ]; then
                            echo "❌ ansible/inventory.ini non trouvé"
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
                    echo "🚀 Déploiement avec Ansible (multi-machines)..."

                    // Tentative d'exécution non interactive via Jenkins Credentials
                    try {
                        withCredentials([string(credentialsId: 'ANSIBLE_BECOME_PASS', variable: 'BECOME_PASS')]) {
                            sshagent(credentials: ['JENKINS_SSH_KEY']) {
                                sh '''
                                    cd ansible
                                    echo "🎯 Exécution du playbook principal deploy.yml"
                                    echo "📋 Paramètres:"
                                    echo "  Image: ${IMAGE_NAME}"
                                    echo "  Déploiement: ${DEPLOYMENT_NAME}"
                                    echo "  Namespace: ${KUBE_NAMESPACE}"
                                    echo ""
                                    ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=${IMAGE_NAME} ansible_become_password=${BECOME_PASS}"
                                '''
                            }
                        }
                    } catch (err) {
                        echo "⚠️ Credentials Jenkins manquants ou échec SSH agent — fallback vers exécution basique"
                        sh '''
                            cd ansible
                            ansible-playbook -i inventory.ini deploy.yml -e "IMAGE_NAME=${IMAGE_NAME}"
                        '''
                    }
                }
            }
        }

        stage('Vérifier la santé de l\'application') {
            steps {
                script {
                    echo '🏥 Vérification de la santé...'
                    
                    // Attendre un peu pour laisser l'application démarrer
                    sleep 15
                    
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
                        POD_NAME=$(kubectl get pods -l app=donlocal-api -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
                        if [ -n "$POD_NAME" ]; then
                            echo "Test de santé sur le pod: $POD_NAME"
                            for i in 1 2 3 4 5; do
                                if kubectl exec $POD_NAME -- curl -s -f http://localhost:5000/api/health >/dev/null 2>&1; then
                                    echo "✅ Application en bonne santé"
                                    exit 0
                                fi
                                echo "⏳ Tentative $i/5..."
                                sleep 5
                            done
                            echo "⚠️ Application non encore prête après 25 secondes"
                        else
                            echo "❌ Aucun pod trouvé"
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
                
                if MINIKUBE_IP=$(minikube ip 2>/dev/null); then
                    echo "Minikube IP: $MINIKUBE_IP"
                elif MINIKUBE_IP=$(kubectl get nodes -o jsonpath="{.items[0].status.addresses[?(@.type=='InternalIP')].address}" 2>/dev/null); then
                    echo "Cluster IP: $MINIKUBE_IP"
                else
                    MINIKUBE_IP="localhost"
                    echo "IP: $MINIKUBE_IP (localhost)"
                fi
                
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
                echo ""
                echo "📈 État:"
                kubectl get pods -l app=donlocal-api --no-headers | wc -l | xargs echo "Nombre de pods en cours d'exécution:"
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
                    kubectl logs statefulset/postgres --tail=10 2>/dev/null || kubectl logs deployment/postgres --tail=10 2>/dev/null || true
                    echo ""
                    echo "=== Logs API ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=30 2>/dev/null || true
                    echo ""
                    echo "=== Description du déploiement ==="
                    kubectl describe deployment ${env.DEPLOYMENT_NAME} 2>/dev/null || true
                """
            }
        }
        
        always {
            echo "🧹 Pipeline terminé"
            sh '''
                echo "Date: $(date)"
                echo "Job: '${JOB_NAME}'"
                echo "Build: '${BUILD_NUMBER}'"
                echo "Image: '${IMAGE_NAME}'"
            '''
        }
    }
}