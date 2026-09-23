import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  TAG_GENERAL,
  useBorrarTag,
  useGuardarTag,
  useTagLogos,
  type CambioLogo,
  type Tag,
} from "@/features/tags/use-tags";

const EMOJIS = ["✦", "🏢", "🎓", "📨", "🏠", "🎬", "🎨", "💻", "💸", "🧘", "✨", "📚", "💼", "❤️"];

// Los mismos colores de las etiquetas por defecto (seed), para que las nuevas combinen.
const COLORES = [
  "#8b3ff0",
  "#3b82f6",
  "#6366f1",
  "#14b8a6",
  "#10b981",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#d946ef",
  "#6b7280",
];

/** `tag` null = crear una nueva. */
export function TagEditorSheet({ tag, onClose }: { tag: Tag | null; onClose: () => void }) {
  const guardar = useGuardarTag();
  const borrar = useBorrarTag();
  const { data: urls } = useTagLogos();

  const [nombre, setNombre] = useState(tag?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(tag?.descripcion ?? "");
  const [emoji, setEmoji] = useState(tag?.emoji ?? "🎨");
  const [color, setColor] = useState(tag?.color ?? COLORES[0]);
  const [logo, setLogo] = useState<CambioLogo>(undefined);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);

  const esGeneral = tag?.nombre === TAG_GENERAL;
  const logoNuevoUrl = useObjectUrl(logo instanceof File ? logo : null);
  const logoActualUrl = tag?.logo_path ? urls?.[tag.logo_path] : undefined;
  const logoVisible = logo instanceof File ? logoNuevoUrl : logo === "quitar" ? undefined : logoActualUrl;

  const error = guardar.error ?? borrar.error;
  const ocupado = guardar.isPending || borrar.isPending;

  function onGuardar() {
    const limpio = nombre.trim();
    if (!limpio) return;
    guardar.mutate(
      {
        tag,
        datos: { nombre: limpio, descripcion: descripcion.trim() || null, color, emoji: emoji.trim() || null },
        logo,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">{tag ? "EDITAR ETIQUETA" : "NUEVA ETIQUETA"}</p>
      <h2 className="mt-1 pr-8 font-display text-2xl font-bold">{tag ? tag.nombre : "Dale un lugar"}</h2>

      <div className="mt-5 flex gap-3">
        <span
          className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl"
          style={{ backgroundColor: `color-mix(in oklch, ${color} 16%, var(--card))` }}
        >
          {logoVisible ? <img src={logoVisible} alt="" className="size-10 object-contain" /> : emoji || "✦"}
        </span>
        <div className="flex-1 space-y-2">
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            disabled={esGeneral}
            aria-label="Nombre"
          />
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué va aquí (lo lee la IA)"
            aria-label="Descripción"
          />
        </div>
      </div>
      {esGeneral && (
        <p className="mt-2 text-xs text-muted-foreground">
          General no se puede renombrar: es donde cae lo que no sé dónde poner.
        </p>
      )}

      <input
        ref={archivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) setLogo(archivo);
          e.target.value = "";
        }}
      />
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => archivoRef.current?.click()}>
          <ImagePlus /> {logoVisible ? "Cambiar logo" : "Subir logo"}
        </Button>
        {logoVisible && (
          <Button variant="ghost" onClick={() => setLogo(tag?.logo_path ? "quitar" : undefined)}>
            <X /> Quitar
          </Button>
        )}
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold">{logoVisible ? "Emoji (si quitas el logo)" : "O elige un emoji"}</p>
      <div className="grid grid-cols-7 gap-2">
        {EMOJIS.map((item) => (
          <Button
            key={item}
            variant={emoji === item ? "emojiActive" : "emoji"}
            size="icon"
            className="w-full"
            onClick={() => setEmoji(item)}
          >
            {item}
          </Button>
        ))}
      </div>
      <Input
        value={EMOJIS.includes(emoji) ? "" : emoji}
        onChange={(e) => setEmoji(e.target.value.trim())}
        placeholder="…o escribe cualquier emoji"
        maxLength={8}
        className="mt-2"
        aria-label="Otro emoji"
      />

      <p className="mb-2 mt-5 text-xs font-semibold">Color</p>
      <div className="flex flex-wrap gap-2">
        {COLORES.map((item) => (
          <Button
            key={item}
            variant="swatch"
            size="iconSm"
            aria-label={`Color ${item}`}
            onClick={() => setColor(item)}
            className={cn(color === item && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
            style={{ backgroundColor: item }}
          />
        ))}
      </div>

      {error && <p className="mt-4 text-xs text-destructive">{error.message}</p>}

      <Button variant="default" size="lg" className="mt-6 w-full" onClick={onGuardar} disabled={!nombre.trim() || ocupado}>
        {guardar.isPending ? "Guardando..." : tag ? "Guardar cambios" : "Crear etiqueta"}
      </Button>

      {tag && !esGeneral && (
        <div className="mt-3">
          {confirmarBorrado ? (
            <div className="rounded-2xl border border-destructive/40 p-3">
              <p className="text-sm">¿Borrar {tag.nombre}? Sus pendientes pasan a General.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setConfirmarBorrado(false)}>
                  No
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={ocupado}
                  onClick={() => borrar.mutate(tag, { onSuccess: onClose })}
                >
                  {borrar.isPending ? "Borrando..." : "Sí, borrar"}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" className="w-full text-destructive" onClick={() => setConfirmarBorrado(true)}>
              <Trash2 /> Borrar etiqueta
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** Vista previa de un archivo local; libera la URL al cambiar o cerrar. */
function useObjectUrl(archivo: File | null) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!archivo) {
      setUrl(undefined);
      return;
    }
    const nueva = URL.createObjectURL(archivo);
    setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [archivo]);
  return url;
}
