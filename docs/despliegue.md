# Despliegue — qué hay que dejar configurado

Todo lo que la app necesita afuera del repo. Sarah es la única usuaria, así que esto se hace una vez.

## 1. Vercel (frontend)

Variables de entorno del proyecto:

| Variable | De dónde sale |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (publishable key) |
| `VITE_VAPID_PUBLIC_KEY` | La llave pública del par VAPID |
| `VITE_NOTION_CLIENT_ID` | Notion → My integrations → tu integración pública |

## 2. Supabase — SQL

Las migraciones de `supabase/migrations` van en orden. Si no usas `supabase db push`,
se pegan en el SQL Editor del Dashboard, una por una.

Y una sola vez, para que el cron pueda llamar a las Edge Functions:

```sql
select vault.create_secret('<tu service_role key>', 'service_role_key');
```

## 3. Supabase — Secrets de Edge Functions

Dashboard → Edge Functions → Secrets:

| Secret | De dónde sale |
| --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (ponla **sin vencimiento**) |
| `GOOGLE_CLIENT_ID` | Google Cloud → Google Auth Platform → Clients |
| `GOOGLE_CLIENT_SECRET` | el mismo cliente OAuth |
| `VAPID_PUBLIC_KEY` | par VAPID (la misma que va en Vercel) |
| `VAPID_PRIVATE_KEY` | par VAPID |
| `NOTION_CLIENT_ID` | Notion → My integrations |
| `NOTION_CLIENT_SECRET` | Notion → My integrations |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase solo.

## 4. Edge Functions

```bash
npx supabase login
for f in classify-capture plan-day estimate-food google-calendar gmail-sapq gmail-triage notion-sync check-notifications; do
  npx supabase functions deploy "$f" --project-ref <project-ref>
done
```

## 5. Google Cloud

- APIs activas: Google Calendar API y Gmail API.
- Cliente OAuth web con el redirect de Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`.
- Scopes: `calendar.events` y `gmail.readonly`.
- Mientras la app esté en modo prueba, Sarah tiene que estar en **Test users**, y Google
  caduca el refresh token cada 7 días — cuando pase, la app pide reconectar y basta con
  volver a entrar con Google. Publicar la app quita ese límite pero pide verificación de Google.

## 6. Notion

Integración **pública** en notion.so/my-integrations, con redirect URI
`https://<tu-dominio-vercel>/notion-callback`. Al conectar, Notion pregunta qué páginas
compartir: hay que elegir al menos una, porque ahí adentro se crea la base "SarSan — Tareas".

## 7. Supabase Auth

Authentication → URL Configuration:
- **Site URL**: el dominio de Vercel.
- **Redirect URLs**: el dominio de Vercel y `<dominio>/**`.
