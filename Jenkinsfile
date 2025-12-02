pipeline {
    agent any

    environment {
        DOCKER_USER = "asaphkouokam"
        IMAGE_REPO = "donlocal-api"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                
                script {
                    // Get commit hash - capture only the hash without command text
                    def commitOutput = bat(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    
                    // Extract just the hash (remove the command line from output)
                    def lines = commitOutput.split('\n')
                    def commitHash = lines[lines.length - 1].trim()
                    
                    // Store in environment variables
                    env.IMAGE_TAG = commitHash
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:${env.IMAGE_TAG}"
                    
                    echo "Commit detected: ${env.IMAGE_TAG}"
                    echo "Targeting Docker image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "Pulling image: ${env.IMAGE_NAME}"
                    
                    // Try to pull the specific commit tag
                    def pullStatus = bat(
                        script: "docker pull ${env.IMAGE_NAME}",
                        returnStatus: true
                    )
                    
                    if (pullStatus != 0) {
                        echo "Tag ${env.IMAGE_TAG} not found, fallback to latest"
                        env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:latest"
                        bat "docker pull ${env.IMAGE_NAME}"
                    } else {
                        echo "Successfully pulled ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "Deploying with image: ${env.IMAGE_NAME}"
                    
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
            script {
                // Run diagnostic commands safely
                try {
                    bat "docker images | findstr donlocal"
                } catch (Exception e) {
                    echo "Failed to list docker images: ${e.message}"
                }
            }
        }
    }
}