
# Project Name: ACA-Py Integrated Presentation Management System

## Overview
This project implements a robust and modular system to handle presentation exchange and verification using the Aries Cloud Agent (ACA-Py). It supports advanced configurations for digital identity management, including custom attributes, predicates, and streamlined Docker-based deployment.

The repository includes multiple services to manage different aspects of the system, from credential issuance to proof verification, designed to work seamlessly with the ACA-Py framework.

---

## Prerequisites
Ensure the following dependencies are installed on your system:
1. **Docker** and **Docker Compose**
2. **Git**
3. **Node.js** (for custom controllers or webhooks)
4. **ACA-Py repository** (cloned into the project as detailed below)

---

## Setup Instructions

### 1. Clone the Repository
First, clone this repository into your local machine:
```bash
git clone <repo_url>
cd <project_directory>
```

### 2. Clone the Official ACA-Py Repository
In the root directory of this project, clone the official ACA-Py GitHub repository:
```bash
git clone https://github.com/hyperledger/aries-cloudagent-python.git ./ssi/acapy
```

This directory is `.gitignored` and runs separately from the main system.

---

### 3. Modify ACA-Py Scripts
Navigate to the ACA-Py `scripts` directory:
```bash
cd ./ssi/acapy/scripts
```

#### a. Update the `run_docker.sh` Script
Locate the line in the `run_docker.sh` script that resembles the following:
```bash
$CONTAINER_RUNTIME run --rm -ti --platform linux/amd64 $ARGS aries-cloudagent-run "${ACAPY_ARGUMENTS[@]}"
```

Modify it to:
```bash
$CONTAINER_RUNTIME run --rm --platform linux/amd64 $ARGS aries-cloudagent-run "${ACAPY_ARGUMENTS[@]}"
```

#### b. Linux-Specific Modification
If running on a Linux machine, replace all occurrences of `host.docker.internal` in the scripts with:
```bash
echo "Private IP: $(hostname -I | awk '{print $1}'), Public IP: $(curl -s ifconfig.me)"
```

This ensures proper networking configurations for Docker on Linux systems.

---

### 4. Start the System Components
Run the following scripts in separate terminal sessions from the root directory to start the respective services:

1. **Issuer Service**:
   ```bash
   ./scripts/start-issuer-all.sh
   ```

2. **Verifier Service**:
   ```bash
   ./scripts/start-verifier-all.sh
   ```

3. **Mediator Service**:
   ```bash
   ./scripts/start-mediator-all.sh
   ```

Ensure all services are running before proceeding to use the system.

---

## Usage
### API Endpoints
The project includes a comprehensive API layer for interacting with ACA-Py. Some key endpoints include:
- **Get Presentation Records**: Retrieve all presentation exchange records.
- **Verify Presentation**: Verify a specific presentation exchange record.
- **Issue Credential**: Issue a new credential to a holder.

Refer to the individual service directories for detailed API documentation and examples.

### Key Features
- **Dynamic Predicate Handling**: Supports flexible verification of attributes and predicates.
- **Revealed/Unrevealed Attributes**: Configures revealed and unrevealed attributes dynamically for presentation requests.
- **Integration with ACA-Py**: Directly integrates with the ACA-Py framework for seamless agent management.

---

## Development Guidelines
### Code Structure
- **Controller Services**: Located in `./src`, starting point defined in `src/index.js`.
- **Shared ACA-Py Client**: Available at `./common/agent/acaPyClient.js` for shared client-side communication with ACA-Py.
- **ACA-Py Repository**: Managed in `./ssi/acapy` and isolated from the main system.

### Contribution
- Submit pull requests adhering to the repository's code and commit guidelines.
- Ensure all scripts are executable on Linux and macOS environments.

---

## Troubleshooting
### Common Issues
1. **Networking on Linux**:
   Ensure the `host.docker.internal` replacement is applied correctly if using Linux.

2. **Docker Errors**:
   Confirm Docker and Docker Compose versions are compatible with the project setup.

3. **ACA-Py Errors**:
   Verify ACA-Py scripts and configurations are updated as instructed above.

For additional assistance, raise an issue in the repository with a detailed description.

---

## License
This project is licensed under the [MIT License](LICENSE).
