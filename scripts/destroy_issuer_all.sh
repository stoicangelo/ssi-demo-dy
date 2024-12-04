#!/bin/bash

# Function to stop and remove ACA-Py agent
stop_acapy_agent() {
  echo "Stopping ACA-Py agent..."

  # Find the ACA-Py container
  ACAPY_CONTAINER=$(docker ps -qf "name=aries-cloudagent-runner-issuer")

  if [ -n "$ACAPY_CONTAINER" ]; then
    docker stop "$ACAPY_CONTAINER"
    echo "ACA-Py agent stopped and removed."
  else
    echo "No running ACA-Py agent found."
  fi
}

# Function to tear down issuer services
tear_down_docker_services() {
  echo "Tearing down Docker services for issuer..."

  # Stop and remove Docker Compose services
  docker-compose -f scripts/docker-compose-issuer.yaml down -v
  echo "Issuer services stopped and resources removed."
}

# Function to remove dangling Docker resources
clean_docker_resources() {
  echo "Cleaning up unused Docker resources..."

  # Remove dangling images
  docker image prune -f

  # Remove unused volumes
  docker volume prune -f

  # Remove unused networks
  docker network prune -f

  echo "Unused Docker resources cleaned up."
}

# Main script execution
echo "Tearing down issuer resources..."
stop_acapy_agent
tear_down_docker_services
clean_docker_resources
echo "All issuer resources have been successfully torn down!"
