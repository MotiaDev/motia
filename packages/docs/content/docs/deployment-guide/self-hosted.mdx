---
title: Self-Hosted Deployment
description: Learn how to deploy your Motia project to production using motia-docker
---

We provide a docker image that you can use to deploy your Motia project to production. You can use it as a base image and add your own customizations or use it as is.

<Callout type="warn">You will need to use the latest version of the motia package **0.5.2-beta.101 or higher**</Callout>

## Quick setup

<Steps>
<Step>
#### Setup your motia project

```bash
npx motia@latest docker setup
```

</Step>
<Step>
#### Run your motia project inside a container

```bash
npx motia@latest docker run
```

  </Step>
  <Step>
#### You are good to go, your project should be running on localhost under port 3000, for additional options and configuration run

```bash
npx motia@latest docker run --help
```

  </Step>
</Steps>

> Reference the [CLI](/docs/concepts/cli#docker) for more information on the docker commands.

## Using the docker image

You will need to implement your own Dockerfile where you will use the motia-docker image as a base image. Use the following template as a starting point for your Dockerfile:

```dockerfile
# NOTE: Some cloud providers will require you to specify the platform to match your target architecture
# i.e.: AWS Lightsail requires arm64, therefore you update your FROM statement to: FROM --platform=linux/arm64 motiadev/motia:latest
FROM motiadev/motia:latest

# Install Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Move application files
COPY . .

# Enable the following lines if you are using python steps!!!
# Setup python steps dependencies
# RUN npx motia@latest install

# Expose outside access to the motia project
EXPOSE 3000

# Run your application
CMD ["npm", "run", "start"]
```

<Callout type="info">
  Depending on the cloud provider you will use to deploy your Motia project, you will need to adjust the exposed ports
  and the command to start your application.
</Callout>

## Create a .dockerignore file

Create a .dockerignore file in the root of your project to exclude files that are not needed in the docker image. You can use the following template as a starting point for your .dockerignore file:

```bash
# Git
.git
.gitignore

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/

# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Local development
.env

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

## Build your image

```bash
docker build -t <your-image-name> .
```

## Run your Motia application

Once you've built your image, you can run it using the following command:

```bash
docker run -it --rm -p 3000:3000 <your-image-name>
```

## Motia Docker Resources

- [Docker Registry](https://hub.docker.com/r/motiadev/motia)
- [Github Repo](https://github.com/MotiaDev/motia/packages/docker)
- [Example Motia project with deployment boilerplate for AWS LightSail and Railway](https://github.com/MotiaDev/motia-examples/tree/main/examples/motia-docker)
