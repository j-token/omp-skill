# Pi Coding Agent extension and package development

Use this reference only after identifying the target as Pi Coding Agent from `pi.dev` / `earendil-works/pi`. Do not assume every executable named `pi` is this product.

## Version and namespace

Current official packages moved to the `@earendil-works` npm scope starting with Pi 0.74.0. The last old-scope release was 0.73.1.

| Era | Import namespace |
| --- | --- |
| Current Pi | `@earendil-works/pi-*` |
| Legacy Pi | `@mariozechner/pi-*` |

Use current imports for new work. When maintaining old code, inspect its pinned Pi version before renaming imports because mixed package instances can break shared symbols, renderers, or runtime type identity.

## Product model

- **Extension:** TS module whose default factory receives `ExtensionAPI`.
- **Pi package:** npm, Git, or local bundle containing extensions, skills, prompt templates, and themes.
- **Skill:** on-demand instructions; it does not create executable capability.
- **Package gallery:** discovery surface for packages tagged `pi-package`, not a sandbox or trust guarantee.

## Minimum extension

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function extension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "word_count",
    label: "Word Count",
    description: "Count words in text",
    parameters: Type.Object({
      text: Type.String({ description: "Text to count" }),
    }),
    async execute(_id, params) {
      const count = params.text.split(/\s+/).filter(Boolean).length;
      return {
        content: [{ type: "text", text: String(count) }],
        details: { count },
      };
    },
  });
}
```

Pi loads TypeScript without a separate compilation step. A factory may be async, and Pi waits for it before startup events and provider registration flush. Use async factories for bounded startup discovery such as fetching a model list; do not start sockets, watchers, subprocesses, or timers there. Start long-lived resources at `session_start` or first use and clean them up at `session_shutdown`.

## Discovery and trust

| Scope | Path |
| --- | --- |
| User | `~/.pi/agent/extensions/*.ts` or `*/index.ts` |
| Project | `.pi/extensions/*.ts` or `*/index.ts` |
| One-shot | `pi -e ./path.ts` |
| Additional | `extensions` and `packages` in settings |

Project-local settings, resources, instructions, and packages load only after project trust. Do not work around trust prompts by moving untrusted code to global scope.

Auto-discovered extensions can be reloaded with `/reload`. Use `-e` for a quick isolated trial, not as the permanent installation mechanism.

## Available imports

Current extension docs expose:

- `@earendil-works/pi-coding-agent`: extension types, runtime helpers;
- `typebox`: tool parameter schemas;
- `@earendil-works/pi-ai`: model/provider APIs and `StringEnum`;
- `@earendil-works/pi-tui`: custom TUI components;
- Node built-ins and declared package dependencies.

For string enums, use `StringEnum` for Google-compatible schemas:

```ts
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

const parameters = Type.Object({
  action: StringEnum(["upper", "lower"] as const),
  text: Type.String(),
});
```

Do not substitute a `Type.Union` of literals for this case; official Pi docs state that shape is not accepted by Google's API.

## Extension capabilities

A factory can register:

- tools, commands, shortcuts, and flags;
- lifecycle and interception events;
- providers and authentication/streaming behavior;
- custom messages and entry renderers;
- tool call/result renderers;
- custom editor, header/footer/status/widgets, overlays, and autocomplete;
- session messages and persistent entries;
- dynamic tool activation and resource discovery.

Keep runtime actions in commands, tools, or handlers. A long-lived resource must have idempotent shutdown cleanup.

## Tool definition

```ts
pi.registerTool({
  name: "text_case",
  label: "Text Case",
  description: "Convert text to upper or lower case",
  promptSnippet: "Convert text case deterministically",
  promptGuidelines: [
    "Use text_case when the user asks for a deterministic upper/lower case conversion."
  ],
  parameters,
  async execute(_toolCallId, params, signal, onUpdate, _ctx) {
    if (signal?.aborted) {
      return { content: [{ type: "text", text: "Cancelled" }], details: {} };
    }
    onUpdate?.({ content: [{ type: "text", text: "Converting" }] });
    const text = params.action === "upper"
      ? params.text.toUpperCase()
      : params.text.toLowerCase();
    return {
      content: [{ type: "text", text }],
      details: { action: params.action },
    };
  },
});
```

Important fields and behavior:

- `content`: model-visible result.
- `details`: renderer and state data persisted with tool results.
- `promptSnippet`: one-line Available Tools entry.
- `promptGuidelines`: flat system-guideline bullets. Name the tool in every bullet.
- `prepareArguments`: migrate stored arguments from older sessions before current schema validation without weakening the public schema.
- `terminate: true`: skip the automatic follow-up only when every finalized tool result in the batch terminates.
- nested model usage may be returned as `usage` for session accounting.
- throw from `execute` to produce an error tool result. Returning an `isError` property does not mark failure.

Tool calls run in parallel by default. A shared mutable-state tool may need sequential execution; a file-mutating tool must join the runtime's per-file mutation queue.

## File mutation safety

Use `withFileMutationQueue()` around the complete read-modify-write window:

```ts
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function replaceInFile(cwd: string, path: string, oldText: string, newText: string) {
  const absolutePath = resolve(cwd, path.replace(/^@/, ""));
  return withFileMutationQueue(absolutePath, async () => {
    const current = await readFile(absolutePath, "utf8");
    const next = current.replace(oldText, newText);
    await writeFile(absolutePath, next, "utf8");
    return next;
  });
}
```

Resolve the real target relative to `ctx.cwd` before queuing. Queueing only the final write still allows two tools to compute from stale input. Normalize an accidental leading `@` on path arguments to match built-in path behavior.

## Event safety and lifecycle

Common event groups:

- resource and project trust discovery;
- session start/switch/branch/tree/compact/shutdown;
- agent, turn, message, and model lifecycle;
- tool call/result and execution lifecycle;
- input and context transformation.

`tool_call` can block or alter input. A handler error blocks the tool fail-safe. Other extension errors are logged and the agent continues. Use `tool_result` or `context` to change provider-visible tool/message data rather than mutating detached message snapshots.

## Branch-safe state

Persist state in tool-result `details` or extension session entries and reconstruct it from the active branch at session start. A closure-only array is lost on reload and can become inconsistent after branch/tree navigation.

```ts
let items: string[] = [];

pi.on("session_start", async (_event, ctx) => {
  items = [];
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message" || entry.message.role !== "toolResult") continue;
    if (entry.message.toolName !== "my_items") continue;
    items = entry.message.details?.items ?? items;
  }
});
```

Store detached copies in results:

```ts
return {
  content: [{ type: "text", text: "Added" }],
  details: { items: [...items] },
};
```

Use external files only for user/project preferences or data that intentionally outlives and sits outside session branching.

## UI modes

| Mode | `ctx.mode` | `ctx.hasUI` | Boundary |
| --- | --- | --- | --- |
| Interactive | `tui` | true | Full TUI/custom components |
| RPC | `rpc` | true | Dialog/notification protocol; `custom()` unavailable |
| JSON | `json` | false | UI no-op |
| Print | `print` | false | no prompting |

Use `ctx.mode === "tui"` before custom components, terminal input, and TUI-only factories. Use `ctx.hasUI` for dialogs and notifications that also work over RPC. Provide a deterministic noninteractive path when the extension's core function must work in print/JSON mode.

## Pi package layout

```text
my-package/
├── package.json
├── extensions/
│   └── index.ts
├── skills/<name>/SKILL.md
├── prompts/*.md
└── themes/*.json
```

Manifest:

```json
{
  "name": "my-pi-package",
  "version": "1.0.0",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

Without a `pi` manifest, Pi discovers the conventional `extensions/`, `skills/`, `prompts/`, and `themes/` directories. Runtime third-party libraries belong in `dependencies`. Pi's bundled extension APIs belong in `peerDependencies` with `"*"`: `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`, and `typebox` as used.

## Install and update

```bash
# direct behavior test
pi -e ./extensions/index.ts

# package without permanent install
pi -e ./

# user package installs
pi install npm:@scope/package@1.0.0
pi install git:github.com/owner/repo@v1
pi install ./local-package

# project settings
pi install -l ./local-package

# inspect/manage
pi list
pi config
pi update --extensions
```

Project package configuration is shareable and missing packages are reconciled only after the project is trusted. Pin npm versions and Git refs for reproducible team installs. Production installs omit `devDependencies`, so all runtime imports must resolve from dependencies, peer dependencies provided by Pi, or built-ins.

## Custom providers

Use `pi.registerProvider()` for proxies, private endpoints, OAuth/SSO, or nonstandard streaming. Prefer a complete `Provider` from `@earendil-works/pi-ai` when implementing custom authentication, filtering, refresh, or streaming. The legacy name/config form remains useful for endpoint/header overrides and simple model catalogs.

Do not embed credentials. Use the provider's credential flow or documented environment references. Verify provider discovery and one real request; a model appearing in a list does not prove authentication or streaming correctness.

## Official sources

- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/packages
- https://pi.dev/docs/latest/custom-provider
- https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions
- https://pi.dev/news/2026/5/7/pi-has-a-new-home
- https://pi.dev/news/releases/0.79.10
