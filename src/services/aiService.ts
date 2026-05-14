import { GoogleGenAI, Type } from "@google/genai";

export interface AISuggestion {
  copy: string;
  hashtags: string[];
  title: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  prompt: string;
}

export async function generateSocialContent(topic: string, platform: string): Promise<AISuggestion> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Actúa como un experto en marketing de lujo y redes sociales. 
  Genera una publicación sobre "${topic}" optimizada para ${platform}. 
  
  El tono debe ser de ALTA GAMA, ELEGANTE y SOFISTICADO. 
  Evita clichés baratos. Usa un lenguaje evocador, minimalista y premium. 
  
  Proporciona un título elegante, el copy principal y una lista de 5 hashtags exclusivos. 
  Genera todo el contenido en español.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          copy: { type: Type.STRING },
          hashtags: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "copy", "hashtags"]
      }
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as AISuggestion;
}

export async function generateAIVisual(topic: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // First, generate a highly aesthetic prompt for the image
  const promptRequest = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a professional, high-end, editorial photography prompt for a social media image about: "${topic}". 
    The style should be: Minimalist, Luxury, Clean, High-fashion, Aesthetic. 
    Focus on lighting, texture, and a premium color palette. 
    Output only the prompt in English.`,
  });

  const refinedPrompt = promptRequest.text || `High-end minimalist editorial photography of ${topic}, luxury aesthetic, clean lighting, premium textures.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: refinedPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "4:5",
      }
    }
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("Failed to generate image parts");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data found in AI response");
}

export async function adaptContent(originalContent: string, targetPlatform: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Adapt the following content for ${targetPlatform}:
  
  "${originalContent}"
  
  Keep the same core message but optimize the tone and length for the platform. Keep the language as the original.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || originalContent;
}
