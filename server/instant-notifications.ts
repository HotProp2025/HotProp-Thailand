import { eq, and, ne } from 'drizzle-orm';
import { MatchingService } from './matching-service.js';
import { storage } from './storage.js';
import { sendInstantMatchEmail } from './email.js';
import { getNotificationContent } from './notification-translations.js';
import type { Property, BuyerRequirement } from '../shared/schema.js';

// Instant notification service for Premium members when new high-quality matches are found

/**
 * Check for instant matches when a new property is created
 * Notifies Premium users whose requirements match the new property (80%+ compatibility)
 */
export async function checkInstantPropertyMatches(newProperty: any) {
  try {
    console.log(`🔍 Checking instant matches for new property: ${newProperty.title}`);
    
    // Get all active requirements from Premium users that are NOT from the same user who created the property
    const activeRequirements = await storage.getBuyerRequirements();
    const premiumRequirements = [];
    
    for (const req of activeRequirements) {
      if (req.isActive && req.buyerId !== newProperty.ownerId) {
        const user = await storage.getUserById(req.buyerId);
        if (user && user.subscriptionType === 'premium') {
          premiumRequirements.push({ requirement: req, user });
        }
      }
    }

    if (premiumRequirements.length === 0) {
      console.log('📭 No premium requirements found for instant matching');
      return;
    }

    console.log(`📋 Found ${premiumRequirements.length} premium requirements to check`);

    const matchingService = new MatchingService();
    const userMatches = new Map(); // Group matches by user

    // Check compatibility for each requirement and group by user
    for (const { requirement, user } of premiumRequirements) {
      const compatibilityScore = matchingService.calculateCompatibility(newProperty, requirement);
      
      // Only consider high-quality matches (80%+)
      if (compatibilityScore >= 80) {
        console.log(`🎯 High-quality match found! ${Math.round(compatibilityScore)}% compatibility for ${user.firstName}`);
        
        if (!userMatches.has(user.id)) {
          userMatches.set(user.id, { user, matches: [] });
        }
        
        userMatches.get(user.id).matches.push({
          property: newProperty,
          requirement,
          compatibilityScore
        });
      }
    }

    // Send batch notifications (max 5 properties per user)
    for (const [userId, { user, matches }] of Array.from(userMatches)) {
      const maxMatches = Math.min(matches.length, 5);
      const topMatches = matches.slice(0, maxMatches);
      
      const userLanguage = user.preferredLanguage === 'th' ? 'th' : 'en';
      
      if (topMatches.length === 1) {
        // Single match - use existing format
        const match = topMatches[0];
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'property_match',
          subtype: 'single',
          propertyTitle: match.property.title,
          requirementTitle: match.requirement.title,
          compatibilityScore: Math.round(match.compatibilityScore)
        });
        
        await storage.createNotification({
          userId: user.id,
          type: 'property_match',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: match.property.id
        });
      } else {
        // Multiple matches - batch notification
        const propertyTitles = topMatches.map((m: any) => m.property.title).join(', ');
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'property_match',
          subtype: 'multiple',
          count: topMatches.length,
          propertyTitles,
          topCompatibility: Math.round(Math.max(...topMatches.map((m: any) => m.compatibilityScore)))
        });
        
        await storage.createNotification({
          userId: user.id,
          type: 'property_match',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: newProperty.id
        });
      }
      
      // Send email for the best match
      const bestMatch = topMatches[0];
      await sendInstantMatchEmail(
        user.email,
        user.firstName,
        'property',
        {
          property: bestMatch.property,
          requirement: bestMatch.requirement,
          compatibilityScore: bestMatch.compatibilityScore,
          matchingCriteria: ['Property Type', 'Location', 'Price Range']
        }
      );
      
      console.log(`✅ Batch notification sent to ${user.firstName} (${topMatches.length} matches)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking instant property matches:', error);
  }
}

/**
 * Check for instant matches when a new requirement is created
 * Notifies Premium users whose properties match the new requirement (80%+ compatibility) 
 */
export async function checkInstantRequirementMatches(newRequirement: any) {
  try {
    console.log(`🔍 Checking instant matches for new requirement: ${newRequirement.title}`);
    
    // Get all active properties from Premium users that are NOT from the same user who created the requirement
    const activeProperties = await storage.getProperties({});
    const premiumProperties = [];
    
    for (const prop of activeProperties) {
      if (prop.isActive && prop.ownerId !== newRequirement.buyerId) {
        const user = await storage.getUserById(prop.ownerId);
        if (user && user.subscriptionType === 'premium') {
          premiumProperties.push({ property: prop, user });
        }
      }
    }

    if (premiumProperties.length === 0) {
      console.log('📭 No premium properties found for instant matching');
      return;
    }

    console.log(`🏠 Found ${premiumProperties.length} premium properties to check`);

    const matchingService = new MatchingService();
    const userMatches = new Map(); // Group matches by user

    // Check compatibility for each property and group by user
    for (const { property, user } of premiumProperties) {
      const compatibilityScore = matchingService.calculateCompatibility(property, newRequirement);
      
      // Only consider high-quality matches (80%+)
      if (compatibilityScore >= 80) {
        console.log(`🎯 High-quality match found! ${Math.round(compatibilityScore)}% compatibility for ${user.firstName}`);
        
        if (!userMatches.has(user.id)) {
          userMatches.set(user.id, { user, matches: [] });
        }
        
        userMatches.get(user.id).matches.push({
          property,
          requirement: newRequirement,
          compatibilityScore
        });
      }
    }

    // Send batch notifications (max 5 requirements per user)
    for (const [userId, { user, matches }] of Array.from(userMatches)) {
      const maxMatches = Math.min(matches.length, 5);
      const topMatches = matches.slice(0, maxMatches);
      
      const userLanguage = user.preferredLanguage === 'th' ? 'th' : 'en';
      
      if (topMatches.length === 1) {
        // Single match - use existing format
        const match = topMatches[0];
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'requirement_match',
          subtype: 'single',
          requirementTitle: match.requirement.title,
          propertyTitle: match.property.title,
          compatibilityScore: Math.round(match.compatibilityScore)
        });
        
        await storage.createNotification({
          userId: user.id,
          type: 'requirement_match',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: match.property.id
        });
      } else {
        // Multiple matches - batch notification
        const requirementTitle = topMatches[0].requirement.title;
        const notificationContent = getNotificationContent(userLanguage, {
          type: 'requirement_match',
          subtype: 'multiple',
          count: topMatches.length,
          requirementTitle,
          topCompatibility: Math.round(Math.max(...topMatches.map((m: any) => m.compatibilityScore)))
        });
        
        await storage.createNotification({
          userId: user.id,
          type: 'requirement_match',
          title: notificationContent.title,
          content: notificationContent.content,
          relatedId: topMatches[0].property.id
        });
      }
      
      // Send email for the best match
      const bestMatch = topMatches[0];
      await sendInstantMatchEmail(
        user.email,
        user.firstName,
        'requirement',
        {
          property: bestMatch.property,
          requirement: bestMatch.requirement,
          compatibilityScore: bestMatch.compatibilityScore,
          matchingCriteria: ['Property Type', 'Location', 'Price Range']
        }
      );
      
      console.log(`✅ Batch notification sent to ${user.firstName} (${topMatches.length} matches)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking instant requirement matches:', error);
  }
}