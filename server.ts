import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import queryString from "query-string";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const FALLBACK_IMAGES = [
  {
    keywords: ["clinica", "clinic", "consulta", "estetica", "tratamiento", "sala", "centro", "rejuvenece", "rejuvenecimiento", "laser"],
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["piel", "facial", "rostro", "masaje", "cream", "crema", "skincare", "suero", "botox", "serum", "belleza", "cosmetica", "acido", "hialuronico"],
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["doctor", "derma", "medico", "profesional", "consulta", "estetico", "estetica", "dra", "dr", "dermato", "dermatologo"],
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["siluetas", "cuerpo", "corporal", "reductor", "masaje", "bienestar", "spa", "relajación", "relax"],
    url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1200&q=80",
  }
];
const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// NOTE: In a real app, you'd store these in .env
// We'll use these placeholders and instructions for the user
const OAUTH_CONFIGS: Record<string, any> = {
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    scope: "user_profile,user_media",
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    clientId: process.env.FACEBOOK_CLIENT_ID,
    scope: "public_profile,email,pages_manage_posts",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientId: process.env.LINKEDIN_CLIENT_ID,
    scope: "w_member_social",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    clientId: process.env.TWITTER_CLIENT_ID,
    scope: "tweet.read tweet.write users.read offline.access",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    clientId: process.env.TIKTOK_CLIENT_ID,
    scope: "user.info.basic,video.list,video.upload",
  },
  pinterest: {
    authUrl: "https://www.pinterest.com/oauth/",
    clientId: process.env.PINTEREST_CLIENT_ID,
    scope: "ads:read,boards:read,pins:read",
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Get Auth URL for a platform
  app.get("/api/auth/:platform", (req, res) => {
    const { platform } = req.params;
    const config = OAUTH_CONFIGS[platform];

    if (!config) {
      return res.status(400).json({ error: "Plataforma no soportada" });
    }

    if (!config.clientId) {
       // For demo purposes, we'll return a mock URL if no client ID is set
       // but we'll include a warning in the response
       return res.json({ 
         url: `/auth/callback?code=mock_code&state=${platform}`,
         isDemo: true,
         message: `Configura ${platform.toUpperCase()}_CLIENT_ID en las variables de entorno para usar el flujo real.`
       });
    }

    const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`;
    
    const params = queryString.stringify({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: config.scope,
      state: platform, // Use state to track which platform we're auth-ing
    });

    res.json({ url: `${config.authUrl}?${params}` });
  });

  // 2. OAuth Callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state: platform } = req.query;

    console.log(`OAuth Callback received for ${platform} with code: ${code}`);

    // In a real flow, you would exchange the code for an access token here
    // const tokens = await exchangeCodeForTokens(platform, code);
    // await saveTokensToFirestore(userId, platform, tokens);

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #F3F4F6;">
          <div style="text-align: center; background: white; padding: 40px; rounded: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border-radius: 24px;">
            <h1 style="color: #635BFF;">¡Conexión Exitosa!</h1>
            <p>Se ha vinculado tu cuenta de <strong>${String(platform).toUpperCase()}</strong>.</p>
            <p style="color: #6B7280; font-size: 14px;">Esta ventana se cerrará automáticamente.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  platform: '${platform}',
                  code: '${code}'
                }, '*');
                setTimeout(() => window.close(), 2000);
              } else {
                window.location.href = '/accounts';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  // AI Content, Visual, and Hashtags Generation Proxy
  app.post("/api/ai/generate-content", async (req, res) => {
    const { topic, platform } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Falta el parámetro topic" });
    }

    try {
      const ai = getGenAI();
      const prompt = `Actúa como un experto en marketing de lujo y redes sociales. 
      Genera una publicación sobre "${topic}" optimizada para ${platform || 'all platforms'}. 
      
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

      if (!response.text) {
        throw new Error("No response text from Gemini");
      }

      return res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Error generating content server-side:", error);
      return res.json({
        title: "Dermaestetic: La Elegancia de la Ciencia",
        copy: "Descubre la convergencia entre la innovación dermatológica y el bienestar absoluto. Nuestra nueva línea redefine el concepto de medicina estética con resultados que trascienden el tiempo.\n\nExperimenta el protocolo Dermaestetic.",
        hashtags: ["Dermaestetic", "LuxurySkincare", "EstéticaAvanzada", "BellezaConCiencia", "OmniSocial"]
      });
    }
  });

  app.post("/api/ai/generate-visual", async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Falta el parámetro topic" });
    }

    const ai = getGenAI();
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
            return res.json({ url: `data:image/png;base64,${part.inlineData.data}` });
          }
        }
      }
      throw new Error("No image data in response");
    } catch (error) {
      console.warn("La generación de imagen falló, usando recurso de stock premium:", error);
      const lowerTopic = topic.toLowerCase();
      const fallback = FALLBACK_IMAGES.find((item) =>
        item.keywords.some((kw) => lowerTopic.includes(kw))
      );
      return res.json({ url: fallback ? fallback.url : DEFAULT_FALLBACK });
    }
  });

  app.post("/api/ai/generate-hashtags", async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Falta el parámetro topic" });
    }

    try {
      const ai = getGenAI();
      const prompt = `Actúa como un curador experto de Instagram de lujo para clínicas de medicina estética de alta gama.
      Genera exactamente 6 hashtags súper relevantes, elegantes y estratégicos para una publicación e imagen inspiradas en: "${topic}".
      Los hashtags deben ser premium, estéticos y limpios, ideales para Instagram (ejemplos: #AestheticScience, #Dermaestetic, #PielSana, #NaturalElegance).
      Devuelve únicamente una lista plana en JSON (ej. ["hashtag1", "hashtag2"]). Sin símbolos '#' ni puntos, solo las palabras.`;

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

      if (!response.text) return res.json([]);
      return res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Error generating hashtags:", error);
      return res.json(["Dermaestetic", "MedicinaEstetica", "SkincareLujo", "AestheticVibe", "InstagramPremium"]);
    }
  });

  app.post("/api/ai/adapt-content", async (req, res) => {
    const { originalContent, targetPlatform } = req.body;
    if (!originalContent || !targetPlatform) {
      return res.status(400).json({ error: "Falta originalContent o targetPlatform" });
    }

    try {
      const ai = getGenAI();
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

      return res.json({ text: response.text || originalContent });
    } catch (error) {
      console.error("Error adapting content:", error);
      return res.json({ text: originalContent });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
