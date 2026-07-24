import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "data", "source");
const outputDir = path.join(root, "generated");
const publicOutputDir = path.join(root, "public", "data");

const allowedRegions = new Set(["North", "Central", "South"]);
const allowedChannels = new Set(["Direct", "Digital", "Partner"]);
const allowedSegments = new Set(["Core", "Growth", "Enterprise"]);
const allowedStatuses = new Set(["On time", "Delayed"]);

function parseCsv(text) {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const keys = header.split(",");
  return rows.map((row) =>
    Object.fromEntries(row.split(",").map((value, index) => [keys[index], value])),
  );
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function groupBy(rows, key) {
  return rows.reduce((groups, row) => {
    const value = row[key];
    groups[value] ??= [];
    groups[value].push(row);
    return groups;
  }, {});
}

function summarize(rows) {
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const grossProfit = revenue - cost;
  const onTime = rows.filter((row) => row.status === "On time").length;
  return {
    orders: rows.length,
    revenue,
    grossProfit,
    margin: revenue ? round(grossProfit / revenue, 4) : 0,
    averageOrder: rows.length ? round(revenue / rows.length) : 0,
    onTimeRate: rows.length ? round(onTime / rows.length, 4) : 0,
  };
}

function validateOrders(rows) {
  const failures = [];
  const ids = new Set();
  rows.forEach((row, index) => {
    const line = index + 2;
    const required = ["order_id", "date", "region", "channel", "segment", "revenue", "cost", "status"];
    required.forEach((field) => {
      if (!row[field]) failures.push(`Line ${line}: missing ${field}`);
    });
    if (ids.has(row.order_id)) failures.push(`Line ${line}: duplicate order_id`);
    ids.add(row.order_id);
    if (!allowedRegions.has(row.region)) failures.push(`Line ${line}: invalid region`);
    if (!allowedChannels.has(row.channel)) failures.push(`Line ${line}: invalid channel`);
    if (!allowedSegments.has(row.segment)) failures.push(`Line ${line}: invalid segment`);
    if (!allowedStatuses.has(row.status)) failures.push(`Line ${line}: invalid status`);
    if (!Number.isFinite(Number(row.revenue)) || Number(row.revenue) <= 0) failures.push(`Line ${line}: invalid revenue`);
    if (!Number.isFinite(Number(row.cost)) || Number(row.cost) < 0) failures.push(`Line ${line}: invalid cost`);
    if (Number.isNaN(Date.parse(row.date))) failures.push(`Line ${line}: invalid date`);
  });
  return failures;
}

export async function buildAnalytics() {
  const [ordersText, targetsText] = await Promise.all([
    readFile(path.join(sourceDir, "orders.csv"), "utf8"),
    readFile(path.join(sourceDir, "targets.csv"), "utf8"),
  ]);
  const rawOrders = parseCsv(ordersText);
  const targets = parseCsv(targetsText).map((row) => ({
    month: row.month,
    revenueTarget: Number(row.revenue_target),
    marginTarget: Number(row.margin_target),
  }));
  const failures = validateOrders(rawOrders);
  if (failures.length) throw new Error(`Data quality checks failed:\n${failures.join("\n")}`);

  const orders = rawOrders.map((row) => ({
    id: row.order_id,
    date: row.date,
    month: row.date.slice(0, 7),
    region: row.region,
    channel: row.channel,
    segment: row.segment,
    revenue: Number(row.revenue),
    cost: Number(row.cost),
    status: row.status,
  }));
  const monthly = Object.entries(groupBy(orders, "month")).map(([month, rows]) => ({
    month,
    ...summarize(rows),
    target: targets.find((target) => target.month === month)?.revenueTarget ?? 0,
  }));
  const byRegion = Object.entries(groupBy(orders, "region")).map(([region, rows]) => ({
    region,
    ...summarize(rows),
  }));
  const byChannel = Object.entries(groupBy(orders, "channel")).map(([channel, rows]) => ({
    channel,
    ...summarize(rows),
  }));
  const latestDate = orders.map((order) => order.date).sort().at(-1);
  const output = {
    meta: {
      dataset: "Fictional business transactions",
      generatedAt: new Date().toISOString(),
      sourceFiles: ["orders.csv", "targets.csv"],
      latestRecordDate: latestDate,
      disclaimer: "All records and metrics are fictional sample data for product demonstration.",
    },
    quality: {
      status: "Passed",
      rowsRead: rawOrders.length,
      rowsAccepted: orders.length,
      rowsRejected: 0,
      checks: [
        { name: "Required fields", status: "Passed" },
        { name: "Unique order IDs", status: "Passed" },
        { name: "Allowed dimensions", status: "Passed" },
        { name: "Numeric ranges", status: "Passed" },
        { name: "Date validity", status: "Passed" },
      ],
    },
    lineage: [
      { stage: "01", name: "Source", detail: "orders.csv + targets.csv" },
      { stage: "02", name: "Validate", detail: "5 deterministic quality rules" },
      { stage: "03", name: "Model", detail: "Revenue, margin, delivery dimensions" },
      { stage: "04", name: "Publish", detail: "Versioned analytics JSON" },
    ],
    overall: summarize(orders),
    monthly,
    byRegion,
    byChannel,
    orders,
  };

  await Promise.all([
    mkdir(outputDir, { recursive: true }),
    mkdir(publicOutputDir, { recursive: true }),
  ]);
  const json = `${JSON.stringify(output, null, 2)}\n`;
  await Promise.all([
    writeFile(path.join(outputDir, "analytics.json"), json),
    writeFile(path.join(publicOutputDir, "analytics.json"), json),
  ]);
  return output;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/pipeline/run.mjs")) {
  const output = await buildAnalytics();
  console.log(`Pipeline complete: ${output.quality.rowsAccepted} accepted rows, ${output.quality.rowsRejected} rejected.`);
}
