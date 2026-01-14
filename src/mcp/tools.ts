import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DraftRepo, SceneRepo, ItemRepo, TargetRepo } from "../entities";
import { Like } from "typeorm";

export function registerMcpTools(server: McpServer, currentUser?: { username: string, isAdmin?: boolean }) {
  // Tool: List Drafts
  server.registerTool(
    "list_drafts",
    {
      description: "列出已有的故事草稿，支持可选的过滤条件",
      inputSchema: {
        name: z.string().optional().describe("按名称过滤"),
        max_results: z.number().optional().default(10).describe("返回结果的最大数量"),
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
      description: "创建一个新的故事草稿",
      inputSchema: {
        name: z.string().describe("故事名称"),
        description: z.string().describe("故事描述"),
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
      description: "获取故事草稿的完整详情",
      inputSchema: {
        id: z.string().describe("草稿 ID"),
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
      description: "为故事草稿创建一个新场景",
      inputSchema: {
        draftId: z.string().describe("故事草稿 ID"),
        name: z.string().describe("场景名称"),
        description: z.string().describe("场景内容的文本描述"),
        isEnd: z.boolean().optional().describe("该场景是否为结局场景"),
        theEnd: z.string().optional().describe("如果是结局场景，结局的名称"),
        isStart: z.boolean().optional().describe("是否为草稿的起始场景"),
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
  
  // Tool: Manage Item
  server.registerTool(
    "manage_item",
    {
      description: "管理故事草稿中的物品（创建、更新、删除）",
      inputSchema: {
        draftId: z.string().describe("故事草稿 ID"),
        key: z.string().describe("物品的唯一标识符"),
        operation: z.enum(["create", "update", "delete"]).describe("操作类型"),
        name: z.string().optional().describe("物品名称 (创建时必填)"),
        description: z.string().optional().describe("物品描述"),
        type: z.string().optional().describe("物品类型"),
        attributes: z.record(z.string(), z.union([z.string(), z.number()])).optional().describe("物品属性"),
      }
    },
    async ({ draftId, key, operation, name, description, type, attributes }) => {
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

      const existingItem = await ItemRepo.findOneBy({ key, storyId: draftId });

      if (operation === "create") {
          if (existingItem) {
               return { content: [{ type: "text", text: `Item '${key}' already exists.` }], isError: true };
          }
          if (!name) {
              return { content: [{ type: "text", text: `Name is required for creation.` }], isError: true };
          }
          const item = ItemRepo.create({
              storyId: draftId,
              key,
              name,
              description: description || "",
              type: type || "item",
              attributes: attributes || {}
          });
          const result = await ItemRepo.save(item);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } else if (operation === "update") {
          if (!existingItem) {
               return { content: [{ type: "text", text: `Item '${key}' not found.` }], isError: true };
          }
          if (name) existingItem.name = name;
          if (description !== undefined) existingItem.description = description;
          if (type) existingItem.type = type;
          if (attributes) existingItem.attributes = attributes;
          
          const result = await ItemRepo.save(existingItem);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } else if (operation === "delete") {
          if (!existingItem) {
               return { content: [{ type: "text", text: `Item '${key}' not found.` }], isError: true };
          }
          await ItemRepo.remove(existingItem);
          return { content: [{ type: "text", text: `Item '${key}' deleted.` }] };
      }
      return { content: [{ type: "text", text: "Invalid operation" }], isError: true };
    }
  );

  // Tool: Manage Achievement
  server.registerTool(
    "manage_achievement",
    {
      description: "管理故事草稿中的成就（创建、更新、删除）",
      inputSchema: {
        draftId: z.string().describe("故事草稿 ID"),
        key: z.string().describe("成就的唯一标识符"),
        operation: z.enum(["create", "update", "delete"]).describe("操作类型"),
        name: z.string().optional().describe("成就名称 (创建时必填)"),
        description: z.string().optional().describe("成就描述"),
        conditions: z.array(z.object({
          type: z.string().describe("条件类型: Time(时间), Attr(属性), ItemAttr(物品属性), Item(物品), Target(成就), ItemType(物品类型), Value(输入值), Circle(周目), From(来源场景), Fn(函数)"),
          name: z.string().optional().describe("属性名/物品名/成就名"),
          operator: z.string().optional().describe("运算符 (=, !=, <, >, ≤, ≥)"),
          content: z.any().optional().describe("条件内容 (Time类型时为对象 {year, month...}, Attr/ItemAttr为对象 {key: {operator, value}}, 其他为字符串或数字)"),
        })).optional().describe("成就获得条件")
      }
    },
    async ({ draftId, key, operation, name, description, conditions }) => {
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

      const existingTarget = await TargetRepo.findOneBy({ key, storyId: draftId });

      if (operation === "create") {
          if (existingTarget) {
               return { content: [{ type: "text", text: `Achievement '${key}' already exists.` }], isError: true };
          }
          if (!name) {
              return { content: [{ type: "text", text: `Name is required for creation.` }], isError: true };
          }
          const target = TargetRepo.create({
              storyId: draftId,
              key,
              name,
              description: description || "",
              conditions: conditions || []
          });
          const result = await TargetRepo.save(target);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } else if (operation === "update") {
          if (!existingTarget) {
               return { content: [{ type: "text", text: `Achievement '${key}' not found.` }], isError: true };
          }
          if (name) existingTarget.name = name;
          if (description !== undefined) existingTarget.description = description;
          if (conditions) existingTarget.conditions = conditions.map(c => ({
            type: c.type,
            name: c.name || "",
            operator: c.operator,
            content: c.content,
            tip: "",
            isHide: false
          }));
          
          const result = await TargetRepo.save(existingTarget);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } else if (operation === "delete") {
          if (!existingTarget) {
               return { content: [{ type: "text", text: `Achievement '${key}' not found.` }], isError: true };
          }
          await TargetRepo.remove(existingTarget);
          return { content: [{ type: "text", text: `Achievement '${key}' deleted.` }] };
      }
      return { content: [{ type: "text", text: "Invalid operation" }], isError: true };
    }
  );

  // Tool: Update Scene Options
  server.registerTool(
    "update_scene_options",
    {
      description: "更新场景的选项",
      inputSchema: {
        sceneId: z.string().describe("要更新的场景 ID"),
        options: z.array(z.object({
            id: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "选项 ID 必须以字母或下划线开头，且只能包含字母、数字和下划线").describe("选项 ID，场景内唯一"),
            text: z.string().describe("选项文本"),
            next: z.string().describe("目标场景名称"),
        })).describe("选项列表")
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

        // Validate unique IDs within the options list
        const ids = options.map(o => o.id);
        if (new Set(ids).size !== ids.length) {
             return {
                content: [{ type: "text", text: `Option IDs must be unique within the scene.`}],
                isError: true
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
          id: o.id,
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

  // Tool: Set Draft Attributes
  server.registerTool(
    "set_draft_attributes",
    {
      description: "设置故事草稿的人物初始属性，支持标识符、公开名称、分类、初始值和备注。",
      inputSchema: {
        draftId: z.string().describe("故事草稿 ID"),
        attributes: z.array(z.object({
          key: z.string().describe("属性标识符 (用于逻辑判断等)"),
          name: z.string().optional().describe("属性公开名称 (如'HP', '体力', 若设置则玩家可见，若不设置相当于故事的内置变量)"),
          value: z.union([z.string(), z.number()]).describe("属性初始值 (支持数字或字符串)"),
          group: z.string().optional().describe("属性分类名称"),
          desc: z.string().optional().describe("备注信息 (仅故事作者可见)")
        })).describe("属性列表"),
      }
    },
    async ({ draftId, attributes }) => {
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

      const draft = await DraftRepo.findOneBy({ id: draftId });
      if (!draft) {
         return {
            content: [{ type: "text", text: `Draft with ID ${draftId} not found.` }],
            isError: true,
         };
      }
      
      const newAttr: Record<string, any> = {};
      
      const attrNameList = attributes.map(a => ({
          key: a.key,
          name: a.name || "", // Empty name means internal variable
          group: a.group || "",
          desc: a.desc || ""
      }));

      for (const a of attributes) {
        newAttr[a.key] = a.value;
      }

      draft.attr = newAttr;
      draft.attrName = attrNameList; 
      
      await DraftRepo.save(draft);
      
      return {
        content: [{ type: "text", text: `Draft ${draftId} attributes updated. Set ${attributes.length} attributes.` }],
      };
    }
  );

  // Tool: Update Scene Option Effects
  server.registerTool(
    "update_scene_option_effects",
    {
      description: "设置场景选项的触发效果。支持：获得物品、获得成就、扣除物品属性、修改玩家属性、场景变化、函数调用、消息提醒。",
      inputSchema: {
        sceneId: z.string().describe("场景 ID"),
        optionId: z.string().describe("选项 ID （场景内唯一的字符串标识符）"),
        effects: z.array(z.object({
          type: z.string().describe("效果类型: Item(获得物品), Target(获得成就), ItemAttr(物品属性消耗), Attr(属性变化), SceneAttr(场景属性变化), Scene(场景变化), Fn(函数调用), Tip(消息提醒)"),
          name: z.string().optional().describe("属性名/物品名/成就名"),
          content: z.string().optional().describe("数量/内容/值/场景名"),
          operator: z.string().optional().describe("运算符 (属性变化时用: +, -, *, /, =)"),
          tip: z.string().optional().describe("提示语"),
          conditions: z.array(z.object({
             type: z.string().describe("条件类型: Time(时间), Attr(属性), ItemAttr(物品属性), Item(物品), Target(成就), ItemType(物品类型), Value(输入值), Circle(周目), From(来源场景), Fn(函数)"),
             name: z.string().optional().describe("属性名/物品名/成就名"),
             operator: z.string().optional().describe("运算符 (=, !=, <, >, ≤, ≥)"),
             content: z.any().optional().describe("条件内容 (Time类型时为对象 {year, month...}, Attr/ItemAttr为对象 {key: {operator, value}}, 其他为字符串或数字)"),
             tip: z.string().optional().describe("不满足时的提示"),
          })).optional().describe("触发此效果的前置条件")
        })).describe("效果列表")
      }
    },
    async ({ sceneId, optionId, effects }) => {
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
        
        const option = scene.options?.find(o => o.id === optionId);
        if (!option) {
             return {
                content: [{ type: "text", text: `Option with ID '${optionId}' not found in scene ${sceneId}.`}],
                isError: true
            }
        }

        // Map input effects to entity structure
        const nextEffects = effects.map(e => ({
            type: e.type, 
            name: e.name || "",
            content: e.content || "",
            operator: e.operator,
            tip: e.tip,
            conditions: e.conditions ? e.conditions.map(c => ({
              type: c.type,
              name: c.name || "",
              operator: c.operator,
              content: c.content,
              tip: c.tip || "",
              isHide: false
            })) : []
        }));

        option.effects = nextEffects;
        await SceneRepo.save(scene);

        return {
            content: [{ type: "text", text: `Updated effects for option '${optionId}' in scene ${sceneId}.` }]
        };
    }
  );

  // Tool: Update Scene Option Conditions
  server.registerTool(
    "update_scene_option_conditions",
    {
      description: "设置场景选项的触发条件。满足所有条件时选项才有效，或者作为隐藏选项的判断依据。",
      inputSchema: {
        sceneId: z.string().describe("场景 ID"),
        optionId: z.string().describe("选项 ID （场景内唯一的字符串标识符）"),
        conditions: z.array(z.object({
           type: z.string().describe("条件类型: Time(时间), Attr(属性), ItemAttr(物品属性), Item(物品), Target(成就), ItemType(物品类型), Value(输入值), Circle(周目), From(来源场景), Fn(函数)"),
           name: z.string().optional().describe("属性名/物品名/成就名"),
           operator: z.string().optional().describe("运算符 (=, !=, <, >, ≤, ≥)"),
           content: z.any().optional().describe("条件内容 (Time类型时为对象 {year, month...}, Attr/ItemAttr为对象 {key: {operator, value}}, 其他为字符串或数字)"),
           tip: z.string().optional().describe("不满足时的提示"),
           isHide: z.boolean().optional().describe("如果不满足条件，是否隐藏该选项")
        })).describe("条件列表")
      }
    },
    async ({ sceneId, optionId, conditions }) => {
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
        
        const option = scene.options?.find(o => o.id === optionId);
        if (!option) {
             return {
                content: [{ type: "text", text: `Option with ID '${optionId}' not found in scene ${sceneId}.`}],
                isError: true
            }
        }

        // Map input conditions to entity structure
        const nextConditions = conditions.map(c => ({
            type: c.type,
            name: c.name || "",
            operator: c.operator,
            content: c.content, // Pass through complex objects or simple values
            tip: c.tip || "",
            isHide: c.isHide || false
        }));

        option.conditions = nextConditions;
        await SceneRepo.save(scene);

        return {
            content: [{ type: "text", text: `Updated conditions for option '${optionId}' in scene ${sceneId}.` }]
        };
    }
  );

  // Tool: Set Scene Attributes
  server.registerTool(
    "set_scene_attributes",
    {
      description: "设置场景的属性，支持标识符、公开名称、分类、初始值和备注。",
      inputSchema: {
        sceneId: z.string().describe("场景 ID"),
        attributes: z.array(z.object({
          key: z.string().describe("属性标识符 (用于逻辑判断等)"),
          name: z.string().optional().describe("属性公开名称 (若设置则可见)"),
          value: z.union([z.string(), z.number()]).describe("属性初始值 (支持数字或字符串)"),
          group: z.string().optional().describe("属性分类名称"),
          desc: z.string().optional().describe("备注信息")
        })).describe("属性列表"),
      }
    },
    async ({ sceneId, attributes }) => {
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
      
      // Access Logic Check
      if (!currentUser?.isAdmin) {
          const draft = await DraftRepo.findOneBy({ id: scene.storyId });
          if (!draft || draft.author !== currentUser?.username) {
            return {
                content: [{ type: "text", text: `Draft with ID ${scene.storyId} not found or permission denied.` }],
                isError: true,
            };
          }
      }

      const newAttr: any[] = attributes.map(a => ({
          key: a.key,
          name: a.name || "", 
          value: a.value,
          remark: a.desc || ""
      }));
      // Note: Scene entity has 'attributes' column which is json type. 
      // Based on typical usage, it stores an array of attribute objects.
      
      scene.attributes = newAttr;
      await SceneRepo.save(scene);
      
      return {
        content: [{ type: "text", text: `Scene ${sceneId} attributes updated. Set ${attributes.length} attributes.` }],
      };
    }
  );

  // Tool: Set Start Scene
  server.registerTool(
    "set_draft_start_scene",
    {
      description: "设置草稿的起始场景，必须在创建完成起始场景后操作",
      inputSchema: {
        draftId: z.string().describe("草稿 ID"),
        sceneId: z.string().describe("作为起始的场景 ID"),
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

  // Tool: Get Story Definitions
  server.registerTool(
    "get_story_definitions",
    {
      description: "获取故事草稿的完整定义列表，包含物品、成就、场景和场景选项",
      inputSchema: {
        draftId: z.string().describe("故事草稿 ID"),
      }
    },
    async ({ draftId }) => {
      // Access Logic Check
      const draftWhere: any = { id: draftId };
      if (!currentUser?.isAdmin) {
          draftWhere.author = currentUser?.username;
      }
      const draft = await DraftRepo.findOneBy(draftWhere);
      if (!draft) {
          return {
              content: [{ type: "text", text: `Draft with ID ${draftId} not found or permission denied.` }],
              isError: true,
          };
      }

      const items = await ItemRepo.find({ where: { storyId: draftId } });
      const achievements = await TargetRepo.find({ where: { storyId: draftId } });
      const scenes = await SceneRepo.find({ where: { storyId: draftId } });
      
      return {
        content: [{ type: "text", text: JSON.stringify({
            draft,
            items,
            achievements,
            scenes
        }, null, 2) }],
      };
    }
  );

  // Tool: Set Draft Initial Inventory
  server.registerTool(
    "set_draft_initial_inventory",
    {
      description: "设置故事草稿中玩家的初始背包物品。这将覆盖现有的初始配置。",
      inputSchema: {
        draftId: z.string().describe("故事草稿 ID"),
        items: z.array(z.object({
          key: z.string().describe("物品标识符"),
          count: z.number().int().min(1).describe("数量"),
        })).describe("物品列表"),
      }
    },
    async ({ draftId, items }) => {
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
      
      const newInventory = [];
      for (const { key, count } of items) {
          const itemDef = await ItemRepo.findOneBy({ storyId: draftId, key });
          if (!itemDef) {
             return {
                content: [{ type: "text", text: `Item definition for key '${key}' not found in draft ${draftId}. Please create the item first.` }],
                isError: true,
             } 
          }
          newInventory.push({ ...itemDef, count });
      }
      
      draft.inventory = newInventory as any;
      await DraftRepo.save(draft);
      
      return {
        content: [{ type: "text", text: `Draft ${draftId} initial inventory updated with ${newInventory.length} items.` }],
      };
    }
  );
}
