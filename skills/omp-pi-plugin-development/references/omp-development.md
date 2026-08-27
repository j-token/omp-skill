# OMP extension and plugin development

Use this reference only after the target has been identified as Oh My Pi (`omp`). The details below match OMP 18.0.6 documentation; inspect installed help and matching release docs before relying on version-sensitive fields.

## Product model

- **Extension:** trusted TS/JS module loaded in the session process. A default factory receives `ExtensionAPI` and registers behavior.
- **Plugin:** managed installable bundle that can contain one or more extensions plus sibling capabilities.
- **Hook:** legacy/event-focused module. New combined behavior should use an extension.
- **Custom tool:** tool-only module. Use an extension when policy, commands, rendering, or lifecycle behavior belongs with the tool.
- **Marketplace:** catalog pointing to plugins. A catalog is distribution metadata, not a trust guarantee.

## Minimum extension

```ts
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function extension(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.notify("Extension loaded", "info");
  });
}
```

The factory may be synchronous or asynchronous. During factory execution, registration methods are available but live session actions are not. Calling `pi.sendMessage()` during load raises `ExtensionRuntimeNotInitializedError`; call it from a handler, command, or tool instead.

## Discovery and resolution

Native roots:

| Scope | Path |
| --- | --- |
| Project | `<cwd>/.omp/extensions/` |
| User | `~/.omp/agent/extensions/` |
| Named profile | `~/.omp/profiles/<name>/agent/extensions/` |
| Override | active directory selected by `PI_CODING_AGENT_DIR` |

The native project root is cwd-local and does not search parent directories. `.pi/extensions/` is not an OMP native root.

Configured paths come from `--extension/-e`, `--hook`, merged `extensions:` settings, and installed plugins. A configured directory resolves in this order:

1. `package.json` with `omp.extensions` or legacy `pi.extensions`;
2. `index.ts`;
3. `index.js`;
4. otherwise, direct `.ts`/`.js` files and one-level subdirectories with an index or manifest.

Explicit files and installed-plugin manifest entries may also use `.mjs` and `.cjs`. Paths are de-duplicated by resolved absolute path; first discovery wins.

One-shot isolation:

```bash
omp --no-extensions --extension ./src/index.ts
```

`--no-extensions` disables ambient discovery but preserves explicitly named `-e` paths. This is useful when duplicate registrations or third-party interference would obscure a test.

## Plugin layout

```text
my-plugin/
├── package.json
├── src/
│   └── index.ts
├── skills/<name>/SKILL.md
├── commands/*.md
├── agents/*.md
├── hooks/pre/
├── hooks/post/
├── tools/
├── rules/
├── prompts/
├── .mcp.json
├── .lsp.json
└── .dap.json
```

All sibling capabilities are optional. Packages loaded through the plugin system or as an extension package can expose these conventional directories without registering them in the extension factory.

Manifest:

```json
{
  "name": "my-omp-plugin",
  "version": "1.0.0",
  "omp": {
    "extensions": ["./src/index.ts"]
  }
}
```

Multiple entry points are supported. New OMP plugins should use `omp.extensions`; `pi.extensions` is legacy compatibility.

## ExtensionAPI map

Registration and actions include:

- `pi.on(event, handler)`
- `pi.registerTool(definition)`
- `pi.registerCommand(name, definition)`
- `pi.registerShortcut(...)`
- `pi.registerFlag(...)`
- `pi.registerMessageRenderer(...)`
- `pi.registerAssistantThinkingRenderer(...)`
- `pi.registerComposerShape(...)`
- `pi.registerProvider(...)`
- `pi.registerFileWriteFallback(...)`
- `pi.registerFileDeleteFallback(...)`
- `pi.sendMessage(...)`, `pi.sendUserMessage(...)`, `pi.appendEntry(...)`
- `pi.exec(...)`
- `pi.getActiveTools()`, `pi.getAllTools()`, `pi.setActiveTools(...)`
- session name, model, thinking level, and service-tier controls
- `pi.logger`, `pi.events`

Schema builders are injected:

- `pi.zod`: preferred Zod-compatible omptype builder;
- `pi.arktype`: omptype `type(...)` builder;
- `pi.typebox`: legacy TypeBox-compatible shim.

Prefer the builder already used by the target project. For new OMP-only code, `pi.zod` avoids an extra schema dependency.

## Tool contract

```ts
const z = pi.zod;

pi.registerTool({
  name: "word_count",
  label: "Word Count",
  description: "Count words in text",
  parameters: z.object({
    text: z.string().describe("Text to count"),
  }),
  loadMode: "discoverable",
  approval: "read",
  async execute(_id, params, signal, onUpdate, _ctx) {
    if (signal?.aborted) {
      return { content: [{ type: "text", text: "Cancelled" }], details: {} };
    }
    onUpdate?.({ content: [{ type: "text", text: "Counting" }] });
    const count = params.text.split(/\s+/).filter(Boolean).length;
    return {
      content: [{ type: "text", text: String(count) }],
      details: { count },
    };
  },
});
```

Tool-specific fields:

- `loadMode`: `discoverable` by default; use `essential` only when the tool must remain top-level.
- `approval`: `exec` by default. Set `read`, `write`, or `exec` according to actual side effects.
- `strict`: provider structured-output grammar behavior.
- `hidden`, `defaultInactive`, `deferrable`: visibility/activation controls on current tool definitions.
- `onSession`: lifecycle callback for tool-owned session state.
- `renderCall` / `renderResult`: optional TUI rendering.

A tool shadowing a native built-in may receive `ctx.invokeTool`. It can invoke the native implementation of that same tool without reimplementing its bookkeeping. The method is absent for net-new tools and cannot delegate to an arbitrary built-in.

## Commands and session control

```ts
pi.registerCommand("greet", {
  description: "Send a greeting",
  handler: async (args, ctx) => {
    const name = args.trim() || "world";
    pi.sendMessage(
      {
        customType: "greeting",
        content: `Hello, ${name}!`,
        display: true,
        attribution: "user",
      },
      { triggerTurn: false },
    );
    if (ctx.hasUI) ctx.ui.notify(`Greeted ${name}`, "info");
  },
});
```

Command context exposes session-control operations such as `waitForIdle`, `newSession`, `switchSession`, `branch`, `navigateTree`, `reload`, and `compact`. Treat `ctx.reload()` as terminal for the current handler; do not continue using stale session objects afterward. Built-in command name conflicts are skipped with diagnostics.

## Event behavior

Important event groups:

- session: `session_start`, switch/branch/tree/compact pre/post events, `session_shutdown`;
- prompt/turn: `input`, `before_agent_start`, provider request/response, `context`, agent/turn/message lifecycle, `session_stop`;
- tools: `tool_call`, `tool_result`, execution and approval observation;
- reliability: compaction, retry, TTSR, todo, goal, credential signals;
- integration: `mcp_notification`, `user_bash`, `user_python`.

`tool_call` may block or revise input. Revised input is revalidated before approval and execution. Handler errors fail closed and block the tool. `tool_result` handlers form middleware: each handler sees prior modifications.

OMP 18.0.6 declares `resources_discover`, but the documented `AgentSession` path has no callsite that emits it. Do not build OMP dynamic-resource behavior around this event without proving the installed version emits it.

## Background resources

Extensions are in-process and unsandboxed. A raw timer or detached promise that rejects outside dispatch can terminate the whole session. Use managed timers:

```ts
pi.on("session_start", async (_event, ctx) => {
  const timer = ctx.setInterval(async () => {
    if (ctx.hasUI) ctx.ui.setStatus("plugin", "ready");
  }, 60_000);

  pi.on("session_shutdown", () => ctx.clearTimer(timer));
});
```

Managed timers contain callback failures, are unref'd, and auto-clear at shutdown. For sockets, subprocesses, and file watchers, start them on `session_start` or first use and register idempotent shutdown cleanup.

## UI mode boundaries

- Interactive TUI: dialogs, editor access, notifications, status, widgets, custom overlays, autocomplete, terminal input, themes, and most renderer surfaces.
- RPC: dialog round-trips and selected fire-and-forget UI requests; no custom overlays, footer/header/editor component/autocomplete, working message, or theme switching.
- Print/headless/subagent: `ctx.hasUI` is false and UI calls return defaults/no-op.
- ACP: elicitation-backed dialog subset when the client supports it; non-elicitation TUI surfaces are no-op.

Check `ctx.hasUI` for portable dialogs/notifications and the concrete mode for TUI-only components. Do not make correctness depend on a notification.

## Development and distribution flow

1. Direct-load the entry point:
   ```bash
   omp --extension ./src/index.ts
   ```
2. Invoke the actual command/tool/event path.
3. Inspect `/extensions` and `/tools` in the session.
4. For a managed development checkout:
   ```bash
   omp plugin link .
   omp plugin doctor
   ```
5. Preview an install before trusting third-party/package operations:
   ```bash
   omp plugin install --dry-run ./
   ```
6. Validate plugin state/config and reload an active session:
   ```bash
   omp plugin list --json
   omp plugin doctor
   omp plugin config validate <name>
   # interactive: /reload-plugins
   ```

For a marketplace, publish `.omp-plugin/marketplace.json` or the Claude-compatible fallback `.claude-plugin/marketplace.json`. Prefer Git/relative plugin sources and pin a ref/SHA for controlled distribution. A marketplace entry may describe npm, but the documented marketplace installer currently rejects npm plugin sources; install npm plugins directly with `omp plugin install` instead.

## Official sources

- https://omp.sh/docs/extension-authoring
- https://omp.sh/docs/plugins
- https://omp.sh/docs/marketplace
- https://github.com/can1357/oh-my-pi/blob/v18.0.6/docs/skills/authoring-extensions.md
- https://github.com/can1357/oh-my-pi/blob/v18.0.6/docs/extensions.md
- https://github.com/can1357/oh-my-pi/blob/v18.0.6/docs/extension-loading.md
- https://github.com/can1357/oh-my-pi/blob/main/docs/skills/authoring-marketplaces.md
