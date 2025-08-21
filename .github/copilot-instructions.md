# GitHub Copilot Instructions for SuperDapp JS SDK

## Project Overview

This is the **SuperDapp Agents SDK for Node.js/TypeScript** - a professional-grade SDK and CLI for building AI agents on the SuperDapp platform. The project provides:

- 🎯 **Core SDK**: TypeScript classes and utilities for agent development
- 🛠️ **CLI Tool**: `superagent` command for scaffolding, running, and deploying agents
- 📚 **Templates**: Pre-built agent templates (basic, news, trading)
- 🚀 **Multi-platform Deployment**: Support for Cloudflare Workers, AWS Lambda, Vercel
- 🧪 **Comprehensive Testing**: Jest-based test suite with high coverage

## Architecture & Core Concepts

### Key Components

```
src/
├── cli/           # SuperAgent CLI commands and utilities
├── core/          # Core SDK classes (SuperDappAgent, SuperDappClient)
├── types/         # TypeScript type definitions
├── utils/         # Shared utilities and helpers
├── webhook/       # Webhook handling and agent lifecycle
└── __tests__/     # Comprehensive test suite
```

### Primary Classes

- **`SuperDappAgent`**: Main agent class for handling commands and messages
- **`SuperDappClient`**: HTTP client for SuperDapp API interactions
- **CLI Commands**: Init, configure, run, deploy, status commands

### Command Pattern

Agents use a command-based architecture:
```typescript
// Simple command
agent.addCommand('/ping', async (message, replyMessage, roomId) => {
  await agent.sendConnectionMessage(roomId, 'Pong! 🏓');
});

// General message handler
agent.addCommand('handleMessage', async (message, replyMessage, roomId) => {
  // Process any message that doesn't match specific commands
});
```

## Development Workflow

### Prerequisites
- Node.js >=18.0.0
- TypeScript knowledge
- Understanding of async/await patterns

### Key Scripts
```bash
npm run build         # Build TypeScript to dist/
npm run clean         # Clean build directory
npm run dev           # Watch mode for CLI development
npm test              # Run Jest test suite
npm run test:watch    # Test watch mode
npm run lint          # ESLint checking
npm run lint:fix      # Auto-fix linting issues
npm run format        # Prettier formatting
```

### Local Development
1. Use `npm run dev` for CLI development with hot reload
2. Test changes with `npm test` or `npm run test:watch`
3. Build with `npm run build` before testing distribution
4. Use examples in `/examples` directory for testing

## Code Patterns & Conventions

### TypeScript Standards
- **Strict mode enabled**: All types must be explicit
- **Interface over type**: Use interfaces for object shapes
- **Async/await**: Prefer over Promises for readability
- **Error handling**: Use try/catch with specific error types

### Naming Conventions
- **Files**: kebab-case (`webhook-agent.ts`)
- **Classes**: PascalCase (`SuperDappAgent`)
- **Functions/variables**: camelCase (`sendMessage`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Commands**: slash prefix (`/start`, `/help`)

### Code Structure Patterns

#### Agent Command Handlers
```typescript
// Always async, consistent parameter order
agent.addCommand('/command', async (message, replyMessage, roomId) => {
  // 1. Extract and validate inputs
  const args = message.body.m?.body?.split(' ').slice(1) || [];
  
  // 2. Process business logic
  const result = await processLogic(args);
  
  // 3. Send response
  await agent.sendConnectionMessage(roomId, result);
});
```

#### Error Handling Pattern
```typescript
try {
  await agent.initialize();
} catch (error) {
  if (error.message.includes('API_TOKEN')) {
    console.error('Invalid API token. Run: superagent configure');
  } else {
    console.error('Initialization failed:', error);
  }
}
```

#### CLI Command Structure
```typescript
export class NewCommand extends Command {
  constructor() {
    super('command-name');
    this.description('Command description')
      .option('-o, --option <value>', 'Option description')
      .action(this.execute.bind(this));
  }

  private async execute(options: CommandOptions) {
    // Implementation
  }
}
```

## Testing Guidelines

### Test Structure
- **Unit tests**: Individual functions and classes
- **Integration tests**: API interactions and workflows
- **CLI tests**: Command execution and validation
- **Mock strategy**: Mock external dependencies, test business logic

### Test Patterns
```typescript
describe('FeatureName', () => {
  let instance: ClassUnderTest;

  beforeEach(() => {
    instance = new ClassUnderTest(mockConfig);
  });

  test('should handle specific scenario', async () => {
    // Arrange
    const input = 'test-input';
    
    // Act
    const result = await instance.method(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe('expected-value');
  });
});
```

### Test Environment
- Tests run in isolated environment with mocked dependencies
- Environment variables are mocked in `setup.ts`
- Use `jest.fn()` for mocking functions
- Use `jest.mock()` for mocking modules

## Security Best Practices

### Environment Variables
- **Never commit secrets**: Use `.env` files (gitignored)
- **API tokens**: Always use `API_TOKEN` environment variable
- **Validation**: Use Zod schemas for input validation
- **Rate limiting**: Implement for command handlers

### Input Validation
```typescript
import { z } from 'zod';

const messageSchema = z.object({
  body: z.string().min(1).max(1000),
  type: z.enum(['text', 'command'])
});

// Validate before processing
const validMessage = messageSchema.parse(input);
```

## Local Development Guide

### Setting Up New Features
1. **Create feature branch**: `git checkout -b feat/feature-name`
2. **Add types**: Define TypeScript interfaces in `/types`
3. **Implement core logic**: Add classes/functions in appropriate directories
4. **Write tests**: Add comprehensive test coverage
5. **Update CLI**: Add CLI commands if needed
6. **Test examples**: Verify with example agents

### Debugging Tips
- Use `npm run dev` for CLI debugging with tsx watch
- Use `console.log` statements (removed in production builds)
- Test with example agents in `/examples` directory
- Use Jest's `--verbose` flag for detailed test output

### Common Tasks

#### Adding New CLI Command
1. Create command class in `src/cli/commands/`
2. Extend `Command` class with proper options
3. Add to `src/cli/index.ts`
4. Write tests in `src/__tests__/`

#### Adding New Agent Feature
1. Update `SuperDappAgent` class
2. Add type definitions
3. Update examples
4. Add tests
5. Update documentation

## Remote Agent Development Guide

### Project Templates
Use the CLI to scaffold new agents:
```bash
# Basic agent with essential commands
superagent init my-agent --template basic

# AI-powered news agent
superagent init news-bot --template news

# Crypto trading assistant
superagent init trading-bot --template trading
```

### Agent Development Workflow
1. **Initialize**: `superagent init project-name`
2. **Configure**: `superagent configure` (set API tokens)
3. **Develop**: Implement command handlers and business logic
4. **Test**: Run locally with `superagent run`
5. **Deploy**: `superagent deploy --platform cloudflare`

### Essential Agent Patterns

#### Basic Agent Structure
```typescript
import { SuperDappAgent, createBotConfig } from '@superdapp/agents';

async function main() {
  const agent = new SuperDappAgent(createBotConfig());
  
  // Add commands
  agent.addCommand('/start', async (message, replyMessage, roomId) => {
    await agent.sendConnectionMessage(roomId, 'Hello! I\'m ready to help.');
  });
  
  // Initialize and start
  await agent.initialize();
}
```

#### Advanced Features
- **Scheduled tasks**: Use `node-schedule` for periodic actions
- **State management**: Implement user session tracking
- **External APIs**: Integrate with third-party services
- **Interactive menus**: Create rich user interfaces

## Code Review Guidelines

### What to Look For

#### Code Quality
- ✅ **TypeScript compliance**: No `any` types, proper interfaces
- ✅ **Error handling**: Comprehensive try/catch blocks
- ✅ **Async patterns**: Proper async/await usage
- ✅ **Input validation**: Zod schemas for external inputs
- ✅ **Security**: No hardcoded secrets, proper sanitization

#### Architecture
- ✅ **Separation of concerns**: CLI, core, and utils properly separated
- ✅ **Single responsibility**: Classes and functions have clear purposes
- ✅ **Consistency**: Follows established patterns and conventions
- ✅ **Testability**: Code is designed for easy testing

#### Testing
- ✅ **Coverage**: New features have comprehensive tests
- ✅ **Test quality**: Tests are clear, isolated, and deterministic
- ✅ **Mocking**: External dependencies are properly mocked
- ✅ **Edge cases**: Error conditions and edge cases are tested

#### Documentation
- ✅ **JSDoc comments**: Public APIs are documented
- ✅ **README updates**: Changes are reflected in documentation
- ✅ **Examples**: Complex features have usage examples
- ✅ **Type definitions**: Exports include proper TypeScript types

### Review Checklist

#### For New Features
- [ ] Feature aligns with project architecture
- [ ] TypeScript types are complete and accurate
- [ ] Error handling is comprehensive
- [ ] Tests provide adequate coverage
- [ ] Documentation is updated
- [ ] Examples demonstrate usage
- [ ] Security considerations are addressed

#### For Bug Fixes
- [ ] Root cause is identified and addressed
- [ ] Fix doesn't introduce new issues
- [ ] Tests prevent regression
- [ ] Change is minimal and focused

#### For Refactoring
- [ ] Functionality remains unchanged
- [ ] Code quality is improved
- [ ] Tests continue to pass
- [ ] Breaking changes are avoided

## Common Patterns to Follow

### CLI Development
- Use Commander.js for consistent CLI interface
- Provide interactive prompts with inquirer
- Show progress with ora spinner
- Use chalk for colored output
- Handle errors gracefully with helpful messages

### Agent Development
- Always validate user inputs
- Implement graceful error handling
- Use environment variables for configuration
- Follow command naming conventions (`/command`)
- Provide help and usage information

### API Integration
- Use the provided `SuperDappClient`
- Implement retry logic for network calls
- Log requests for debugging (development only)
- Handle rate limiting appropriately
- Validate API responses

## Deployment Considerations

### Platform Support
- **Cloudflare Workers**: Serverless, edge computing
- **AWS Lambda**: Traditional serverless
- **Vercel**: Full-stack platform

### Build Process
- TypeScript compilation to `dist/`
- Include necessary dependencies in package
- Environment variable configuration
- Platform-specific optimizations

### Security in Production
- Use environment variables for secrets
- Implement proper input validation
- Enable rate limiting
- Use HTTPS for all communications
- Regular dependency updates

## Resources

- **Documentation**: `/docs` directory
- **Examples**: `/examples` directory  
- **Contributing**: `CONTRIBUTING.md`
- **API Reference**: Generated from TypeScript types
- **Templates**: Available via `superagent init --template`

Remember: This SDK prioritizes developer experience, type safety, and production readiness. Always consider these principles when contributing or using the SDK.