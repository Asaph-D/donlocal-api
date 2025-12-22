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

        // PostgreSQL availability and DB initialization are managed manually; Jenkins only pulls and deploys the image.

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

                                        // Use Ansible playbook for build/push/deploy (run under bash)
                                        sh '''
                                                if ! command -v ansible-playbook >/dev/null 2>&1; then
                                                    echo "❗ ansible-playbook not found on agent. Please install Ansible."
                                                    exit 1
                                                fi

                                                # Run the playbook under bash to avoid /bin/sh substitution issues
                                                bash -lc "ansible-playbook deploy.yml -i localhost, --extra-vars 'IMAGE_NAME=${IMAGE_NAME} K8S_MANIFEST=kubernetes-config.yaml'"
                                        '''
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
                        MINIKUBE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || minikube ip 2>/dev/null || echo "localhost")
                        SERVICE_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].nodePort}')

                        echo ""
                        echo "📱 API disponible sur: http://${MINIKUBE_IP}:${SERVICE_PORT}"
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
                    MINIKUBE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || minikube ip 2>/dev/null || echo "localhost")
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
                    kubectl get pods --all-namespaces || true
                    echo ""
                    echo "=== Événements ==="
                    kubectl get events --sort-by='.lastTimestamp' || true
                    echo ""
                    echo "=== Logs PostgreSQL ==="
                    kubectl logs deployment/postgres --tail=50 || true
                    echo ""
                    echo "=== Logs API ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=50 || true
                    echo ""
                    echo "=== Description Deployment API ==="
                    kubectl describe deployment ${env.DEPLOYMENT_NAME} || true
                """
            }
        }
    }
}

