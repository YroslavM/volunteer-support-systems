import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, projects, tasks, reports, applications, donations, projectModerations,
  type User, type InsertUser, type Project, type InsertProject,
  type Task, type InsertTask, type Report, type InsertReport,
  type Application, type InsertApplication, type Donation, type InsertDonation,
  type ProjectModeration, type InsertProjectModeration
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
  getProjectModerations(projectId: number): Promise<ProjectModeration[]>;
  createProjectModeration(moderation: { projectId: number; status: string; comment: string | null; moderatorId: number }): Promise<ProjectModeration>;
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

  // =============================
  // USER METHODS
  // =============================

  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting user by verification token:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        role: insertUser.role,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        isVerified: insertUser.isVerified || false,
        isBlocked: insertUser.isBlocked || false,
        verificationToken: insertUser.verificationToken || null,
      })
      .returning();
    return result[0];
  }

  async verifyUser(id: number): Promise<User> {
    const result = await db
      .update(users)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async blockUser(id: number): Promise<User> {
    const result = await db
      .update(users)
      .set({ isBlocked: true })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // =============================
  // PROJECT METHODS  
  // =============================

  async getProjects(options?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Project[]> {
    try {
      let query = db.select().from(projects);
      
      // Always show published projects
      query = query.where(eq(projects.isPublished, true));
      
      if (options?.search) {
        query = query.where(and(
          eq(projects.isPublished, true),
          ilike(projects.name, `%${options.search}%`)
        ));
      }
      
      query = query.orderBy(desc(projects.createdAt));
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error("Error getting projects:", error);
      return [];
    }
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    try {
      const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting project by id:", error);
      return undefined;
    }
  }

  async getProjectsByCoordinatorId(coordinatorId: number): Promise<Project[]> {
    try {
      return await db
        .select()
        .from(projects)
        .where(eq(projects.coordinatorId, coordinatorId))
        .orderBy(desc(projects.createdAt));
    } catch (error) {
      console.error("Error getting projects by coordinator:", error);
      return [];
    }
  }

  async getProjectsForVolunteer(volunteerId: number): Promise<Project[]> {
    try {
      const approvedApplications = await db
        .select({ projectId: applications.projectId })
        .from(applications)
        .where(
          and(
            eq(applications.volunteerId, volunteerId),
            eq(applications.status, "approved")
          )
        );
      
      if (approvedApplications.length === 0) {
        return [];
      }
      
      const projectIds = approvedApplications.map(app => app.projectId);
      const volunteerProjects = [];
      
      for (const projectId of projectIds) {
        const project = await this.getProjectById(projectId);
        if (project) {
          volunteerProjects.push(project);
        }
      }
      
      return volunteerProjects;
    } catch (error) {
      console.error("Error getting projects for volunteer:", error);
      return [];
    }
  }

  async createProject(insertProject: InsertProject & { coordinatorId: number }): Promise<Project> {
    const result = await db
      .insert(projects)
      .values({
        name: insertProject.name,
        description: insertProject.description,
        targetAmount: insertProject.targetAmount,
        imageUrl: insertProject.imageUrl || null,
        bankDetails: insertProject.bankDetails || null,
        coordinatorId: insertProject.coordinatorId,
        status: "funding",
        collectedAmount: 0,
        moderationStatus: "approved",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const result = await db
      .update(projects)
      .set({ 
        status: status as "funding" | "in_progress" | "completed",
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async updateProjectCollectedAmount(id: number, amount: number): Promise<Project> {
    // Get current project
    const currentProject = await this.getProjectById(id);
    if (!currentProject) {
      throw new Error("Project not found");
    }

    const newCollectedAmount = currentProject.collectedAmount + amount;
    
    // Check if funding goal is reached and status should change
    const shouldChangeStatus = 
      currentProject.status === "funding" && 
      newCollectedAmount >= currentProject.targetAmount;

    const updateData: any = { 
      collectedAmount: newCollectedAmount,
      updatedAt: new Date()
    };

    if (shouldChangeStatus) {
      updateData.status = "in_progress";
    }

    const result = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    
    return result[0];
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const result = await db
      .update(projects)
      .set({
        ...projectData,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: number): Promise<void> {
    // The CASCADE relationships in schema will handle related records automatically
    await db.delete(projects).where(eq(projects.id, id));
  }

  // =============================
  // PROJECT MODERATION METHODS
  // =============================

  async getProjectModerations(projectId: number): Promise<ProjectModeration[]> {
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
  }): Promise<ProjectModeration> {
    const result = await db
      .insert(projectModerations)
      .values({
        projectId: moderation.projectId,
        status: moderation.status as "pending" | "approved" | "rejected",
        comment: moderation.comment,
        moderatorId: moderation.moderatorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async getProjectsForModeration(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  // =============================
  // TASK METHODS
  // =============================

  async getTaskById(id: number): Promise<Task | undefined> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting task by id:", error);
      return undefined;
    }
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
    const result = await db
      .insert(tasks)
      .values({
        title: insertTask.title,
        description: insertTask.description,
        projectId: insertTask.projectId,
        volunteerId: insertTask.volunteerId || null,
        status: insertTask.status || "pending",
        deadline: insertTask.deadline || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async assignTaskToVolunteer(id: number, volunteerId: number): Promise<Task> {
    const result = await db
      .update(tasks)
      .set({ 
        volunteerId,
        status: "in_progress",
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const result = await db
      .update(tasks)
      .set({ 
        status: status as "pending" | "in_progress" | "completed",
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  // =============================
  // REPORT METHODS
  // =============================

  async getReportsByTaskId(taskId: number): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.taskId, taskId))
      .orderBy(desc(reports.createdAt));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const result = await db
      .insert(reports)
      .values({
        taskId: insertReport.taskId,
        imageUrl: insertReport.imageUrl || null,
        comment: insertReport.comment || null,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  // =============================
  // APPLICATION METHODS
  // =============================

  async getApplicationById(id: number): Promise<Application | undefined> {
    try {
      const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting application by id:", error);
      return undefined;
    }
  }

  async getApplicationsByProjectId(projectId: number): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.projectId, projectId))
      .orderBy(desc(applications.createdAt));
  }

  async getApplicationByVolunteerAndProject(volunteerId: number, projectId: number): Promise<Application | undefined> {
    try {
      const result = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.volunteerId, volunteerId),
            eq(applications.projectId, projectId)
          )
        )
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting application by volunteer and project:", error);
      return undefined;
    }
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const result = await db
      .insert(applications)
      .values({
        projectId: insertApplication.projectId,
        volunteerId: insertApplication.volunteerId,
        status: "pending",
        message: insertApplication.message || null,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application> {
    const result = await db
      .update(applications)
      .set({ status: status as "pending" | "approved" | "rejected" })
      .where(eq(applications.id, id))
      .returning();
    return result[0];
  }

  // =============================
  // DONATION METHODS
  // =============================

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
    const result = await db
      .insert(donations)
      .values({
        projectId: insertDonation.projectId,
        donorId: insertDonation.donorId || null,
        amount: insertDonation.amount,
        comment: insertDonation.comment || null,
        createdAt: new Date(),
      })
      .returning();
    
    const donation = result[0];
    
    // Update the project's collected amount (and potentially change status)
    await this.updateProjectCollectedAmount(donation.projectId, donation.amount);
    
    return donation;
  }

  // =============================
  // HELPER METHODS
  // =============================

  async isVolunteerAssignedToProject(volunteerId: number, projectId: number): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.volunteerId, volunteerId),
            eq(applications.projectId, projectId),
            eq(applications.status, "approved")
          )
        )
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error("Error checking volunteer assignment:", error);
      return false;
    }
  }

  async getVolunteersByProjectId(projectId: number): Promise<User[]> {
    try {
      const approvedApplications = await db
        .select({ volunteerId: applications.volunteerId })
        .from(applications)
        .where(
          and(
            eq(applications.projectId, projectId),
            eq(applications.status, "approved")
          )
        );
      
      const volunteers = [];
      for (const app of approvedApplications) {
        if (app.volunteerId) {
          const volunteer = await this.getUser(app.volunteerId);
          if (volunteer) {
            volunteers.push(volunteer);
          }
        }
      }
      
      return volunteers;
    } catch (error) {
      console.error("Error getting volunteers by project:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();