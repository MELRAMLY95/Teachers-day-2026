export function normalisePassword(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

export async function digestPassword(value: string) {
  const bytes = new TextEncoder().encode(normalisePassword(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
