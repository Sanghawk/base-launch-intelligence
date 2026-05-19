# GitHub Milestone Issue Workflow

## Purpose

This workflow standardizes how milestone work is generated, created in GitHub, ordered, and completed one branch at a time.

The goal is to remove manual GitHub issue creation from the build process while preserving the current project rhythm:

```text
1. Generate all milestone tasks.
2. Create milestone tasks on GitHub.
3. Create the completion order.
4. Complete one issue at a time on a branch.
```

The streamlined version is:

```text
1. Generate a milestone issue manifest.
2. Run one seed command to create labels, milestone, and issues.
3. Generate or review the completion order.
4. Work through issues one branch and PR at a time.
```

---

## Why this workflow exists

Manual issue creation is slow because every task requires repeated setup:

- title
- body
- labels
- milestone
- ordering context
- acceptance criteria

A manifest-based workflow moves that repetition into a structured file that can be reviewed, rerun, and versioned.

---

## Core idea

For each milestone, create a YAML manifest under the repository:

```text
.github/issue-seeds/m1.yml
.github/issue-seeds/m2.yml
.github/issue-seeds/m3.yml
```

Then run a local script:

```bash
pnpm tsx scripts/seed-github-issues.ts .github/issue-seeds/m1.yml --repo OWNER/REPO
```

The script should:

1. ensure labels exist
2. ensure the milestone exists
3. check whether each issue already exists
4. create only missing issues
5. attach the correct labels and milestone
6. print created issue URLs
7. print the recommended completion order

---

## Recommended repository files

Add the following structure:

```text
.github/
  issue-seeds/
    m1.yml
    m2.yml
    m3.yml

scripts/
  seed-github-issues.ts
```

Optional later additions:

```text
.github/
  issue-seeds/
    labels.yml
    milestones.yml

docs/
  github-workflow.md
```

---

## Prerequisites

### 1. GitHub CLI installed

Verify:

```bash
gh --version
```

### 2. Authenticated GitHub CLI

Verify:

```bash
gh auth status
```

If not authenticated:

```bash
gh auth login
```

### 3. Repository selected

From inside the repo:

```bash
gh repo view
```

Or pass the repo explicitly:

```bash
--repo OWNER/REPO
```

### 4. Project dependencies installed

```bash
pnpm install
```

---

## Manifest format

Each milestone manifest should define:

- milestone title
- milestone description
- labels required by the milestone
- issues to create
- completion order

Example:

```yaml
milestone:
  title: "M1 - Database Schema and Drizzle"
  description: "Implement the Stage 4 schema and migrations."

labels:
  - name: "milestone:m1"
    color: "5319e7"
    description: "Milestone 1 work"
  - name: "area:db"
    color: "0052cc"
    description: "Database and schema work"
  - name: "type:task"
    color: "0e8a16"
    description: "Implementation task"

issues:
  - key: "m1-001"
    title: "M1: Define Drizzle enums"
    labels:
      - "milestone:m1"
      - "area:db"
      - "type:task"
    order: 1
    body: |
      ## Summary
      Define enum types required by the MVP schema.

      ## Tasks
      - Add confidence enum.
      - Add risk level enum.
      - Add triage label enum.
      - Add alert type enum.
      - Add alert severity enum.
      - Add worker run status enum.

      ## Acceptance Criteria
      - Enums are represented in Drizzle.
      - Migration generation includes enum creation.
      - Enum values match the Stage 4 schema.
```

---

## Label taxonomy

Use labels that help filter work without becoming process overhead.

### Required labels

```text
milestone:m1
milestone:m2
milestone:m3

type:task
type:bug
type:docs
type:chore

area:db
area:worker
area:providers
area:normalization
area:scoring
area:alerts
area:api
area:frontend
area:devops
area:docs
```

### Optional labels

```text
priority:p0
priority:p1
priority:p2

risk:data-quality
risk:provider
risk:schema
risk:scope

status:blocked
status:needs-review
```

### Label rules

Each implementation issue should usually have:

```text
1 milestone label
1 type label
1 area label
optional priority/risk labels
```

Avoid creating too many labels early. The goal is task execution, not taxonomy maintenance.

---

## Issue body template

Every issue should use this structure:

```md
## Summary
One concise paragraph describing the task.

## Context
Why this task exists and what milestone goal it supports.

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Acceptance Criteria
- Criterion 1
- Criterion 2
- Criterion 3

## Implementation Notes
Optional notes, constraints, or suggested files.

## Out of Scope
Explicitly list what should not be included.
```

For this project, every issue should be written with enough context that it can be completed without re-reading all prior planning docs.

---

## Seed script behavior

The seed script should be intentionally conservative.

### Required behavior

1. Parse the manifest.
2. Validate required fields.
3. Create or update labels.
4. Create the milestone if missing.
5. Check for existing issues by exact title.
6. Create only missing issues.
7. Add labels and milestone during creation.
8. Print a summary.

### Idempotency rule

The script should be safe to rerun.

It should not create duplicates if an issue with the same title already exists.

Recommended duplicate key:

```text
issue.title
```

Optional stronger duplicate key:

```text
issue.key in hidden body comment
```

Example hidden body marker:

```md
<!-- issue-seed-key: m1-001 -->
```

### Output example

```text
Milestone: M1 - Database Schema and Drizzle

Labels:
- created: milestone:m1
- exists: area:db
- exists: type:task

Issues:
1. exists: M1: Define Drizzle enums (#13)
2. created: M1: Define token and deployer tables (#14)
3. created: M1: Define pool and snapshot tables (#15)

Completion order:
1. #13 M1: Define Drizzle enums
2. #14 M1: Define token and deployer tables
3. #15 M1: Define pool and snapshot tables
```

---

## GitHub CLI commands used by the script

### Create or update labels

```bash
gh label create "area:db" \
  --color "0052cc" \
  --description "Database and schema work" \
  --force \
  --repo OWNER/REPO
```

### Create an issue

```bash
gh issue create \
  --title "M1: Define Drizzle enums" \
  --body-file /tmp/m1-001.md \
  --label "milestone:m1" \
  --label "area:db" \
  --label "type:task" \
  --milestone "M1 - Database Schema and Drizzle" \
  --repo OWNER/REPO
```

### Check existing issues

```bash
gh issue list \
  --search '"M1: Define Drizzle enums" in:title' \
  --state all \
  --repo OWNER/REPO
```

### Create milestone

GitHub CLI does not need a dedicated milestone command if the script uses the GitHub API:

```bash
gh api repos/OWNER/REPO/milestones \
  --method POST \
  -f title="M1 - Database Schema and Drizzle" \
  -f description="Implement the Stage 4 schema and migrations."
```

The script should first list milestones and only create the milestone if it does not already exist.

---

## Standard milestone workflow

Use this process for every milestone after M0.

### Step 1 — Generate milestone tasks

Prompt:

```text
Generate the GitHub issue manifest for M1 based on the Stage 5 build plan. Include labels, milestone, issue bodies, acceptance criteria, and completion order.
```

Expected output:

```text
.github/issue-seeds/m1.yml
```

Review the manifest before running it.

---

### Step 2 — Seed GitHub issues

Run:

```bash
pnpm tsx scripts/seed-github-issues.ts .github/issue-seeds/m1.yml --repo OWNER/REPO
```

Verify:

```bash
gh issue list --milestone "M1 - Database Schema and Drizzle" --repo OWNER/REPO
```

---

### Step 3 — Generate or confirm completion order

The completion order should be encoded in the manifest using `order`.

Prompt:

```text
Given the created M1 GitHub issues, create the recommended completion order and explain dependencies briefly.
```

The order should prioritize dependency structure, not personal preference.

Example:

```text
1. schema enums
2. canonical identity tables
3. snapshot tables
4. indexes and constraints
5. migration generation
6. DB client
7. health query
8. smoke test
```

---

### Step 4 — Create a branch for the first issue

Branch naming format:

```text
milestone/issue-number-short-description
```

Examples:

```bash
git checkout main
git pull
git checkout -b m1/13-drizzle-enums
```

or:

```bash
git checkout -b issue-13-drizzle-enums
```

Use one branch per issue unless two issues are inseparable.

---

### Step 5 — Complete the issue locally

Before coding, restate the issue objective:

```text
Current issue: #13 M1: Define Drizzle enums.
Goal: implement enum definitions only. Do not add tables yet.
```

Then implement only what the issue requires.

Recommended local loop:

```bash
pnpm lint
pnpm format
pnpm test
pnpm build
```

Use the scripts that exist in the repo. If a script does not exist yet, do not invent process overhead unless the issue requires it.

---

### Step 6 — Commit with issue reference

Commit format:

```bash
git add .
git commit -m "M1: define Drizzle enums (#13)"
```

---

### Step 7 — Open a pull request

```bash
git push -u origin m1/13-drizzle-enums

gh pr create \
  --title "M1: Define Drizzle enums" \
  --body "Closes #13" \
  --base main \
  --head m1/13-drizzle-enums
```

The PR should include:

```md
## Summary
- What changed

## Verification
- Commands run

## Notes
- Known limitations or follow-up issues

Closes #13
```

---

### Step 8 — Merge, update main, move to next issue

After review:

```bash
git checkout main
git pull
```

Then start the next branch from updated `main`.

Do not stack multiple unrelated milestone tasks into one branch unless explicitly planned.

---

## Completion-order rules

The order should follow implementation dependency chains.

### Good order

```text
schema → data access → provider capture → normalization → worker loop → enrichment → scoring → alerts → API → UI → validation
```

### Bad order

```text
UI before API contract
scoring before risk/market data exists
alerts before scores exist
worker loop before basic DB writes exist
provider integrations before sample payloads are captured
```

---

## Milestone handoff checklist

Before starting a milestone:

- [ ] Manifest exists.
- [ ] Labels are defined.
- [ ] Milestone title is correct.
- [ ] Issues have acceptance criteria.
- [ ] Issues are small enough to complete one at a time.
- [ ] Completion order is known.
- [ ] First branch is created from latest `main`.

After finishing a milestone:

- [ ] All milestone issues are closed.
- [ ] README or docs are updated if commands changed.
- [ ] Local app still runs.
- [ ] Known limitations are documented.
- [ ] Next milestone manifest is generated.

---

## Guardrails

### Keep issues small

A good issue should usually be completable in one focused session.

If an issue requires changes across many layers, split it.

### Avoid scope creep

Each issue should include an `Out of Scope` section.

Example:

```md
## Out of Scope
- No frontend changes.
- No provider API calls.
- No scoring logic.
```

### Keep GitHub automation boring

Do not start with GitHub Projects automation, custom fields, or complex board automation.

Use:

```text
issues + labels + milestones + ordered manifest
```

That is enough for the current build stage.

### Make reruns safe

The seed script should not punish mistakes.

Rerunning the same manifest should be normal.

---

## Recommended ChatGPT prompts

### Generate a milestone manifest

```text
Generate the GitHub issue manifest for M1.
Use the existing Stage 5 build plan.
Include labels, milestone metadata, issue titles, issue bodies, acceptance criteria, and completion order.
Output as YAML for .github/issue-seeds/m1.yml.
```

### Generate a seed script

```text
Create scripts/seed-github-issues.ts.
It should read a YAML issue manifest, ensure labels exist, ensure the milestone exists, skip existing issues by title, create missing issues with labels and milestone, and print completion order.
```

### Start one issue

```text
Next issue: #13 M1: Define Drizzle enums.
Give me the implementation plan and exact files to change. Keep the scope limited to this issue.
```

### Review branch before PR

```text
Review the diff for issue #13 against the acceptance criteria. Identify missing work, unnecessary scope, and commands I should run before opening the PR.
```

### Generate PR body

```text
Generate a concise PR body for issue #13 using Summary, Verification, Notes, and Closes #13.
```

---

## Minimal first implementation

For the first version, do not overbuild the script.

Minimum useful script:

```text
- reads one YAML file
- creates labels with --force
- creates milestone if missing using gh api
- creates issues using gh issue create
- skips issues with matching title
- prints ordered issue list
```

That is enough to remove the slow manual part of the workflow.

---

## Future improvements

Only add these if the simple workflow becomes painful:

- dry-run mode
- update existing issue body when manifest changes
- project board assignment
- issue dependencies
- automatic PR body generation
- automatic branch creation
- issue status comments
- milestone progress report

Do not add these before the core MVP build loop is working.

---

## Final workflow summary

```text
For each milestone:

1. Generate .github/issue-seeds/mX.yml.
2. Review the manifest.
3. Run seed-github-issues.ts.
4. Verify GitHub issues and milestone.
5. Follow the printed completion order.
6. Create one branch per issue.
7. Complete only that issue's scope.
8. Open PR with Closes #issue.
9. Merge.
10. Repeat until milestone is complete.
```

This preserves the existing build rhythm while removing most of the manual GitHub setup cost.
