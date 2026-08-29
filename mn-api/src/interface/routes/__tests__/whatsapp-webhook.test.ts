import assert from "node:assert";
import crypto from "crypto";
import { WhatsAppWebhookController } from "../../controllers/whatsapp-webhook.controller";
import { verifyWhatsAppWebhookSignature } from "../../../infrastructure/middleware/whatsapp-webhook.middleware";
import { WhatsAppIdempotencyService, WhatsAppWebhookDispatcher } from "../../../infrastructure/service/WhatsAppWebhookDispatcher";
import { WhatsAppWebhookPayload } from "../../../domain/entities/whatsapp-webhook.interface";

// Setup environment variables for test execution
process.env.WHATSAPP_PHONE_NUMBER_ID = "100000000000001";
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "200000000000002";
process.env.WHATSAPP_ACCESS_TOKEN = "EAAG_TEST_ACCESS_TOKEN_SECRET";
process.env.WHATSAPP_APP_SECRET = "test_app_secret_hash_key_12345";
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "my_custom_verify_token_54321";

function mockReqRes(options: {
  query?: Record<string, any>;
  headers?: Record<string, any>;
  body?: any;
  rawBody?: Buffer | string;
}) {
  let resStatus = 200;
  let resBody: any = null;
  let sentHeader: Record<string, string> = {};

  const req: any = {
    query: options.query || {},
    headers: options.headers || {},
    body: options.body || {},
    rawBody: options.rawBody,
  };

  const res: any = {
    status(code: number) {
      resStatus = code;
      return this;
    },
    json(data: any) {
      resBody = data;
      return this;
    },
    send(data: any) {
      resBody = data;
      return this;
    },
    setHeader(key: string, val: string) {
      sentHeader[key] = val;
    },
  };

  return {
    req,
    res,
    getStatus: () => resStatus,
    getBody: () => resBody,
  };
}

async function runTests() {
  console.log("==========================================");
  console.log("Running WhatsApp Webhook Unit Tests");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      WhatsAppIdempotencyService.clearAll();
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`成果 FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // Log capture helpers
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

  await test("1. Valid GET verification returns hub.challenge (HTTP 200)", async () => {
    const { req, res, getStatus, getBody } = mockReqRes({
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": "my_custom_verify_token_54321",
        "hub.challenge": "1158201444",
      },
    });

    WhatsAppWebhookController.verifyWebhook(req, res);

    assert.strictEqual(getStatus(), 200);
    assert.strictEqual(getBody(), "1158201444");
  });

  await test("2. Invalid GET verify token returns HTTP 403", async () => {
    const { req, res, getStatus } = mockReqRes({
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": "WRONG_TOKEN",
        "hub.challenge": "1158201444",
      },
    });

    WhatsAppWebhookController.verifyWebhook(req, res);

    assert.strictEqual(getStatus(), 403);
  });

  await test("3. Missing GET verification parameters returns HTTP 400", async () => {
    const { req, res, getStatus } = mockReqRes({
      query: {
        "hub.mode": "subscribe",
        // missing verify_token and challenge
      },
    });

    WhatsAppWebhookController.verifyWebhook(req, res);

    assert.strictEqual(getStatus(), 400);
  });

  await test("4. Valid POST signature verification succeeds", async () => {
    const bodyObj = { object: "whatsapp_business_account", entry: [] };
    const rawBody = JSON.stringify(bodyObj);
    const signature = `sha256=${crypto.createHmac("sha256", process.env.WHATSAPP_APP_SECRET!).update(rawBody).digest("hex")}`;

    const { req, res, getStatus } = mockReqRes({
      headers: { "x-hub-signature-256": signature },
      body: bodyObj,
      rawBody,
    });

    let middlewarePassed = false;
    verifyWhatsAppWebhookSignature(req, res, () => {
      middlewarePassed = true;
    });

    assert.strictEqual(middlewarePassed, true);
    assert.strictEqual(getStatus(), 200);
  });

  await test("5. Invalid POST signature returns HTTP 401", async () => {
    const bodyObj = { object: "whatsapp_business_account", entry: [] };
    const rawBody = JSON.stringify(bodyObj);
    const invalidSignature = "sha256=invalid_signature_hash_0000000000000000000000000000000000000000000000000000000000000000";

    const { req, res, getStatus } = mockReqRes({
      headers: { "x-hub-signature-256": invalidSignature },
      body: bodyObj,
      rawBody,
    });

    let middlewarePassed = false;
    verifyWhatsAppWebhookSignature(req, res, () => {
      middlewarePassed = true;
    });

    assert.strictEqual(middlewarePassed, false);
    assert.strictEqual(getStatus(), 401);
  });

  await test("6. Missing POST signature returns HTTP 400", async () => {
    const { req, res, getStatus } = mockReqRes({
      headers: {},
      body: {},
    });

    let middlewarePassed = false;
    verifyWhatsAppWebhookSignature(req, res, () => {
      middlewarePassed = true;
    });

    assert.strictEqual(middlewarePassed, false);
    assert.strictEqual(getStatus(), 400);
  });

  await test("7. Message event dispatching and phone number masking", async () => {
    startLogCapture();

    const samplePayload: WhatsAppWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "100000000000001" },
                contacts: [{ profile: { name: "Test User" }, wa_id: "919876543210" }],
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.HBgLMTIzNDU2Nzg5MA==",
                    timestamp: "1720000000",
                    type: "text",
                    text: { body: "Hello Nikah Support" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await WhatsAppWebhookDispatcher.dispatch(samplePayload);

    const logOutput = stopLogCapture();

    assert.ok(logOutput.includes("Inbound Message"));
    assert.ok(logOutput.includes("wamid.HBgLMTIzNDU2Nzg5MA=="));
    assert.ok(logOutput.includes("91*****3210"), "Phone number was not properly masked!");
  });

  await test("8. Outbound status event dispatching", async () => {
    startLogCapture();

    const samplePayload: WhatsAppWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "100000000000001" },
                statuses: [
                  {
                    id: "wamid.OUTBOUND_123",
                    status: "delivered",
                    timestamp: "1720000005",
                    recipient_id: "919876543210",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await WhatsAppWebhookDispatcher.dispatch(samplePayload);

    const logOutput = stopLogCapture();

    assert.ok(logOutput.includes("Status Update"));
    assert.ok(logOutput.includes("delivered"));
  });

  await test("9. Duplicate event handling (idempotency)", async () => {
    startLogCapture();

    const samplePayload: WhatsAppWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "200000000000002",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "919876543210", phone_number_id: "100000000000001" },
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.DUPLICATE_TEST_ID",
                    timestamp: "1720000000",
                    type: "text",
                    text: { body: "Duplicate test" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    // First dispatch
    await WhatsAppWebhookDispatcher.dispatch(samplePayload);
    // Duplicate dispatch
    await WhatsAppWebhookDispatcher.dispatch(samplePayload);

    const logOutput = stopLogCapture();

    assert.ok(logOutput.includes("DUPLICATE"));
    assert.ok(logOutput.includes("already processed. Skipping."));
  });

  await test("10. Secrets and verify tokens are NEVER logged in trace or errors", async () => {
    startLogCapture();

    const { req, res } = mockReqRes({
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        "hub.challenge": "123456",
      },
    });

    WhatsAppWebhookController.verifyWebhook(req, res);

    const logOutput = stopLogCapture();

    assert.strictEqual(
      logOutput.includes(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!),
      false,
      "CRITICAL: WHATSAPP_WEBHOOK_VERIFY_TOKEN was leaked in logs!"
    );
    assert.strictEqual(
      logOutput.includes(process.env.WHATSAPP_APP_SECRET!),
      false,
      "CRITICAL: WHATSAPP_APP_SECRET was leaked in logs!"
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
