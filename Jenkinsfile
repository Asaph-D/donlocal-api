pipeline {
    agent any

    environment {
        DOCKER_USER = "asaphkouokam"
        IMAGE_REPO = "donlocal-api"
        DEPLOYMENT_NAME = "donlocal-api"
        KUBE_NAMESPACE = "default"
        SERVICE_PORT = "5000"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm

                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.IMAGE_NAME = "${env.DOCKER_USER}/${env.IMAGE_REPO}:${env.IMAGE_TAG}"

                    echo "📦 Commit: ${env.IMAGE_TAG}"
                    echo "🐳 Image: ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Deploy PostgreSQL') {
            steps {
                script {
                    echo "🔧 Déploiement de PostgreSQL..."
                    sh """
                        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:13
        env:
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          value: "1234"
        - name: POSTGRES_DB
          value: "donlocal"
        ports:
        - containerPort: 5432
        volumeMounts:
        - mountPath: /var/lib/postgresql/data
          name: postgres-storage
      volumes:
      - name: postgres-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
    - protocol: TCP
      port: 5432
      targetPort: 5432
EOF
                    """
                }
            }
        }

        stage('Ensure Deployment Exists') {
            steps {
                script {
                    echo "🔧 Vérification/Création du déploiement..."

                    sh """
                        cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${env.DEPLOYMENT_NAME}
  labels:
    app: ${env.DEPLOYMENT_NAME}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${env.DEPLOYMENT_NAME}
  template:
    metadata:
      labels:
        app: ${env.DEPLOYMENT_NAME}
    spec:
      containers:
      - name: ${env.DEPLOYMENT_NAME}
        image: ${env.IMAGE_NAME}
        ports:
        - containerPort: ${env.SERVICE_PORT.toInteger()}
        env:
        - name: POSTGRES_URI
          value: "postgres://postgres:1234@postgres-service:5432/donlocal"
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PORT
          value: "5432"
        - name: DB_USER
          value: "postgres"
        - name: DB_PASSWORD
          value: "1234"
        - name: DB_NAME
          value: "donlocal"
        imagePullPolicy: Always
EOF

                        # Créer le service si nécessaire
                        if ! kubectl get service ${env.DEPLOYMENT_NAME} >/dev/null 2>&1; then
                            kubectl expose deployment ${env.DEPLOYMENT_NAME} --type=LoadBalancer --port=${env.SERVICE_PORT}
                        fi
                    """
                }
            }
        }

        stage('Docker Pull') {
            steps {
                script {
                    echo "⬇️ Pull de l'image: ${env.IMAGE_NAME}"

                    def status = sh(script: "docker pull ${env.IMAGE_NAME}", returnStatus: true)

                    if (status != 0) {
                        echo "❌ Échec du pull de l'image ${env.IMAGE_NAME}. Vérifiez que l'image existe sur Docker Hub."
                        error "Image non disponible. Construisez et poussez l'image avant de relancer le pipeline."
                    } else {
                        echo "✅ Image pull réussie: ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Déploiement avec l'image: ${env.IMAGE_NAME}"

                    sh """
                        kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.IMAGE_NAME} -n ${env.KUBE_NAMESPACE}
                        sleep 10
                        kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=300s
                        kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=20 --follow || echo "Pas de logs disponibles"
                    """
                }
            }
        }

        stage('Check Application Health') {
            steps {
                script {
                    echo '🏥 Vérification de la santé de l\'application...'
                    sh '''
                        sleep 30
                        kubectl get pods -l app=donlocal-api -o wide
                        kubectl logs deployment/donlocal-api --tail=30

                        SERVICE_IP="localhost"
                        SERVICE_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].port}')

                        echo "📱 API disponible sur: http://${SERVICE_IP}:${SERVICE_PORT}"
                        echo "Pour tester: curl http://${SERVICE_IP}:${SERVICE_PORT}"
                        curl -f http://${SERVICE_IP}:${SERVICE_PORT} || echo "⚠️ Le test curl a échoué, mais l'application peut être en cours de démarrage"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement réussi!"
        }
        failure {
            echo "💥 Déploiement échoué"

            script {
                sh """
                    echo "=== DÉBOGAGE DÉTAILLÉ ==="
                    kubectl describe pods -l app=${env.DEPLOYMENT_NAME}
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --previous || true
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} || true
                    kubectl get events --field-selector=involvedObject.name=${env.DEPLOYMENT_NAME} --sort-by='.lastTimestamp'
                """
            }
        }
    }
}
