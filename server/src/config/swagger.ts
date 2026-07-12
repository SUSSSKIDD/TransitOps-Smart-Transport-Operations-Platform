import swaggerJsdoc from 'swagger-jsdoc'
import { env } from './env'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TransitOps API',
      version: '1.0.0',
      description: 'API documentation for the TransitOps platform',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'], // Simple path, not doing full annotations for the hackathon
}

export const swaggerSpec = swaggerJsdoc(options)
