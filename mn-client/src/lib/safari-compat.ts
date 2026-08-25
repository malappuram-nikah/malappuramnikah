/**
 * Safari & iOS Legacy Browser Compatibility Layer
 * Ensures seamless operation on older iOS (iOS 12, 13, 14, 15, 16) and Safari versions.
 */

if (typeof window !== "undefined") {
  // 1. Polyfill crypto.randomUUID (added in iOS 15.4)
  if (typeof window.crypto === "undefined") {
    (window as any).crypto = {};
  }
  if (typeof window.crypto.randomUUID !== "function") {
    window.crypto.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }

  // 2. Polyfill Array.prototype.at (added in iOS 15.4)
  if (!Array.prototype.at) {
    Array.prototype.at = function (n: number) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }

  // 3. Polyfill structuredClone (added in iOS 15.4)
  if (typeof window.structuredClone !== "function") {
    window.structuredClone = function <T>(obj: T): T {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch {
        return obj;
      }
    };
  }

  // 4. Safe localStorage wrapper for iOS Safari Private Browsing QuotaExceededError
  try {
    const testKey = "__mn_safari_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
  } catch (e) {
    console.warn("Safari Private Browsing / Restricted Storage detected. Using in-memory fallback storage.");
    const memoryStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, val: string) => { memoryStore[key] = String(val); },
      removeItem: (key: string) => { delete memoryStore[key]; },
      clear: () => { Object.keys(memoryStore).forEach((k) => delete memoryStore[k]); },
      key: (i: number) => Object.keys(memoryStore)[i] ?? null,
      get length() { return Object.keys(memoryStore).length; }
    };
    try {
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        configurable: true,
        writable: true,
      });
    } catch {}
  }

  // 5. AudioContext WebKit Prefix Guard (iOS Safari < 14.5)
  if (typeof window.AudioContext === "undefined" && typeof (window as any).webkitAudioContext !== "undefined") {
    window.AudioContext = (window as any).webkitAudioContext;
  }
}

export {};
