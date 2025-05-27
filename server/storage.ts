import { users, projects, tasks, reports, applications, donations, type User, type InsertUser, type Project, type InsertProject, type Task, type InsertTask, type Report, type InsertReport, type Application, type InsertApplication, type Donation, type InsertDonation } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

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
  getProjects(options?: { status?: string; search?: string; limit?: number; offset?: number; userRole?: string; userId?: number }): Promise<Project[]>;
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
  updateProjectModerationStatus(id: number, status: string, moderatorId: number): Promise<Project>;
  
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
      .set({ isBlocked: true })
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
  
  // Project methods with proper status separation and filtering
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
    const approvedProjects = await db
      .select({
        project: projects
      })
      .from(applications)
      .innerJoin(projects, eq(applications.projectId, projects.id))
      .where(
        and(
          eq(applications.volunteerId, volunteerId),
          eq(applications.status, "approved"),
          eq(projects.moderationStatus, "approved") // Only show approved projects
        )
      );
    
    return approvedProjects.map(row => row.project);
  }
  
  async createProject(insertProject: InsertProject & { coordinatorId: number }): Promise<Project> {
    const projectData = {
      ...insertProject,
      coordinatorId: insertProject.coordinatorId,
      projectStatus: 'fundraising' as const,
      moderationStatus: 'pending' as const,
      currentAmount: 0
    };
    
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }
  
  // Separate methods for updating project status vs moderation status
  async updateProjectStatus(id: number, status: string): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ projectStatus: status as any, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async updateProjectModerationStatus(id: number, status: string, moderatorId: number): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ moderationStatus: status as any, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }
  
  // Method to handle automatic status change when target is reached
  async updateProjectCollectedAmount(id: number, amount: number): Promise<Project> {
    // First, update the current amount
    const [updatedProject] = await db
      .update(projects)
      .set({ 
        currentAmount: sql`${projects.currentAmount} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();

    // Check if target is reached and automatically change status
    if (updatedProject.currentAmount >= updatedProject.targetAmount && updatedProject.projectStatus === 'fundraising') {
      const [finalProject] = await db
        .update(projects)
        .set({ 
          projectStatus: 'in_progress',
          updatedAt: new Date()
        })
        .where(eq(projects.id, id))
        .returning();
      return finalProject;
    }

    return updatedProject;
  }
  
  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }
  
  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Simplified moderation methods since we're using status directly in projects table
  async getProjectModerations(projectId: number): Promise<any[]> {
    // Return empty array since we don't use separate moderation table anymore
    return [];
  }

  async createProjectModeration(moderation: { 
    projectId: number; 
    status: string; 
    comment: string | null; 
    moderatorId: number 
  }): Promise<any> {
    // Update the project's moderation status directly
    return await this.updateProjectModerationStatus(moderation.projectId, moderation.status, moderation.moderatorId);
  }

  async getProjectsForModeration(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.moderationStatus, 'pending'))
      .orderBy(desc(projects.createdAt));
  }

  // Task methods (simplified to focus on main functionality)
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
      .values({
        ...insertTask,
        status: 'pending'
      })
      .returning();
    return task;
  }

  async assignTaskToVolunteer(id: number, volunteerId: number): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ volunteerId, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ status: status as any, updatedAt: new Date() })
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
      .values({
        ...insertApplication,
        status: 'pending'
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
    const [donation] = await db
      .insert(donations)
      .values(insertDonation)
      .returning();

    // Automatically update project's current amount and check for status change
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