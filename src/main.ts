import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {



  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      bufferLogs: true,
    });

    const config = new DocumentBuilder()
      .setTitle('D. HAPPI Platform API')
      .setDescription('API documentation for the D. HAPPI management platform project')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token', // name used for authorization header in Swagger UI
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.enableCors({
      origin: "*",
      credentials: false,
    });

    // Essential for Cloud Run
    app.useGlobalPipes(new ValidationPipe());

    // Get port from environment (Cloud Run provides PORT=8080)
    const port = process.env.PORT || 3000;

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Start the server
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application running on port ${port}`);
    logger.log(`📊 Health check available at http://0.0.0.0:${port}/health`);

  } catch (error) {
    logger.error('❌ Failed to start application', error);
    process.exit(1);
  }
}
bootstrap();
