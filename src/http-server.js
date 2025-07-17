#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

class CalculatorHTTPServer {
  constructor() {
    this.app = express();
    this.server = new Server(
      {
        name: "example-calculator-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.host = process.env.HOST || "0.0.0.0";
    this.port = parseInt(process.env.PORT || "8000");

    this.setupExpress();
    this.setupTools();
    this.setupErrorHandling();
  }

  setupExpress() {
    // Enable CORS for all origins
    this.app.use(cors());
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // Simple MCP endpoint (fallback for testing)
    this.app.post("/mcp", async (req, res) => {
      try {
        const result = await this.handleMCPRequest(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Support GET requests for tool discovery (fallback)
    this.app.get("/mcp", async (req, res) => {
      try {
        // Return tools list for GET requests (for discovery)
        const result = await this.handleMCPRequest({ method: "tools/list" });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    
    process.on("SIGINT", async () => {
      console.log("\nShutting down calculator MCP server...");
      await this.server.close();
      process.exit(0);
    });
  }

  async handleMCPRequest(request) {
    // Simple MCP request handling (fallback)
    if (request.method === "tools/list") {
      return {
        tools: [
          {
            name: "add",
            description: "Add two numbers",
            inputSchema: {
              type: "object",
              properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
              },
              required: ["a", "b"]
            }
          },
          {
            name: "subtract", 
            description: "Subtract two numbers",
            inputSchema: {
              type: "object",
              properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
              },
              required: ["a", "b"]
            }
          },
          {
            name: "multiply",
            description: "Multiply two numbers", 
            inputSchema: {
              type: "object",
              properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
              },
              required: ["a", "b"]
            }
          },
          {
            name: "divide",
            description: "Divide two numbers",
            inputSchema: {
              type: "object",
              properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
              },
              required: ["a", "b"]
            }
          },
          {
            name: "power",
            description: "Raise a number to a power",
            inputSchema: {
              type: "object", 
              properties: {
                base: { type: "number", description: "Base number" },
                exponent: { type: "number", description: "Exponent" }
              },
              required: ["base", "exponent"]
            }
          },
          {
            name: "sqrt",
            description: "Calculate square root",
            inputSchema: {
              type: "object",
              properties: {
                number: { type: "number", description: "Number to calculate square root of" }
              },
              required: ["number"]
            }
          }
        ]
      };
    } else if (request.method === "tools/call") {
      return await this.callTool(request.params.name, request.params.arguments);
    } else {
      throw new Error(`Unknown method: ${request.method}`);
    }
  }

  async callTool(name, args) {
    switch (name) {
      case "add":
        return {
          content: [
            {
              type: "text",
              text: `${args.a} + ${args.b} = ${args.a + args.b}`
            }
          ]
        };

      case "subtract":
        return {
          content: [
            {
              type: "text", 
              text: `${args.a} - ${args.b} = ${args.a - args.b}`
            }
          ]
        };

      case "multiply":
        return {
          content: [
            {
              type: "text",
              text: `${args.a} × ${args.b} = ${args.a * args.b}`
            }
          ]
        };

      case "divide":
        if (args.b === 0) {
          throw new McpError(ErrorCode.InvalidRequest, "Division by zero is not allowed");
        }
        return {
          content: [
            {
              type: "text",
              text: `${args.a} ÷ ${args.b} = ${args.a / args.b}`
            }
          ]
        };

      case "power":
        return {
          content: [
            {
              type: "text",
              text: `${args.base}^${args.exponent} = ${Math.pow(args.base, args.exponent)}`
            }
          ]
        };

      case "sqrt":
        if (args.number < 0) {
          throw new McpError(ErrorCode.InvalidRequest, "Cannot calculate square root of negative number");
        }
        return {
          content: [
            {
              type: "text",
              text: `√${args.number} = ${Math.sqrt(args.number)}`
            }
          ]
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  setupTools() {
    // Set up the MCP tools with proper handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "add",
            description: "Add two numbers together",
            inputSchema: {
              type: "object",
              properties: {
                a: {
                  type: "number",
                  description: "First number",
                },
                b: {
                  type: "number", 
                  description: "Second number",
                },
              },
              required: ["a", "b"],
            },
          },
          {
            name: "subtract", 
            description: "Subtract second number from first number",
            inputSchema: {
              type: "object",
              properties: {
                a: {
                  type: "number",
                  description: "Number to subtract from",
                },
                b: {
                  type: "number",
                  description: "Number to subtract",
                },
              },
              required: ["a", "b"],
            },
          },
          {
            name: "multiply",
            description: "Multiply two numbers together", 
            inputSchema: {
              type: "object",
              properties: {
                a: {
                  type: "number",
                  description: "First number",
                },
                b: {
                  type: "number",
                  description: "Second number",
                },
              },
              required: ["a", "b"],
            },
          },
          {
            name: "divide",
            description: "Divide first number by second number",
            inputSchema: {
              type: "object",
              properties: {
                a: {
                  type: "number",
                  description: "Dividend",
                },
                b: {
                  type: "number",
                  description: "Divisor",
                },
              },
              required: ["a", "b"],
            },
          },
          {
            name: "power",
            description: "Raise first number to the power of second number",
            inputSchema: {
              type: "object", 
              properties: {
                base: {
                  type: "number",
                  description: "Base number",
                },
                exponent: {
                  type: "number",
                  description: "Exponent",
                },
              },
              required: ["base", "exponent"],
            },
          },
          {
            name: "sqrt",
            description: "Calculate square root of a number",
            inputSchema: {
              type: "object",
              properties: {
                number: {
                  type: "number",
                  description: "Number to find square root of",
                  minimum: 0,
                },
              },
              required: ["number"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "add": {
            const { a, b } = args;
            const result = a + b;
            return {
              content: [
                {
                  type: "text",
                  text: `${a} + ${b} = ${result}`,
                },
              ],
            };
          }

          case "subtract": {
            const { a, b } = args;
            const result = a - b;
            return {
              content: [
                {
                  type: "text", 
                  text: `${a} - ${b} = ${result}`,
                },
              ],
            };
          }

          case "multiply": {
            const { a, b } = args;
            const result = a * b;
            return {
              content: [
                {
                  type: "text",
                  text: `${a} × ${b} = ${result}`,
                },
              ],
            };
          }

          case "divide": {
            const { a, b } = args;
            if (b === 0) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                "Cannot divide by zero"
              );
            }
            const result = a / b;
            return {
              content: [
                {
                  type: "text",
                  text: `${a} ÷ ${b} = ${result}`,
                },
              ],
            };
          }

          case "power": {
            const { base, exponent } = args;
            const result = Math.pow(base, exponent);
            return {
              content: [
                {
                  type: "text",
                  text: `${base}^${exponent} = ${result}`,
                },
              ],
            };
          }

          case "sqrt": {
            const { number } = args;
            if (number < 0) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                "Cannot calculate square root of negative number"
              );
            }
            const result = Math.sqrt(number);
            return {
              content: [
                {
                  type: "text",
                  text: `√${number} = ${result}`,
                },
              ],
            };
          }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Calculator error: ${error.message}`
        );
      }
    });
  }

  async run() {
    try {
      // Setup SSE transport for proper MCP protocol
      const transport = new SSEServerTransport("/sse", this.app);
      await this.server.connect(transport);

      // Start HTTP server
      this.app.listen(this.port, this.host, () => {
        console.log(`Calculator MCP server running on http://${this.host}:${this.port}`);
        console.log(`SSE endpoint: http://${this.host}:${this.port}/sse`);
        console.log(`Health check: http://${this.host}:${this.port}/health`);
        console.log(`MCP endpoint: http://${this.host}:${this.port}/mcp`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

const server = new CalculatorHTTPServer();
server.run().catch(console.error); 