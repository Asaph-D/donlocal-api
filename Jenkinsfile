pipeline {
    agent { label 'linux' }  // <-- ICI LA MAGIE !!

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
                    IMAGE_TAG = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
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

                    def status = sh(returnStatus: true, script: "docker pull ${IMAGE_NAME}")

                    if (status != 0) {
                        echo "Tag not found, fallback to latest"
                        IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:latest"
                        sh "docker pull ${IMAGE_NAME}"
                    } else {
                        echo "Successfully pulled ${IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying with image: ${IMAGE_NAME}"

                sh """
                    export KUBECONFIG=/home/asaph/.kube/config
                    kubectl config use-context docker-desktop
                    ansible-playbook /home/jenkins/workspace/donlocal-api-deploy-pipeline/deploy.yml \
                        --extra-vars "image=${IMAGE_NAME}"
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
