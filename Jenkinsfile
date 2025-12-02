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
                    // Alternative method to get commit SHA on Windows
                    def commitHash = bat(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    IMAGE_TAG = commitHash
                    IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:${IMAGE_TAG}"

                    echo "Commit detected: ${IMAGE_TAG}"
                    echo "Targeting Docker image: ${IMAGE_NAME}"
                    
                    // Store in environment for use in all stages
                    env.IMAGE_NAME = IMAGE_NAME
                    env.IMAGE_TAG = IMAGE_TAG
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "Pulling image: ${env.IMAGE_NAME}"

                    try {
                        bat "docker pull ${env.IMAGE_NAME}"
                        echo "Successfully pulled ${env.IMAGE_NAME}"
                    } catch (Exception e) {
                        echo "Tag not found, fallback to latest"
                        env.IMAGE_NAME = "${DOCKER_USER}/${IMAGE_REPO}:latest"
                        bat "docker pull ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "Deploying with image: ${env.IMAGE_NAME}"
                    
                    // Verify Ansible playbook exists
                    def playbookPath = "${env.WORKSPACE}\\deploy.yml"
                    echo "Playbook path: ${playbookPath}"
                    
                    // Run Ansible via WSL
                    bat """
                        wsl /usr/bin/ansible-playbook '/mnt/c/ProgramData/Jenkins/.jenkins/workspace/donlocal-api-deploy-pipeline/deploy.yml' --extra-vars "image=${env.IMAGE_NAME}"
                    """
                }
            }
        }

    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed. Check Jenkins logs."
            // Add diagnostic commands
            bat "docker images | findstr donlocal"
            bat "wsl --version"
        }
    }
}