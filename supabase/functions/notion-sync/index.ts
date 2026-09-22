import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js";

import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";
const NOMBRE_BASE = "SarSan — Tareas";

class NotionNoConectado extends Error {}

async function tokenDeNotion(admin: SupabaseClient, userId: string) {
  const { data } = await admin
    .from("integrations")
    .select("access_token, notion_database_id")
    .eq("user_id", userId)
    .eq("proveedor", "notion")
    .maybeSingle<{ access_token: string | null; notion_database_id: string | null }>();

  if (!data?.access_token) throw new NotionNoConectado("Notion no está conectado todavía.");
  return { token: data.access_token, databaseId: data.notion_database_id };
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": VERSION,
    "Content-Type": "application/json",
  };
}

/** Crea la base "SarSan — Tareas" dentro de la primera página que Sarah compartió. */
async function crearBase(token: string): Promise<string> {
  const busqueda = await fetch(`${API}/search`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ filter: { property: "object", value: "page" }, page_size: 1 }),
  });
  if (!busqueda.ok) throw new Error(`Notion no dejó buscar páginas: ${(await busqueda.text()).slice(0, 200)}`);

  const { results } = (await busqueda.json()) as { results: Array<{ id: string }> };
  if (!results?.length) {
    throw new NotionNoConectado(
      "No compartiste ninguna página con SarSan. Vuelve a conectar Notion y elige al menos una página.",
    );
  }

  const respuesta = await fetch(`${API}/databases`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      parent: { type: "page_id", page_id: results[0].id },
      title: [{ type: "text", text: { content: NOMBRE_BASE } }],
      properties: {
        Tarea: { title: {} },
        Categoría: { select: {} },
        Urgencia: {
          select: {
            options: [
              { name: "alta", color: "red" },
              { name: "media", color: "yellow" },
              { name: "baja", color: "gray" },
            ],
          },
        },
        "Fecha límite": { date: {} },
        Hecha: { checkbox: {} },
        Semanal: { checkbox: {} },
      },
    }),
  });
  if (!respuesta.ok) throw new Error(`Notion no dejó crear la base: ${(await respuesta.text()).slice(0, 300)}`);

  const base = (await respuesta.json()) as { id: string };
  return base.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return jsonResponse({ error: "Falta el token de sesión" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Faltan las variables de Supabase" }, 500);

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? jwt, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Sesión inválida");
    const userId = userData.user.id;

    const body = await req.json();

    // 1. Cambiar el code de OAuth por un token y dejar la base creada.
    if (body.accion === "conectar") {
      const clientId = Deno.env.get("NOTION_CLIENT_ID");
      const clientSecret = Deno.env.get("NOTION_CLIENT_SECRET");
      if (!clientId || !clientSecret) throw new Error("Faltan los secrets NOTION_CLIENT_ID y NOTION_CLIENT_SECRET.");

      const respuesta = await fetch(`${API}/oauth/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          "Content-Type": "application/json",
          "Notion-Version": VERSION,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: body.code,
          redirect_uri: body.redirect_uri,
        }),
      });
      if (!respuesta.ok) throw new Error(`Notion rechazó la conexión: ${(await respuesta.text()).slice(0, 300)}`);

      const { access_token } = (await respuesta.json()) as { access_token: string };
      const databaseId = await crearBase(access_token);

      const { error } = await admin.from("integrations").upsert(
        { user_id: userId, proveedor: "notion", access_token, notion_database_id: databaseId },
        { onConflict: "user_id,proveedor" },
      );
      if (error) throw new Error(`Guardando la conexión: ${error.message}`);

      console.log(`notion-sync conectó y creó la base ${databaseId}`);
      return jsonResponse({ conectado: true, database_id: databaseId });
    }

    // 2. Mandar una tarea a Notion.
    if (body.accion === "crear") {
      const { token, databaseId } = await tokenDeNotion(admin, userId);
      if (!databaseId) throw new NotionNoConectado("Todavía no existe la base de Notion. Reconecta Notion.");

      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("id, texto, urgencia, fecha, recurrencia, notion_page_id, tag_id")
        .eq("id", body.item_id)
        .single();
      if (itemError) throw new Error(`No encontré esa tarea: ${itemError.message}`);
      if (item.notion_page_id) return jsonResponse({ ya_existe: true, notion_page_id: item.notion_page_id });

      const { data: tag } = item.tag_id
        ? await supabase.from("tags").select("nombre").eq("id", item.tag_id).maybeSingle()
        : { data: null };

      const respuesta = await fetch(`${API}/pages`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Tarea: { title: [{ text: { content: item.texto } }] },
            ...(tag?.nombre ? { Categoría: { select: { name: tag.nombre } } } : {}),
            ...(item.urgencia ? { Urgencia: { select: { name: item.urgencia } } } : {}),
            ...(item.fecha ? { "Fecha límite": { date: { start: item.fecha } } } : {}),
            Hecha: { checkbox: false },
            Semanal: { checkbox: Boolean(item.recurrencia) },
          },
        }),
      });
      if (!respuesta.ok) throw new Error(`Notion no dejó crear la fila: ${(await respuesta.text()).slice(0, 300)}`);

      const pagina = (await respuesta.json()) as { id: string; url?: string };
      await supabase
        .from("items")
        .update({ notion_page_id: pagina.id, notion_status: "creada" })
        .eq("id", item.id);

      return jsonResponse({ notion_page_id: pagina.id, url: pagina.url ?? null });
    }

    // 3. Sincronizar la casilla "Hecha".
    if (body.accion === "marcar") {
      const { token } = await tokenDeNotion(admin, userId);

      const respuesta = await fetch(`${API}/pages/${body.notion_page_id}`, {
        method: "PATCH",
        headers: headers(token),
        body: JSON.stringify({ properties: { Hecha: { checkbox: Boolean(body.hecha) } } }),
      });
      if (!respuesta.ok) throw new Error(`Notion no dejó actualizar: ${(await respuesta.text()).slice(0, 200)}`);

      return jsonResponse({ actualizada: true });
    }

    return jsonResponse({ error: "Acción desconocida" }, 400);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    const reconectar = error instanceof NotionNoConectado;
    console.error("notion-sync falló:", mensaje);
    return jsonResponse({ error: mensaje, reconectar }, 200);
  }
});
