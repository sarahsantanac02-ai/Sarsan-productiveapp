import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCorregirTag, type Item } from "@/features/capture/use-items";
import { TagLogo } from "@/features/tags/tag-logo";
import { useTags } from "@/features/tags/use-tags";

export function TagSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const { data: tags } = useTags();
  const corregirTag = useCorregirTag();

  return (
    <Sheet onClose={onClose}>
      <p className="text-xs font-semibold text-primary">ETIQUETA</p>
      <h2 className="mt-1 pr-8 font-display text-2xl font-bold leading-tight">¿Dónde va esto?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Si la cambias, lo tengo en cuenta la próxima vez que captures algo parecido.
      </p>

      <div className="my-5 grid grid-cols-2 gap-2">
        {tags?.map((tag) => {
          const activa = tag.id === item.tag_id;
          return (
            <button
              key={tag.id}
              onClick={() => corregirTag.mutate({ item, tagId: tag.id }, { onSuccess: onClose })}
              disabled={corregirTag.isPending}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all disabled:opacity-50",
                activa ? "border-2" : "border",
              )}
              style={{
                backgroundColor: `color-mix(in oklch, ${tag.color} 16%, var(--card))`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <TagLogo tag={tag} />
              <span className="truncate">{tag.nombre}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
