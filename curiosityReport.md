# Curiosity Report: Docker Image Vulnerability Scanning

## Why I Was Curious

While learning about Docker, I became curious about how developers know
whether the software inside a Docker image is secure. A Docker image can
contain much more than just the code written by the developer. It can
also include an operating system, libraries, Node.js, and other packages.

I wanted to learn how Docker can identify vulnerabilities in those
dependencies, so I experimented with Docker Scout.

## What I Learned About Docker Scout

Docker Scout is a Docker tool that analyzes container images and looks
for known security vulnerabilities.

Instead of only examining my application's source code, Docker Scout
looks at the software packages contained inside the Docker image. It can
then compare those packages against known vulnerabilities.

This is useful in DevOps because an application can contain a vulnerable
dependency even if the developer did not directly write that code.

Source:
https://docs.docker.com/scout/

## Current State of the Technology

Container vulnerability scanning is commonly included as part of modern
DevOps and CI/CD workflows. Images can be scanned before they are
deployed so developers can discover vulnerable dependencies earlier.

Docker Scout is one tool that can perform this type of scanning directly
with Docker images.

## My Experiment

For my experiment, I built a simple Docker image using Node.js and then scanned it with Docker Scout.

I first used docker scout quickview to get an overview of the image and its security status. I then used docker scout cves to see the specific vulnerabilities that were found.

This experiment helped me see how Docker Scout can identify security issues inside an image before it is deployed.

## Detailed Reproduction Instructions

The following steps can be used to reproduce my Docker Scout experiment.

### Prerequisites

Before starting, you will need:

- Docker Desktop installed and running
- Docker Scout available through Docker Desktop
- A terminal
- The JWT Pizza project downloaded or cloned to your computer

You can verify that Docker and Docker Scout are available by running:

```bash
docker --version
docker scout version
```

If Docker Scout requires authentication, sign in with:

```bash
docker login
```

### 1. Open the JWT Pizza Project

In the terminal, navigate to the root directory of the JWT Pizza project:

```bash
cd jwt-pizza
```

### 2. Create the Dockerfile

Create a file named `Dockerfile` in the root of the project.

Add the following code:

```dockerfile
FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
```

This Dockerfile uses Node.js as the base image, installs the project's dependencies, and copies the JWT Pizza project into the Docker image.

### 3. Build the Docker Image

From the same directory as the Dockerfile, run:

```bash
docker build -t curiosity-docker .
```

The `-t curiosity-docker` option gives the image the name `curiosity-docker`.

### 4. Run Docker Scout Quickview

After the image finishes building, run:

```bash
docker scout quickview curiosity-docker
```

This displays an overview of the image, including information about packages and known vulnerabilities.

### 5. View the Vulnerabilities

To see more detailed information about the vulnerabilities Docker Scout found, run:

```bash
docker scout cves curiosity-docker
```

Docker Scout will display the known CVEs associated with packages found inside the image.

### 6. Compare the Results

I recorded the vulnerability information reported by `quickview` and then used the `cves` command to examine the individual vulnerabilities in more detail.

Someone following these instructions should be able to build the same Docker image and perform the same Docker Scout scan. The exact number of vulnerabilities may change over time as new vulnerabilities are discovered and vulnerability databases are updated.