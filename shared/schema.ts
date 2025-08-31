import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userTypeEnum = pgEnum("user_type", ["student", "teacher", "admin"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "approved", "rejected"]);
export const requirementTypeEnum = pgEnum("requirement_type", ["online", "offline", "both"]);
export const feeTypeEnum = pgEnum("fee_type", ["per_hour", "per_day", "per_month", "per_subject"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  userType: userTypeEnum("user_type").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name"),
  profileImage: varchar("profile_image"),
  mobile: varchar("mobile"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  isLocationVerified: boolean("is_location_verified").default(false),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  fullAddress: text("full_address"),
  street: varchar("street"),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  isLiveSharing: boolean("is_live_sharing").default(false),
  liveLocationUpdatedAt: timestamp("live_location_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student profiles
export const studentProfiles = pgTable("student_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  class: varchar("class").notNull(),
  schoolName: varchar("school_name").notNull(),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  street: varchar("street"),
  village: varchar("village"),
  budgetMin: decimal("budget_min", { precision: 8, scale: 2 }).default("1.00"),
  budgetMax: decimal("budget_max", { precision: 8, scale: 2 }).default("10.00"),
  preferredSubjects: text("preferred_subjects").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher profiles
export const teacherProfiles = pgTable("teacher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subjects: text("subjects").array(),
  bio: text("bio"),
  qualification: varchar("qualification").notNull(),
  experience: varchar("experience"),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  street: varchar("street"),
  village: varchar("village"),
  age: integer("age"),
  gender: varchar("gender"),
  kycStatus: kycStatusEnum("kyc_status").default("approved"),
  isVerified: boolean("is_verified").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("3.00"),
  studentCount: integer("student_count").default(0),
  monthlyFee: decimal("monthly_fee", { precision: 8, scale: 2 }).default("1.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// KYC documents
export const kycDocuments = pgTable("kyc_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => teacherProfiles.id).notNull(),
  aadhaarCard: varchar("aadhaar_card"),
  panCard: varchar("pan_card"),
  selfie: varchar("selfie"),
  status: kycStatusEnum("status").default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Requirements
export const requirements = pgTable("requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  userType: userTypeEnum("user_type").notNull(),
  subjects: text("subjects").array().notNull(),
  classes: text("classes").array(),
  location: varchar("location").notNull(),
  city: varchar("city"),
  state: varchar("state"),
  pinCode: varchar("pin_code"),
  street: varchar("street"),
  village: varchar("village"),
  type: requirementTypeEnum("type").notNull(),
  fee: decimal("fee", { precision: 8, scale: 2 }),
  feeType: feeTypeEnum("fee_type"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachment: varchar("attachment"),
  attachmentType: varchar("attachment_type"),
  isRead: boolean("is_read").default(false),
  isLiked: boolean("is_liked").default(false),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '30 days'`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User requests table for connection requests
export const userRequests = pgTable("user_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  status: varchar("status").default("pending"), // pending, accepted, rejected
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  teacherProfile: one(teacherProfiles, {
    fields: [users.id],
    references: [teacherProfiles.userId],
  }),
  requirements: many(requirements),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  givenReviews: many(reviews, { relationName: "givenReviews" }),
  receivedReviews: many(reviews, { relationName: "receivedReviews" }),
  sentRequests: many(userRequests, { relationName: "sentRequests" }),
  receivedRequests: many(userRequests, { relationName: "receivedRequests" }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
}));

export const teacherProfilesRelations = relations(teacherProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [teacherProfiles.userId],
    references: [users.id],
  }),
  kycDocuments: many(kycDocuments),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  teacher: one(teacherProfiles, {
    fields: [kycDocuments.teacherId],
    references: [teacherProfiles.id],
  }),
}));

export const requirementsRelations = relations(requirements, ({ one }) => ({
  user: one(users, {
    fields: [requirements.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  fromUser: one(users, {
    fields: [reviews.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [reviews.toUserId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertRequirementSchema = createInsertSchema(requirements, {
  fee: z.union([z.string(), z.number()]).transform(String).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Support messages table
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  userName: varchar("user_name").notNull(),
  userEmail: varchar("user_email").notNull(),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  status: varchar("status").default("open"), // open, closed, replied
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
