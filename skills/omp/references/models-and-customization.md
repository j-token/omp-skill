# Models and customization

Use this reference for provider authentication and routing, custom endpoints, prewalk, persistent instructions, reusable prompts/skills, lifecycle hooks, custom tools, and subagent definitions.

## Providers

Source: https://omp.sh/docs/providers

A provider is an account/backend; a model is selected as `provider/model-id`. Start OMP, use `/model`, authenticate with `/login [provider]`, then select a model. API-key providers normally read environment variables. Useful commands:

```sh
omp models
omp models <provider>
omp models find sonnet
omp models refresh
omp --model openai-codex/gpt-5.5
```

`openai-codex` is ChatGPT subscription auth; `openai` uses the developer API. Similar distinctions exist for subscription, cloud identity, and API-key providers. Local discovery defaults: Ollama `http://127.0.0.1:11434`, llama.cpp `http://127.0.0.1:8080`, LM Studio `http://127.0.0.1:1234/v1`. Explicit provider configuration or disablement suppresses auto-discovery. Stored credentials, endpoints, and model IDs are provider-specific; do not mix them.

## Model roles

Source: https://omp.sh/docs/roles

Roles are routing slots; agents are behavior/tool profiles. Configure `modelRoles` in `~/.omp/agent/config.yml` or project `.omp/config.yml`. Selectors can be an exact `provider/model-id`, comma fallback list, wildcard, `@role`, or thinking suffix such as `:high`. `*` aliases `@default`.

Built-ins include `default`, `smol`, `slow`, `vision`, `plan`, `designer`, `commit`, `tiny`, `task`, and `advisor`. `cycleOrder` controls `Ctrl+P`. Runtime `/switch` is session-only; `/model`/`/models` and the model hub persist role assignment.

Per-role launch precedence is flag → environment → config/automatic. Retry fallback is on by default (`retry.modelFallback: true`); `fallbackChains` are ordered, and `fallbackRevertPolicy` defaults to `cooldown-expiry`. Usage-aware fallback is off by default and reliable only for supported coding-plan quotas.

## Agents and roles

Source: https://omp.sh/docs/agents-and-roles

A model supplies capability/cost/context; a role supplies shared routing; an agent adds instructions and an allowlist. The Agent Hub is `/agents`. Bundled agents include scout, designer, reviewer, security-reviewer, librarian, task, and sonic.

Agent files live in `~/.omp/agent/agents/*.md` or `.omp/agents/*.md`. `model: "@slow"` uses a role; concrete model IDs bypass that indirection. Config can override with `task.agentModelOverrides.<agent>`, `task.agentPrewalk`, and `task.agentAdvisor`. Agent tools are a security boundary.

## Custom models and providers

Source: https://omp.sh/docs/custom-models

Use `~/.omp/agent/models.yml` for private gateways, unknown model IDs, or custom endpoints. Prefer local auto-discovery when it works.

A provider with declared models requires a nonempty `baseUrl`. Key fields: `api`, `auth`, `apiKey`, `headers`, `authHeader`, `models`, `discovery`, `modelOverrides`, `disableStrictTools`, `remoteCompaction`, and advanced `compat`. `apiKey` may name an environment variable or `!command`; avoid committed literal secrets. Model-level overrides beat provider defaults.

Supported API families include OpenAI completions/responses, Codex responses, Azure responses, Anthropic messages, Bedrock converse, Google generative/Gemini CLI/Vertex. Discovery types include `ollama`, `llama.cpp`, `lm-studio`, `openai-models-list`, `litellm`, and `proxy`. Refresh with `omp models refresh <provider>`.

Model metadata covers reasoning/thinking, text/image input, tool support, cost, context window, max tokens, compaction, tokenizer, and compatibility quirks. Omit `compat` unless necessary; wrong compatibility produces endpoint, tool, reasoning, or usage errors.

## Prewalk

Source: https://omp.sh/docs/prewalk

Prewalk starts a session with a stronger model for repository understanding and early decisions, then hands the same session to a cheaper/faster target. It is useful when planning is hard but execution is routine, not for tiny edits or hypothesis-changing debugging.

```sh
omp --model @slow --prewalk-into @smol
omp config set prewalk.enabled true
```

Use `--prewalk`, `/prewalk`, `--prewalk-into`, or disable once with `--no-prewalk`. The target must resolve and have credentials; troubleshoot with `omp models find`. Agent prewalk is separate from the main-session handoff.

## Context files

Source: https://omp.sh/docs/context-files

Use context files for persistent repository rules:

- `AGENTS.md`: project instructions, combined by directory scope.
- `.omp/RULES.md`: sticky rules.
- `.omp/APPEND_SYSTEM.md`: append to the system prompt; preferred for most customization.
- `.omp/SYSTEM.md`: replace the system prompt; use only intentionally.

User equivalents live under `~/.omp/agent/`. OMP also discovers compatible Claude, Agents, Codex, Gemini, OpenCode, and GitHub instruction locations. Native `.omp` sources win at the same level. `@path` imports inline shared instructions. Discovery happens at session start; use `/new` after changing sticky context. `--no-rules`, `disabledProviders`, `--system-prompt`, and `--append-system-prompt` alter loading.

## Skills

Source: https://omp.sh/docs/skills

A skill adds instructions/supporting files, not permissions or executable capability. At session start OMP advertises name/description; the body loads when matched. Inspect `/extensions` and invoke explicitly with `/skill:<name>`.

Native locations:

- User: `~/.omp/agent/skills/<name>/SKILL.md`
- Project: `.omp/skills/<name>/SKILL.md`
- Managed: `~/.omp/agent/managed-skills/`

OMP also discovers Agent Skills-compatible user/project directories. For OMP-native/custom/plugin/GitHub skills, `description` is required; `name` can override the directory. `hide` or Agent Skills-compatible `disable-model-invocation` prevents automatic listing but preserves explicit invocation. Settings include `skills.enabled`, `enableSkillCommands`, `includeSkills`, `ignoredSkills`, and `customDirectories`. Use `--no-skills`, `--skills '<globs>'`, or `disabledExtensions: [skill:name]` to narrow trust.

## Prompt templates

Source: https://omp.sh/docs/prompt-templates

Prompt templates turn repeated instructions into slash commands without code. Project templates are `.omp/prompts/**/*.md`; user templates are `~/.omp/agent/prompts/**/*.md`. Project wins on the same name. Optional `description` appears in completion.

Arguments support `$1`, `$@`, `$ARGUMENTS`, slices such as `$@[2:]`, and Handlebars helpers including `{{arg 1}}`, `{{arguments}}`, `{{args}}`, `{{default ...}}`, and conditionals. Handle empty and quoted arguments deliberately. Reload with `/reload-plugins`.

## Magic keywords

Source: https://omp.sh/docs/magic-keywords

Standalone lowercase keywords affect one submitted turn:

- `ultrathink`: deeper reasoning for difficult judgment.
- `orchestrate`: parallel independent delegation.
- `workflowz`: broad staged multi-agent workflow and synthesis.

They do not match substrings, identifiers, paths, filenames, calls, or code spans. Control with `magicKeywords.enabled` and per-keyword settings. They can increase cost and runtime; inspect `/usage` or `omp stats`. Highlighting indicates recognition, not successful execution.

## Hooks

Source: https://omp.sh/docs/hooks

Hooks are trusted TS/JS modules for lifecycle policy, redaction, context, and logging. Project hooks are direct children of `.omp/hooks/pre/` or `.omp/hooks/post/`; user/profile hooks are under the active agent directory. Nested classification folders require explicit loading. Factories default-export a function receiving `ExtensionAPI`.

Events include session/agent/turn lifecycle, `input`, `user_bash`, `user_python`, `tool_call`, `tool_result`, `context`, provider request/response, compaction/retry/fallback, MCP notifications, and `resources_discover`. Important semantics:

- `tool_call`: first block wins; absent a block, final transform wins while handlers see original input.
- Replacement input is revalidated before approval/execution.
- Hook exceptions/timeouts on `tool_call` fail closed.
- `tool_result` fields chain.
- `context` changes one model call, not persisted session state.
- `before_provider_request` replaces an opaque payload and can break the request.
- `user_bash`/`user_python` only cover user prefixes, not model tool calls.
- Headless modes require `ctx.hasUI`/`ctx.mode` checks.

Load with `--hook`, `--extension`, config `extensions`, or a plugin. Diagnose with `/extensions`, print mode, debug logs, and `extensionHandlers.toolCallTimeoutMs`.

## Custom tools

Source: https://omp.sh/docs/custom-tools

Use a custom tool for an OMP-specific trusted capability; use MCP for a service shared across clients. Preferred project layout is `.omp/tools/<name>/index.ts`; user tools live below the active config directory. A `CustomToolFactory` returns `name`, `label`, `description`, validated `parameters`, and async `execute`.

Schema APIs are `pi.zod`, `pi.arktype`, and legacy `pi.typebox`. Optional fields include `strict`, `hidden`, `loadMode` (default `discoverable`; `essential` stays top-level), `approval` (default `exec`; choose `read`/`write` when accurate), `onSession`, and renderers. Pass the provided `AbortSignal` to long work and `pi.exec`; guard UI with `pi.hasUI`. Tools execute with the user account and must be reviewed. Verify through `/tools`; inspect `~/.omp/logs/` on load failure.

## Authoring subagents

Source: https://omp.sh/docs/subagent-authoring

Subagent definitions are Markdown with YAML frontmatter. Project `.omp/agents/<name>.md` (nearest project) overrides/augments user/profile, extension, marketplace, and compatible agent locations. `name` and `description` are required.

Optional fields:

- `tools`: CSV/list; omitted inherits session tools.
- `model`: selector, fallback list, or `@role`.
- `thinking-level`: `inherit`, `off`, `auto`, or supported effort.
- `spawns`: allowed child agent names or `*`; omission is normally none.
- `autoload-skills`: skills loaded before the assignment.
- `output`: JSON Schema.
- `blocking`, `prewalk`, `advisor`, and `read-summarize`.

A read-only agent should receive only read/search tools. Be explicit with `spawns`: compatibility behavior may treat a task-only tool allowlist as broad spawning. Reload with `/reload-plugins`; inspect `/agents`.

## Cross-feature rules

- Always-on convention → context file; on-demand domain playbook → skill; repeated user request → prompt template; one-turn routing hint → magic keyword; lifecycle interception → hook; executable OMP-local capability → custom tool; reusable specialist → subagent.
- Resolve project/user/profile/plugin collisions from `/extensions`, `/agents`, `/tools`, `omp config path`, and source paths.
- Context changes need a new session; discovered resources generally need `/reload-plugins` or restart.
- Hooks and tools execute trusted local code; skills do not grant permission.
- Preserve least privilege: agent tools/spawns, tool approval/load mode, and hook blocking scope must be explicit.
- Never assume TUI UI is available in print, JSON, RPC, or ACP modes.
