pipeline {
    agent any

    environment {
        DOCKER_USER = "asaphkouokam"
        IMAGE_REPO = "donlocal-api"
        DEPLOYMENT_NAME = "donlocal-api"
        KUBE_NAMESPACE = "default"
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
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE} --record
                        
                        # Attendre le rollout
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s
                    """
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
        }
    }
}