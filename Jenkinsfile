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
                    // Récupérer le hash du commit
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
                    
                    // Vérifier si le déploiement existe, sinon le créer
                    sh """
                        if ! kubectl get deployment ${env.DEPLOYMENT_NAME} >/dev/null 2>&1; then
                            echo "Création du déploiement..."
                            kubectl create deployment ${env.DEPLOYMENT_NAME} --image=${env.DOCKER_USER}/${env.IMAGE_REPO}:latest --port=${env.SERVICE_PORT}
                        else
                            echo "Déploiement existe déjà"
                        fi
                        
                        # Vérifier si le service existe, sinon le créer
                        if ! kubectl get service ${env.DEPLOYMENT_NAME} >/dev/null 2>&1; then
                            echo "Création du service..."
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
                    
                    // Essayer de pull avec le tag commit
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
                        # Mettre à jour le déploiement
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE}
                        
                        # Attendre le rollout
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s
                        
                        # Vérifier que tout fonctionne
                        kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                        kubectl get pods -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                    """
                }
            }
        }

        stage('Expose Service URL') {
            steps {
                script {
                    echo "🔗 Génération de l'URL d'accès..."
                    
                    sh """
                        # Obtenir l'URL NodePort
                        minikube service ${env.DEPLOYMENT_NAME} -p donlocal --url || echo "Utilisez: minikube service ${env.DEPLOYMENT_NAME} -p donlocal --url"
                        
                        # Alternative: obtenir directement le NodePort
                        NODE_PORT=\$(kubectl get service ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[0].nodePort}')
                        NODE_IP=\$(minikube ip -p donlocal)
                        echo "📱 API disponible sur: http://\${NODE_IP}:\${NODE_PORT}"
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
                    echo "=== RÉSUMÉ ==="
                    echo "Image déployée: ${env.IMAGE_NAME}"
                    echo "Port: ${env.SERVICE_PORT}"
                    echo "URL: http://\$(minikube ip -p donlocal):\$(kubectl get service ${env.DEPLOYMENT_NAME} -o jsonpath='{.spec.ports[0].nodePort}')"
                """
            }
        }
        failure {
            echo "💥 Déploiement échoué"
            
            script {
                sh """
                    echo "=== DÉBOGAGE ==="
                    kubectl describe deployment/${env.DEPLOYMENT_NAME}
                    kubectl get events --sort-by='.lastTimestamp'
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=50
                """
            }
        }
    }
}