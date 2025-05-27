import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, projects, tasks, reports, applications, donations, projectModerations,
  type User, type InsertUser, type Project, type InsertProject,
  type Task, type InsertTask, type Report, type InsertReport,
  type Application, type InsertApplication, type Donation, type InsertDonation
} from "@shared/schema";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = ConnectPgSimple(session);

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
    this.sessionStore = new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        isVerified: insertUser.isVerified || false,
        isBlocked: insertUser.isBlocked || false,
        verificationToken: insertUser.verificationToken || null,
      })
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
      .set({ isBlocked: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Project methods - SIMPLIFIED to always show all projects
  async getProjects(options?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Project[]> {
    let query = db.select().from(projects);
    
    if (options?.search) {
      query = query.where(ilike(projects.name, `%${options.search}%`));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    query = query.orderBy(desc(projects.createdAt));
    
    return await query;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByCoordinatorId(coordinatorId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.coordinatorId, coordinatorId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectsForVolunteer(volunteerId: number): Promise<Project[]> {
    const volunteer_projects = await db
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
    
    return volunteer_projects.map(row => row.project);
  }

  async createProject(insertProject: InsertProject & { coordinatorId: number; status?: string; collectedAmount?: number }): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        name: insertProject.name,
        description: insertProject.description,
        targetAmount: insertProject.targetAmount,
        imageUrl: insertProject.imageUrl || null,
        bankDetails: insertProject.bankDetails || null,
        coordinatorId: insertProject.coordinatorId,
        status: (insertProject.status as any) || "funding",
        collectedAmount: insertProject.collectedAmount || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return project;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ 
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async updateProjectCollectedAmount(id: number, amount: number): Promise<Project> {
    // First, get the current project to check status and amounts
    const currentProject = await this.getProjectById(id);
    if (!currentProject) {
      throw new Error("Project not found");
    }

    // Calculate new collected amount
    const newCollectedAmount = currentProject.collectedAmount + amount;
    
    // Determine if status should change from "funding" to "in_progress"
    const shouldChangeStatus = 
      currentProject.status === "funding" && 
      newCollectedAmount >= currentProject.targetAmount;

    const updateData: any = { 
      collectedAmount: newCollectedAmount,
      updatedAt: new Date()
    };

    // Auto-change status if funding goal is reached
    if (shouldChangeStatus) {
      updateData.status = "in_progress";
    }

    const [project] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({
        ...projectData,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    // Delete related records first to avoid foreign key constraint errors
    
    // Delete donations
    await db.delete(donations).where(eq(donations.projectId, id));
    
    // Delete reports related to tasks of this project
    const projectTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, id));
    for (const task of projectTasks) {
      await db.delete(reports).where(eq(reports.taskId, task.id));
    }
    
    // Delete tasks
    await db.delete(tasks).where(eq(tasks.projectId, id));
    
    // Delete applications
    await db.delete(applications).where(eq(applications.projectId, id));
    
    // Delete project moderations
    await db.delete(projectModerations).where(eq(projectModerations.projectId, id));
    
    // Finally delete the project
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project Moderation Methods
  async getProjectModerations(projectId: number): Promise<any[]> {
    return await db
      .select()
      .from(projectModerations)
      .where(eq(projectModerations.projectId, projectId))
      .orderBy(desc(projectModerations.createdAt));
  }

  async createProjectModeration(moderation: { 
    projectId: number; 
    status: string; 
    comment: string | null; 
    moderatorId: number 
  }): Promise<any> {
    const [moderationRecord] = await db
      .insert(projectModerations)
      .values({
        projectId: moderation.projectId,
        status: moderation.status as any,
        comment: moderation.comment,
        moderatorId: moderation.moderatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return moderationRecord;
  }

  async getProjectsForModeration(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  // Task methods
  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
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
      .values({
        ...insertTask,
        status: (insertTask.status as any) || "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return task;
  }

  async assignTaskToVolunteer(id: number, volunteerId: number): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ 
        volunteerId,
        status: "in_progress" as any,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ 
        status: status as any,
        updatedAt: new Date()
      })
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
      .values({
        ...insertReport,
        createdAt: new Date(),
      })
      .returning();
    return report;
  }

  // Application methods
  async getApplicationById(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
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
    return application || undefined;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values({
        ...insertApplication,
        status: "pending",
        createdAt: new Date(),
      })
      .returning();
    return application;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ status: status as any })
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
    // Create the donation first
    const [donation] = await db
      .insert(donations)
      .values({
        ...insertDonation,
        comment: insertDonation.comment || null,
        createdAt: new Date(),
      })
      .returning();
    
    // Update the project's collected amount and potentially change status
    await this.updateProjectCollectedAmount(donation.projectId, donation.amount);
    
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

export const storage = new DatabaseStorage();