import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import {
  insertUserSchema,
  insertPropertySchema,
  insertFavoriteSchema,
  insertReportSchema,
  insertBuyerRequirementSchema,
  insertServiceProviderSchema,
  loginSchema,
  propertySearchSchema,
  type PropertySearchParams,
  type Property,
  type User,
  type BuyerRequirement,
  type ServiceProvider,
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from "./email";
import { validationSystem } from "./validation-system";
import { matchingService } from "./matching-service";
import { checkInstantPropertyMatches, checkInstantRequirementMatches } from "./instant-notifications";
import { priceTrendsService } from "./price-trends";
import { translationService } from "./translation-service";
import { getNotificationContent } from "./notification-translations";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Auth middleware
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists (exclude blacklisted/deleted users)
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser && !existingUser.blacklisted) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      let user;
      if (existingUser && existingUser.blacklisted) {
        // Reactivate and update existing blacklisted user
        user = await storage.updateUser(existingUser.id, {
          ...userData,
          blacklisted: false,
          isVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date()
        });
      } else {
        // Create new user with verification token
        user = await storage.createUser({
          ...userData,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires
        });
      }

      if (!user) {
        return res.status(500).json({ message: "Failed to create user account" });
      }

      // Send verification email (only if SMTP credentials are available)
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        try {
          await sendVerificationEmail(user.email, user.firstName, verificationToken);
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // Continue with registration even if email fails
        }
      }

      // Only provide token if email verification is not required
      if (hasSmtpCredentials) {
        // Email verification is required - don't provide token yet
        res.json({
          user: { ...user, password: undefined },
          needsVerification: true,
          message: "Registration successful! Please check your email to verify your account before logging in.",
          messageTH: "ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ"
        });
      } else {
        // No SMTP configured - allow immediate login
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
          user: { ...user, password: undefined },
          token,
          message: "Registration successful! Email verification will be available once SMTP is configured."
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.blacklisted) {
        return res.status(403).json({ message: "Account has been suspended" });
      }

      // Email verification is now required to reduce fraud
      const requireEmailVerification = true;
      
      if (requireEmailVerification && !user.isVerified) {
        return res.status(400).json({ 
          message: "Please verify your email address before logging in. Check your email for the verification link.",
          messageTH: "กรุณายืนยันที่อยู่อีเมลของคุณก่อนเข้าสู่ระบบ ตรวจสอบอีเมลของคุณสำหรับลิงก์ยืนยัน",
          needsVerification: true
        });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Email verification routes
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token required" });
      }

      const user = await storage.verifyEmail(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Send welcome email
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        try {
          await sendWelcomeEmail(user.email, user.firstName);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Continue even if welcome email fails
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

  app.post("/api/auth/resend-verification", async (req, res) => {
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

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      // Send verification email
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
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

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with this email exists, you will receive a password reset email." });
      }

      // Generate password reset token
      const resetToken = generateVerificationToken(); // Reuse the same token generator
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });

      // Send password reset email
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        try {
          await sendPasswordResetEmail(user.email, user.firstName, resetToken);
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          // Continue and don't reveal error to prevent email enumeration
        }
      }

      res.json({ message: "If an account with this email exists, you will receive a password reset email." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.resetPassword(token, password);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      res.json({ message: "Password reset successfully! You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Validation routes
  app.get("/api/validate-listing", async (req, res) => {
    try {
      const { token, type } = req.query;
      
      if (!token || !type || (type !== 'property' && type !== 'requirement')) {
        return res.status(400).json({ message: "Invalid validation parameters" });
      }

      const result = await validationSystem.validateListing(token as string, type as 'property' | 'requirement');
      
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


  // Manual reactivation routes
  app.post("/api/reactivate-property", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID required" });
      }

      // Get property without active filter for reactivation
      const property = await storage.getPropertyByIdForReactivation(propertyId);
      if (!property || property.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "Property not found or not owned by user" });
      }

      await storage.updateProperty(propertyId, {
        isActive: true,
        lastValidated: new Date(),
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

  app.post("/api/reactivate-requirement", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { requirementId } = req.body;
      
      if (!requirementId) {
        return res.status(400).json({ message: "Requirement ID required" });
      }

      // Get requirement without active filter for reactivation
      const requirement = await storage.getBuyerRequirementByIdForReactivation(requirementId);
      if (!requirement || requirement.buyerId !== req.user!.id) {
        return res.status(404).json({ message: "Requirement not found or not owned by user" });
      }

      await storage.updateBuyerRequirement(requirementId, {
        isActive: true,
        lastValidated: new Date(),
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

  // Admin: Manual trigger for validation check (for testing)
  app.post("/api/admin/trigger-validation", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      console.log('🔧 Admin manually triggering validation check...');
      await validationSystem.performWeeklyValidationCheck();
      res.json({ message: "Validation check triggered successfully" });
    } catch (error) {
      console.error("Manual validation error:", error);
      res.status(500).json({ message: "Validation trigger failed" });
    }
  });

  // Update profile route
  app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
      };
      
      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete("/api/auth/delete-account", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteAccount(req.user!.id);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to delete account",
          messageTH: "ไม่สามารถลบบัญชีได้"
        });
      }

      res.json({ 
        message: "Account deleted successfully",
        messageTH: "ลบบัญชีเรียบร้อยแล้ว"
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ 
        message: "Failed to delete account",
        messageTH: "ไม่สามารถลบบัญชีได้"
      });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const searchParams = propertySearchSchema.parse(req.query);
      const properties = await storage.getProperties(searchParams);
      res.json(properties);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ message: "Failed to get properties" });
    }
  });

  app.get("/api/properties/featured", async (req, res) => {
    try {
      const properties = await storage.getFeaturedProperties();
      res.json(properties);
    } catch (error) {
      console.error("Get featured properties error:", error);
      res.status(500).json({ message: "Failed to get featured properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get owner information to include with property
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
        ownerIsPremium: owner?.subscriptionType === 'premium',
        isVerified: property.verificationStatus === 'verified'
      };
      
      res.json(propertyWithOwner);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ message: "Failed to get property" });
    }
  });

  app.post("/api/properties", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check premium restriction for multiple listings
      const user = await storage.getUserById(req.user!.id);
      if (user?.subscriptionType !== "premium") {
        const existingProperties = await storage.getPropertiesByOwner(req.user!.id);
        if (existingProperties.length >= 1) {
          return res.status(403).json({ 
            message: "Sorry, as a standard member, you are only eligible to post one property and one requirement. If you want to post more, please sign up for a Premium Membership.",
            code: "PREMIUM_REQUIRED",
            upgradeUrl: "/premium"
          });
        }
      }

      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.user!.id,
      });
      
      // Generate translations for title and description
      const translations = await translationService.translateProperty(
        propertyData.title,
        propertyData.description || undefined
      );
      
      // Merge original data with translations
      const propertyWithTranslations = {
        ...propertyData,
        ...translations,
      };
      
      const property = await storage.createProperty(propertyWithTranslations);
      
      // Check for instant matches for Premium users
      console.log('🚦 Triggering instant notifications for new property:', property.id, property.title);
      try {
        await checkInstantPropertyMatches(property);
        console.log('✅ Instant property match check completed');
      } catch (error) {
        console.error('❌ Error checking instant property matches:', error);
        // Don't fail the property creation if instant notifications fail
      }
      
      res.json(property);
    } catch (error) {
      console.error("Create property error:", error);
      res.status(400).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user owns the property
      const existingProperty = await storage.getPropertyById(req.params.id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (existingProperty.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "You can only edit your own properties" });
      }
      
      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.user!.id,
      });
      
      // Generate translations for title and description if they changed
      let propertyWithTranslations = propertyData;
      if (propertyData.title !== existingProperty.title || 
          propertyData.description !== existingProperty.description) {
        const translations = await translationService.translateProperty(
          propertyData.title,
          propertyData.description || undefined
        );
        propertyWithTranslations = {
          ...propertyData,
          ...translations,
        };
      }
      
      const updatedProperty = await storage.updateProperty(req.params.id, propertyWithTranslations);
      
      // Check for instant matches for Premium users after update
      console.log('🚦 Triggering instant notifications for updated property:', updatedProperty?.id, updatedProperty?.title);
      try {
        if (updatedProperty) {
          await checkInstantPropertyMatches(updatedProperty);
          console.log('✅ Instant property match check completed for update');
        }
      } catch (error) {
        console.error('❌ Error checking instant property matches for update:', error);
        // Don't fail the property update if instant notifications fail
      }
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(400).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this property" });
      }

      const deleted = await storage.deleteProperty(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  app.get("/api/my-properties", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const properties = await storage.getPropertiesByOwner(req.user!.id);
      res.json(properties);
    } catch (error) {
      console.error("Get my properties error:", error);
      res.status(500).json({ message: "Failed to get your properties" });
    }
  });

  // Admin route to view verification documents
  app.get("/api/admin/verification-documents/:propertyId/:documentType", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { propertyId, documentType } = req.params;
      
      if (!['chanote', 'id'].includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const documentPath = documentType === 'chanote' ? property.chanoteDocumentPath : property.idDocumentPath;
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

  // Admin verification management routes
  app.get("/api/admin/verifications/pending", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingVerifications = await storage.getPendingVerifications();
      res.json(pendingVerifications);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      res.status(500).json({ message: "Failed to fetch pending verifications" });
    }
  });

  app.post("/api/admin/verifications/:propertyId/approve", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { propertyId } = req.params;
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.verificationStatus !== 'pending' && property.verificationStatus !== 'requested') {
        return res.status(400).json({ message: "Property is not pending verification" });
      }

      await storage.updateProperty(propertyId, { verificationStatus: 'verified' });
      
      // Get user's language preference and add notification for property owner
      const owner = await storage.getUserById(property.ownerId);
      const userLanguage = owner?.preferredLanguage === 'th' ? 'th' : 'en';
      
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'verification_approved',
        propertyTitle: property.title
      });
      
      await storage.createNotification({
        userId: property.ownerId,
        type: 'verification_approved',
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: propertyId,
      });

      res.json({ message: "Verification approved successfully" });
    } catch (error) {
      console.error("Error approving verification:", error);
      res.status(500).json({ message: "Failed to approve verification" });
    }
  });

  app.post("/api/admin/verifications/:propertyId/reject", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { propertyId } = req.params;
      const { reason } = req.body;
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.verificationStatus !== 'pending' && property.verificationStatus !== 'requested') {
        return res.status(400).json({ message: "Property is not pending verification" });
      }

      await storage.updateProperty(propertyId, { 
        verificationStatus: 'rejected',
        verificationNotes: reason || 'Documents did not meet verification requirements.'
      });
      
      // Get user's language preference and add notification for property owner
      const owner = await storage.getUserById(property.ownerId);
      const userLanguage = owner?.preferredLanguage === 'th' ? 'th' : 'en';
      
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'verification_rejected',
        propertyTitle: property.title,
        reason: reason
      });
      
      await storage.createNotification({
        userId: property.ownerId,
        type: 'verification_rejected',
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: propertyId,
      });

      res.json({ message: "Verification rejected successfully" });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      res.status(500).json({ message: "Failed to reject verification" });
    }
  });

  // Property verification routes
  app.post("/api/properties/:id/verification/upload", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { documentType } = req.body; // 'chanote' or 'id'
      
      if (!documentType || !['chanote', 'id'].includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type. Must be 'chanote' or 'id'" });
      }

      // Check if user owns the property
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "You can only verify your own properties" });
      }

      // Check if user is premium
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.subscriptionType !== 'premium') {
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

  app.post("/api/properties/:id/verification/submit", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { chanoteDocumentURL, idDocumentURL } = req.body;
      
      if (!chanoteDocumentURL || !idDocumentURL) {
        return res.status(400).json({ message: "Both chanote and ID document URLs are required" });
      }

      // Check if user owns the property
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      if (property.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "You can only verify your own properties" });
      }

      // Check if user is premium
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.subscriptionType !== 'premium') {
        return res.status(403).json({ message: "Verification is only available for premium members" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Normalize the document URLs to get proper paths
      const chanoteDocumentPath = objectStorageService.normalizeObjectEntityPath(chanoteDocumentURL);
      const idDocumentPath = objectStorageService.normalizeObjectEntityPath(idDocumentURL);

      // Submit verification request
      const updatedProperty = await storage.requestPropertyVerification(
        req.params.id,
        chanoteDocumentPath,
        idDocumentPath
      );

      // Notify all admins about new verification request
      try {
        const admins = await storage.getAdminUsers();
        for (const admin of admins) {
          const userLanguage = admin.preferredLanguage === 'th' ? 'th' : 'en';
          
          const notificationContent = getNotificationContent(userLanguage, {
            type: 'verification_request',
            propertyTitle: property.title
          });
          
          await storage.createNotification({
            userId: admin.id,
            type: 'verification_request',
            title: notificationContent.title,
            content: notificationContent.content,
            relatedId: req.params.id,
          });
        }
      } catch (notifError) {
        console.error("Error creating admin notifications:", notifError);
        // Don't fail the request if notification fails
      }
      
      res.json({ message: "Verification request submitted successfully", property: updatedProperty });
    } catch (error) {
      console.error("Submit verification request error:", error);
      res.status(500).json({ message: "Failed to submit verification request" });
    }
  });

  // Admin verification routes
  app.get("/api/admin/verification/pending", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingProperties = await storage.getPropertiesNeedingVerification();
      res.json(pendingProperties);
    } catch (error) {
      console.error("Get pending verifications error:", error);
      res.status(500).json({ message: "Failed to get pending verifications" });
    }
  });

  app.put("/api/admin/verification/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { status, notes } = req.body; // status: 'verified' or 'rejected'
      
      if (!status || !['verified', 'rejected'].includes(status)) {
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

  // Favorites routes
  app.get("/api/favorites", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Failed to get favorites" });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const favorite = await storage.addFavorite(favoriteData);
      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:propertyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const removed = await storage.removeFavorite(req.user!.id, req.params.propertyId);
      res.json({ success: removed });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/:propertyId/check", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isFavorite = await storage.isFavorite(req.user!.id, req.params.propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Check favorite error:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Reports routes
  app.post("/api/reports", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: req.user!.id,
      });
      
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(400).json({ message: "Failed to create report" });
    }
  });

  // Buyer requirements routes
  app.get("/api/buyer-requirements", async (req, res) => {
    try {
      const searchParams = propertySearchSchema.parse(req.query);
      const requirements = await storage.getBuyerRequirements(searchParams);
      res.json(requirements);
    } catch (error) {
      console.error("Get buyer requirements error:", error);
      res.status(500).json({ message: "Failed to get buyer requirements" });
    }
  });

  app.get("/api/my-requirements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requirements = await storage.getBuyerRequirementsByUser(req.user!.id);
      res.json(requirements);
    } catch (error) {
      console.error("Get user requirements error:", error);
      res.status(500).json({ message: "Failed to get user requirements" });
    }
  });

  app.get("/api/buyer-requirements/:id", async (req, res) => {
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

  app.post("/api/buyer-requirements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check premium restriction for multiple listings
      const user = await storage.getUserById(req.user!.id);
      if (user?.subscriptionType !== "premium") {
        const existingRequirements = await storage.getBuyerRequirementsByUser(req.user!.id);
        if (existingRequirements.length >= 1) {
          return res.status(403).json({ 
            message: "Sorry, as a standard member, you are only eligible to post one property and one requirement. If you want to post more, please sign up for a Premium Membership.",
            code: "PREMIUM_REQUIRED",
            upgradeUrl: "/premium"
          });
        }
      }

      // Clean up empty string values for numeric fields before parsing
      const cleanedBody = { ...req.body };
      const numericFields = [
        'minPrice', 'maxPrice', 
        'minPurchasePrice', 'maxPurchasePrice', 'minRentPrice', 'maxRentPrice', // New dual price fields
        'minArea', 'maxArea', 'minBedrooms', 'minBathrooms'
      ];
      numericFields.forEach(field => {
        if (cleanedBody[field] === "" || cleanedBody[field] === undefined) {
          cleanedBody[field] = null;
        }
      });

      const requirementData = insertBuyerRequirementSchema.parse({
        ...cleanedBody,
        buyerId: req.user!.id,
      });
      
      // Generate translations for title and description
      const translations = await translationService.translateProperty(
        requirementData.title,
        requirementData.description || undefined
      );
      
      // Merge original data with translations
      const requirementWithTranslations = {
        ...requirementData,
        ...translations,
      };
      
      const requirement = await storage.createBuyerRequirement(requirementWithTranslations);
      
      // Check for instant matches for Premium users
      console.log('🚦 Triggering instant notifications for new requirement:', requirement.id, requirement.title);
      try {
        await checkInstantRequirementMatches(requirement);
        console.log('✅ Instant requirement match check completed');
      } catch (error) {
        console.error('❌ Error checking instant requirement matches:', error);
        // Don't fail the requirement creation if instant notifications fail
      }
      
      res.json(requirement);
    } catch (error) {
      console.error("Create buyer requirement error:", error);
      console.error("Request body was:", JSON.stringify(req.body, null, 2));
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(400).json({ 
        message: "Failed to create buyer requirement",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/buyer-requirements/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user owns this requirement
      const existingRequirement = await storage.getBuyerRequirementById(req.params.id);
      if (!existingRequirement || existingRequirement.buyerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this requirement" });
      }

      // Clean up empty string values for numeric fields before parsing
      const cleanedBody = { ...req.body };
      const numericFields = ['minPrice', 'maxPrice', 'minArea', 'maxArea', 'minBedrooms', 'minBathrooms'];
      numericFields.forEach(field => {
        if (cleanedBody[field] === "" || cleanedBody[field] === undefined) {
          cleanedBody[field] = null;
        }
      });

      const updates = insertBuyerRequirementSchema.partial().parse(cleanedBody);
      
      // Generate translations if title or description changed
      let updatesWithTranslations = updates;
      if (updates.title !== undefined || updates.description !== undefined) {
        const titleToTranslate = updates.title || existingRequirement.title;
        const descriptionToTranslate = updates.description !== undefined ? updates.description : existingRequirement.description;
        
        const translations = await translationService.translateProperty(
          titleToTranslate,
          descriptionToTranslate || undefined
        );
        
        updatesWithTranslations = {
          ...updates,
          ...translations,
        };
      }
      
      const requirement = await storage.updateBuyerRequirement(req.params.id, updatesWithTranslations);
      
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }
      
      // Check for instant matches for Premium users after update
      console.log('🚦 Triggering instant notifications for updated requirement:', requirement.id, requirement.title);
      try {
        await checkInstantRequirementMatches(requirement);
        console.log('✅ Instant requirement match check completed for update');
      } catch (error) {
        console.error('❌ Error checking instant requirement matches for update:', error);
        // Don't fail the requirement update if instant notifications fail
      }
      
      res.json(requirement);
    } catch (error) {
      console.error("Update buyer requirement error:", error);
      res.status(400).json({ message: "Failed to update buyer requirement" });
    }
  });

  app.delete("/api/buyer-requirements/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user owns this requirement
      const existingRequirement = await storage.getBuyerRequirementById(req.params.id);
      if (!existingRequirement || existingRequirement.buyerId !== req.user!.id) {
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

  // Matching routes
  app.get("/api/matches/latest", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user's active buyer requirements
      const requirements = await storage.getBuyerRequirementsByUser(userId);
      const activeRequirements = requirements.filter(req => req.isActive);
      
      if (activeRequirements.length === 0) {
        return res.json([]);
      }
      
      // Get all active properties
      const properties = await storage.getActiveProperties();
      
      // Find matches with at least 80% compatibility
      const matches = matchingService.findMatchesForRequirements(properties, activeRequirements, 80);
      
      // Group matches by property to avoid duplicates
      const uniqueMatches = matches.reduce((acc, match) => {
        const existingMatch = acc.find(m => m.property.id === match.property.id);
        if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
          acc = acc.filter(m => m.property.id !== match.property.id);
          acc.push(match);
        }
        return acc;
      }, [] as typeof matches);
      
      res.json(uniqueMatches);
    } catch (error) {
      console.error("Get latest matches error:", error);
      res.status(500).json({ message: "Failed to get latest matches" });
    }
  });

  app.get("/api/matches/new", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get user to check subscription and last view time
      const user = await storage.getUserById(userId);
      if (!user || user.subscriptionType !== "premium") {
        return res.status(403).json({ message: "Premium subscription required" });
      }
      
      // Get user's active buyer requirements
      const requirements = await storage.getBuyerRequirementsByUser(userId);
      const activeRequirements = requirements.filter(req => req.isActive);
      
      if (activeRequirements.length === 0) {
        return res.json([]);
      }
      
      // Get properties created since last view (or all if never viewed)
      const lastViewTime = user.lastNewMatchesView || new Date(0);
      const newProperties = await storage.getPropertiesCreatedAfter(lastViewTime);
      
      // Find matches with at least 80% compatibility
      const matches = matchingService.findMatchesForRequirements(newProperties, activeRequirements, 80);
      
      // Group matches by property to avoid duplicates
      const uniqueMatches = matches.reduce((acc, match) => {
        const existingMatch = acc.find(m => m.property.id === match.property.id);
        if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
          acc = acc.filter(m => m.property.id !== match.property.id);
          acc.push(match);
        }
        return acc;
      }, [] as typeof matches);
      
      res.json(uniqueMatches);
    } catch (error) {
      console.error("Get new matches error:", error);
      res.status(500).json({ message: "Failed to get new matches" });
    }
  });

  app.post("/api/matches/mark-viewed", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Update user's last new matches view timestamp
      await storage.updateUser(userId, {
        lastNewMatchesView: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark matches viewed error:", error);
      res.status(500).json({ message: "Failed to mark matches as viewed" });
    }
  });

  // Messaging routes
  app.get("/api/conversations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.post("/api/conversations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { recipientId, propertyId, requirementId, initialMessage } = req.body;
      
      if (!recipientId || !initialMessage) {
        return res.status(400).json({ message: "Recipient and initial message are required" });
      }

      // Get or create conversation
      const conversation = await storage.getOrCreateConversation(
        req.user!.id,
        recipientId,
        propertyId,
        requirementId
      );

      // Translate the initial message
      const messageTranslation = await translationService.translateText(initialMessage);
      
      // Create the initial message
      const message = await storage.createMessage({
        conversationId: conversation.id,
        senderId: req.user!.id,
        content: initialMessage,
        contentEn: messageTranslation.englishText,
        contentTh: messageTranslation.thaiText,
        isRead: false,
        messageType: "text",
      });

      // Get recipient's language preference and create notification
      const recipient = await storage.getUserById(recipientId);
      const userLanguage = recipient?.preferredLanguage === 'th' ? 'th' : 'en';
      
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'message',
        subject: conversation.subject || 'Property inquiry'
      });
      
      await storage.createNotification({
        userId: recipientId,
        type: "message",
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: conversation.id,
        isRead: false,
      });

      res.json({ conversation, message });
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if user is part of conversation
      if (conversation.participant1Id !== req.user!.id && conversation.participant2Id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this conversation" });
      }

      const messages = await storage.getConversationMessages(req.params.id);
      
      // Mark messages as read for current user
      await storage.markMessagesAsRead(req.params.id, req.user!.id);

      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversation = await storage.getConversationById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if user is part of conversation
      if (conversation.participant1Id !== req.user!.id && conversation.participant2Id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Translate the message content
      const messageTranslation = await translationService.translateText(content);
      
      const message = await storage.createMessage({
        conversationId: req.params.id,
        senderId: req.user!.id,
        content,
        contentEn: messageTranslation.englishText,
        contentTh: messageTranslation.thaiText,
        isRead: false,
        messageType: "text",
      });

      // Get recipient ID
      const recipientId = conversation.participant1Id === req.user!.id 
        ? conversation.participant2Id 
        : conversation.participant1Id;

      // Get recipient's language preference and create notification
      const recipient = await storage.getUserById(recipientId);
      const userLanguage = recipient?.preferredLanguage === 'th' ? 'th' : 'en';
      
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'message',
        subject: conversation.subject || 'Property inquiry'
      });
      
      await storage.createNotification({
        userId: recipientId,
        type: "message",
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: conversation.id,
        isRead: false,
      });

      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Notification routes
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Test email endpoint
  app.post("/api/test-validation-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }

      const { sendTestValidationEmail } = await import('./test-email');
      const success = await sendTestValidationEmail(email, name);
      
      if (success) {
        res.json({ message: "Test validation email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/read-all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user!.id;
      
      // Verify the notification belongs to the user (security check)
      const notification = await storage.getUserNotifications(userId);
      const notificationExists = notification.some(n => n.id === notificationId);
      
      if (!notificationExists) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Delete the notification
      const deleted = await storage.deleteNotification(notificationId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found or already deleted" });
      }
      
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.get("/api/unread-counts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const messageCount = await storage.getUnreadMessageCount(req.user!.id);
      const notificationCount = await storage.getUnreadNotificationCount(req.user!.id);
      
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

  // Object storage routes for property images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: "Object storage service unavailable" });
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: "Object storage service unavailable" });
      }
      return res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/property-images", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: req.user!.id,
          visibility: "public", // Property images should be publicly accessible
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting property image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Service Provider routes (Admin-only endpoints)
  app.post("/api/service-providers", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Admin check could be added here if needed
      const serviceProviderData = insertServiceProviderSchema.parse(req.body);
      
      // For admin-created providers, use the admin's user ID
      const dataWithUser = {
        ...serviceProviderData,
        userId: req.user!.id,
      };
      
      const serviceProvider = await storage.createServiceProvider(dataWithUser);
      res.status(201).json(serviceProvider);
    } catch (error) {
      console.error("Service provider creation error:", error);
      res.status(400).json({ message: "Failed to create service provider" });
    }
  });

  app.get("/api/service-providers", async (req, res) => {
    try {
      const { category } = req.query;
      const categoryFilter = category && typeof category === "string" ? category : undefined;
      
      const serviceProviders = await storage.getServiceProviders(categoryFilter);
      res.json(serviceProviders);
    } catch (error) {
      console.error("Service providers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });

  app.get("/api/service-providers/user", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const serviceProviders = await storage.getServiceProvidersByUser(req.user!.id);
      res.json(serviceProviders);
    } catch (error) {
      console.error("User service providers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user service providers" });
    }
  });

  app.get("/api/service-providers/:id", async (req, res) => {
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

  app.put("/api/service-providers/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertServiceProviderSchema.partial().parse(req.body);
      
      // Check if the service provider belongs to the authenticated user
      const existingProvider = await storage.getServiceProviderById(id);
      if (!existingProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      
      if (existingProvider.userId !== req.user!.id) {
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

  app.delete("/api/service-providers/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Check if the service provider belongs to the authenticated user
      const existingProvider = await storage.getServiceProviderById(id);
      if (!existingProvider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      
      if (existingProvider.userId !== req.user!.id) {
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

  // Premium Price Trends endpoints (Premium members only)
  app.get("/api/price-trends", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user is Premium
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.subscriptionType !== 'premium') {
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

  app.get("/api/price-trends/neighborhood", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user is Premium
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.subscriptionType !== 'premium') {
        return res.status(403).json({ 
          message: "Premium subscription required to access price trends" 
        });
      }

      const { city, state } = req.query;
      if (!city || !state) {
        return res.status(400).json({ message: "City and state are required" });
      }

      const trend = await priceTrendsService.getNeighborhoodTrend(
        city as string, 
        state as string
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

  app.get("/api/price-trends/top-performing", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if user is Premium
      const user = await storage.getUserById(req.user!.id);
      if (!user || user.subscriptionType !== 'premium') {
        return res.status(403).json({ 
          message: "Premium subscription required to access price trends" 
        });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const topNeighborhoods = await priceTrendsService.getTopPerformingNeighborhoods(limit);
      res.json(topNeighborhoods);
    } catch (error) {
      console.error("Get top performing neighborhoods error:", error);
      res.status(500).json({ message: "Failed to get top performing neighborhoods" });
    }
  });

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", (req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  });

  // Premium subscription with PromptPay via Stripe
  app.post("/api/premium/promptpay", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId, amount } = req.body;
      const userId = req.user!.id;
      
      // Validate plan
      const validPlans = { monthly: 299, sixmonths: 999 };
      if (!validPlans[planId as keyof typeof validPlans] || validPlans[planId as keyof typeof validPlans] !== amount) {
        return res.status(400).json({ message: "Invalid plan or amount" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: userId
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateStripeCustomerId(userId, stripeCustomerId);
      }

      // Create PaymentIntent with PromptPay
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'thb',
        customer: stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          planId: planId,
          userId: userId
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        planId
      });
    } catch (error) {
      console.error("PromptPay payment error:", error);
      res.status(500).json({ message: "Failed to create PromptPay payment" });
    }
  });

  // Create Stripe subscription with trial period
  app.post("/api/premium/create-subscription", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user!.id;
      
      // Validate plan
      const validPlans = { monthly: 299, sixmonths: 999 };
      if (!validPlans[planId as keyof typeof validPlans]) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const amount = validPlans[planId as keyof typeof validPlans];
      
      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: userId
          }
        });
        stripeCustomerId = customer.id;
        
        // Save stripe customer ID to user
        await storage.updateUser(userId, {
          stripeCustomerId: stripeCustomerId
        });
      }

      // Create or retrieve Stripe product and price for this plan
      const productName = planId === 'monthly' ? 'Monthly Premium' : '6-Month Premium';
      const interval = planId === 'monthly' ? 'month' : 'month';
      const intervalCount = planId === 'monthly' ? 1 : 6;

      // Create product
      const product = await stripe.products.create({
        name: productName,
        metadata: {
          planId: planId
        }
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount * 100, // Convert to cents
        currency: 'thb',
        recurring: {
          interval: interval,
          interval_count: intervalCount
        }
      });

      // Create setup intent for collecting payment method
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      res.json({
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
        priceId: price.id,
        planId: planId
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Confirm payment method and create subscription with trial
  app.post("/api/premium/confirm-subscription", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { setupIntentId, priceId, planId } = req.body;
      const userId = req.user!.id;
      
      // Retrieve setup intent from Stripe to verify it succeeded
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment method setup not completed" });
      }

      const user = await storage.getUserById(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "User or Stripe customer not found" });
      }

      // Create subscription with 2-week trial
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{
          price: priceId,
        }],
        default_payment_method: setupIntent.payment_method as string,
        trial_period_days: 14, // 2-week trial
        metadata: {
          userId: userId,
          planId: planId
        }
      });

      const now = new Date();
      const trialEndDate = new Date(subscription.trial_end! * 1000); // Convert from Unix timestamp
      const subscriptionEndDate = planId === 'monthly' 
        ? new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 1 month after trial
        : new Date(trialEndDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months after trial

      // Update user subscription
      await storage.updateUser(userId, {
        subscriptionType: 'premium',
        subscriptionPlan: planId,
        subscriptionStatus: 'trial',
        subscriptionStartDate: now,
        subscriptionEndDate: subscriptionEndDate,
        trialEndDate: trialEndDate,
        paymentMethod: 'creditcard',
        nextBillingDate: trialEndDate,
        stripeSubscriptionId: subscription.id
      });

      res.json({
        success: true,
        trialEndDate: trialEndDate,
        subscriptionId: subscription.id,
        message: "Free trial activated! You'll be charged automatically after 2 weeks unless you cancel."
      });
    } catch (error) {
      console.error("Confirm subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post("/api/premium/cancel", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Cancel Stripe subscription if it exists
      if (user.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      }
      
      await storage.updateUser(userId, {
        subscriptionStatus: 'cancelled',
        subscriptionType: 'free',
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

  // Debug endpoint to check webhook configuration
  app.get("/api/stripe/webhook-debug", async (req, res) => {
    res.json({
      webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
      secretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });
  });

  // Test endpoint to manually trigger user upgrade (for debugging webhook issues)
  app.post("/api/stripe/test-upgrade", async (req, res) => {
    try {
      const { userId, planId } = req.body;
      
      if (!userId || !planId) {
        return res.status(400).json({ error: 'Missing userId or planId' });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate subscription dates based on plan
      const now = new Date();
      const subscriptionStartDate = now;
      let subscriptionEndDate: Date;
      
      if (planId === 'monthly') {
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else if (planId === 'sixmonths') {
        subscriptionEndDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
      } else {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      // Update user to premium
      const updateData = {
        subscriptionType: 'premium',
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: subscriptionEndDate,
        paymentMethod: 'promptpay',
        lastPaymentDate: now,
        nextBillingDate: subscriptionEndDate,
        stripePaymentIntentId: 'test_manual_upgrade'
      };
      
      await storage.updateUser(userId, updateData);

      console.log(`✅ Manually upgraded user ${userId} to premium (${planId} plan)`);
      res.json({ 
        success: true, 
        message: 'User upgraded successfully',
        userId, 
        planId,
        subscriptionEndDate
      });
    } catch (error) {
      console.error('❌ Error in manual upgrade:', error);
      res.status(500).json({ error: 'Failed to upgrade user' });
    }
  });

  // Stripe webhook handler for payment success
  app.post("/api/stripe/webhook", async (req, res) => {
    console.log('🔔 Webhook received at:', new Date().toISOString());
    console.log('Headers:', req.headers);
    
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      console.log('✅ Webhook signature verified successfully');
      console.log('📧 Event type:', event.type);
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment_intent.succeeded for PromptPay payments
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('💰 Processing payment_intent.succeeded:', paymentIntent.id);
      console.log('📋 Payment Intent metadata:', paymentIntent.metadata);
      
      try {
        const userId = paymentIntent.metadata.userId;
        const planId = paymentIntent.metadata.planId;
        
        console.log('🔍 Extracted from metadata - userId:', userId, 'planId:', planId);
        
        if (!userId || !planId) {
          console.error('❌ Missing userId or planId in payment intent metadata:', {
            userId,
            planId,
            fullMetadata: paymentIntent.metadata
          });
          return res.status(400).json({ error: 'Missing metadata' });
        }

        const user = await storage.getUserById(userId);
        if (!user) {
          console.error(`User not found: ${userId}`);
          return res.status(404).json({ error: 'User not found' });
        }

        // Calculate subscription dates based on plan
        const now = new Date();
        const subscriptionStartDate = now;
        let subscriptionEndDate: Date;
        
        if (planId === 'monthly') {
          subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        } else if (planId === 'sixmonths') {
          subscriptionEndDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
        } else {
          console.error(`Invalid plan ID: ${planId}`);
          return res.status(400).json({ error: 'Invalid plan' });
        }

        console.log('📅 Subscription dates calculated:', {
          start: subscriptionStartDate,
          end: subscriptionEndDate,
          plan: planId
        });

        // Update user to premium
        const updateData = {
          subscriptionType: 'premium',
          subscriptionStatus: 'active',
          subscriptionPlan: planId,
          subscriptionStartDate: subscriptionStartDate,
          subscriptionEndDate: subscriptionEndDate,
          paymentMethod: 'promptpay',
          lastPaymentDate: now,
          nextBillingDate: subscriptionEndDate,
          stripePaymentIntentId: paymentIntent.id
        };
        
        console.log('🔄 Updating user with data:', updateData);
        await storage.updateUser(userId, updateData);

        console.log(`✅ Successfully upgraded user ${userId} to premium (${planId} plan)`);
        res.json({ received: true, upgraded: true, userId, planId });
      } catch (error) {
        console.error('❌ Error processing payment success webhook:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ error: 'Failed to process payment' });
      }
    } else {
      // For other event types, just acknowledge receipt
      res.json({ received: true });
    }
  });

  // Admin endpoint to check specific customer payments
  app.get("/api/stripe/check-customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      
      // Get all payment intents for this customer
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 20
      });

      const successfulPayments = paymentIntents.data.filter(pi => pi.status === 'succeeded');
      
      res.json({ 
        customerId,
        totalPayments: paymentIntents.data.length,
        successfulPayments: successfulPayments.length,
        payments: successfulPayments.map(pi => ({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: new Date(pi.created * 1000),
          metadata: pi.metadata
        }))
      });
    } catch (error) {
      console.error("Check customer payments error:", error);
      res.status(500).json({ message: "Failed to check payments" });
    }
  });

  // Admin endpoint to manually upgrade user
  app.post("/api/stripe/manual-upgrade/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { planId = 'monthly' } = req.body;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate subscription dates
      const now = new Date();
      let subscriptionEndDate: Date;
      
      if (planId === 'monthly') {
        subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else if (planId === 'sixmonths') {
        subscriptionEndDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      } else {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Update user to premium
      const updatedUser = await storage.updateUser(userId, {
        subscriptionType: 'premium',
        subscriptionStatus: 'active',
        subscriptionPlan: planId,
        subscriptionStartDate: now,
        subscriptionEndDate: subscriptionEndDate,
        paymentMethod: 'promptpay',
        lastPaymentDate: now,
        nextBillingDate: subscriptionEndDate,
        stripePaymentIntentId: 'manual_upgrade_' + Date.now()
      });

      console.log(`Manually upgraded user ${userId} to premium (${planId})`);
      
      res.json({ 
        message: "User successfully upgraded to premium",
        user: updatedUser
      });
    } catch (error) {
      console.error("Manual upgrade error:", error);
      res.status(500).json({ message: "Failed to upgrade user" });
    }
  });

  // Manual payment processing endpoint (for missed webhook events)
  app.post("/api/stripe/process-payments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer ID found" });
      }

      // Get all payment intents for this customer
      const paymentIntents = await stripe.paymentIntents.list({
        customer: user.stripeCustomerId,
        limit: 10
      });

      const successfulPayments = paymentIntents.data.filter(pi => 
        pi.status === 'succeeded' && 
        pi.metadata.userId === userId &&
        pi.metadata.planId
      );

      if (successfulPayments.length === 0) {
        return res.json({ message: "No successful payments found", processed: 0 });
      }

      let processed = 0;
      
      for (const paymentIntent of successfulPayments) {
        // Check if already processed
        if (user.stripePaymentIntentId === paymentIntent.id) {
          continue;
        }

        const planId = paymentIntent.metadata.planId;
        
        // Calculate subscription dates
        const now = new Date();
        let subscriptionEndDate: Date;
        
        if (planId === 'monthly') {
          subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (planId === 'sixmonths') {
          subscriptionEndDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        } else {
          continue;
        }

        // Update user to premium
        await storage.updateUser(userId, {
          subscriptionType: 'premium',
          subscriptionStatus: 'active',
          subscriptionPlan: planId,
          subscriptionStartDate: now,
          subscriptionEndDate: subscriptionEndDate,
          paymentMethod: 'promptpay',
          lastPaymentDate: new Date(paymentIntent.created * 1000),
          nextBillingDate: subscriptionEndDate,
          stripePaymentIntentId: paymentIntent.id
        });

        processed++;
        console.log(`Manually processed payment ${paymentIntent.id} for user ${userId}`);
        break; // Only process the most recent successful payment
      }

      res.json({ 
        message: `Successfully processed ${processed} payment(s)`,
        processed,
        successfulPayments: successfulPayments.length
      });
    } catch (error) {
      console.error("Manual payment processing error:", error);
      res.status(500).json({ message: "Failed to process payments" });
    }
  });

  // API endpoint to get matches for modal display
  app.get("/api/matches/:matchType/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { matchType, userId } = req.params;
      const requestingUserId = req.user!.id;

      // Security check - users can only view their own matches
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (matchType === 'property') {
        // Get property matches for users with requirements
        const userRequirements = await storage.getBuyerRequirements();
        const activeRequirements = userRequirements.filter(req => req.buyerId === userId && req.isActive);
        
        if (activeRequirements.length === 0) {
          return res.json([]);
        }

        const allProperties = await storage.getActiveProperties();
        const matches = matchingService.findMatchesForRequirements(allProperties, activeRequirements, 80);
        
        // Format matches for frontend
        const formattedMatches = matches.slice(0, 5).map(match => ({
          id: match.property.id,
          title: match.property.title,
          propertyType: match.property.propertyType,
          transactionType: match.property.transactionType,
          price: match.property.price,
          rentPrice: match.property.rentPrice,
          currency: match.property.currency,
          address: match.property.address,
          city: match.property.city,
          country: match.property.country,
          bedrooms: match.property.bedrooms,
          bathrooms: match.property.bathrooms,
          area: match.property.area,
          areaUnit: match.property.areaUnit,
          images: match.property.images,
          compatibilityScore: match.compatibilityScore,
          matchingCriteria: matchingService.getMatchingCriteria(match.property, match.requirement),
          ownerId: match.property.ownerId
        }));

        res.json(formattedMatches);

      } else if (matchType === 'requirement') {
        // Get requirement matches for users with properties
        const userProperties = await storage.getUserProperties(userId);
        const activeProperties = userProperties.filter(prop => prop.isActive);
        
        if (activeProperties.length === 0) {
          return res.json([]);
        }

        const allRequirements = await storage.getBuyerRequirements();
        const activeRequirements = allRequirements.filter(req => req.isActive && req.buyerId !== userId);
        
        const requirementMatches: any[] = [];
        for (const property of activeProperties) {
          const matches = matchingService.findMatchesForProperty(property, activeRequirements, 80);
          requirementMatches.push(...matches);
        }

        // Format requirement matches for frontend (show as properties would appear)
        const formattedMatches = requirementMatches.slice(0, 5).map(match => {
          // Get the buyer's name for display
          return storage.getUserById(match.requirement.buyerId).then(buyer => ({
            id: match.requirement.id,
            title: match.requirement.title,
            propertyType: match.requirement.propertyType,
            transactionType: match.requirement.transactionType,
            price: match.requirement.maxPrice || 0,
            currency: match.requirement.currency,
            address: `${match.requirement.city || ''}, ${match.requirement.country || ''}`,
            city: match.requirement.city,
            country: match.requirement.country,
            bedrooms: match.requirement.minBedrooms,
            bathrooms: match.requirement.minBathrooms,
            area: match.requirement.maxArea,
            areaUnit: match.requirement.areaUnit,
            images: [], // Requirements don't have images
            compatibilityScore: match.compatibilityScore,
            matchingCriteria: matchingService.getMatchingCriteria(match.property, match.requirement),
            ownerId: match.requirement.buyerId,
            ownerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : 'Unknown'
          }));
        });

        const resolvedMatches = await Promise.all(formattedMatches);
        res.json(resolvedMatches);

      } else {
        res.status(400).json({ message: "Invalid match type" });
      }

    } catch (error) {
      console.error("Get matches error:", error);
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  // API endpoint to get validation items for modal display
  app.get("/api/validation-items/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user!.id;

      // Security check - users can only view their own validation items
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validationItems = [];

      // Get user's properties needing validation
      const userProperties = await storage.getUserProperties(userId);
      for (const property of userProperties) {
        // Check if property needs validation or is deactivated
        const needsValidation = property.validationExpires || !property.isActive;
        if (needsValidation) {
          validationItems.push({
            id: property.id,
            title: property.title,
            type: 'property',
            isActive: property.isActive,
            lastValidated: property.lastValidated,
            validationExpires: property.validationExpires,
            needsValidation: !!property.validationExpires || !property.isActive
          });
        }
      }

      // Get user's requirements needing validation
      const userRequirements = await storage.getBuyerRequirements();
      const filteredRequirements = userRequirements.filter(req => req.buyerId === userId);
      for (const requirement of filteredRequirements) {
        // Check if requirement needs validation or is deactivated
        const needsValidation = requirement.validationExpires || !requirement.isActive;
        if (needsValidation) {
          validationItems.push({
            id: requirement.id,
            title: requirement.title,
            type: 'requirement',
            isActive: requirement.isActive,
            lastValidated: requirement.lastValidated,
            validationExpires: requirement.validationExpires,
            needsValidation: !!requirement.validationExpires || !requirement.isActive
          });
        }
      }

      res.json(validationItems);

    } catch (error) {
      console.error("Get validation items error:", error);
      res.status(500).json({ message: "Failed to get validation items" });
    }
  });

  // API endpoint to confirm property listing
  app.post("/api/confirm-property", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { propertyId } = req.body;
      const userId = req.user!.id;

      // Verify property ownership
      const property = await storage.getPropertyById(propertyId);
      if (!property || property.ownerId !== userId) {
        return res.status(404).json({ message: "Property not found or access denied" });
      }

      // Update property validation
      await storage.updateProperty(propertyId, {
        lastValidated: new Date(),
        validationResponseReceived: true,
        validationToken: null,
        validationExpires: null,
        isActive: true
      });

      // Get user's language preference and create success notification
      const user = await storage.getUserById(userId);
      const userLanguage = user?.preferredLanguage === 'th' ? 'th' : 'en';
      
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'validation_confirmed',
        subtype: 'property',
        propertyTitle: property.title
      });
      
      await storage.createNotification({
        userId: userId,
        type: 'validation_confirmed',
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: propertyId
      });

      res.json({ success: true, message: "Property confirmed successfully" });

    } catch (error) {
      console.error("Confirm property error:", error);
      res.status(500).json({ message: "Failed to confirm property" });
    }
  });

  // API endpoint to confirm requirement listing
  app.post("/api/confirm-requirement", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { requirementId } = req.body;
      const userId = req.user!.id;

      // Verify requirement ownership
      const requirement = await storage.getBuyerRequirementById(requirementId);
      if (!requirement || requirement.buyerId !== userId) {
        return res.status(404).json({ message: "Requirement not found or access denied" });
      }

      // Update requirement validation
      await storage.updateBuyerRequirement(requirementId, {
        lastValidated: new Date(),
        validationResponseReceived: true,
        validationToken: null,
        validationExpires: null,
        isActive: true
      });

      // Get user's language preference and create success notification
      const user = await storage.getUserById(userId);
      const userLanguage = user?.preferredLanguage === 'th' ? 'th' : 'en';
      
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'validation_confirmed',
        subtype: 'requirement',
        requirementTitle: requirement.title
      });
      
      await storage.createNotification({
        userId: userId,
        type: 'validation_confirmed',
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: requirementId
      });

      res.json({ success: true, message: "Requirement confirmed successfully" });

    } catch (error) {
      console.error("Confirm requirement error:", error);
      res.status(500).json({ message: "Failed to confirm requirement" });
    }
  });

  // Admin route to trigger translation of existing content
  app.post("/api/admin/translate-existing", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { translateExistingContent } = await import('./translate-existing-content');
      const result = await translateExistingContent();
      
      res.json({ 
        success: true, 
        message: `Successfully translated ${result.propertiesTranslated} properties and ${result.requirementsTranslated} requirements`,
        ...result
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ 
        message: "Failed to translate existing content",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Support routes
  app.post("/api/support/message", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Support message is required" });
      }
      
      const userId = req.user!.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create or get conversation with support team
      // We'll use a special support user ID (you can create an admin/support user)
      // For now, we'll create a conversation with the user themselves and mark it as support
      const supportConversation = await storage.getOrCreateConversation(
        userId,
        userId, // Same user, but we'll mark this as a support conversation
        undefined,
        undefined
      );
      
      // Create the support message (the conversation subject is set during creation)
      const supportMessage = await storage.createMessage({
        conversationId: supportConversation.id,
        senderId: userId,
        content: message.trim(),
        isRead: false
      });
      
      // Create a notification for support team (could be sent to admin users)
      const userLanguage = user.preferredLanguage === 'th' ? 'th' : 'en';
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'support_message',
        subject: `Support Request from ${user.firstName} ${user.lastName}`
      });
      
      // Send notification to user acknowledging receipt
      await storage.createNotification({
        userId: userId,
        type: "support_message",
        title: "Support Message Received",
        content: "We've received your support message and will respond soon.",
        relatedId: supportConversation.id,
        isRead: false,
      });
      
      res.json({ 
        success: true, 
        message: "Support message sent successfully",
        conversationId: supportConversation.id
      });
      
    } catch (error) {
      console.error("Support message error:", error);
      res.status(500).json({ message: "Failed to send support message" });
    }
  });

  app.post("/api/support/email", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { subject, message, userEmail, userName } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }
      
      const userId = req.user!.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Import email sending functionality
      const { sendSupportEmail } = await import('./email');
      
      const emailData = {
        userEmail: userEmail || user.email,
        userName: userName || `${user.firstName} ${user.lastName}`,
        subject: subject.trim(),
        message: message.trim(),
        userId: userId
      };
      
      const emailSent = await sendSupportEmail(emailData);
      
      if (emailSent) {
        // Create a notification for the user
        await storage.createNotification({
          userId: userId,
          type: "support_email",
          title: "Support Email Sent",
          content: "Your support email has been sent to our team.",
          isRead: false,
        });
        
        res.json({ 
          success: true, 
          message: "Support email sent successfully" 
        });
      } else {
        res.status(500).json({ message: "Failed to send support email" });
      }
      
    } catch (error) {
      console.error("Support email error:", error);
      res.status(500).json({ message: "Failed to send support email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
