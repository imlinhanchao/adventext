import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DraftRepo, SceneRepo } from "../entities";
import { Like } from "typeorm";

export function registerMcpTools(server: McpServer, currentUser?: { username: string, isAdmin?: boolean }) {
  // Tool: List Drafts
  server.registerTool(
    "list_drafts",
    {
      description: "List existing story drafts with optional filtering",
      inputSchema: {
        name: z.string().optional().describe("Filter by name"),
        max_results: z.number().optional().default(10).describe("Maximum number of results to return"),
      }
    },
    async ({ name, max_results }) => {
      const where: any = {};
      
      if (!currentUser?.isAdmin) {
          where.author = currentUser?.username;
      }
      
      if (name) {
        where.name = Like(`%${name}%`);
      }
      const drafts = await DraftRepo.find({
        where,
        take: max_results,
        order: { updateTime: "DESC" },
        select: ["id", "name", "description", "author", "status", "updateTime"]
      });
      return {
        content: [{ type: "text", text: JSON.stringify(drafts, null, 2) }],
      };
    }
  );

  // Tool: Create Draft
  server.registerTool(
    "create_draft",
    {
      description: "Create a new story draft",
      inputSchema: {
        name: z.string().describe("Name of the story"),
        description: z.string().describe("Description of the story"),
      }
    },
    async ({ name, description }) => {
      const draft = DraftRepo.create({
        name,
        description,
        author: currentUser?.username || "Agent",
        status: 0,
        alias: "",
        attr: {},
        inventory: [],
        options: [],
        effects: [],
        start: ""
      });
      const result = await DraftRepo.save(draft);
      return {
        content: [{ type: "text", text: JSON.stringify({ id: result.id, name: result.name }, null, 2) }],
      };
    }
  );

  // Tool: Get Draft Details
  server.registerTool(
    "get_draft",
    {
      description: "Get full details of a draft story",
      inputSchema: {
        id: z.string().describe("ID of the draft"),
      }
    },
    async ({ id }) => {
      const where: any = { id };
      if (!currentUser?.isAdmin) {
          where.author = currentUser?.username;
      }

      const draft = await DraftRepo.findOneBy(where);
      if (!draft) {
        return {
          content: [{ type: "text", text: `Draft with ID ${id} not found.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(draft, null, 2) }],
      };
    }
  );

  // Tool: Create Scene
  server.registerTool(
    "create_scene",
    {
      description: "Create a new scene for a story draft",
      inputSchema: {
        draftId: z.string().describe("ID of the story draft"),
        name: z.string().describe("Name of the scene"),
        description: z.string().describe("Content/Description of the scene text"),
        isEnd: z.boolean().optional().describe("Is this scene an ending scene"),
        theEnd: z.string().optional().describe("Name of the ending if isEnd is true"),
        isStart: z.boolean().optional().describe("Is this the starting scene of the draft"),
      }
    },
    async ({ draftId, name, description, isEnd, theEnd, isStart }) => {
      // Access Logic Check
      if (!currentUser?.isAdmin) {
          const draft = await DraftRepo.findOneBy({ id: draftId });
          if (!draft || draft.author !== currentUser?.username) {
            return {
                content: [{ type: "text", text: `Draft with ID ${draftId} not found or permission denied.` }],
                isError: true,
            };
          }
      }

      if (isStart) {
        const draft = await DraftRepo.findOneBy({ id: draftId });
        if (draft) {
          draft.start = name;
          await DraftRepo.save(draft);
        }
      }

      const scene = SceneRepo.create({
        storyId: draftId,
        name,
        content: description,
        options: [],
        position: { x: 0, y: 0 },
        theEnd: theEnd || "",
        isEnd: isEnd || false,
        tags: []
      });
      const result = await SceneRepo.save(scene);
      return {
        content: [{ type: "text", text: JSON.stringify({ id: result.id, name: result.name, storyId: result.storyId }, null, 2) }],
      };
    }
  );
  
  // Tool: Update Scene Options
  server.registerTool(
    "update_scene_options",
    {
      description: "Update the options for a scene",
      inputSchema: {
        sceneId: z.string().describe("ID of the scene to update"),
        options: z.array(z.object({
            text: z.string().describe("Option text"),
            next: z.string().describe("Target scene name"),
        })).describe("List of options")
      }
    },
    async ({ sceneId, options }) => {
        const id = parseInt(sceneId);
        if (isNaN(id)) {
            return {
                content: [{ type: "text", text: `Invalid scene ID: ${sceneId}`}],
                isError: true
            }
        }
        const scene = await SceneRepo.findOneBy({ id });
        if (!scene) {
            return {
                content: [{ type: "text", text: `Scene with ID ${sceneId} not found.`}],
                isError: true
            }
        }
        
        // Access Check
        if (!currentUser?.isAdmin) {
             const draft = await DraftRepo.findOneBy({ id: scene.storyId });
             if (!draft || draft.author !== currentUser?.username) {
                return {
                    content: [{ type: "text", text: `Permission denied for scene ${sceneId}.` }],
                    isError: true,
                };
             }
        }

        const nextScene = await SceneRepo.findOneBy({ storyId: scene.storyId, name: options[0]?.next });
        if (!nextScene) {
            return {
                content: [{ type: "text", text: `Target scene '${options[0]?.next}' not found in the same draft.`}],
                isError: true
            }
        }
        
        scene.options = options.map(o => ({ 
          text: o.text, 
          next: o.next,
          loop: 0,
          disabled: false
        }));
        await SceneRepo.save(scene);
        return {
            content: [{ type: "text", text: `Scene ${sceneId} updated with ${options.length} options.`}]
        }
    }
  );

  // Tool: Set Start Scene
  server.registerTool(
    "set_draft_start_scene",
    {
      description: "Set the starting scene for a draft, must be done after creating scenes",
      inputSchema: {
        draftId: z.string().describe("ID of the draft"),
        sceneId: z.string().describe("ID of the scene to be the start"),
      }
    },
    async ({ draftId, sceneId }) => {
      const where: any = { id: draftId };
      if (!currentUser?.isAdmin) {
          where.author = currentUser?.username;
      }
      const draft = await DraftRepo.findOneBy(where);
      if (!draft) {
        return {
          content: [{ type: "text", text: `Draft with ID ${draftId} not found.` }],
          isError: true,
        };
      }
      draft.start = sceneId;
      await DraftRepo.save(draft);
      return {
        content: [{ type: "text", text: `Draft ${draftId} start scene set to ${sceneId}.` }],
      };
    }
  );
}
