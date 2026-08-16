import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("confirmation email delivery can be checked and safely resent", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "escape-mail-v201-"));
  const now = Date.now();
  const sourceData = {
    activeRouteId: "route-test",
    routes: [{ id: "route-test", title: "Parcours test", area: "Test", pricePerTeam: 1, shopVisible: true, puzzles: [] }],
    teams: [],
    codes: [{
      code: "111-TST-222",
      routeId: "route-test",
      status: "available",
      source: "stripe",
      stripeSessionId: "cs_test_mail_v201",
      customerEmail: "client@example.com",
      createdAt: now,
      confirmationEmailStatus: "sent",
      confirmationEmailSentAt: now,
      confirmationEmailId: "mail-initial",
      confirmationEmailAttempt: 1,
    }],
  };
  await writeFile(path.join(dataDir, "escape-data.json"), JSON.stringify(sourceData, null, 2));

  globalThis.process.env.DATA_DIR = dataDir;
  globalThis.process.env.ADMIN_PASSWORD = "mail-test-password";
  globalThis.process.env.RESEND_API_KEY = "re_test_only";
  globalThis.process.env.MAIL_FROM = "Escape test <test@example.com>";
  globalThis.process.env.DISABLE_BACKGROUND_JOBS = "true";

  const originalFetch = globalThis.fetch;
  const resendCalls = [];
  let sendAttempts = 0;
  let readRestricted = false;
  globalThis.fetch = async (input, options = {}) => {
    const url = String(input);
    if (url.startsWith("https://api.resend.com/emails/")) {
      resendCalls.push({ method: options.method || "GET", url, headers: { ...options.headers } });
      if (readRestricted) {
        return new Response(JSON.stringify({ message: "This API key is restricted to only send emails" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ id: url.split("/").pop(), last_event: "delivered" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url === "https://api.resend.com/emails") {
      sendAttempts += 1;
      resendCalls.push({ method: options.method, url, headers: { ...options.headers }, body: JSON.parse(options.body) });
      if (sendAttempts === 1) {
        return new Response(JSON.stringify({ message: "temporary" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ id: "mail-resent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalFetch(input, options);
  };

  const { startServer } = await import(`../server.mjs?test=${Date.now()}`);
  const port = 42000 + Math.floor(Math.random() * 1000);
  const started = await startServer({ port, host: "127.0.0.1" });
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await new Promise((resolve) => started.server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });

  const origin = `http://127.0.0.1:${port}`;
  const unauthorized = await originalFetch(`${origin}/api/admin/email-delivery?code=111-TST-222`);
  assert.equal(unauthorized.status, 401);

  const login = await originalFetch(`${origin}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "mail-test-password" }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const delivery = await originalFetch(`${origin}/api/admin/email-delivery?code=111-TST-222`, {
    headers: { Cookie: cookie },
  });
  assert.equal(delivery.status, 200);
  assert.equal((await delivery.json()).event, "delivered");

  const rejectedResend = await originalFetch(`${origin}/api/admin/email-delivery`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ code: "111-TST-222" }),
  });
  assert.equal(rejectedResend.status, 400);
  assert.equal(sendAttempts, 0);

  const resend = await originalFetch(`${origin}/api/admin/email-delivery`, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ code: "111-TST-222", confirm: "RENVOYER_EMAIL" }),
  });
  assert.equal(resend.status, 200);
  assert.equal(sendAttempts, 2);
  const sendCalls = resendCalls.filter((call) => call.method === "POST");
  assert.equal(sendCalls[0].headers["Idempotency-Key"], sendCalls[1].headers["Idempotency-Key"]);

  const stored = JSON.parse(await readFile(path.join(dataDir, "escape-data.json"), "utf8"));
  assert.equal(stored.routes.length, 1);
  assert.equal(stored.codes.length, 1);
  assert.equal(stored.codes[0].confirmationEmailStatus, "sent");
  assert.equal(stored.codes[0].confirmationEmailDeliveryStatus, "accepted");
  assert.equal(stored.codes[0].confirmationEmailId, "mail-resent");
  assert.equal(stored.codes[0].confirmationEmailAttempt, 2);

  readRestricted = true;
  const restrictedDelivery = await originalFetch(`${origin}/api/admin/email-delivery?code=111-TST-222`, {
    headers: { Cookie: cookie },
  });
  assert.equal(restrictedDelivery.status, 200);
  const restrictedPayload = await restrictedDelivery.json();
  assert.equal(restrictedPayload.trackingAvailable, false);
  assert.equal(restrictedPayload.event, "accepted");
});
