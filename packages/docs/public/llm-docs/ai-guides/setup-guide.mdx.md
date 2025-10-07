---
title: "Setup Guide"
description: "How to install and configure Motia AI Development Guides in your project"
---

import { Cards, Card } from 'fumadocs-ui/components/card';
import { Callout } from 'fumadocs-ui/components/callout';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Files, Folder, File } from 'fumadocs-ui/components/files';

# AI Development Guides Setup Guide

This guide will help you install and configure Motia's AI Development Guides in your project. These guides are designed to work with **any AI tool or IDE**—including Cursor, VS Code, Claude, ChatGPT, and more.

<Callout type="info" title="Universal Compatibility">
  Motia's guides are universal and work with any AI tool or IDE—not just Cursor!
</Callout>

## Prerequisites

<Cards>
  <Card title="Node.js 18+" icon="⚡">
    Latest Node.js runtime for CLI tools
  </Card>
  <Card title="Motia Project" icon="🏗️">
    Create one with <code>npx motia@latest create</code>
  </Card>
  <Card title="AI Tool/IDE" icon="🤖">
    Any AI-powered code editor or AI assistant
  </Card>
</Cards>

## Installation Methods

<Tabs items={["CLI (Recommended)", "Manual Setup", "Git Submodule"]}>
  <Tab value="CLI (Recommended)">
    <Steps>
      <Step>
        ### Create a new Motia project
        ```bash
        npx motia@latest create my-motia-app
        cd my-motia-app
        ```
      </Step>
      <Step>
        ### Pull AI development guides
        ```bash
        npx motia@latest rules pull
        ```
        This will create the following in your project root:
        - **AGENTS.md** – Universal AI guide for ANY AI tool or IDE
        - **CLAUDE.md** – Claude-specific guide with advanced techniques
        - **.cursor/rules/** – IDE-specific patterns for Cursor
        - **.claude/** – Claude IDE configurations and commands
      </Step>
    </Steps>
  </Tab>
  <Tab value="Manual Setup">
    <Steps>
      <Step>
        ### Create the Cursor rules directory
        ```bash
        mkdir -p .cursor/rules
        ```
      </Step>
      <Step>
        ### Copy from local installation
        ```bash
        # If you have Motia installed locally or globally
        mkdir -p .cursor/rules

        # Copy Cursor IDE rules
        cp -r node_modules/motia/dist/dot-files/.cursor/rules/* .cursor/rules/

        # Copy AI development guides to project root
        cp node_modules/motia/dist/dot-files/AGENTS.md ./AGENTS.md
        cp node_modules/motia/dist/dot-files/CLAUDE.md ./CLAUDE.md

        # Copy Claude IDE configurations
        cp -r node_modules/motia/dist/dot-files/.claude ./.claude
        ```
        > **Important:** Only copy `.mdc` rule files into `.cursor/rules/`.
        > **CLAUDE.md** should be in your project root, **not** inside `.cursor/rules/`.
      </Step>
      <Step>
        ### Or download from GitHub
        ```bash
        # Download and extract Motia repository
        curl -L https://github.com/MotiaDev/motia/archive/main.zip -o motia.zip
        unzip motia.zip

        # Create directories
        mkdir -p .cursor/rules

        # Copy Cursor IDE rules
        cp -r motia-main/packages/snap/dist/dot-files/.cursor/rules/* .cursor/rules/

        # Copy AI development guides to project root
        cp motia-main/packages/snap/dist/dot-files/AGENTS.md ./AGENTS.md
        cp motia-main/packages/snap/dist/dot-files/CLAUDE.md ./CLAUDE.md

        # Copy Claude IDE configurations
        cp -r motia-main/packages/snap/dist/dot-files/.claude ./.claude

        # Clean up
        rm -rf motia.zip motia-main
        ```
        > **Critical:** Do **not** place AGENTS.md or CLAUDE.md inside `.cursor/rules/`. They belong in project root.
        > The `.claude` folder contains Claude IDE-specific configurations and should be in your project root.
      </Step>
    </Steps>
  </Tab>
  <Tab value="Git Submodule">
    <Callout type="tip" title="For Teams">
      Perfect for teams wanting to stay synchronized with updates
    </Callout>
    <Steps>
      <Step>
        ### Add as submodule
        ```bash
        git submodule add https://github.com/MotiaDev/motia.git .motia-source
        ```
      </Step>
      <Step>
        ### Create symlinks for AI guides and rules
        ```bash
        # Create directories
        mkdir -p .cursor/rules

        # Symlink Cursor IDE rules
        ln -s ../.motia-source/packages/snap/dist/dot-files/.cursor/rules/* .cursor/rules/

        # Copy AI development guides to project root
        cp .motia-source/packages/snap/dist/dot-files/CLAUDE.md ./CLAUDE.md
        cp .motia-source/packages/snap/dist/dot-files/AGENTS.md ./AGENTS.md
        ```
        > **Important:** Do **not** symlink or copy AGENTS.md or CLAUDE.md into `.cursor/rules/`.
        > These files should always be in your project root.
      </Step>
      <Step>
        ### Update AI guides and rules (when needed)
        ```bash
        # Update submodule to latest version
        git submodule update --remote

        # Re-copy AI guides if they were updated
        cp .motia-source/packages/snap/dist/dot-files/CLAUDE.md ./CLAUDE.md
        cp .motia-source/packages/snap/dist/dot-files/AGENTS.md ./AGENTS.md
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Project Structure After Setup

After installation, your project should look like this:

<Files>
  <File name="AGENTS.md">Universal AI guide for ANY AI tool or IDE (project root)</File>
  <File name="CLAUDE.md">Claude-specific guide with advanced techniques (project root)</File>
  <Folder name=".cursor" defaultOpen>
    <Folder name="rules" defaultOpen>
      <File name="complete-application-patterns.mdc">Complete app patterns</File>
      <File name="complete-backend-generator.mdc">Backend generator</File>
      <File name="multi-language-workflows.mdc">JS/TS/Python/Ruby</File>
      <File name="api-steps.mdc">API patterns</File>
      <File name="event-steps.mdc">Event processing</File>
      <File name="authentication-patterns.mdc">Auth patterns</File>
      <File name="background-job-patterns.mdc">Background jobs</File>
      <File name="realtime-streaming.mdc">Real-time features</File>
      <File name="ai-agent-patterns.mdc">AI agents</File>
      <File name="workflow-patterns.mdc">Business workflows</File>
      <File name="production-deployment.mdc">DevOps patterns</File>
      <File name="api-design-patterns.mdc">REST API best practices</File>
      <File name="state-management.mdc">Data persistence patterns</File>
      <File name="testing.mdc">Testing strategies</File>
      <File name="typescript.mdc">TypeScript patterns</File>
      <File name="instructions.mdc">Step modifications</File>
      <File name="architecture.mdc">System architecture</File>
      <File name="cron-steps.mdc">Scheduled tasks</File>
      <File name="noop-steps.mdc">Workflow connections</File>
      <File name="ui-steps.mdc">Custom UI components</File>
    </Folder>
  </Folder>
  <Folder name=".claude">
    <File name="CLAUDE.md">Claude-specific guide</File>
    <Folder name="commands">Command templates and patterns</Folder>
    <Folder name="agents">AI agent configurations</Folder>
    <Folder name="hooks">Pre/post-deployment scripts</Folder>
    <File name="settings.json">Claude IDE settings</File>
  </Folder>
  <Folder name="steps">
    <File name="...">Your Motia workflow steps</File>
  </Folder>
  <File name="package.json">Project dependencies</File>
  <File name="config.yml">Motia configuration</File>
</Files>

> **Important:**
> - **AGENTS.md** and **CLAUDE.md** should be in your project root, **not** inside `.cursor/rules/`.
> - The **`.claude`** folder should be in your project root and contains Claude IDE configurations.
> - Only `.mdc` rule files go inside `.cursor/rules/`.

## Configuration for Different AI Tools

### Cursor IDE Setup

1. **Open your project in Cursor.**
2. Cursor will automatically detect the `.cursor/rules/` directory and use the `.mdc` rule files for suggestions.
3. Reference **AGENTS.md** (in your project root) for universal patterns and guidance.
4. Use **CLAUDE.md** for Claude-specific advanced techniques.

### VS Code with GitHub Copilot

1. **Install the GitHub Copilot extension.**
2. Open **AGENTS.md** in VS Code to understand available patterns.
3. Reference specific guides in your prompts to Copilot.
4. Use **CLAUDE.md** patterns when working with Claude.

### Claude AI Assistant

1. Open **CLAUDE.md** (from your project root)—this is specifically designed for Claude.
2. Copy relevant sections into your Claude conversations.
3. Reference **AGENTS.md** for broader architectural guidance.
4. Use the structured templates provided in **CLAUDE.md**.

### ChatGPT or Other AI Tools

1. Start with **AGENTS.md**—it's universal for all AI tools.
2. Copy relevant patterns into your AI conversations.
3. Reference specific Cursor rules (`.mdc` files) as needed.
4. Adapt the patterns to your AI tool's prompt format.

## Sharing AI Guides with Team Members

<Callout type="info" title="Easy Sharing Methods">
  Once AI guides are set up in your project, sharing them with team members is straightforward.
</Callout>

<Tabs items={["Git Commit", "Shared Drive", "NPM Package"]}>
  <Tab value="Git Commit">
    ### Commit to Your Repository
    ```bash
    # Add AI guides to your repository
    git add AGENTS.md CLAUDE.md .cursor/

    # Commit with descriptive message
    git commit -m "feat: add Motia AI development guides and Cursor rules

    - AGENTS.md: Universal AI guide for all AI tools and IDEs
    - CLAUDE.md: Claude-specific advanced techniques
    - .cursor/rules/: IDE-specific patterns for Cursor

    These guides enable one-shot complete backend development
    using proven Motia architectural patterns."

    # Push to your repository
    git push origin main
    ```

    **Benefits:**
    - Automatic distribution to all team members
    - Version control with your project
    - No additional setup required for new developers
  </Tab>

  <Tab value="Shared Drive">
    ### Share via Company Drive
    ```bash
    # Create a shared package
    mkdir motia-ai-development-guide-v1.0.0
    cp AGENTS.md motia-ai-development-guide-v1.0.0/
    cp CLAUDE.md motia-ai-development-guide-v1.0.0/
    cp -r .cursor motia-ai-development-guide-v1.0.0/

    # Create setup script
    cat > motia-ai-development-guide-v1.0.0/setup.sh << 'EOF'
    #!/bin/bash
    echo "Setting up Motia AI Development Guides..."

    # Copy to current directory
    cp AGENTS.md ./AGENTS.md
    cp CLAUDE.md ./CLAUDE.md
    cp -r .cursor ./ 2>/dev/null || mkdir -p .cursor && cp -r .cursor/rules .cursor/

    echo "✅ AI guides installed successfully!"
    echo "📖 Open AGENTS.md to get started"
    EOF

    chmod +x motia-ai-development-guide-v1.0.0/setup.sh
    ```
  </Tab>

  <Tab value="NPM Package">
    ### Create Team NPM Package
    ```json
    // team-motia-guides/package.json
    {
      "name": "@yourcompany/motia-ai-development-guide",
      "version": "1.0.0",
      "description": "Motia AI Development Guides and Cursor Rules",
      "main": "index.js",
      "scripts": {
        "install": "node setup.js"
      },
      "files": [
        "AGENTS.md",
        "CLAUDE.md",
        ".cursor/"
      ]
    }
    ```

    ```javascript
    // team-motia-guides/setup.js
    const fs = require('fs');
    const path = require('path');

    console.log('🚀 Installing Motia AI Development Guides...');

    // Copy AGENTS.md
    if (fs.existsSync(path.join(__dirname, 'AGENTS.md'))) {
      fs.copyFileSync(path.join(__dirname, 'AGENTS.md'), './AGENTS.md');
      console.log('✅ AGENTS.md installed');
    }

    // Copy CLAUDE.md
    if (fs.existsSync(path.join(__dirname, 'CLAUDE.md'))) {
      fs.copyFileSync(path.join(__dirname, 'CLAUDE.md'), './CLAUDE.md');
      console.log('✅ CLAUDE.md installed');
    }

    // Copy .cursor rules
    const cursorSrc = path.join(__dirname, '.cursor');
    if (fs.existsSync(cursorSrc)) {
      const cursorDest = './.cursor';
      if (!fs.existsSync(cursorDest)) {
        fs.mkdirSync(cursorDest, { recursive: true });
      }
      fs.cpSync(cursorSrc, cursorDest, { recursive: true });
      console.log('✅ Cursor rules installed');
    }

    console.log('');
    console.log('🎉 Installation complete!');
    console.log('📖 Open AGENTS.md to start building with AI');
    ```
  </Tab>
</Tabs>

## Verification

Test that AI guides are set up correctly:

<Steps>
  <Step>
    ### Verify AI development guides
    ```bash
    # Check if guides exist in project root
    ls -la AGENTS.md CLAUDE.md

    # Verify content (should not be empty)
    wc -l AGENTS.md CLAUDE.md
    ```
  </Step>

  <Step>
    ### Verify Cursor rules
    ```bash
    # Check Cursor rules directory
    ls -la .cursor/rules/

    # Count number of rule files
    ls .cursor/rules/*.mdc | wc -l
    ```
  </Step>

  <Step>
    ### Test CLI commands
    ```bash
    # Test rules list command
    npx motia@latest rules list

    # Test showing guides
    npx motia@latest rules show agents
    npx motia@latest rules show claude

    # Test showing a specific rule
    npx motia@latest rules show api-steps
    ```
  </Step>

  <Step>
    ### Verify file integrity
    ```bash
    # Check file sizes (should be > 0)
    ls -lh AGENTS.md CLAUDE.md .cursor/rules/*.mdc

    # Verify no empty files
    find .cursor/rules/ -name "*.mdc" -size 0
    ```
  </Step>

  <Step>
    ### Test in your IDE
    ```bash
    # Open your project in Cursor/VS Code
    # The .cursor/rules/ should be automatically detected
    # Try creating a new step file and see if patterns appear
    ```
  </Step>
</Steps>

<Callout type="success" title="Setup Complete!">
  If all verification steps pass, you're ready to start building with AI-powered development!
</Callout>
