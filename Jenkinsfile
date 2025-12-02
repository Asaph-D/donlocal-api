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
                    // Extraire le commit SHA avec PowerShell
                    env.IMAGE_TAG = powershell(returnStdout: true, script: 'git rev-parse HEAD').trim()
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

                    def status = powershell(returnStatus: true, script: "docker pull ${env.IMAGE_NAME}")

                    if (status != 0) {
                        echo "Tag not found, fallback to latest"
                        env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:latest"
                        powershell "docker pull ${env.IMAGE_NAME}"
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
                    
                    // Utiliser kubectl directement au lieu de WSL
                    powershell """
                        Write-Host "🚀 Updating Kubernetes deployment..."
                        
                        # Mettre à jour l'image du déploiement
                        \$command = "kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE} --record"
                        Write-Host "Executing: \$command"
                        Invoke-Expression \$command
                        
                        if (\$LASTEXITCODE -ne 0) {
                            Write-Host "⚠️ Failed with specific tag, trying latest..."
                            \$fallbackCommand = "kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.DOCKER_USER}/${env.IMAGE_REPO}:latest -n ${env.KUBE_NAMESPACE} --record"
                            Invoke-Expression \$fallbackCommand
                        }
                        
                        # Attendre le déploiement
                        Write-Host "⏳ Waiting for rollout..."
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s
                        
                        if (\$LASTEXITCODE -ne 0) {
                            Write-Host "❌ Rollout failed, rolling back..."
                            kubectl rollout undo deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                            exit 1
                        }
                        
                        Write-Host "✅ Deployment successful!"
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    echo "Verifying deployment..."
                    
                    powershell """
                        Write-Host "=== Deployment Status ==="
                        kubectl get deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} -o wide
                        
                        Write-Host "=== Pods ==="
                        kubectl get pods -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME}
                        
                        Write-Host "=== Current Image ==="
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
                powershell """
                    Write-Host "=== Final Summary ==="
                    kubectl rollout history deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE}
                """
            }
        }
        failure {
            echo "💥 Deployment failed!"
            
            script {
                powershell """
                    Write-Host "=== Debug Information ==="
                    
                    Write-Host "1. Current deployments:"
                    kubectl get deployments -n ${env.KUBE_NAMESPACE}
                    
                    Write-Host "2. Pods status:"
                    kubectl get pods -n ${env.KUBE_NAMESPACE}
                    
                    Write-Host "3. Events:"
                    kubectl get events -n ${env.KUBE_NAMESPACE} --sort-by='.lastTimestamp' | Select-Object -Last 10
                    
                    Write-Host "4. Failed pod logs:"
                    \$failedPod = kubectl get pods -n ${env.KUBE_NAMESPACE} -l app=${env.DEPLOYMENT_NAME} --field-selector=status.phase!=Running -o name
                    if (\$failedPod) {
                        kubectl logs \$failedPod -n ${env.KUBE_NAMESPACE} --tail=50
                    }
                """
            }
        }
    }
}