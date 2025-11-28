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
                    // Extraire le commit SHA correctement sur Windows
                    IMAGE_TAG = powershell(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:${IMAGE_TAG}"

                    echo "Commit detected: ${IMAGE_TAG}"
                    echo "Targeting Docker image: ${IMAGE_NAME}"
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "Pulling image: ${IMAGE_NAME}"

                    def status = powershell(returnStatus: true, script: "docker pull ${IMAGE_NAME}")

                    if (status != 0) {
                        echo "Tag not found, fallback to latest"
                        IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:latest"
                        powershell "docker pull ${IMAGE_NAME}"
                    } else {
                        echo "Successfully pulled ${IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying with image: ${IMAGE_NAME}"
                powershell """
                wsl -u asaph ansible-playbook /home/asaph/deploy.yml --extra-vars "image=${IMAGE_NAME}"
                """
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
