"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
    app.enableCors({
        origin: corsOrigin === '*' ? true : corsOrigin,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
    });
    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
//# sourceMappingURL=main.js.map