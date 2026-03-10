import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShopIt API Documentation',
      version: '1.0.0',
      description: 'The complete API documentation for the ShopIt e-commerce backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {      // Since we switched to Cookies!
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
  },
  // Path to the API docs (where you'll write the JSDoc comments)
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], 
};

export const swaggerSpecs = swaggerJsdoc(options);