import assert from "node:assert";
import { WhatsAppApiClient, WhatsAppApiError } from "../WhatsAppApiClient";
import { WhatsAppConfig } from "../../../domain/entities/whatsapp-config.interface";

const mockConfig: WhatsAppConfig = {
  apiVersion: "v21.0",
  phoneNumberId: "100000000000001",
  businessAccountId: "200000000000002",
  accessToken: "EAAG_SUPER_SECRET_ACCESS_TOKEN_DO_NOT_LOG",
  appSecret: "SUPER_SECRET_APP_SECRET_HASH",
  webhookVerifyToken: "SUPER_SECRET_WEBHOOK_VERIFY_TOKEN",
  otpTemplateName: "otp_verification",
  otpTemplateLanguage: "en",
};

const originalFetch = globalThis.fetch;

async function runTests() {
  console.log("==========================================");
  console.log("Running WhatsAppApiClient Unit Tests");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  let capturedLogs: string[] = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  function startLogCapture() {
    capturedLogs = [];
    console.log = (...args: any[]) => capturedLogs.push(args.map(String).join(" "));
    console.warn = (...args: any[]) => capturedLogs.push(args.map(String).join(" "));
    console.error = (...args: any[]) => capturedLogs.push(args.map(String).join(" "));
  }

  function stopLogCapture(): string {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
    return capturedLogs.join("\n");
  }

  await test("1. Successful API template message request", async () => {
    let capturedUrl = "";
    let capturedAuthHeader = "";

    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedAuthHeader = (init?.headers as any)?.Authorization || "";

      return new Response(
        JSON.stringify({
          messaging_product: "whatsapp",
          contacts: [{ input: "919876543210", wa_id: "919876543210" }],
          messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5MA==" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const response = await WhatsAppApiClient.sendTemplateMessage(
      "9876543210",
      "otp_verification",
      "en_US",
      [
        {
          type: "body",
          parameters: [{ type: "text", text: "123456" }],
        },
      ],
      { config: mockConfig, maxRetries: 0 }
    );

    assert.strictEqual(capturedUrl, "https://graph.facebook.com/v21.0/100000000000001/messages");
    assert.strictEqual(capturedAuthHeader, `Bearer ${mockConfig.accessToken}`);
    assert.strictEqual(response.messaging_product, "whatsapp");
    assert.strictEqual(response.messages?.[0]?.id, "wamid.HBgLMTIzNDU2Nzg5MA==");
  });

  await test("2. Authentication failure (HTTP 401)", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid OAuth access token.",
            type: "OAuthException",
            code: 190,
            fbtrace_id: "A1B2C3D4E5",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await WhatsAppApiClient.sendTemplateMessage("9876543210", "otp_verification", "en_US", [], {
          config: mockConfig,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof WhatsAppApiError);
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.code, 190);
        assert.strictEqual(err.errorType, "OAuthException");
        assert.strictEqual(err.fbtraceId, "A1B2C3D4E5");
        return true;
      }
    );
  });

  await test("3. Invalid phone number error (HTTP 400)", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: "(#131009) Parameter value is not valid",
            type: "OAuthException",
            code: 131009,
            error_data: { details: "Recipient phone number is not a valid WhatsApp user" },
            fbtrace_id: "XYZ987",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await WhatsAppApiClient.sendTemplateMessage("0000000000", "otp_verification", "en_US", [], {
          config: mockConfig,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof WhatsAppApiError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 131009);
        return true;
      }
    );
  });

  await test("4. Invalid template error (HTTP 400)", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: "(#100) Template does not exist",
            type: "OAuthException",
            code: 100,
            error_subcode: 132001,
            fbtrace_id: "TMPL_ERR_1",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await WhatsAppApiClient.sendTemplateMessage("9876543210", "non_existent_template", "en_US", [], {
          config: mockConfig,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof WhatsAppApiError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 100);
        assert.strictEqual(err.errorSubcode, 132001);
        return true;
      }
    );
  });

  await test("5. Transient Meta API 500 error retries and succeeds", async () => {
    let callCount = 0;

    globalThis.fetch = (async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ error: { message: "Internal server error", code: 500 } }), {
          status: 500,
        });
      }
      return new Response(
        JSON.stringify({
          messaging_product: "whatsapp",
          messages: [{ id: "wamid.RETRY_SUCCESS" }],
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const response = await WhatsAppApiClient.sendTemplateMessage("9876543210", "otp_verification", "en_US", [], {
      config: mockConfig,
      maxRetries: 1,
    });

    assert.strictEqual(callCount, 2);
    assert.strictEqual(response.messages?.[0]?.id, "wamid.RETRY_SUCCESS");
  });

  await test("6. Network failure handling", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Failed to fetch (DNS / Network down)");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await WhatsAppApiClient.sendTemplateMessage("9876543210", "otp_verification", "en_US", [], {
          config: mockConfig,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof WhatsAppApiError);
        assert.strictEqual(err.isNetworkError, true);
        assert.strictEqual(err.isTimeout, false);
        return true;
      }
    );
  });

  await test("7. Request timeout handling", async () => {
    globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const abortErr = new Error("The operation was aborted");
            abortErr.name = "AbortError";
            reject(abortErr);
          });
        }
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await WhatsAppApiClient.sendTemplateMessage("9876543210", "otp_verification", "en_US", [], {
          config: mockConfig,
          timeoutMs: 50,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof WhatsAppApiError);
        assert.strictEqual(err.isTimeout, true);
        assert.strictEqual(err.isNetworkError, false);
        return true;
      }
    );
  });

  await test("8. Malformed non-JSON response handling", async () => {
    globalThis.fetch = (async () => {
      return new Response("<html>Gateway Timeout</html>", { status: 504 });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await WhatsAppApiClient.sendTemplateMessage("9876543210", "otp_verification", "en_US", [], {
          config: mockConfig,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err instanceof WhatsAppApiError);
        assert.strictEqual(err.statusCode, 504);
        assert.ok(err.rawResponse?.includes("Gateway Timeout"));
        return true;
      }
    );
  });

  await test("9. Access tokens and Authorization headers are NEVER logged", async () => {
    startLogCapture();

    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ error: { message: "Auth Error", code: 190 } }), { status: 401 });
    }) as typeof fetch;

    try {
      await WhatsAppApiClient.sendTemplateMessage("9876543210", "otp_verification", "en_US", [], {
        config: mockConfig,
        maxRetries: 0,
      });
    } catch {
      // expected error
    }

    const logOutput = stopLogCapture();

    assert.strictEqual(
      logOutput.includes(mockConfig.accessToken),
      false,
      "CRITICAL: Access token was exposed in log outputs!"
    );
    assert.strictEqual(
      logOutput.includes("Authorization:"),
      false,
      "CRITICAL: Authorization header was exposed in log outputs!"
    );
  });

  console.log("------------------------------------------");
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
