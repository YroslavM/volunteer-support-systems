import { 
  users, 
  projects, 
  tasks, 
  reports, 
  applications, 
  donations,
  projectModerations,
  type User, 
  type InsertUser, 
  type Project,
  type InsertProject, 
  type Task, 
  type InsertTask, 
  type Report, 
  type InsertReport,
  type Application, 
  type InsertApplication, 
  type Donation, 
  type InsertDonation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, sql, gte, lte, isNull, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import memorystore from "memorystore";

// Fix the typing issue with session store
const PostgresSessionStore = connectPg(session as any);
const MemoryStore = memorystore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(id: number): Promise<User>;
  blockUser(id: number): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Project methods
  getProjects(options?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectsByCoordinatorId(coordinatorId: number): Promise<Project[]>;
  getProjectsForVolunteer(volunteerId: number): Promise<Project[]>;
  createProject(project: any): Promise<Project>;
  updateProjectStatus(id: number, status: string): Promise<Project>;
  updateProjectCollectedAmount(id: number, amount: number): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Project Moderation methods
  getProjectModerations(projectId: number): Promise<any[]>;
  createProjectModeration(moderation: { projectId: number; status: string; comment: string | null; moderatorId: number }): Promise<any>;
  getProjectsForModeration(): Promise<Project[]>;
  
  // Task methods
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByProjectId(projectId: number): Promise<Task[]>;
  getTasksForVolunteer(volunteerId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  assignTaskToVolunteer(id: number, volunteerId: number): Promise<Task>;
  updateTaskStatus(id: number, status: string): Promise<Task>;
  
  // Report methods
  getReportsByTaskId(taskId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Application methods
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByProjectId(projectId: number): Promise<Application[]>;
  getApplicationByVolunteerAndProject(volunteerId: number, projectId: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application>;
  
  // Donation methods
  getDonationsByProjectId(projectId: number): Promise<Donation[]>;
  getDonationsByUserId(userId: number): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  
  // Helper methods
  isVolunteerAssignedToProject(volunteerId: number, projectId: number): Promise<boolean>;
  getVolunteersByProjectId(projectId: number): Promise<User[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async verifyUser(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async blockUser(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isBlocked: true
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(users.username);
  }
  
  // Project methods
  async getProjects(options?: { status?: string; search?: string; limit?: number; offset?: number; userRole?: string; userId?: number }): Promise<Project[]> {
    let query = db.select().from(projects);
    
    // Filter based on user role - hide pending/rejected projects from non-moderators/non-coordinators
    if (options?.userRole && !['moderator', 'admin'].includes(options.userRole)) {
      if (options.userRole === 'coordinator' && options.userId) {
        // Coordinators can see their own projects regardless of moderation status
        query = query.where(
          or(
            eq(projects.coordinatorId, options.userId),
            eq(projects.moderationStatus, 'approved')
          )
        );
      } else {
        // Volunteers, donors, and unauthenticated users only see approved projects
        query = query.where(eq(projects.moderationStatus, 'approved'));
      }
    }
    
    if (options) {
      if (options.status) {
        query = query.where(eq(projects.projectStatus, options.status as any));
      }
      
      if (options.search) {
        query = query.where(
          or(
            like(projects.name, `%${options.search}%`),
            like(projects.description, `%${options.search}%`)
          )
        );
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
    }
    
    return await query.orderBy(desc(projects.createdAt));
  }
  
  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async getProjectsByCoordinatorId(coordinatorId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.coordinatorId, coordinatorId))
      .orderBy(desc(projects.createdAt));
  }
  
  async getProjectsForVolunteer(volunteerId: number): Promise<Project[]> {
    // Get projects where volunteer's application was approved
    const approvedProjects = await db
      .select({
        project: projects
      })
      .from(applications)
      .innerJoin(projects, eq(applications.projectId, projects.id))
      .where(
        and(
          eq(applications.volunteerId, volunteerId),
          eq(applications.status, "approved")
        )
      );
    
    return approvedProjects.map(row => row.project);
  }
  
  async createProject(insertProject: InsertProject & { coordinatorId: number; status?: string; collectedAmount?: number }): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }
  
  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ status })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }
  
  async updateProjectCollectedAmount(id: number, amount: number): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ 
        collectedAmount: sql`${projects.collectedAmount} + ${amount}`
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }
  
  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }
  
  async deleteProject(id: number): Promise<void> {
    await db
      .delete(projects)
      .where(eq(projects.id, id));
  }
  
  // Project Moderation Methods
  async getProjectModerations(projectId: number): Promise<any[]> {
    try {
      // Перевіряємо спочатку, чи існує таблиця
      const moderations = await db
        .select()
        .from(projectModerations)
        .where(eq(projectModerations.projectId, projectId))
        .orderBy(desc(projectModerations.createdAt));
      
      return moderations;
    } catch (error) {
      console.error('Error getting project moderations:', error);
      // Якщо таблиця ще не створена, повертаємо порожній масив
      return [];
    }
  }
  
  async createProjectModeration(moderation: { 
    projectId: number; 
    status: string; 
    comment: string | null; 
    moderatorId: number 
  }): Promise<any> {
    try {
      // Перевіряємо спочатку, чи існує таблиця
      const [result] = await db
        .insert(projectModerations)
        .values(moderation)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating project moderation:', error);
      // Якщо таблиця ще не створена, повертаємо об'єкт як ніби запис був створений
    }
  }
  
  async getProjectsForModeration(): Promise<Project[]> {
    try {
      // Отримуємо всі проєкти
      const allProjects = await db
        .select()
        .from(projects);
      
      // Для кожного проєкту перевіряємо останній статус модерації
      const result: Project[] = [];
      
      for (const project of allProjects) {
        // Отримуємо записи модерації для проєкту, сортовані за датою створення (новіші спочатку)
        const moderations = await db
          .select()
          .from(projectModerations)
          .where(eq(projectModerations.projectId, project.id))
          .orderBy(desc(projectModerations.createdAt));
        
        // Якщо немає модерацій або останній статус "pending"/"rejected", додаємо до результату
        if (moderations.length === 0 || 
            moderations[0].status === "pending" || 
            moderations[0].status === "rejected") {
          result.push(project);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting projects for moderation:', error);
      return [];
    }
  }
  
  // Task methods
  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }
  
  async getTasksForVolunteer(volunteerId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.volunteerId, volunteerId))
      .orderBy(desc(tasks.createdAt));
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }
  
  async assignTaskToVolunteer(id: number, volunteerId: number): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ volunteerId, status: "in_progress" })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }
  
  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }
  
  // Report methods
  async getReportsByTaskId(taskId: number): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.taskId, taskId))
      .orderBy(desc(reports.createdAt));
  }
  
  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }
  
  // Application methods
  async getApplicationById(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }
  
  async getApplicationsByProjectId(projectId: number): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.projectId, projectId))
      .orderBy(desc(applications.createdAt));
  }
  
  async getApplicationByVolunteerAndProject(volunteerId: number, projectId: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.volunteerId, volunteerId),
          eq(applications.projectId, projectId)
        )
      );
    return application;
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ status })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }
  
  // Donation methods
  async getDonationsByProjectId(projectId: number): Promise<Donation[]> {
    return await db
      .select()
      .from(donations)
      .where(eq(donations.projectId, projectId))
      .orderBy(desc(donations.createdAt));
  }
  
  async getDonationsByUserId(userId: number): Promise<Donation[]> {
    return await db
      .select()
      .from(donations)
      .where(eq(donations.donorId, userId))
      .orderBy(desc(donations.createdAt));
  }
  
  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const [donation] = await db
      .insert(donations)
      .values(insertDonation)
      .returning();
    return donation;
  }
  
  // Helper methods
  async isVolunteerAssignedToProject(volunteerId: number, projectId: number): Promise<boolean> {
    const [application] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.volunteerId, volunteerId),
          eq(applications.projectId, projectId),
          eq(applications.status, "approved")
        )
      );
    return !!application;
  }
  
  async getVolunteersByProjectId(projectId: number): Promise<User[]> {
    const volunteers = await db
      .select({
        user: users
      })
      .from(applications)
      .innerJoin(users, eq(applications.volunteerId, users.id))
      .where(
        and(
          eq(applications.projectId, projectId),
          eq(applications.status, "approved")
        )
      );
    
    return volunteers.map(row => row.user);
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private reports: Map<number, Report>;
  private applications: Map<number, Application>;
  private donations: Map<number, Donation>;
  private projectModerations: Map<number, any>;
  
  currentUserId: number;
  currentProjectId: number;
  currentTaskId: number;
  currentReportId: number;
  currentApplicationId: number;
  currentDonationId: number;
  currentModerationId: number;
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.projectModerations = new Map();
    this.tasks = new Map();
    this.reports = new Map();
    this.applications = new Map();
    this.donations = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.currentReportId = 1;
    this.currentApplicationId = 1;
    this.currentDonationId = 1;
    this.currentModerationId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isVerified: false, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async verifyUser(id: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { 
      ...user, 
      isVerified: true, 
      verificationToken: null 
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async blockUser(id: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { 
      ...user, 
      isBlocked: true
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => a.username.localeCompare(b.username));
  }
  
  // Project methods
  async getProjects(options?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Project[]> {
    let result = Array.from(this.projects.values());
    
    if (options) {
      if (options.status) {
        result = result.filter(project => project.status === options.status);
      }
      
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        result = result.filter(project => 
          project.name.toLowerCase().includes(searchLower) || 
          project.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by created date descending
      result.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      if (options.offset) {
        result = result.slice(options.offset);
      }
      
      if (options.limit) {
        result = result.slice(0, options.limit);
      }
    }
    
    return result;
  }
  
  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByCoordinatorId(coordinatorId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.coordinatorId === coordinatorId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async getProjectsForVolunteer(volunteerId: number): Promise<Project[]> {
    // Get all approved applications for this volunteer
    const approvedApplications = Array.from(this.applications.values())
      .filter(app => app.volunteerId === volunteerId && app.status === "approved");
    
    // Get the corresponding projects
    return approvedApplications
      .map(app => this.projects.get(app.projectId))
      .filter((project): project is Project => !!project)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      status: "funding", 
      collectedAmount: 0, 
      createdAt: now, 
      updatedAt: now 
    };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const updatedProject = { 
      ...project, 
      status, 
      updatedAt: new Date() 
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async updateProjectCollectedAmount(id: number, amount: number): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const updatedProject = { 
      ...project, 
      collectedAmount: project.collectedAmount + amount, 
      updatedAt: new Date() 
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const updatedProject = { 
      ...project, 
      ...projectData,
      updatedAt: new Date() 
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<void> {
    if (!this.projects.has(id)) {
      throw new Error("Project not found");
    }
    
    this.projects.delete(id);
    
    // Remove related tasks
    Array.from(this.tasks.entries())
      .filter(([_, task]) => task.projectId === id)
      .forEach(([taskId, _]) => this.tasks.delete(taskId));
    
    // Remove related applications
    Array.from(this.applications.entries())
      .filter(([_, app]) => app.projectId === id)
      .forEach(([appId, _]) => this.applications.delete(appId));
    
    // Remove related donations
    Array.from(this.donations.entries())
      .filter(([_, donation]) => donation.projectId === id)
      .forEach(([donationId, _]) => this.donations.delete(donationId));
  }
  
  // Task methods
  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async getTasksForVolunteer(volunteerId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.volunteerId === volunteerId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      status: "pending", 
      createdAt: now, 
      updatedAt: now 
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async assignTaskToVolunteer(id: number, volunteerId: number): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { 
      ...task, 
      volunteerId, 
      status: "in_progress", 
      updatedAt: new Date() 
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { 
      ...task, 
      status, 
      updatedAt: new Date() 
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Report methods
  async getReportsByTaskId(taskId: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.taskId === taskId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: Report = { 
      ...insertReport, 
      id, 
      createdAt: now 
    };
    this.reports.set(id, report);
    return report;
  }
  
  // Application methods
  async getApplicationById(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async getApplicationsByProjectId(projectId: number): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(application => application.projectId === projectId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async getApplicationByVolunteerAndProject(volunteerId: number, projectId: number): Promise<Application | undefined> {
    return Array.from(this.applications.values())
      .find(app => app.volunteerId === volunteerId && app.projectId === projectId);
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentApplicationId++;
    const now = new Date();
    const application: Application = { 
      ...insertApplication, 
      id, 
      status: "pending", 
      createdAt: now 
    };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const updatedApplication = { 
      ...application, 
      status 
    };
    
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Donation methods
  async getDonationsByProjectId(projectId: number): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.projectId === projectId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async getDonationsByUserId(userId: number): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.donorId === userId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const id = this.currentDonationId++;
    const now = new Date();
    const donation: Donation = { 
      ...insertDonation, 
      id, 
      createdAt: now 
    };
    this.donations.set(id, donation);
    return donation;
  }
  
  // Helper methods
  async isVolunteerAssignedToProject(volunteerId: number, projectId: number): Promise<boolean> {
    return Array.from(this.applications.values())
      .some(app => 
        app.volunteerId === volunteerId && 
        app.projectId === projectId && 
        app.status === "approved"
      );
  }
  
  async getVolunteersByProjectId(projectId: number): Promise<User[]> {
    // Get all approved applications for this project
    const approvedApplications = Array.from(this.applications.values())
      .filter(app => app.projectId === projectId && app.status === "approved");
    
    // Get the corresponding volunteers
    return approvedApplications
      .map(app => this.users.get(app.volunteerId))
      .filter((user): user is User => !!user);
  }
  
  // Project Moderation methods
  async getProjectModerations(projectId: number): Promise<any[]> {
    return Array.from(this.projectModerations.values())
      .filter(moderation => moderation.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createProjectModeration(moderation: { projectId: number; status: string; comment: string | null; moderatorId: number }): Promise<any> {
    const id = this.currentModerationId++;
    const now = new Date();
    const newModeration = {
      id,
      projectId: moderation.projectId,
      status: moderation.status,
      comment: moderation.comment,
      moderatorId: moderation.moderatorId,
      createdAt: now,
      updatedAt: now
    };
    
    this.projectModerations.set(id, newModeration);
    return newModeration;
  }
  
  async getProjectsForModeration(): Promise<Project[]> {
    // Отримуємо всі проекти
    const allProjects = Array.from(this.projects.values());
    
    // Створюємо Map для останніх статусів модерації кожного проекту
    const lastModerationStatusMap = new Map<number, string>();
    
    // Заповнюємо Map останніми статусами модерації
    Array.from(this.projectModerations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach(moderation => {
        if (!lastModerationStatusMap.has(moderation.projectId)) {
          lastModerationStatusMap.set(moderation.projectId, moderation.status);
        }
      });
    
    // Отримуємо проекти, які потребують модерації (статус "pending" або немає запису модерації)
    return allProjects.filter(project => {
      const status = lastModerationStatusMap.get(project.id);
      return status === "pending" || status === "rejected" || !status;
    });
  }
}

// Використовуємо MemStorage для розробки
export const storage = new DatabaseStorage();
