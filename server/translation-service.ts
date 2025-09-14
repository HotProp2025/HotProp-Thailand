import OpenAI from "openai";

// Language detection helper
function detectLanguage(text: string): 'en' | 'th' {
  // Simple Thai script detection - if it contains Thai characters, it's Thai
  const thaiPattern = /[\u0E00-\u0E7F]/;
  return thaiPattern.test(text) ? 'th' : 'en';
}

interface TranslationResult {
  originalText: string;
  originalLanguage: 'en' | 'th';
  englishText: string;
  thaiText: string;
}

class TranslationService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async translateText(text: string): Promise<TranslationResult> {
    const originalLanguage = detectLanguage(text);
    
    // If no OpenAI API key, return original text for both languages
    if (!this.openai) {
      console.warn('OpenAI API key not found. Translation service disabled.');
      return {
        originalText: text,
        originalLanguage,
        englishText: originalLanguage === 'en' ? text : text,
        thaiText: originalLanguage === 'th' ? text : text,
      };
    }

    try {
      let englishText = text;
      let thaiText = text;

      // If original is Thai, translate to English
      if (originalLanguage === 'th') {
        const englishResponse = await this.openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a professional Thai-English translator specializing in real estate content. Translate the given Thai text to natural, fluent English while preserving the meaning and tone. Respond only with the translation, no additional text."
            },
            {
              role: "user",
              content: text
            }
          ],
        });
        englishText = englishResponse.choices[0].message.content?.trim() || text;
      }
      // If original is English, translate to Thai
      else {
        const thaiResponse = await this.openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a professional English-Thai translator specializing in real estate content. Translate the given English text to natural, fluent Thai while preserving the meaning and tone. Respond only with the translation, no additional text."
            },
            {
              role: "user",
              content: text
            }
          ],
        });
        thaiText = thaiResponse.choices[0].message.content?.trim() || text;
      }

      return {
        originalText: text,
        originalLanguage,
        englishText,
        thaiText,
      };
    } catch (error) {
      console.error('Translation failed:', error);
      // Fallback to original text if translation fails
      return {
        originalText: text,
        originalLanguage,
        englishText: originalLanguage === 'en' ? text : text,
        thaiText: originalLanguage === 'th' ? text : text,
      };
    }
  }

  async translateProperty(title: string, description?: string) {
    const titleTranslation = await this.translateText(title);
    let descriptionTranslation = null;
    
    if (description && description.trim()) {
      descriptionTranslation = await this.translateText(description);
    }

    return {
      title: titleTranslation.originalText,
      titleEn: titleTranslation.englishText,
      titleTh: titleTranslation.thaiText,
      description: description || null,
      descriptionEn: descriptionTranslation?.englishText || null,
      descriptionTh: descriptionTranslation?.thaiText || null,
    };
  }
}

export const translationService = new TranslationService();