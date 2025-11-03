// Fix: Import 'Type' for responseSchema
import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


/**
 * Generates an answer from the Gemini model in a streaming fashion.
 * @param query The user's question.
 * @param context The relevant text chunks from the document.
 * @param onStreamChunk Callback function to handle each incoming chunk of text.
 * @returns A promise that resolves when the stream is complete.
 */
export const generateAnswerStream = async (
    query: string, 
    context: string,
    onStreamChunk: (chunk: string) => void
): Promise<void> => {
  const genAI = getAi();
  
  const model = "gemini-2.5-flash";

  const prompt = `
You are an intelligent document assistant. Your task is to answer questions and perform tasks based on the provided document context.
You should be flexible. You can answer direct questions, summarize sections, format data into tables or lists, and provide interpretations of the content.
Base your responses primarily on the information given in the context below. However, you can use your general knowledge to better interpret the text and format your answer effectively.
Always aim to be helpful and clear. Use markdown for formatting when it enhances readability (e.g., tables, lists, bold text).

--- CONTEXT ---
${context}
--- END CONTEXT ---

USER REQUEST: ${query}

RESPONSE:
`;

  try {
    const responseStream = await genAI.models.generateContentStream({
      model: model,
      contents: prompt,
    });
    
    for await (const chunk of responseStream) {
        onStreamChunk(chunk.text);
    }

  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to get response from Gemini API.");
  }
};


/**
 * Generates a few sample questions based on the document context.
 * @param context The relevant text chunks from the document.
 * @returns A promise that resolves to an array of question strings.
 */
export const generateSampleQuestions = async (context: string): Promise<string[]> => {
    const genAI = getAi();
    const model = "gemini-2.5-flash";

    // Fix: Refactor to use responseSchema for robust JSON generation, following Gemini API guidelines.
    const prompt = `
Based on the following document context, generate 3 concise and distinct questions that a user might ask.

--- CONTEXT ---
${context}
--- END CONTEXT ---
`;
    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A potential user question about the document."
                    },
                },
            },
        });

        const text = response.text.trim();
        const questions = JSON.parse(text);
        return Array.isArray(questions) ? questions.slice(0, 3) : [];
    } catch (error) {
        console.error("Error generating sample questions:", error);
        // Return an empty array or default questions on failure
        return [];
    }
};