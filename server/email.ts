import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email service configuration
export const createEmailTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587');
  const config = {
    service: 'gmail', // Use Gmail service directly
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  };

  console.log('Email config:', { service: 'gmail', user: process.env.SMTP_USER });
  return nodemailer.createTransport(config);
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (email: string, firstName: string, token: string) => {
  const transporter = createEmailTransporter();
  
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"HotProp" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify your HotProp account',
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
               target="_blank"
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white !important; 
                      padding: 15px 30px; 
                      text-decoration: none !important; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block; 
                      border: none;
                      cursor: pointer;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, click this direct link:
          </p>
          <p style="font-size: 14px; margin: 10px 0;">
            <a href="${verificationUrl}" style="color: #4F7AFF; text-decoration: underline;" target="_blank">
              ${verificationUrl}
            </a>
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Or copy and paste this URL into your browser: ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; margin: 0;">
            This verification link will expire in 24 hours. If you didn't create an account with HotProp, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, firstName: string, token: string) => {
  const transporter = createEmailTransporter();
  
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"HotProp" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset your HotProp password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Password Reset</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">HotProp - Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            We received a request to reset your password for your HotProp account.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 30px;">
            Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               target="_blank"
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white !important; 
                      padding: 15px 30px; 
                      text-decoration: none !important; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block; 
                      border: none;
                      cursor: pointer;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, click this direct link:
          </p>
          <p style="font-size: 14px; margin: 10px 0;">
            <a href="${resetUrl}" style="color: #4F7AFF; text-decoration: underline;" target="_blank">
              ${resetUrl}
            </a>
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Or copy and paste this URL into your browser: ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; margin: 0;">
            This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  const transporter = createEmailTransporter();
  
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  
  const mailOptions = {
    from: `"HotProp" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to HotProp - Start exploring properties!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to HotProp</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">🎉 Your account is verified, ${firstName}!</h2>
          
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
            <a href="${baseUrl}" 
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
            Happy property hunting! 🏠
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

// Send validation reminder email
export const sendValidationEmail = async (email: string, firstName: string, listingTitle: string, listingType: 'property' | 'requirement', token: string) => {
  const transporter = createEmailTransporter();
  
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  const validationUrl = `${baseUrl}/validate-listing?token=${token}&type=${listingType}`;
  
  const isProperty = listingType === 'property';
  const itemType = isProperty ? 'property listing' : 'property requirement';
  const action = isProperty ? 'still available for sale/rent' : 'still active';
  
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
              <strong>⏰ Important:</strong> Please confirm within 24 hours or your ${itemType} will be automatically deactivated (but not deleted).
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
              ✓ Yes, My ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} is Still Active
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
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending validation email:', error);
    return false;
  }
};

// Send daily digest email with latest matches
export const sendDailyDigestEmail = async (
  email: string, 
  firstName: string, 
  propertyMatches: any[], 
  requirementMatches: any[]
) => {
  const transporter = createEmailTransporter();
  
  const hasPropertyMatches = propertyMatches.length > 0;
  const hasRequirementMatches = requirementMatches.length > 0;
  const totalMatches = propertyMatches.length + requirementMatches.length;
  
  if (totalMatches === 0) {
    return false; // Don't send email if no matches
  }

  const baseUrl = process.env.REPLIT_DOMAINS || 'http://localhost:5000';
  
  // Generate property matches HTML
  const propertyMatchesHtml = hasPropertyMatches ? `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #4F7AFF; margin-bottom: 15px; font-size: 18px;">🏠 Property Matches for Your Requirements</h3>
      ${propertyMatches.map(match => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${match.property.title}</h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            <strong>${match.property.propertyType}</strong> • ${match.property.transactionType} • 
            ${match.property.price ? `${match.property.currency} ${match.property.price.toLocaleString()}` : 
              `${match.property.rentCurrency} ${match.property.rentPrice?.toLocaleString()}/month`}
          </p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📍 ${match.property.city}, ${match.property.state}</p>
          <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${match.property.description.substring(0, 120)}...</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${Math.round(match.compatibilityScore)}% Match
            </span>
            <a href="${baseUrl}/property/${match.property.id}" 
               style="color: #4F7AFF; text-decoration: none; font-size: 14px; font-weight: bold;">
              View Details →
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Generate requirement matches HTML
  const requirementMatchesHtml = hasRequirementMatches ? `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #4F7AFF; margin-bottom: 15px; font-size: 18px;">🔍 Requirement Matches for Your Properties</h3>
      ${requirementMatches.map(match => `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background-color: #f8fafc;">
          <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${match.requirement.title}</h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            <strong>${match.requirement.propertyType}</strong> • ${match.requirement.transactionType} • 
            Budget: ${match.requirement.currency} ${match.requirement.maxPrice?.toLocaleString() || 'Flexible'}
          </p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📍 ${match.requirement.preferredCity || 'Any city'}, ${match.requirement.preferredState || 'Any state'}</p>
          <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${match.requirement.description.substring(0, 120)}...</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${Math.round(match.compatibilityScore)}% Match
            </span>
            <a href="${baseUrl}/requirement/${match.requirement.id}" 
               style="color: #4F7AFF; text-decoration: none; font-size: 14px; font-weight: bold;">
              View Details →
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const mailOptions = {
    from: `"HotProp" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Daily Property Matches - ${totalMatches} new ${totalMatches === 1 ? 'match' : 'matches'}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HotProp Daily Digest</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}! 👋</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
            Great news! We found <strong>${totalMatches} ${totalMatches === 1 ? 'new match' : 'new matches'}</strong> for you from the last 5 days.
          </p>
          
          ${propertyMatchesHtml}
          ${requirementMatchesHtml}
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #0369a1;">
              💡 <strong>Tip:</strong> These matches are based on your active property requirements and listings. 
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
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${baseUrl}/profile" style="color: #4F7AFF; text-decoration: none;">Update email preferences</a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending daily digest email:', error);
    return false;
  }
};

// Send instant match notification email for Premium members
export const sendInstantMatchEmail = async (
  email: string, 
  firstName: string, 
  matchType: 'property' | 'requirement',
  matchData: {
    property: any;
    requirement: any;
    compatibilityScore: number;
    matchingCriteria: string[];
  }
) => {
  const transporter = createEmailTransporter();
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  
  const { property, requirement, compatibilityScore, matchingCriteria } = matchData;
  
  const isPropertyMatch = matchType === 'property';
  const title = isPropertyMatch ? 'New Property Match Found!' : 'New Requirement Match Found!';
  const emoji = isPropertyMatch ? '🏠' : '🔍';
  
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
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Hi ${firstName}! 👋</h2>
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h3 style="margin: 0; font-size: 18px;">${Math.round(compatibilityScore)}% Match Found!</h3>
            <p style="margin: 5px 0 0 0; font-size: 14px;">High-quality match detected instantly</p>
          </div>
          
          ${isPropertyMatch ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #4F7AFF; margin-bottom: 15px;">🏠 New Property Match</h3>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc;">
              ${property.images && property.images.length > 0 ? `
              <div style="margin-bottom: 15px; text-align: center;">
                <img src="${baseUrl}${property.images[0]}" 
                     alt="${property.title}"
                     style="width: 100%; max-width: 400px; height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; background: #f3f4f6; padding: 40px; border-radius: 8px; color: #6b7280;">
                  <p style="margin: 0; font-size: 14px;">📷 Image not available</p>
                </div>
              </div>
              ` : ''}
              <h4 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${property.title}</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                <span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                  ${property.propertyType?.toUpperCase() || 'PROPERTY'}
                </span>
                <span style="background: ${property.transactionType === 'sell' ? '#dcfce7' : '#fef3c7'}; color: ${property.transactionType === 'sell' ? '#059669' : '#d97706'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                  ${property.transactionType === 'sell' ? 'FOR SALE' : property.transactionType === 'rent' ? 'FOR RENT' : 'FOR SALE/RENT'}
                </span>
              </div>
              <p style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: bold;">
                💰 ${property.price ? `${property.currency} ${Number(property.price).toLocaleString()}` : 
                  `${property.rentCurrency || 'THB'} ${Number(property.rentPrice || 0).toLocaleString()}/month`}
              </p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📍 ${property.address || ''} ${property.city}, ${property.state || ''} ${property.country || ''}</p>
              ${property.bedrooms || property.bathrooms || property.area ? `
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                🏠 ${property.bedrooms ? `${property.bedrooms} bed` : ''}${property.bedrooms && property.bathrooms ? ' • ' : ''}${property.bathrooms ? `${property.bathrooms} bath` : ''}${(property.bedrooms || property.bathrooms) && property.area ? ' • ' : ''}${property.area ? `${Number(property.area).toLocaleString()} ${property.areaUnit || 'sqm'}` : ''}
              </p>
              ` : ''}
              <p style="margin: 0 0 15px 0; color: #555; font-size: 14px; line-height: 1.5;">${(property.description || '').substring(0, 200)}${(property.description || '').length > 200 ? '...' : ''}</p>
              <div style="background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                <p style="margin: 0; color: #0369a1; font-size: 12px; font-weight: bold;">
                  🎯 Perfect match for: "${requirement.title}"
                </p>
              </div>
            </div>
          </div>
          ` : `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #4F7AFF; margin-bottom: 15px;">🔍 New Requirement Match</h3>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc;">
              <h4 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${requirement.title}</h4>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                <strong>${requirement.propertyType}</strong> • ${requirement.transactionType} • 
                Budget: ${requirement.currency} ${requirement.maxPrice?.toLocaleString() || 'Flexible'}
              </p>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📍 ${requirement.preferredCity || 'Any city'}, ${requirement.preferredState || 'Any state'}</p>
              <p style="margin: 0 0 15px 0; color: #555; font-size: 14px;">${requirement.description.substring(0, 150)}...</p>
              <p style="margin: 0 0 10px 0; color: #10b981; font-size: 12px; font-weight: bold;">
                Matches your property: "${property.title}"
              </p>
            </div>
          </div>
          `}
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0369a1;">🎯 Why This is a Great Match:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1; font-size: 14px;">
              ${matchingCriteria.map(criteria => `<li>${criteria}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ⚡ <strong>Premium Exclusive:</strong> You received this instant notification because you're a Premium member! 
              Free users only get daily digest emails.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/${isPropertyMatch ? `property/${property.id}` : `requirements`}" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              View ${isPropertyMatch ? 'Property Details' : 'All Requirements'}
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${baseUrl}/profile" style="color: #4F7AFF; text-decoration: none;">Update email preferences</a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending instant match email:', error);
    return false;
  }
};

// Send support email to applied.skill@gmail.com
export const sendSupportEmail = async (data: {
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  userId: string;
}): Promise<boolean> => {
  const transporter = createEmailTransporter();
  
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:5000';
  
  const mailOptions = {
    from: `"HotProp Support" <${process.env.SMTP_USER}>`,
    to: 'applied.skill@gmail.com',
    cc: data.userEmail, // Copy the user on the email
    subject: `[HotProp Support] ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HotProp Support Request</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Smart Deals, 0 Fees!</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #4F7AFF; margin-bottom: 20px;">Support Request Details</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">User Information:</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Name:</strong> ${data.userName}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Email:</strong> ${data.userEmail}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>User ID:</strong> ${data.userId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #0369a1; font-size: 16px;">Subject:</h3>
            <p style="margin: 0; color: #0369a1; font-size: 15px; font-weight: 500;">${data.subject}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">Message:</h3>
            <div style="color: #92400e; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/admin" 
               style="background: linear-gradient(135deg, #4F7AFF 0%, #3b82f6 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;">
              View in Admin Panel
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
              This email was automatically generated by the HotProp support system.
            </p>
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">© 2025 HotProp. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Direct property connections without agent fees.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Support email sent successfully to applied.skill@gmail.com');
    return true;
  } catch (error) {
    console.error('Error sending support email:', error);
    return false;
  }
};