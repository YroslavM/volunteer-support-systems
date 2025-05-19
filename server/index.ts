import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { setupEmergencyRoutes } from "./emergencyRoutes";

// Створюємо експрес додаток
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Логування API запитів
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Створюємо HTTP сервер
  const server = createServer(app);
  
  console.log("⚠️ РЕЖИМ ТЕХНІЧНОГО ОБСЛУГОВУВАННЯ ⚠️");
  console.log("💾 База даних тимчасово недоступна");
  console.log("⚙️ Веб-сайт працює зі статичними даними");
  console.log("ВАЖЛИВО: Система працює в режимі технічного обслуговування - авторизація тимчасово відключена");
  
  // Налаштування аутентифікації (симуляція)
  // setupAuth(app); // Відключено для аварійного режиму
  
  // Налаштування аварійних маршрутів
  setupEmergencyRoutes(app);

  // Глобальний обробник помилок
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("API Error:", err);
    res.status(status).json({ message });
  });

  // Налаштування Vite для клієнтського коду в режимі розробки
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Прослуховування порту
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Сервер запущено на порту ${port} в аварійному режимі`);
  });
})();