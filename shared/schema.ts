import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone"),
  avatar: varchar("avatar"),
  isVerified: boolean("is_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  subscriptionType: varchar("subscription_type").default("free"), // free, premium
  subscriptionPlan: varchar("subscription_plan"), // monthly, sixmonths
  subscriptionStatus: varchar("subscription_status").default("active"), // active, trial, cancelled, expired
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndDate: timestamp("trial_end_date"),
  paymentMethod: varchar("payment_method"), // promptpay, creditcard
  lastPaymentDate: timestamp("last_payment_date"),
  nextBillingDate: timestamp("next_billing_date"),
  lastNewMatchesView: timestamp("last_new_matches_view"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  role: varchar("role").default("user"), // user, admin
  blacklisted: boolean("blacklisted").default(false),
  preferredLanguage: varchar("preferred_language").default("en"), // en, th
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  titleEn: varchar("title_en"),
  titleTh: varchar("title_th"),
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionTh: text("description_th"),
  propertyType: varchar("property_type").notNull(), // house, apartment, land, townhouse, poolvilla
  transactionType: varchar("transaction_type").notNull(), // sell, rent, sell_or_rent
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").default("THB"),
  rentPrice: decimal("rent_price", { precision: 12, scale: 2 }),
  rentCurrency: varchar("rent_currency").default("THB"),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state"),
  country: varchar("country").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  area: decimal("area", { precision: 10, scale: 2 }), // square feet or acres
  areaUnit: varchar("area_unit").default("sqft"), // sqft, acres, sqm
  landSize: decimal("land_size", { precision: 10, scale: 2 }), // for houses, townhouses, pool villas
  landSizeUnit: varchar("land_size_unit").default("sqw"), // sqm, sqw
  buildSize: decimal("build_size", { precision: 10, scale: 2 }), // for houses, townhouses, pool villas  
  buildSizeUnit: varchar("build_size_unit").default("sqm"), // sqm only
  yearBuilt: integer("year_built"),
  amenities: text("amenities").array(),
  images: text("images").array(),
  videos: text("videos").array(),
  isPremium: boolean("is_premium").default(false),
  isActive: boolean("is_active").default(true),
  lastValidated: timestamp("last_validated").defaultNow(),
  lastValidationReminder: timestamp("last_validation_reminder"),
  validationToken: varchar("validation_token"),
  validationExpires: timestamp("validation_expires"),
  validationResponseReceived: boolean("validation_response_received").default(false),
  verificationStatus: varchar("verification_status").default("none"), // none, requested, pending, verified, rejected
  chanoteDocumentPath: varchar("chanote_document_path"),
  idDocumentPath: varchar("id_document_path"),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  verificationRequestedAt: timestamp("verification_requested_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports table for fake listings
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  reason: varchar("reason").notNull(), // fake, spam, inappropriate, outdated
  description: text("description"),
  status: varchar("status").default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// Searches table for saved searches
export const searches = pgTable("searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  criteria: jsonb("criteria").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Buyer requirements table for wanted listings
export const buyerRequirements = pgTable("buyer_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  titleEn: varchar("title_en"),
  titleTh: varchar("title_th"),
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionTh: text("description_th"),
  propertyType: varchar("property_type").notNull(), // house, apartment, land, townhouse, poolvilla
  transactionType: varchar("transaction_type").notNull(), // buy, rent, buy_or_rent
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  // Separate price fields for buy vs rent when both are selected
  minPurchasePrice: decimal("min_purchase_price", { precision: 12, scale: 2 }),
  maxPurchasePrice: decimal("max_purchase_price", { precision: 12, scale: 2 }),
  minRentPrice: decimal("min_rent_price", { precision: 12, scale: 2 }),
  maxRentPrice: decimal("max_rent_price", { precision: 12, scale: 2 }),
  currency: varchar("currency").default("THB"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country"),
  minBedrooms: integer("min_bedrooms"),
  minBathrooms: integer("min_bathrooms"),
  minArea: decimal("min_area", { precision: 10, scale: 2 }),
  maxArea: decimal("max_area", { precision: 10, scale: 2 }),
  areaUnit: varchar("area_unit").default("sqft"), // sqft, acres, sqm
  minLandSize: decimal("min_land_size", { precision: 10, scale: 2 }),
  maxLandSize: decimal("max_land_size", { precision: 10, scale: 2 }),
  landSizeUnit: varchar("land_size_unit").default("sqw"), // sqm, sqw
  minBuildSize: decimal("min_build_size", { precision: 10, scale: 2 }),
  maxBuildSize: decimal("max_build_size", { precision: 10, scale: 2 }),
  buildSizeUnit: varchar("build_size_unit").default("sqm"), // sqm only
  requiredAmenities: text("required_amenities").array(),
  contactPhone: varchar("contact_phone"),
  contactEmail: varchar("contact_email"),
  urgency: varchar("urgency").default("normal"), // urgent, normal, flexible
  isActive: boolean("is_active").default(true),
  lastValidated: timestamp("last_validated").defaultNow(),
  lastValidationReminder: timestamp("last_validation_reminder"),
  validationToken: varchar("validation_token"),
  validationExpires: timestamp("validation_expires"),
  validationResponseReceived: boolean("validation_response_received").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table for messaging between users
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id),
  requirementId: varchar("requirement_id").references(() => buyerRequirements.id),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  subject: varchar("subject"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for storing individual messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  contentTh: text("content_th"),
  isRead: boolean("is_read").default(false),
  messageType: varchar("message_type").default("text"), // text, system
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for in-app notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // message, property_inquiry, system
  title: varchar("title").notNull(),
  content: text("content"),
  relatedId: varchar("related_id"), // conversation_id, property_id, etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services directory table
export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category").notNull(), // 'legal', 'building', 'architects', etc.
  companyName: varchar("company_name").notNull(),
  contactPersonName: varchar("contact_person_name").notNull(),
  email: varchar("email"),
  serviceLocations: text("service_locations").array(),
  description: text("description").notNull(),
  phoneNumber: varchar("phone_number"),
  logoUrl: varchar("logo_url"),
  websiteUrl: varchar("website_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  favorites: many(favorites),
  reports: many(reports),
  searches: many(searches),
  buyerRequirements: many(buyerRequirements),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  favorites: many(favorites),
  reports: many(reports),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [reports.propertyId],
    references: [properties.id],
  }),
}));

export const searchesRelations = relations(searches, ({ one }) => ({
  user: one(users, {
    fields: [searches.userId],
    references: [users.id],
  }),
}));

export const buyerRequirementsRelations = relations(buyerRequirements, ({ one, many }) => ({
  buyer: one(users, {
    fields: [buyerRequirements.buyerId],
    references: [users.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  property: one(properties, {
    fields: [conversations.propertyId],
    references: [properties.id],
  }),
  requirement: one(buyerRequirements, {
    fields: [conversations.requirementId],
    references: [buyerRequirements.id],
  }),
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const serviceProvidersRelations = relations(serviceProviders, ({ one }) => ({
  user: one(users, {
    fields: [serviceProviders.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastValidated: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  createdAt: true,
});

export const insertBuyerRequirementSchema = createInsertSchema(buyerRequirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Property search schema
export const propertySearchSchema = z.object({
  query: z.string().optional(),
  propertyType: z.enum(["house", "apartment", "land", "townhouse", "poolvilla"]).optional(),
  transactionType: z.enum(["buy", "rent", "sell", "let"]).optional(),
  minPrice: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).optional(),
  maxPrice: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).optional(),
  currency: z.enum(["USD", "THB"]).optional(),
  bedrooms: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val).optional(),
  bathrooms: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Property = typeof properties.$inferSelect;
export type PropertyWithOwnerInfo = Property & {
  ownerIsPremium?: boolean;
  isVerified?: boolean;
};
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Search = typeof searches.$inferSelect;
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type BuyerRequirement = typeof buyerRequirements.$inferSelect;
export type InsertBuyerRequirement = z.infer<typeof insertBuyerRequirementSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageWithSender = Message & {
  senderName: string;
  senderEmail: string | null;
  contentEn?: string | null;
  contentTh?: string | null;
};
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type PropertySearchParams = z.infer<typeof propertySearchSchema>;
