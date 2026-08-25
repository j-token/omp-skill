[English](./README.md) | [한국어](./README.ko.md)

# OMP Skill

An installable Agent Skill for [Oh My Pi](https://omp.sh/docs). It covers installation, configuration, sessions, model routing, tools, subagents, browser and GitHub integrations, extensions, MCP, plugins, SDK, RPC, ACP, and troubleshooting.

The skill was built from all 56 routes exposed by the official OMP documentation on August 25, 2026.

## Install

Install it into the agents detected in the current project:

```sh
npx skills add j-token/omp-skill --skill omp
```

Install it globally for Oh My Pi/Pi. Target `pi` explicitly because PromptScript only supports project-scoped skill installation:

```sh
npx skills add j-token/omp-skill --skill omp --global --agent pi --yes
```

If another agent needs the global installation, replace `pi` with its Skills CLI identifier, such as `claude-code` or `codex`. Do not omit `--agent` on a machine where PromptScript is detected; otherwise the CLI also attempts an unsupported global PromptScript installation.

List the skill before installing:

```sh
npx skills add j-token/omp-skill --list
```

The repository uses the standard `skills/omp/SKILL.md` layout and is compatible with the [Skills CLI](https://github.com/vercel-labs/skills) and the [Agent Skills specification](https://agentskills.io/specification).

## Use

Ask the installed coding agent about OMP in normal language. The skill is designed to trigger for requests involving the `omp` CLI/TUI, `.omp/` configuration, providers, models, sessions, tools, subagents, hooks, MCP, plugins, or OMP's programmatic APIs.

Examples:

```text
Configure project-scoped OMP model roles and keep shell execution behind approval.
```

```text
Build a Rust host for OMP RPC protocol v2 and handle chunked frames safely.
```

```text
Find why my .omp skill is available through /skill but not loaded automatically.
```

## Contents

```text
skills/omp/
├── SKILL.md
├── evals/
│   └── evals.json
└── references/
    ├── coding-and-integrations.md
    ├── docs-index.md
    ├── extension-ecosystem.md
    ├── models-and-customization.md
    ├── programmatic-reference.md
    └── start-and-sessions.md
```

`SKILL.md` routes each request to the smallest relevant reference. `docs-index.md` maps every reviewed official documentation route to its bundled reference.

## Sources

- [OMP documentation](https://omp.sh/docs)
- [Skills CLI](https://github.com/vercel-labs/skills)
- [Agent Skills specification](https://agentskills.io/specification)
