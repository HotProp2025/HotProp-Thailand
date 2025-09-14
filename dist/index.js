var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  buyerRequirements: () => buyerRequirements,
  buyerRequirementsRelations: () => buyerRequirementsRelations,
  conversations: () => conversations,
  conversationsRelations: () => conversationsRelations,
  favorites: () => favorites,
  favoritesRelations: () => favoritesRelations,
  insertBuyerRequirementSchema: () => insertBuyerRequirementSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertFavoriteSchema: () => insertFavoriteSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertReportSchema: () => insertReportSchema,
  insertSearchSchema: () => insertSearchSchema,
  insertServiceProviderSchema: () => insertServiceProviderSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  properties: () => properties,
  propertiesRelations: () => propertiesRelations,
  propertySearchSchema: () => propertySearchSchema,
  reports: () => reports,
  reportsRelations: () => reportsRelations,
  searches: () => searches,
  searchesRelations: () => searchesRelations,
  serviceProviders: () => serviceProviders,
  serviceProvidersRelations: () => serviceProvidersRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, properties, favorites, reports, searches, buyerRequirements, conversations, messages, notifications, serviceProviders, usersRelations, propertiesRelations, favoritesRelations, reportsRelations, searchesRelations, buyerRequirementsRelations, conversationsRelations, messagesRelations, notificationsRelations, serviceProvidersRelations, insertUserSchema, insertPropertySchema, insertFavoriteSchema, insertReportSchema, insertSearchSchema, insertBuyerRequirementSchema, insertConversationSchema, insertMessageSchema, insertNotificationSchema, insertServiceProviderSchema, loginSchema, propertySearchSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
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
      subscriptionType: varchar("subscription_type").default("free"),
      // free, premium
      subscriptionPlan: varchar("subscription_plan"),
      // monthly, sixmonths
      subscriptionStatus: varchar("subscription_status").default("active"),
      // active, trial, cancelled, expired
      subscriptionStartDate: timestamp("subscription_start_date"),
      subscriptionEndDate: timestamp("subscription_end_date"),
      trialEndDate: timestamp("trial_end_date"),
      paymentMethod: varchar("payment_method"),
      // promptpay, creditcard
      lastPaymentDate: timestamp("last_payment_date"),
      nextBillingDate: timestamp("next_billing_date"),
      lastNewMatchesView: timestamp("last_new_matches_view"),
      stripeCustomerId: varchar("stripe_customer_id"),
      stripePaymentIntentId: varchar("stripe_payment_intent_id"),
      stripeSubscriptionId: varchar("stripe_subscription_id"),
      role: varchar("role").default("user"),
      // user, admin
      blacklisted: boolean("blacklisted").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    properties = pgTable("properties", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ownerId: varchar("owner_id").notNull().references(() => users.id),
      title: varchar("title").notNull(),
      description: text("description"),
      propertyType: varchar("property_type").notNull(),
      // house, apartment, land, townhouse, poolvilla
      transactionType: varchar("transaction_type").notNull(),
      // sell, rent, sell_or_rent
      price: decimal("price", { precision: 12, scale: 2 }).notNull(),
      currency: varchar("currency").default("USD"),
      rentPrice: decimal("rent_price", { precision: 12, scale: 2 }),
      rentCurrency: varchar("rent_currency").default("USD"),
      address: text("address").notNull(),
      city: varchar("city").notNull(),
      state: varchar("state"),
      country: varchar("country").notNull(),
      latitude: decimal("latitude", { precision: 10, scale: 8 }),
      longitude: decimal("longitude", { precision: 11, scale: 8 }),
      bedrooms: integer("bedrooms"),
      bathrooms: integer("bathrooms"),
      area: decimal("area", { precision: 10, scale: 2 }),
      // square feet or acres
      areaUnit: varchar("area_unit").default("sqft"),
      // sqft, acres, sqm
      landSize: decimal("land_size", { precision: 10, scale: 2 }),
      // for houses, townhouses, pool villas
      landSizeUnit: varchar("land_size_unit").default("sqm"),
      // sqm, sqw
      buildSize: decimal("build_size", { precision: 10, scale: 2 }),
      // for houses, townhouses, pool villas  
      buildSizeUnit: varchar("build_size_unit").default("sqm"),
      // sqm only
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
      verificationStatus: varchar("verification_status").default("none"),
      // none, requested, pending, verified, rejected
      chanoteDocumentPath: varchar("chanote_document_path"),
      idDocumentPath: varchar("id_document_path"),
      verificationNotes: text("verification_notes"),
      verifiedAt: timestamp("verified_at"),
      verificationRequestedAt: timestamp("verification_requested_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    favorites = pgTable("favorites", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      propertyId: varchar("property_id").notNull().references(() => properties.id),
      createdAt: timestamp("created_at").defaultNow()
    });
    reports = pgTable("reports", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      reporterId: varchar("reporter_id").notNull().references(() => users.id),
      propertyId: varchar("property_id").notNull().references(() => properties.id),
      reason: varchar("reason").notNull(),
      // fake, spam, inappropriate, outdated
      description: text("description"),
      status: varchar("status").default("pending"),
      // pending, reviewed, resolved
      createdAt: timestamp("created_at").defaultNow()
    });
    searches = pgTable("searches", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      name: varchar("name").notNull(),
      criteria: jsonb("criteria").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    buyerRequirements = pgTable("buyer_requirements", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      buyerId: varchar("buyer_id").notNull().references(() => users.id),
      title: varchar("title").notNull(),
      description: text("description"),
      propertyType: varchar("property_type").notNull(),
      // house, apartment, land, townhouse, poolvilla
      transactionType: varchar("transaction_type").notNull(),
      // buy, rent
      maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
      minPrice: decimal("min_price", { precision: 12, scale: 2 }),
      currency: varchar("currency").default("USD"),
      city: varchar("city"),
      state: varchar("state"),
      country: varchar("country"),
      minBedrooms: integer("min_bedrooms"),
      minBathrooms: integer("min_bathrooms"),
      minArea: decimal("min_area", { precision: 10, scale: 2 }),
      maxArea: decimal("max_area", { precision: 10, scale: 2 }),
      areaUnit: varchar("area_unit").default("sqft"),
      // sqft, acres, sqm
      minLandSize: decimal("min_land_size", { precision: 10, scale: 2 }),
      maxLandSize: decimal("max_land_size", { precision: 10, scale: 2 }),
      landSizeUnit: varchar("land_size_unit").default("sqm"),
      // sqm, sqw
      minBuildSize: decimal("min_build_size", { precision: 10, scale: 2 }),
      maxBuildSize: decimal("max_build_size", { precision: 10, scale: 2 }),
      buildSizeUnit: varchar("build_size_unit").default("sqm"),
      // sqm only
      requiredAmenities: text("required_amenities").array(),
      contactPhone: varchar("contact_phone"),
      contactEmail: varchar("contact_email"),
      urgency: varchar("urgency").default("normal"),
      // urgent, normal, flexible
      isActive: boolean("is_active").default(true),
      lastValidated: timestamp("last_validated").defaultNow(),
      lastValidationReminder: timestamp("last_validation_reminder"),
      validationToken: varchar("validation_token"),
      validationExpires: timestamp("validation_expires"),
      validationResponseReceived: boolean("validation_response_received").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    conversations = pgTable("conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      propertyId: varchar("property_id").references(() => properties.id),
      requirementId: varchar("requirement_id").references(() => buyerRequirements.id),
      participant1Id: varchar("participant1_id").notNull().references(() => users.id),
      participant2Id: varchar("participant2_id").notNull().references(() => users.id),
      subject: varchar("subject"),
      lastMessageAt: timestamp("last_message_at").defaultNow(),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
      senderId: varchar("sender_id").notNull().references(() => users.id),
      content: text("content").notNull(),
      isRead: boolean("is_read").default(false),
      messageType: varchar("message_type").default("text"),
      // text, system
      createdAt: timestamp("created_at").defaultNow()
    });
    notifications = pgTable("notifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      type: varchar("type").notNull(),
      // message, property_inquiry, system
      title: varchar("title").notNull(),
      content: text("content"),
      relatedId: varchar("related_id"),
      // conversation_id, property_id, etc.
      isRead: boolean("is_read").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    serviceProviders = pgTable("service_providers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      category: varchar("category").notNull(),
      // 'legal', 'building', 'architects', etc.
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersRelations = relations(users, ({ many }) => ({
      properties: many(properties),
      favorites: many(favorites),
      reports: many(reports),
      searches: many(searches),
      buyerRequirements: many(buyerRequirements)
    }));
    propertiesRelations = relations(properties, ({ one, many }) => ({
      owner: one(users, {
        fields: [properties.ownerId],
        references: [users.id]
      }),
      favorites: many(favorites),
      reports: many(reports)
    }));
    favoritesRelations = relations(favorites, ({ one }) => ({
      user: one(users, {
        fields: [favorites.userId],
        references: [users.id]
      }),
      property: one(properties, {
        fields: [favorites.propertyId],
        references: [properties.id]
      })
    }));
    reportsRelations = relations(reports, ({ one }) => ({
      reporter: one(users, {
        fields: [reports.reporterId],
        references: [users.id]
      }),
      property: one(properties, {
        fields: [reports.propertyId],
        references: [properties.id]
      })
    }));
    searchesRelations = relations(searches, ({ one }) => ({
      user: one(users, {
        fields: [searches.userId],
        references: [users.id]
      })
    }));
    buyerRequirementsRelations = relations(buyerRequirements, ({ one, many }) => ({
      buyer: one(users, {
        fields: [buyerRequirements.buyerId],
        references: [users.id]
      }),
      conversations: many(conversations)
    }));
    conversationsRelations = relations(conversations, ({ one, many }) => ({
      property: one(properties, {
        fields: [conversations.propertyId],
        references: [properties.id]
      }),
      requirement: one(buyerRequirements, {
        fields: [conversations.requirementId],
        references: [buyerRequirements.id]
      }),
      participant1: one(users, {
        fields: [conversations.participant1Id],
        references: [users.id]
      }),
      participant2: one(users, {
        fields: [conversations.participant2Id],
        references: [users.id]
      }),
      messages: many(messages)
    }));
    messagesRelations = relations(messages, ({ one }) => ({
      conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id]
      }),
      sender: one(users, {
        fields: [messages.senderId],
        references: [users.id]
      })
    }));
    notificationsRelations = relations(notifications, ({ one }) => ({
      user: one(users, {
        fields: [notifications.userId],
        references: [users.id]
      })
    }));
    serviceProvidersRelations = relations(serviceProviders, ({ one }) => ({
      user: one(users, {
        fields: [serviceProviders.userId],
        references: [users.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPropertySchema = createInsertSchema(properties).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      lastValidated: true
    });
    insertFavoriteSchema = createInsertSchema(favorites).omit({
      id: true,
      createdAt: true
    });
    insertReportSchema = createInsertSchema(reports).omit({
      id: true,
      createdAt: true
    });
    insertSearchSchema = createInsertSchema(searches).omit({
      id: true,
      createdAt: true
    });
    insertBuyerRequirementSchema = createInsertSchema(buyerRequirements).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertConversationSchema = createInsertSchema(conversations).omit({
      id: true,
      createdAt: true,
      lastMessageAt: true
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      createdAt: true
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true
    });
    insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });
    propertySearchSchema = z.object({
      query: z.string().optional(),
      propertyType: z.enum(["house", "apartment", "land", "townhouse", "poolvilla"]).optional(),
      transactionType: z.enum(["buy", "rent", "sell"]).optional(),
      minPrice: z.union([z.string(), z.number()]).transform((val) => typeof val === "string" ? parseFloat(val) : val).optional(),
      maxPrice: z.union([z.string(), z.number()]).transform((val) => typeof val === "string" ? parseFloat(val) : val).optional(),
      currency: z.enum(["USD", "THB"]).optional(),
      bedrooms: z.union([z.string(), z.number()]).transform((val) => typeof val === "string" ? parseInt(val) : val).optional(),
      bathrooms: z.union([z.string(), z.number()]).transform((val) => typeof val === "string" ? parseInt(val) : val).optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional()
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/storage.ts
import { eq, and, or, gte, lte, desc, asc, sql as sql2, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // User operations
      async createUser(insertUser) {
        const hashedPassword = await bcrypt.hash(insertUser.password, 10);
        const [user] = await db.insert(users).values({
          ...insertUser,
          password: hashedPassword
        }).returning();
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async getUserById(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async updateUser(id, updates) {
        const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user;
      }
      async getUserByVerificationToken(token) {
        const [user] = await db.select().from(users).where(and(
          eq(users.emailVerificationToken, token),
          gte(users.emailVerificationExpires, /* @__PURE__ */ new Date())
        ));
        return user;
      }
      async verifyEmail(token) {
        const user = await this.getUserByVerificationToken(token);
        if (!user) return void 0;
        const [verifiedUser] = await db.update(users).set({
          isVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, user.id)).returning();
        return verifiedUser;
      }
      async verifyPassword(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user) return void 0;
        const isValid = await bcrypt.compare(password, user.password);
        return isValid ? user : void 0;
      }
      // Property operations
      async createProperty(insertProperty) {
        const [property] = await db.insert(properties).values(insertProperty).returning();
        return property;
      }
      async getPropertyById(id) {
        const [property] = await db.select().from(properties).where(and(eq(properties.id, id), eq(properties.isActive, true)));
        return property;
      }
      async getProperties(params, userId) {
        const propertiesWithOwners = await db.select({
          property: properties,
          userSubscriptionType: users.subscriptionType
        }).from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.isActive, true));
        const allProperties = propertiesWithOwners.map((item) => ({
          ...item.property,
          ownerIsPremium: item.userSubscriptionType === "premium",
          isVerified: item.property.verificationStatus === "verified"
        }));
        if (!params.query && !params.propertyType && !params.transactionType && !params.minPrice && !params.maxPrice && !params.currency && !params.bedrooms && !params.bathrooms && !params.city && !params.state && !params.country) {
          return allProperties.sort((a, b) => {
            if (a.isPremium && !b.isPremium) return -1;
            if (!a.isPremium && b.isPremium) return 1;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
        }
        let filteredProperties = allProperties;
        if (params.propertyType) {
          filteredProperties = filteredProperties.filter(
            (property) => property.propertyType === params.propertyType
          );
        }
        if (params.transactionType) {
          if (params.transactionType === "sell") {
            return [];
          } else {
            filteredProperties = filteredProperties.filter((property) => {
              if (params.transactionType === "buy") {
                return property.transactionType === "sale" || property.transactionType === "sell" || property.transactionType === "both" || property.transactionType === "sell_or_rent";
              } else if (params.transactionType === "rent") {
                return property.transactionType === "rent" || property.transactionType === "both" || property.transactionType === "sell_or_rent";
              }
              return false;
            });
          }
        }
        const convertPrice = (price, fromCurrency, toCurrency) => {
          if (fromCurrency === toCurrency) return price;
          const USD_TO_THB_RATE = 35;
          if (fromCurrency === "USD" && toCurrency === "THB") {
            return price * USD_TO_THB_RATE;
          } else if (fromCurrency === "THB" && toCurrency === "USD") {
            return price / USD_TO_THB_RATE;
          }
          return price;
        };
        if (params.minPrice || params.maxPrice) {
          filteredProperties = filteredProperties.filter((property) => {
            const searchCurrency = params.currency || "USD";
            const salePrice = parseFloat(property.price || "0");
            const convertedSalePrice = convertPrice(salePrice, property.currency || "USD", searchCurrency);
            let salePriceInRange = true;
            if (params.minPrice && convertedSalePrice < params.minPrice) salePriceInRange = false;
            if (params.maxPrice && convertedSalePrice > params.maxPrice) salePriceInRange = false;
            if (property.transactionType === "both" && property.rentPrice) {
              const rentPrice = parseFloat(property.rentPrice);
              const convertedRentPrice = convertPrice(rentPrice, property.rentCurrency || "USD", searchCurrency);
              let rentPriceInRange = true;
              if (params.minPrice && convertedRentPrice < params.minPrice) rentPriceInRange = false;
              if (params.maxPrice && convertedRentPrice > params.maxPrice) rentPriceInRange = false;
              if (params.transactionType === "buy") {
                return salePriceInRange;
              } else if (params.transactionType === "rent") {
                return rentPriceInRange;
              } else {
                return salePriceInRange || rentPriceInRange;
              }
            }
            return salePriceInRange;
          });
        }
        if (params.bedrooms) {
          filteredProperties = filteredProperties.filter(
            (property) => property.bedrooms && property.bedrooms >= params.bedrooms
          );
        }
        if (params.bathrooms) {
          filteredProperties = filteredProperties.filter(
            (property) => property.bathrooms && property.bathrooms >= params.bathrooms
          );
        }
        if (params.city) {
          filteredProperties = filteredProperties.filter(
            (property) => property.city?.toLowerCase().includes(params.city.toLowerCase())
          );
        }
        if (params.state) {
          filteredProperties = filteredProperties.filter(
            (property) => property.state?.toLowerCase().includes(params.state.toLowerCase())
          );
        }
        if (params.country) {
          filteredProperties = filteredProperties.filter(
            (property) => property.country?.toLowerCase().includes(params.country.toLowerCase())
          );
        }
        const scoredProperties = filteredProperties.map((property) => {
          let score = 0;
          if (params.query) {
            const queryLower = params.query.toLowerCase();
            if (property.title?.toLowerCase().includes(queryLower)) score += 10;
            if (property.description?.toLowerCase().includes(queryLower)) score += 5;
            if (property.address?.toLowerCase().includes(queryLower)) score += 3;
            if (property.city?.toLowerCase().includes(queryLower)) score += 2;
          }
          if (property.isPremium) score += 5;
          return {
            property,
            score
          };
        });
        if (params.query) {
          filteredProperties = filteredProperties.filter((property) => {
            const queryLower = params.query.toLowerCase();
            return property.title?.toLowerCase().includes(queryLower) || property.description?.toLowerCase().includes(queryLower) || property.address?.toLowerCase().includes(queryLower) || property.city?.toLowerCase().includes(queryLower) || property.state?.toLowerCase().includes(queryLower) || property.country?.toLowerCase().includes(queryLower);
          });
        }
        const sortedProperties = scoredProperties.sort((a, b) => {
          if (a.property.isPremium && !b.property.isPremium) return -1;
          if (!a.property.isPremium && b.property.isPremium) return 1;
          if (b.score !== a.score) return b.score - a.score;
          return new Date(b.property.createdAt || 0).getTime() - new Date(a.property.createdAt || 0).getTime();
        });
        return sortedProperties.map((item) => item.property);
      }
      async getPropertiesByOwner(ownerId) {
        return await db.select().from(properties).where(eq(properties.ownerId, ownerId)).orderBy(desc(properties.createdAt));
      }
      async updateProperty(id, updates) {
        const [property] = await db.update(properties).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(properties.id, id)).returning();
        return property;
      }
      async deleteProperty(id) {
        const [property] = await db.update(properties).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(properties.id, id)).returning();
        return !!property;
      }
      async getFeaturedProperties() {
        const propertiesWithOwners = await db.select({
          property: properties,
          userSubscriptionType: users.subscriptionType
        }).from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(eq(properties.isActive, true)).limit(20);
        const sortedProperties = propertiesWithOwners.sort((a, b) => {
          const aIsPremium = a.property.isPremium || a.userSubscriptionType === "premium";
          const bIsPremium = b.property.isPremium || b.userSubscriptionType === "premium";
          if (aIsPremium && !bIsPremium) return -1;
          if (!aIsPremium && bIsPremium) return 1;
          return new Date(b.property.createdAt || 0).getTime() - new Date(a.property.createdAt || 0).getTime();
        }).slice(0, 10).map((item) => ({
          ...item.property,
          ownerIsPremium: item.userSubscriptionType === "premium",
          isVerified: item.property.verificationStatus === "verified"
        }));
        return sortedProperties;
      }
      async markPropertyPremium(id, isPremium) {
        const [property] = await db.update(properties).set({ isPremium, updatedAt: /* @__PURE__ */ new Date() }).where(eq(properties.id, id)).returning();
        return property;
      }
      async getPropertiesNeedingValidation(cutoffDate) {
        return await db.select().from(properties).where(and(
          eq(properties.isActive, true),
          or(
            // Never been validated
            isNull(properties.lastValidated),
            // Last validated more than a week ago
            lte(properties.lastValidated, cutoffDate),
            // Never received a validation reminder
            isNull(properties.lastValidationReminder),
            // Last reminder more than a week ago  
            lte(properties.lastValidationReminder, cutoffDate)
          )
        ));
      }
      async getExpiredValidationProperties(currentDate) {
        return await db.select().from(properties).where(and(
          eq(properties.isActive, true),
          lte(properties.validationExpires, currentDate),
          eq(properties.validationResponseReceived, false)
        ));
      }
      async getPropertyByValidationToken(token) {
        const [property] = await db.select().from(properties).where(eq(properties.validationToken, token));
        return property;
      }
      async getActiveProperties() {
        return await db.select().from(properties).where(eq(properties.isActive, true)).orderBy(desc(properties.createdAt));
      }
      async getPropertiesCreatedAfter(date) {
        return await db.select().from(properties).where(and(
          eq(properties.isActive, true),
          gte(properties.createdAt, date)
        )).orderBy(desc(properties.createdAt));
      }
      async getUsers() {
        return await db.select().from(users);
      }
      async getUserProperties(userId) {
        return await db.select().from(properties).where(eq(properties.ownerId, userId));
      }
      // Favorites operations
      async addFavorite(insertFavorite) {
        const [favorite] = await db.insert(favorites).values(insertFavorite).returning();
        return favorite;
      }
      async removeFavorite(userId, propertyId) {
        const result = await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
        return (result.rowCount || 0) > 0;
      }
      async getUserFavorites(userId) {
        const results = await db.select().from(properties).innerJoin(favorites, eq(favorites.propertyId, properties.id)).where(and(eq(favorites.userId, userId), eq(properties.isActive, true))).orderBy(desc(favorites.createdAt));
        return results.map((result) => result.properties);
      }
      async isFavorite(userId, propertyId) {
        const [favorite] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
        return !!favorite;
      }
      // Reports operations
      async createReport(insertReport) {
        const [report] = await db.insert(reports).values(insertReport).returning();
        return report;
      }
      async getReports() {
        return await db.select().from(reports).orderBy(desc(reports.createdAt));
      }
      async updateReportStatus(id, status) {
        const [report] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
        return report;
      }
      // Search operations
      async createSearch(insertSearch) {
        const [search] = await db.insert(searches).values(insertSearch).returning();
        return search;
      }
      async getUserSearches(userId) {
        return await db.select().from(searches).where(eq(searches.userId, userId)).orderBy(desc(searches.createdAt));
      }
      async deleteSearch(id) {
        const result = await db.delete(searches).where(eq(searches.id, id));
        return (result.rowCount || 0) > 0;
      }
      // Buyer requirements operations
      async createBuyerRequirement(insertBuyerRequirement) {
        const [requirement] = await db.insert(buyerRequirements).values(insertBuyerRequirement).returning();
        return requirement;
      }
      async getBuyerRequirements() {
        const requirements = await db.select({
          requirement: buyerRequirements,
          userSubscriptionType: users.subscriptionType
        }).from(buyerRequirements).leftJoin(users, eq(buyerRequirements.buyerId, users.id)).where(eq(buyerRequirements.isActive, true));
        return requirements.sort((a, b) => {
          if (a.userSubscriptionType === "premium" && b.userSubscriptionType !== "premium") return -1;
          if (a.userSubscriptionType !== "premium" && b.userSubscriptionType === "premium") return 1;
          return new Date(b.requirement.createdAt || 0).getTime() - new Date(a.requirement.createdAt || 0).getTime();
        }).map((item) => item.requirement);
      }
      async getBuyerRequirementsByUser(buyerId) {
        return await db.select().from(buyerRequirements).where(and(eq(buyerRequirements.buyerId, buyerId), eq(buyerRequirements.isActive, true))).orderBy(desc(buyerRequirements.createdAt));
      }
      async getBuyerRequirementById(id) {
        const [requirement] = await db.select().from(buyerRequirements).where(and(eq(buyerRequirements.id, id), eq(buyerRequirements.isActive, true)));
        return requirement;
      }
      async updateBuyerRequirement(id, updates) {
        const [requirement] = await db.update(buyerRequirements).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(buyerRequirements.id, id)).returning();
        return requirement;
      }
      async deleteBuyerRequirement(id) {
        const [requirement] = await db.update(buyerRequirements).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(buyerRequirements.id, id)).returning();
        return !!requirement;
      }
      async getBuyerRequirementsNeedingValidation(cutoffDate) {
        return await db.select().from(buyerRequirements).where(and(
          eq(buyerRequirements.isActive, true),
          or(
            // Never been validated
            isNull(buyerRequirements.lastValidated),
            // Last validated more than a week ago
            lte(buyerRequirements.lastValidated, cutoffDate),
            // Never received a validation reminder
            isNull(buyerRequirements.lastValidationReminder),
            // Last reminder more than a week ago
            lte(buyerRequirements.lastValidationReminder, cutoffDate)
          )
        ));
      }
      async getExpiredValidationRequirements(currentDate) {
        return await db.select().from(buyerRequirements).where(and(
          eq(buyerRequirements.isActive, true),
          lte(buyerRequirements.validationExpires, currentDate),
          eq(buyerRequirements.validationResponseReceived, false)
        ));
      }
      async getBuyerRequirementByValidationToken(token) {
        const [requirement] = await db.select().from(buyerRequirements).where(eq(buyerRequirements.validationToken, token));
        return requirement;
      }
      // Messaging operations
      async createConversation(insertConversation) {
        const [conversation] = await db.insert(conversations).values(insertConversation).returning();
        return conversation;
      }
      async getOrCreateConversation(participant1Id, participant2Id, propertyId, requirementId) {
        const [existingConversation] = await db.select().from(conversations).where(
          and(
            or(
              and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
              and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
            ),
            propertyId ? eq(conversations.propertyId, propertyId) : sql2`${conversations.propertyId} IS NULL`,
            requirementId ? eq(conversations.requirementId, requirementId) : sql2`${conversations.requirementId} IS NULL`,
            eq(conversations.isActive, true)
          )
        );
        if (existingConversation) {
          return existingConversation;
        }
        let subject = "Property Inquiry";
        if (propertyId) {
          const property = await this.getPropertyById(propertyId);
          subject = `Inquiry about: ${property?.title || "Property"}`;
        } else if (requirementId) {
          const requirement = await this.getBuyerRequirementById(requirementId);
          subject = `Response to: ${requirement?.title || "Requirement"}`;
        }
        return this.createConversation({
          participant1Id,
          participant2Id,
          propertyId: propertyId || null,
          requirementId: requirementId || null,
          subject,
          isActive: true
        });
      }
      async getUserConversations(userId) {
        return await db.select().from(conversations).where(
          and(
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            ),
            eq(conversations.isActive, true)
          )
        ).orderBy(desc(conversations.lastMessageAt));
      }
      async getConversationById(id) {
        const [conversation] = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.isActive, true)));
        return conversation;
      }
      async updateConversationLastMessage(id) {
        await db.update(conversations).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id));
      }
      // Message operations
      async createMessage(insertMessage) {
        const [message] = await db.insert(messages).values(insertMessage).returning();
        await this.updateConversationLastMessage(insertMessage.conversationId);
        return message;
      }
      async getConversationMessages(conversationId) {
        return await db.select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          isRead: messages.isRead,
          messageType: messages.messageType,
          createdAt: messages.createdAt,
          senderName: sql2`${users.firstName} || ' ' || ${users.lastName}`,
          senderEmail: users.email
        }).from(messages).leftJoin(users, eq(messages.senderId, users.id)).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
      }
      async markMessagesAsRead(conversationId, userId) {
        await db.update(messages).set({ isRead: true }).where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.senderId, userId)
          )
        );
      }
      async getUnreadMessageCount(userId) {
        const userConversations = await this.getUserConversations(userId);
        const conversationIds = userConversations.map((c) => c.id);
        if (conversationIds.length === 0) return 0;
        const unreadMessages = await db.select().from(messages).where(eq(messages.isRead, false));
        return unreadMessages.filter(
          (msg) => conversationIds.includes(msg.conversationId) && msg.senderId !== userId
        ).length;
      }
      // Notification operations
      async createNotification(insertNotification) {
        const [notification] = await db.insert(notifications).values(insertNotification).returning();
        return notification;
      }
      async getUserNotifications(userId) {
        return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
      }
      async markNotificationAsRead(id) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
      }
      async markAllNotificationsAsRead(userId) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
      }
      async getUnreadNotificationCount(userId) {
        const result = await db.select().from(notifications).where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
        return result.length;
      }
      // Service provider operations
      async createServiceProvider(insertServiceProvider) {
        const [serviceProvider] = await db.insert(serviceProviders).values(insertServiceProvider).returning();
        return serviceProvider;
      }
      async getServiceProviders(category) {
        if (category) {
          return await db.select().from(serviceProviders).where(
            and(
              eq(serviceProviders.isActive, true),
              eq(serviceProviders.category, category)
            )
          ).orderBy(desc(serviceProviders.createdAt));
        }
        return await db.select().from(serviceProviders).where(eq(serviceProviders.isActive, true)).orderBy(desc(serviceProviders.createdAt));
      }
      async getServiceProviderById(id) {
        const [serviceProvider] = await db.select().from(serviceProviders).where(eq(serviceProviders.id, id));
        return serviceProvider;
      }
      async getServiceProvidersByUser(userId) {
        return await db.select().from(serviceProviders).where(eq(serviceProviders.userId, userId)).orderBy(desc(serviceProviders.createdAt));
      }
      async updateServiceProvider(id, updates) {
        const [serviceProvider] = await db.update(serviceProviders).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(serviceProviders.id, id)).returning();
        return serviceProvider;
      }
      async deleteServiceProvider(id) {
        const result = await db.delete(serviceProviders).where(eq(serviceProviders.id, id));
        return result.rowCount ? result.rowCount > 0 : false;
      }
      // Verification operations
      async requestPropertyVerification(propertyId, chanoteDocumentPath, idDocumentPath) {
        const [property] = await db.update(properties).set({
          verificationStatus: "requested",
          chanoteDocumentPath,
          idDocumentPath,
          verificationRequestedAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(properties.id, propertyId)).returning();
        return property;
      }
      async updateVerificationStatus(propertyId, status, notes) {
        const updates = {
          verificationStatus: status,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (notes) {
          updates.verificationNotes = notes;
        }
        if (status === "verified") {
          updates.verifiedAt = /* @__PURE__ */ new Date();
        }
        const [property] = await db.update(properties).set(updates).where(eq(properties.id, propertyId)).returning();
        return property;
      }
      async getPropertiesNeedingVerification() {
        return await db.select().from(properties).where(eq(properties.verificationStatus, "requested")).orderBy(asc(properties.verificationRequestedAt));
      }
      async getPendingVerifications() {
        const pendingProperties = await db.select({
          property: properties,
          owner: users
        }).from(properties).leftJoin(users, eq(properties.ownerId, users.id)).where(or(
          eq(properties.verificationStatus, "requested"),
          eq(properties.verificationStatus, "pending")
        )).orderBy(desc(properties.verificationRequestedAt));
        return pendingProperties.map(({ property, owner }) => ({
          ...property,
          ownerIsPremium: owner?.subscriptionType === "premium",
          isVerified: property.verificationStatus === "verified"
        }));
      }
      async getAdminUsers() {
        return await db.select().from(users).where(eq(users.role, "admin"));
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/email.ts
import nodemailer from "nodemailer";
import crypto from "crypto";
var createEmailTransporter, generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, sendValidationEmail, sendDailyDigestEmail, sendInstantMatchEmail;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    createEmailTransporter = () => {
      const port = parseInt(process.env.SMTP_PORT || "587");
      const config = {
        service: "gmail",
        // Use Gmail service directly
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 6e4,
        greetingTimeout: 3e4,
        socketTimeout: 6e4
      };
      console.log("Email config:", { service: "gmail", user: process.env.SMTP_USER });
      return nodemailer.createTransport(config);
    };
    generateVerificationToken = () => {
      return crypto.randomBytes(32).toString("hex");
    };
    sendVerificationEmail = async (email, firstName, token) => {
      const transporter = createEmailTransporter();
      const verificationUrl = `${process.env.REPLIT_DOMAINS || "http://localhost:5000"}/verify-email?token=${token}`;
      const mailOptions = {
        from: `"HotProp" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify your HotProp account",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to HotProp</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Thank you for joining HotProp - the platform that connects property owners directly with buyers and renters, eliminating agent fees.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">
            To complete your registration and start exploring properties, please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #4F7AFF; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; margin: 0;">
            This verification link will expire in 24 hours. If you didn't create an account with HotProp, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">\xA9 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `
      };
      try {
        await transporter.sendMail(mailOptions);
        return true;
      } catch (error) {
        console.error("Error sending verification email:", error);
        return false;
      }
    };
    sendWelcomeEmail = async (email, firstName) => {
      const transporter = createEmailTransporter();
      const mailOptions = {
        from: `"HotProp" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome to HotProp - Start exploring properties!",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to HotProp</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">\u{1F389} Your account is verified, ${firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            You're now ready to explore the best properties without any agent fees. Here's what you can do:
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 30px;">
            <li><strong>Browse Properties:</strong> Discover houses, apartments, land, townhouses, and pool villas</li>
            <li><strong>Contact Owners Directly:</strong> Message property owners through our platform</li>
            <li><strong>List Your Property:</strong> If you're an owner, list your property for free</li>
            <li><strong>Save Favorites:</strong> Keep track of properties you're interested in</li>
            <li><strong>Create Requirements:</strong> Let us know what you're looking for</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.REPLIT_DOMAINS || "http://localhost:5000"}" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              Start Exploring Properties
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            Happy property hunting! \u{1F3E0}
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">\xA9 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `
      };
      try {
        await transporter.sendMail(mailOptions);
        return true;
      } catch (error) {
        console.error("Error sending welcome email:", error);
        return false;
      }
    };
    sendValidationEmail = async (email, firstName, listingTitle, listingType, token) => {
      const transporter = createEmailTransporter();
      const validationUrl = `${process.env.REPLIT_DOMAINS || "http://localhost:5000"}/validate-listing?token=${token}&type=${listingType}`;
      const isProperty = listingType === "property";
      const itemType = isProperty ? "property listing" : "property requirement";
      const action = isProperty ? "still available for sale/rent" : "still active";
      const mailOptions = {
        from: `"HotProp" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Please confirm your ${itemType} is still active`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HotProp</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            ${isProperty ? `We hope your ${itemType} "<strong>${listingTitle}</strong>" is going well!` : `We hope your ${itemType} "<strong>${listingTitle}</strong>" got some good responses!`}
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            To keep our platform current and ensure the best experience for all users, we need you to confirm that your ${itemType} is ${action}.
          </p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 16px; color: #856404;">
              <strong>\u23F0 Important:</strong> Please confirm within 24 hours or your ${itemType} will be automatically deactivated (but not deleted).
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationUrl}" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              \u2713 Yes, My ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} is Still Active
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, click this direct link:
          </p>
          <p style="font-size: 14px; margin: 10px 0;">
            <a href="${validationUrl}" style="color: #4F7AFF; text-decoration: underline;" target="_blank">
              ${validationUrl}
            </a>
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Or copy and paste this URL into your browser: ${validationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; margin: 0;">
            <strong>Don't worry if you miss the deadline!</strong> If your ${itemType} gets deactivated, you can easily reactivate it anytime from your account dashboard.
          </p>
          
          <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">
            This validation helps us maintain a high-quality platform with current listings for all our users.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">\xA9 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `
      };
      try {
        await transporter.sendMail(mailOptions);
        return true;
      } catch (error) {
        console.error("Error sending validation email:", error);
        return false;
      }
    };
    sendDailyDigestEmail = async (email, firstName, propertyMatches, requirementMatches) => {
      const transporter = createEmailTransporter();
      const hasPropertyMatches = propertyMatches.length > 0;
      const hasRequirementMatches = requirementMatches.length > 0;
      const totalMatches = propertyMatches.length + requirementMatches.length;
      if (totalMatches === 0) {
        return false;
      }
      const baseUrl = process.env.REPLIT_DOMAINS || "http://localhost:5000";
      const propertyMatchesHtml = hasPropertyMatches ? `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #4F7AFF; margin-bottom: 15px; font-size: 18px;">\u{1F3E0} Property Matches for Your Requirements</h3>
      ${propertyMatches.map((match) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${match.property.title}</h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            <strong>${match.property.propertyType}</strong> \u2022 ${match.property.transactionType} \u2022 
            ${match.property.price ? `${match.property.currency} ${match.property.price.toLocaleString()}` : `${match.property.rentCurrency} ${match.property.rentPrice?.toLocaleString()}/month`}
          </p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">\u{1F4CD} ${match.property.city}, ${match.property.state}</p>
          <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${match.property.description.substring(0, 120)}...</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${Math.round(match.compatibilityScore)}% Match
            </span>
            <a href="${baseUrl}/property/${match.property.id}" 
               style="color: #4F7AFF; text-decoration: none; font-size: 14px; font-weight: bold;">
              View Details \u2192
            </a>
          </div>
        </div>
      `).join("")}
    </div>
  ` : "";
      const requirementMatchesHtml = hasRequirementMatches ? `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #4F7AFF; margin-bottom: 15px; font-size: 18px;">\u{1F50D} Requirement Matches for Your Properties</h3>
      ${requirementMatches.map((match) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${match.requirement.title}</h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            <strong>${match.requirement.propertyType}</strong> \u2022 ${match.requirement.transactionType} \u2022 
            Budget: ${match.requirement.currency} ${match.requirement.maxPrice?.toLocaleString() || "Flexible"}
          </p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">\u{1F4CD} ${match.requirement.preferredCity || "Any city"}, ${match.requirement.preferredState || "Any state"}</p>
          <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${match.requirement.description.substring(0, 120)}...</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${Math.round(match.compatibilityScore)}% Match
            </span>
            <a href="${baseUrl}/requirement/${match.requirement.id}" 
               style="color: #4F7AFF; text-decoration: none; font-size: 14px; font-weight: bold;">
              View Details \u2192
            </a>
          </div>
        </div>
      `).join("")}
    </div>
  ` : "";
      const mailOptions = {
        from: `"HotProp" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Your Daily Property Matches - ${totalMatches} new ${totalMatches === 1 ? "match" : "matches"}!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HotProp Daily Digest</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}! \u{1F44B}</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Great news! We found <strong>${totalMatches} ${totalMatches === 1 ? "new match" : "new matches"}</strong> for you from the last 5 days.
          </p>
          
          ${propertyMatchesHtml}
          ${requirementMatchesHtml}
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              \u{1F4A1} <strong>Tip:</strong> These matches are based on your active property requirements and listings. 
              Update your preferences anytime to get more accurate matches!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/dashboard" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              View All Your Matches
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">\xA9 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${baseUrl}/profile" style="color: #4F7AFF; text-decoration: none;">Update email preferences</a>
          </p>
        </div>
      </div>
    `
      };
      try {
        await transporter.sendMail(mailOptions);
        return true;
      } catch (error) {
        console.error("Error sending daily digest email:", error);
        return false;
      }
    };
    sendInstantMatchEmail = async (email, firstName, matchType, matchData) => {
      const transporter = createEmailTransporter();
      const baseUrl = process.env.REPLIT_DOMAINS || "http://localhost:5000";
      const { property, requirement, compatibilityScore, matchingCriteria } = matchData;
      const isPropertyMatch = matchType === "property";
      const title = isPropertyMatch ? "New Property Match Found!" : "New Requirement Match Found!";
      const emoji = isPropertyMatch ? "\u{1F3E0}" : "\u{1F50D}";
      const mailOptions = {
        from: `"HotProp" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${emoji} ${title} - ${Math.round(compatibilityScore)}% Match!`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${emoji} Instant Match Alert!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Premium Member Exclusive</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}! \u{1F44B}</h2>
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h3 style="margin: 0; font-size: 18px;">${Math.round(compatibilityScore)}% Match Found!</h3>
            <p style="margin: 5px 0 0 0; font-size: 14px;">High-quality match detected instantly</p>
          </div>
          
          ${isPropertyMatch ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #4F7AFF; margin-bottom: 15px;">\u{1F3E0} New Property Match</h3>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc;">
              <h4 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${property.title}</h4>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                <strong>${property.propertyType}</strong> \u2022 ${property.transactionType} \u2022 
                ${property.price ? `${property.currency} ${property.price.toLocaleString()}` : `${property.rentCurrency} ${property.rentPrice?.toLocaleString()}/month`}
              </p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">\u{1F4CD} ${property.city}, ${property.state}</p>
              <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${property.description.substring(0, 150)}...</p>
              <p style="margin: 0 0 10px 0; color: #10b981; font-size: 12px; font-weight: bold;">
                Matches your requirement: "${requirement.title}"
              </p>
            </div>
          </div>
          ` : `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #4F7AFF; margin-bottom: 15px;">\u{1F50D} New Requirement Match</h3>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc;">
              <h4 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${requirement.title}</h4>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                <strong>${requirement.propertyType}</strong> \u2022 ${requirement.transactionType} \u2022 
                Budget: ${requirement.currency} ${requirement.maxPrice?.toLocaleString() || "Flexible"}
              </p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">\u{1F4CD} ${requirement.preferredCity || "Any city"}, ${requirement.preferredState || "Any state"}</p>
              <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${requirement.description.substring(0, 150)}...</p>
              <p style="margin: 0 0 10px 0; color: #10b981; font-size: 12px; font-weight: bold;">
                Matches your property: "${property.title}"
              </p>
            </div>
          </div>
          `}
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">\u{1F3AF} Why This is a Great Match:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1; font-size: 14px;">
              ${matchingCriteria.map((criteria) => `<li>${criteria}</li>`).join("")}
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              \u26A1 <strong>Premium Exclusive:</strong> You received this instant notification because you're a Premium member! 
              Free users only get daily digest emails.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/${isPropertyMatch ? `property/${property.id}` : `requirement/${requirement.id}`}" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              View ${isPropertyMatch ? "Property" : "Requirement"} Details
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">\xA9 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${baseUrl}/profile" style="color: #4F7AFF; text-decoration: none;">Update email preferences</a>
          </p>
        </div>
      </div>
    `
      };
      try {
        await transporter.sendMail(mailOptions);
        return true;
      } catch (error) {
        console.error("Error sending instant match email:", error);
        return false;
      }
    };
  }
});

// server/test-email.ts
var test_email_exports = {};
__export(test_email_exports, {
  sendTestValidationEmail: () => sendTestValidationEmail
});
import crypto2 from "crypto";
async function sendTestValidationEmail(userEmail, userName) {
  try {
    const user = await storage.getUserByEmail(userEmail);
    if (!user) {
      console.log("\u274C User not found, creating test scenario with mock property");
      const validationToken2 = crypto2.randomBytes(32).toString("hex");
      const validationExpires2 = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const testProperty = await storage.createProperty({
        ownerId: "test-user-id",
        title: "Test Property - Beautiful 3-Bedroom Villa",
        description: "Test property for validation system",
        propertyType: "House",
        transactionType: "Rent",
        price: "2500000",
        currency: "THB",
        address: "123 Test Street, Bangkok",
        city: "Bangkok",
        state: "Bangkok",
        country: "Thailand",
        landSize: "200",
        buildSize: "150",
        bedrooms: 3,
        bathrooms: 2,
        amenities: ["Parking", "Swimming Pool"],
        images: [],
        isActive: true,
        validationToken: validationToken2,
        validationExpires: validationExpires2
      });
      await sendValidationEmail(
        userEmail,
        userName,
        testProperty.title,
        "property",
        validationToken2
      );
      console.log(`\u2705 Test validation email sent with real token: ${validationToken2}`);
      console.log(`\u{1F517} Test link: http://localhost:5000/validate-listing?token=${validationToken2}&type=property`);
      console.log(`\u{1F310} Alternative link: https://${process.env.REPLIT_DEV_DOMAIN}/validate-listing?token=${validationToken2}&type=property`);
      return true;
    }
    const properties2 = await storage.getPropertiesByOwner(user.id);
    if (properties2.length === 0) {
      console.log("\u274C User has no properties, cannot test validation");
      return false;
    }
    const property = properties2[0];
    const validationToken = crypto2.randomBytes(32).toString("hex");
    const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await storage.updateProperty(property.id, {
      validationToken,
      validationExpires,
      validationResponseReceived: false
    });
    await sendValidationEmail(
      userEmail,
      userName,
      property.title,
      "property",
      validationToken
    );
    console.log(`\u2705 Test validation email sent for real property: ${property.title}`);
    console.log(`\u{1F517} Test link: http://localhost:5000/validate-listing?token=${validationToken}&type=property`);
    return true;
  } catch (error) {
    console.error("\u274C Failed to send test email:", error);
    return false;
  }
}
var init_test_email = __esm({
  "server/test-email.ts"() {
    "use strict";
    init_email();
    init_storage();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the upload URL for verification documents.
  async getVerificationDocumentUploadURL(documentType) {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/verification/${documentType}/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
init_schema();
init_email();
import jwt from "jsonwebtoken";
import Stripe from "stripe";

// server/validation-system.ts
init_storage();
init_email();

// server/matching-service.ts
var MatchingService = class {
  /**
   * Calculate compatibility score between a property and buyer requirement
   * Returns a score from 0-100 representing percentage match
   */
  calculateCompatibility(property, requirement) {
    let totalCriteria = 0;
    let matchedCriteria = 0;
    totalCriteria += 20;
    if (property.propertyType === requirement.propertyType) {
      matchedCriteria += 20;
    }
    totalCriteria += 20;
    if (this.transactionTypesMatch(property.transactionType, requirement.transactionType)) {
      matchedCriteria += 20;
    }
    totalCriteria += 15;
    if (this.priceInRange(property, requirement)) {
      matchedCriteria += 15;
    }
    totalCriteria += 15;
    if (this.locationMatches(property, requirement)) {
      matchedCriteria += 15;
    }
    if (requirement.minBedrooms !== null && requirement.minBedrooms !== void 0) {
      totalCriteria += 10;
      if (property.bedrooms && property.bedrooms >= requirement.minBedrooms) {
        matchedCriteria += 10;
      }
    }
    if (requirement.minBathrooms !== null && requirement.minBathrooms !== void 0) {
      totalCriteria += 5;
      if (property.bathrooms && property.bathrooms >= requirement.minBathrooms) {
        matchedCriteria += 5;
      }
    }
    if (requirement.minArea !== null || requirement.maxArea !== null) {
      totalCriteria += 10;
      if (this.areaInRange(property, requirement)) {
        matchedCriteria += 10;
      }
    }
    if (requirement.minLandSize !== null || requirement.maxLandSize !== null) {
      totalCriteria += 5;
      if (this.landSizeInRange(property, requirement)) {
        matchedCriteria += 5;
      }
    }
    if (requirement.minBuildSize !== null || requirement.maxBuildSize !== null) {
      totalCriteria += 5;
      if (this.buildSizeInRange(property, requirement)) {
        matchedCriteria += 5;
      }
    }
    if (requirement.requiredAmenities && requirement.requiredAmenities.length > 0) {
      totalCriteria += 5;
      if (this.amenitiesMatch(property, requirement)) {
        matchedCriteria += 5;
      }
    }
    return totalCriteria > 0 ? Math.round(matchedCriteria / totalCriteria * 100) : 0;
  }
  /**
   * Get detailed match information
   */
  getMatchDetails(property, requirement) {
    return {
      propertyType: property.propertyType === requirement.propertyType,
      transactionType: this.transactionTypesMatch(property.transactionType, requirement.transactionType),
      priceRange: this.priceInRange(property, requirement),
      location: this.locationMatches(property, requirement),
      bedrooms: !requirement.minBedrooms || Boolean(property.bedrooms && property.bedrooms >= requirement.minBedrooms),
      bathrooms: !requirement.minBathrooms || Boolean(property.bathrooms && property.bathrooms >= requirement.minBathrooms),
      area: this.areaInRange(property, requirement),
      landSize: this.landSizeInRange(property, requirement),
      buildSize: this.buildSizeInRange(property, requirement),
      amenities: this.amenitiesMatch(property, requirement)
    };
  }
  /**
   * Find all matches for a buyer requirement with at least the minimum compatibility score
   */
  findMatches(properties2, requirement, minCompatibility = 80) {
    const matches = [];
    for (const property of properties2) {
      if (!property.isActive || property.ownerId === requirement.buyerId) {
        continue;
      }
      const compatibilityScore = this.calculateCompatibility(property, requirement);
      if (compatibilityScore >= minCompatibility) {
        matches.push({
          property,
          requirement,
          compatibilityScore,
          matchDetails: this.getMatchDetails(property, requirement)
        });
      }
    }
    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
  /**
   * Find all matches for multiple buyer requirements
   */
  findMatchesForRequirements(properties2, requirements, minCompatibility = 80) {
    const allMatches = [];
    for (const requirement of requirements) {
      if (!requirement.isActive) continue;
      const matches = this.findMatches(properties2, requirement, minCompatibility);
      allMatches.push(...matches);
    }
    return allMatches;
  }
  transactionTypesMatch(propertyType, requirementType) {
    if (propertyType === "sell_or_rent") return true;
    if (propertyType === "sell" && requirementType === "buy") return true;
    if (propertyType === "rent" && requirementType === "rent") return true;
    return false;
  }
  priceInRange(property, requirement) {
    const price = requirement.transactionType === "rent" ? property.rentPrice : property.price;
    const currency = requirement.transactionType === "rent" ? property.rentCurrency : property.currency;
    if (!price) return false;
    if (currency !== requirement.currency) return false;
    const priceValue = parseFloat(price.toString());
    const minPrice = requirement.minPrice ? parseFloat(requirement.minPrice.toString()) : 0;
    const maxPrice = requirement.maxPrice ? parseFloat(requirement.maxPrice.toString()) : Infinity;
    return priceValue >= minPrice && priceValue <= maxPrice;
  }
  locationMatches(property, requirement) {
    if (requirement.city && property.city) {
      if (property.city.toLowerCase() === requirement.city.toLowerCase()) {
        return true;
      }
    }
    if (!requirement.city && requirement.state && property.state) {
      if (property.state.toLowerCase() === requirement.state.toLowerCase()) {
        return true;
      }
    }
    if (!requirement.city && !requirement.state && requirement.country && property.country) {
      if (property.country.toLowerCase() === requirement.country.toLowerCase()) {
        return true;
      }
    }
    if (!requirement.city && !requirement.state && !requirement.country) {
      return true;
    }
    return false;
  }
  areaInRange(property, requirement) {
    if (!property.area) return !requirement.minArea && !requirement.maxArea;
    const propertyArea = parseFloat(property.area.toString());
    const minArea = requirement.minArea ? parseFloat(requirement.minArea.toString()) : 0;
    const maxArea = requirement.maxArea ? parseFloat(requirement.maxArea.toString()) : Infinity;
    return propertyArea >= minArea && propertyArea <= maxArea;
  }
  landSizeInRange(property, requirement) {
    if (!property.landSize) return !requirement.minLandSize && !requirement.maxLandSize;
    const propertyLandSize = parseFloat(property.landSize.toString());
    const minLandSize = requirement.minLandSize ? parseFloat(requirement.minLandSize.toString()) : 0;
    const maxLandSize = requirement.maxLandSize ? parseFloat(requirement.maxLandSize.toString()) : Infinity;
    return propertyLandSize >= minLandSize && propertyLandSize <= maxLandSize;
  }
  buildSizeInRange(property, requirement) {
    if (!property.buildSize) return !requirement.minBuildSize && !requirement.maxBuildSize;
    const propertyBuildSize = parseFloat(property.buildSize.toString());
    const minBuildSize = requirement.minBuildSize ? parseFloat(requirement.minBuildSize.toString()) : 0;
    const maxBuildSize = requirement.maxBuildSize ? parseFloat(requirement.maxBuildSize.toString()) : Infinity;
    return propertyBuildSize >= minBuildSize && propertyBuildSize <= maxBuildSize;
  }
  amenitiesMatch(property, requirement) {
    if (!requirement.requiredAmenities || requirement.requiredAmenities.length === 0) {
      return true;
    }
    if (!property.amenities || property.amenities.length === 0) {
      return false;
    }
    return requirement.requiredAmenities.every(
      (requiredAmenity) => property.amenities.some(
        (propertyAmenity) => propertyAmenity.toLowerCase().includes(requiredAmenity.toLowerCase())
      )
    );
  }
  findMatchesForProperty(property, requirements, minCompatibility = 0) {
    const matches = [];
    for (const requirement of requirements) {
      const score = this.calculateCompatibilityScore(property, requirement);
      if (score >= minCompatibility) {
        matches.push({
          requirement,
          property,
          compatibilityScore: score,
          matchingCriteria: this.getMatchingCriteria(property, requirement)
        });
      }
    }
    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
  calculateCompatibilityScore(property, requirement) {
    return this.calculateCompatibility(property, requirement);
  }
  getMatchingCriteria(property, requirement) {
    const criteria = [];
    if (property.propertyType === requirement.propertyType) {
      criteria.push("Property Type");
    }
    if (this.transactionTypesMatch(property.transactionType, requirement.transactionType)) {
      criteria.push("Transaction Type");
    }
    if (this.priceInRange(property, requirement)) {
      criteria.push("Price Range");
    }
    if (this.locationMatches(property, requirement)) {
      criteria.push("Location");
    }
    if (requirement.minBedrooms && property.bedrooms && property.bedrooms >= requirement.minBedrooms) {
      criteria.push("Bedrooms");
    }
    if (requirement.minBathrooms && property.bathrooms && property.bathrooms >= requirement.minBathrooms) {
      criteria.push("Bathrooms");
    }
    if (this.areaInRange(property, requirement)) {
      criteria.push("Area");
    }
    if (this.landSizeInRange(property, requirement)) {
      criteria.push("Land Size");
    }
    if (this.buildSizeInRange(property, requirement)) {
      criteria.push("Build Size");
    }
    if (this.amenitiesMatch(property, requirement)) {
      criteria.push("Amenities");
    }
    return criteria;
  }
};
var matchingService = new MatchingService();

// server/validation-system.ts
import cron from "node-cron";
var ValidationSystem = class _ValidationSystem {
  static instance;
  jobScheduled = false;
  static getInstance() {
    if (!_ValidationSystem.instance) {
      _ValidationSystem.instance = new _ValidationSystem();
    }
    return _ValidationSystem.instance;
  }
  // Start the weekly validation check
  startValidationScheduler() {
    if (this.jobScheduled) return;
    cron.schedule("0 9 * * 1", async () => {
      console.log("\u{1F504} Starting weekly validation check...");
      await this.performWeeklyValidationCheck();
    });
    cron.schedule("0 10 * * 2-7", async () => {
      console.log("\u23F0 Checking for expired validations...");
      await this.checkExpiredValidations();
    });
    cron.schedule("0 11 * * *", async () => {
      console.log("Sending daily latest matches notifications...");
      await this.sendDailyMatchesNotifications();
    });
    cron.schedule("0 18 * * *", async () => {
      console.log("Sending daily email digest...");
      await this.sendDailyEmailDigest();
    });
    this.jobScheduled = true;
    console.log("Validation scheduler started");
  }
  // Main weekly validation check
  async performWeeklyValidationCheck() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
      const propertiesToValidate = await storage.getPropertiesNeedingValidation(oneWeekAgo);
      console.log(`\u{1F4CB} Found ${propertiesToValidate.length} properties needing validation`);
      for (const property of propertiesToValidate) {
        console.log(`\u{1F4E4} Sending validation reminder for property: ${property.title}`);
        await this.sendPropertyValidationReminder(property);
      }
      const requirementsToValidate = await storage.getBuyerRequirementsNeedingValidation(oneWeekAgo);
      console.log(`\u{1F4CB} Found ${requirementsToValidate.length} requirements needing validation`);
      for (const requirement of requirementsToValidate) {
        console.log(`\u{1F4E4} Sending validation reminder for requirement: ${requirement.title}`);
        await this.sendRequirementValidationReminder(requirement);
      }
      console.log(`\u2705 Weekly validation check completed. Sent ${propertiesToValidate.length + requirementsToValidate.length} validation reminders.`);
    } catch (error) {
      console.error("\u274C Error in weekly validation check:", error);
    }
  }
  // Check for expired validations and deactivate listings
  async checkExpiredValidations() {
    try {
      const now = /* @__PURE__ */ new Date();
      const expiredProperties = await storage.getExpiredValidationProperties(now);
      console.log(`Found ${expiredProperties.length} properties with expired validations`);
      for (const property of expiredProperties) {
        await storage.updateProperty(property.id, {
          isActive: false,
          validationToken: null,
          validationExpires: null
        });
        await storage.createNotification({
          userId: property.ownerId,
          type: "listing_deactivated",
          title: "Property Listing Deactivated",
          content: `Your property "${property.title}" has been deactivated due to missed validation. You can reactivate it anytime from your listings.`,
          relatedId: property.id
        });
      }
      const expiredRequirements = await storage.getExpiredValidationRequirements(now);
      console.log(`Found ${expiredRequirements.length} requirements with expired validations`);
      for (const requirement of expiredRequirements) {
        await storage.updateBuyerRequirement(requirement.id, {
          isActive: false,
          validationToken: null,
          validationExpires: null
        });
        await storage.createNotification({
          userId: requirement.buyerId,
          type: "requirement_deactivated",
          title: "Requirement Deactivated",
          content: `Your requirement "${requirement.title}" has been deactivated due to missed validation. You can reactivate it anytime from your requirements.`,
          relatedId: requirement.id
        });
      }
    } catch (error) {
      console.error("Error checking expired validations:", error);
    }
  }
  // Send validation reminder for property
  async sendPropertyValidationReminder(property) {
    try {
      const validationToken = generateVerificationToken();
      const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await storage.updateProperty(property.id, {
        lastValidationReminder: /* @__PURE__ */ new Date(),
        validationToken,
        validationExpires,
        validationResponseReceived: false
      });
      await storage.createNotification({
        userId: property.ownerId,
        type: "validation_reminder",
        title: "Confirm Your Property Listing",
        content: `Please confirm that your property "${property.title}" is still available. Click to validate within 24 hours or it will be deactivated.`,
        relatedId: property.id
      });
      const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        const owner = await storage.getUserById(property.ownerId);
        if (owner) {
          console.log(`\u{1F4E7} Sending validation email to ${owner.firstName} (${owner.email}) for property: ${property.title}`);
          await sendValidationEmail(
            owner.email,
            owner.firstName,
            property.title,
            "property",
            validationToken
          );
          console.log(`\u2705 Validation email sent successfully`);
        } else {
          console.log(`\u274C Could not find owner for property: ${property.title}`);
        }
      } else {
        console.log(`\u274C SMTP not configured, skipping email for property: ${property.title}`);
      }
    } catch (error) {
      console.error("\u274C Error sending property validation reminder:", error);
    }
  }
  // Send validation reminder for requirement
  async sendRequirementValidationReminder(requirement) {
    try {
      const validationToken = generateVerificationToken();
      const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await storage.updateBuyerRequirement(requirement.id, {
        lastValidationReminder: /* @__PURE__ */ new Date(),
        validationToken,
        validationExpires,
        validationResponseReceived: false
      });
      await storage.createNotification({
        userId: requirement.buyerId,
        type: "validation_reminder",
        title: "Confirm Your Property Requirement",
        content: `Please confirm that your requirement "${requirement.title}" is still active. Click to validate within 24 hours or it will be deactivated.`,
        relatedId: requirement.id
      });
      const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        const buyer = await storage.getUserById(requirement.buyerId);
        if (buyer) {
          console.log(`\u{1F4E7} Sending validation email to ${buyer.firstName} (${buyer.email}) for requirement: ${requirement.title}`);
          await sendValidationEmail(
            buyer.email,
            buyer.firstName,
            requirement.title,
            "requirement",
            validationToken
          );
          console.log(`\u2705 Validation email sent successfully`);
        } else {
          console.log(`\u274C Could not find buyer for requirement: ${requirement.title}`);
        }
      } else {
        console.log(`\u274C SMTP not configured, skipping email for requirement: ${requirement.title}`);
      }
    } catch (error) {
      console.error("\u274C Error sending requirement validation reminder:", error);
    }
  }
  // Validate a listing/requirement
  async validateListing(token, type) {
    try {
      if (type === "property") {
        const property = await storage.getPropertyByValidationToken(token);
        if (!property) {
          return { success: false, message: "Invalid or expired validation token" };
        }
        if (/* @__PURE__ */ new Date() > new Date(property.validationExpires)) {
          return { success: false, message: "Validation token has expired" };
        }
        await storage.updateProperty(property.id, {
          lastValidated: /* @__PURE__ */ new Date(),
          validationResponseReceived: true,
          validationToken: null,
          validationExpires: null
        });
        await storage.createNotification({
          userId: property.ownerId,
          type: "validation_confirmed",
          title: "Property Listing Confirmed",
          content: `Thank you for confirming your property "${property.title}". Your listing remains active.`,
          relatedId: property.id
        });
        return { success: true, message: "Property listing validated successfully" };
      } else {
        const requirement = await storage.getBuyerRequirementByValidationToken(token);
        if (!requirement) {
          return { success: false, message: "Invalid or expired validation token" };
        }
        if (/* @__PURE__ */ new Date() > new Date(requirement.validationExpires)) {
          return { success: false, message: "Validation token has expired" };
        }
        await storage.updateBuyerRequirement(requirement.id, {
          lastValidated: /* @__PURE__ */ new Date(),
          validationResponseReceived: true,
          validationToken: null,
          validationExpires: null
        });
        await storage.createNotification({
          userId: requirement.buyerId,
          type: "validation_confirmed",
          title: "Requirement Confirmed",
          content: `Thank you for confirming your requirement "${requirement.title}". Your requirement remains active.`,
          relatedId: requirement.id
        });
        return { success: true, message: "Requirement validated successfully" };
      }
    } catch (error) {
      console.error("Error validating listing:", error);
      return { success: false, message: "Validation failed" };
    }
  }
  // Send daily latest matches notifications to users with requirements OR properties
  async sendDailyMatchesNotifications() {
    try {
      let notificationsSent = 0;
      const allRequirements = await storage.getBuyerRequirements();
      const activeRequirements = allRequirements.filter((req) => req.isActive);
      if (activeRequirements.length > 0) {
        const userRequirements = activeRequirements.reduce((acc, req) => {
          if (!acc[req.buyerId]) {
            acc[req.buyerId] = [];
          }
          acc[req.buyerId].push(req);
          return acc;
        }, {});
        const properties2 = await storage.getActiveProperties();
        for (const [userId, requirements] of Object.entries(userRequirements)) {
          try {
            const matches = matchingService.findMatchesForRequirements(properties2, requirements, 80);
            if (matches.length > 0) {
              const uniqueMatches = matches.reduce((acc, match) => {
                const existingMatch = acc.find((m) => m.property.id === match.property.id);
                if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
                  acc = acc.filter((m) => m.property.id !== match.property.id);
                  acc.push(match);
                }
                return acc;
              }, []);
              await storage.createNotification({
                userId,
                type: "latest_matches",
                title: "Latest property matches (80%+)",
                content: `Found ${uniqueMatches.length} properties matching your requirements with 80%+ compatibility. Click to view your latest matches.`,
                relatedId: null
              });
              notificationsSent++;
            }
          } catch (error) {
            console.error(`Error processing property matches for user ${userId}:`, error);
          }
        }
      }
      const allProperties = await storage.getActiveProperties();
      if (allProperties.length > 0) {
        const userProperties = allProperties.reduce((acc, prop) => {
          if (!acc[prop.ownerId]) {
            acc[prop.ownerId] = [];
          }
          acc[prop.ownerId].push(prop);
          return acc;
        }, {});
        for (const [userId, properties2] of Object.entries(userProperties)) {
          try {
            const requirementMatches = [];
            for (const property of properties2) {
              const matches = matchingService.findMatchesForProperty(property, activeRequirements, 80);
              requirementMatches.push(...matches);
            }
            if (requirementMatches.length > 0) {
              const uniqueMatches = requirementMatches.reduce((acc, match) => {
                const existingMatch = acc.find((m) => m.requirement.id === match.requirement.id);
                if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
                  acc = acc.filter((m) => m.requirement.id !== match.requirement.id);
                  acc.push(match);
                }
                return acc;
              }, []);
              await storage.createNotification({
                userId,
                type: "requirement_match",
                title: "Latest requirement matches (80%+)",
                content: `Found ${uniqueMatches.length} buyer requirements matching your properties with 80%+ compatibility. Click to view your latest matches.`,
                relatedId: null
              });
              notificationsSent++;
            }
          } catch (error) {
            console.error(`Error processing requirement matches for user ${userId}:`, error);
          }
        }
      }
      console.log(`Daily matches notifications sent to ${notificationsSent} users`);
    } catch (error) {
      console.error("Error in daily matches notifications:", error);
    }
  }
  // Send daily email digest with latest matches from last 5 days
  async sendDailyEmailDigest() {
    try {
      const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if (!hasSmtpCredentials) {
        console.log("SMTP not configured, skipping daily email digest");
        return;
      }
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3);
      const allUsers = await storage.getUsers();
      const activeUsers = allUsers.filter((user) => user.isVerified);
      if (activeUsers.length === 0) {
        console.log("No verified users found for email digest");
        return;
      }
      const recentProperties = await storage.getPropertiesCreatedAfter(fiveDaysAgo);
      const allRequirements = await storage.getBuyerRequirements();
      const recentRequirements = allRequirements.filter(
        (req) => req.isActive && req.createdAt && new Date(req.createdAt) >= fiveDaysAgo
      );
      let emailsSent = 0;
      for (const user of activeUsers) {
        try {
          const userProperties = await storage.getUserProperties(user.id);
          const activeUserProperties = userProperties.filter((p) => p.isActive);
          const userRequirements = allRequirements.filter(
            (req) => req.buyerId === user.id && req.isActive
          );
          const propertyMatches = [];
          const requirementMatches = [];
          if (userRequirements.length > 0) {
            const matches = matchingService.findMatchesForRequirements(recentProperties, userRequirements, 80);
            propertyMatches.push(...matches.slice(0, 5));
          }
          if (activeUserProperties.length > 0) {
            for (const property of activeUserProperties) {
              const matches = matchingService.findMatchesForProperty(property, recentRequirements, 80);
              requirementMatches.push(...matches);
            }
            const uniqueRequirementMatches = requirementMatches.filter(
              (match, index, self) => self.findIndex((m) => m.requirement.id === match.requirement.id) === index
            ).slice(0, 5);
            requirementMatches.length = 0;
            requirementMatches.push(...uniqueRequirementMatches);
          }
          if (propertyMatches.length > 0 || requirementMatches.length > 0) {
            const emailSent = await sendDailyDigestEmail(
              user.email,
              user.firstName,
              propertyMatches,
              requirementMatches
            );
            if (emailSent) {
              emailsSent++;
            }
          }
        } catch (error) {
          console.error(`Error processing email digest for user ${user.id}:`, error);
        }
      }
      console.log(`Daily email digest sent to ${emailsSent} users`);
    } catch (error) {
      console.error("Error in daily email digest:", error);
    }
  }
};
var validationSystem = ValidationSystem.getInstance();

// server/instant-notifications.ts
init_storage();
init_email();
async function checkInstantPropertyMatches(newProperty) {
  try {
    console.log(`\u{1F50D} Checking instant matches for new property: ${newProperty.title}`);
    const activeRequirements = await storage.getBuyerRequirements();
    const premiumRequirements = [];
    for (const req of activeRequirements) {
      if (req.isActive && req.buyerId !== newProperty.ownerId) {
        const user = await storage.getUserById(req.buyerId);
        if (user && user.subscriptionType === "premium") {
          premiumRequirements.push({ requirement: req, user });
        }
      }
    }
    if (premiumRequirements.length === 0) {
      console.log("\u{1F4ED} No premium requirements found for instant matching");
      return;
    }
    console.log(`\u{1F4CB} Found ${premiumRequirements.length} premium requirements to check`);
    const matchingService2 = new MatchingService();
    for (const { requirement, user } of premiumRequirements) {
      const compatibilityScore = matchingService2.calculateCompatibility(newProperty, requirement);
      if (compatibilityScore >= 80) {
        console.log(`\u{1F3AF} High-quality match found! ${Math.round(compatibilityScore)}% compatibility for ${user.firstName}`);
        await storage.createNotification({
          userId: user.id,
          type: "property_match",
          title: "\u{1F3E0} New Property Match Found!",
          content: `New property "${newProperty.title}" matches your requirement "${requirement.title}" with ${Math.round(compatibilityScore)}% compatibility!`,
          relatedId: newProperty.id
        });
        await sendInstantMatchEmail(
          user.email,
          user.firstName,
          "property",
          {
            property: newProperty,
            requirement,
            compatibilityScore,
            matchingCriteria: ["Property Type", "Location", "Price Range"]
            // Simplified for instant notifications
          }
        );
        console.log(`\u2705 Instant notification sent to ${user.firstName} (${user.email})`);
      }
    }
  } catch (error) {
    console.error("\u274C Error checking instant property matches:", error);
  }
}
async function checkInstantRequirementMatches(newRequirement) {
  try {
    console.log(`\u{1F50D} Checking instant matches for new requirement: ${newRequirement.title}`);
    const activeProperties = await storage.getProperties({});
    const premiumProperties = [];
    for (const prop of activeProperties) {
      if (prop.isActive && prop.ownerId !== newRequirement.buyerId) {
        const user = await storage.getUserById(prop.ownerId);
        if (user && user.subscriptionType === "premium") {
          premiumProperties.push({ property: prop, user });
        }
      }
    }
    if (premiumProperties.length === 0) {
      console.log("\u{1F4ED} No premium properties found for instant matching");
      return;
    }
    console.log(`\u{1F3E0} Found ${premiumProperties.length} premium properties to check`);
    const matchingService2 = new MatchingService();
    for (const { property, user } of premiumProperties) {
      const compatibilityScore = matchingService2.calculateCompatibility(property, newRequirement);
      if (compatibilityScore >= 80) {
        console.log(`\u{1F3AF} High-quality match found! ${Math.round(compatibilityScore)}% compatibility for ${user.firstName}`);
        await storage.createNotification({
          userId: user.id,
          type: "requirement_match",
          title: "\u{1F50D} New Requirement Match Found!",
          content: `New requirement "${newRequirement.title}" matches your property "${property.title}" with ${Math.round(compatibilityScore)}% compatibility!`,
          relatedId: property.id
        });
        await sendInstantMatchEmail(
          user.email,
          user.firstName,
          "requirement",
          {
            property,
            requirement: newRequirement,
            compatibilityScore,
            matchingCriteria: ["Property Type", "Location", "Price Range"]
            // Simplified for instant notifications
          }
        );
        console.log(`\u2705 Instant notification sent to ${user.firstName} (${user.email})`);
      }
    }
  } catch (error) {
    console.error("\u274C Error checking instant requirement matches:", error);
  }
}

// server/price-trends.ts
init_storage();
var PriceTrendsService = class {
  /**
   * Generate comprehensive price trend data for all neighborhoods
   */
  async generatePriceTrends() {
    try {
      console.log("\u{1F50D} Generating smart price trend data...");
      const properties2 = await storage.getProperties({});
      if (properties2.length === 0) {
        console.log("\u{1F4ED} No properties found for price trend analysis");
        return [];
      }
      const neighborhoodData = this.groupPropertiesByNeighborhood(properties2);
      const trendData = [];
      for (const [neighborhoodKey, properties3] of neighborhoodData.entries()) {
        const [city, state] = neighborhoodKey.split("|");
        const neighborhood = this.extractNeighborhood(city);
        const saleProperties = properties3.filter(
          (p) => p.transactionType === "sell" && p.price && p.price > 0
        );
        const rentProperties = properties3.filter(
          (p) => (p.transactionType === "rent" || p.transactionType === "sell_or_rent") && p.rentPrice && p.rentPrice > 0
        );
        const saleData = this.calculateTrendData(saleProperties, "sale");
        const rentData = this.calculateTrendData(rentProperties, "rent");
        if (saleData.propertyCount > 0 || rentData.propertyCount > 0) {
          trendData.push({
            neighborhood,
            city,
            state,
            saleData,
            rentData,
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      console.log(`\u{1F4CA} Generated price trends for ${trendData.length} neighborhoods`);
      return trendData.sort(
        (a, b) => b.saleData.propertyCount + b.rentData.propertyCount - (a.saleData.propertyCount + a.rentData.propertyCount)
      );
    } catch (error) {
      console.error("\u274C Error generating price trends:", error);
      return [];
    }
  }
  /**
   * Group properties by neighborhood (city + state)
   */
  groupPropertiesByNeighborhood(properties2) {
    const grouped = /* @__PURE__ */ new Map();
    for (const property of properties2) {
      if (!property.city || !property.state) continue;
      const key = `${property.city.trim()}|${property.state.trim()}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(property);
    }
    return grouped;
  }
  /**
   * Extract neighborhood name from city string
   */
  extractNeighborhood(city) {
    const parts = city.split(",");
    return parts[0].trim();
  }
  /**
   * Calculate trend data for a group of properties
   */
  calculateTrendData(properties2, type) {
    if (properties2.length === 0) {
      return {
        averagePrice: 0,
        medianPrice: 0,
        propertyCount: 0,
        pricePerSqft: 0,
        trend: "stable",
        trendPercentage: 0
      };
    }
    const prices = properties2.map((p) => {
      const price = type === "sale" ? Number(p.price) : Number(p.rentPrice);
      const area = Number(p.area) || Number(p.buildSize) || 100;
      return {
        price,
        pricePerSqft: price / area,
        createdAt: new Date(p.createdAt)
      };
    }).filter((p) => p.price > 0);
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        medianPrice: 0,
        propertyCount: 0,
        pricePerSqft: 0,
        trend: "stable",
        trendPercentage: 0
      };
    }
    const sortedPrices = prices.map((p) => p.price).sort((a, b) => a - b);
    const averagePrice = sortedPrices.reduce((sum, price) => sum + price, 0) / sortedPrices.length;
    const medianPrice = this.calculateMedian(sortedPrices);
    const averagePricePerSqft = prices.reduce((sum, p) => sum + p.pricePerSqft, 0) / prices.length;
    const { trend, trendPercentage } = this.calculateTrend(prices);
    return {
      averagePrice: Math.round(averagePrice),
      medianPrice: Math.round(medianPrice),
      propertyCount: properties2.length,
      pricePerSqft: Math.round(averagePricePerSqft),
      trend,
      trendPercentage
    };
  }
  /**
   * Calculate median value
   */
  calculateMedian(sortedValues) {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0 ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 : sortedValues[mid];
  }
  /**
   * Calculate price trend direction and percentage
   */
  calculateTrend(prices) {
    if (prices.length < 4) {
      return { trend: "stable", trendPercentage: 0 };
    }
    const sortedByDate = prices.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const quarterSize = Math.floor(sortedByDate.length / 4);
    const recentPrices = sortedByDate.slice(-quarterSize);
    const olderPrices = sortedByDate.slice(0, quarterSize);
    const recentAvg = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((sum, p) => sum + p.price, 0) / olderPrices.length;
    const changePercentage = (recentAvg - olderAvg) / olderAvg * 100;
    let trend;
    if (Math.abs(changePercentage) < 2) {
      trend = "stable";
    } else if (changePercentage > 0) {
      trend = "up";
    } else {
      trend = "down";
    }
    return {
      trend,
      trendPercentage: Math.round(Math.abs(changePercentage) * 10) / 10
    };
  }
  /**
   * Get price trend data for a specific neighborhood
   */
  async getNeighborhoodTrend(city, state) {
    const allTrends = await this.generatePriceTrends();
    return allTrends.find(
      (trend) => trend.city.toLowerCase() === city.toLowerCase() && trend.state.toLowerCase() === state.toLowerCase()
    ) || null;
  }
  /**
   * Get top performing neighborhoods by price growth
   */
  async getTopPerformingNeighborhoods(limit = 10) {
    const allTrends = await this.generatePriceTrends();
    return allTrends.filter((trend) => trend.saleData.trend === "up" || trend.rentData.trend === "up").sort((a, b) => {
      const aTrend = Math.max(a.saleData.trendPercentage, a.rentData.trendPercentage);
      const bTrend = Math.max(b.saleData.trendPercentage, b.rentData.trendPercentage);
      return bTrend - aTrend;
    }).slice(0, limit);
  }
};
var priceTrendsService = new PriceTrendsService();

// server/routes.ts
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil"
});
var authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
var requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUserById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const user = await storage.createUser({
        ...userData,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });
      const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        try {
          await sendVerificationEmail(user.email, user.firstName, verificationToken);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
        }
      }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        user: { ...user, password: void 0 },
        token,
        message: hasSmtpCredentials ? "Registration successful! Please check your email to verify your account." : "Registration successful! Email verification will be available once SMTP is configured."
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.blacklisted) {
        return res.status(403).json({ message: "Account has been suspended" });
      }
      const requireEmailVerification = false;
      if (requireEmailVerification && !user.isVerified) {
        return res.status(400).json({
          message: "Please verify your email address before logging in. Check your email for the verification link.",
          needsVerification: true
        });
      }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        user: { ...user, password: void 0 },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: void 0 });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Verification token required" });
      }
      const user = await storage.verifyEmail(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        try {
          await sendWelcomeEmail(user.email, user.firstName);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }
      res.json({
        message: "Email verified successfully! You can now log in.",
        verified: true
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });
  app2.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });
      const hasSmtpCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        try {
          await sendVerificationEmail(user.email, user.firstName, verificationToken);
          res.json({ message: "Verification email sent successfully!" });
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          res.status(500).json({ message: "Failed to send verification email" });
        }
      } else {
        res.status(503).json({ message: "Email service not configured" });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification" });
    }
  });
  app2.get("/api/validate-listing", async (req, res) => {
    try {
      const { token, type } = req.query;
      if (!token || !type || type !== "property" && type !== "requirement") {
        return res.status(400).json({ message: "Invalid validation parameters" });
      }
      const result = await validationSystem.validateListing(token, type);
      if (result.success) {
        res.json({ message: result.message, success: true });
      } else {
        res.status(400).json({ message: result.message, success: false });
      }
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ message: "Validation failed" });
    }
  });
  app2.post("/api/reactivate-property", authenticateToken, async (req, res) => {
    try {
      const { propertyId } = req.body;
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID required" });
      }
      const property = await storage.getPropertyById(propertyId);
      if (!property || property.ownerId !== req.user.id) {
        return res.status(404).json({ message: "Property not found or not owned by user" });
      }
      await storage.updateProperty(propertyId, {
        isActive: true,
        lastValidated: /* @__PURE__ */ new Date(),
        validationToken: null,
        validationExpires: null,
        validationResponseReceived: false
      });
      res.json({ message: "Property reactivated successfully" });
    } catch (error) {
      console.error("Reactivation error:", error);
      res.status(500).json({ message: "Failed to reactivate property" });
    }
  });
  app2.post("/api/reactivate-requirement", authenticateToken, async (req, res) => {
    try {
      const { requirementId } = req.body;
      if (!requirementId) {
        return res.status(400).json({ message: "Requirement ID required" });
      }
      const requirement = await storage.getBuyerRequirementById(requirementId);
      if (!requirement || requirement.buyerId !== req.user.id) {
        return res.status(404).json({ message: "Requirement not found or not owned by user" });
      }
      await storage.updateBuyerRequirement(requirementId, {
        isActive: true,
        lastValidated: /* @__PURE__ */ new Date(),
        validationToken: null,
        validationExpires: null,
        validationResponseReceived: false
      });
      res.json({ message: "Requirement reactivated successfully" });
    } catch (error) {
      console.error("Reactivation error:", error);
      res.status(500).json({ message: "Failed to reactivate requirement" });
    }
  });
  app2.post("/api/admin/trigger-validation", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("\u{1F527} Admin manually triggering validation check...");
      await validationSystem.performWeeklyValidationCheck();
      res.json({ message: "Validation check triggered successfully" });
    } catch (error) {
      console.error("Manual validation error:", error);
      res.status(500).json({ message: "Validation trigger failed" });
    }
  });
  app2.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone
      };
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const searchParams = propertySearchSchema.parse(req.query);
      const properties2 = await storage.getProperties(searchParams);
      res.json(properties2);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ message: "Failed to get properties" });
    }
  });
  app2.get("/api/properties/featured", async (req, res) => {
    try {
      const properties2 = await storage.getFeaturedProperties();
      res.json(properties2);
    } catch (error) {
      console.error("Get featured properties error:", error);
      res.status(500).json({ message: "Failed to get featured properties" });
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      const owner = await storage.getUserById(property.ownerId);
      const propertyWithOwner = {
        ...property,
        owner: owner ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
          avatar: owner.avatar
        } : null,
        ownerIsPremium: owner?.subscriptionType === "premium",
        isVerified: property.verificationStatus === "verified"
      };
      res.json(propertyWithOwner);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ message: "Failed to get property" });
    }
  });
  app2.post("/api/properties", authenticateToken, async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.user.id
      });
      const property = await storage.createProperty(propertyData);
      try {
        await checkInstantPropertyMatches(property);
      } catch (error) {
        console.error("Error checking instant property matches:", error);
      }
      res.json(property);
    } catch (error) {
      console.error("Create property error:", error);
      res.status(400).json({ message: "Failed to create property" });
    }
  });
  app2.put("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const existingProperty = await storage.getPropertyById(req.params.id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (existingProperty.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You can only edit your own properties" });
      }
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.user.id
      });
      const updatedProperty = await storage.updateProperty(req.params.id, propertyData);
      res.json(updatedProperty);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(400).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/properties/:id", authenticateToken, async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this property" });
      }
      const deleted = await storage.deleteProperty(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.get("/api/my-properties", authenticateToken, async (req, res) => {
    try {
      const properties2 = await storage.getPropertiesByOwner(req.user.id);
      res.json(properties2);
    } catch (error) {
      console.error("Get my properties error:", error);
      res.status(500).json({ message: "Failed to get your properties" });
    }
  });
  app2.get("/api/admin/verification-documents/:propertyId/:documentType", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { propertyId, documentType } = req.params;
      if (!["chanote", "id"].includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type" });
      }
      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      const documentPath = documentType === "chanote" ? property.chanoteDocumentPath : property.idDocumentPath;
      if (!documentPath) {
        return res.status(404).json({ message: "Document not found" });
      }
      const objectStorageService = new ObjectStorageService();
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(documentPath);
        objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error downloading verification document:", error);
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ message: "Document file not found" });
        }
        return res.status(500).json({ message: "Error downloading document" });
      }
    } catch (error) {
      console.error("Error serving verification document:", error);
      res.status(500).json({ message: "Failed to serve document" });
    }
  });
  app2.get("/api/admin/verifications/pending", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const pendingVerifications = await storage.getPendingVerifications();
      res.json(pendingVerifications);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });
  app2.post("/api/admin/verifications/:propertyId/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { propertyId } = req.params;
      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.verificationStatus !== "pending" && property.verificationStatus !== "requested") {
        return res.status(400).json({ message: "Property is not pending verification" });
      }
      await storage.updateProperty(propertyId, { verificationStatus: "verified" });
      await storage.createNotification({
        userId: property.ownerId,
        type: "verification_approved",
        title: "Property Verification Approved",
        message: `Your ownership verification for "${property.title}" has been approved.`,
        relatedPropertyId: propertyId
      });
      res.json({ message: "Verification approved successfully" });
    } catch (error) {
      console.error("Error approving verification:", error);
      res.status(500).json({ message: "Failed to approve verification" });
    }
  });
  app2.post("/api/admin/verifications/:propertyId/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { reason } = req.body;
      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.verificationStatus !== "pending" && property.verificationStatus !== "requested") {
        return res.status(400).json({ message: "Property is not pending verification" });
      }
      await storage.updateProperty(propertyId, {
        verificationStatus: "rejected",
        verificationNotes: reason || "Documents did not meet verification requirements."
      });
      await storage.createNotification({
        userId: property.ownerId,
        type: "verification_rejected",
        title: "Property Verification Rejected",
        message: `Your ownership verification for "${property.title}" was rejected. Reason: ${reason || "Documents did not meet verification requirements."}`,
        relatedPropertyId: propertyId
      });
      res.json({ message: "Verification rejected successfully" });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      res.status(500).json({ message: "Failed to reject verification" });
    }
  });
  app2.post("/api/properties/:id/verification/upload", authenticateToken, async (req, res) => {
    try {
      const { documentType } = req.body;
      if (!documentType || !["chanote", "id"].includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type. Must be 'chanote' or 'id'" });
      }
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You can only verify your own properties" });
      }
      const user = await storage.getUserById(req.user.id);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({ message: "Verification is only available for premium members" });
      }
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getVerificationDocumentUploadURL(documentType);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Get verification upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });
  app2.post("/api/properties/:id/verification/submit", authenticateToken, async (req, res) => {
    try {
      const { chanoteDocumentURL, idDocumentURL } = req.body;
      if (!chanoteDocumentURL || !idDocumentURL) {
        return res.status(400).json({ message: "Both chanote and ID document URLs are required" });
      }
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (property.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You can only verify your own properties" });
      }
      const user = await storage.getUserById(req.user.id);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({ message: "Verification is only available for premium members" });
      }
      const objectStorageService = new ObjectStorageService();
      const chanoteDocumentPath = objectStorageService.normalizeObjectEntityPath(chanoteDocumentURL);
      const idDocumentPath = objectStorageService.normalizeObjectEntityPath(idDocumentURL);
      const updatedProperty = await storage.requestPropertyVerification(
        req.params.id,
        chanoteDocumentPath,
        idDocumentPath
      );
      try {
        const admins = await storage.getAdminUsers();
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: "verification_request",
            title: "New Ownership Verification Request",
            message: `A new property verification request has been submitted for "${property.title}".`,
            relatedPropertyId: req.params.id
          });
        }
      } catch (notifError) {
        console.error("Error creating admin notifications:", notifError);
      }
      res.json({ message: "Verification request submitted successfully", property: updatedProperty });
    } catch (error) {
      console.error("Submit verification request error:", error);
      res.status(500).json({ message: "Failed to submit verification request" });
    }
  });
  app2.get("/api/admin/verification/pending", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const pendingProperties = await storage.getPropertiesNeedingVerification();
      res.json(pendingProperties);
    } catch (error) {
      console.error("Get pending verifications error:", error);
      res.status(500).json({ message: "Failed to get pending verifications" });
    }
  });
  app2.put("/api/admin/verification/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status, notes } = req.body;
      if (!status || !["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'verified' or 'rejected'" });
      }
      const updatedProperty = await storage.updateVerificationStatus(req.params.id, status, notes);
      if (!updatedProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: `Property verification ${status}`, property: updatedProperty });
    } catch (error) {
      console.error("Update verification status error:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });
  app2.get("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const favorites2 = await storage.getUserFavorites(req.user.id);
      res.json(favorites2);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Failed to get favorites" });
    }
  });
  app2.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const favorite = await storage.addFavorite(favoriteData);
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });
  app2.delete("/api/favorites/:propertyId", authenticateToken, async (req, res) => {
    try {
      const removed = await storage.removeFavorite(req.user.id, req.params.propertyId);
      res.json({ success: removed });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
  app2.get("/api/favorites/:propertyId/check", authenticateToken, async (req, res) => {
    try {
      const isFavorite = await storage.isFavorite(req.user.id, req.params.propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Check favorite error:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });
  app2.post("/api/reports", authenticateToken, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: req.user.id
      });
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(400).json({ message: "Failed to create report" });
    }
  });
  app2.get("/api/buyer-requirements", async (req, res) => {
    try {
      const requirements = await storage.getBuyerRequirements();
      res.json(requirements);
    } catch (error) {
      console.error("Get buyer requirements error:", error);
      res.status(500).json({ message: "Failed to get buyer requirements" });
    }
  });
  app2.get("/api/my-requirements", authenticateToken, async (req, res) => {
    try {
      const requirements = await storage.getBuyerRequirementsByUser(req.user.id);
      res.json(requirements);
    } catch (error) {
      console.error("Get user requirements error:", error);
      res.status(500).json({ message: "Failed to get user requirements" });
    }
  });
  app2.get("/api/buyer-requirements/:id", async (req, res) => {
    try {
      const requirement = await storage.getBuyerRequirementById(req.params.id);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      res.json(requirement);
    } catch (error) {
      console.error("Get buyer requirement error:", error);
      res.status(500).json({ message: "Failed to get buyer requirement" });
    }
  });
  app2.post("/api/buyer-requirements", authenticateToken, async (req, res) => {
    try {
      const cleanedBody = { ...req.body };
      const numericFields = ["minPrice", "maxPrice", "minArea", "maxArea", "minBedrooms", "minBathrooms"];
      numericFields.forEach((field) => {
        if (cleanedBody[field] === "" || cleanedBody[field] === void 0) {
          cleanedBody[field] = null;
        }
      });
      const requirementData = insertBuyerRequirementSchema.parse({
        ...cleanedBody,
        buyerId: req.user.id
      });
      const requirement = await storage.createBuyerRequirement(requirementData);
      try {
        await checkInstantRequirementMatches(requirement);
      } catch (error) {
        console.error("Error checking instant requirement matches:", error);
      }
      res.json(requirement);
    } catch (error) {
      console.error("Create buyer requirement error:", error);
      res.status(400).json({ message: "Failed to create buyer requirement" });
    }
  });
  app2.put("/api/buyer-requirements/:id", authenticateToken, async (req, res) => {
    try {
      const existingRequirement = await storage.getBuyerRequirementById(req.params.id);
      if (!existingRequirement || existingRequirement.buyerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this requirement" });
      }
      const cleanedBody = { ...req.body };
      const numericFields = ["minPrice", "maxPrice", "minArea", "maxArea", "minBedrooms", "minBathrooms"];
      numericFields.forEach((field) => {
        if (cleanedBody[field] === "" || cleanedBody[field] === void 0) {
          cleanedBody[field] = null;
        }
      });
      const updates = insertBuyerRequirementSchema.partial().parse(cleanedBody);
      const requirement = await storage.updateBuyerRequirement(req.params.id, updates);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      res.json(requirement);
    } catch (error) {
      console.error("Update buyer requirement error:", error);
      res.status(400).json({ message: "Failed to update buyer requirement" });
    }
  });
  app2.delete("/api/buyer-requirements/:id", authenticateToken, async (req, res) => {
    try {
      const existingRequirement = await storage.getBuyerRequirementById(req.params.id);
      if (!existingRequirement || existingRequirement.buyerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this requirement" });
      }
      const success = await storage.deleteBuyerRequirement(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      res.json({ message: "Requirement deleted successfully" });
    } catch (error) {
      console.error("Delete buyer requirement error:", error);
      res.status(500).json({ message: "Failed to delete buyer requirement" });
    }
  });
  app2.get("/api/matches/latest", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const requirements = await storage.getBuyerRequirementsByUser(userId);
      const activeRequirements = requirements.filter((req2) => req2.isActive);
      if (activeRequirements.length === 0) {
        return res.json([]);
      }
      const properties2 = await storage.getActiveProperties();
      const matches = matchingService.findMatchesForRequirements(properties2, activeRequirements, 80);
      const uniqueMatches = matches.reduce((acc, match) => {
        const existingMatch = acc.find((m) => m.property.id === match.property.id);
        if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
          acc = acc.filter((m) => m.property.id !== match.property.id);
          acc.push(match);
        }
        return acc;
      }, []);
      res.json(uniqueMatches);
    } catch (error) {
      console.error("Get latest matches error:", error);
      res.status(500).json({ message: "Failed to get latest matches" });
    }
  });
  app2.get("/api/matches/new", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({ message: "Premium subscription required" });
      }
      const requirements = await storage.getBuyerRequirementsByUser(userId);
      const activeRequirements = requirements.filter((req2) => req2.isActive);
      if (activeRequirements.length === 0) {
        return res.json([]);
      }
      const lastViewTime = user.lastNewMatchesView || /* @__PURE__ */ new Date(0);
      const newProperties = await storage.getPropertiesCreatedAfter(lastViewTime);
      const matches = matchingService.findMatchesForRequirements(newProperties, activeRequirements, 80);
      const uniqueMatches = matches.reduce((acc, match) => {
        const existingMatch = acc.find((m) => m.property.id === match.property.id);
        if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
          acc = acc.filter((m) => m.property.id !== match.property.id);
          acc.push(match);
        }
        return acc;
      }, []);
      res.json(uniqueMatches);
    } catch (error) {
      console.error("Get new matches error:", error);
      res.status(500).json({ message: "Failed to get new matches" });
    }
  });
  app2.post("/api/matches/mark-viewed", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      await storage.updateUser(userId, {
        lastNewMatchesView: /* @__PURE__ */ new Date()
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Mark matches viewed error:", error);
      res.status(500).json({ message: "Failed to mark matches as viewed" });
    }
  });
  app2.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      const conversations2 = await storage.getUserConversations(req.user.id);
      res.json(conversations2);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });
  app2.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
      const { recipientId, propertyId, requirementId, initialMessage } = req.body;
      if (!recipientId || !initialMessage) {
        return res.status(400).json({ message: "Recipient and initial message are required" });
      }
      const conversation = await storage.getOrCreateConversation(
        req.user.id,
        recipientId,
        propertyId,
        requirementId
      );
      const message = await storage.createMessage({
        conversationId: conversation.id,
        senderId: req.user.id,
        content: initialMessage,
        isRead: false,
        messageType: "text"
      });
      await storage.createNotification({
        userId: recipientId,
        type: "message",
        title: "New Message",
        content: `You have a new message about ${conversation.subject}`,
        relatedId: conversation.id,
        isRead: false
      });
      res.json({ conversation, message });
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });
  app2.get("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this conversation" });
      }
      const messages2 = await storage.getConversationMessages(req.params.id);
      await storage.markMessagesAsRead(req.params.id, req.user.id);
      res.json(messages2);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  app2.post("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
      }
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const message = await storage.createMessage({
        conversationId: req.params.id,
        senderId: req.user.id,
        content,
        isRead: false,
        messageType: "text"
      });
      const recipientId = conversation.participant1Id === req.user.id ? conversation.participant2Id : conversation.participant1Id;
      await storage.createNotification({
        userId: recipientId,
        type: "message",
        title: "New Message",
        content: `You have a new message about ${conversation.subject}`,
        relatedId: conversation.id,
        isRead: false
      });
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications2 = await storage.getUserNotifications(req.user.id);
      res.json(notifications2);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  app2.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.post("/api/test-validation-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      const { sendTestValidationEmail: sendTestValidationEmail2 } = await Promise.resolve().then(() => (init_test_email(), test_email_exports));
      const success = await sendTestValidationEmail2(email, name);
      if (success) {
        res.json({ message: "Test validation email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });
  app2.delete("/api/notifications/:id", authenticateToken, async (req, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user.id;
      const notification = await storage.getUserNotifications(userId);
      const notificationExists = notification.some((n) => n.id === notificationId);
      if (!notificationExists) {
        return res.status(404).json({ message: "Notification not found" });
      }
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  app2.get("/api/unread-counts", authenticateToken, async (req, res) => {
    try {
      const messageCount = await storage.getUnreadMessageCount(req.user.id);
      const notificationCount = await storage.getUnreadNotificationCount(req.user.id);
      res.json({
        messages: messageCount,
        notifications: notificationCount,
        total: messageCount + notificationCount
      });
    } catch (error) {
      console.error("Get unread counts error:", error);
      res.status(500).json({ message: "Failed to get unread counts" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/objects/upload", authenticateToken, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });
  app2.put("/api/property-images", authenticateToken, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: req.user.id,
          visibility: "public"
          // Property images should be publicly accessible
        }
      );
      res.status(200).json({
        objectPath
      });
    } catch (error) {
      console.error("Error setting property image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/service-providers", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const serviceProviderData = insertServiceProviderSchema.parse(req.body);
      const dataWithUser = {
        ...serviceProviderData,
        userId: req.user.id
      };
      const serviceProvider = await storage.createServiceProvider(dataWithUser);
      res.status(201).json(serviceProvider);
    } catch (error) {
      console.error("Service provider creation error:", error);
      res.status(400).json({ message: "Failed to create service provider" });
    }
  });
  app2.get("/api/service-providers", async (req, res) => {
    try {
      const { category } = req.query;
      const categoryFilter = category && typeof category === "string" ? category : void 0;
      const serviceProviders2 = await storage.getServiceProviders(categoryFilter);
      res.json(serviceProviders2);
    } catch (error) {
      console.error("Service providers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });
  app2.get("/api/service-providers/user", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const serviceProviders2 = await storage.getServiceProvidersByUser(req.user.id);
      res.json(serviceProviders2);
    } catch (error) {
      console.error("User service providers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user service providers" });
    }
  });
  app2.get("/api/service-providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const serviceProvider = await storage.getServiceProviderById(id);
      if (!serviceProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      res.json(serviceProvider);
    } catch (error) {
      console.error("Service provider fetch error:", error);
      res.status(500).json({ message: "Failed to fetch service provider" });
    }
  });
  app2.put("/api/service-providers/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertServiceProviderSchema.partial().parse(req.body);
      const existingProvider = await storage.getServiceProviderById(id);
      if (!existingProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      if (existingProvider.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this service provider" });
      }
      const updatedProvider = await storage.updateServiceProvider(id, updates);
      if (!updatedProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      res.json(updatedProvider);
    } catch (error) {
      console.error("Service provider update error:", error);
      res.status(400).json({ message: "Failed to update service provider" });
    }
  });
  app2.delete("/api/service-providers/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingProvider = await storage.getServiceProviderById(id);
      if (!existingProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      if (existingProvider.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this service provider" });
      }
      const deleted = await storage.deleteServiceProvider(id);
      if (!deleted) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      res.status(200).json({ message: "Service provider deleted successfully" });
    } catch (error) {
      console.error("Service provider deletion error:", error);
      res.status(500).json({ message: "Failed to delete service provider" });
    }
  });
  app2.get("/api/price-trends", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({
          message: "Premium subscription required to access price trends"
        });
      }
      const trends = await priceTrendsService.generatePriceTrends();
      res.json(trends);
    } catch (error) {
      console.error("Get price trends error:", error);
      res.status(500).json({ message: "Failed to get price trends" });
    }
  });
  app2.get("/api/price-trends/neighborhood", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({
          message: "Premium subscription required to access price trends"
        });
      }
      const { city, state } = req.query;
      if (!city || !state) {
        return res.status(400).json({ message: "City and state are required" });
      }
      const trend = await priceTrendsService.getNeighborhoodTrend(
        city,
        state
      );
      if (!trend) {
        return res.status(404).json({ message: "No trend data found for this neighborhood" });
      }
      res.json(trend);
    } catch (error) {
      console.error("Get neighborhood trend error:", error);
      res.status(500).json({ message: "Failed to get neighborhood trend" });
    }
  });
  app2.get("/api/price-trends/top-performing", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({
          message: "Premium subscription required to access price trends"
        });
      }
      const limit = parseInt(req.query.limit) || 10;
      const topNeighborhoods = await priceTrendsService.getTopPerformingNeighborhoods(limit);
      res.json(topNeighborhoods);
    } catch (error) {
      console.error("Get top performing neighborhoods error:", error);
      res.status(500).json({ message: "Failed to get top performing neighborhoods" });
    }
  });
  app2.get("/api/stripe/config", (req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  });
  app2.post("/api/premium/promptpay", authenticateToken, async (req, res) => {
    try {
      const { planId, amount } = req.body;
      const validPlans = { monthly: 299, sixmonths: 999 };
      if (!validPlans[planId] || validPlans[planId] !== amount) {
        return res.status(400).json({ message: "Invalid plan or amount" });
      }
      const paymentId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const qrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      res.json({
        paymentId,
        qrCode,
        amount,
        planId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1e3)
        // 15 minutes
      });
    } catch (error) {
      console.error("PromptPay payment error:", error);
      res.status(500).json({ message: "Failed to generate PromptPay payment" });
    }
  });
  app2.post("/api/premium/create-subscription", authenticateToken, async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user.id;
      const validPlans = { monthly: 299, sixmonths: 999 };
      if (!validPlans[planId]) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const amount = validPlans[planId];
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, {
          stripeCustomerId
        });
      }
      const productName = planId === "monthly" ? "Monthly Premium" : "6-Month Premium";
      const interval = planId === "monthly" ? "month" : "month";
      const intervalCount = planId === "monthly" ? 1 : 6;
      const product = await stripe.products.create({
        name: productName,
        metadata: {
          planId
        }
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount * 100,
        // Convert to cents
        currency: "thb",
        recurring: {
          interval,
          interval_count: intervalCount
        }
      });
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        usage: "off_session"
      });
      res.json({
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
        priceId: price.id,
        planId
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  app2.post("/api/premium/confirm-subscription", authenticateToken, async (req, res) => {
    try {
      const { setupIntentId, priceId, planId } = req.body;
      const userId = req.user.id;
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (setupIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment method setup not completed" });
      }
      const user = await storage.getUserById(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "User or Stripe customer not found" });
      }
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{
          price: priceId
        }],
        default_payment_method: setupIntent.payment_method,
        trial_period_days: 14,
        // 2-week trial
        metadata: {
          userId,
          planId
        }
      });
      const now = /* @__PURE__ */ new Date();
      const trialEndDate = new Date(subscription.trial_end * 1e3);
      const subscriptionEndDate = planId === "monthly" ? new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1e3) : new Date(trialEndDate.getTime() + 180 * 24 * 60 * 60 * 1e3);
      await storage.updateUser(userId, {
        subscriptionType: "premium",
        subscriptionPlan: planId,
        subscriptionStatus: "trial",
        subscriptionStartDate: now,
        subscriptionEndDate,
        trialEndDate,
        paymentMethod: "creditcard",
        nextBillingDate: trialEndDate,
        stripeSubscriptionId: subscription.id
      });
      res.json({
        success: true,
        trialEndDate,
        subscriptionId: subscription.id,
        message: "Free trial activated! You'll be charged automatically after 2 weeks unless you cancel."
      });
    } catch (error) {
      console.error("Confirm subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });
  app2.post("/api/premium/cancel", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      }
      await storage.updateUser(userId, {
        subscriptionStatus: "cancelled",
        subscriptionType: "free",
        subscriptionPlan: null,
        nextBillingDate: null,
        stripeSubscriptionId: null
      });
      res.json({ success: true, message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    validationSystem.startValidationScheduler();
    log("Validation system started");
  });
})();
