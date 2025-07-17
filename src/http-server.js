#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
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
    this.port = parseInt(process.env.PORT || "3000");

    this.setupExpress();
    this.setupTools();
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

    // Simple MCP endpoint (not using SSE for now)
    this.app.post("/mcp", async (req, res) => {
      try {
        const result = await this.handleMCPRequest(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Support GET requests for tool discovery
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

  async handleMCPRequest(request) {
    // Simple MCP request handling
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
          throw new Error("Division by zero is not allowed");
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
          throw new Error("Cannot calculate square root of negative number");
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
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  setupTools() {
    // Set up the MCP tools (keeping for potential future use)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
          // ... other tools would be here
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.callTool(name, args);
    });
  }

  async run() {
    // Start HTTP server without SSE transport for now
    this.app.listen(this.port, this.host, () => {
      console.log(`Calculator MCP server running on http://${this.host}:${this.port}`);
      console.log(`Health check: http://${this.host}:${this.port}/health`);
      console.log(`MCP endpoint: http://${this.host}:${this.port}/mcp`);
    });
  }
}

const server = new CalculatorHTTPServer();
server.run().catch(console.error); 