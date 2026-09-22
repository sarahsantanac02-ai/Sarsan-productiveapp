const LADO_MAX = 1024;

/**
 * Reduce la foto antes de subirla: las fotos del iPhone pesan varios MB y la
 * estimación no mejora con más pixeles, pero sí se vuelve más lenta y cara.
 */
export async function reducirImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));

  if (escala === 1 && archivo.size < 500_000) return archivo;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);

  const ctx = canvas.getContext("2d");
  if (!ctx) return archivo;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? archivo), "image/jpeg", 0.8);
  });
}
