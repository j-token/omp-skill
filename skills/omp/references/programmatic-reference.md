# Programmatic reference

Use this reference for embedding OMP, protocol clients, CLI automation, environment/auth precedence, approval policy, session parsing, and live tool availability.

## SDK

Source: https://omp.sh/docs/sdk

The SDK is an in-process TypeScript API for Bun 1.3.14+, not a Node SDK:

```sh
bun add @oh-my-pi/pi-coding-agent
```

Create sessions with `createAgentSession({ cwd, sessionManager, model | modelPattern, thinkingLevel, settings, systemPrompt | appendSystemPrompt, toolNames, restrictToolNames, customTools, extensions, additionalExtensionPaths, enableMCP, enableLsp, autoApprove })`. Session managers include `inMemory()`, `create(cwd)`, `continueRecent`, `list`, and `open`.

Main calls: `prompt`, `steer`, `followUp`, `abort`, `compact`, and idempotent async `dispose` (always await it). Subscribe to message, tool-execution, turn, agent, compaction, retry, and notice events. `agent_end.isTerminal: false` means asynchronous continuation may resume.

Custom tools use validated Zod parameters and receive an `AbortSignal`. Return failures as content plus `isError: true`. With a strict built-in allowlist, use `toolNames` and `restrictToolNames: true`; custom tools may additionally require `allowRestrictedCustomTools: true`. SDK sessions share the host process failure boundary.

## RPC mode

Source: https://omp.sh/docs/rpc

Start `omp --mode rpc [--no-session]`. The transport is one JSON object per stdin/stdout line. The initial frame is `{type:"ready", protocolVersion:1, supportedProtocolVersions:[1,2], maxFrameBytes:1048576, maxReassembledFrameBytes:67108864}`. Before any v2-only feature, send one request line such as `{"id":"neg-1","type":"request","command":"negotiate_protocol","protocolVersion":2}` and wait for its successful response.

Requests produce `{type:"response", command, success, data?}` or failure with `error`/`code`. Command families cover prompt/steering/follow-up/abort, sessions/branch/handoff/messages, model/thinking/service tier, compaction/retry, todos, host tools and URI schemes, subagent subscriptions/messages, shell execution, exports/stats, login providers, and protocol behavior.

Prompt streaming emits agent/turn/message/tool lifecycle plus compaction, retry, model, and notice events. Large frames use `rpc_chunk` with chunk ID, index, count, byte length, and base64 data; failures emit `rpc_frame_error`. RPC-UI additionally emits select/confirm/input/editor/notify/status/widget/title/open-URL requests. `setTitle` requires `PI_RPC_EMIT_TITLE=1`. Host tools and host URI schemes require call/result/cancel handling. Use RPC for language-neutral process isolation.

## ACP

Source: https://omp.sh/docs/acp

ACP lets an editor launch OMP as a child process over stdio; there is no server port or separate terminal. Verify `command -v omp` and `omp --version`. Client launch is command `omp`, argument `acp`, with an absolute workspace/session directory. Zed uses a custom `agent_servers` entry.

Authenticate inside the hosted conversation with `/login [provider]`, choose `/model`, and use `/plan`/`/quit`. Approval follows `tools.approvalMode`; `omp acp --approval-mode yolo` exists but widens trust. The client must implement permission callbacks. Troubleshoot child PATH, provider auth, absolute workspace roots, unsaved editor buffers/terminals, permission callbacks, and MCP discovery/auth. ACP preserves OMP's models, credentials, settings, extensions, and skills.

## CLI reference

Source: https://omp.sh/docs/cli

Core forms:

```sh
omp
omp "prompt"
omp @plan.md @screenshot.png "prompt"
command | omp -p "prompt"
omp -p --mode json "prompt"
omp --mode rpc
omp acp
```

Use `--` before prompt text that looks like flags. Important launch groups:

- Roots: `--cwd`, repeated `--add-dir`, `--allow-home`.
- Config: `--profile`, `--alias`, repeated `--config` (later wins).
- Sessions: `--continue/-c`, `--resume/--session/-r [id|path]`, `--fork`, imports, `--session-dir`, `--no-session`, `--export`.
- Models: `--model`, legacy `--provider`, nonpersistent `--api-key` plus explicit model, role flags `--smol/--slow/--plan`, `--thinking`, service tier and cache options.
- Prewalk/plan: `--prewalk`, `--no-prewalk`, `--prewalk-into`, `--plan-yolo`, `--plan-yolo-into`.
- Capabilities: `--tools`, `--no-tools`, `--no-lsp`, `--no-pty`, `--approval-mode`, `--auto-approve/--yolo`, `--advisor`, `--max-time`.
- Extensions: `--extension/-e`, `--hook`, `--trusted-extension`, `--plugin-dir`, `--no-extensions`, `--skills`, `--no-skills`, `--no-rules`.
- Prompts: `--system-prompt` replaces; `--append-system-prompt` appends. A path is read as a file; otherwise the value is literal.

Subcommands include configuration, models, plugins, auth broker/gateway, browser relay, commit, completions, process management, search/read/grep/render, setup, SSH, token, usage/stats, worktree, TTSR, and updates. Use `omp <subcommand> --help` for the installed version.

## Environment variables

Source: https://omp.sh/docs/env

Use environment variables for machine/process secrets, credentials, proxies, CI, and one-run overrides; use YAML for reviewed persistent behavior and CLI flags for explicit one-run behavior. For the same setting, flags beat environment variables.

`.env` loading covers working directory, active/default OMP agent/profile directories, home, and Node-environment variants; use standard variable names, quoting, comments, and `export`. `PI_CONFIG_DIR`/`PI_CODING_AGENT_DIR`, `PI_CONFIG_FILES`, `OMP_PROFILE`/`PI_PROFILE`, and `PI_CODING_AGENT_SESSION_DIR` relocate state.

Major categories:

- Provider keys/OAuth: `ANTHROPIC_*`, `OPENAI_*`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, GitHub/GitLab tokens, and provider-specific keys.
- Broker/gateway: `OMP_AUTH_BROKER_URL`, token, cache/snapshot controls.
- Proxy: provider-specific `PI_PROXY_<PROVIDER>` → `PI_PROXY` → standard proxy variables; respect `NO_PROXY`.
- Endpoints: provider base URLs plus local Ollama/LM Studio/llama.cpp defaults.
- Cloud identity: AWS Bedrock, Azure OpenAI, and Google Vertex variables.
- Web/search provider keys.
- Runtime/tool limits: tiny models, task output cap, AST cap, walk workers, MCP timeout, browser relay, eval runtimes, PTY/shell/edit controls.
- RPC/streaming timeouts and OpenTelemetry. Content capture can expose prompts.

For obscure or version-sensitive variables, open the live source page rather than guessing a name or default.

## Secrets and authentication

Source: https://omp.sh/docs/secrets

Prefer `/login` and provider-specific OAuth/API/device flows. Credentials are stored by default in `~/.omp/agent/agent.db`; the directory is mode 0700 and DB/WAL/SHM files 0600. Relocate with `PI_CODING_AGENT_DIR`.

Credential precedence, high to low:

1. `omp --api-key ...` (nonpersistent; explicit model required; process/shell-history risk)
2. `providers.<name>.apiKey` in `models.yml`
3. stored OAuth login, automatically refreshed and ahead of environment variables
4. API key stored through `/login`
5. provider environment variable
6. broker-imported/migrated static key
7. custom-provider fallback

Use `/logout <provider>` to remove stored login. Auth broker commands include login/serve/token/logout/status; default bind is `127.0.0.1:8765`. Auth gateway commands include serve/token/status/check; default bind is `127.0.0.1:4000`. External bind and `--no-auth` widen exposure; gateway `--strict` may consume live quota. Credentials ultimately leave the machine for the selected provider/endpoint.

## Tool approvals

Source: https://omp.sh/docs/approvals

Built-in default is `yolo`; safer interactive work normally uses `write`:

- `always-ask`: read-only can run; writes and executables prompt.
- `write`: reads and workspace/session writes run; executables such as bash/eval/browser/task prompt.
- `yolo`: all tiers run.

Select with `tools.approvalMode`, `--approval-mode`, or aliases `--auto-approve/--yolo`. Override each tool with `tools.approval.<name>: allow|prompt|deny`. Bash pattern rules apply to bash, not shell processes spawned through eval. Headless runs fail when an approval is required but no UI/callback exists; ACP clients must answer permissions.

Approval is a decision boundary, not a sandbox or source-trust mechanism. Inspect effective policy with `omp config get tools.approvalMode` and `omp config get tools.approval`.

## Session format

Source: https://omp.sh/docs/session-format

Sessions are append-oriented JSONL: one object per physical line. Default directory is `~/.omp/agent/sessions`; filenames combine a safe timestamp and opaque session ID. Discover files rather than constructing paths. Copy before transformations.

An optional title record occupies an exact 256-byte physical slot. The v3 header includes `type: session`, version, opaque UUIDv7 ID, timestamp, absolute cwd, and optional directories/title/parent/cache metadata. Every tree entry has opaque `id`, `parentId`, and timestamp; parent links form branches while file order remains significant.

Message roles include user/developer, assistant, and tool result with typed text/image/thinking/tool-call blocks plus usage/provider/model metadata. Non-message entries include thinking/model/tier/mode changes, compaction, branch summaries, reset boundaries, labels/titles, TTSR, credential pins, session initialization, and extension-defined records. Compaction does not delete older journal entries.

Large blobs use `blob:sha256:<64 lowercase hex>` and sidecars under `~/.omp/agent/blobs/<sha256>`. Session exports can expose prompts, provider payloads, images, system/tool schemas, and credential affinity. Runtime queue/stream/compaction state is not guaranteed to persist.

## Tools index

Source: https://omp.sh/docs/tools

`/tools` is authoritative for the current session because availability depends on settings, installed programs, model support, recursion depth, custom tools, extensions, and MCP.

Built-ins include file reading/search, AST/LSP, image inspection, web search, GitHub, edit/write, AST proposals, bash/eval, debugger, browser/computer, security/image generation/TTS, ask/todo, task/hub, checkpoint/rewind, and memory tools. Some default on; browser/debug/security/computer/GitHub and others require settings or external prerequisites.

Select built-ins with `--tools read,glob,grep`; `--no-tools` disables built-ins but plugin capabilities may still load. Tools are classified Read/Write/Exec/Mixed for approvals. Custom JS/TS modules and MCP configuration are executable/trusted surfaces. Static documentation never overrides `/tools` output.

## Integration choice

- Bun host, shared process, direct TypeScript API → SDK.
- Other language or process isolation → RPC.
- Editor hosts conversation/permissions over stdio → ACP.
- Human terminal → interactive CLI.
- Shell/CI one-shot → print text or JSON mode.

Always verify one real boundary exchange and await cleanup/disposal.
