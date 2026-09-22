// CI/CD de condotrack_Frontend (React + Vite) para jenkins.frubilarz.cl.
//
// Mismo esquema que condotrack_Backend: un solo executor, Docker disponible, todo
// corre en contenedores efimeros. El sitio se sirve desde un contenedor nginx
// publicado en 127.0.0.1:4200; el nginx del host (proxy inverso con TLS) expone
// https://condotrack.frubilarz.cl -> 127.0.0.1:4200.
//
// Flujo:
//   Checkout -> Install deps -> Lint -> Build -> Build image
//   (solo rama `production`) -> Deploy -> Health Check
pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        APP_NAME       = 'condotrack-frontend'
        NODE_IMAGE     = 'node:22-alpine'
        DOCKER_NETWORK = 'course-net'
        DEPLOY_PORT    = '4200'
        // URL publica del backend; Vite la inyecta en el bundle en build-time.
        VITE_API_URL   = 'https://apicondotrack.frubilarz.cl'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    def safeBranch = env.BRANCH_NAME.replaceAll(/[^A-Za-z0-9_.-]/, '-').toLowerCase()
                    env.SAFE_BRANCH = safeBranch
                    env.IMAGE_TAG   = "${APP_NAME}:${safeBranch}-${env.BUILD_NUMBER}"
                }
            }
        }

        stage('Lint & Build') {
            steps {
                script {
                    docker.image(env.NODE_IMAGE).inside('-u root:root') {
                        stage('Install deps') {
                            sh 'npm ci --no-audit --no-fund'
                        }
                        stage('Lint') {
                            sh 'npm run lint'
                        }
                        stage('Build') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Build image') {
            steps {
                sh '''
                    docker build \
                      --build-arg VITE_API_URL="$VITE_API_URL" \
                      -t "$IMAGE_TAG" -t "$APP_NAME:$SAFE_BRANCH" .
                '''
            }
        }

        stage('Deploy') {
            when { branch 'production' }
            steps {
                sh '''
                    docker rm -f "$APP_NAME" || true
                    docker run -d \
                      --name "$APP_NAME" \
                      --network "$DOCKER_NETWORK" \
                      --restart unless-stopped \
                      -p 127.0.0.1:$DEPLOY_PORT:80 \
                      "$IMAGE_TAG"
                '''
            }
        }

        stage('Health Check') {
            when { branch 'production' }
            steps {
                sh '''
                    for i in $(seq 1 20); do
                      if curl -fsS "http://127.0.0.1:$DEPLOY_PORT/health"; then echo; exit 0; fi
                      sleep 3
                    done
                    docker logs --tail 50 "$APP_NAME"; exit 1
                '''
            }
        }
    }

    post {
        always {
            // `dist/` queda creado por root dentro del contenedor node; limpiarlo para el
            // proximo build.
            sh 'docker run --rm -v "$WORKSPACE:/w" alpine rm -rf /w/dist /w/node_modules >/dev/null 2>&1 || true'
            sh 'docker image prune -f --filter "label=service=$APP_NAME" >/dev/null 2>&1 || true'
        }
    }
}
