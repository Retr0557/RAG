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
You are a helpful assistant that answers questions based on the provided document context.
Your goal is to provide a clear and concise answer using ONLY the information from the context below.
Format your answer using markdown where appropriate (e.g., lists, bolding).
If the answer cannot be found in the context, state that you cannot find the answer in the provided document.
Do not use any external knowledge.

--- CONTEXT ---
${context}
--- END CONTEXT ---

QUESTION: ${query}

ANSWER:
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