# /tmp/superdapp-test-1750417047533-webhook

A SuperDapp AI Agent

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your environment:
   ```bash
   superagent configure
   ```

3. Run the agent:
   ```bash
   npm run dev
   ```

## Configuration

Copy `.env.example` to `.env` and fill in your configuration:

```
API_TOKEN=your_superdapp_api_token
API_BASE_URL=https://api.superdapp.com
```

## Commands

- `npm start` - Run the compiled agent
- `npm run dev` - Run the agent in development mode with hot reload
- `npm run build` - Build the TypeScript code
- `npm run clean` - Clean the build directory

## Development

This agent is built using the SuperDapp Agents SDK. You can extend its functionality by:

1. Adding new command handlers
2. Integrating with external APIs
3. Implementing custom business logic
4. Adding scheduled tasks

## Deployment

Deploy your agent using the SuperDapp CLI:

```bash
superagent deploy
```

## Support

For more information, visit the [SuperDapp documentation](https://docs.superdapp.com).
