import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import path from "path";
import { projectImageUpload } from "./middleware/upload";
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
      
      // Отримуємо всі проєкти
      const allProjects = await storage.getProjects(options);
      
      // Якщо користувач не автентифікований або не має спеціальних ролей,
      // повертаємо тільки опубліковані проєкти (які пройшли модерацію)
      if (!req.isAuthenticated() || !req.user) {
        // Для неавторизованих користувачів показуємо лише проєкти, схвалені модераторами
        const approvedProjects = [];
        
        for (const project of allProjects) {
          const moderations = await storage.getProjectModerations(project.id);
          if (moderations.length > 0 && moderations[0].status === "approved") {
            approvedProjects.push(project);
          }
        }
        
        return res.json(approvedProjects);
      }
      
      // Перевіряємо роль користувача
      const userRole = getUserRole(req);
      const userId = getUserId(req);
      
      // Модератори та адміни бачать всі проєкти
      if (userRole === "moderator" || userRole === "admin") {
        return res.json(allProjects);
      }
      
      // Координатори бачать власні проєкти та опубліковані проєкти
      if (userRole === "coordinator") {
        const filteredProjects = [];
        
        for (const project of allProjects) {
          // Додаємо власні проєкти координатора
          if (project.coordinatorId === userId) {
            filteredProjects.push(project);
            continue;
          }
          
          // Додаємо схвалені проєкти
          const moderations = await storage.getProjectModerations(project.id);
          if (moderations.length > 0 && moderations[0].status === "approved") {
            filteredProjects.push(project);
          }
        }
        
        return res.json(filteredProjects);
      }
      
      // Для всіх інших авторизованих користувачів (донори, волонтери)
      // повертаємо тільки опубліковані проєкти
      const approvedProjects = [];
      
      for (const project of allProjects) {
        const moderations = await storage.getProjectModerations(project.id);
        if (moderations.length > 0 && moderations[0].status === "approved") {
          approvedProjects.push(project);
        }
      }
      
      res.json(approvedProjects);
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
      
      // Створюємо проект
      const project = await storage.createProject({
        ...data,
        coordinatorId,
        status: "funding", // Set initial status
        collectedAmount: 0, // Set initial collected amount
      });
      
      // Автоматично створюємо запис модерації зі статусом "pending"
      await storage.createProjectModeration({
        projectId: project.id,
        status: "pending", 
        comment: null,
        moderatorId: 0 // 0 означає автоматичну модерацію (система)
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
        
        // Автоматично створюємо запис модерації зі статусом "pending"
        await storage.createProjectModeration({
          projectId: project.id,
          status: "pending", 
          comment: null,
          moderatorId: 0 // 0 означає автоматичну модерацію (система)
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
      
      const data = insertTaskSchema.parse(req.body);
      
      const task = await storage.createTask({
        ...data,
        projectId,
      });
      
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
      const isAssignedVolunteer = req.user!.role === "volunteer" && task.volunteerId === req.user!.id;
      
      if (!isCoordinator && !isAssignedVolunteer) {
        return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
      }
      
      const updatedTask = await storage.updateTaskStatus(id, status);
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // =========================
  // Report Routes
  // =========================
  
  // Submit report for a task
  app.post("/api/tasks/:taskId/reports", hasRole(["volunteer"]), async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Некоректний ID завдання" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Завдання не знайдено" });
      }
      
      // Check if user is assigned to this task
      if (task.volunteerId !== req.user!.id) {
        return res.status(403).json({ message: "Ви не призначені до цього завдання" });
      }
      
      const data = insertReportSchema.parse(req.body);
      
      const report = await storage.createReport({
        ...data,
        taskId,
      });
      
      // Update task status to completed
      await storage.updateTaskStatus(taskId, "completed");
      
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
      const isAssignedVolunteer = req.user!.role === "volunteer" && task.volunteerId === req.user!.id;
      
      if (!isCoordinator && !isAssignedVolunteer) {
        return res.status(403).json({ message: "Недостатньо прав для цієї дії" });
      }
      
      const reports = await storage.getReportsByTaskId(taskId);
      res.json(reports);
    } catch (error) {
      next(error);
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
      if (project.status !== "in_progress") {
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
      
      const data = insertApplicationSchema.parse(req.body);
      
      const application = await storage.createApplication({
        ...data,
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
      
      const data = insertDonationSchema.parse(req.body);
      
      // In a real app, we would integrate with a payment processor here
      // For this demo, we'll just create the donation record
      
      const donation = await storage.createDonation({
        ...data,
        projectId,
        donorId: req.user!.id,
      });
      
      // Update the project's collected amount
      await storage.updateProjectCollectedAmount(projectId, data.amount);
      
      // Check if project has reached its target amount
      if (project.collectedAmount + data.amount >= project.targetAmount) {
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
      await storage.updateProjectCollectedAmount(donationData.projectId, project.collectedAmount + donationData.amount);
      
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
      
      const { status, comment } = z.object({
        status: z.enum(["in_progress", "completed"]),
        comment: z.string().nullable(),
      }).parse(req.body);
      
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Проєкт не знайдено" });
      }
      
      // Update project status based on moderation decision
      const updatedProject = await storage.updateProjectStatus(id, status);
      
      // In a real implementation, we'd also store the moderation comment
      // and associate it with the project for historical tracking
      
      res.json({
        project: updatedProject,
        message: status === "in_progress" 
          ? "Проєкт успішно схвалено" 
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
        status: z.enum(projectStatusEnum.enumValues).optional(),
        collectedAmount: z.number().optional(),
        coordinatorId: z.number().optional()
      }).parse(req.body);
      
      // Тільки адміністратор може змінювати координатора проєкту
      if (data.coordinatorId && userRole !== "admin") {
        return res.status(403).json({ message: "Тільки адміністратор може змінювати координатора проєкту" });
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
  
  // Отримання проектів, що потребують модерації (для модераторів)
  app.get("/api/projects/moderation", hasRole(["moderator", "admin"]), async (req, res, next) => {
    try {
      // Отримати всі проекти, які потребують модерації
      const projects = await storage.getProjectsForModeration();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
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

  const httpServer = createServer(app);
  return httpServer;
}
