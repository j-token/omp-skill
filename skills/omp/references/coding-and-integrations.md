# Coding and integrations

Use this reference to choose built-in coding capabilities and integrations. Keep this order: inspect/read-only planning → exact scope → preview or immutable preflight → approval → mutation/scan/commit → focused verification.

## Working with files

Source: https://omp.sh/docs/files

OMP edits the working tree directly and does not commit unless asked. State paths, expected outcome, allowed files, and whether editing is forbidden. Search is bounded and respects `.gitignore`; include ignored content by exact path rather than broad secret-bearing globs.

Supported reads include UTF-8 files, notebooks, current Office/PDF/EPUB documents, images up to 20 MiB, many archives, and SQLite. Legacy Office formats are not automatically converted. Only ZIP-family, tar-family, and ASAR archives are writable; extract/repack other archives. Back up important databases and archives. `ssh://` direct reads are capped at 1 MiB and support verified POSIX hosts; Windows SSH targets need a mount or explicit remote shell. Use `--cwd` if the launch root is wrong.

## Code intelligence

Source: https://omp.sh/docs/code-intelligence

Use LSP for definitions, implementations, type definitions, references, diagnostics, quick fixes, semantic rename, and file moves with import updates. Use structural edits for syntax patterns and targeted text edits for literal changes.

LSP is enabled, lazy, and shared by default. A project marker and executable must be directly available in the launch directory; parents are not searched. Project-local binaries and virtual environments win over PATH. Observe status with `/session`.

Config discovery merges server entries by name. Project `.omp/lsp.json` can override built-ins; `.omp/lsp.yaml` can define custom servers. Within a server, object fields such as `settings`, `initOptions`, and `capabilities` are replaced as whole fields rather than deeply merged. Key defaults: `lsp.enabled: true`, `lazy: true`, `shared: true`, `formatOnWrite: false`, `diagnosticsOnWrite: true`, `diagnosticsOnEdit: false`, `diagnosticsDeduplicate: true`. Disable once with `--no-lsp`. Diagnostics do not replace a compiler or targeted tests.

## Debugging

Source: https://omp.sh/docs/debugging

Use DAP when the question depends on runtime values, control flow, hangs, threads, or expressions. Install the adapter, make it visible, launch OMP at the project root, then specify program, stop condition, and observation.

Built-ins cover `gdb`, `lldb-dap`, `codelldb`, Python `debugpy`, Go `dlv`, Ruby `rdbg`, Node `js-debug-adapter`, `.NET` `netcoredbg`, Kotlin, PHP, Bash, Dart/Flutter, and Elixir adapters. Check the real executable (`command -v dlv`, `python -m debugpy --version`). Enable with `debug.enabled`.

Project config is `.omp/dap.json`; user config is `~/.omp/agent/dap.json`. YAML and dotted variants are accepted. Custom adapters require `command`; optional fields include `args`, `languages`, `fileTypes`, `rootMarkers`, launch/attach defaults, `connectMode`, and `acceptsDirectoryProgram`. Adapter process args are not debuggee args. Only one debug session can be active.

## Structural edits

Source: https://omp.sh/docs/editing

Use syntax-aware codemods for broad syntactic rewrites, LSP for symbols, and text edits for exact literals. Review staged matches before resolving/applying. If files changed after preview, reopen and recompute; never apply a stale proposal. Control the feature with `astEdit.enabled`; `PI_MAX_AST_FILES` caps files. Unsupported syntax, zero matches, surprising matches, or a cap require a narrower scope—not a blind fallback.

## Code review

Source: https://omp.sh/docs/review

`/review` examines a concrete base-branch diff, uncommitted changes, a commit, a GitHub PR, or a custom focus. It reports evidence-backed issues introduced by that diff, not general style. Direct PR examples: `/review https://github.com/acme/widgets/pull/418` or a `pr://` resource. `gh` and `gh auth login` are required for authenticated PRs.

Priorities: P0 release/operations blocker; P1 high-impact issue normally fixed before merge; P2 medium correctness edge; P3 optional information. Confidence is not proof. Exclude generated lock/build noise, challenge false findings with evidence, and run the focused check after fixing a valid finding.

## Creating commits

Source: https://omp.sh/docs/commit

Stage exact scope, inspect it, preview, then commit:

```sh
git add src/widget.ts test/widget.test.ts
git status --short
omp commit --dry-run
omp commit
git status --short
git log -5 --oneline
```

`omp commit --push` pushes a successful new commit, or an existing commit if nothing new exists. Options include `--no-changelog`, `--context/-c`, `--model/-m`, and `--legacy`. Hooks may reject the commit; fix and rerun. Never recover with `git reset --hard`; preserve the worktree and restage.

## Security scans

Source: https://omp.sh/docs/security

Security scanning is off by default and is vulnerability-focused, not a style review, compliance certificate, or proof of no vulnerabilities. Enable `security.enabled`, select/authenticate a model, and consider `/session pin` for credential continuity.

Create an immutable plan with `/security plan`, optionally `--path`, `--exclude`, `--working-tree`, `--diff <base> <head>`, `--knowledge-base`, `--output`, or `--archive-existing`. Run `/security scan <plan-id>`, inspect `/security status`, `/security scans`, `/security show`, and `security://` artifacts. Validate findings and set disposition to `open`, `false_positive`, `accepted_risk`, `fixed`, or `wont_fix`; non-open dispositions require rationale.

Native scans run locally with provider usage. Cloud security requires OpenAI Codex/ChatGPT OAuth and a separate allowance; start/pull explicitly. Scopes, manifests, coverage, provenance, credentials, and reports may be sensitive.

## Subagents

Source: https://omp.sh/docs/subagents

Delegate only independent work with explicit outputs, ownership, and safety boundaries; the parent still integrates and verifies. Specialist choices include `scout`, `designer`, `reviewer`, `security-reviewer`, `librarian`, `task`, and `sonic`. Inspect `/agents` and `/jobs`; parked workers can be revived, while `x` kills/releases them.

Key defaults: `task.maxConcurrency: 32` (extra work queues; `0` unlimited), `maxRecursionDepth: 2`, `softRequestBudget: 200`, `maxRuntimeMs: 0`, `agentIdleTtlMs: 420000`, `task.isolation.mode: none`, `isolation.apply: true`, `isolation.merge: patch`. Isolated worktrees normally live under `~/.omp/wt`. Do not give two workers overlapping file ownership.

## Advisor models

Source: https://omp.sh/docs/advisor

Advisor is an independent continuous reviewer, not a delegated implementation worker. Use it for high-risk or long work where missed requirements matter. Configure `WATCHDOG.yml`, `WATCHDOG.yaml`, or `WATCHDOG.md` at project/user scope. Commands: `/advisor`, `on`, `off`, `status`, `dump`, `dump raw`, and `configure`; raw dumps are sensitive.

Roster entries require `name`; optional fields include `enabled`, `model`, `tools`, and `instructions`. Omitted tools default to `[read, grep, glob]`; `[]` grants none. `modelRoles.advisor` supplies the default model. `advisor.syncBacklog` is quoted enum `"1"`, `"3"`, `"5"`, or default `off`; sync may pause the main agent up to 30 seconds. `advisor.immuneTurns` defaults to 3. `/advisor on/off` does not persist `advisor.enabled`.

## Vibe mode

Source: https://omp.sh/docs/vibe

Vibe turns the main agent into a director for persistent workers. Use `fast` workers for mechanical work and `good` workers for design, debugging, review, or risky refactors. Enter with `/vibe <workstreams and verification>`. Give every worker owned paths, forbidden paths, interface contracts, and a focused check. Inspect restored workers after restart before allowing them to continue. Role mappings such as `fast_worker` and `good_worker` plus `task.agentModelOverrides` control models. It inherits subagent concurrency, isolation, and approval settings.

## Collab

Source: https://omp.sh/docs/collab

`/collab` shares the live host session. The host remains authoritative and executes models/tools locally. It emits a full-control `omp join "<room>.<secret>"` command plus browser link/QR. `/collab view` is read-only. Guests use `/join`, `/leave`; hosts use `/collab stop`.

Full-control guests can prompt, interrupt, and control host subagents, so protect the link. They cannot execute host-local slash/shell/Python/skills commands. Defaults: relay `wss://my.omp.sh`, empty `collab.webUrl`, and OS username/`anonymous` display name. Use `/collab status` and wait for synchronization after reconnect.

## Web and browser

Source: https://omp.sh/docs/web

Choose the narrowest surface:

- Current facts and source comparison: web search.
- Known URL/static document: URL reader.
- Rendered JS page/click/fill: managed browser.
- Existing signed-in Chrome session: Browser Relay.
- Native browser chrome or desktop UI: computer control.

Relevant settings include `web_search.enabled`, `providers.webSearchOrder`, `providers.webSearchTimeoutSeconds`, `browser.enabled`, and `browser.headless`. Install Relay with `omp browser-relay install`; enable `browser.relay`, protect its endpoint with a random token, verify the extension badge and exact tab, then disable it after use. Managed Chromium does not inherit Chrome login state. Keep consequential actions such as checkout, send, or refund behind explicit approval.

## Computer control

Source: https://omp.sh/docs/computer

Computer control is disabled by default. Use `/computer on`, `/computer status`, and `/computer off` for a session. It covers screenshots, native accessibility, input, shortcuts, windows, and clipboard. Prefer browser DOM control when possible. Set `tools.approval.computer: prompt`; constrain display and dimensions.

macOS needs Screen Recording and Accessibility permissions. Windows x64 supports native capture/input/UI Automation. Wayland has portal/libei and activation limitations. OMP must not silently grant OS permissions. Foreground input affects the current target; background input is available only where the OS can target safely.

## GitHub

Source: https://omp.sh/docs/github

GitHub is off by default and uses the authenticated `gh` CLI:

```sh
gh auth login
gh auth status
omp config set github.enabled true
```

A new session may be required after enabling. Resources include `issue://731`, `issue://owner/repo/731`, `pr://482`, `pr://owner/repo/482/diff`, `/diff/3` (1-based file), and `/diff/all`. Queries support state, author, label, comments, and limit.

Worktrees default to `~/.omp/wt`; `OMP_WORKTREE_DIR` overrides `worktree.base`. Cache defaults: enabled, `~/.omp/cache/github-cache.db`, soft TTL 300 seconds, hard TTL 604800 seconds. Authenticated content may be sensitive and cached. Push, PR mutation, worktree integration, and Actions remain approval boundaries.

## Cross-feature rules

- Semantic symbol → LSP; syntactic pattern → structural edit; literal → targeted text; runtime state → DAP; diff correctness → `/review`; commit boundary → `omp commit`; vulnerability investigation → `/security`.
- Search/current facts → web search; known URL → reader; DOM app → browser; signed-in Chrome → relay; native UI → computer; issue/PR/Actions → GitHub.
- Stale preview or cached state must be refreshed before acting.
- Diagnostics, review confidence, advisor feedback, and security scans do not replace focused runtime checks.
- Use prompt approval for browser/computer/GitHub writes. `yolo` is not a sandbox.
- Subagent/Vibe results remain untrusted until the parent reads, integrates, and verifies them.
