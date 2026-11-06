import { supabaseBrowser } from "@/lib/auth/supabase-browser";

/**
 * Universal authenticated fetch client for RSCMS frontend components.
 * Automatically injects the fresh Supabase JWT Access Token in the Authorization header.
 * If an expired token causes a 401 Unauthorized, automatically triggers a token refresh
 * and retries the request once before propagating the response.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});

  // 1. Retrieve current active session token from Supabase client
  try {
    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession();

    if (session?.access_token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  } catch (err) {
    console.warn("[authFetch] Failed to retrieve Supabase session:", err);
  }

  // 2. Execute request with authorization header
  let response = await fetch(input, { ...init, headers });

  // 3. If response is 401 Unauthorized, attempt token refresh and retry once
  if (response.status === 401) {
    try {
      const { data, error } = await supabaseBrowser.auth.refreshSession();
      if (!error && data.session?.access_token) {
        // Sync new token to server HttpOnly cookie
        void fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: data.session.access_token }),
        }).catch(() => {});

        // Retry with refreshed token
        headers.set("Authorization", `Bearer ${data.session.access_token}`);
        response = await fetch(input, { ...init, headers });
      }
    } catch (refreshErr) {
      console.warn("[authFetch] Token refresh retry failed:", refreshErr);
    }
  }

  return response;
}

