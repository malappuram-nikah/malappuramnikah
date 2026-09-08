/**
 * Cross-platform Safe Storage Utility
 * Prevents crashes on Safari Private Browsing, iOS WebKit, and Android Redmi/MI WebViews
 * where localStorage or sessionStorage access throws SecurityError or QuotaExceededError.
 */

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryLocalStorage = new MemoryStorage();
const memorySessionStorage = new MemoryStorage();

function getStorage(type: "local" | "session"): Storage {
  if (typeof window === "undefined") {
    return type === "local" ? memoryLocalStorage : memorySessionStorage;
  }

  try {
    const storage = type === "local" ? window.localStorage : window.sessionStorage;
    if (!storage) {
      return type === "local" ? memoryLocalStorage : memorySessionStorage;
    }
    const testKey = `__mn_test_${type}__`;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return type === "local" ? memoryLocalStorage : memorySessionStorage;
  }
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return getStorage("local").getItem(key);
    } catch {
      return memoryLocalStorage.getItem(key);
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      getStorage("local").setItem(key, value);
    } catch {
      memoryLocalStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      getStorage("local").removeItem(key);
    } catch {
      memoryLocalStorage.removeItem(key);
    }
  },
  clear: (): void => {
    try {
      getStorage("local").clear();
    } catch {
      memoryLocalStorage.clear();
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return getStorage("session").getItem(key);
    } catch {
      return memorySessionStorage.getItem(key);
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      getStorage("session").setItem(key, value);
    } catch {
      memorySessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      getStorage("session").removeItem(key);
    } catch {
      memorySessionStorage.removeItem(key);
    }
  },
  clear: (): void => {
    try {
      getStorage("session").clear();
    } catch {
      memorySessionStorage.clear();
    }
  },
};
