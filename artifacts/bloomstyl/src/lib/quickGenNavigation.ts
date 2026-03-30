export const QUICK_GEN_RETURN_PATH_KEY = "quickGenReturnPath";
export const QUICK_GEN_SESSION_ID_KEY = "quickGenSessionId";
export const QUICK_GEN_RESUME_SESSION_KEY = "quickGenResumeSession";

export function saveQuickGenReturnPath(): void {
  try {
    const path = `${window.location.pathname}${window.location.search}`;
    sessionStorage.setItem(QUICK_GEN_RETURN_PATH_KEY, path);
  } catch {
    // ignore
  }
}

export function consumeQuickGenReturnPath(): string | null {
  try {
    const p = sessionStorage.getItem(QUICK_GEN_RETURN_PATH_KEY);
    if (p) sessionStorage.removeItem(QUICK_GEN_RETURN_PATH_KEY);
    return p;
  } catch {
    return null;
  }
}

export function setQuickGenSessionId(sessionId: string | null): void {
  try {
    if (sessionId) sessionStorage.setItem(QUICK_GEN_SESSION_ID_KEY, sessionId);
    else sessionStorage.removeItem(QUICK_GEN_SESSION_ID_KEY);
  } catch {
    // ignore
  }
}

export function getQuickGenSessionId(): string | null {
  try {
    return sessionStorage.getItem(QUICK_GEN_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

/** Mark that the QuickGen page should resume from the existing session when next loaded. */
export function setQuickGenResumeSession(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(QUICK_GEN_RESUME_SESSION_KEY, "1");
    } else {
      sessionStorage.removeItem(QUICK_GEN_RESUME_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

/** Read and clear the resume-session flag (true if the page should restore from session). */
export function consumeQuickGenResumeSession(): boolean {
  try {
    const v = sessionStorage.getItem(QUICK_GEN_RESUME_SESSION_KEY);
    if (v) sessionStorage.removeItem(QUICK_GEN_RESUME_SESSION_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
