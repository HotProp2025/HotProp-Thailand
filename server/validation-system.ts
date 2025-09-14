import { storage } from "./storage";
import { generateVerificationToken, sendValidationEmail, sendDailyDigestEmail } from "./email";
import { matchingService } from "./matching-service";
import { getNotificationContent } from "./notification-translations";
import cron from "node-cron";

export class ValidationSystem {
  private static instance: ValidationSystem;
  private jobScheduled = false;

  static getInstance(): ValidationSystem {
    if (!ValidationSystem.instance) {
      ValidationSystem.instance = new ValidationSystem();
    }
    return ValidationSystem.instance;
  }

  // Start the weekly validation check
  startValidationScheduler() {
    if (this.jobScheduled) return;
    
    // Run every Monday at 9:00 AM
    cron.schedule('0 9 * * 1', async () => {
      console.log('🔄 Starting weekly validation check...');
      await this.performWeeklyValidationCheck();
    });

    // Check for expired validations - but NOT on Mondays to give 24 hours after Monday emails
    cron.schedule('0 10 * * 2-7', async () => {
      console.log('⏰ Checking for expired validations...');
      await this.checkExpiredValidations();
    });

    // Run daily to send latest matches notifications
    cron.schedule('0 11 * * *', async () => {
      console.log('Sending daily latest matches notifications...');
      await this.sendDailyMatchesNotifications();
    });

    // Run daily to send email digest with latest matches (evening time)
    cron.schedule('0 18 * * *', async () => {
      console.log('Sending daily email digest...');
      await this.sendDailyEmailDigest();
    });

    this.jobScheduled = true;
    console.log('Validation scheduler started');
  }

  // Main weekly validation check
  async performWeeklyValidationCheck() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Check properties that need validation
      const propertiesToValidate = await storage.getPropertiesNeedingValidation(oneWeekAgo);
      console.log(`📋 Found ${propertiesToValidate.length} properties needing validation`);
      
      for (const property of propertiesToValidate) {
        console.log(`📤 Sending validation reminder for property: ${property.title}`);
        await this.sendPropertyValidationReminder(property);
      }

      // Check buyer requirements that need validation
      const requirementsToValidate = await storage.getBuyerRequirementsNeedingValidation(oneWeekAgo);
      console.log(`📋 Found ${requirementsToValidate.length} requirements needing validation`);
      
      for (const requirement of requirementsToValidate) {
        console.log(`📤 Sending validation reminder for requirement: ${requirement.title}`);
        await this.sendRequirementValidationReminder(requirement);
      }

      console.log(`✅ Weekly validation check completed. Sent ${propertiesToValidate.length + requirementsToValidate.length} validation reminders.`);

    } catch (error) {
      console.error('❌ Error in weekly validation check:', error);
    }
  }

  // Check for expired validations and deactivate listings
  async checkExpiredValidations() {
    try {
      const now = new Date();
      
      // Deactivate expired properties
      const expiredProperties = await storage.getExpiredValidationProperties(now);
      console.log(`Found ${expiredProperties.length} properties with expired validations`);
      
      for (const property of expiredProperties) {
        await storage.updateProperty(property.id, { 
          isActive: false,
          validationToken: null,
          validationExpires: null 
        });
        
        // Get user's language preference and send notification about deactivation
        const owner = await storage.getUserById(property.ownerId);
        const userLanguage = owner?.preferredLanguage === 'th' ? 'th' : 'en';
        
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'listing_deactivated',
          subtype: 'property',
          propertyTitle: property.title
        });
        
        await storage.createNotification({
          userId: property.ownerId,
          type: 'listing_deactivated',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: property.id
        });
      }

      // Deactivate expired requirements
      const expiredRequirements = await storage.getExpiredValidationRequirements(now);
      console.log(`Found ${expiredRequirements.length} requirements with expired validations`);
      
      for (const requirement of expiredRequirements) {
        await storage.updateBuyerRequirement(requirement.id, { 
          isActive: false,
          validationToken: null,
          validationExpires: null 
        });
        
        // Get user's language preference and send notification about deactivation
        const buyer = await storage.getUserById(requirement.buyerId);
        const userLanguage = buyer?.preferredLanguage === 'th' ? 'th' : 'en';
        
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'requirement_deactivated',
          requirementTitle: requirement.title
        });
        
        await storage.createNotification({
          userId: requirement.buyerId,
          type: 'requirement_deactivated',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: requirement.id
        });
      }

    } catch (error) {
      console.error('Error checking expired validations:', error);
    }
  }

  // Send validation reminder for property
  async sendPropertyValidationReminder(property: any) {
    try {
      const validationToken = generateVerificationToken();
      const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Update property with validation token
      await storage.updateProperty(property.id, {
        lastValidationReminder: new Date(),
        validationToken,
        validationExpires,
        validationResponseReceived: false
      });

      // Get user's language preference
      const owner = await storage.getUserById(property.ownerId);
      const userLanguage = owner?.preferredLanguage === 'th' ? 'th' : 'en';
      
      // Generate validation URL
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS}` 
        : 'http://localhost:5000';
      const validationUrl = `${baseUrl}/validate-listing?token=${validationToken}&type=property`;
      
      // Create in-app notification with translation
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'validation_reminder',
        subtype: 'property',
        propertyTitle: property.title,
        validationUrl: validationUrl
      });
      
      await storage.createNotification({
        userId: property.ownerId,
        type: 'validation_reminder',
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: property.id
      });

      // Send email if SMTP is configured
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        const owner = await storage.getUserById(property.ownerId);
        if (owner) {
          console.log(`📧 Sending validation email to ${owner.firstName} (${owner.email}) for property: ${property.title}`);
          await sendValidationEmail(
            owner.email,
            owner.firstName,
            property.title,
            'property',
            validationToken
          );
          console.log(`✅ Validation email sent successfully`);
        } else {
          console.log(`❌ Could not find owner for property: ${property.title}`);
        }
      } else {
        console.log(`❌ SMTP not configured, skipping email for property: ${property.title}`);
      }

    } catch (error) {
      console.error('❌ Error sending property validation reminder:', error);
    }
  }

  // Send validation reminder for requirement
  async sendRequirementValidationReminder(requirement: any) {
    try {
      const validationToken = generateVerificationToken();
      const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Update requirement with validation token
      await storage.updateBuyerRequirement(requirement.id, {
        lastValidationReminder: new Date(),
        validationToken,
        validationExpires,
        validationResponseReceived: false
      });

      // Get user's language preference
      const buyer = await storage.getUserById(requirement.buyerId);
      const userLanguage = buyer?.preferredLanguage === 'th' ? 'th' : 'en';
      
      // Generate validation URL
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS}` 
        : 'http://localhost:5000';
      const validationUrl = `${baseUrl}/validate-listing?token=${validationToken}&type=requirement`;
      
      // Create in-app notification with translation
      const notificationContent = getNotificationContent(userLanguage, {
        type: 'validation_reminder',
        subtype: 'requirement',
        requirementTitle: requirement.title,
        validationUrl: validationUrl
      });
      
      await storage.createNotification({
        userId: requirement.buyerId,
        type: 'validation_reminder',
        title: notificationContent.title,
        content: notificationContent.content,
        relatedId: requirement.id
      });

      // Send email if SMTP is configured
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (hasSmtpCredentials) {
        const buyer = await storage.getUserById(requirement.buyerId);
        if (buyer) {
          console.log(`📧 Sending validation email to ${buyer.firstName} (${buyer.email}) for requirement: ${requirement.title}`);
          await sendValidationEmail(
            buyer.email,
            buyer.firstName,
            requirement.title,
            'requirement',
            validationToken
          );
          console.log(`✅ Validation email sent successfully`);
        } else {
          console.log(`❌ Could not find buyer for requirement: ${requirement.title}`);
        }
      } else {
        console.log(`❌ SMTP not configured, skipping email for requirement: ${requirement.title}`);
      }

    } catch (error) {
      console.error('❌ Error sending requirement validation reminder:', error);
    }
  }

  // Validate a listing/requirement
  async validateListing(token: string, type: 'property' | 'requirement') {
    try {
      if (type === 'property') {
        const property = await storage.getPropertyByValidationToken(token);
        if (!property) {
          return { success: false, message: 'Invalid or expired validation token' };
        }

        // Check if token is still valid
        if (new Date() > new Date(property.validationExpires!)) {
          return { success: false, message: 'Validation token has expired' };
        }

        // Update property validation
        await storage.updateProperty(property.id, {
          lastValidated: new Date(),
          validationResponseReceived: true,
          validationToken: null,
          validationExpires: null
        });

        // Get user's language preference and create success notification
        const owner = await storage.getUserById(property.ownerId);
        const userLanguage = owner?.preferredLanguage === 'th' ? 'th' : 'en';
        
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'validation_confirmed',
          subtype: 'property',
          propertyTitle: property.title
        });
        
        await storage.createNotification({
          userId: property.ownerId,
          type: 'validation_confirmed',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: property.id
        });

        return { success: true, message: 'Property listing validated successfully' };

      } else {
        const requirement = await storage.getBuyerRequirementByValidationToken(token);
        if (!requirement) {
          return { success: false, message: 'Invalid or expired validation token' };
        }

        // Check if token is still valid
        if (new Date() > new Date(requirement.validationExpires!)) {
          return { success: false, message: 'Validation token has expired' };
        }

        // Update requirement validation
        await storage.updateBuyerRequirement(requirement.id, {
          lastValidated: new Date(),
          validationResponseReceived: true,
          validationToken: null,
          validationExpires: null
        });

        // Get user's language preference and create success notification
        const buyer = await storage.getUserById(requirement.buyerId);
        const userLanguage = buyer?.preferredLanguage === 'th' ? 'th' : 'en';
        
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'validation_confirmed',
          subtype: 'requirement',
          requirementTitle: requirement.title
        });
        
        await storage.createNotification({
          userId: requirement.buyerId,
          type: 'validation_confirmed',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: requirement.id
        });

        return { success: true, message: 'Requirement validated successfully' };
      }

    } catch (error) {
      console.error('Error validating listing:', error);
      return { success: false, message: 'Validation failed' };
    }
  }

  // Send daily latest matches notifications to users with requirements OR properties
  async sendDailyMatchesNotifications() {
    try {
      let notificationsSent = 0;

      // PART 1: Notify users with requirements about property matches
      const allRequirements = await storage.getBuyerRequirements();
      const activeRequirements = allRequirements.filter(req => req.isActive);
      
      if (activeRequirements.length > 0) {
        // Group requirements by user
        const userRequirements = activeRequirements.reduce((acc, req) => {
          if (!acc[req.buyerId]) {
            acc[req.buyerId] = [];
          }
          acc[req.buyerId].push(req);
          return acc;
        }, {} as Record<string, typeof activeRequirements>);

        // Get all active properties for matching
        const properties = await storage.getActiveProperties();

        // Process each user WITH REQUIREMENTS (send property matches)
        for (const [userId, requirements] of Object.entries(userRequirements)) {
          try {
            // Find matches with at least 80% compatibility
            const matches = matchingService.findMatchesForRequirements(properties, requirements, 80);
            
            if (matches.length > 0) {
              // Group matches by property to avoid duplicates
              const uniqueMatches = matches.reduce((acc, match) => {
                const existingMatch = acc.find(m => m.property.id === match.property.id);
                if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
                  acc = acc.filter(m => m.property.id !== match.property.id);
                  acc.push(match);
                }
                return acc;
              }, [] as typeof matches);

              // Get user's language preference and create notification for property matches
              const user = await storage.getUserById(userId);
              const userLanguage = user?.preferredLanguage === 'th' ? 'th' : 'en';
              
              const notificationContent = getNotificationContent(userLanguage, {
                type: 'latest_matches',
                subtype: 'property',
                matchCount: uniqueMatches.length
              });
              
              await storage.createNotification({
                userId: userId,
                type: 'latest_matches',
                title: notificationContent.title,
                content: notificationContent.content,
                relatedId: null
              });

              notificationsSent++;
            }
          } catch (error) {
            console.error(`Error processing property matches for user ${userId}:`, error);
          }
        }
      }

      // PART 2: Notify users with properties about requirement matches  
      const allProperties = await storage.getActiveProperties();
      
      if (allProperties.length > 0) {
        // Group properties by user
        const userProperties = allProperties.reduce((acc, prop) => {
          if (!acc[prop.ownerId]) {
            acc[prop.ownerId] = [];
          }
          acc[prop.ownerId].push(prop);
          return acc;
        }, {} as Record<string, typeof allProperties>);

        // Process each user WITH PROPERTIES (send requirement matches)
        for (const [userId, properties] of Object.entries(userProperties)) {
          try {
            // Find requirement matches for user's properties
            const requirementMatches: any[] = [];
            
            for (const property of properties) {
              const matches = matchingService.findMatchesForProperty(property, activeRequirements, 80);
              requirementMatches.push(...matches);
            }

            if (requirementMatches.length > 0) {
              // Group matches by requirement to avoid duplicates
              const uniqueMatches = requirementMatches.reduce((acc, match) => {
                const existingMatch = acc.find((m: any) => m.requirement.id === match.requirement.id);
                if (!existingMatch || match.compatibilityScore > existingMatch.compatibilityScore) {
                  acc = acc.filter((m: any) => m.requirement.id !== match.requirement.id);
                  acc.push(match);
                }
                return acc;
              }, [] as typeof requirementMatches);

              // Get user's language preference and create notification for requirement matches
              const user = await storage.getUserById(userId);
              const userLanguage = user?.preferredLanguage === 'th' ? 'th' : 'en';
              
              const notificationContent = getNotificationContent(userLanguage, {
                type: 'latest_matches',
                subtype: 'requirement',
                matchCount: uniqueMatches.length
              });
              
              await storage.createNotification({
                userId: userId,
                type: 'latest_matches',
                title: notificationContent.title,
                content: notificationContent.content,
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
      console.error('Error in daily matches notifications:', error);
    }
  }

  // Send daily email digest with latest matches from last 5 days
  async sendDailyEmailDigest() {
    try {
      // Check if SMTP credentials are configured
      const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
      if (!hasSmtpCredentials) {
        console.log('SMTP not configured, skipping daily email digest');
        return;
      }

      // Get date from 5 days ago
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      
      // Get all users
      const allUsers = await storage.getUsers();
      const activeUsers = allUsers.filter(user => user.isVerified);
      
      if (activeUsers.length === 0) {
        console.log('No verified users found for email digest');
        return;
      }

      // Get properties and requirements created in last 5 days
      const recentProperties = await storage.getPropertiesCreatedAfter(fiveDaysAgo);
      const allRequirements = await storage.getBuyerRequirements();
      const recentRequirements = allRequirements.filter(req => 
        req.isActive && req.createdAt && new Date(req.createdAt) >= fiveDaysAgo
      );
      
      let emailsSent = 0;

      // Process each user
      for (const user of activeUsers) {
        try {
          // Get user's active properties and requirements
          const userProperties = await storage.getUserProperties(user.id);
          const activeUserProperties = userProperties.filter(p => p.isActive);
          
          const userRequirements = allRequirements.filter(req => 
            req.buyerId === user.id && req.isActive
          );

          const propertyMatches: any[] = [];
          const requirementMatches: any[] = [];

          // Find property matches for user's requirements
          if (userRequirements.length > 0) {
            const matches = matchingService.findMatchesForRequirements(recentProperties, userRequirements, 80);
            // Take only top 5 matches
            propertyMatches.push(...matches.slice(0, 5));
          }

          // Find requirement matches for user's properties
          if (activeUserProperties.length > 0) {
            for (const property of activeUserProperties) {
              const matches = matchingService.findMatchesForProperty(property, recentRequirements, 80);
              requirementMatches.push(...matches);
            }
            // Take only top 5 matches and remove duplicates
            const uniqueRequirementMatches = requirementMatches
              .filter((match, index, self) => 
                self.findIndex(m => m.requirement.id === match.requirement.id) === index
              )
              .slice(0, 5);
            requirementMatches.length = 0;
            requirementMatches.push(...uniqueRequirementMatches);
          }

          // Send email if there are matches
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
      console.error('Error in daily email digest:', error);
    }
  }
}

// Export singleton instance
export const validationSystem = ValidationSystem.getInstance();