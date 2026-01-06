import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

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
        description: '游戏管理测试接口',
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
  apis: [
    path.join(__dirname, './routes/*.{ts,js}'), 
    path.join(__dirname, './entities/*.{ts,js}')
  ], 
};

const specs = swaggerJsdoc(options);

export default specs;
