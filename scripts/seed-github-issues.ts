#!/usr/bin/env tsx

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import YAML from "yaml";

type LabelSeed = {
    name: string;
    color: string;
    description?: string;
};

type MilestoneSeed = {
    title: string;
    description?: string;
    due_on?: string;
};

type IssueSeed = {
    order?: number;
    title: string;
    body: string;
    labels?: string[];
    assignees?: string[];
};

type IssueManifest = {
    milestone: MilestoneSeed;
    labels?: LabelSeed[];
    issues: IssueSeed[];
};

type ExistingIssue = {
    number: number;
    title: string;
    url: string;
};

type Args = {
    manifestPath: string;
    repo?: string;
    dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
    const args = [...argv];
    const parsed: Args = {
        manifestPath: "",
        dryRun: false,
    };

    while (args.length > 0) {
        const arg = args.shift();

        if (!arg) continue;

        if (arg === "--repo") {
            parsed.repo = args.shift();
            continue;
        }

        if (arg === "--dry-run") {
            parsed.dryRun = true;
            continue;
        }

        if (!parsed.manifestPath) {
            parsed.manifestPath = arg;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!parsed.manifestPath) {
        throw new Error(
            "Usage: pnpm seed:issues .github/issue-seeds/m1.yml --repo OWNER/REPO [--dry-run]",
        );
    }

    return parsed;
}

function run(command: string, args: string[], options?: { allowFailure?: boolean }): string {
    const result = spawnSync(command, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.status !== 0 && !options?.allowFailure) {
        throw new Error(
            [
                `Command failed: ${command} ${args.join(" ")}`,
                result.stdout.trim(),
                result.stderr.trim(),
            ]
                .filter(Boolean)
                .join("\n"),
        );
    }

    return result.stdout.trim();
}

function runJson<T>(command: string, args: string[]): T {
    const stdout = run(command, args);

    try {
        return JSON.parse(stdout) as T;
    } catch {
        throw new Error(`Failed to parse JSON from command: ${command} ${args.join(" ")}\n${stdout}`);
    }
}

function repoArgs(repo?: string): string[] {
    return repo ? ["--repo", repo] : [];
}

function apiRepo(repo: string | undefined): string {
    if (repo) return repo;

    const nameWithOwner = run("gh", [
        "repo",
        "view",
        "--json",
        "nameWithOwner",
        "--jq",
        ".nameWithOwner",
    ]);

    if (!nameWithOwner.includes("/")) {
        throw new Error("Could not infer repo. Pass --repo OWNER/REPO explicitly.");
    }

    return nameWithOwner;
}

function assertGhIsReady(): void {
    run("gh", ["--version"]);
    run("gh", ["auth", "status"]);
}

function loadManifest(path: string): IssueManifest {
    const raw = readFileSync(path, "utf8");
    const parsed = YAML.parse(raw) as IssueManifest;

    validateManifest(parsed);

    return parsed;
}

function validateManifest(manifest: IssueManifest): void {
    if (!manifest || typeof manifest !== "object") {
        throw new Error("Manifest must be an object.");
    }

    if (!manifest.milestone?.title) {
        throw new Error("Manifest must include milestone.title.");
    }

    if (!Array.isArray(manifest.issues) || manifest.issues.length === 0) {
        throw new Error("Manifest must include at least one issue.");
    }

    const labelNames = new Set((manifest.labels ?? []).map((label) => label.name));

    for (const label of manifest.labels ?? []) {
        if (!label.name) throw new Error("Each label must include name.");
        if (!label.color) throw new Error(`Label "${label.name}" must include color.`);
        if (!/^[0-9a-fA-F]{6}$/.test(label.color)) {
            throw new Error(`Label "${label.name}" color must be a 6-character hex value.`);
        }
    }

    const titles = new Set<string>();

    for (const issue of manifest.issues) {
        if (!issue.title) throw new Error("Each issue must include title.");
        if (!issue.body) throw new Error(`Issue "${issue.title}" must include body.`);

        if (titles.has(issue.title)) {
            throw new Error(`Duplicate issue title in manifest: ${issue.title}`);
        }

        titles.add(issue.title);

        for (const label of issue.labels ?? []) {
            if (!labelNames.has(label)) {
                throw new Error(`Issue "${issue.title}" references undefined label "${label}".`);
            }
        }
    }
}

function ensureLabels(labels: LabelSeed[], repo: string | undefined, dryRun: boolean): void {
    if (labels.length === 0) return;

    console.log("\nEnsuring labels...");

    for (const label of labels) {
        const args = [
            "label",
            "create",
            label.name,
            "--color",
            label.color,
            "--force",
            ...repoArgs(repo),
        ];

        if (label.description) {
            args.push("--description", label.description);
        }

        if (dryRun) {
            console.log(`[dry-run] gh ${args.join(" ")}`);
            continue;
        }

        run("gh", args);
        console.log(`✓ ${label.name}`);
    }
}

function ensureMilestone(
    milestone: MilestoneSeed,
    repo: string | undefined,
    dryRun: boolean,
): void {
    const resolvedRepo = repo ?? "<inferred-repo>";

    console.log("\nEnsuring milestone...");

    if (dryRun) {
        console.log(
            `[dry-run] would check whether milestone exists: ${milestone.title}`,
        );

        const args = [
            "api",
            `repos/${resolvedRepo}/milestones`,
            "-X",
            "POST",
            "-f",
            `title=${milestone.title}`,
        ];

        if (milestone.description) {
            args.push("-f", `description=${milestone.description}`);
        }

        if (milestone.due_on) {
            args.push("-f", `due_on=${milestone.due_on}`);
        }

        console.log(`[dry-run] gh ${args.join(" ")}`);
        return;
    }

    const resolvedWriteRepo = apiRepo(repo);

    const existing = runJson<Array<{ title: string; number: number; state: string }>>("gh", [
        "api",
        "--method",
        "GET",
        `repos/${resolvedRepo}/milestones`,
        "-f",
        "state=all",
        "--paginate",
    ]);

    const match = existing.find((item) => item.title === milestone.title);

    if (match) {
        console.log(`✓ ${milestone.title} already exists`);
        return;
    }

    const args = [
        "api",
        `repos/${resolvedWriteRepo}/milestones`,
        "-X",
        "POST",
        "-f",
        `title=${milestone.title}`,
    ];

    if (milestone.description) {
        args.push("-f", `description=${milestone.description}`);
    }

    if (milestone.due_on) {
        args.push("-f", `due_on=${milestone.due_on}`);
    }

    run("gh", args);
    console.log(`✓ ${milestone.title} created`);
}
function listExistingIssues(repo: string | undefined): ExistingIssue[] {
    return runJson<ExistingIssue[]>("gh", [
        "issue",
        "list",
        "--state",
        "all",
        "--limit",
        "1000",
        "--json",
        "number,title,url",
        ...repoArgs(repo),
    ]);
}

function createIssue(
    issue: IssueSeed,
    milestoneTitle: string,
    repo: string | undefined,
    dryRun: boolean,
): string {
    const tempDir = mkdtempSync(join(tmpdir(), "issue-seed-"));
    const bodyPath = join(tempDir, "body.md");

    try {
        writeFileSync(bodyPath, issue.body, "utf8");

        const args = [
            "issue",
            "create",
            "--title",
            issue.title,
            "--body-file",
            bodyPath,
            "--milestone",
            milestoneTitle,
            ...repoArgs(repo),
        ];

        for (const label of issue.labels ?? []) {
            args.push("--label", label);
        }

        for (const assignee of issue.assignees ?? []) {
            args.push("--assignee", assignee);
        }

        if (dryRun) {
            console.log(`[dry-run] gh ${args.join(" ")}`);
            return "dry-run";
        }

        return run("gh", args);
    } finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
}

function seedIssues(manifest: IssueManifest, repo: string | undefined, dryRun: boolean): void {
    console.log("\nChecking existing issues...");
    const existingIssues = dryRun ? [] : listExistingIssues(repo);
    const existingByTitle = new Map(existingIssues.map((issue) => [issue.title, issue]));

    const orderedIssues = [...manifest.issues].sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) return aOrder - bOrder;

        return manifest.issues.indexOf(a) - manifest.issues.indexOf(b);
    });

    const results: Array<{
        order: number;
        title: string;
        status: "created" | "skipped";
        url: string;
    }> = [];

    console.log("\nCreating missing issues...");

    orderedIssues.forEach((issue, index) => {
        const order = issue.order ?? index + 1;
        const existing = existingByTitle.get(issue.title);

        if (existing) {
            console.log(`↷ skipped #${existing.number}: ${issue.title}`);
            results.push({
                order,
                title: issue.title,
                status: "skipped",
                url: existing.url,
            });
            return;
        }

        const url = createIssue(issue, manifest.milestone.title, repo, dryRun);
        console.log(`✓ created: ${issue.title}`);

        results.push({
            order,
            title: issue.title,
            status: "created",
            url,
        });
    });

    console.log("\nCompletion order:");
    for (const result of results.sort((a, b) => a.order - b.order)) {
        console.log(`${result.order}. [${result.status}] ${result.title} ${result.url}`);
    }
}

function main(): void {
    const args = parseArgs(process.argv.slice(2));

    assertGhIsReady();

    const manifest = loadManifest(args.manifestPath);

    console.log(`Seeding GitHub issues from: ${args.manifestPath}`);
    console.log(`Milestone: ${manifest.milestone.title}`);
    console.log(`Mode: ${args.dryRun ? "dry-run" : "write"}`);

    ensureLabels(manifest.labels ?? [], args.repo, args.dryRun);
    ensureMilestone(manifest.milestone, args.repo, args.dryRun);
    seedIssues(manifest, args.repo, args.dryRun);

    console.log("\nDone.");
}

main();