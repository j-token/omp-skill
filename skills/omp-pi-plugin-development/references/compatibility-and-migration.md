# OMP and Pi compatibility and migration

OMP deliberately supports parts of the Pi extension ecosystem, but compatibility is layered. A module importing successfully does not prove equivalent lifecycle, tool, UI, packaging, or state behavior.

## Compatibility layers

### Loader compatibility in OMP 18.0.6

OMP's legacy Pi module loader documents these bridges:

- accepts `package.json#pi.extensions` in addition to `omp.extensions`;
- rewrites `@mariozechner/*` and `@earendil-works/*` Pi package specifiers to host-bundled copies while loading;
- rewrites legacy bare `@sinclair/typebox` to the host copy;
- accepts a default sync or async factory receiving `ExtensionAPI`;
- captures per-extension load errors without aborting all other extensions.

This makes many small Pi extensions loadable in OMP. It does not establish source compatibility with every current Pi API.

### Shared conceptual surface

Both runtimes support the core pattern:

```ts
export default function extension(pi: ExtensionAPI) {
  pi.registerTool(...);
  pi.registerCommand(...);
  pi.on(...);
}
```

Both expose tool call/result interception, commands, session events, UI context, message/session actions, providers, custom rendering, and trusted in-process execution.

### Known divergence

| Area | OMP | Pi Coding Agent |
| --- | --- | --- |
| Native project root | `.omp/extensions/` | `.pi/extensions/` |
| New import namespace | `@oh-my-pi/*` | `@earendil-works/*` |
| New package manifest | `omp.extensions` | `pi.extensions` |
| Distribution | plugin manager and marketplaces | Pi packages via npm/Git/local and gallery |
| Schema guidance | injected `pi.zod` / `pi.arktype`, legacy shim | `typebox` plus `StringEnum` |
| Tool policy | `approval`, `loadMode`, OMP discovery metadata | Pi prompt and execution metadata |
| Sibling bundle resources | skills, commands, hooks, tools, agents, rules, prompts, MCP/LSP/DAP, etc. | extensions, skills, prompts, themes |
| Dynamic resources | OMP 18.0.6 docs note no session callsite for `resources_discover` | official dynamic-resource example exists |
| UI modes | TUI, RPC, ACP, print/headless with OMP-specific support | TUI, RPC, JSON, print with Pi-specific support |
| File mutation helper | native fallback/invocation surfaces differ | documented `withFileMutationQueue()` contract |

When code touches a divergent row, prefer platform-specific entry points.

## Decide support strategy

### Single target

Use one native manifest, import namespace, discovery path, and verification workflow. This is the default and lowest-maintenance choice.

### Pi source loaded by OMP compatibility

Acceptable when all of these hold:

- the extension uses only APIs present in the installed OMP type/runtime surface;
- dependencies resolve through documented compatibility rewriting or package dependencies;
- it does not depend on Pi-only resource/package behavior;
- direct behavioral tests pass in OMP.

Document OMP as a tested compatibility target, not as implied support from the manifest.

### First-class dual target

Use separate thin entry points when imports or registration metadata diverge:

```text
src/
├── core.ts
├── omp.ts
└── pi.ts
```

Keep pure domain logic in `core.ts`. Each adapter owns:

- runtime imports and schema definition;
- registration metadata;
- lifecycle/UI bridges;
- packaging manifest and discovery paths.

Do not dynamically detect the runtime throughout domain code. That spreads compatibility branches and makes either target difficult to type-check and test.

## Pi namespace migration

For `@mariozechner/*` to `@earendil-works/*`:

1. inspect the installed/pinned Pi version and lockfile;
2. update the Pi runtime package and every Pi peer import as one dependency cutover;
3. ensure only one package generation supplies shared runtime symbols;
4. update package `peerDependencies` and examples;
5. direct-load the extension under the new Pi runtime;
6. exercise renderers, themes, providers, and session state—not only a trivial command.

Do not change only the type import while leaving other Pi/TUI/AI packages on the old namespace.

## Pi-to-OMP migration

1. Replace native location `.pi/extensions/` with `.omp/extensions/` or load explicitly.
2. Prefer `@oh-my-pi/pi-coding-agent` and OMP's current schema builders for a native OMP port.
3. Add `omp.extensions`; remove `pi.extensions` when Pi support is intentionally dropped.
4. Map Pi package resources to OMP plugin conventional directories.
5. Review tool policy and assign truthful OMP `approval`/`loadMode`.
6. Replace Pi-only dynamic resources, file mutation, UI, or package APIs with documented OMP equivalents.
7. verify with direct `omp -e`, the actual command/tool/event, `/extensions`, and `/tools`.
8. only then link/install as an OMP plugin and run `omp plugin doctor`.

## OMP-to-Pi migration

1. Replace `.omp` discovery paths and `omp.extensions` with Pi-native paths and `pi.extensions`.
2. Replace `@oh-my-pi/*` imports with the matching current `@earendil-works/*` packages.
3. Convert injected OMP schemas and tool policy fields to Pi's supported tool definition.
4. Remove OMP-only sibling capabilities or package them through a Pi-supported mechanism.
5. add runtime imports to proper Pi `peerDependencies`/`dependencies`.
6. adopt Pi file-mutation and branch-state patterns where relevant.
7. verify direct extension and package loading separately.

## Compatibility acceptance matrix

For a claimed dual-runtime extension, record each observable path:

| Capability | OMP | Pi |
| --- | --- | --- |
| Factory loads | observed | observed |
| Command invokes | observed/N/A | observed/N/A |
| Tool schema and result | observed/N/A | observed/N/A |
| Tool interception | observed/N/A | observed/N/A |
| State after reload/branch | observed/N/A | observed/N/A |
| Interactive UI | observed/N/A | observed/N/A |
| Headless behavior | observed/N/A | observed/N/A |
| Provider request | observed/N/A | observed/N/A |
| Managed package install | observed/N/A | observed/N/A |

A blank or inferred cell means that capability is not verified for that runtime.

## Sources

- https://github.com/can1357/oh-my-pi/blob/v18.0.6/docs/extension-loading.md
- https://github.com/can1357/oh-my-pi/blob/v18.0.6/docs/extensions.md
- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/packages
- https://pi.dev/news/2026/5/7/pi-has-a-new-home
