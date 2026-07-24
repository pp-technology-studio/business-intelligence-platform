# Signal Intelligence

Signal Intelligence is a functional Business Intelligence and data pipeline
demonstration by P&P Technology Studio. It shows how raw business files can be
validated, modeled, and presented as an interactive executive reporting layer.

## Evidence boundary

Every transaction, target, metric, region, status, and performance value in this
repository is fictional sample data created for product demonstration. Nothing
in the dashboard represents P&P Technology Studio results, a client engagement,
or a historical business outcome.

## What this demonstrates

- deterministic ingestion of two versioned CSV source files;
- data-quality checks for required fields, unique identifiers, dimensions,
  numeric ranges, and dates;
- modeled revenue, margin, delivery, region, channel, and segment measures;
- interactive period and region filters;
- a dashboard-first application shell with dedicated Overview, Performance,
  Data Quality, and Pipeline views;
- executive KPIs, monthly target comparison, channel contribution, regional
  and segment analysis, and modeled records;
- visible lineage from source files to the published analytics model; and
- a downloadable JSON model generated from the same pipeline used by the UI.

## Architecture

```text
data/source/orders.csv ─┐
                        ├─ pipeline/run.mjs ─ generated/analytics.json
data/source/targets.csv ┘                  └─ public/data/analytics.json
                                                        │
                                                        └─ dashboard UI
```

The build reruns the pipeline before compiling the site. Invalid source data
causes the pipeline, tests, and build to fail.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run pipeline
npm run dev
```

Run the checks:

```bash
npm run lint
npm test
npm run build
```

## Publication status

This project is currently a local, unpublished demonstration. Repository
creation, public deployment, catalog integration, and domain configuration
remain subject to explicit approval.

## Brand

Signal Intelligence is a demonstration product by
[P&P Technology Studio](https://pptechnologystudio.com/).
