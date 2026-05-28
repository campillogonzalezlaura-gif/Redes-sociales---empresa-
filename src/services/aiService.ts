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

const FALLBACK_IMAGES = [
  {
    keywords: ["clinica", "clinic", "consulta", "estetica", "tratamiento", "sala", "centro", "rejuvenece", "rejuvenecimiento", "laser"],
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80", // Luxury medical aesthetic room
  },
  {
    keywords: ["piel", "facial", "rostro", "masaje", "cream", "crema", "skincare", "suero", "botox", "serum", "belleza", "cosmetica", "acido", "hialuronico"],
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80", // Premium skincare bottles
  },
  {
    keywords: ["doctor", "derma", "medico", "profesional", "consulta", "estetico", "estetica", "dra", "dr", "dermato", "dermatologo"],
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80", // Professional doctor/aesthetic doctor
  },
  {
    keywords: ["siluetas", "cuerpo", "corporal", "reductor", "masaje", "bienestar", "spa", "relajación", "relax"],
    url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80", // Relaxing body/wellness
  }
];

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"; // Abstract premium ambient texture

export async function generateSocialContent(topic: string, platform: string): Promise<AISuggestion> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Actúa como un experto en marketing de lujo y redes sociales. 
  Genera una publicación sobre "${topic}" optimizada para ${platform}. 
  
  El tono debe ser de ALTA GAMA, ELEGANTE y SOFISTICADO. 
  Evita clichés baratos. Usa un lenguaje evocador, minimalista y premium. 
  Sé extremadamente conciso. El texto debe ser corto, impactante y directo.
  
  Incluye emojis elegantes y pertinentes que complementen el texto sin saturarlo.
  
  Proporciona un título elegante, el copy principal y una lista de 5 hashtags exclusivos. 
  Genera todo el contenido en español.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
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
  
  let refinedPrompt = `High-end minimalist editorial photography of ${topic}, luxury aesthetic, clean lighting, premium textures.`;
  
  try {
    const promptRequest = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a professional, high-end, editorial photography prompt for a social media image about: "${topic}". 
      The style should be: Minimalist, Luxury, Clean, High-fashion, Aesthetic. 
      Focus on lighting, texture, and a premium color palette. 
      Output only the prompt in English.`,
    });
    if (promptRequest.text) {
      refinedPrompt = promptRequest.text;
    }
  } catch (err) {
    console.warn("Could not refine prompt via Gemini 3.5, using basic prompt.", err);
  }

  try {
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

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in AI response");
  } catch (error) {
    console.warn("La generación de imagen falló (típico con claves gratuitas de Gemini), usando recurso estético de stock premium:", error);
    
    // Select a premium stock photo matching the topic
    const lowerTopic = topic.toLowerCase();
    const fallback = FALLBACK_IMAGES.find((item) =>
      item.keywords.some((kw) => lowerTopic.includes(kw))
    );
    
    return fallback ? fallback.url : DEFAULT_FALLBACK;
  }
}

export async function adaptContent(originalContent: string, targetPlatform: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Adapt the following content for ${targetPlatform}:
  
  "${originalContent}"
  
  Keep the same core message but optimize the tone and length for the platform. 
  Make it shorter and more concise.
  Include relevant emojis that match the text.
  Keep the language as the original.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  return response.text || originalContent;
}

export async function generateHashtagsForImage(topic: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Actúa como un curador experto de Instagram de lujo para clínicas de medicina estética de alta gama.
  Genera exactamente 6 hashtags súper relevantes, elegantes y estratégicos para una publicación e imagen inspiradas en: "${topic}".
  Los hashtags deben ser premium, estéticos y limpios, ideales para Instagram (ejemplos: #AestheticScience, #Dermaestetic, #PielSana, #NaturalElegance).
  Devuelve únicamente una lista plana en JSON (ej. ["hashtag1", "hashtag2"]). Sin símbolos '#' ni puntos, solo las palabras.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text) as string[];
  } catch (error) {
    console.error("Error generating hashtags:", error);
    return ["Dermaestetic", "MedicinaEstetica", "SkincareLujo", "AestheticVibe", "InstagramPremium"];
  }
}

