import { sendValidationEmail } from './email';
import { storage } from './storage';
import crypto from 'crypto';

// Test function to send a sample validation reminder email with real database entry
export async function sendTestValidationEmail(userEmail: string, userName: string) {
  try {
    // Get the user by email to find their actual properties
    const user = await storage.getUserByEmail(userEmail);
    if (!user) {
      console.log('❌ User not found, creating test scenario with mock property');
      
      // Create a validation token for testing
      const validationToken = crypto.randomBytes(32).toString('hex');
      const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Store this test token in our validation system for testing
      // We'll create a temporary property entry for testing
      const testProperty = await storage.createProperty({
        ownerId: 'test-user-id',
        title: 'Test Property - Beautiful 3-Bedroom Villa',
        description: 'Test property for validation system',
        propertyType: 'House',
        transactionType: 'Rent',
        price: "2500000",
        currency: 'THB',
        address: '123 Test Street, Bangkok',
        city: 'Bangkok',
        state: 'Bangkok',
        country: 'Thailand',
        landSize: "200",
        buildSize: "150",
        bedrooms: 3,
        bathrooms: 2,
        amenities: ['Parking', 'Swimming Pool'],
        images: [],
        isActive: true,
        validationToken,
        validationExpires
      });
      
      await sendValidationEmail(
        userEmail,
        userName,
        testProperty.title,
        'property',
        validationToken
      );
      
      console.log(`✅ Test validation email sent with real token: ${validationToken}`);
      console.log(`🔗 Test link: http://localhost:5000/validate-listing?token=${validationToken}&type=property`);
      console.log(`🌐 Alternative link: https://${process.env.REPLIT_DEV_DOMAIN}/validate-listing?token=${validationToken}&type=property`);
      return true;
    }
    
    // If user exists, get their first property for testing
    const properties = await storage.getPropertiesByOwner(user.id);
    if (properties.length === 0) {
      console.log('❌ User has no properties, cannot test validation');
      return false;
    }
    
    const property = properties[0];
    const validationToken = crypto.randomBytes(32).toString('hex');
    const validationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Update the property with validation token
    await storage.updateProperty(property.id, {
      validationToken,
      validationExpires,
      validationResponseReceived: false
    });
    
    await sendValidationEmail(
      userEmail,
      userName,
      property.title,
      'property',
      validationToken
    );
    
    console.log(`✅ Test validation email sent for real property: ${property.title}`);
    console.log(`🔗 Test link: http://localhost:5000/validate-listing?token=${validationToken}&type=property`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return false;
  }
}