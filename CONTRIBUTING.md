# Contributing to SuperDapp JS SDK

Thank you for your interest in contributing to the SuperDapp JS SDK! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/superdapp-js.git
   cd superdapp-js
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your SuperDapp API credentials
   ```

## Development Workflow

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Code Quality
```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Fix linting errors
npm run format        # Format code with Prettier
```

### Building
```bash
npm run build         # Build the project
npm run clean         # Clean build directory
```

### CLI Development
```bash
npm run cli -- init my-agent    # Test CLI commands
```

## Code Style

- Use TypeScript for all code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write tests for new features

## Commit Guidelines

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add support for scheduled messages
fix: resolve message parsing issue
docs: update API documentation
```

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

4. Create a Pull Request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots if applicable
   - Updated documentation

## Testing

- Write unit tests for all new functions
- Write integration tests for API interactions
- Ensure all tests pass before submitting
- Maintain or improve code coverage

## Documentation

- Update README.md if needed
- Add JSDoc comments for new APIs
- Update examples if behavior changes
- Create guides for complex features

## Issue Reporting

When reporting issues, include:
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Relevant code snippets
- Error messages

## Feature Requests

For feature requests, please:
- Check existing issues first
- Describe the use case
- Provide examples of desired API
- Explain the benefits

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## Getting Help

- Check the documentation first
- Search existing issues
- Join our Discord community
- Ask questions in discussions

## Release Process

Releases are automated through GitHub Actions:
1. Merge to `develop` triggers staging deployment
2. Merge to `main` triggers production deployment and NPM publish
3. Version bumps use semantic versioning

Thank you for contributing to SuperDapp JS SDK!
