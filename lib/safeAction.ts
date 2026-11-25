/**
 * Wrap a server action used with useActionState so network failures, oversized uploads and
 * "stale page after an update" errors come back as a friendly { error } instead of crashing the page.
 * Next.js redirect/notFound signals are re-thrown so navigation still works.
 */
export function safe<S>(fn: (state: S, fd: FormData) => Promise<S>) {
  return async (state: S, fd: FormData): Promise<S> => {
    try {
      return await fn(state, fd);
    } catch (e: any) {
      const digest = typeof e?.digest === "string" ? e.digest : "";
      const msg = String(e?.message || "");
      if (/^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test(digest) || msg.includes("NEXT_REDIRECT")) throw e;
      let error = "Couldn't reach the server. Check your internet connection and try again.";
      if (/Server Action|server action/i.test(msg)) error = "The app was just updated. Please refresh this page and try again.";
      else if (/body|exceed|413|too large|payload/i.test(msg)) error = "That file is too large. Please choose a smaller file (under 4 MB).";
      return { error } as S;
    }
  };
}
