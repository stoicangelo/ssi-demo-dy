#!/bin/bash
modify_run_docker() {
    # Define the path to the acapy directory and run_docker file
    ACAPY_DIR="../ssi/acapy"
    RUN_DOCKER_FILE="$ACAPY_DIR/scripts/run_docker"

    # Check if the acapy directory exists
    if [ -d "$ACAPY_DIR" ]; then
        echo "Directory $ACAPY_DIR exists."

        # Check if the run_docker file exists
        if [ -f "$RUN_DOCKER_FILE" ]; then
            echo "File $RUN_DOCKER_FILE found. Proceeding with modifications."

            # Backup the original run_docker file
            cp "$RUN_DOCKER_FILE" "$RUN_DOCKER_FILE.bak"
            echo "Backup created: $RUN_DOCKER_FILE.bak"

            # Replace the last line with the modified command
            sed -i '' 's|\$CONTAINER_RUNTIME run -rm -ti|$CONTAINER_RUNTIME run --rm|' "$RUN_DOCKER_FILE"

            echo "Modifications completed successfully."
        else
            echo "File $RUN_DOCKER_FILE does not exist. Exiting."
            exit 1
        fi
    else
        echo "Directory $ACAPY_DIR does not exist. Exiting."
        exit 1
    fi
}


# Call the modify_run_docker function
echo "Preparing deployment setup..."
modify_run_docker
echo "Preparation complete!"
