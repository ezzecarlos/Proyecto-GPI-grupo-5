import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Función utilitaria para combinar clases de Tailwind CSS.
 * Permite pasar múltiples argumentos (cadenas, objetos, arrays) 
 * y resuelve conflictos de clases automáticamente.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}