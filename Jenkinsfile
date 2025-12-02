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
                    // Get commit hash
                    def commitOutput = bat(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    
                    // Extract just the hash (remove the command line from output)
                    def lines = commitOutput.split('\n')
                    def commitHash = lines[lines.length - 1].trim()
                    
                    // Store in environment variables
                    env.IMAGE_TAG = commitHash
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:${env.IMAGE_TAG}"
                    
                    // Convert Windows workspace path to WSL path
                    env.WSL_WORKSPACE_PATH = "/mnt/c" + env.WORKSPACE.replace('C:', '').replace('\\', '/')
                    
                    echo "Commit detected: ${env.IMAGE_TAG}"
                    echo "Targeting Docker image: ${env.IMAGE_NAME}"
                    echo "WSL Workspace path: ${env.WSL_WORKSPACE_PATH}"
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

        stage('Test WSL Access') {
            steps {
                script {
                    echo "Testing WSL access..."
                    
                    // Test basic WSL command
                    bat 'wsl echo "WSL is working from Jenkins"'
                    
                    // Test file access in WSL
                    bat """
                        wsl ls -la "${env.WSL_WORKSPACE_PATH}/"
                    """
                    
                    // Test ansible version
                    bat 'wsl /usr/bin/ansible-playbook --version'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "Deploying with image: ${env.IMAGE_NAME}"
                    
                    // Method 1: Using cd to workspace in WSL
                    bat """
                        wsl bash -c "cd '${env.WSL_WORKSPACE_PATH}' && /usr/bin/ansible-playbook deploy.yml --extra-vars 'image=${env.IMAGE_NAME}'"
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
                // Debug information
                echo "Debug info:"
                echo "IMAGE_NAME: ${env.IMAGE_NAME}"
                echo "WORKSPACE: ${env.WORKSPACE}"
                echo "WSL_WORKSPACE_PATH: ${env.WSL_WORKSPACE_PATH}"
                
                bat "wsl pwd"
                bat "wsl whoami"
                bat "docker images | findstr donlocal"
            }
        }
    }
}