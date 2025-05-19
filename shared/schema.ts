import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['volunteer', 'coordinator', 'donor', 'admin', 'moderator']);

// Enum for project status
export const projectStatusEnum = pgEnum('project_status', ['funding', 'in_progress', 'completed']);

// Enum for project moderation status
export const moderationStatusEnum = pgEnum('moderation_status', ['pending', 'approved', 'rejected']);

// Enum for task status
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed']);

// Enum for application status
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'approved', 'rejected']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isVerified: boolean("is_verified").default(false).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  targetAmount: doublePrecision("target_amount").notNull(),
  collectedAmount: doublePrecision("collected_amount").default(0).notNull(),
  status: projectStatusEnum("status").default('funding').notNull(),
  coordinatorId: integer("coordinator_id").references(() => users.id).notNull(),
  bankDetails: text("bank_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  volunteerId: integer("volunteer_id").references(() => users.id),
  status: taskStatusEnum("status").default('pending').notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  imageUrl: text("image_url"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Volunteer applications
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  volunteerId: integer("volunteer_id").references(() => users.id).notNull(),
  status: applicationStatusEnum("status").default('pending').notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Donations table
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  donorId: integer("donor_id").references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects, { relationName: "coordinator_projects" }),
  tasks: many(tasks, { relationName: "volunteer_tasks" }),
  applications: many(applications, { relationName: "volunteer_applications" }),
  donations: many(donations, { relationName: "donor_donations" }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  coordinator: one(users, {
    fields: [projects.coordinatorId],
    references: [users.id],
    relationName: "coordinator_projects"
  }),
  tasks: many(tasks),
  applications: many(applications),
  donations: many(donations),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  volunteer: one(users, {
    fields: [tasks.volunteerId],
    references: [users.id],
    relationName: "volunteer_tasks"
  }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  task: one(tasks, {
    fields: [reports.taskId],
    references: [tasks.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  project: one(projects, {
    fields: [applications.projectId],
    references: [projects.id],
  }),
  volunteer: one(users, {
    fields: [applications.volunteerId],
    references: [users.id],
    relationName: "volunteer_applications"
  }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  project: one(projects, {
    fields: [donations.projectId],
    references: [projects.id],
  }),
  donor: one(users, {
    fields: [donations.donorId],
    references: [users.id],
    relationName: "donor_donations"
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true, collectedAmount: true, status: true, coordinatorId: true });
export const selectProjectSchema = createSelectSchema(projects);

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const selectTaskSchema = createSelectSchema(tasks);

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export const selectReportSchema = createSelectSchema(reports);

export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, status: true });
export const selectApplicationSchema = createSelectSchema(applications);

export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true });
export const selectDonationSchema = createSelectSchema(donations);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type SelectProject = z.infer<typeof selectProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SelectTask = z.infer<typeof selectTaskSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type SelectReport = z.infer<typeof selectReportSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type SelectApplication = z.infer<typeof selectApplicationSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type SelectDonation = z.infer<typeof selectDonationSchema>;
