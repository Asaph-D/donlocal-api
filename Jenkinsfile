pipeline {
    agent any
    environment {
        IMAGE_NAME = "asaphkouokam/donlocal-api:latest"
    }
    stages {
        stage('Docker Pull') {
            steps {
                echo "Pulling Docker image on Windows..."
                bat "docker pull %IMAGE_NAME%"
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
