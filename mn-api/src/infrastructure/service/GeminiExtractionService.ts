import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export class GeminiExtractionService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn("GEMINI_API_KEY environment variable is not defined.");
    }
  }

  async extractIdData(base64Data: string, mimeType: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            fullName: { type: SchemaType.STRING, description: "Full Name of the candidate" },
            dateOfBirth: { type: SchemaType.STRING, description: "Date of birth in YYYY-MM-DD format" },
            gender: { type: SchemaType.STRING, description: "Gender. Choose exactly 'Male' or 'Female'" },
            mobileNumber: { type: SchemaType.STRING, description: "10-digit mobile number found on document (clean without country code)" },
            address: { type: SchemaType.STRING, description: "Location, city, place, or full address of candidate" },
            caste: { type: SchemaType.STRING, description: "Caste/sect if mentioned, or Sunni/Shia/etc. if inferred" }
          },
          required: ["fullName"]
        }
      }
    });

    const prompt = "Extract the following details from this official identity document or registration template form. Return them in the exact JSON schema requested. If a field cannot be found, set it to an empty string. Clean the mobile number to remove any spaces or non-digit characters except the + prefix.";

    // Convert base64 data to inline part for Gemini
    const base64Clean = base64Data.replace(/^data:.*?;base64,/, "");
    const filePart = {
      inlineData: {
        data: base64Clean,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text, e);
      throw new Error("Failed to parse extracted identity data.");
    }
  }
}
export default GeminiExtractionService;
