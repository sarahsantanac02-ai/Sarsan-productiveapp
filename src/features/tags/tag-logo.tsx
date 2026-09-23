import { cn } from "@/lib/utils";
import { useTagLogos, type Tag } from "@/features/tags/use-tags";

/** El logo subido si hay, si no el emoji. Mismo tamaño en los dos casos. */
export function TagLogo({ tag, className }: { tag: Tag | undefined; className?: string }) {
  const { data: urls } = useTagLogos();
  const url = tag?.logo_path ? urls?.[tag.logo_path] : undefined;

  if (url) {
    return <img src={url} alt="" className={cn("inline-block size-4 shrink-0 rounded object-contain", className)} />;
  }
  return <span className="leading-none">{tag?.emoji ?? "✦"}</span>;
}
