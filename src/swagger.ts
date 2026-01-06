import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '千屿引擎 API',
      version: '1.0.0',
      description: '千屿引擎的 API 文档',
    },
    servers: [
      {
        url: '/api',
        description: '游戏管理测试 API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '请求状态',
              example: 0,
            },
            message: {
              type: 'string',
              description: '错误信息',
            },
            data: {
              description: '响应数据',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/entities/*.ts'], // Path to the API docs and entities
};

const specs = swaggerJsdoc(options);

export default specs;
