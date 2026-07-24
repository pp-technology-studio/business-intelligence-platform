"use client";

import { useState } from "react";
import analytics from "@/generated/analytics.json";

type Order = (typeof analytics.orders)[number];
type Range = "90 days" | "6 months" | "All data";

const rangeMonths: Record<Range, number> = {
  "90 days": 3,
  "6 months": 6,
  "All data": 99,
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function summarize(rows: Order[]) {
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const grossProfit = revenue - cost;
  const onTime = rows.filter((row) => row.status === "On time").length;
  return {
    revenue,
    grossProfit,
    margin: revenue ? grossProfit / revenue : 0,
    averageOrder: rows.length ? revenue / rows.length : 0,
    onTimeRate: rows.length ? onTime / rows.length : 0,
    orders: rows.length,
  };
}

function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
}

export default function Home() {
  const [range, setRange] = useState<Range>("6 months");
  const [region, setRegion] = useState("All regions");
  const allMonths = analytics.monthly.map((item) => item.month);
  const selectedMonths = allMonths.slice(-rangeMonths[range]);

  const rows = analytics.orders.filter(
    (order) =>
      selectedMonths.includes(order.month) &&
      (region === "All regions" || order.region === region),
  );
  const summary = summarize(rows);
  const monthly = selectedMonths.map((month) => {
    const monthRows = rows.filter((row) => row.month === month);
    return {
      month,
      ...summarize(monthRows),
      target: analytics.monthly.find((item) => item.month === month)?.target ?? 0,
    };
  });
  const channels = ["Direct", "Digital", "Partner"].map((channel) => ({
    channel,
    ...summarize(rows.filter((row) => row.channel === channel)),
  }));
  const maxRevenue = Math.max(...monthly.map((item) => Math.max(item.revenue, item.target)), 1);
  const targetTotal = monthly.reduce((sum, item) => sum + item.target, 0);
  const targetAttainment = region === "All regions" && targetTotal ? summary.revenue / targetTotal : null;

  return (
    <main className="app-shell" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signal Intelligence home">
          <span className="brand-mark">P&amp;P</span>
          <span><strong>Signal Intelligence</strong><small>P&amp;P Technology Studio</small></span>
        </a>
        <nav aria-label="Dashboard navigation">
          <a href="#overview">Overview</a>
          <a href="#performance">Performance</a>
          <a href="#quality">Data quality</a>
          <a href="#lineage">Pipeline</a>
        </nav>
        <a className="download-link" href="/data/analytics.json" download>Download modeled data <span>↓</span></a>
      </header>

      <section className="hero" id="overview">
        <div className="hero-copy">
          <div className="demo-label"><i /> Functional demonstration · Fictional data</div>
          <p className="kicker">Business Intelligence &amp; Data Pipeline</p>
          <h1>From raw files to a decision-ready view.</h1>
          <p className="hero-lead">
            A reproducible analytics workflow that validates source data, models business KPIs,
            and publishes an interactive executive dashboard.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#performance">Explore dashboard <span>↓</span></a>
            <a className="plain-link" href="#lineage">Inspect the pipeline <span>→</span></a>
          </div>
        </div>

        <div className="hero-scorecard" aria-label="Illustrative executive scorecard">
          <div className="scorecard-head">
            <div><span>EXECUTIVE VIEW</span><strong>Fictional operating model</strong></div>
            <em><i /> Pipeline healthy</em>
          </div>
          <div className="scorecard-primary">
            <p>Modeled revenue</p>
            <strong>{currency.format(summary.revenue)}</strong>
            <span>{summary.orders} accepted records</span>
          </div>
          <div className="scorecard-grid">
            <article><span>Gross margin</span><strong>{percent.format(summary.margin)}</strong><small>Revenue less modeled cost</small></article>
            <article><span>On-time rate</span><strong>{percent.format(summary.onTimeRate)}</strong><small>Illustrative delivery status</small></article>
          </div>
          <div className="mini-trend" aria-label="Monthly revenue trend">
            {monthly.map((item) => <i key={item.month} style={{ height: `${Math.max(12, (item.revenue / maxRevenue) * 100)}%` }} />)}
          </div>
          <div className="scorecard-foot"><span>orders.csv</span><b>+</b><span>targets.csv</span><b>→</b><strong>analytics.json</strong></div>
        </div>
      </section>

      <section className="data-boundary">
        <span>Evidence boundary</span>
        <p>All transactions, targets, metrics, regions, and performance values are fictional sample data. They are not P&amp;P Technology Studio results or client outcomes.</p>
      </section>

      <section className="dashboard" id="performance">
        <div className="section-heading">
          <div><p className="kicker">Interactive reporting layer</p><h2>Executive performance</h2></div>
          <div className="controls">
            <div className="range-control" aria-label="Reporting period">
              {(["90 days", "6 months", "All data"] as Range[]).map((item) => (
                <button type="button" key={item} onClick={() => setRange(item)} aria-pressed={range === item} className={range === item ? "active" : ""}>{item}</button>
              ))}
            </div>
            <label>Region
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                <option>All regions</option><option>North</option><option>Central</option><option>South</option>
              </select>
            </label>
          </div>
        </div>

        <div className="metric-grid">
          <Metric label="Revenue" value={currency.format(summary.revenue)} note={targetAttainment ? `${percent.format(targetAttainment)} of illustrative target` : `${summary.orders} filtered orders`} tone="aqua" />
          <Metric label="Gross margin" value={percent.format(summary.margin)} note={`${currency.format(summary.grossProfit)} modeled gross profit`} tone="lime" />
          <Metric label="On-time delivery" value={percent.format(summary.onTimeRate)} note="Based on fictional status values" tone="blue" />
          <Metric label="Average order" value={currency.format(summary.averageOrder)} note="Filtered modeled revenue per order" tone="amber" />
        </div>

        <div className="analytics-grid">
          <section className="panel revenue-panel">
            <div className="panel-heading"><div><p className="eyebrow">Revenue vs target</p><h3>Monthly performance</h3></div><span>Modeled revenue <i /> Target <i /></span></div>
            <div className="bar-chart" aria-label="Monthly modeled revenue and target">
              {monthly.map((item) => (
                <div className="bar-group" key={item.month}>
                  <div className="bar-values"><span style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}><i>{currency.format(item.revenue)}</i></span><span className="target" style={{ height: `${(item.target / maxRevenue) * 100}%` }} /></div>
                  <strong>{monthLabel(item.month)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel channel-panel">
            <div className="panel-heading"><div><p className="eyebrow">Revenue mix</p><h3>Channel contribution</h3></div></div>
            <div className="channel-list">
              {channels.map((item, index) => (
                <article key={item.channel}>
                  <div><span>0{index + 1}</span><strong>{item.channel}</strong><em>{currency.format(item.revenue)}</em></div>
                  <div className="progress"><i style={{ width: `${summary.revenue ? (item.revenue / summary.revenue) * 100 : 0}%` }} /></div>
                  <small>{summary.revenue ? percent.format(item.revenue / summary.revenue) : "0%"} of filtered revenue</small>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="panel table-panel">
          <div className="panel-heading"><div><p className="eyebrow">Modeled fact table</p><h3>Recent accepted records</h3></div><span>{rows.length} rows in current view</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Record</th><th>Date</th><th>Region</th><th>Channel</th><th>Segment</th><th>Status</th><th>Revenue</th></tr></thead>
              <tbody>{[...rows].reverse().slice(0, 7).map((order) => (
                <tr key={order.id}><td>{order.id}</td><td>{order.date}</td><td>{order.region}</td><td>{order.channel}</td><td>{order.segment}</td><td><span className={order.status === "On time" ? "status good" : "status delayed"}><i />{order.status}</span></td><td>{currency.format(order.revenue)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="quality-section" id="quality">
        <div className="quality-intro">
          <p className="kicker">Data observability</p>
          <h2>Trust starts before the chart.</h2>
          <p>The pipeline rejects invalid identifiers, dimensions, dates, and numeric ranges before any KPI is published.</p>
        </div>
        <div className="quality-card">
          <div className="quality-summary"><span>Latest pipeline run</span><strong>{analytics.quality.status}</strong><em>{analytics.quality.rowsAccepted} accepted · {analytics.quality.rowsRejected} rejected</em></div>
          <div className="quality-checks">
            {analytics.quality.checks.map((check, index) => <div key={check.name}><span>0{index + 1}</span><strong>{check.name}</strong><em><i />{check.status}</em></div>)}
          </div>
        </div>
      </section>

      <section className="lineage-section" id="lineage">
        <div className="section-heading light">
          <div><p className="kicker">Reproducible pipeline</p><h2>Clear lineage.<br />No hidden spreadsheet logic.</h2></div>
          <p>Each stage is represented in the repository and can be rerun from source files to the published analytics model.</p>
        </div>
        <div className="lineage-grid">
          {analytics.lineage.map((step) => <article key={step.stage}><span>{step.stage}</span><h3>{step.name}</h3><p>{step.detail}</p></article>)}
        </div>
        <div className="lineage-note"><span>Source boundary</span><p>Two versioned CSV inputs produce one validated JSON model. The build fails when deterministic quality checks fail.</p><a href="/data/analytics.json" download>Inspect output <b>↓</b></a></div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">P&amp;P</span><span><strong>Signal Intelligence</strong><small>P&amp;P Technology Studio</small></span></div>
        <p>Functional Business Intelligence &amp; Data Pipeline demonstration.</p>
        <a href="https://pptechnologystudio.com/work">P&amp;P project catalog <span>↗</span></a>
      </footer>
    </main>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <article className={`metric-card ${tone}`}><div><span>{label}</span><i /></div><strong>{value}</strong><p>{note}</p></article>;
}
