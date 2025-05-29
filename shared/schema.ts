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

// Enum for task type
export const taskTypeEnum = pgEnum('task_type', ['collection', 'on_site', 'event_organization', 'online_support', 'other']);

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
  bio: text("bio").notNull(),
  region: text("region").notNull(),
  city: text("city").notNull(),
  phoneNumber: text("phone_number").notNull(),
  gender: text("gender").notNull(),
  birthDate: text("birth_date").notNull(),
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

// Project Moderation table
export const projectModerations = pgTable("project_moderations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  status: moderationStatusEnum("status").default('pending').notNull(),
  comment: text("comment"),
  moderatorId: integer("moderator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: taskTypeEnum("type").notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  assignedVolunteerId: integer("assigned_volunteer_id").references(() => users.id),
  status: taskStatusEnum("status").default('pending').notNull(),
  deadline: timestamp("deadline"),
  location: text("location"),
  volunteersNeeded: integer("volunteers_needed").default(1).notNull(),
  requiredSkills: text("required_skills"),
  requiresExpenses: boolean("requires_expenses").default(false).notNull(),
  estimatedAmount: doublePrecision("estimated_amount"),
  expensePurpose: text("expense_purpose"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  volunteerId: integer("volunteer_id").references(() => users.id).notNull(),
  // Основні поля звіту
  description: text("description"),
  imageUrls: text("image_urls").array(),
  
  // Фінансові поля (для завдань з витратами)
  receivedAmount: doublePrecision("received_amount"),
  spentAmount: doublePrecision("spent_amount"),
  remainingAmount: doublePrecision("remaining_amount"),
  expensePurpose: text("expense_purpose"),
  receiptUrls: text("receipt_urls").array(),
  financialConfirmed: boolean("financial_confirmed").default(false),
  
  // Статус звіту
  status: text("status").default('pending').notNull(), // pending, approved, needs_clarification
  coordinatorComment: text("coordinator_comment"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Project reports table
export const projectReports = pgTable("project_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  period: text("period"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  reports: many(projectReports),
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

export const projectReportsRelations = relations(projectReports, ({ one }) => ({
  project: one(projects, {
    fields: [projectReports.projectId],
    references: [projects.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  bio: z.string().min(10, "Опис має містити мінімум 10 символів").max(500, "Опис не може перевищувати 500 символів"),
  region: z.string().min(1, "Область є обов'язковою"),
  city: z.string().min(1, "Місто є обов'язковим"),
  phoneNumber: z.string().regex(/^\+380\d{9}$/, "Номер телефону має бути у форматі +380XXXXXXXXX"),
  gender: z.enum(["Чоловіча", "Жіноча", "Інше"], { 
    errorMap: () => ({ message: "Оберіть стать" }) 
  }),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate <= today;
  }, { message: "Дата народження не може бути в майбутньому" }),
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"]
});

export const selectUserSchema = createSelectSchema(users);

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  collectedAmount: true, 
  status: true, 
  coordinatorId: true
});
export const selectProjectSchema = createSelectSchema(projects);

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const selectTaskSchema = createSelectSchema(tasks);

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export const selectReportSchema = createSelectSchema(reports);

export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, status: true });
export const selectApplicationSchema = createSelectSchema(applications);

export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true });
export const selectDonationSchema = createSelectSchema(donations);

export const insertProjectReportSchema = createInsertSchema(projectReports).omit({ id: true, createdAt: true, updatedAt: true });
export const selectProjectReportSchema = createSelectSchema(projectReports);

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

export type ProjectReport = typeof projectReports.$inferSelect;
export type InsertProjectReport = z.infer<typeof insertProjectReportSchema>;
export type SelectProjectReport = z.infer<typeof selectProjectReportSchema>;
