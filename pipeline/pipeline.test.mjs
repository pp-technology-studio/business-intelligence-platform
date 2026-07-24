import assert from "node:assert/strict";
import test from "node:test";
import { buildAnalytics } from "./run.mjs";

test("builds a complete and internally consistent analytics model", async () => {
  const output = await buildAnalytics();
  assert.equal(output.meta.dataset, "Fictional business transactions");
  assert.equal(output.quality.status, "Passed");
  assert.equal(output.quality.rowsRead, 36);
  assert.equal(output.quality.rowsAccepted, 36);
  assert.equal(output.quality.rowsRejected, 0);
  assert.equal(output.orders.length, 36);
  assert.equal(output.monthly.length, 6);
  assert.equal(output.byRegion.length, 3);
  assert.equal(output.byChannel.length, 3);
  assert.equal(
    output.overall.revenue,
    output.monthly.reduce((sum, month) => sum + month.revenue, 0),
  );
  assert.ok(output.overall.margin > 0 && output.overall.margin < 1);
  assert.match(output.meta.disclaimer, /fictional sample data/i);
});
