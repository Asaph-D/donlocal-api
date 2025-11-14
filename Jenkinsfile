pipeline {
    agent any
    environment {
        IMAGE_NAME = "" // sera défini dynamiquement après checkout
    }
    stages {
        stage('Checkout') {
            steps {
                // Récupère le code depuis Git
                checkout scm
                script {
                    // Définit le tag Docker avec le commit actuel
                    env.IMAGE_NAME = "asaphkouokam/donlocal-api:${env.GIT_COMMIT}"
                    echo "Using Docker image: ${env.IMAGE_NAME}"
                }
            }
        }
        stage('Docker Pull') {
            steps {
                echo "Pulling Docker image..."
                bat "docker pull ${env.IMAGE_NAME}"
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying via Ansible in WSL..."
                bat "wsl ansible-playbook /home/asaph/deploy.yml"
            }
        }
    }
    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed. Check logs."
        }
    }
}
