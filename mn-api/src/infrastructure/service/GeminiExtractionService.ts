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
            gender: { type: SchemaType.STRING, description: "Gender. Exactly 'Male' or 'Female'" },
            maritalStatus: { type: SchemaType.STRING, description: "Marital Status, e.g., 'Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'" },
            height: { type: SchemaType.STRING, description: "Height of the candidate (e.g. 5' 8\" or 173 cm)" },
            location: { type: SchemaType.STRING, description: "Location, place, city, or address (e.g. Tirur - Kalad)" },
            mobileNumber: { type: SchemaType.STRING, description: "Mobile phone number with or without country code" },
            highestEducation: { type: SchemaType.STRING, description: "Highest education qualification (e.g. MBA, B.Tech, etc.)" },
            professionType: { type: SchemaType.STRING, description: "Profession or job title (e.g. Executive Manager, Software Engineer)" },
            workplace: { type: SchemaType.STRING, description: "Workplace, hospital, company, or organization details" },
            religion: { type: SchemaType.STRING, description: "Religion (e.g. Muslim)" },
            caste: { type: SchemaType.STRING, description: "Community, Caste, or Sect (e.g. Sunni, Mujahid, Shia)" },
            religiousness: { type: SchemaType.STRING, description: "Religiousness level (e.g. Religious, Very Religious, Moderate, Practicing)" },
            familyType: { type: SchemaType.STRING, description: "Family type (e.g. Nuclear, Joint)" },
            financialStatus: { type: SchemaType.STRING, description: "Financial status (e.g. Middle-class, Upper Middle-class, Affluent, Rich)" },
            familyValues: { type: SchemaType.STRING, description: "Family values (e.g. Orthodox / Traditional, Traditional, Moderate, Liberal)" },
            eatingHabits: { type: SchemaType.STRING, description: "Eating habits (e.g. Any, Vegetarian, Non-Vegetarian)" },
            smokingHabits: { type: SchemaType.STRING, description: "Smoking habits (e.g. No, Yes, Occasionally)" },
            drinkingHabits: { type: SchemaType.STRING, description: "Drinking habits (e.g. No, Yes, Occasionally)" },
            interestedActivities: { type: SchemaType.STRING, description: "Interested activities, hobbies, sports, or interests" },
            personalDescription: { type: SchemaType.STRING, description: "Personal description or about me bio text" }
          },
          required: ["fullName"]
        }
      }
    });

    const prompt = `Extract all profile and registration details from this matrimonial profile document, official identity card, or campaign registration template form.
Fields to extract carefully:
1. Full Name: Candidate's full name.
2. Date of Birth: Convert any format (e.g. 16-02-1993, 16/02/1993, 16 Feb 1993) to strict YYYY-MM-DD format (e.g. 1993-02-16).
3. Gender: Infer or extract 'Male' or 'Female'.
4. Marital Status: e.g., 'Never Married', 'Divorced', 'Widowed'.
5. Height: e.g. 5' 8", 173 cm.
6. Location: e.g. Tirur - Kalad.
7. Mobile Number: Clean mobile number (e.g. +91 9645778450 or 9645778450).
8. Highest Education: e.g. MBA, BTech, Degree.
9. Profession Type: e.g. Executive Manager, Business.
10. Workplace Details: e.g. Bangalore Manipal Hospital.
11. Religion: e.g. Muslim.
12. Community / Caste: e.g. Sunni.
13. Religiousness Level: e.g. Religious.
14. Family Type: e.g. Nuclear.
15. Financial Status: e.g. Middle-class.
16. Family Values: e.g. Orthodox / Traditional.
17. Eating Habits: e.g. Any, Vegetarian, Non-Vegetarian.
18. Smoking & Drinking: If the document says 'Smoking / Drinking No / No', extract smokingHabits as 'No' and drinkingHabits as 'No'.
19. Interested Activities: e.g. Reading, Travelling, etc.
20. Personal Description: Description or bio (if 'Not specified', keep as 'Not specified' or empty string).

Return the exact JSON schema requested. If any field is not found or not mentioned, provide an empty string.`;

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
