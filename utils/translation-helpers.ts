// Helper functions for displaying translated content based on user's language preference

// Import translation service for automatic translation fallback
import { apiRequest } from '@/lib/queryClient';

// Automatic translation cache to avoid repeated API calls
const translationCache: { [key: string]: { en: string; th: string } } = {};

// Simple language detection for text
function detectLanguage(text: string): 'en' | 'th' {
  // Thai characters range
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text) ? 'th' : 'en';
}

export function getLocalizedTitle(
  originalTitle: string,
  titleEn?: string | null,
  titleTh?: string | null,
  language: 'en' | 'th' = 'en'
): string {
  if (language === 'th' && titleTh) {
    return titleTh;
  }
  if (language === 'en' && titleEn) {
    return titleEn;
  }
  
  // If we need Thai but don't have it, and original is not Thai
  if (language === 'th' && !titleTh) {
    const detectedLang = detectLanguage(originalTitle);
    // If original is English and we need Thai, show original for now
    // (Auto-translation would require async operation which components can't handle)
    if (detectedLang === 'en') {
      return originalTitle;
    }
  }
  
  // If we need English but don't have it, and original is not English
  if (language === 'en' && !titleEn) {
    const detectedLang = detectLanguage(originalTitle);
    // If original is Thai and we need English, show original for now
    if (detectedLang === 'th') {
      return originalTitle;
    }
  }
  
  // Fallback to original title
  return originalTitle;
}

export function getLocalizedDescription(
  originalDescription?: string | null,
  descriptionEn?: string | null,
  descriptionTh?: string | null,
  language: 'en' | 'th' = 'en'
): string | null {
  if (!originalDescription) return null;
  
  if (language === 'th' && descriptionTh) {
    return descriptionTh;
  }
  if (language === 'en' && descriptionEn) {
    return descriptionEn;
  }
  
  // Similar fallback logic as titles
  if (language === 'th' && !descriptionTh) {
    const detectedLang = detectLanguage(originalDescription);
    if (detectedLang === 'en') {
      return originalDescription;
    }
  }
  
  if (language === 'en' && !descriptionEn) {
    const detectedLang = detectLanguage(originalDescription);
    if (detectedLang === 'th') {
      return originalDescription;
    }
  }
  
  // Fallback to original description
  return originalDescription;
}

// Comprehensive amenity translation function
export function translateAmenity(amenity: string, t: (key: string) => string): string {
  // Comprehensive database values mapping - includes both English and Thai values
  const amenityMap: { [key: string]: string } = {
    // Core amenities - English
    '24h Security': 'amenity.security24h',
    'Balcony': 'amenity.balcony',
    'Balcony with Seaview': 'amenity.balconyWithSeaview',
    'Car Park': 'amenity.carPark',
    'Children\'s Playground': 'amenity.childrenPlayground',
    'Communal Pool': 'amenity.communalPool',
    'Community Pool': 'amenity.communalPool',
    'Covered Car Park': 'amenity.coveredCarPark',
    'Double Car Park': 'amenity.doubleCarPark',
    'Fully furnished': 'amenity.fullyFurnished',
    'Garden': 'amenity.garden',
    'Garden View': 'amenity.gardenView',
    'Internet WiFi': 'amenity.internetWifi',
    'Laundry Facilities': 'amenity.laundryFacilities',
    'Near Beach': 'amenity.nearBeach',
    'Near Beach (<500mtr)': 'amenity.nearBeach',
    'Near Convenience St.': 'amenity.nearConvenience',
    'Near Convenience St. (<500mtr)': 'amenity.nearConvenience',
    'Near Hospital': 'amenity.nearHospital',
    'Near Hospital (<1km)': 'amenity.nearHospital',
    'Near Restaurants': 'amenity.nearRestaurants',
    'Near Restaurants (<500mtr)': 'amenity.nearRestaurants',
    'Near School': 'amenity.nearSchool',
    'Near School (<1km)': 'amenity.nearSchool',
    'Open Chimney': 'amenity.openChimney',
    'Pets OK': 'amenity.petsOk',
    'Pool 6*3mtrs': 'amenity.poolSpecific',
    'Private Bar': 'amenity.privateBar',
    'Private Pool': 'amenity.privatePool',
    'Quiet Location': 'amenity.quietLocation',
    'Sea View': 'amenity.seaView',
    'Mountain View': 'amenity.mountainView',
    'Lake View': 'amenity.lakeView',
    'Rooftop Terrace': 'amenity.rooftopTerrace',
    'Sauna': 'amenity.sauna',
    'Gym': 'amenity.gym',
    
    // Core amenities - Thai equivalents
    'รปภ. 24 ชม.': 'amenity.security24h',
    'ระเบียง': 'amenity.balcony',
    'ระเบียงวิวทะเล': 'amenity.balconyWithSeaview',
    'ที่จอดรถ': 'amenity.carPark',
    'สนามเด็กเล่น': 'amenity.childrenPlayground',
    'สระว่ายน้ำส่วนกลาง': 'amenity.communalPool',
    'ที่จอดรถมีหลังคา': 'amenity.coveredCarPark',
    'ที่จอดรถคู่': 'amenity.doubleCarPark',
    'เฟอร์นิเจอร์ครบ': 'amenity.fullyFurnished',
    'สวน': 'amenity.garden',
    'วิวสวน': 'amenity.gardenView',
    'อินเทอร์เน็ต/WiFi': 'amenity.internetWifi',
    'ห้องซักผ้า': 'amenity.laundryFacilities',
    'ใกล้ชายหาด': 'amenity.nearBeach',
    'ใกล้ร้านสะดวกซื้อ': 'amenity.nearConvenience',
    'ใกล้โรงพยาบาล': 'amenity.nearHospital',
    'ใกล้ร้านอาหาร': 'amenity.nearRestaurants',
    'ใกล้โรงเรียน': 'amenity.nearSchool',
    'เตาผิงเปิด': 'amenity.openChimney',
    'เลี้ยงสัตว์ได้': 'amenity.petsOk',
    'สระว่ายน้ำ 6x3 เมตร': 'amenity.poolSpecific',
    'บาร์ส่วนตัว': 'amenity.privateBar',
    'สระว่ายน้ำส่วนตัว': 'amenity.privatePool',
    'ทำเลเงียบ': 'amenity.quietLocation',
    'วิวทะเล': 'amenity.seaView',
    'วิวภูเขา': 'amenity.mountainView',
    'วิวทะเลสาบ': 'amenity.lakeView',
    'ดาดฟ้า': 'amenity.rooftopTerrace',
    'ซาวน่า': 'amenity.sauna',
    'ฟิตเนส': 'amenity.gym',
    
    // Additional variations and edge cases
    'WiFi': 'amenity.internetWifi',
    'Internet': 'amenity.internetWifi',
    'Playground': 'amenity.childrenPlayground',
    'Swimming Pool': 'amenity.communalPool',
    'Pool': 'amenity.communalPool',
    'Parking': 'amenity.carPark',
    'Security': 'amenity.security24h',
    'Furnished': 'amenity.fullyFurnished',
  };
  
  const translationKey = amenityMap[amenity];
  return translationKey ? t(translationKey) : amenity;
}

// Convert year to Thai Buddhist calendar (add 543 years)
export function formatYearForLanguage(year: number | string, language: 'en' | 'th'): string {
  const yearNum = typeof year === 'string' ? parseInt(year) : year;
  if (isNaN(yearNum)) return year.toString();
  
  if (language === 'th') {
    return (yearNum + 543).toString();
  }
  return yearNum.toString();
}