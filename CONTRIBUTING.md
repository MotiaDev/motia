---
title: How to Contribute
description: Guide for developers who want to contribute to Motia
---

# How to Contribute

Thank you for your interest in contributing to Motia! We welcome contributions from the community to help make Motia better. Here are some ways you can contribute:

## Local Setup

Before contributing, you’ll need to set up the project locally.

### Prerequisites

- **Node.js** (v16+ recommended)
- **Python** (LTS recommended)
- **pnpm** (for managing the monorepo)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/MotiaDev/motia.git
   cd motia
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```
   
3. Build the project:

   ```bash
   pnpm build
   ```

4. Set up Motia in the playground:

   ```bash
   cd playground
   npx motia install
   ```

5. Set up environment variables:

   - Copy the example `.env` file:
     ```bash
     cp playground/.env.example playground/.env
     ```
   - Update the `.env` file with your credentials and API keys.

6. Start the development environment:

   - Run this command at the root of the project to start workbench

   ```bash
   pnpm dev:workbench
   ```

   This will start:

   - **MotiaCore** (flow orchestrator)
   - **MotiaServer** (HTTP endpoints)
   - **Playground UI** (flow visualization)

   The app runs locally at **[http://localhost:3000](http://localhost:3000)**.

---

## Reporting Issues

If you encounter any bugs, have feature requests, or want to discuss improvements, please [open an issue](https://github.com/MotiaDev/motia/issues) on our GitHub repository. When reporting bugs, please provide detailed information about your environment and steps to reproduce the issue.

## Submitting Pull Requests

We appreciate pull requests for bug fixes, enhancements, or new features. To submit a pull request:

1. Fork the [Motia repository](https://github.com/MotiaDev/motia) on GitHub.
2. Create a new branch from the `main` branch for your changes.
3. Make your modifications and ensure that the code follows our coding conventions.
4. Write tests to cover your changes, if applicable.
5. Commit your changes and push them to your forked repository.
6. Open a pull request against the `main` branch of the Motia repository.

Please provide a clear description of your changes in the pull request, along with any relevant information or context.

## Documentation Improvements

Improving the documentation is a great way to contribute to Motia. If you find any errors, typos, or areas that need clarification, please submit a pull request with the necessary changes. The documentation source files are located in the `packages/docs/content` directory.

## Sharing Examples and Use Cases

If you have built something interesting with Motia or have a real-world use case to share, we would love to showcase it in our [Examples](/docs/examples) section. You can contribute your examples by submitting a pull request to the [Motia Examples repository](https://github.com/MotiaDev/motia-examples).

## Spreading the Word

Help spread the word about Motia by sharing it with your friends, colleagues, and the developer community. You can also star our [GitHub repository](https://github.com/MotiaDev/motia), follow us on [Twitter](https://twitter.com/motiadev), and join our [Discord community](https://discord.gg/nJFfsH5d6v) to stay updated with the latest news and engage with other Motia developers.

We appreciate all forms of contributions and look forward to collaborating with you to make Motia even better!
