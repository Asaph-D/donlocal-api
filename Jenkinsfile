pipeline {
    agent any

    environment {
        DOCKER_USER = "asaphkouokam"
        IMAGE_REPO = "donlocal-api"
        IMAGE_TAG = ""
        IMAGE_NAME = ""
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                script {
                    // Récupérer le commit SHA réel du code checkouté
                    env.IMAGE_TAG = bat(
                        script: "git rev-parse HEAD",
                        returnStdout: true
                    ).trim()

                    env.IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:${env.IMAGE_TAG}"

                    echo "Commit detected: ${env.IMAGE_TAG}"
                    echo "Targeting Docker image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "Pulling image: ${env.IMAGE_NAME}"

                    def status = bat(
                        script: "docker pull ${env.IMAGE_NAME}",
                        returnStatus: true
                    )

                    if (status != 0) {
                        echo "⚠️ Tag not found, fallback to latest"
                        env.IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:latest"
                        bat "docker pull ${env.IMAGE_NAME}"
                    } else {
                        echo "✅ Successfully pulled ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying with image: ${env.IMAGE_NAME}"
                bat "wsl ansible-playbook /home/asaph/deploy.yml --extra-vars \"image=${env.IMAGE_NAME}\""
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed. Check Jenkins logs."
        }
    }
}
