#!/bin/bash

# Function to check if a service is running
check_service() {
    local service_name=$1

    echo "Checking if $service_name is running..."

    # Check if the service is up
    service_status=$(docker inspect -f '{{.State.Status}}' "$service_name" 2>/dev/null)

    if [ "$service_status" == "running" ]; then
        echo "$service_name is running."
        return 0
    else
        echo "Warning: $service_name is not running."
        return 1
    fi
}

# Check all services passed as arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <service_name> [<service_name> ...]"
    exit 1
fi

success_count=0
failure_count=0

for service in "$@"; do
    if check_service "$service"; then
        ((success_count++))
    else
        ((failure_count++))
    fi
done

echo ""
echo "Summary:"
echo "Services running: $success_count"
echo "Services not running: $failure_count"

if [ $failure_count -eq 0 ]; then
    echo "All specified services are running."
else
    echo "Some services are not running. Please check their status."
fi
