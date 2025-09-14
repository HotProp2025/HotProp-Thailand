import {
  users,
  properties,
  favorites,
  reports,
  searches,
  buyerRequirements,
  conversations,
  messages,
  notifications,
  serviceProviders,
  type User,
  type InsertUser,
  type Property,
  type PropertyWithOwnerInfo,
  type InsertProperty,
  type Favorite,
  type InsertFavorite,
  type Report,
  type InsertReport,
  type Search,
  type InsertSearch,
  type BuyerRequirement,
  type InsertBuyerRequirement,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MessageWithSender,
  type Notification,
  type InsertNotification,
  type ServiceProvider,
  type InsertServiceProvider,
  type PropertySearchParams,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, gte, lte, desc, asc, sql, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  deleteAccount(userId: string): Promise<boolean>;
  verifyPassword(email: string, password: string): Promise<User | undefined>;
  verifyEmail(token: string): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;

  // Property operations
  createProperty(property: InsertProperty): Promise<Property>;
  getPropertyById(id: string): Promise<Property | undefined>;
  getProperties(params: PropertySearchParams, userId?: string): Promise<PropertyWithOwnerInfo[]>;
  getPropertiesByOwner(ownerId: string): Promise<Property[]>;
  updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  getFeaturedProperties(): Promise<PropertyWithOwnerInfo[]>;
  markPropertyPremium(id: string, isPremium: boolean): Promise<Property | undefined>;
  getPropertiesNeedingValidation(cutoffDate: Date): Promise<Property[]>;
  getExpiredValidationProperties(currentDate: Date): Promise<Property[]>;
  getPropertyByValidationToken(token: string): Promise<Property | undefined>;
  getActiveProperties(): Promise<Property[]>;
  getPropertiesCreatedAfter(date: Date): Promise<Property[]>;
  getUsers(): Promise<User[]>;
  getUserProperties(userId: string): Promise<Property[]>;

  // Verification operations
  requestPropertyVerification(propertyId: string, chanoteDocumentPath: string, idDocumentPath: string): Promise<Property | undefined>;
  updateVerificationStatus(propertyId: string, status: string, notes?: string): Promise<Property | undefined>;
  getPropertiesNeedingVerification(): Promise<Property[]>;
  getPendingVerifications(): Promise<PropertyWithOwnerInfo[]>;

  // Favorites operations
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, propertyId: string): Promise<boolean>;
  getUserFavorites(userId: string): Promise<Property[]>;
  isFavorite(userId: string, propertyId: string): Promise<boolean>;

  // Reports operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<Report | undefined>;

  // Search operations
  createSearch(search: InsertSearch): Promise<Search>;
  getUserSearches(userId: string): Promise<Search[]>;
  deleteSearch(id: string): Promise<boolean>;

  // Buyer requirements operations
  createBuyerRequirement(requirement: InsertBuyerRequirement): Promise<BuyerRequirement>;
  getBuyerRequirements(params?: PropertySearchParams): Promise<BuyerRequirement[]>;
  getBuyerRequirementsByUser(buyerId: string): Promise<BuyerRequirement[]>;
  getBuyerRequirementById(id: string): Promise<BuyerRequirement | undefined>;
  updateBuyerRequirement(id: string, updates: Partial<BuyerRequirement>): Promise<BuyerRequirement | undefined>;
  deleteBuyerRequirement(id: string): Promise<boolean>;
  getBuyerRequirementsNeedingValidation(cutoffDate: Date): Promise<BuyerRequirement[]>;
  getExpiredValidationRequirements(currentDate: Date): Promise<BuyerRequirement[]>;
  getBuyerRequirementByValidationToken(token: string): Promise<BuyerRequirement | undefined>;

  // Messaging operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getOrCreateConversation(participant1Id: string, participant2Id: string, propertyId?: string, requirementId?: string): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  updateConversationLastMessage(id: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<MessageWithSender[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Service provider operations
  createServiceProvider(serviceProvider: InsertServiceProvider): Promise<ServiceProvider>;
  getServiceProviders(category?: string): Promise<ServiceProvider[]>;
  getServiceProviderById(id: string): Promise<ServiceProvider | undefined>;
  getServiceProvidersByUser(userId: string): Promise<ServiceProvider[]>;
  updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined>;
  deleteServiceProvider(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    try {
      // Start a transaction to ensure all operations succeed or fail together
      
      // 1. Deactivate all user's properties
      await db
        .update(properties)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(properties.ownerId, userId));

      // 2. Deactivate all user's buyer requirements  
      await db
        .update(buyerRequirements)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(buyerRequirements.buyerId, userId));

      // 3. Remove all favorites by this user
      await db
        .delete(favorites)
        .where(eq(favorites.userId, userId));

      // 4. Remove all reports by this user
      await db
        .delete(reports)
        .where(eq(reports.reporterId, userId));

      // 5. Remove all notifications for this user
      await db
        .delete(notifications)
        .where(eq(notifications.userId, userId));

      // 6. Mark user account as deactivated (soft delete) and reset subscription
      await db
        .update(users)
        .set({ 
          blacklisted: true,
          isVerified: false,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          subscriptionType: "free",
          subscriptionPlan: null,
          subscriptionStatus: "active",
          subscriptionStartDate: null,
          subscriptionEndDate: null,
          trialEndDate: null,
          paymentMethod: null,
          lastPaymentDate: null,
          nextBillingDate: null,
          stripeCustomerId: null,
          stripePaymentIntentId: null,
          stripeSubscriptionId: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeCustomerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.emailVerificationToken, token),
        gte(users.emailVerificationExpires, new Date())
      ));
    return user;
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    const user = await this.getUserByVerificationToken(token);
    if (!user) return undefined;

    const [verifiedUser] = await db
      .update(users)
      .set({
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning();

    return verifiedUser;
  }

  async verifyPassword(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.passwordResetToken, token),
        gte(users.passwordResetExpires, new Date())
      ));
    return user;
  }

  async resetPassword(token: string, newPassword: string): Promise<User | undefined> {
    const user = await this.getUserByPasswordResetToken(token);
    if (!user) return undefined;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  // Property operations
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  async getPropertyById(id: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.isActive, true)));
    return property;
  }

  // For reactivation - get property regardless of active status
  async getPropertyByIdForReactivation(id: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }

  async getProperties(params: PropertySearchParams, userId?: string): Promise<PropertyWithOwnerInfo[]> {
    // Get all active properties with owner subscription info
    const propertiesWithOwners = await db
      .select({
        property: properties,
        userSubscriptionType: users.subscriptionType
      })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.isActive, true));

    // Map to include ownerIsPremium flag and verification status
    const allProperties = propertiesWithOwners.map(item => ({
      ...item.property,
      ownerIsPremium: item.userSubscriptionType === 'premium',
      isVerified: item.property.verificationStatus === 'verified'
    }));

    // If no search parameters, return all properties
    if (!params.query && !params.propertyType && !params.transactionType && 
        !params.minPrice && !params.maxPrice && !params.currency && !params.bedrooms && 
        !params.bathrooms && !params.city && !params.state && !params.country) {
      return allProperties.sort((a, b) => {
        // Sort by premium status first, then by creation date
        if (a.ownerIsPremium && !b.ownerIsPremium) return -1;
        if (!a.ownerIsPremium && b.ownerIsPremium) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    }

    // Filter properties based on strict matching criteria first
    let filteredProperties = allProperties;
    
    // Strict property type filter
    if (params.propertyType) {
      filteredProperties = filteredProperties.filter(property => 
        property.propertyType === params.propertyType
      );
    }

    // Strict transaction type filter
    if (params.transactionType) {
      if (params.transactionType === "sell" || params.transactionType === "let") {
        // For "sell" and "let", show matching buyer requirements instead of properties
        return await this.getMatchingBuyerRequirements(params);
      } else {
        filteredProperties = filteredProperties.filter(property => {
          if (params.transactionType === "buy") {
            // For "buy", show properties available for sale (includes "sell" and "sell_or_rent")
            return property.transactionType === "sale" || 
                   property.transactionType === "sell" || 
                   property.transactionType === "both" ||
                   property.transactionType === "sell_or_rent";
          } else if (params.transactionType === "rent") {
            // For "rent", show properties available for rent (includes "rent" and "sell_or_rent")
            return property.transactionType === "rent" || 
                   property.transactionType === "both" ||
                   property.transactionType === "sell_or_rent";
          }
          return false;
        });
      }
    }

    // Currency conversion helper
    const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency) return price;
      const USD_TO_THB_RATE = 35; // Reference rate: 1 USD = 35 THB
      
      if (fromCurrency === "USD" && toCurrency === "THB") {
        return price * USD_TO_THB_RATE;
      } else if (fromCurrency === "THB" && toCurrency === "USD") {
        return price / USD_TO_THB_RATE;
      }
      return price;
    };

    // Strict price filter
    if (params.minPrice || params.maxPrice) {
      filteredProperties = filteredProperties.filter(property => {
        const searchCurrency = params.currency || "USD";
        
        // Check sale price
        const salePrice = parseFloat(property.price || "0");
        const convertedSalePrice = convertPrice(salePrice, property.currency || "USD", searchCurrency);
        
        let salePriceInRange = true;
        if (params.minPrice && convertedSalePrice < params.minPrice) salePriceInRange = false;
        if (params.maxPrice && convertedSalePrice > params.maxPrice) salePriceInRange = false;
        
        // For both transaction type properties, check the relevant price based on search type
        if (property.transactionType === "both" && property.rentPrice) {
          const rentPrice = parseFloat(property.rentPrice);
          const convertedRentPrice = convertPrice(rentPrice, property.rentCurrency || "USD", searchCurrency);
          
          let rentPriceInRange = true;
          if (params.minPrice && convertedRentPrice < params.minPrice) rentPriceInRange = false;
          if (params.maxPrice && convertedRentPrice > params.maxPrice) rentPriceInRange = false;
          
          // For "both" properties, either price range can match depending on transaction type
          if (params.transactionType === "buy") {
            return salePriceInRange;
          } else if (params.transactionType === "rent") {
            return rentPriceInRange;
          } else {
            // If no specific transaction type, either price range can match
            return salePriceInRange || rentPriceInRange;
          }
        }
        
        return salePriceInRange;
      });
    }

    // Strict bedrooms filter
    if (params.bedrooms) {
      filteredProperties = filteredProperties.filter(property => 
        property.bedrooms && property.bedrooms >= params.bedrooms!
      );
    }

    // Strict bathrooms filter
    if (params.bathrooms) {
      filteredProperties = filteredProperties.filter(property => 
        property.bathrooms && property.bathrooms >= params.bathrooms!
      );
    }

    // Location filters
    if (params.city) {
      filteredProperties = filteredProperties.filter(property =>
        property.city?.toLowerCase().includes(params.city!.toLowerCase())
      );
    }

    if (params.state) {
      filteredProperties = filteredProperties.filter(property =>
        property.state?.toLowerCase().includes(params.state!.toLowerCase())
      );
    }

    if (params.country) {
      filteredProperties = filteredProperties.filter(property =>
        property.country?.toLowerCase().includes(params.country!.toLowerCase())
      );
    }

    // Score remaining properties for relevance ranking
    const scoredProperties = filteredProperties.map(property => {
      let score = 0;

      // Text search scoring (only for ranking, not filtering)
      if (params.query) {
        const queryLower = params.query.toLowerCase();
        if (property.title?.toLowerCase().includes(queryLower)) score += 10;
        if (property.description?.toLowerCase().includes(queryLower)) score += 5;
        if (property.address?.toLowerCase().includes(queryLower)) score += 3;
        if (property.city?.toLowerCase().includes(queryLower)) score += 2;
      }

      // Premium properties get higher scores
      if (property.ownerIsPremium) score += 5;

      return {
        property,
        score
      };
    });

    // Text search filter (only if query provided)
    if (params.query) {
      filteredProperties = filteredProperties.filter(property => {
        const queryLower = params.query!.toLowerCase();
        return property.title?.toLowerCase().includes(queryLower) ||
               property.description?.toLowerCase().includes(queryLower) ||
               property.address?.toLowerCase().includes(queryLower) ||
               property.city?.toLowerCase().includes(queryLower) ||
               property.state?.toLowerCase().includes(queryLower) ||
               property.country?.toLowerCase().includes(queryLower);
      });
    }

    // Sort by relevance score and other factors
    const sortedProperties = scoredProperties.sort((a, b) => {
      // First sort by premium status
      if (a.property.ownerIsPremium && !b.property.ownerIsPremium) return -1;
      if (!a.property.ownerIsPremium && b.property.ownerIsPremium) return 1;
      
      // Then by relevance score
      if (b.score !== a.score) return b.score - a.score;
      
      // Finally by creation date
      return new Date(b.property.createdAt || 0).getTime() - new Date(a.property.createdAt || 0).getTime();
    });

    return sortedProperties.map(item => item.property);
  }

  // Helper method to get matching buyer requirements for sellers
  private async getMatchingBuyerRequirements(params: PropertySearchParams): Promise<any[]> {
    // Get all active buyer requirements with buyer subscription info
    const requirementsWithBuyers = await db
      .select({
        requirement: buyerRequirements,
        userSubscriptionType: users.subscriptionType
      })
      .from(buyerRequirements)
      .leftJoin(users, eq(buyerRequirements.buyerId, users.id))
      .where(eq(buyerRequirements.isActive, true));

    // Calculate match scores for each requirement
    const scoredRequirements = requirementsWithBuyers.map(item => {
      const requirement = item.requirement;
      let totalCriteria = 0;
      let matchedCriteria = 0;

      // Property type matching (required)
      if (params.propertyType) {
        totalCriteria++;
        if (requirement.propertyType === params.propertyType) {
          matchedCriteria++;
        }
      }

      // Transaction type matching
      totalCriteria++;
      if ((params.transactionType === "sell" && requirement.transactionType === "buy") ||
          (params.transactionType === "let" && requirement.transactionType === "rent")) {
        matchedCriteria++;
      }

      // Price matching
      if (params.minPrice || params.maxPrice) {
        totalCriteria++;
        const sellPrice = params.minPrice || params.maxPrice || 0;
        const currency = params.currency || "USD";
        
        // Convert prices for comparison
        const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
          if (fromCurrency === toCurrency) return price;
          const USD_TO_THB_RATE = 35;
          if (fromCurrency === "USD" && toCurrency === "THB") return price * USD_TO_THB_RATE;
          if (fromCurrency === "THB" && toCurrency === "USD") return price / USD_TO_THB_RATE;
          return price;
        };

        const reqMinPrice = requirement.minPrice ? parseFloat(requirement.minPrice) : 0;
        const reqMaxPrice = requirement.maxPrice ? parseFloat(requirement.maxPrice) : Infinity;
        const reqCurrency = requirement.currency || "USD";
        
        const convertedReqMin = convertPrice(reqMinPrice, reqCurrency, currency);
        const convertedReqMax = convertPrice(reqMaxPrice, reqCurrency, currency);
        
        // Check if seller's price falls within buyer's budget
        if (sellPrice >= convertedReqMin && sellPrice <= convertedReqMax) {
          matchedCriteria++;
        }
      }

      // Location matching
      if (params.city || params.state || params.country) {
        totalCriteria++;
        let locationMatch = false;
        
        if (params.city && requirement.city && 
            requirement.city.toLowerCase().includes(params.city.toLowerCase())) {
          locationMatch = true;
        }
        if (params.state && requirement.state &&
            requirement.state.toLowerCase().includes(params.state.toLowerCase())) {
          locationMatch = true;
        }
        if (params.country && requirement.country &&
            requirement.country.toLowerCase().includes(params.country.toLowerCase())) {
          locationMatch = true;
        }
        
        if (locationMatch) {
          matchedCriteria++;
        }
      }

      // Bedrooms matching
      if (params.bedrooms) {
        totalCriteria++;
        if (!requirement.minBedrooms || params.bedrooms >= requirement.minBedrooms) {
          matchedCriteria++;
        }
      }

      // Bathrooms matching
      if (params.bathrooms) {
        totalCriteria++;
        if (!requirement.minBathrooms || params.bathrooms >= requirement.minBathrooms) {
          matchedCriteria++;
        }
      }

      // Calculate match percentage
      const matchPercentage = totalCriteria > 0 ? (matchedCriteria / totalCriteria) * 100 : 0;

      return {
        requirement: {
          ...requirement,
          buyerIsPremium: item.userSubscriptionType === 'premium',
          matchPercentage: Math.round(matchPercentage)
        },
        matchPercentage
      };
    });

    // Filter requirements with 80%+ match
    const filteredRequirements = scoredRequirements.filter(item => item.matchPercentage >= 80);

    // Sort by premium status first, then by match percentage, then by creation date
    const sortedRequirements = filteredRequirements.sort((a, b) => {
      // Premium buyers first
      if (a.requirement.buyerIsPremium && !b.requirement.buyerIsPremium) return -1;
      if (!a.requirement.buyerIsPremium && b.requirement.buyerIsPremium) return 1;
      
      // Then by match percentage (higher first)
      if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
      
      // Finally by creation date (newer first)
      return new Date(b.requirement.createdAt || 0).getTime() - new Date(a.requirement.createdAt || 0).getTime();
    });

    return sortedRequirements.map(item => item.requirement);
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(and(eq(properties.ownerId, ownerId), eq(properties.isActive, true)))
      .orderBy(desc(properties.createdAt));
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const [property] = await db
      .update(properties)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return !!property;
  }

  async getFeaturedProperties(): Promise<PropertyWithOwnerInfo[]> {
    // Get featured properties and their owners' subscription info
    const propertiesWithOwners = await db
      .select({
        property: properties,
        userSubscriptionType: users.subscriptionType
      })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(eq(properties.isActive, true))
      .limit(20); // Get more initially to sort and then limit to 10

    // Sort by premium status first, then by creation date
    const sortedProperties = propertiesWithOwners
      .sort((a, b) => {
        // Premium properties first (either isPremium flag or premium owner)
        const aIsPremium = a.property.isPremium || a.userSubscriptionType === 'premium';
        const bIsPremium = b.property.isPremium || b.userSubscriptionType === 'premium';
        
        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        
        // Then by creation date (newest first)
        return new Date(b.property.createdAt || 0).getTime() - new Date(a.property.createdAt || 0).getTime();
      })
      .slice(0, 10) // Take top 10 after sorting
      .map(item => ({
        ...item.property,
        ownerIsPremium: item.userSubscriptionType === 'premium',
        isVerified: item.property.verificationStatus === 'verified'
      }));

    return sortedProperties;
  }

  async markPropertyPremium(id: string, isPremium: boolean): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({ isPremium, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async getPropertiesNeedingValidation(cutoffDate: Date): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(and(
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

  async getExpiredValidationProperties(currentDate: Date): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.isActive, true),
        lte(properties.validationExpires, currentDate),
        eq(properties.validationResponseReceived, false)
      ));
  }

  async getPropertyByValidationToken(token: string): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.validationToken, token));
    return property;
  }

  async getActiveProperties(): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.isActive, true))
      .orderBy(desc(properties.createdAt));
  }

  async getPropertiesCreatedAfter(date: Date): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.isActive, true),
        gte(properties.createdAt, date)
      ))
      .orderBy(desc(properties.createdAt));
  }

  async getUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users);
  }

  async getUserProperties(userId: string): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, userId));
  }

  // Favorites operations
  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values(insertFavorite)
      .returning();
    return favorite;
  }

  async removeFavorite(userId: string, propertyId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return (result.rowCount || 0) > 0;
  }

  async getUserFavorites(userId: string): Promise<Property[]> {
    const results = await db
      .select()
      .from(properties)
      .innerJoin(favorites, eq(favorites.propertyId, properties.id))
      .where(and(eq(favorites.userId, userId), eq(properties.isActive, true)))
      .orderBy(desc(favorites.createdAt));
    
    return results.map(result => result.properties);
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return !!favorite;
  }

  // Reports operations
  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const [report] = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  // Search operations
  async createSearch(insertSearch: InsertSearch): Promise<Search> {
    const [search] = await db
      .insert(searches)
      .values(insertSearch)
      .returning();
    return search;
  }

  async getUserSearches(userId: string): Promise<Search[]> {
    return await db
      .select()
      .from(searches)
      .where(eq(searches.userId, userId))
      .orderBy(desc(searches.createdAt));
  }

  async deleteSearch(id: string): Promise<boolean> {
    const result = await db
      .delete(searches)
      .where(eq(searches.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Buyer requirements operations
  async createBuyerRequirement(insertBuyerRequirement: InsertBuyerRequirement): Promise<BuyerRequirement> {
    const [requirement] = await db
      .insert(buyerRequirements)
      .values(insertBuyerRequirement)
      .returning();
    return requirement;
  }

  async getBuyerRequirements(params?: PropertySearchParams): Promise<BuyerRequirement[]> {
    // Get all buyer requirements and their owners' subscription info  
    const requirements = await db
      .select({
        requirement: buyerRequirements,
        userSubscriptionType: users.subscriptionType
      })
      .from(buyerRequirements)
      .leftJoin(users, eq(buyerRequirements.buyerId, users.id))
      .where(eq(buyerRequirements.isActive, true));

    let filteredRequirements = requirements.map(item => item.requirement);

    // Apply search filters if provided
    if (params) {
      // Filter by query (search in title and description)
      if (params.query) {
        const searchTerm = params.query.toLowerCase();
        filteredRequirements = filteredRequirements.filter(req => 
          req.title?.toLowerCase().includes(searchTerm) ||
          req.description?.toLowerCase().includes(searchTerm) ||
          req.city?.toLowerCase().includes(searchTerm) ||
          req.state?.toLowerCase().includes(searchTerm) ||
          req.country?.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by property type
      if (params.propertyType) {
        filteredRequirements = filteredRequirements.filter(req => 
          req.propertyType === params.propertyType
        );
      }

      // Filter by transaction type
      if (params.transactionType) {
        filteredRequirements = filteredRequirements.filter(req => {
          // Map search transaction types to requirement transaction types
          if (params.transactionType === "buy") {
            return req.transactionType === "buy" || req.transactionType === "buy_or_rent";
          } else if (params.transactionType === "rent") {
            return req.transactionType === "rent" || req.transactionType === "buy_or_rent";
          }
          // For "sell" and "let", we might want to show opposite requirements
          // (someone selling would want to see buy requirements, someone letting would want to see rent requirements)
          else if (params.transactionType === "sell") {
            return req.transactionType === "buy" || req.transactionType === "buy_or_rent";
          } else if (params.transactionType === "let") {
            return req.transactionType === "rent" || req.transactionType === "buy_or_rent";
          }
          return true;
        });
      }

      // Filter by location
      if (params.city) {
        filteredRequirements = filteredRequirements.filter(req => 
          req.city?.toLowerCase().includes(params.city!.toLowerCase())
        );
      }
      if (params.state) {
        filteredRequirements = filteredRequirements.filter(req => 
          req.state?.toLowerCase().includes(params.state!.toLowerCase())
        );
      }
      if (params.country) {
        filteredRequirements = filteredRequirements.filter(req => 
          req.country?.toLowerCase().includes(params.country!.toLowerCase())
        );
      }
    }

    // Sort by premium status first, then by creation date
    const requirementsWithUserType = filteredRequirements.map(req => {
      const userType = requirements.find(r => r.requirement.id === req.id)?.userSubscriptionType;
      return { requirement: req, userSubscriptionType: userType };
    });

    return requirementsWithUserType
      .sort((a, b) => {
        // Premium members first
        if (a.userSubscriptionType === 'premium' && b.userSubscriptionType !== 'premium') return -1;
        if (a.userSubscriptionType !== 'premium' && b.userSubscriptionType === 'premium') return 1;
        
        // Then by creation date (newest first)
        return new Date(b.requirement.createdAt || 0).getTime() - new Date(a.requirement.createdAt || 0).getTime();
      })
      .map(item => item.requirement);
  }

  async getBuyerRequirementsByUser(buyerId: string): Promise<BuyerRequirement[]> {
    return await db
      .select()
      .from(buyerRequirements)
      .where(and(eq(buyerRequirements.buyerId, buyerId), eq(buyerRequirements.isActive, true)))
      .orderBy(desc(buyerRequirements.createdAt));
  }

  async getBuyerRequirementById(id: string): Promise<BuyerRequirement | undefined> {
    const [requirement] = await db
      .select()
      .from(buyerRequirements)
      .where(and(eq(buyerRequirements.id, id), eq(buyerRequirements.isActive, true)));
    return requirement;
  }

  // For reactivation - get requirement regardless of active status
  async getBuyerRequirementByIdForReactivation(id: string): Promise<BuyerRequirement | undefined> {
    const [requirement] = await db
      .select()
      .from(buyerRequirements)
      .where(eq(buyerRequirements.id, id));
    return requirement;
  }

  async updateBuyerRequirement(id: string, updates: Partial<BuyerRequirement>): Promise<BuyerRequirement | undefined> {
    const [requirement] = await db
      .update(buyerRequirements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(buyerRequirements.id, id))
      .returning();
    return requirement;
  }

  async deleteBuyerRequirement(id: string): Promise<boolean> {
    const [requirement] = await db
      .update(buyerRequirements)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(buyerRequirements.id, id))
      .returning();
    return !!requirement;
  }

  async getBuyerRequirementsNeedingValidation(cutoffDate: Date): Promise<BuyerRequirement[]> {
    return await db
      .select()
      .from(buyerRequirements)
      .where(and(
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

  async getExpiredValidationRequirements(currentDate: Date): Promise<BuyerRequirement[]> {
    return await db
      .select()
      .from(buyerRequirements)
      .where(and(
        eq(buyerRequirements.isActive, true),
        lte(buyerRequirements.validationExpires, currentDate),
        eq(buyerRequirements.validationResponseReceived, false)
      ));
  }

  async getBuyerRequirementByValidationToken(token: string): Promise<BuyerRequirement | undefined> {
    const [requirement] = await db
      .select()
      .from(buyerRequirements)
      .where(eq(buyerRequirements.validationToken, token));
    return requirement;
  }

  // Messaging operations
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string, propertyId?: string, requirementId?: string): Promise<Conversation> {
    // Check if conversation already exists
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          or(
            and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
            and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
          ),
          propertyId ? eq(conversations.propertyId, propertyId) : sql`${conversations.propertyId} IS NULL`,
          requirementId ? eq(conversations.requirementId, requirementId) : sql`${conversations.requirementId} IS NULL`,
          eq(conversations.isActive, true)
        )
      );

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
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
      isActive: true,
    });
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        and(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          ),
          eq(conversations.isActive, true)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.isActive, true)));
    return conversation;
  }

  async updateConversationLastMessage(id: string): Promise<void> {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id));
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    
    // Update conversation's last message timestamp
    await this.updateConversationLastMessage(insertMessage.conversationId);
    
    return message;
  }

  async getConversationMessages(conversationId: string): Promise<MessageWithSender[]> {
    return await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        contentEn: messages.contentEn,
        contentTh: messages.contentTh,
        isRead: messages.isRead,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        senderName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        senderEmail: users.email,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        )
      );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const userConversations = await this.getUserConversations(userId);
    const conversationIds = userConversations.map(c => c.id);
    
    if (conversationIds.length === 0) return 0;

    const unreadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.isRead, false));

    return unreadMessages.filter(msg => 
      conversationIds.includes(msg.conversationId) && msg.senderId !== userId
    ).length;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return result.length;
  }

  // Service provider operations
  async createServiceProvider(insertServiceProvider: InsertServiceProvider): Promise<ServiceProvider> {
    const [serviceProvider] = await db
      .insert(serviceProviders)
      .values(insertServiceProvider)
      .returning();
    return serviceProvider;
  }

  async getServiceProviders(category?: string): Promise<ServiceProvider[]> {
    if (category) {
      return await db
        .select()
        .from(serviceProviders)
        .where(
          and(
            eq(serviceProviders.isActive, true),
            eq(serviceProviders.category, category)
          )
        )
        .orderBy(desc(serviceProviders.createdAt));
    }

    return await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.isActive, true))
      .orderBy(desc(serviceProviders.createdAt));
  }

  async getServiceProviderById(id: string): Promise<ServiceProvider | undefined> {
    const [serviceProvider] = await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.id, id));
    return serviceProvider;
  }

  async getServiceProvidersByUser(userId: string): Promise<ServiceProvider[]> {
    return await db
      .select()
      .from(serviceProviders)
      .where(eq(serviceProviders.userId, userId))
      .orderBy(desc(serviceProviders.createdAt));
  }

  async updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const [serviceProvider] = await db
      .update(serviceProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceProviders.id, id))
      .returning();
    return serviceProvider;
  }

  async deleteServiceProvider(id: string): Promise<boolean> {
    const result = await db
      .delete(serviceProviders)
      .where(eq(serviceProviders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Verification operations
  async requestPropertyVerification(propertyId: string, chanoteDocumentPath: string, idDocumentPath: string): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({
        verificationStatus: "requested",
        chanoteDocumentPath,
        idDocumentPath,
        verificationRequestedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(properties.id, propertyId))
      .returning();
    return property;
  }

  async updateVerificationStatus(propertyId: string, status: string, notes?: string): Promise<Property | undefined> {
    const updates: Partial<Property> = {
      verificationStatus: status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updates.verificationNotes = notes;
    }
    
    if (status === "verified") {
      updates.verifiedAt = new Date();
    }

    const [property] = await db
      .update(properties)
      .set(updates)
      .where(eq(properties.id, propertyId))
      .returning();
    return property;
  }

  async getPropertiesNeedingVerification(): Promise<Property[]> {
    return await db
      .select()
      .from(properties)
      .where(eq(properties.verificationStatus, "requested"))
      .orderBy(asc(properties.verificationRequestedAt));
  }

  async getPendingVerifications(): Promise<PropertyWithOwnerInfo[]> {
    const pendingProperties = await db
      .select({
        property: properties,
        owner: users
      })
      .from(properties)
      .leftJoin(users, eq(properties.ownerId, users.id))
      .where(or(
        eq(properties.verificationStatus, "requested"),
        eq(properties.verificationStatus, "pending")
      ))
      .orderBy(desc(properties.verificationRequestedAt));

    return pendingProperties.map(({ property, owner }) => ({
      ...property,
      ownerIsPremium: owner?.subscriptionType === 'premium',
      isVerified: property.verificationStatus === 'verified'
    }));
  }

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));
  }
}

export const storage = new DatabaseStorage();
