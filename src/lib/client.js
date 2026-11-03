/** fetch wrapper for the browser: always resolves to { ok, data } or { ok: false, error }. */
export async function api(path, options = {}) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
    });
    if (res.status === 204) return { ok: true, data: null };
    const json = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: json?.data };
    return { ok: false, error: json?.error ?? { code: "UNKNOWN", message: "Something went wrong. Try again." } };
  } catch {
    return {
      ok: false,
      error: { code: "NETWORK", message: "Could not reach the server. Check your connection and try again." },
    };
  }
}
