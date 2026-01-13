import "reflect-metadata";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AppDataSource } from "./entities";
import { registerMcpTools } from "./mcp/tools";

async function main() {
  // Initialize database connection
  await AppDataSource.initialize();
  console.error("Database connected.");

  const server = new McpServer({
    name: "story-creator",
    version: "1.0.0",
  });

  registerMcpTools(server);

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server story-creator started.");
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
