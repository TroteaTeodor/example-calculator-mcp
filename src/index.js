#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

class CalculatorMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "example-calculator-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
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
            description: "Multiply two numbers",
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
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Calculator MCP server running on stdio");
  }
}

const server = new CalculatorMCPServer();
server.run().catch(console.error); 