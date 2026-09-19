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