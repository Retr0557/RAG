

// This file simulates a RAG pipeline on the client-side.
// In a production environment, this would be handled by a server
// with libraries like LangChain, FAISS, and TensorFlow/PyTorch.

declare const pdfjsLib: any;

/**
 * Extracts text from a PDF file.
 * @param file The PDF file.
 * @returns A promise that resolves to the full text content of the PDF.
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(' ');
  }

  return fullText;
};

/**
 * Splits text into overlapping chunks.
 * This is a simplified chunking strategy.
 * @param text The text to chunk.
 * @param chunkSize The approximate size of each chunk.
 * @param overlap The number of characters to overlap between chunks.
 * @returns An array of text chunks.
 */
const chunkText = (text: string, chunkSize = 1000, overlap = 200): string[] => {
  const chunks: string[] = [];
  if (!text) return chunks;

  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
    if (i < 0) i = end; // Ensure forward progress
  }
  return chunks;
};

/**
 * Processes a PDF file by extracting its text and splitting it into chunks.
 * @param file The PDF file.
 * @returns A promise that resolves to an array of text chunks.
 */
export const processPdf = async (file: File): Promise<string[]> => {
  const text = await extractTextFromPdf(file);
  const chunks = chunkText(text);
  return chunks;
};

/**
 * "Retrieves" relevant chunks based on a simple keyword search.
 * This simulates the retrieval step of a RAG pipeline.
 * @param query The user's query.
 * @param chunks The array of all text chunks from the document.
 * @param count The number of chunks to return.
 * @returns An array of the most relevant chunks.
 */
// Fix: Add optional 'count' parameter to fix "Expected 2 arguments, but got 3" error from App.tsx.
export const getRelevantChunks = (query: string, chunks: string[], count = 5): string[] => {
  if (!query.trim()) {
    // For empty queries (like for generating sample questions), just return the first chunks.
    return chunks.slice(0, count);
  }

  const queryKeywords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const chunkWords = new Set(chunk.toLowerCase().split(/\s+/));
    for (const keyword of queryKeywords) {
      if (chunkWords.has(keyword)) {
        score++;
      }
    }
    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  // Return the top N most relevant chunks or chunks with a score > 0
  const topChunks = scoredChunks.filter(c => c.score > 0).slice(0, count);
  
  if (topChunks.length === 0 && chunks.length > 0) {
      // Fallback: if no keywords match, return the first few chunks
      return chunks.slice(0, 3);
  }

  return topChunks.map(c => c.chunk);
};