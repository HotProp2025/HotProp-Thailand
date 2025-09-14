import { db } from "./db";
import { properties, buyerRequirements } from "@shared/schema";
import { translationService } from "./translation-service";
import { eq, isNull, or } from "drizzle-orm";

/**
 * Script to translate existing properties and buyer requirements
 * Run this after adding an OpenAI API key to translate existing content
 */
export async function translateExistingContent() {
  console.log("Starting translation of existing content...");
  
  try {
    // Find properties without translations
    const untranslatedProperties = await db
      .select()
      .from(properties)
      .where(
        or(
          isNull(properties.titleEn),
          isNull(properties.titleTh)
        )
      );

    console.log(`Found ${untranslatedProperties.length} properties to translate`);

    // Translate properties
    for (const property of untranslatedProperties) {
      try {
        console.log(`Translating property: ${property.title}`);
        
        const translations = await translationService.translateProperty(
          property.title,
          property.description || undefined
        );

        await db
          .update(properties)
          .set({
            titleEn: translations.titleEn,
            titleTh: translations.titleTh,
            descriptionEn: translations.descriptionEn,
            descriptionTh: translations.descriptionTh,
          })
          .where(eq(properties.id, property.id));

        console.log(`✓ Translated property: ${property.title}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to translate property ${property.id}:`, error);
      }
    }

    // Find buyer requirements without translations
    const untranslatedRequirements = await db
      .select()
      .from(buyerRequirements)
      .where(
        or(
          isNull(buyerRequirements.titleEn),
          isNull(buyerRequirements.titleTh)
        )
      );

    console.log(`Found ${untranslatedRequirements.length} buyer requirements to translate`);

    // Translate buyer requirements
    for (const requirement of untranslatedRequirements) {
      try {
        console.log(`Translating requirement: ${requirement.title}`);
        
        const translations = await translationService.translateProperty(
          requirement.title,
          requirement.description || undefined
        );

        await db
          .update(buyerRequirements)
          .set({
            titleEn: translations.titleEn,
            titleTh: translations.titleTh,
            descriptionEn: translations.descriptionEn,
            descriptionTh: translations.descriptionTh,
          })
          .where(eq(buyerRequirements.id, requirement.id));

        console.log(`✓ Translated requirement: ${requirement.title}`);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to translate requirement ${requirement.id}:`, error);
      }
    }

    console.log("Translation complete!");
    return {
      propertiesTranslated: untranslatedProperties.length,
      requirementsTranslated: untranslatedRequirements.length
    };
    
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  translateExistingContent()
    .then((result) => {
      console.log(`Successfully translated ${result.propertiesTranslated} properties and ${result.requirementsTranslated} requirements`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Translation failed:", error);
      process.exit(1);
    });
}