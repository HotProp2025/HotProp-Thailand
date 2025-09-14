// Notification translations for multilingual support

interface NotificationContent {
  title: string;
  content: string;
}

const translations = {
  en: {
    // Validation reminders
    'validation_reminder_property': {
      title: 'Confirm Your Property Listing',
      content: (propertyTitle: string, validationUrl?: string) => `Please confirm that your property "${propertyTitle}" is still available. ${validationUrl ? `Click here to validate: ${validationUrl}` : 'Click to validate'} within 24 hours or it will be deactivated.`
    },
    'validation_reminder_requirement': {
      title: 'Confirm Your Property Requirement',
      content: (requirementTitle: string, validationUrl?: string) => `Please confirm that your requirement "${requirementTitle}" is still active. ${validationUrl ? `Click here to validate: ${validationUrl}` : 'Click to validate'} within 24 hours or it will be deactivated.`
    },
    
    // Deactivation notifications
    'listing_deactivated_property': {
      title: 'Property Listing Deactivated',
      content: (propertyTitle: string) => `Your property "${propertyTitle}" has been deactivated due to missed validation. You can reactivate it anytime from your listings.`
    },
    'requirement_deactivated': {
      title: 'Requirement Deactivated',
      content: (requirementTitle: string) => `Your requirement "${requirementTitle}" has been deactivated due to missed validation. You can reactivate it anytime from your requirements.`
    },
    
    // Validation confirmed
    'validation_confirmed_property': {
      title: 'Property Listing Confirmed',
      content: (propertyTitle: string) => `Thank you for confirming your property "${propertyTitle}". Your listing remains active.`
    },
    'validation_confirmed_requirement': {
      title: 'Requirement Confirmed',
      content: (requirementTitle: string) => `Thank you for confirming your requirement "${requirementTitle}". Your requirement remains active.`
    },
    
    // Match notifications
    'latest_matches_property': {
      title: 'Latest property matches (80%+)',
      content: (matchCount: number) => `Found ${matchCount} properties matching your requirements with 80%+ compatibility. Click to view your latest matches.`
    },
    'latest_matches_requirement': {
      title: 'Latest requirement matches (80%+)',
      content: (matchCount: number) => `Found ${matchCount} buyer requirements matching your properties with 80%+ compatibility. Click to view your latest matches.`
    },
    
    // Instant match notifications
    'property_match_single': {
      title: '🏠 New Property Match Found!',
      content: (propertyTitle: string, requirementTitle: string, compatibility: number) => `New property "${propertyTitle}" matches your requirement "${requirementTitle}" with ${Math.round(compatibility)}% compatibility!`
    },
    'property_match_multiple': {
      title: (count: number) => `🏠 ${count} New Property Matches Found!`,
      content: (propertyTitles: string, topCompatibility: number) => `New properties matching your requirements: ${propertyTitles}. Top compatibility: ${Math.round(topCompatibility)}%`
    },
    'requirement_match_single': {
      title: '🔍 New Requirement Match Found!',
      content: (requirementTitle: string, propertyTitle: string, compatibility: number) => `New requirement "${requirementTitle}" matches your property "${propertyTitle}" with ${Math.round(compatibility)}% compatibility!`
    },
    'requirement_match_multiple': {
      title: (count: number) => `🔍 ${count} Properties Match New Requirement!`,
      content: (requirementTitle: string, topCompatibility: number) => `Your properties match the new requirement "${requirementTitle}". Top compatibility: ${Math.round(topCompatibility)}%`
    },
    
    // Verification notifications
    'verification_approved': {
      title: 'Property Verification Approved',
      content: (propertyTitle: string) => `Your ownership verification for "${propertyTitle}" has been approved.`
    },
    'verification_rejected': {
      title: 'Property Verification Rejected',
      content: (propertyTitle: string, reason?: string) => `Your ownership verification for "${propertyTitle}" was rejected. Reason: ${reason || 'Documents did not meet verification requirements.'}`
    },
    'verification_request': {
      title: 'New Ownership Verification Request',
      content: (propertyTitle: string) => `A new property verification request has been submitted for "${propertyTitle}".`
    },
    
    // Message notifications
    'message': {
      title: 'New Message',
      content: (subject: string) => `You have a new message about ${subject}`
    }
  },
  
  th: {
    // Validation reminders
    'validation_reminder_property': {
      title: 'ยืนยันประกาศขายอสังหาริมทรัพย์ของคุณ',
      content: (propertyTitle: string, validationUrl?: string) => `กรุณายืนยันว่าอสังหาริมทรัพย์ "${propertyTitle}" ของคุณยังพร้อมขาย ${validationUrl ? `คลิกที่นี่เพื่อยืนยัน: ${validationUrl}` : 'คลิกเพื่อยืนยัน'} ภายใน 24 ชั่วโมง หรือประกาศจะถูกปิดใช้งาน`
    },
    'validation_reminder_requirement': {
      title: 'ยืนยันความต้องการซื้ออสังหาริมทรัพย์ของคุณ',
      content: (requirementTitle: string, validationUrl?: string) => `กรุณายืนยันว่าความต้องการ "${requirementTitle}" ของคุณยังใช้งานอยู่ ${validationUrl ? `คลิกที่นี่เพื่อยืนยัน: ${validationUrl}` : 'คลิกเพื่อยืนยัน'} ภายใน 24 ชั่วโมง หรือจะถูกปิดใช้งาน`
    },
    
    // Deactivation notifications
    'listing_deactivated_property': {
      title: 'ประกาศขายอสังหาริมทรัพย์ถูกปิดใช้งาน',
      content: (propertyTitle: string) => `อสังหาริมทรัพย์ "${propertyTitle}" ของคุณถูกปิดใช้งานเนื่องจากไม่ได้ยืนยัน คุณสามารถเปิดใช้งานใหม่ได้ตลอดเวลาจากประกาศของคุณ`
    },
    'requirement_deactivated': {
      title: 'ความต้องการถูกปิดใช้งาน',
      content: (requirementTitle: string) => `ความต้องการ "${requirementTitle}" ของคุณถูกปิดใช้งานเนื่องจากไม่ได้ยืนยัน คุณสามารถเปิดใช้งานใหม่ได้ตลอดเวลาจากความต้องการของคุณ`
    },
    
    // Validation confirmed
    'validation_confirmed_property': {
      title: 'ประกาศขายอสังหาริมทรัพย์ได้รับการยืนยันแล้ว',
      content: (propertyTitle: string) => `ขอบคุณที่ยืนยันอสังหาริมทรัพย์ "${propertyTitle}" ของคุณ ประกาศของคุณยังคงใช้งานอยู่`
    },
    'validation_confirmed_requirement': {
      title: 'ความต้องการได้รับการยืนยันแล้ว',
      content: (requirementTitle: string) => `ขอบคุณที่ยืนยันความต้องการ "${requirementTitle}" ของคุณ ความต้องการของคุณยังคงใช้งานอยู่`
    },
    
    // Match notifications
    'latest_matches_property': {
      title: 'อสังหาริมทรัพย์ที่ตรงกันล่าสุด (80%+)',
      content: (matchCount: number) => `พบ ${matchCount} อสังหาริมทรัพย์ที่ตรงกับความต้องการของคุณ 80%+ คลิกเพื่อดูรายการที่ตรงกันล่าสุด`
    },
    'latest_matches_requirement': {
      title: 'ความต้องการที่ตรงกันล่าสุด (80%+)',
      content: (matchCount: number) => `พบ ${matchCount} ความต้องการที่ตรงกับอสังหาริมทรัพย์ของคุณ 80%+ คลิกเพื่อดูรายการที่ตรงกันล่าสุด`
    },
    
    // Instant match notifications
    'property_match_single': {
      title: '🏠 พบอสังหาริมทรัพย์ใหม่ที่ตรงกัน!',
      content: (propertyTitle: string, requirementTitle: string, compatibility: number) => `อสังหาริมทรัพย์ใหม่ "${propertyTitle}" ตรงกับความต้องการ "${requirementTitle}" ของคุณ ${Math.round(compatibility)}%!`
    },
    'property_match_multiple': {
      title: (count: number) => `🏠 พบ ${count} อสังหาริมทรัพย์ใหม่ที่ตรงกัน!`,
      content: (propertyTitles: string, topCompatibility: number) => `อสังหาริมทรัพย์ใหม่ที่ตรงกับความต้องการของคุณ: ${propertyTitles} ความเข้ากันได้สูงสุด: ${Math.round(topCompatibility)}%`
    },
    'requirement_match_single': {
      title: '🔍 พบความต้องการใหม่ที่ตรงกัน!',
      content: (requirementTitle: string, propertyTitle: string, compatibility: number) => `ความต้องการใหม่ "${requirementTitle}" ตรงกับอสังหาริมทรัพย์ "${propertyTitle}" ของคุณ ${Math.round(compatibility)}%!`
    },
    'requirement_match_multiple': {
      title: (count: number) => `🔍 ${count} อสังหาริมทรัพย์ตรงกับความต้องการใหม่!`,
      content: (requirementTitle: string, topCompatibility: number) => `อสังหาริมทรัพย์ของคุณตรงกับความต้องการใหม่ "${requirementTitle}" ความเข้ากันได้สูงสุด: ${Math.round(topCompatibility)}%`
    },
    
    // Verification notifications
    'verification_approved': {
      title: 'การยืนยันความเป็นเจ้าของอสังหาริมทรัพย์ได้รับการอนุมัติ',
      content: (propertyTitle: string) => `การยืนยันความเป็นเจ้าของสำหรับ "${propertyTitle}" ได้รับการอนุมัติแล้ว`
    },
    'verification_rejected': {
      title: 'การยืนยันความเป็นเจ้าของอสังหาริมทรัพย์ถูกปฏิเสธ',
      content: (propertyTitle: string, reason?: string) => `การยืนยันความเป็นเจ้าของสำหรับ "${propertyTitle}" ถูกปฏิเสธ เหตุผล: ${reason || 'เอกสารไม่ตรงตามข้อกำหนดการยืนยัน'}`
    },
    'verification_request': {
      title: 'คำขอยืนยันความเป็นเจ้าของใหม่',
      content: (propertyTitle: string) => `มีคำขอยืนยันอสังหาริมทรัพย์ใหม่สำหรับ "${propertyTitle}"`
    },
    
    // Message notifications
    'message': {
      title: 'ข้อความใหม่',
      content: (subject: string) => `คุณมีข้อความใหม่เกี่ยวกับ ${subject}`
    }
  }
};

export interface NotificationTranslationParams {
  type: string;
  subtype?: string;
  propertyTitle?: string;
  requirementTitle?: string;
  matchCount?: number;
  compatibility?: number;
  compatibilityScore?: number;
  propertyTitles?: string;
  topCompatibility?: number;
  reason?: string;
  subject?: string;
  count?: number;
  validationUrl?: string;
}

export function getNotificationContent(
  language: 'en' | 'th',
  params: NotificationTranslationParams
): NotificationContent {
  const lang = translations[language] || translations.en;
  
  // Build the key based on type and subtype
  let key = params.type;
  if (params.subtype) {
    key += `_${params.subtype}`;
  }
  
  const template = lang[key as keyof typeof lang];
  
  if (!template) {
    // Fallback to English if translation not found
    console.warn(`No translation found for ${key} in ${language}, falling back to English`);
    const englishTemplate = translations.en[key as keyof typeof translations.en];
    if (!englishTemplate) {
      return {
        title: 'Notification',
        content: 'You have a new notification'
      };
    }
    return getContentFromTemplate(englishTemplate, params);
  }
  
  return getContentFromTemplate(template, params);
}

function getContentFromTemplate(template: any, params: NotificationTranslationParams): NotificationContent {
  // Handle dynamic titles (functions)
  if (typeof template.title === 'function') {
    return {
      title: template.title(params.count || 1),
      content: template.content(
        params.propertyTitles || params.propertyTitle || '',
        params.topCompatibility || params.compatibility || 0
      )
    };
  }
  
  // Handle different notification types
  // Handle specific notification types with their required parameters
  if (params.type === 'property_match' && params.subtype === 'single') {
    return {
      title: template.title,
      content: template.content(
        params.propertyTitle || '',
        params.requirementTitle || '',
        params.compatibilityScore || 0
      )
    };
  }
  
  if (params.type === 'requirement_match' && params.subtype === 'single') {
    return {
      title: template.title,
      content: template.content(
        params.requirementTitle || '',
        params.propertyTitle || '',
        params.compatibilityScore || 0
      )
    };
  }
  
  return {
    title: template.title,
    content: typeof template.content === 'function' 
      ? template.content(
          params.propertyTitle || params.requirementTitle || params.subject || '',
          params.validationUrl || params.reason || ''
        )
      : template.content
  };
}