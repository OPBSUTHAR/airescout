# GitHub Projects board — AirScout

This file documents the **AirScout Delivery Board** GitHub Project (Projects v2).
It is the recommended way to track the M1–M8 milestones.

> Creating a Projects v2 board requires the `project` OAuth scope. If your `gh`
> token does not have it, run once in your own terminal:
>
> ```bash
> gh auth refresh --scopes project
> ```
>
> Then create the board with:
>
> ```bash
> gh api graphql -f query='
>   mutation($input: CreateProjectV2Input!) {
>     createProjectV2(input: $input) {
>       projectV2 { id number title url }
>     }
>   }
> ' -f input[title]='AirScout Delivery Board' -f input[ownerId]='U_kgDOCqNSYw'
> ```

## Board layout

Columns (status field):

| Column | Meaning |
| --- | --- |
| **Backlog** | Not yet started |
| **In progress** | Actively being worked on |
| **In review** | PR open, awaiting review |
| **Done** | Merged and shipped |

## Cards (one per milestone issue)

| # | Title | Milestone | Status |
| --- | --- | --- | --- |
| 1 | M1: Scaffold Next.js app, tooling and repo | M1 | Done |
| 2 | M2: Build AQI data layer (Open-Meteo) | M2 | Done |
| 3 | M3: Route engine and scoring model | M3 | Done |
| 4 | M4: Map UI and route comparison | M4 | Done |
| 5 | M5: Exposure timeline | M5 | Done |
| 6 | M6: CI with GitHub Actions and GitHub Pages docs | M6 | Done |
| 7 | M7: Tests and performance | M7 | Done |
| 8 | M8: Monitoring, docs and release | M8 | Done |

## Custom fields

- **Priority** (single select): P0 / P1 / P2
- **Effort** (number, days)
- **Area** (single select): data / routing / ui / ci / docs
- **Target date** (date)

## Views

1. **Board** — grouped by Status (default).
2. **Roadmap** — timeline by Target date.
3. **Table** — all fields, sortable.

## Automation rules

- When an issue is closed → move card to **Done**.
- When a PR is opened referencing an issue → move card to **In review**.
- When an issue is assigned → move card to **In progress**.

## Linked artifacts

- Repo: https://github.com/OPBSUTHAR/airescout
- Issues: #1 … #8 (all closed)
- Milestones: M1 … M8 (all closed)
- Release: v1.0.0
- Docs: https://opbsuthar.github.io/airescout/
- CI: GitHub Actions (CI, Deploy Docs, Air Quality Endpoint Health)