pipeline {
    agent any

    environment {
        DOCKER_USER = "asaphkouokam"
        IMAGE_REPO = "donlocal-api"
        DEPLOYMENT_NAME = "donlocal-api"
        KUBE_NAMESPACE = "default"
        DOCKER_REGISTRY = "docker.io"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm

                script {
                    // Sur Ubuntu, utiliser sh au lieu de powershell
                    env.IMAGE_TAG = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:${env.IMAGE_TAG}"
                    
                    echo "📦 Commit détecté: ${env.IMAGE_TAG}"
                    echo "🐳 Image Docker: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🏗️ Construction de l'image Docker..."
                    
                    // Construire l'image
                    sh """
                        docker build -t ${env.IMAGE_NAME} .
                        
                        # Tag également en latest
                        docker tag ${env.IMAGE_NAME} ${env.DOCKER_USER}/${env.IMAGE_REPO}:latest
                    """
                    
                    echo "✅ Image construite: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "📤 Poussée vers Docker Hub..."
                    
                    // Utiliser les credentials Docker configurés dans Jenkins
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-hub',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        sh """
                            echo "Connexion à Docker Hub..."
                            echo "\${DOCKER_PASSWORD}" | docker login -u "\${DOCKER_USERNAME}" --password-stdin
                            
                            echo "Poussée de l'image..."
                            docker push ${env.IMAGE_NAME}
                            docker push ${env.DOCKER_USER}/${env.IMAGE_REPO}:latest
                            
                            echo "Déconnexion..."
                            docker logout
                        """
                    }
                    
                    echo "✅ Images poussées avec succès"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Déploiement sur Kubernetes..."
                    
                    // Mettre à jour le déploiement Kubernetes
                    sh """
                        echo "Mise à jour du déploiement ${env.DEPLOYMENT_NAME} avec l'image ${env.IMAGE_NAME}"
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE} --record
                        
                        if [ \$? -eq 0 ]; then
                            echo "✅ Image mise à jour avec succès"
                        else
                            echo "❌ Échec de la mise à jour, utilisation de l'image latest"
                            kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.DOCKER_USER}/${env.IMAGE_REPO}:latest -n ${env.KUBE_NAMESPACE} --record
                        fi
                    """
                    
                    // Attendre le rollout
                    sh """
                        echo "⏳ Attente du déploiement..."
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s
                        
                        if [ \$? -eq 0 ]; then
                            echo "✅ Déploiement réussi!"
                        else
                            echo "❌ Échec du déploiement, rollback..."
                            kubectl rollout undo deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                            exit 1
                        fi
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo "🔍 Vérification du déploiement..."
                    
                    sh """
                        echo "=== État du déploiement ==="
                        kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} -o wide
                        
                        echo ""
                        echo "=== Pods ==="
                        kubectl get pods -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                        
                        echo ""
                        echo "=== Image utilisée ==="
                        kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}'
                        echo ""
                        
                        echo "=== Services ==="
                        kubectl get svc -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement terminé avec succès!"
            
            script {
                sh """
                    echo "=== Historique des déploiements ==="
                    kubectl rollout history deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                    
                    echo ""
                    echo "=== URLs d'accès ==="
                    minikube service ${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --url || echo "Utilisez 'minikube service list' pour voir les URLs"
                """
            }
        }
        failure {
            echo "💥 Échec du déploiement!"
            
            script {
                sh """
                    echo "=== Informations de débogage ==="
                    
                    echo "1. Événements récents:"
                    kubectl get events -n ${env.KUBE_NAMESPACE} --sort-by='.lastTimestamp' | tail -20
                    
                    echo ""
                    echo "2. Description du déploiement:"
                    kubectl describe deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                    
                    echo ""
                    echo "3. Logs des pods (si existants):"
                    POD_NAME=\$(kubectl get pods -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
                    if [ ! -z "\$POD_NAME" ]; then
                        echo "Logs du pod \$POD_NAME:"
                        kubectl logs \$POD_NAME -n ${env.KUBE_NAMESPACE} --tail=50
                    fi
                    
                    echo ""
                    echo "4. Configuration actuelle:"
                    echo "Image: ${env.IMAGE_NAME}"
                    echo "Namespace: ${env.KUBE_NAMESPACE}"
                    echo "Déploiement: ${env.DEPLOYMENT_NAME}"
                """
            }
        }
        always {
            echo "🧹 Nettoyage..."
            
            script {
                // Nettoyer les images Docker intermédiaires
                sh """
                    echo "Nettoyage des images Docker non utilisées..."
                    docker image prune -f
                """
            }
        }
    }
}

