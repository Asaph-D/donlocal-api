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
                    // Get commit hash
                    def commitOutput = bat(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    def lines = commitOutput.split('\n')
                    env.IMAGE_TAG = lines[lines.length - 1].trim()
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:${env.IMAGE_TAG}"
                    
                    echo "📦 Commit: ${env.IMAGE_TAG}"
                    echo "🐳 Image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "⬇️ Pulling image: ${env.IMAGE_NAME}"
                    
                    // Try to pull specific tag
                    def pullStatus = bat(
                        script: "docker pull ${env.IMAGE_NAME}",
                        returnStatus: true
                    )
                    
                    if (pullStatus != 0) {
                        echo "🔁 Tag not found, fallback to latest"
                        env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:latest"
                        bat "docker pull ${env.IMAGE_NAME}"
                    } else {
                        echo "✅ Successfully pulled ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes with image: ${env.IMAGE_NAME}"
                    
                    // Method 1: Update deployment directly using kubectl
                    bat """
                        echo "Updating deployment ${env.DEPLOYMENT_NAME} with image ${env.IMAGE_NAME}"
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE} --record
                        
                        if errorlevel 1 (
                            echo "❌ Failed to update with specific tag, trying latest..."
                            kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.DOCKER_USER}/${env.IMAGE_REPO}:latest -n ${env.KUBE_NAMESPACE} --record
                        )
                    """
                    
                    // Wait for rollout to complete
                    bat """
                        echo "⏳ Waiting for rollout to complete..."
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s
                        
                        if errorlevel 1 (
                            echo "⚠️ Rollout taking too long or failed"
                            kubectl rollout undo deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                            exit 1
                        )
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo "🔍 Verifying deployment..."
                    
                    bat """
                        echo "=== Current deployment status ==="
                        kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} -o wide
                        
                        echo "=== Pods status ==="
                        kubectl get pods -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                        
                        echo "=== Current image ==="
                        kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}'
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment completed successfully!"
            
            script {
                // Show final status
                bat """
                    echo "=== Final Status ==="
                    kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                    kubectl rollout history deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                """
            }
        }
        failure {
            echo "💥 Deployment failed!"
            
            script {
                // Debug information
                bat """
                    echo "=== Debug Info ==="
                    echo "Image used: ${env.IMAGE_NAME}"
                    echo "Deployment: ${env.DEPLOYMENT_NAME}"
                    
                    echo "=== Current Pods ==="
                    kubectl get pods -n ${env.KUBE_NAMESPACE}
                    
                    echo "=== Deployment Events ==="
                    kubectl describe deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} | findstr Events
                    
                    echo "=== Pod Logs (last deployment) ==="
                    for /f "tokens=1" %%i in ('kubectl get pods -n ${env.KUBE_NAMESPACE} -l app^=${env.DEPLOYMENT_NAME} --sort-by=.metadata.creationTimestamp -o name ^| findstr /v "No resources" ^| head -1') do (
                        kubectl logs %%i -n ${env.KUBE_NAMESPACE} --tail=50
                    )
                """
            }
        }
        always {
            echo "🧹 Cleaning up..."
            // You can add cleanup steps here if needed
        }
    }
}