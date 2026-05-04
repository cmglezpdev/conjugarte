import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with clsx and resolves Tailwind conflicts with
 * tailwind-merge. This is the standard shadcn/ui `cn` helper.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
