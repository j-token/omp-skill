# Extension ecosystem

Use this reference for MCP, themes, reactive rules, executable extensions, managed plugins, and marketplaces. These surfaces can run local code or contact external services; scope and provenance are part of the implementation.

## MCP

Source: https://omp.sh/docs/mcp

Use MCP for capabilities supplied by an existing external/local server. Add with `/mcp add`, choose project or user scope, run `/mcp test <name>`, then `/mcp reload` or `/mcp reconnect <name>`. Inspect `/mcp list`, `/mcp resources`, `/mcp prompts`, and `/mcp notifications`. Server tools appear in `/tools` as `mcp__<server>_<tool>`; prompts use `/<server>:<prompt>`.

Config locations, high to low relevance by scope:

- Project: `.omp/mcp.json`
- User: `~/.omp/agent/mcp.json`
- Profile: `~/.omp/profiles/<name>/agent/mcp.json`
- Portable root fallback: `mcp.json` or `.mcp.json` (lowest priority)

Stdio needs `command`; optional fields include `args`, `env`, `cwd`, `timeout`, and `requestIdFormat`. New remote servers use `type: "http"` plus `url`; `sse` is legacy. `${VAR}` and `${VAR:-default}` interpolate environment variables. Managed OAuth credentials live in `agent.db`. Project MCP can execute code or access secrets; trust the repository first. `/mcp test` validates connectivity/listing, not actual tool execution.

## Authoring MCP servers

Source: https://omp.sh/docs/mcp-authoring

Use MCP authoring for a server shared by several clients; use a custom OMP tool for a small OMP-only integration. Prefer official SDKs. For stdio, stdout must contain only newline-delimited JSON-RPC frames; logs go elsewhere. OMP supports MCP revision `2025-11-25`.

Initialize with negotiated `protocolVersion`, `serverInfo`, and `capabilities`, accept `notifications/initialized`, implement `tools/list` pagination and `tools/call`, and echo numeric or string request IDs. OMP answers `ping` and `roots/list`. Dynamic tool catalogs advertise `tools.listChanged` and emit `notifications/tools/list_changed`.

New HTTP servers use Streamable HTTP; legacy HTTP+SSE is for older revision `2024-11-05`. Validate syntax, use the MCP Inspector for an actual call, and return domain failures as tool content with `isError: true`. `/mcp test` alone is insufficient.

## Themes

Source: https://omp.sh/docs/themes

Choose dark/light themes in `/settings`. Defaults are `titanium` for dark terminals and `light` for light terminals. Custom JSON lives in the active agent/profile themes directory, for example `~/.omp/agent/themes/ink.json` or `$PI_CODING_AGENT_DIR/themes/`.

A theme defines `name`, optional `vars`, `colors`, `export`, and `symbols`. Colors are token references, `#RRGGBB`, RGB values, or allowed empty strings. Symbol presets are `unicode`, `nerd`, and `ascii`, with token overrides and spinner frames. Test both terminal background modes; invalid JSON/tokens and weak contrast are common failures.

## TTSR rules

Source: https://omp.sh/docs/ttsr

TTSR reacts to a narrow detectable pattern in live output, interrupts according to policy, injects the rule body, and restarts generation. Use context files for always-on conventions and hooks for deterministic pre/post policy.

Rules are `.md`/`.mdc` under project `.omp/rules/` or the active user agent directory. Frontmatter fields include `description`, regex `condition`, optional ast-grep `astCondition`, `scope`, `globs`, `interruptMode`, and repeat metadata. Scopes include prose `text`, `thinking`, all tools, `tool:<name>`, and `tool:<name>(<glob>)`. Scope omission covers text and tools but not thinking.

Workflow:

```sh
omp ttsr list
omp ttsr test --verbose --source tool --tool edit --path src/example.ts
omp ttsr scan --rule rule-name src/
omp config set ttsr.enabled true
```

Key settings include `contextMode` (`discard`/`keep`), `interruptMode`, `repeatMode` (`once`/`after-gap`), `repeatGap`, `builtinRules`, and `disabledRules`. Avoid broad or catastrophic regexes. `alwaysApply` is metadata, not a substitute for a valid TTSR condition.

## Plugins

Source: https://omp.sh/docs/plugins

A plugin manages executable extensions plus sibling skills, commands, hooks, tools, agents, rules, prompts, and MCP/LSP/DAP configuration as one unit. Inspect source and preview npm/Git/local installs:

```sh
omp plugin install --dry-run <source>
omp plugin install <source>
omp plugin list --json
omp plugin doctor
omp plugin config validate <name>
```

Sources include npm, Git/GitHub, local paths, links, and `plugin@marketplace`. Enable/disable whole plugins or individual features; run `/reload-plugins` in an active TUI. Project state is `.omp/plugins/installed_plugins.json`; user state is `~/.omp/plugins/installed_plugins.json`. Marketplace installs default to user scope unless `--scope project` is supplied. Marketplace installs cannot be dry-run. A linked plugin changes live with its source.

## Authoring extensions

Source: https://omp.sh/docs/extension-authoring

Extensions are TS/JS modules loaded in the session process. They can register tools, commands, shortcuts, UI, provider integrations, renderers, flags, and lifecycle handlers. A package declares `omp.extensions` in `package.json`; OMP can execute TypeScript without a build step.

Default-export an `ExtensionFactory` receiving `ExtensionAPI`. APIs include schema helpers, event handlers, registrations, provider controls, messaging, execution, session/model controls, timers, and resource discovery. Tools default to `approval: exec` and `loadMode: discoverable`; lower approval to `read`/`write` when accurate. `essential` keeps a tool top-level.

Discovery includes project `.omp/extensions/`, active user extensions, `index.ts`/`index.js`, and `--extension/-e`. Sibling package resources can include `skills/`, `commands/`, `rules/`, `prompts/`, `hooks/`, `tools/`, `agents/`, and MCP config. Test with `omp --extension ./path`, `/extensions`, and `omp plugin doctor`. Headless code must check `ctx.hasUI`/mode. Extensions are trusted executable code; `isProjectTrusted()` is a compatibility check, not a sandbox.

## Marketplaces

Source: https://omp.sh/docs/marketplace

A marketplace is a catalog mapping names to code sources; it does not establish trust. Add, list, discover, and install:

```sh
omp plugin marketplace add owner/repo
omp plugin marketplace list
omp plugin discover
omp plugin install plugin@marketplace --scope project
```

Catalog sources may be GitHub shorthand, Git URLs, direct `marketplace.json`, or local paths. Catalog files are `.omp-plugin/marketplace.json` or `.claude-plugin/marketplace.json`. Entries include `name`, `description`, `version`, and `source`, optionally `sha`, owner, category, ref, and git subdirectory.

`marketplace.autoUpdate` is `off`, default `notify`, or `auto`. Catalog `update` and installed plugin `upgrade` are distinct. Removing a catalog does not uninstall its plugins. Validate publisher, repository, ref, and SHA; start at project scope and keep auto-upgrade off until trusted.

## Cross-feature rules

- Cross-client service → MCP; OMP in-process behavior → extension/custom tool; managed bundle → plugin; catalog indirection → marketplace; appearance → theme; output-pattern reaction → TTSR.
- New remote MCP uses Streamable HTTP; stdio requires a command and pure JSON-RPC stdout.
- Verify at the right boundary: MCP listing plus an Inspector/tool call; plugin list/doctor/config validation; TTSR list/test/scan; extension discovery and actual command/tool invocation.
- Keep executable code at the narrowest scope, review provenance, and preserve prompt approval.
- Plugin/catalog removal, enablement, and update are separate operations; do not conflate them.
