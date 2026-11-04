export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
 try {
 const res = await fetch(url, options);
 const text = await res.text();
 if (!res.ok) {
 console.error(`API ${res.status}: ${url}`);
 return null;
 }
 try {
 return JSON.parse(text) as T;
 } catch {
 console.error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`);
 return null;
 }
 } catch (err) {
 console.error(`Fetch error: ${url}`, err);
 return null;
 }
}
