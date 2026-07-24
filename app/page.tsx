"use client";

import { useState } from "react";
import analytics from "@/generated/analytics.json";

type Order = (typeof analytics.orders)[number];
type Range = "90 days" | "6 months" | "All data";
type View = "overview" | "performance" | "quality" | "pipeline";

const rangeMonths: Record<Range, number> = {
  "90 days": 3,
  "6 months": 6,
  "All data": 99,
};

const viewDetails: Record<View, { title: string; eyebrow: string }> = {
  overview: { title: "Executive overview", eyebrow: "Decision workspace" },
  performance: { title: "Performance analysis", eyebrow: "Modeled results" },
  quality: { title: "Data quality", eyebrow: "Observability" },
  pipeline: { title: "Pipeline lineage", eyebrow: "Data engineering" },
};

const navItems: Array<{ id: View; label: string; code: string }> = [
  { id: "overview", label: "Overview", code: "OV" },
  { id: "performance", label: "Performance", code: "PF" },
  { id: "quality", label: "Data quality", code: "DQ" },
  { id: "pipeline", label: "Pipeline", code: "PL" },
];

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

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
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
  const regions = ["North", "Central", "South"].map((item) => ({
    region: item,
    ...summarize(rows.filter((row) => row.region === item)),
  }));
  const segments = ["Core", "Growth", "Enterprise"].map((segment) => ({
    segment,
    ...summarize(rows.filter((row) => row.segment === segment)),
  }));
  const maxRevenue = Math.max(
    ...monthly.map((item) => Math.max(item.revenue, item.target)),
    1,
  );
  const targetTotal = monthly.reduce((sum, item) => sum + item.target, 0);
  const targetAttainment =
    region === "All regions" && targetTotal
      ? summary.revenue / targetTotal
      : null;
  const activeView = viewDetails[view];

  return (
    <main className="analytics-app">
      <aside className="sidebar">
        <div>
          <a
            className="brand"
            href="#workspace"
            onClick={() => setView("overview")}
            aria-label="Signal Intelligence overview"
          >
            <span className="brand-mark">P&amp;P</span>
            <span>
              <strong>Signal Intelligence</strong>
              <small>Technology Studio</small>
            </span>
          </a>

          <div className="workspace-label">
            <span>Workspace</span>
            <strong>Business intelligence</strong>
            <small>Functional demonstration</small>
          </div>

          <nav aria-label="Analytics sections">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={view === item.id ? "active" : ""}
                onClick={() => setView(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                <span>{item.code}</span>
                {item.label}
                <i />
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-foot">
          <div className="pipeline-state">
            <span><i /> Pipeline healthy</span>
            <strong>{analytics.quality.rowsAccepted} accepted records</strong>
          </div>
          <p>All data and performance values are fictional.</p>
          <a href="https://pptechnologystudio.com/work">
            P&amp;P project catalog <span>↗</span>
          </a>
        </div>
      </aside>

      <section className="workspace" id="workspace">
        <header className="workspace-header">
          <div>
            <p>{activeView.eyebrow}</p>
            <h1>{activeView.title}</h1>
          </div>
          <div className="header-actions">
            <span className="data-badge"><i /> Fictional demo data</span>
            <a href="/data/analytics.json" download>
              Export model <span>↓</span>
            </a>
          </div>
        </header>

        {(view === "overview" || view === "performance") && (
          <div className="filterbar">
            <div className="range-control" aria-label="Reporting period">
              {(["90 days", "6 months", "All data"] as Range[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setRange(item)}
                  aria-pressed={range === item}
                  className={range === item ? "active" : ""}
                >
                  {item}
                </button>
              ))}
            </div>
            <label>
              Region
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                <option>All regions</option>
                <option>North</option>
                <option>Central</option>
                <option>South</option>
              </select>
            </label>
            <div className="snapshot">
              <span>Data through</span>
              <strong>{dateLabel(analytics.meta.latestRecordDate)}</strong>
            </div>
          </div>
        )}

        <div className="content-area">
          {view === "overview" && (
            <Overview
              summary={summary}
              targetAttainment={targetAttainment}
              monthly={monthly}
              channels={channels}
              rows={rows}
              maxRevenue={maxRevenue}
              onNavigate={setView}
            />
          )}

          {view === "performance" && (
            <Performance
              summary={summary}
              regions={regions}
              segments={segments}
              rows={rows}
            />
          )}

          {view === "quality" && <DataQuality />}
          {view === "pipeline" && <Pipeline />}
        </div>
      </section>
    </main>
  );
}

function Overview({
  summary,
  targetAttainment,
  monthly,
  channels,
  rows,
  maxRevenue,
  onNavigate,
}: {
  summary: ReturnType<typeof summarize>;
  targetAttainment: number | null;
  monthly: Array<ReturnType<typeof summarize> & { month: string; target: number }>;
  channels: Array<ReturnType<typeof summarize> & { channel: string }>;
  rows: Order[];
  maxRevenue: number;
  onNavigate: (view: View) => void;
}) {
  return (
    <>
      <section className="metric-grid" aria-label="Executive key performance indicators">
        <Metric
          label="Modeled revenue"
          value={currency.format(summary.revenue)}
          note={
            targetAttainment
              ? `${percent.format(targetAttainment)} of illustrative target`
              : `${summary.orders} filtered records`
          }
          tone="aqua"
        />
        <Metric
          label="Gross margin"
          value={percent.format(summary.margin)}
          note={`${currency.format(summary.grossProfit)} modeled gross profit`}
          tone="lime"
        />
        <Metric
          label="On-time rate"
          value={percent.format(summary.onTimeRate)}
          note="Based on fictional delivery status"
          tone="blue"
        />
        <Metric
          label="Average order"
          value={currency.format(summary.averageOrder)}
          note="Modeled revenue per accepted record"
          tone="amber"
        />
      </section>

      <section className="overview-grid">
        <article className="panel trend-panel">
          <PanelHeading
            eyebrow="Revenue vs target"
            title="Monthly performance"
            action="Open analysis"
            onAction={() => onNavigate("performance")}
          />
          <div className="chart-legend">
            <span><i className="actual" /> Modeled revenue</span>
            <span><i className="target" /> Illustrative target</span>
          </div>
          <div className="bar-chart" aria-label="Monthly modeled revenue and target">
            {monthly.map((item) => (
              <div className="bar-group" key={item.month}>
                <div className="bar-values">
                  <span
                    className="actual"
                    style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                  >
                    <i>{currency.format(item.revenue)}</i>
                  </span>
                  <span
                    className="target"
                    style={{ height: `${(item.target / maxRevenue) * 100}%` }}
                  />
                </div>
                <strong>{monthLabel(item.month)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel mix-panel">
          <PanelHeading eyebrow="Revenue mix" title="Channel contribution" />
          <div className="channel-list">
            {channels.map((item, index) => (
              <div className="channel-row" key={item.channel}>
                <div className="channel-copy">
                  <span>0{index + 1}</span>
                  <strong>{item.channel}</strong>
                  <em>{currency.format(item.revenue)}</em>
                </div>
                <div className="progress">
                  <i
                    style={{
                      width: `${summary.revenue ? (item.revenue / summary.revenue) * 100 : 0}%`,
                    }}
                  />
                </div>
                <small>
                  {summary.revenue
                    ? percent.format(item.revenue / summary.revenue)
                    : "0%"}{" "}
                  of filtered revenue
                </small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="panel records-panel">
        <PanelHeading
          eyebrow="Modeled fact table"
          title="Recent accepted records"
          meta={`${rows.length} rows in current view`}
        />
        <OrdersTable rows={[...rows].reverse().slice(0, 7)} />
      </article>

      <aside className="evidence-note">
        <span>Evidence boundary</span>
        <p>
          Transactions, targets, metrics, regions, and performance values are
          fictional sample data. They are not P&amp;P Technology Studio results
          or client outcomes.
        </p>
      </aside>
    </>
  );
}

function Performance({
  summary,
  regions,
  segments,
  rows,
}: {
  summary: ReturnType<typeof summarize>;
  regions: Array<ReturnType<typeof summarize> & { region: string }>;
  segments: Array<ReturnType<typeof summarize> & { segment: string }>;
  rows: Order[];
}) {
  return (
    <>
      <section className="performance-summary">
        <div>
          <span>Current filtered revenue</span>
          <strong>{currency.format(summary.revenue)}</strong>
          <small>{summary.orders} accepted sample records</small>
        </div>
        <div>
          <span>Modeled gross profit</span>
          <strong>{currency.format(summary.grossProfit)}</strong>
          <small>{percent.format(summary.margin)} gross margin</small>
        </div>
        <div>
          <span>Delivery status</span>
          <strong>{percent.format(summary.onTimeRate)}</strong>
          <small>Fictional on-time rate</small>
        </div>
      </section>

      <section className="performance-grid">
        <article className="panel breakdown-panel">
          <PanelHeading eyebrow="Geographic view" title="Regional performance" />
          <BreakdownTable
            label="Region"
            rows={regions.map((item) => ({
              name: item.region,
              records: item.orders,
              revenue: item.revenue,
              margin: item.margin,
              onTime: item.onTimeRate,
            }))}
          />
        </article>
        <article className="panel breakdown-panel">
          <PanelHeading eyebrow="Portfolio view" title="Segment performance" />
          <BreakdownTable
            label="Segment"
            rows={segments.map((item) => ({
              name: item.segment,
              records: item.orders,
              revenue: item.revenue,
              margin: item.margin,
              onTime: item.onTimeRate,
            }))}
          />
        </article>
      </section>

      <article className="panel records-panel">
        <PanelHeading
          eyebrow="Filtered dataset"
          title="All modeled records"
          meta={`${rows.length} rows`}
        />
        <OrdersTable rows={rows} />
      </article>
    </>
  );
}

function DataQuality() {
  return (
    <>
      <section className="quality-hero">
        <div>
          <p>Latest pipeline run</p>
          <h2>{analytics.quality.status}</h2>
          <span>
            The modeled dataset passed every deterministic validation before
            publication.
          </span>
        </div>
        <div className="quality-score">
          <strong>{analytics.quality.checks.length}/{analytics.quality.checks.length}</strong>
          <span>quality checks passed</span>
        </div>
      </section>

      <section className="quality-layout">
        <article className="panel quality-checks">
          <PanelHeading eyebrow="Validation contract" title="Automated checks" />
          <div className="check-list">
            {analytics.quality.checks.map((check, index) => (
              <div key={check.name}>
                <span>0{index + 1}</span>
                <strong>{check.name}</strong>
                <em><i /> {check.status}</em>
              </div>
            ))}
          </div>
        </article>

        <div className="quality-stats">
          <article>
            <span>Rows read</span>
            <strong>{analytics.quality.rowsRead}</strong>
            <small>From the fictional source dataset</small>
          </article>
          <article>
            <span>Rows accepted</span>
            <strong>{analytics.quality.rowsAccepted}</strong>
            <small>Available to the reporting model</small>
          </article>
          <article>
            <span>Rows rejected</span>
            <strong>{analytics.quality.rowsRejected}</strong>
            <small>The pipeline would fail on invalid input</small>
          </article>
        </div>
      </section>

      <aside className="quality-contract">
        <div>
          <span>Source contract</span>
          <strong>Required fields · Unique IDs · Allowed dimensions · Numeric ranges · Valid dates</strong>
        </div>
        <p>
          This status demonstrates the validation behavior against the bundled
          fictional dataset; it does not claim perfect quality for real-world
          client data.
        </p>
      </aside>
    </>
  );
}

function Pipeline() {
  return (
    <>
      <section className="pipeline-intro">
        <div>
          <p>Reproducible data flow</p>
          <h2>From versioned sources to a decision-ready model.</h2>
        </div>
        <p>
          Every stage is represented in the repository and can be rerun from
          the same input files. There is no hidden spreadsheet logic.
        </p>
      </section>

      <section className="lineage-grid">
        {analytics.lineage.map((step, index) => (
          <article key={step.stage}>
            <div>
              <span>{step.stage}</span>
              <i />
            </div>
            <small>Stage {index + 1}</small>
            <h3>{step.name}</h3>
            <p>{step.detail}</p>
          </article>
        ))}
      </section>

      <section className="pipeline-layout">
        <article className="panel run-contract">
          <PanelHeading eyebrow="Build contract" title="Deterministic execution" />
          <div className="terminal">
            <span>$ npm run pipeline</span>
            <p>Reading orders.csv and targets.csv</p>
            <p>Running 5 deterministic validation rules</p>
            <p>Modeling revenue, margin, and delivery dimensions</p>
            <strong>
              Pipeline complete: {analytics.quality.rowsAccepted} accepted,{" "}
              {analytics.quality.rowsRejected} rejected.
            </strong>
          </div>
        </article>

        <article className="panel asset-map">
          <PanelHeading eyebrow="Versioned assets" title="Source and output map" />
          <div>
            <span>INPUT 01</span>
            <strong>data/source/orders.csv</strong>
          </div>
          <div>
            <span>INPUT 02</span>
            <strong>data/source/targets.csv</strong>
          </div>
          <div>
            <span>OUTPUT</span>
            <strong>public/data/analytics.json</strong>
          </div>
          <a href="/data/analytics.json" download>
            Download modeled output <span>↓</span>
          </a>
        </article>
      </section>

      <aside className="evidence-note dark">
        <span>Implementation boundary</span>
        <p>
          The local pipeline and dashboard are functional. Hosted orchestration,
          scheduled refreshes, and external production data sources are not part
          of this demonstration.
        </p>
      </aside>
    </>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div><span>{label}</span><i /></div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function PanelHeading({
  eyebrow,
  title,
  action,
  onAction,
  meta,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
  meta?: string;
}) {
  return (
    <header className="panel-heading">
      <div><p>{eyebrow}</p><h2>{title}</h2></div>
      {action && onAction ? (
        <button type="button" onClick={onAction}>{action} <span>→</span></button>
      ) : meta ? <span>{meta}</span> : null}
    </header>
  );
}

function OrdersTable({ rows }: { rows: Order[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Record</th>
            <th>Date</th>
            <th>Region</th>
            <th>Channel</th>
            <th>Segment</th>
            <th>Status</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.date}</td>
              <td>{order.region}</td>
              <td>{order.channel}</td>
              <td>{order.segment}</td>
              <td>
                <span className={order.status === "On time" ? "status good" : "status delayed"}>
                  <i /> {order.status}
                </span>
              </td>
              <td>{currency.format(order.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownTable({
  label,
  rows,
}: {
  label: string;
  rows: Array<{
    name: string;
    records: number;
    revenue: number;
    margin: number;
    onTime: number;
  }>;
}) {
  return (
    <div className="table-wrap">
      <table className="breakdown-table">
        <thead>
          <tr><th>{label}</th><th>Records</th><th>Revenue</th><th>Margin</th><th>On time</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.records}</td>
              <td>{currency.format(row.revenue)}</td>
              <td>{percent.format(row.margin)}</td>
              <td>{percent.format(row.onTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
