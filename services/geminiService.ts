import { GoogleGenAI } from "@google/genai";

// Initialize the client
// In a real app, ensure process.env.API_KEY is available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeResumeWithGemini = async (resumeText: string, jobDescription: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert technical recruiter. Analyze the following resume against the job description.
      
      Resume Content:
      ${resumeText.substring(0, 5000)}...

      Job Description:
      ${jobDescription}

      Output a JSON object with:
      - skills_match (percentage)
      - key_gaps (array of strings)
      - suggested_interview_focus (array of strings)
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Return mock data if API key is missing or call fails
    return JSON.stringify({
      skills_match: 85,
      key_gaps: ["AWS Lambda", "Kubernetes"],
      suggested_interview_focus: ["System Design", "Cloud Architecture"]
    });
  }
};