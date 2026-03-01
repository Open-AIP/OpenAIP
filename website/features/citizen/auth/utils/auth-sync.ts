const CITIZEN_AUTH_CHANGED_EVENT = "openaip:citizen-auth-changed";
const CITIZEN_AUTH_CHANGED_STORAGE_KEY = "openAip:citizenAuthChangedAt";

export function emitCitizenAuthChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(CITIZEN_AUTH_CHANGED_EVENT));
  try {
    window.localStorage.setItem(CITIZEN_AUTH_CHANGED_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage write failures (private mode / disabled storage).
  }
}

export function addCitizenAuthChangedListener(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleEvent = () => {
    callback();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== CITIZEN_AUTH_CHANGED_STORAGE_KEY) return;
    callback();
  };

  window.addEventListener(CITIZEN_AUTH_CHANGED_EVENT, handleEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CITIZEN_AUTH_CHANGED_EVENT, handleEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
