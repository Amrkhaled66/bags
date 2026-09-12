const key = "bags.admin.access-token";
const listeners = new Set<() => void>();
function readStoredToken() {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
let token = readStoredToken();

export const sessionStorage = {
  getToken: () => token,
  setToken(value: string | null) {
    token = value;
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      /* The current tab can still use an in-memory session. */
    }
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

window.addEventListener("storage", (event) => {
  if (event.key === key || event.key === null) {
    token = readStoredToken();
    listeners.forEach((listener) => listener());
  }
});
