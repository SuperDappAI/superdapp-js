# SuperDapp Examples

This directory contains example implementations of SuperDapp agents with different levels of complexity.

## Examples

### Basic Example (`basic/`)

A simple agent with basic commands and image sending functionality.

**Features:**

- Basic commands (`/start`, `/ping`, `/help`)
- Interactive menu with buttons
- Image sending to channels
- Message handling

### Advanced Example (`advanced/`)

A comprehensive agent with advanced features including scheduled tasks and image sending.

**Features:**

- All basic features
- User subscriptions
- Scheduled notifications
- Crypto price simulation
- Portfolio management

## Image Functionality

Both examples include image sending functionality that allows you to send images to SuperDapp channels programmatically.

### How It Works

The image sending functionality:

1. Reads a local image file from the provided path
2. Creates a file stream from the image
3. Sends the image to the specified channel using `agent.sendChannelImage()`
4. Provides feedback to the user

### Programmatic Usage

Images are sent programmatically using the agent's `sendChannelImage` method:

```typescript
// Example: Send an image to a channel
const imagePath = './path/to/your/image.png'; // Provide a valid image path
const channelId = 'your_channel_id_here';
await agent.sendChannelImage(channelId, imagePath, 'Optional caption');
```

### Error Handling

The examples include proper error handling for:

- Missing image files
- File system errors

### Customization

You can easily customize the image functionality by:

- Changing the image file path
- Modifying the caption text
- Adding different image formats support
- Implementing dynamic image generation

## Running the Examples

1. **Basic Example:**

   ```bash
   cd examples/basic
   npm install
   npm start
   ```

2. **Advanced Example:**
   ```bash
   cd examples/advanced
   npm install
   npm start
   ```

## Environment Variables

Make sure to set up your environment variables in a `.env` file:

```
WEBHOOK_SECRET=your_webhook_secret_here
PORT=3000  # or 3001 for advanced example
```

## Notes

- Provide a valid path to an image file when using the image sending functionality.
- Channel IDs should be valid SuperDapp channel identifiers.
- The image sending functionality requires proper file system permissions.
- Image sending is done programmatically using the agent's `sendChannelImage` method, not through commands.
