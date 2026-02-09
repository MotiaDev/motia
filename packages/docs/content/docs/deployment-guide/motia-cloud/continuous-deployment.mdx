---
title: Continuous Deployment
description: Move faster with continuous deployment
---

This guide helps creating a continuous deployment pipeline for your Motia project.

## Before you start

Before you create your pipeline, you first need to have deployed your project to Motia Cloud.
Check the [Deployment](/docs/deployment-guide/motia-cloud/deployment) page for more information.

## Adding the Environment ID

After you have deployed your project to Motia Cloud, you need to add the environment ID to your pipeline.
You can find the environment ID in the Motia Cloud web interface by navigating to the Environment page and
clicking on the Settings tab.

## Creating an API Key

When you open Motia Cloud, you should see API Keys tab. Click on the Create API Key button to create a new API Key.
Copy the API Key and add it to your project [as a secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
Do NOT paste the API Key content to your workflow file.

## Populating Environment Variables

Add all environment variables you need on your project to [repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets),
then make sure to update `Create Env file` section in the workflow file.

## Using GitHub Actions

You can use GitHub Actions to deploy your Motia project to Motia Cloud.

```yaml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      versionName:
        description: 'Version Name to deploy'
        required: true
      versionDescription:
        description: 'Version Description to deploy'
        required: true

env:
  # Add your API Key as a Secret in your Repository (Do NOT add it here)
  # https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
  MOTIA_API_KEY: ${{ secrets.MOTIA_API_KEY }}
  # Fill your environment ID here
  MOTIA_ENV_ID: __FILL YOUR ENVIRONMENT ID HERE__

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.release.tag_name || github.ref }}

      - name: Set VERSION_NAME and DESCRIPTION
        id: meta
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "VERSION_NAME=${{ github.event.inputs.versionName }}" >> $GITHUB_ENV
            echo "VERSION_DESCRIPTION=${{ github.event.inputs.versionDescription }}" >> $GITHUB_ENV
          else
            echo "VERSION_NAME=${GITHUB_SHA::7}" >> $GITHUB_ENV
            echo "VERSION_DESCRIPTION=${{ github.event.head_commit.message }}" >> $GITHUB_ENV
          fi

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      - name: Install dependencies
        run: npm ci

      # Replace MY_SECRET with your secret
      # Add as many as you need
      # https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
      - name: Create Env file
        run: |
          echo "MY_SECRET=${{ secrets.MY_SECRET }}" > .env

      - name: Deploy using Motia Cloud
        run: |
          npx motia cloud deploy \
            --api-key ${{ env.MOTIA_API_KEY }} \
            --environment-id ${{ env.MOTIA_ENV_ID }} \
            --version-name "${{ env.VERSION_NAME }}" \
            --version-description "${{ env.VERSION_DESCRIPTION }}" \
            --env-file .env
```