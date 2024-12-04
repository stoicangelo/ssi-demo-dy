#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")" || exit 1

# ACA-Py container name
ACAPY_CONTAINER_NAME="acapy-verifier-server"
ACAPY_LISTENING_ENDPOINT_PORT=8050
ACAPY_ADMIN_PORT=8051

WEBHOOK_PORT=3002

# Start ACA-Py server in the background without logs
echo "Starting ACA-Py server in the background using the official ACA-Py binary..."
cd ../acapy || exit 1

AGENT_SUFFIXNAME="verifier" PORTS="$ACAPY_LISTENING_ENDPOINT_PORT:$ACAPY_LISTENING_ENDPOINT_PORT $ACAPY_ADMIN_PORT:$ACAPY_ADMIN_PORT" ./scripts/run_docker start \
  --endpoint http://host.docker.internal:$ACAPY_LISTENING_ENDPOINT_PORT \
  --label Verifier1.agent \
  --inbound-transport http 0.0.0.0 $ACAPY_LISTENING_ENDPOINT_PORT \
  --outbound-transport http \
  --admin 0.0.0.0 $ACAPY_ADMIN_PORT \
  --admin-insecure-mode \
  --wallet-type askar \
  --wallet-name Verifier1.agent001 \
  --wallet-key Verifier1.key001 \
  --preserve-exchange-records \
  --auto-provision \
  --genesis-url http://greenlight.bcovrin.vonx.io/genesis \
  --auto-accept-invites \
  --auto-accept-requests \
  --auto-ping-connection \
  --seed 00000000000000000000000Verifier1 \
  --public-invites \
  --log-level info \
  --webhook-url http://host.docker.internal:$WEBHOOK_PORT/webhook &





# Store the PID of the ACA-Py process
ACAPY_PID=$!
echo "ACA-Py server started in the background with PID $ACAPY_PID."

# Wait for ACA-Py to become healthy
echo "Waiting for ACA-Py admin API at http://localhost:$ACAPY_ADMIN_PORT..."
until curl -s http://localhost:$ACAPY_ADMIN_PORT/status > /dev/null; do
  echo "Waiting for ACA-Py admin API at http://localhost:$ACAPY_ADMIN_PORT..."
  sleep 5
done
echo "ACA-Py server is up and running!"

# Navigate back to the main directory
cd .. || exit 1

# Start dependent services using Docker Compose
echo "Starting dependent services from docker-compose..."
# docker-compose -f scripts/docker-compose_verifier.yaml up -d --build verifier-controller verifier-webhook verifier-db
AGENT_SUFFIXNAME=$AGENT_SUFFIXNAME ACAPY_ADMIN_PORT=$ACAPY_ADMIN_PORT docker-compose -f scripts/docker-compose-verifier.yaml up -d --build verifier-controller verifier-db

# Wait for dependent services to be healthy
echo "Waiting for dependent services to be ready..."
./scripts/wait_for_services.sh verifier-db verifier-controller

echo "All services, including ACA-Py and dependent components, are now running!"

docker restart verifier-controller

# Optional: Print a reminder to stop the ACA-Py process manually when needed
echo "To stop the ACA-Py server, use: kill $ACAPY_PID"
