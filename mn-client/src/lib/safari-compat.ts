/**
 * Safari, iOS & Android Legacy / In-App Browser Compatibility Layer
 * Ensures zero crashes and seamless operation on older iOS (iOS 12-17+), Mac Safari (including M1/M2/M3),
 * and Android WebViews (MIUI Browser, Redmi webview, WhatsApp/Instagram in-app browser).
 */

if (typeof window !== "undefined") {
  // 1. Polyfill crypto.randomUUID (added in iOS 15.4)
  try {
    if (typeof window.crypto === "undefined") {
      try {
        (window as any).crypto = {};
      } catch {}
    }
    if (window.crypto && typeof window.crypto.randomUUID !== "function") {
      const genUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }) as `${string}-${string}-${string}-${string}-${string}`;
      };
      try {
        Object.defineProperty(window.crypto, "randomUUID", {
          value: genUUID,
          writable: true,
          configurable: true,
        });
      } catch {
        try {
          (window.crypto as any).randomUUID = genUUID;
        } catch {}
      }
    }
  } catch {}

  // 2. Polyfill Array.prototype.at (added in iOS 15.4)
  try {
    if (!Array.prototype.at) {
      Object.defineProperty(Array.prototype, "at", {
        value: function (n: number) {
          n = Math.trunc(n) || 0;
          if (n < 0) n += this.length;
          if (n < 0 || n >= this.length) return undefined;
          return this[n];
        },
        writable: true,
        configurable: true,
      });
    }
  } catch {}

  // 3. Polyfill structuredClone (added in iOS 15.4)
  try {
    if (typeof window.structuredClone !== "function") {
      window.structuredClone = function <T>(obj: T): T {
        try {
          return JSON.parse(JSON.stringify(obj));
        } catch {
          return obj;
        }
      };
    }
  } catch {}

  // 4. Polyfill String.prototype.replaceAll (Safari < 14.1)
  try {
    if (!(String.prototype as any).replaceAll) {
      Object.defineProperty(String.prototype, "replaceAll", {
        value: function (str: string | RegExp, newSubstr: any) {
          if (Object.prototype.toString.call(str).toLowerCase() === "[object regexp]") {
            return this.replace(str as RegExp, newSubstr);
          }
          return this.replace(
            new RegExp((str as string).replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
            newSubstr
          );
        },
        writable: true,
        configurable: true,
      });
    }
  } catch {}

  // 5. Polyfill Object.hasOwn (Safari < 15.4)
  try {
    if (!(Object as any).hasOwn) {
      Object.defineProperty(Object, "hasOwn", {
        value: function (object: any, property: PropertyKey): boolean {
          return Object.prototype.hasOwnProperty.call(object, property);
        },
        writable: true,
        configurable: true,
      });
    }
  } catch {}

  // 6. Polyfill Promise.allSettled (Safari < 13)
  try {
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
  } catch {}

  // 7. Polyfill requestIdleCallback (Safari < 16.4)
  try {
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
  } catch {}

  // 8. Image decode() fallback for older WebKit engines
  try {
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
  } catch {}

  // 9. iOS Safari / Android 100vh dynamic viewport fix
  try {
    const setVh = () => {
      try {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      } catch {}
    };
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(setVh);
    } else {
      setTimeout(setVh, 0);
    }
    window.addEventListener("resize", setVh, { passive: true });
    window.addEventListener("orientationchange", setVh, { passive: true });
  } catch {}
}

export {};
