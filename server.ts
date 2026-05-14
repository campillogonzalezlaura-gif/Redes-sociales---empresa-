import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import queryString from "query-string";
import axios from "axios";

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
