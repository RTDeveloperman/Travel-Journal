
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { HistoricalEvent } from "../types";

const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};


export const generateTravelReflection = async (locationName: string, notes: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API key is not available. Skipping AI reflection.");
    return "AI reflection could not be generated (API key missing).";
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a poetic travel writer. Write a short, evocative, and reflective journal snippet about a visit to a place called "${locationName}".
The traveler left these personal notes: "${notes}".
Craft a reflection (2-3 sentences max) that captures the essence or feeling of being there, as if it's a personal memory.
Do not use markdown formatting. Just plain text.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });
    
    const text = response.text;
    if (text && text.trim().length > 0) {
      return text.trim();
    } else {
      return "The AI pondered but found no words for this place.";
    }

  } catch (error: any) {
    console.error("Error generating travel reflection with Gemini:", error);
    if (error.message && error.message.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please check your Gemini API key.");
    }
    throw new Error(`AI reflection generation failed: ${error.message || 'Unknown error'}`);
  }
};

export const generateHistoricalEventsTour = async (countryName: string, userDateOfBirth?: string): Promise<HistoricalEvent[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("کلید Gemini API برای دریافت تور وقایع موجود نیست.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let birthYearInfo = "";
  let birthYear = null;
  if (userDateOfBirth) {
    const yearMatch = userDateOfBirth.match(/^(\d{4})/);
    if (yearMatch && yearMatch[1]) {
      birthYear = yearMatch[1];
      birthYearInfo = `The user was born in ${birthYear}. Please focus on real historical events that occurred from that year onwards.`;
    }
  }

  const iranianEventsExamples = `
  For ${countryName} (if it's Iran or a similar context), consider including real historical events like:
  - شهادت حاج قاسم سلیمانی
  - شروع جنگ ایران و عراق
  - مرگ هاشمی رفسنجانی
  - شروع همه گیری کرونا
  - اعتراضات سال ۸۸ و ۹۶
  - توافق هسته ای
  - ترور سید حسن نصرالله
  - ترور اسماعیل هنیه
  `;
  
  const persianCategoriesExamples = `"بهداشت و سلامت", "نظامی", "سیاسی", "حوادث", "تحولات منطقه", "فرهنگی", "اقتصادی", "علمی و فناوری"`;

  const prompt = `
You are a historical archivist. Generate a comprehensive list of significant real historical and cultural events.
All text output (titles, descriptions, and categories) MUST be in PERSIAN.
${birthYearInfo}

For the period starting from the user's birth year ${birthYear ? `(${birthYear})` : ''} up to the present, provide:
1.  For **${countryName}**: Aim to provide a diverse selection of events, targeting around **10-15 significant events** spread across these years. ${countryName.toLowerCase() === 'iran' ? iranianEventsExamples : ''}
2.  For **World Events**: Similarly, provide around **5-10 significant global events** spread across these years.

This means a total of approximately 15-25 events.
Strive for a good distribution of events across the years. While not strictly two events for every single year, ensure a richer and more numerous selection than just a few key highlights.

For each event, provide:
1.  A "title" in Persian.
2.  A brief 1-2 sentence "description" in Persian.
3.  An "eventYearOrPeriod" (e.g., "1953", "اواسط قرن هجدهم", "دهه ۱۳۷۰ شمسی", "2020"). This should be as specific as possible regarding the year.
4.  A "category" which is either "country" (for events specific to ${countryName}) or "world".
5.  A "persianCategory" which is a thematic category in Persian. Choose from these examples or create other relevant Persian categories: ${persianCategoriesExamples}.

Ensure all events are real historical events.
Respond ONLY with a valid JSON array of objects. Each object must have the keys: "title", "description", "eventYearOrPeriod", "category", and "persianCategory".

Example (general structure, content should be Persian):
[
  { "title": "انقلاب مشروطه ایران", "description": "این انقلاب در اوایل قرن بیستم منجر به تشکیل مجلس در ایران شد.", "eventYearOrPeriod": "۱۹۰۵-۱۹۱۱", "category": "country", "persianCategory": "سیاسی" },
  { "title": "جنگ جهانی دوم", "description": "یک درگیری جهانی که اکثر کشورهای جهان را درگیر خود کرد.", "eventYearOrPeriod": "۱۹۳۹-۱۹۴۵", "category": "world", "persianCategory": "نظامی" }
]
Ensure the response is ONLY the JSON array.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, 
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData) && parsedData.every(item => 
        typeof item.title === 'string' &&
        typeof item.description === 'string' &&
        typeof item.eventYearOrPeriod === 'string' &&
        (item.category === 'country' || item.category === 'world' || item.category === 'general') && // Keep general for flexibility
        typeof item.persianCategory === 'string'
      )) {
        return parsedData as HistoricalEvent[];
      } else {
        console.error("Parsed JSON data does not match HistoricalEvent structure (including persianCategory):", parsedData);
        throw new Error("پاسخ هوش مصنوعی ساختار مورد انتظار برای وقایع تاریخی (شامل دسته‌بندی فارسی) را ندارد.");
      }
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini:", e, "Raw response:", jsonStr);
      throw new Error("خطا در تجزیه پاسخ JSON از هوش مصنوعی برای تور وقایع.");
    }
  } catch (error: any) {
    console.error("Error generating historical events tour with Gemini:", error);
     if (error.message && error.message.includes('API key not valid')) {
        throw new Error("کلید API نامعتبر است. لطفاً کلید Gemini API خود را بررسی کنید.");
    }
    throw new Error(`تولید تور وقایع توسط هوش مصنوعی با شکست مواجه شد: ${error.message || 'خطای ناشناخته'}`);
  }
};
