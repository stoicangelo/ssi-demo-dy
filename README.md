
# Project Name: SSI agent interactions

## Overview
This demoo purpose project implements a clinical and overview system to handle issuance presentation exchange and verification using the Aries Cloud Agent (ACA-Py). It supports vanilla configurations for digital identity management, including custom attributes, predicates, and  lineaer Docker-based deployment, assuming the Holder cloud Aget as an edge agent

The repository includes a basic custom controller api services to manage different aspects of the system, from credential issuance to proof verification, designed to work with the just an ACAPy running aries agent. ACA-Py framework. 


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
   ./scripts/start-holder-all.sh
   ```

Ensure all services are running before proceeding to use the system.

---

## Usage
### API Endpoints
The project includes a comprehensive API layer for interacting with ACA-Py. Some key endpoints include:
- **Get Presentation Records**: Retrieve all presentation exchange records.
- **Verify Presentation**: Verify a presentation record from Holder.
- **Issue Credential**: Request Issuance a new credential to an Issuer open portal.

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

2. **ACA-Py Errors**:
   Verify ACA-Py scripts and configurations are updated as instructed above.

For additional assistance, raise an issue in the repository with a detailed description.

---

## License
This project is licensed under the [MIT License](LICENSE).
