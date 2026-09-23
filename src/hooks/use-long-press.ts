import { useRef, type MouseEvent, type PointerEvent } from "react";

const MOVIMIENTO_MAX = 10;

/**
 * Mantener presionado. Devuelve handlers para esparcir en el elemento.
 *
 * - Si el dedo se mueve (scroll de la lista o de los chips) se cancela, para
 *   no abrir la edición cada vez que Sarah desliza.
 * - El click que llega al soltar después de un long press se traga: si no,
 *   mantener sobre un chip lo abriría para editar y además lo filtraría.
 * - `onContextMenu` evita el menú de Android; el de iOS se apaga con la clase
 *   `no-callout` en el elemento.
 */
export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const disparado = useRef(false);

  function cancelar() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    inicio.current = null;
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      cancelar();
      disparado.current = false;
      inicio.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        disparado.current = true;
        timer.current = null;
        navigator.vibrate?.(15);
        onLongPress();
      }, ms);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!inicio.current) return;
      if (Math.hypot(e.clientX - inicio.current.x, e.clientY - inicio.current.y) > MOVIMIENTO_MAX) cancelar();
    },
    onPointerUp: cancelar,
    onPointerLeave: cancelar,
    onPointerCancel: cancelar,
    onClickCapture: (e: MouseEvent) => {
      if (!disparado.current) return;
      disparado.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  };
}
