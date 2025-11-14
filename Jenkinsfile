pipeline {
  agent any
  stages {
    stage('Pull Docker image') {
      steps {
        sh 'docker pull asaph/donlocal-api:latest'
      }
    }
    stage('Deploy with Ansible') {
      steps {
        sh 'ansible-playbook deploy.yml'
      }
    }
  }
}
