import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Signal Intelligence demonstration", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Signal Intelligence \| P&amp;P Technology Studio<\/title>/i);
  assert.match(html, /Functional demonstration/);
  assert.match(html, /Fictional data/);
  assert.match(html, /Executive performance/);
  assert.match(html, /Data observability/);
  assert.match(html, /Reproducible pipeline/);
  assert.match(html, /They are not P&amp;P Technology Studio results or client outcomes/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /Pablozxch Studios|Business Growth/i);
});
