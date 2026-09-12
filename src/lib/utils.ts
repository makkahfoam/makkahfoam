import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null, currency: string = "Rs."): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return "-";
  try {
    const d = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateString);
  }
}

export function formatDateTime(dateString: string | Date | undefined | null): string {
  if (!dateString) return "-";
  try {
    const d = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(d.getTime())) return String(dateString);
    return `${formatDate(d)} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return String(dateString);
  }
}

/**
 * Strips leading zeros when user types over a default 0 value,
 * returning clean numeric representation (e.g. "0" + "5" -> "5", not "05").
 */
export function handleNumericZeroReplace(currentValue: string | number, incomingValue: string): string {
  // If user cleared the input
  if (incomingValue === "") return "";
  
  // If input was "0" and user typed a digit
  if (String(currentValue) === "0" && incomingValue.length > 1) {
    if (incomingValue.startsWith("0") && !incomingValue.startsWith("0.")) {
      return incomingValue.replace(/^0+/, "") || "0";
    }
  }
  
  // General guard against leading zeros for whole numbers
  if (/^0[0-9]+/.test(incomingValue)) {
    return incomingValue.replace(/^0+/, "");
  }
  
  return incomingValue;
}