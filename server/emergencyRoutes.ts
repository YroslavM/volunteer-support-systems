import { Express } from "express";
import { staticProjects, staticTasks, staticUsers, staticApplications, staticDonations, staticReports } from "./staticData";
import { z } from "zod";

// Функція для налаштування аварійних маршрутів, що використовують статичні дані
export function setupEmergencyRoutes(app: Express) {
  console.log("ВАЖЛИВО: Запущено аварійні API маршрути з використанням статичних даних!");

  // GET /api/projects - отримання списку проєктів
  app.get("/api/projects", (req, res) => {
    const querySchema = z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.coerce.number().optional(),
      offset: z.coerce.number().optional(),
    }).optional();
    
    const parsedQuery = querySchema.parse(req.query);
    
    // Фільтруємо проекти базуючись на ролі користувача
    let filteredProjects = [...staticProjects];
    
    // Фільтрація за статусом, якщо він вказаний
    if (parsedQuery?.status) {
      filteredProjects = filteredProjects.filter(p => p.status === parsedQuery.status);
    }
    
    // Фільтрація за пошуком, якщо він вказаний
    if (parsedQuery?.search) {
      const search = parsedQuery.search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search)
      );
    }
    
    // Для волонтерів та донорів показуємо тільки проекти зі статусом "in_progress"
    if (req.user && ["volunteer", "donor"].includes(req.user.role)) {
      filteredProjects = filteredProjects.filter(p => p.status === "in_progress");
    }
    
    // Пагінація
    const limit = parsedQuery?.limit || 20;
    const offset = parsedQuery?.offset || 0;
    const paginatedProjects = filteredProjects.slice(offset, offset + limit);
    
    res.json(paginatedProjects);
  });

  // GET /api/projects/:id - отримання даних конкретного проєкту
  app.get("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const project = staticProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ message: "Проєкт не знайдено" });
    }

    // Для волонтерів та донорів приховуємо проєкти, які ще не в статусі in_progress
    if (req.user && ["volunteer", "donor"].includes(req.user.role) && project.status !== "in_progress") {
      return res.status(403).json({ message: "Проєкт недоступний" });
    }
    
    res.json(project);
  });

  // GET /api/projects/coordinator/:id - проєкти координатора
  app.get("/api/projects/coordinator/:id", (req, res) => {
    const coordinatorId = parseInt(req.params.id);
    const projects = staticProjects.filter(p => p.coordinatorId === coordinatorId);
    res.json(projects);
  });

  // GET /api/projects/moderation - список на модерацію
  app.get("/api/projects/moderation", (req, res) => {
    // Для модераторів показуємо тільки проєкти в статусі "funding" для модерації
    if (req.user && ["admin", "moderator"].includes(req.user.role)) {
      const moderationProjects = staticProjects.filter(p => p.status === "funding");
      return res.json(moderationProjects);
    }
    
    res.json([]);
  });

  // PATCH /api/projects/:id/status - зміна статусу проєкту
  app.patch("/api/projects/:id/status", (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    const projectIndex = staticProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ message: "Проєкт не знайдено" });
    }
    
    // Оновлюємо статус проєкту (але не змінюємо оригінальні дані, так як це всього лише імітація)
    const updatedProject = {
      ...staticProjects[projectIndex],
      status: status,
      updatedAt: new Date()
    };
    
    res.json(updatedProject);
  });

  // GET /api/tasks/project/:id - задачі проєкту
  app.get("/api/tasks/project/:id", (req, res) => {
    const projectId = parseInt(req.params.id);
    const tasks = staticTasks.filter(t => t.projectId === projectId);
    res.json(tasks);
  });

  // GET /api/user/applications - заявки користувача
  app.get("/api/user/applications", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Необхідна авторизація" });
    }
    
    const volunteerId = req.user.id;
    const applications = staticApplications.filter(a => a.volunteerId === volunteerId);
    res.json(applications);
  });

  // GET /api/users - отримання користувачів для адміністратора
  app.get("/api/users", (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Доступ заборонено" });
    }
    
    res.json(staticUsers);
  });

  // GET /api/users/:id - отримання даних користувача
  app.get("/api/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const user = staticUsers.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }
    
    // Видаляємо чутливі дані перед відправкою
    const { password, verificationToken, ...userWithoutSensitiveData } = user;
    res.json(userWithoutSensitiveData);
  });

  // GET /api/user/donations - пожертви користувача
  app.get("/api/user/donations", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Необхідна авторизація" });
    }
    
    const userId = req.user.id;
    const donations = staticDonations.filter(d => d.userId === userId);
    res.json(donations);
  });

  // GET /api/projects/:id/donations - пожертви для проєкту
  app.get("/api/projects/:id/donations", (req, res) => {
    const projectId = parseInt(req.params.id);
    const donations = staticDonations.filter(d => d.projectId === projectId);
    res.json(donations);
  });
  
  // GET /api/projects/:id/applications - заявки на проєкт
  app.get("/api/projects/:id/applications", (req, res) => {
    const projectId = parseInt(req.params.id);
    const applications = staticApplications.filter(a => a.projectId === projectId);
    res.json(applications);
  });
  
  // GET /api/projects/:id/tasks - задачі проєкту
  app.get("/api/projects/:id/tasks", (req, res) => {
    const projectId = parseInt(req.params.id);
    const tasks = staticTasks.filter(t => t.projectId === projectId);
    res.json(tasks);
  });

  // Для всіх інших маршрутів, які не реалізовані
  app.all("/api/*", (req, res, next) => {
    // Перевіряємо, чи маршрут вже був оброблений іншим обробником
    const handled = res.headersSent;
    if (!handled) {
      console.warn(`Незареєстрований маршрут: ${req.method} ${req.originalUrl}`);
      // Повертаємо 404 для незареєстрованих маршрутів
      res.status(404).json({ message: "Маршрут не знайдено" });
    } else {
      next();
    }
  });
}