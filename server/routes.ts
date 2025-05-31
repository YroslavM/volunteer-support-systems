import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import path from "path";
import multer from "multer";
import { projectImageUpload } from "./middleware/upload";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
import { 
  insertProjectSchema, 
  insertTaskSchema, 
  insertApplicationSchema,
  insertDonationSchema,
  insertReportSchema,
  projectStatusEnum,
  taskStatusEnum,
  applicationStatusEnum,
  moderationStatusEnum,
  projects,
  projectModerations
} from "@shared/schema";

// Режим тестового середовища (для демонстрації)
const DEV_MODE = process.env.NODE_ENV === 'development';

// Допоміжна функція для отримання ID користувача в DEV_MODE
function getUserId(req: Request): number {
  if (DEV_MODE) {
    return req.body.userId || req.user?.id || 1;
  }
  return req.user!.id;
}

// Допоміжна функція для отримання ролі користувача в DEV_MODE
function getUserRole(req: Request): string {
  if (DEV_MODE) {
    return req.body.userRole || req.user?.role || "coordinator";
  }
  return req.user!.role;
}

// Function to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  // В тестовому режимі завжди пропускаємо
  if (DEV_MODE || req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Необхідна авторизація" });
}

// Check if user has required role
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    // В тестовому режимі завжди пропускаємо
    if (DEV_MODE) {
      return next();
    }
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Необхідна авторизація" });
    }
    
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
    }
    
    next();
  };
}

// Helper function to check if user is a moderator (using admin role)
function isModerator(req: Request): boolean {
  // We're using admin role for moderators as we don't have a separate moderator role in the user role enum
  if (DEV_MODE) {
    return req.body.userRole === "admin" || req.user?.role === "admin";
  }
  return req.user?.role === "admin";
}

// Middleware to check if user is a moderator
function isModeratorMiddleware(req: Request, res: Response, next: Function) {
  if (DEV_MODE || isModerator(req)) {
    return next();
  }
  return res.status(403).json({ message: "Недостатньо прав для модерації" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // =========================
  // Project Routes
  // =========================
  
  // Get all projects for moderation (повинно бути перед GET /api/projects/:id)
  app.get("/api/projects/moderation", isAuthenticated, isModeratorMiddleware, async (req, res, next) => {
    try {
      const querySchema = z.object({
        status: z.enum(projectStatusEnum.enumValues).optional(),
        search: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional();
      
      const parsedQuery = querySchema.parse(req.query);
      const options = parsedQuery ? {
        status: parsedQuery.status,
        search: parsedQuery.search,
        limit: parsedQuery.limit !== undefined ? parsedQuery.limit : 20,
        offset: parsedQuery.offset !== undefined ? parsedQuery.offset : 0
      } : { limit: 20, offset: 0 };
      
      const projects = await storage.getProjects(options);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res, next) => {
    try {
      const querySchema = z.object({
        status: z.enum(projectStatusEnum.enumValues).optional(),
        search: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional();
      
      const parsedQuery = querySchema.parse(req.query);
      const options = parsedQuery ? {
        status: parsedQuery.status,
        search: parsedQuery.search,
        limit: parsedQuery.limit !== undefined ? parsedQuery.limit : 20,
        offset: parsedQuery.offset !== undefined ? parsedQuery.offset : 0
      } : { limit: 20, offset: 0 };
      
      const projects = await storage.getProjects(options);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
  // Маршрут переміщено нижче з кращою логікою авторизації
  
  // Get project by ID
  app.get("/api/projects/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      res.json(project);
    } catch (error) {
      next(error);
    }
  });
  
  // Create new project (only for coordinators)
  app.post("/api/projects", hasRole(["coordinator"]), async (req, res, next) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      
      // Використовуємо функцію для отримання ID координатора
      const coordinatorId = getUserId(req);
      
      const project = await storage.createProject({
        ...data,
        coordinatorId,
        status: "funding", // Set initial status
        collectedAmount: 0, // Set initial collected amount
      });
      
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });
  
  // Create project with file upload (only for coordinators)
  app.post("/api/projects/with-image", hasRole(["coordinator"]), (req, res, next) => {
    projectImageUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      try {
        // Get form data
        const projectData = {
          name: req.body.name,
          description: req.body.description,
          targetAmount: parseFloat(req.body.targetAmount),
          bankDetails: req.body.bankDetails,
          imageUrl: req.file ? `/uploads/projects/${path.basename(req.file.path)}` : null,
        };
        
        // Validate data
        const validatedData = insertProjectSchema.parse(projectData);
        
        // Get coordinator ID
        const coordinatorId = getUserId(req);
        
        // Create project
        const project = await storage.createProject({
          ...validatedData,
          coordinatorId: coordinatorId,
          status: "funding",
          collectedAmount: 0
        });
        
        res.status(201).json(project);
      } catch (error) {
        next(error);
      }
    });
  });
  
  // Update project status (only for coordinators)
  app.patch("/api/projects/:id/status", hasRole(["coordinator"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const { status } = z.object({
        status: z.enum(projectStatusEnum.enumValues),
      }).parse(req.body);
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project
      if (project.coordinatorId !== req.user!.id) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      const updatedProject = await storage.updateProjectStatus(id, status);
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  });
  
  // =========================
  // Task Routes
  // =========================
  
  // Get tasks for a project
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is coordinator or volunteer assigned to this project
      const isCoordinator = req.user!.role === "coordinator" && project.coordinatorId === req.user!.id;
      const isAssignedVolunteer = req.user!.role === "volunteer" && 
        await storage.isVolunteerAssignedToProject(req.user!.id, projectId);
      
      if (!isCoordinator && !isAssignedVolunteer) {
        return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
      }
      
      const tasks = await storage.getTasksByProjectId(projectId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  // Create task for a project (only for coordinators)
  app.post("/api/projects/:projectId/tasks", hasRole(["coordinator"]), async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project
      if (project.coordinatorId !== req.user!.id) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      const data = insertTaskSchema.parse({
        ...req.body,
        projectId,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined
      });
      
      const task = await storage.createTask(data);
      
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });
  
  // Assign task to volunteer (only for coordinators)
  app.patch("/api/tasks/:id/assign", hasRole(["coordinator"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const { volunteerId } = z.object({
        volunteerId: z.number(),
      }).parse(req.body);
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project
      if (project.coordinatorId !== req.user!.id) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      // Check if volunteer is assigned to this project
      const isAssigned = await storage.isVolunteerAssignedToProject(volunteerId, task.projectId);
      if (!isAssigned) {
        return res.status(400).json({ message: "Волонтер не призначений до цього проєкту" });
      }
      
      const updatedTask = await storage.assignTaskToVolunteer(id, volunteerId);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // Update task status
  app.patch("/api/tasks/:id/status", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const { status } = z.object({
        status: z.enum(taskStatusEnum.enumValues),
      }).parse(req.body);
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project or the assigned volunteer
      const isCoordinator = req.user!.role === "coordinator" && project.coordinatorId === req.user!.id;
      const isAssignedVolunteer = req.user!.role === "volunteer" && task.assignedVolunteerId === req.user!.id;
      
      if (!isCoordinator && !isAssignedVolunteer) {
        return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
      }
      
      const updatedTask = await storage.updateTaskStatus(id, status);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  // Отримати всі завдання координатора
  app.get("/api/coordinator/tasks", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const userId = getUserId(req);
      
      // Отримуємо проєкти координатора
      const projects = await storage.getProjectsByCoordinatorId(userId);
      const projectIds = projects.map(p => p.id);
      
      // Отримуємо всі завдання для цих проєктів
      const allTasks = [];
      for (const projectId of projectIds) {
        const tasks = await storage.getTasksByProjectId(projectId);
        // Додаємо інформацію про проєкт до кожного завдання
        const tasksWithProject = tasks.map(task => ({
          ...task,
          project: projects.find(p => p.id === task.projectId)
        }));
        allTasks.push(...tasksWithProject);
      }
      
      res.json(allTasks);
    } catch (error) {
      next(error);
    }
  });

  // Видалити завдання
  app.delete("/api/tasks/:id", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project
      if (project.coordinatorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      await storage.deleteTask(id);
      res.json({ message: "Завдання успішно видалено" });
    } catch (error) {
      next(error);
    }
  });

  // Отримати інформацію про завдання
  app.get("/api/tasks/:id", hasRole(["coordinator", "volunteer", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Додаємо інформацію про проєкт
      const taskWithProject = {
        ...task,
        project: {
          id: project.id,
          name: project.name
        }
      };
      
      res.json(taskWithProject);
    } catch (error) {
      next(error);
    }
  });

  // Отримати призначених волонтерів для завдання
  app.get("/api/tasks/:id/assigned-volunteers", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      // Повертаємо призначених волонтерів
      const assignedVolunteers = [];
      if (task.assignedVolunteerId) {
        const volunteer = await storage.getUser(task.assignedVolunteerId);
        if (volunteer) {
          assignedVolunteers.push({
            volunteerId: volunteer.id,
            volunteer: volunteer,
            assignedAt: task.updatedAt // використовуємо дату оновлення як дату призначення
          });
        }
      }
      
      res.json(assignedVolunteers);
    } catch (error) {
      next(error);
    }
  });

  // Призначити волонтера до завдання
  app.post("/api/tasks/:id/assign", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const { volunteerId } = z.object({
        volunteerId: z.number(),
      }).parse(req.body);
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Перевіряємо, чи користувач є координатором проєкту
      if (project.coordinatorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      // Перевіряємо, чи волонтер подав заявку на проєкт
      const application = await storage.getApplicationByVolunteerAndProject(volunteerId, task.projectId);
      if (!application || application.status !== "approved") {
        return res.status(400).json({ message: "Волонтер не має схваленої заявки на цей проєкт" });
      }
      
      // Перевіряємо, чи волонтер уже призначений до цього завдання
      if (task.assignedVolunteerId === volunteerId) {
        return res.status(400).json({ message: "Цей волонтер уже призначений до завдання" });
      }
      
      // Перевіряємо, чи є вільні місця на завданні
      const currentAssignedCount = task.assignedVolunteerId ? 1 : 0;
      if (currentAssignedCount >= task.volunteersNeeded) {
        return res.status(400).json({ message: "Усі місця для волонтерів вже зайняті" });
      }
      
      const updatedTask = await storage.assignTaskToVolunteer(taskId, volunteerId);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // Get single task by ID
  app.get("/api/tasks/:id", isAuthenticated, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      // Check access rights
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      const isCoordinator = req.user!.role === "coordinator" && project.coordinatorId === req.user!.id;
      const isAssignedVolunteer = req.user!.role === "volunteer" && task.assignedVolunteerId === req.user!.id;
      const isModerator = req.user!.role === "moderator" || req.user!.role === "admin";
      
      if (!isCoordinator && !isAssignedVolunteer && !isModerator) {
        return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
      }
      
      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  // =========================
  // Report Routes
  // =========================
  
  // Submit report for a task
  app.post("/api/tasks/:id/reports", hasRole(["volunteer"]), upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 5 }
  ]), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      // Check if user is assigned to this task
      if (task.assignedVolunteerId !== req.user!.id) {
        return res.status(403).json({ message: "Ви не призначені до цього завдання" });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const imageUrls = files?.images?.map(file => `/uploads/${file.filename}`) || [];
      const receiptUrls = files?.documents?.map(file => `/uploads/${file.filename}`) || [];
      
      const reportData = {
        taskId,
        volunteerId: req.user!.id,
        description: req.body.description || '',
        spentAmount: req.body.spentAmount ? parseFloat(req.body.spentAmount) : null,
        remainingAmount: req.body.remainingAmount ? parseFloat(req.body.remainingAmount) : null,
        expensePurpose: req.body.expensePurpose || null,
        financialConfirmed: req.body.financialConfirmed === 'true',
        imageUrls,
        receiptUrls,
        status: 'pending'
      };
      
      const report = await storage.createReport(reportData);
      
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  });
  
  // Get reports for a task
  app.get("/api/tasks/:taskId/reports", isAuthenticated, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      const project = await storage.getProjectById(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project or the assigned volunteer
      const isCoordinator = req.user!.role === "coordinator" && project.coordinatorId === req.user!.id;
      const isAssignedVolunteer = req.user!.role === "volunteer" && task.assignedVolunteerId === req.user!.id;
      
      if (!isCoordinator && !isAssignedVolunteer) {
        return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
      }
      
      const reports = await storage.getReportsByTaskId(taskId);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  // Create a new report
  app.post("/api/reports", upload.array('files'), async (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "volunteer") {
      return res.status(403).json({ message: "Доступ заборонено" });
    }

    try {
      const { taskId, description, spentAmount, expensePurpose, comment, financialConfirmed } = req.body;
      
      if (!taskId || !description) {
        return res.status(400).json({ message: "Обов'язкові поля не заповнені" });
      }

      // Check if task exists and belongs to user
      const task = await storage.getTaskById(parseInt(taskId));
      if (!task || task.assignedVolunteerId !== req.user.id) {
        return res.status(403).json({ message: "Доступ до завдання заборонено" });
      }

      // Process uploaded files
      const files = req.files as Express.Multer.File[];
      const imageUrls: string[] = [];
      const receiptUrls: string[] = [];

      if (files) {
        files.forEach(file => {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = `/uploads/${fileName}`;
          
          // Save file to uploads directory
          require('fs').writeFileSync(`./uploads/${fileName}`, file.buffer);
          
          if (file.fieldname === 'images') {
            imageUrls.push(filePath);
          } else if (file.fieldname === 'documents') {
            receiptUrls.push(filePath);
          }
        });
      }

      const reportData = {
        taskId: parseInt(taskId),
        volunteerId: req.user.id,
        description,
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
        spentAmount: spentAmount ? parseFloat(spentAmount) : null,
        expensePurpose: expensePurpose || null,
        receiptUrls: receiptUrls.length > 0 ? receiptUrls : null,
        financialConfirmed: financialConfirmed === 'true',
        status: 'pending'
      };

      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Помилка створення звіту" });
    }
  });
  
  // =========================
  // Application Routes
  // =========================
  
  // Apply to a project as volunteer
  app.post("/api/projects/:projectId/apply", hasRole(["volunteer"]), async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if project is in a valid state for applications
      if (project.status !== "in_progress" && project.status !== "funding") {
        return res.status(400).json({ message: "Проєкт не приймає заявки в даний момент" });
      }
      
      // Check if volunteer has already applied
      const existingApplication = await storage.getApplicationByVolunteerAndProject(
        req.user!.id, 
        projectId
      );
      
      if (existingApplication) {
        return res.status(400).json({ message: "Ви вже подали заявку на цей проєкт" });
      }
      
      // Не потрібно використовувати insertApplicationSchema, оскільки projectId і volunteerId додаються автоматично
      const { message } = req.body;
      
      const application = await storage.createApplication({
        message: message || `Заявка від волонтера`,
        projectId,
        volunteerId: req.user!.id,
      });
      
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  });
  
  // Get applications for a project (coordinator only)
  app.get("/api/projects/:projectId/applications", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project or an admin
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole === "coordinator" && project.coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      const applications = await storage.getApplicationsByProjectId(projectId);
      
      // Додаємо інформацію про волонтерів та проєкт до заявок
      const applicationsWithVolunteers = await Promise.all(
        applications.map(async (application) => {
          const volunteer = await storage.getUser(application.volunteerId);
          return {
            ...application,
            volunteer: volunteer ? {
              id: volunteer.id,
              username: volunteer.username,
              firstName: volunteer.firstName,
              lastName: volunteer.lastName,
              email: volunteer.email,
              bio: volunteer.bio,
              region: volunteer.region,
              city: volunteer.city,
              phoneNumber: volunteer.phoneNumber,
              gender: volunteer.gender,
              birthDate: volunteer.birthDate
            } : null,
            project: {
              id: project.id,
              name: project.name
            }
          };
        })
      );
      
      res.json(applicationsWithVolunteers);
    } catch (error) {
      next(error);
    }
  });
  
  // Get applications for current user (volunteer)
  app.get("/api/user/applications", hasRole(["volunteer"]), async (req, res, next) => {
    try {
      const userId = getUserId(req);
      
      // Get all applications from the volunteer
      const applications = await storage.getApplicationsByVolunteerId(userId);
      
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });
  
  // Update application status (coordinator only)
  app.patch("/api/applications/:id/status", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID заявки" });
      }
      
      const { status } = z.object({
        status: z.enum(applicationStatusEnum.enumValues),
      }).parse(req.body);
      
      const application = await storage.getApplicationById(id);
      if (!application) {
        return res.status(404).json({ message: "Заявку не знайдено" });
      }
      
      const project = await storage.getProjectById(application.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project or an admin
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole === "coordinator" && project.coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(id, status);
      res.json(updatedApplication);
    } catch (error) {
      next(error);
    }
  });
  
  // =========================
  // Donation Routes
  // =========================
  
  // Make a donation to a project
  app.post("/api/projects/:projectId/donate", isAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if project is in a valid state for donations
      if (project.status !== "funding") {
        return res.status(400).json({ message: "Проєкт не приймає пожертви в даний момент" });
      }
      
      // Validate only the request body fields, projectId comes from URL
      const bodyData = insertDonationSchema.omit({ projectId: true }).parse(req.body);
      
      // In a real app, we would integrate with a payment processor here
      // For this demo, we'll just create the donation record
      
      const donation = await storage.createDonation({
        ...bodyData,
        projectId,
        donorId: req.user!.id,
      });
      
      // Update the project's collected amount
      await storage.updateProjectCollectedAmount(projectId, bodyData.amount);
      
      // Get updated project data to check if target is reached
      const updatedProject = await storage.getProjectById(projectId);
      if (updatedProject && updatedProject.collectedAmount >= updatedProject.targetAmount) {
        await storage.updateProjectStatus(projectId, "in_progress");
      }
      
      res.status(201).json(donation);
    } catch (error) {
      next(error);
    }
  });
  
  // Get donations for a project (coordinator only)
  app.get("/api/projects/:projectId/donations", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project or an admin
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole === "coordinator" && project.coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      const donations = await storage.getDonationsByProjectId(projectId);
      res.json(donations);
    } catch (error) {
      next(error);
    }
  });
  
  // Get donations made by the current user
  app.get("/api/user/donations", isAuthenticated, async (req, res, next) => {
    try {
      const donations = await storage.getDonationsByUserId(req.user!.id);
      res.json(donations);
    } catch (error) {
      next(error);
    }
  });
  
  // Create donation
  app.post("/api/donations", async (req, res, next) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);
      
      // Get project to update collected amount
      const project = await storage.getProjectById(donationData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if project is in funding status
      if (project.status !== "funding") {
        return res.status(400).json({ message: "Збір коштів для цього проєкту завершено" });
      }
      
      // Set donor ID if authenticated
      let donorId = null;
      if (req.isAuthenticated() && req.user?.role === "donor") {
        donorId = req.user.id;
      }
      
      // Create donation
      const donation = await storage.createDonation({
        ...donationData,
        donorId: donorId || donationData.donorId
      });
      
      // Update project collected amount
      await storage.updateProjectCollectedAmount(donationData.projectId, donationData.amount);
      
      // Get updated project data to check if target is reached
      const updatedProject = await storage.getProjectById(donationData.projectId);
      if (updatedProject && updatedProject.collectedAmount >= updatedProject.targetAmount) {
        await storage.updateProjectStatus(donationData.projectId, "in_progress");
      }
      
      res.status(201).json(donation);
    } catch (error) {
      next(error);
    }
  });

  // =========================
  // Moderator Routes
  // =========================
  
  // Get projects for moderation
  app.get("/api/projects/moderation", isAuthenticated, isModeratorMiddleware, async (req, res, next) => {
    try {
      const querySchema = z.object({
        status: z.enum(projectStatusEnum.enumValues).optional(),
        search: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional();
      
      const parsedQuery = querySchema.parse(req.query);
      const options = parsedQuery ? {
        status: parsedQuery.status,
        search: parsedQuery.search,
        limit: parsedQuery.limit !== undefined ? parsedQuery.limit : 20,
        offset: parsedQuery.offset !== undefined ? parsedQuery.offset : 0
      } : { limit: 20, offset: 0 };
      
      const projects = await storage.getProjects(options);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
  // Moderate a project
  app.post("/api/projects/:id/moderate", isAuthenticated, isModeratorMiddleware, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const { action, comment } = z.object({
        action: z.enum(["approve", "reject"]),
        comment: z.string().nullable(),
      }).parse(req.body);
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Модератори можуть тільки схвалювати або відхиляти проєкти для публікації
      // Статус фінансування (funding/in_progress/completed) змінюється тільки системою
      let updatedProject;
      if (action === "approve") {
        // Схвалення проєкту - залишаємо статус funding для збору коштів
        updatedProject = project.status === "funding" ? project : await storage.updateProjectStatus(id, "funding");
      } else {
        // Відхилення проєкту - можемо поставити статус як rejected або видалити
        // Для простоти залишимо проєкт, але з коментарем
        updatedProject = project;
      }
      
      // В реальній системі тут би зберігали коментар модератора в окремій таблиці
      
      res.json({
        project: updatedProject,
        message: action === "approve" 
          ? "Проєкт успішно схвалено для публікації" 
          : "Проєкт відхилено"
      });
    } catch (error) {
      next(error);
    }
  });

  // =========================
  // User Routes
  // =========================
  
  // Get all users (admin only)
  app.get("/api/users", hasRole(["admin"]), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Get user by ID (admin only)
  app.get("/api/users/:id", hasRole(["admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID користувача" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Користувача не знайдено" });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  // Verify user (admin only)
  app.post("/api/users/:id/verify", hasRole(["admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID користувача" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Користувача не знайдено" });
      }
      
      const verifiedUser = await storage.verifyUser(id);
      res.json(verifiedUser);
    } catch (error) {
      next(error);
    }
  });

  // Block user (admin only)
  app.post("/api/users/:id/block", hasRole(["admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID користувача" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Користувача не знайдено" });
      }
      
      if (user.role === "admin") {
        return res.status(400).json({ message: "Неможливо заблокувати адміністратора" });
      }
      
      const blockedUser = await storage.blockUser(id);
      res.json(blockedUser);
    } catch (error) {
      next(error);
    }
  });
  
  // Create project (admin can create for any coordinator)
  app.post("/api/admin/projects", hasRole(["admin"]), async (req, res, next) => {
    try {
      const data = insertProjectSchema.extend({
        coordinatorId: z.number()
      }).parse(req.body);
      
      const coordinator = await storage.getUser(data.coordinatorId);
      if (!coordinator || coordinator.role !== "coordinator") {
        return res.status(400).json({ message: "Вказаний користувач не є координатором" });
      }
      
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });
  
  // Update project (admin only)
  app.put("/api/projects/:id", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Координатори можуть редагувати тільки свої проєкти, адміни - будь-які
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole === "coordinator" && project.coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви можете редагувати тільки власні проєкти" });
      }
      
      const data = insertProjectSchema.extend({
        coordinatorId: z.number().optional()
      }).parse(req.body);
      
      // Тільки адміністратор може змінювати координатора проєкту
      if (data.coordinatorId && userRole !== "admin") {
        return res.status(403).json({ message: "Тільки адміністратор може змінювати координатора проєкту" });
      }
      
      // Заборонити зміну статусу та зібраної суми вручну - тільки система може це робити
      if (req.body.status) {
        return res.status(403).json({ message: "Статус проєкту змінюється автоматично системою" });
      }
      
      if (req.body.collectedAmount !== undefined) {
        return res.status(403).json({ message: "Зібрана сума змінюється автоматично при пожертвах" });
      }
      
      if (data.coordinatorId) {
        const coordinator = await storage.getUser(data.coordinatorId);
        if (!coordinator || coordinator.role !== "coordinator") {
          return res.status(400).json({ message: "Вказаний користувач не є координатором" });
        }
      }
      
      const updatedProject = await storage.updateProject(id, data);
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete project (coordinator can delete own project, admin can delete any)
  app.delete("/api/projects/:id", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Перевірка прав: Координатор може видаляти тільки свої проєкти
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole === "coordinator" && project.coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви можете видаляти тільки власні проєкти" });
      }
      
      await storage.deleteProject(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Get volunteers for a project (coordinator only)
  app.get("/api/projects/:projectId/volunteers", hasRole(["coordinator", "admin"]), async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Check if user is the coordinator of this project or an admin
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole === "coordinator" && project.coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви не є координатором цього проєкту" });
      }
      
      const volunteers = await storage.getVolunteersByProjectId(projectId);
      res.json(volunteers);
    } catch (error) {
      next(error);
    }
  });

  // Get projects for current volunteer
  app.get("/api/volunteer/projects", hasRole(["volunteer"]), async (req, res, next) => {
    try {
      const projects = await storage.getProjectsForVolunteer(req.user!.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // Get tasks for current volunteer
  app.get("/api/volunteer/tasks", hasRole(["volunteer"]), async (req, res, next) => {
    try {
      const tasks = await storage.getTasksForVolunteer(req.user!.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  // Get projects for current coordinator
  app.get("/api/coordinator/projects", hasRole(["coordinator"]), async (req, res, next) => {
    try {
      const projects = await storage.getProjectsByCoordinatorId(req.user!.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
  // === Модерація проектів ===
  
  // Отримання всіх модерацій для проекту
  app.get("/api/projects/:projectId/moderation", isAuthenticated, async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }

      // Перевірка доступу (тільки координатор проекту, модератор або адмін)
      const userRole = getUserRole(req);
      if (userRole !== "moderator" && userRole !== "admin") {
        const project = await storage.getProjectById(projectId);
        if (!project) {
          return res.status(404).json({ message: "Проєкт не знайдено" });
        }
        
        if (userRole === "coordinator" && project.coordinatorId !== getUserId(req)) {
          return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
        }
      }
      
      const moderations = await storage.getProjectModerations(projectId);
      res.json(moderations);
    } catch (error) {
      next(error);
    }
  });
  
  // Модерація проекту (тільки для модераторів та адміністраторів)
  app.post("/api/projects/:projectId/moderate", hasRole(["moderator", "admin"]), async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      const { status, comment } = z.object({
        status: z.enum(moderationStatusEnum.enumValues),
        comment: z.string().optional(),
      }).parse(req.body);
      
      // Створення нового запису модерації
      const moderation = await storage.createProjectModeration({
        projectId,
        status,
        comment: comment || null,
        moderatorId: getUserId(req)
      });
      
      // Якщо проект був схвалений, ми робимо його опублікованим
      if (status === "approved") {
        // В реальній системі тут ми б оновили поле isPublished,
        // але оскільки ми не змінюємо схему, будемо вважати, що проект опубліковано
      }
      
      res.json(moderation);
    } catch (error) {
      next(error);
    }
  });

  // Get projects for a specific coordinator (allows coordinator to get own projects and admin to get any coordinator's projects)
  app.get("/api/projects/coordinator/:id", isAuthenticated, async (req, res, next) => {
    try {
      const coordinatorId = parseInt(req.params.id);
      if (isNaN(coordinatorId)) {
        return res.status(400).json({ message: "Некоректний ID координатора" });
      }
      
      // Check if user is the coordinator or an admin
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole !== "admin" && coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви можете переглядати тільки власні проєкти" });
      }
      
      const projects = await storage.getProjectsByCoordinatorId(coordinatorId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // Get applications for a specific coordinator
  app.get("/api/coordinator/:id/applications", isAuthenticated, async (req, res, next) => {
    try {
      const coordinatorId = parseInt(req.params.id);
      if (isNaN(coordinatorId)) {
        return res.status(400).json({ message: "Некоректний ID координатора" });
      }
      
      // Check if user is the coordinator or an admin
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      if (userRole !== "admin" && coordinatorId !== userId) {
        return res.status(403).json({ message: "Ви можете переглядати тільки власні заявки" });
      }
      
      // Get coordinator's projects first
      const projects = await storage.getProjectsByCoordinatorId(coordinatorId);
      if (!projects.length) {
        return res.json([]);
      }
      
      // Collect all applications for all projects
      const applications = [];
      for (const project of projects) {
        const projectApplications = await storage.getApplicationsByProjectId(project.id);
        applications.push(...projectApplications);
      }
      
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  // =========================
  // Donation Routes
  // =========================
  
  // Get donations for a project
  app.get("/api/projects/:projectId/donations", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const donations = await storage.getDonationsByProjectId(projectId);
      res.json(donations);
    } catch (error) {
      next(error);
    }
  });

  // =========================
  // Project Report Routes
  // =========================
  
  // Get reports for a project
  app.get("/api/projects/:projectId/reports", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Некоректний ID проєкту" });
      }
      
      const reports = await storage.getProjectReportsByProjectId(projectId);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
