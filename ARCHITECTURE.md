# Arquitectura y Estrategia OmniSocial (SocialSync)

Este documento detalla la visión técnica y comercial para escalar SocialSync a una plataforma SaaS de grado producción.

## 1. Arquitectura del Sistema
Hemos diseñado una arquitectura **Event-Driven** y **Serverless-First** para maximizar la escalabilidad.

### Frontend & Core
- **Framework:** Next.js 14+ (App Router) para SSR y optimización SEO.
- **State Management:** React Context + Firestore Real-time Listeners (para el dashboard).
- **Styling:** Tailwind CSS + Motion (Framer) para una experiencia fluida.

### Backend & Integración
- **Database:** Firebase Firestore (NoSQL) para baja latencia en lectura/escritura.
- **Media:** Cloudinary (Transformación dinámica de imágenes y almacenamiento optimizado).
- **AI Engine:** Gemini 1.5 Flash (Generación de contenido, hashtags y análisis de sentimiento).

---

## 2. Roadmap MVP (Mínimo Producto Viable)

| Fase | Enfoque | Entregables Clave |
| :--- | :--- | :--- |
| **Fase 1** | Cimientos | Auth (Google), Editor AI, Gestión de cuentas (Draft). |
| **Fase 2** | Conectividad | OAuth robusto con Instagram y LinkedIn, Subida de media. |
| **Fase 3** | Automatización | Programación (Scheduler), Colas con BullMQ, Notificaciones. |
| **Fase 4** | Inteligencia | Dashboard de Analíticas avanzado, Reportes PDF, Tiers de pago. |

---

## 3. Estructura del Proyecto
```bash
/src
  /components      # UI atómica (Editor, Calendar, Accounts)
  /services        # Lógica de negocio (aiService, socialAuth, postManager)
  /hooks           # Hooks personalizados (useAccounts, usePosts)
  /contexts        # Estados globales (Auth, Theme)
  /lib             # Configuraciones (Firebase, Cloudinary, Utils)
/workers           # Scripts independientes para BullMQ (Procesado de posts)
/docs              # Especificaciones técnicas y APIs
```

---

## 4. Conexión con APIs de Redes Sociales
La integración se basa en **OAuth 2.0**.

1. **Meta (FB/IG):** Requiere `App Review`. Se usa el `Graph API`. Flujo: `User Auth` -> `Long-lived Token` -> `Instagram Business Account ID`.
2. **LinkedIn:** Uso de `Member Shares API`. Necesario el scope `w_member_social`.
3. **X (Twitter):** API v2. Requiere cuenta `Basic` o `Pro` para publicar automáticamente.
4. **TikTok:** `Content Posting API`. Soporte para Single Video posts.

---

## 5. Sistema de Automatización (Publishing Engine)
Para garantizar puntualidad y resiliencia:

1. **Scheduling:** Al crear un post, se inserta en Firestore con `status: "scheduled"`.
2. **Queueing (BullMQ):** Un worker Node.js escanea cada minuto (o usa `delayed jobs`) los posts cuya `scheduledAt` sea <= Now.
3. **Execution:** El worker ejecuta la llamada a la API correspondiente (`fb.post()`, `linkedin.post()`).
4. **Retry Logic:** En caso de fallo (ej. rate limit), BullMQ reintenta con un *Exponential Backoff*.

---

## 6. Escalabilidad SaaS y Monetización

### Modelo de Negocio
- **Tier Free:** 1 Cuenta por red, 10 posts al mes. Marca de agua "Posteado con OmniSocial".
- **Tier Pro ($29/mo):** Cuentas ilimitadas, AI ilimitado, Analíticas premium.
- **Tier Agency ($99/mo):** Gestión de múltiples clientes, aprobaciones de equipo, reportes de marca blanca.

### Escalabilidad Técnica
- **Multi-tenancy:** Los datos están aislados por `userId` en Firestore.
- **Media Optimization:** Cloudinary sirve versiones optimizadas de las fotos según el dispositivo del usuario final.
- **Global Ingress:** Uso de Firebase Hosting + Cloud Run en múltiples regiones para mínima latencia.
