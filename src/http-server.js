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

    // SSE endpoint that returns tools in the format kagent expects
    this.app.get("/sse", async (req, res) => {
      try {
        // Return tools in a format that might work for discovery
        const result = await this.handleMCPRequest({ method: "tools/list" });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // POST SSE endpoint
    this.app.post("/sse", async (req, res) => {
      try {
        const result = await this.handleMCPRequest(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
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
      process.exit(0);
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
    // Setup basic MCP server functionality
    console.log("Setting up MCP tools...");
  }

  async run() {
    // Start HTTP server
    this.app.listen(this.port, this.host, () => {
      console.log(`Calculator MCP server running on http://${this.host}:${this.port}`);
      console.log(`Health check: http://${this.host}:${this.port}/health`);
      console.log(`SSE endpoint: http://${this.host}:${this.port}/sse`);
      console.log(`MCP endpoint: http://${this.host}:${this.port}/mcp`);
      console.log("Ready to serve calculator tools!");
    });
  }
}

const server = new CalculatorHTTPServer();
server.run().catch(console.error); 