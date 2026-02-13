#!/bin/bash
# ============================================
# Vault API - Kubernetes Deployment Script
# ============================================

set -e

NAMESPACE="vault"
IMAGE_NAME="vault-api"
IMAGE_TAG="latest"

echo "🚀 Deploying Vault API to Kubernetes..."

# Step 1: Build Docker image
echo ""
echo "📦 Step 1: Building Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# If using Minikube, load image into Minikube's Docker daemon:
# eval $(minikube docker-env)
# docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# If pushing to a registry (GitHub Container Registry):
# docker tag ${IMAGE_NAME}:${IMAGE_TAG} ghcr.io/dedsecwatch-ally/vault:${IMAGE_TAG}
# docker push ghcr.io/dedsecwatch-ally/vault:${IMAGE_TAG}

# Step 2: Apply Kubernetes manifests
echo ""
echo "☸️  Step 2: Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo ""
echo "✅ Deployment complete!"
echo ""

# Step 3: Check status
echo "📊 Pod status:"
kubectl get pods -n ${NAMESPACE}
echo ""
echo "🌐 Service:"
kubectl get svc -n ${NAMESPACE}
echo ""
echo "---"
echo "Useful commands:"
echo "  kubectl logs -f -n ${NAMESPACE} -l app=vault-api    # View logs"
echo "  kubectl get pods -n ${NAMESPACE}                     # Check pods"
echo "  kubectl port-forward -n ${NAMESPACE} svc/vault-api-service 3000:80  # Access locally"
echo ""
echo "🔗 After port-forward, test at: http://localhost:3000/health"
