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

        stage('Vérifier et Préparer') {
            steps {
                script {
                    echo "🔍 Vérification des outils..."
                    
                    // Vérifier qu'Ansible est installé
                    sh '''
                        which ansible || { 
                            echo "❌ Ansible n'est pas installé"
                            echo "Installation d'Ansible..."
                            sudo apt-get update && sudo apt-get install -y ansible
                        }
                        ansible --version
                        
                        # Vérifier que kubectl est disponible
                        which kubectl || { echo "❌ kubectl n'est pas installé"; exit 1; }
                        kubectl version --client --short
                    '''
                }
            }
        }

        stage('Déployer avec Ansible') {
            steps {
                script {
                    echo "🚀 Déploiement avec Ansible..."
                    
                    // Créer un playbook Ansible temporaire si nécessaire
                    sh '''
                        cat > /tmp/deploy-playbook.yml << 'EOF'
---
- name: Déployer donlocal-api sur Kubernetes
  hosts: localhost
  connection: local
  gather_facts: no
  
  vars:
    image_name: "{{ lookup('env', 'IMAGE_NAME') }}"
    deployment_name: "{{ lookup('env', 'DEPLOYMENT_NAME') }}"
    namespace: "{{ lookup('env', 'KUBE_NAMESPACE') }}"
  
  tasks:
    - name: Vérifier l'accès au cluster Kubernetes
      command: kubectl cluster-info
      register: cluster_info
      changed_when: false
      failed_when: false
      
    - debug:
        msg: "📋 Déploiement de {{ image_name }} dans {{ namespace }}"
        
    - name: Vérifier si le déploiement existe
      command: kubectl get deployment {{ deployment_name }} -n {{ namespace }}
      register: deployment_check
      ignore_errors: yes
      changed_when: false
      
    - name: Appliquer la configuration Kubernetes si nécessaire
      command: kubectl apply -f kubernetes-config.yaml
      when: deployment_check.rc != 0
      
    - name: Mettre à jour l'image du déploiement
      command: |
        kubectl set image deployment/{{ deployment_name }} \
          {{ deployment_name }}={{ image_name }} \
          -n {{ namespace }}
      register: update_result
      changed_when: "'image updated' in update_result.stdout or 'updated' in update_result.stdout"
      
    - name: Attendre le déploiement
      command: |
        kubectl rollout status deployment/{{ deployment_name }} \
          -n {{ namespace }} \
          --timeout=300s
      register: rollout_status
      until: rollout_status.rc == 0
      retries: 5
      delay: 10
      
    - name: Récupérer les informations des pods
      command: kubectl get pods -l app={{ deployment_name }} -n {{ namespace }} -o wide
      register: pods_info
      changed_when: false
      
    - name: Afficher le résultat
      debug:
        msg:
          - "✅ Déploiement terminé avec succès"
          - "📦 Image: {{ image_name }}"
          - "📊 Pods déployés:"
          - "{{ pods_info.stdout_lines | join('\n') }}"
EOF
                    '''
                    
                    // Exécuter le playbook Ansible
                    sh """
                        echo "🎯 Exécution du playbook Ansible..."
                        ansible-playbook /tmp/deploy-playbook.yml \
                          --extra-vars "IMAGE_NAME=${env.IMAGE_NAME} DEPLOYMENT_NAME=${env.DEPLOYMENT_NAME} KUBE_NAMESPACE=${env.KUBE_NAMESPACE}"
                    """
                }
            }
        }

        stage('Vérifier la santé') {
            steps {
                script {
                    echo "🏥 Vérification de la santé de l'application..."
                    
                    sh '''
                        # Attendre quelques secondes pour que l'application soit prête
                        sleep 10
                        
                        echo "=== Pods ==="
                        kubectl get pods -l app=donlocal-api -o wide
                        
                        echo ""
                        echo "=== Logs récents ==="
                        kubectl logs deployment/donlocal-api --tail=20 --timestamps=true || echo "Pas encore de logs"
                        
                        echo ""
                        echo "=== Test de santé ==="
                        # Essayer d'accéder au endpoint de santé
                        API_POD=$(kubectl get pods -l app=donlocal-api -o jsonpath='{.items[0].metadata.name}')
                        if [ -n "$API_POD" ]; then
                            kubectl exec $API_POD -- curl -s http://localhost:5000/api/health && echo "✅ Santé OK" || echo "⚠️ Santé non vérifiée"
                        fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Déploiement réussi avec Ansible!"
            sh '''
                echo ""
                echo "=== INFORMATIONS DE CONNEXION ==="
                MINIKUBE_IP=$(minikube ip 2>/dev/null || kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")
                API_PORT=$(kubectl get service donlocal-api -o jsonpath='{.spec.ports[0].nodePort}')
                echo "🌐 API URL: http://${MINIKUBE_IP}:${API_PORT}"
                echo "🐘 PostgreSQL: ${MINIKUBE_IP}:5432"
                echo "👤 DB User: postgres"
                echo "🔑 DB Password: 1234"
                echo "🗄️  Database: donlocal"
                echo ""
                echo "🕒 Image déployée: ${IMAGE_NAME}"
            '''
        }
        failure {
            echo "💥 Déploiement échoué"

            script {
                sh """
                    echo "=== DÉBOGAGE DÉTAILLÉ ==="
                    echo ""
                    echo "=== Pods ==="
                    kubectl get pods --all-namespaces || true
                    echo ""
                    echo "=== Événements ==="
                    kubectl get events --sort-by='.lastTimestamp' --field-selector involvedObject.name=donlocal-api || true
                    echo ""
                    echo "=== Logs PostgreSQL ==="
                    kubectl logs deployment/postgres --tail=20 || true
                    echo ""
                    echo "=== Logs API ==="
                    kubectl logs deployment/${env.DEPLOYMENT_NAME} --tail=50 || true
                    echo ""
                    echo "=== Description Deployment API ==="
                    kubectl describe deployment ${env.DEPLOYMENT_NAME} || true
                """
            }
        }
        
        always {
            echo "🧹 Nettoyage..."
            // Supprimer le fichier temporaire
            sh 'rm -f /tmp/deploy-playbook.yml || true'
        }
    }
}