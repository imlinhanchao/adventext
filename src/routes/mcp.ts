import { Router } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerMcpTools } from "../mcp/tools";
import { randomUUID } from "node:crypto";
import { verifyToken } from "../utils/auth";
import { UserRepo } from "../entities";
import { User } from "../entities/User";

const router = Router();
const transports = new Map<string, SSEServerTransport>();

// GET /api/mcp/sse
// Initiate SSE connection
router.get("/sse", async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(401).send("Unauthorized: No token provided");
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
     res.status(403).send("Unauthorized: Invalid token");
     return;
  }

  const user = await UserRepo.findOneBy({ id: payload.id });
  if (!user) {
      res.status(403).send("Unauthorized: User not found");
      return;
  }

  const connectionId = randomUUID();
  // Ensure we use absolute URL to avoid client confusion, especially behind proxies
  const baseUrl = process.env.MCP_BASE_URL || `https://story.time-pack.com`; 
  const endpoint = `${baseUrl}/api/mcp/message?connectionId=${connectionId}&token=${token}`;
  
  const transport = new SSEServerTransport(endpoint, res);
  
  res.on('close', () => {
      (transport as any)._sseResponse = undefined;
      (transport as any).onclose?.();
  });

  const server = new McpServer({
    name: "adventext-creator",
    version: "1.0.0",
  });
  
  // Register tools with user context
  registerMcpTools(server, { username: user.username, isAdmin: user.isAdmin });
  
  await server.connect(transport);
  
  console.log(`[MCP] New SSE connection: ${connectionId}`);

  // Store transport for message routing
  transports.set(connectionId, transport);
  
  // Clean up when connection closes
  req.on("close", () => {
    console.log(`[MCP] SSE connection closed: ${connectionId}`);
    transports.delete(connectionId);
    server.close();
  });
  
  // Add auth info to the session (optional, depending on if library needs it)
  // transport.sessionId = sessionId; 

  // await transport.start();
});

// POST /api/mcp/message
// Handle JSON-RPC messages
router.post("/message", async (req, res) => {
    const connectionId = req.query.connectionId as string;
    const token = req.query.token as string;
    
    // Validate token again for stateless POSTs
    if (!token) {
        res.status(401).send("Unauthorized");
        return;
    }
    const payload = verifyToken(token);
    if (!payload) {
         res.status(403).send("Unauthorized");
         return;
    }

    const transport = transports.get(connectionId);
    if (!transport) {
      console.log(`[MCP] Session not found for connection: ${connectionId}`);
      res.status(404).send("Session not found");
      return;
    }
    
    console.log(`[MCP] Handling POST message for connection: ${connectionId}`);
    try {
      await transport.handlePostMessage(req, res, req.body);
      console.log(`[MCP] POST message handled successfully for connection: ${connectionId}`);
    } catch (err) {
      console.error(`[MCP] Error handling POST message for connection: ${connectionId}`, err);
    }
});

export default router;
