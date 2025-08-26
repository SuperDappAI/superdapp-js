# Development Guide

## Local Development Setup

When developing the SuperDapp Agents SDK locally, you need to link the package so that projects created with the CLI can use the local version instead of trying to download from npm.

### Step 1: Link the package globally

From the root of the superdapp-js project:

```bash
# Build the project
npm run build

npm link
```

This creates a global symlink to your local package.

### Step 2: Link the package in your test project

When you create a new project with the CLI and want to use the local version:

```bash
# Create a new project
superagent create my-test-project --yes

# Navigate to the project
cd my-test-project

# Link the local package
npm link @superdapp/agents

# Install other dependencies
npm install
```

### Step 3: Verify the link

You can verify that the link is working by checking:

```bash
ls -la node_modules/@superdapp/
```

You should see a symlink pointing to your local development directory.

### Step 4: Unlink when done

When you're done testing, you can unlink the package:

```bash
# In your test project
npm unlink @superdapp/agents

# Reinstall from npm (when the package is published)
npm install @superdapp/agents
```

### Troubleshooting

If you encounter issues:

1. **Package not found**: Make sure you ran `npm link` from the superdapp-js root directory
2. **Build errors**: Make sure the superdapp-js project is built (`npm run build`)
3. **TypeScript errors**: Check that the types are properly exported from the main package

### Alternative: Using file: dependency

For more permanent local development, you can also modify the generated `package.json` to use a file dependency:

```json
{
  "dependencies": {
    "@superdapp/agents": "file:../superdapp-js"
  }
}
```

However, `npm link` is the recommended approach as it's more flexible and doesn't require modifying generated files.
