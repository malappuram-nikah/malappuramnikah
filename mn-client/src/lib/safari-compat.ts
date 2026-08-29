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

  // 6. Polyfill String.prototype.replaceAll (Safari < 14.1)
  if (!(String.prototype as any).replaceAll) {
    (String.prototype as any).replaceAll = function (str: string | RegExp, newSubstr: any) {
      if (Object.prototype.toString.call(str).toLowerCase() === "[object regexp]") {
        return this.replace(str as RegExp, newSubstr);
      }
      return this.replace(new RegExp((str as string).replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"), newSubstr);
    };
  }

  // 7. Polyfill Object.hasOwn (Safari < 15.4)
  if (!(Object as any).hasOwn) {
    (Object as any).hasOwn = function (object: any, property: PropertyKey): boolean {
      return Object.prototype.hasOwnProperty.call(object, property);
    };
  }

  // 8. Polyfill Promise.allSettled (Safari < 13)
  if (!(Promise as any).allSettled) {
    (Promise as any).allSettled = function (promises: Iterable<any>) {
      return Promise.all(
        Array.from(promises).map((p) =>
          Promise.resolve(p).then(
            (value) => ({ status: "fulfilled" as const, value }),
            (reason) => ({ status: "rejected" as const, reason })
          )
        )
      );
    };
  }

  // 9. Polyfill requestIdleCallback (Safari < 16.4)
  if (typeof window.requestIdleCallback === "undefined") {
    (window as any).requestIdleCallback = function (cb: (deadline: any) => void) {
      const start = Date.now();
      return setTimeout(() => {
        cb({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
    (window as any).cancelIdleCallback = function (id: any) {
      clearTimeout(id);
    };
  }

  // 10. Image decode() fallback for older WebKit engines
  if (typeof HTMLImageElement !== "undefined" && !HTMLImageElement.prototype.decode) {
    HTMLImageElement.prototype.decode = function () {
      return new Promise<void>((resolve) => {
        if (this.complete) {
          resolve();
        } else {
          this.onload = () => resolve();
          this.onerror = () => resolve();
        }
      });
    };
  }

  // 11. iOS Safari 100vh dynamic viewport fix
  const setVh = () => {
    try {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    } catch {}
  };
  setVh();
  window.addEventListener("resize", setVh, { passive: true });
  window.addEventListener("orientationchange", setVh, { passive: true });

  // 12. AudioContext auto-unlock on first user gesture (iOS Safari requirement)
  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === "suspended") {
          dummyCtx.resume().catch(() => {});
        }
      }
    } catch {}
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("click", unlockAudio);
  };
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("click", unlockAudio, { passive: true });
}

export {};
