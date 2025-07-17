# Example Calculator MCP Server

A simple Model Context Protocol (MCP) server that provides basic calculator tools. This server demonstrates how to create MCP tools and can be used as a template or for testing MCP deployment systems.

## Features

This MCP server provides the following calculator tools:

- **add** - Add two numbers together
- **subtract** - Subtract second number from first number  
- **multiply** - Multiply two numbers
- **divide** - Divide first number by second number (with zero division protection)
- **power** - Raise first number to the power of second number
- **sqrt** - Calculate square root of a number (with negative number protection)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Running the Server

**HTTP Server (recommended for deployment):**
```bash
npm start
# or explicitly
npm run start:http
```

**Stdio Server (for Claude Desktop and local use):**
```bash
npm run start:stdio
```

**Development modes:**
```bash
npm run dev          # HTTP server with auto-reload
npm run dev:stdio    # Stdio server with auto-reload
```

The HTTP server runs on port 8000 by default and includes:
- SSE endpoint at `/sse` for MCP communication
- Health check at `/health` 
- Server info at `/`

The stdio version is for direct integration with Claude Desktop and other local MCP clients.

### Example Tool Calls

When connected to an MCP client, you can use these tools:

**Addition:**
```json
{
  "tool": "add",
  "arguments": {
    "a": 5,
    "b": 3
  }
}
```
Result: "5 + 3 = 8"

**Division:**
```json
{
  "tool": "divide", 
  "arguments": {
    "a": 10,
    "b": 2
  }
}
```
Result: "10 ÷ 2 = 5"

**Power:**
```json
{
  "tool": "power",
  "arguments": {
    "base": 2,
    "exponent": 3
  }
}
```
Result: "2^3 = 8"

## Configuration

### With Claude Desktop (Stdio)

Add to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "calculator": {
      "command": "node",
      "args": ["/path/to/example-calculator-mcp/src/index.js"]
    }
  }
}
```

### With HTTP/SSE Transport

For web-based clients or deployment systems, use the HTTP server:

```bash
npm run start:http
```

Then connect to: `http://localhost:8000/sse`

### With kagent.dev

This server is designed to work with kagent.dev deployment. Use:

```bash
python deploy_mcp.py github.com/your-org/example-calculator-mcp
```

The deployment script will automatically:
- Detect the Node.js project
- Use `npm start` (HTTP server)  
- Set up proper health checks
- Create kagent ToolServer resources

## Project Structure

```
example-calculator-mcp/
├── src/
│   └── index.js          # Main MCP server implementation
├── package.json          # Project configuration and dependencies
└── README.md            # This file
```

## Error Handling

The server includes proper error handling for:
- Division by zero
- Square root of negative numbers
- Invalid tool names
- Missing or invalid arguments

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK for JavaScript/Node.js

## License

MIT License - feel free to use this as a template for your own MCP servers.

## Testing with kagent.dev

This server is designed to work with deployment systems like kagent.dev. The simple structure and standard npm scripts make it easy to containerize and deploy automatically. 