/* eslint-disable no-console */

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function readBody(res: Response): Promise<JsonValue | string> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return (await res.json()) as JsonValue;
    } catch {
      return await res.text();
    }
  }
  return await res.text();
}

async function callApi(name: string, input: string, init?: RequestInit) {
  const url = `${BASE_URL}${input}`;
  const res = await fetch(url, init);
  const body = await readBody(res);

  console.log(`\n=== ${name} ===`);
  console.log(`${init?.method || "GET"} ${url}`);
  console.log("Status:", res.status);
  console.log("Body:", body);

  return { res, body };
}

async function main() {
  // 1) GET /api/om/add-to-basket
  await callApi("add-to-basket (tracking log)", "/api/om/add-to-basket?action=add-to-basket&user=test-user&product=sku-123");

  // 2) POST /api/nps/score
  const npsScore = await callApi("nps/score (create vote)", "/api/nps/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nps_score: 9, nps_transaction_id: "test-tx-001" }),
  });

  // 3) POST /api/cart-sharing
  await callApi("cart-sharing (create)", "/api/cart-sharing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      basket: { name: "Test Basket" },
      userId: "test-user",
      products: [
        { name: "Product A", pk: "111", price: "10.00", quantity: 1 },
        { name: "Product B", pk: "222", price: "20.00", quantity: 2 },
      ],
    }),
  });

  // Optional: show how to use returned id for note update
  if (typeof npsScore.body === "object" && npsScore.body && "id" in npsScore.body) {
    const id = (npsScore.body as any).id as string;
    await callApi("nps/note (update note)", "/api/nps/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nps_note: "Test note" }),
    });
  }
}

main().catch((e) => {
  console.error("Test script failed:", e);
  process.exitCode = 1;
});

