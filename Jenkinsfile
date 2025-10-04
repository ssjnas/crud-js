pipeline {
  agent any

  environment {
    IMAGE_NAME      = "docker.io/prashanthreddy235/crud-js"   // <-- change if your Docker Hub repo differs
    CONTAINER_NAME  = "crud-js"
    APP_PORT        = "3000"
    DEPLOY_PORT     = "80"
    DOCKERHUB_CREDS = "dockerhub-credentials"                 // <-- matches what you created
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build Image') {
      steps {
        sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
        sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest"
      }
    }

    stage('Push Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS, usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
          sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
          sh "docker push ${IMAGE_NAME}:latest"
        }
      }
      post { always { sh 'docker logout || true' } }
    }

    stage('Deploy (same EC2)') {
      steps {
        sh """
          docker pull ${IMAGE_NAME}:latest || true
          docker rm -f ${CONTAINER_NAME} || true
          docker run -d --name ${CONTAINER_NAME} \\
            -p ${DEPLOY_PORT}:${APP_PORT} \\
            --restart=always \\
            -e PORT=${APP_PORT} \\
            ${IMAGE_NAME}:latest
        """
      }
    }
  }

  options { timestamps() }
}
