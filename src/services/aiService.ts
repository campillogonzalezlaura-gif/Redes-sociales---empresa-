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
  try {
    const res = await fetch("/api/ai/generate-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic, platform })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error in generateSocialContent proxy:", error);
    return {
      title: "Dermaestetic: La Elegancia de la Ciencia",
      copy: "Descubre la convergencia entre la innovación dermatológica y el bienestar absoluto. Nuestra nueva línea redefine el concepto de medicina estética con resultados que trascienden el tiempo.\n\nExperimenta el protocolo Dermaestetic.",
      hashtags: ["Dermaestetic", "LuxurySkincare", "EstéticaAvanzada", "BellezaConCiencia", "OmniSocial"]
    };
  }
}

export async function generateAIVisual(topic: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/generate-visual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.url;
  } catch (error) {
    console.error("Error in generateAIVisual proxy:", error);
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";
  }
}

export async function adaptContent(originalContent: string, targetPlatform: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/adapt-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ originalContent, targetPlatform })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.text || originalContent;
  } catch (error) {
    console.error("Error in adaptContent proxy:", error);
    return originalContent;
  }
}

export async function generateHashtagsForImage(topic: string): Promise<string[]> {
  try {
    const res = await fetch("/api/ai/generate-hashtags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error in generateHashtagsForImage proxy:", error);
    return ["Dermaestetic", "MedicinaEstetica", "SkincareLujo", "AestheticVibe", "InstagramPremium"];
  }
}
