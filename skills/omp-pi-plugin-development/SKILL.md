---
name: omp-pi-plugin-development
description: Build, debug, migrate, package, and publish Oh My Pi (OMP) plugins/extensions and Pi Coding Agent extensions/packages. Use whenever a request mentions OMP or Pi plugin development, `ExtensionAPI`, `registerTool`, `registerCommand`, lifecycle events, custom TUI, providers, `.omp/extensions`, `.pi/extensions`, `omp plugin`, Pi packages, extension loading failures, or OMP/Pi compatibility—even when the user casually says “plugin” without naming the runtime.
compatibility: Requires TypeScript and an OMP and/or Pi Coding Agent installation for runtime verification. Internet access is optional when matching live documentation is needed.
metadata:
  sources:
    - https://omp.sh/docs/extension-authoring
    - https://pi.dev/docs/latest/extensions
  docs-snapshot: "2026-08-27"
---

# OMP and Pi Plugin Development

Build against the detected runtime, not a blended API. OMP and Pi share an extension-factory lineage, but their import namespaces, discovery roots, package systems, tool metadata, UI modes, and release cadence differ.

## Route every request

Read [Target routing](references/target-routing.md) first. Then read only the references required by the task:

| Request | Read |
| --- | --- |
| Create, modify, or debug an OMP extension/plugin | [OMP development](references/omp-development.md) |
| Create, modify, or debug a Pi extension/package | [Pi development](references/pi-development.md) |
| Port one runtime to the other, support both, or diagnose ambiguous `pi` behavior | [Compatibility and migration](references/compatibility-and-migration.md) |
| Verify, debug loading, test modes, or prepare release evidence | [Testing and debugging](references/testing-and-debugging.md) |

For tasks spanning runtimes, read both platform references plus the compatibility reference. Do not load both platform references for a clearly single-runtime task.

## Establish the contract before editing

1. Identify the actual runtime from imports, manifests, paths, command help, and installed dependencies.
2. Inspect the installed version and the project's current package/config files. A binary named `pi` is not sufficient proof that it is Pi Coding Agent.
3. Classify the requested artifact:
   - runtime behavior: extension;
   - OMP-managed bundle: plugin;
   - Pi-distributed bundle: Pi package;
   - event-only legacy policy: hook only when an existing hook must be maintained;
   - cross-client external service: MCP server, outside this skill except for bundling its config.
4. Fix the target runtime and scope: project, user/profile, one-shot CLI load, linked development checkout, or distributed package.
5. State observable acceptance: command output, model-callable tool result, event decision, UI interaction, provider discovery, or installed resource list.

If the target remains genuinely ambiguous after inspecting repository and command evidence, ask whether the deliverable targets OMP, Pi Coding Agent, or both. Do not guess from the word “Pi.”

## Implement from the runtime outward

1. Reuse the repository's existing package layout, schema builder, state pattern, and test style.
2. Import the target runtime's types:
   - OMP: `@oh-my-pi/pi-coding-agent`;
   - current Pi: `@earendil-works/pi-coding-agent`;
   - treat `@mariozechner/*` as legacy Pi that requires version-aware migration.
3. Keep the factory registration-only. Register tools, commands, handlers, providers, and renderers there; perform session actions inside handlers, commands, or tools.
4. Define the narrowest tool contract. Pass cancellation signals, stream progress only when useful, return model-facing `content`, and keep renderer/state data in `details`.
5. Respect concurrency and lifecycle. Serialize file mutations where the runtime requires it, clean up session resources, and never leave unhandled timer or detached-promise failures.
6. Guard UI features by actual mode. Headless, JSON, RPC, ACP, and interactive TUI surfaces do not expose identical UI methods.
7. Package only after the extension works through a direct one-shot load.

Use the bundled templates as starting points, not as a compatibility promise:

- OMP: [assets/templates/omp-plugin](assets/templates/omp-plugin)
- Pi: [assets/templates/pi-package](assets/templates/pi-package)

Copy only the matching runtime template. Preserve the target project's package manager and naming conventions.

## Apply security boundaries

- Extensions and plugins execute in-process with the user's full permissions. Review source and dependencies before loading.
- Keep OMP tool `approval` aligned with actual effects; do not label writes or process execution as read-only.
- Keep project trust and normal approval prompts enabled for untrusted code.
- Never commit API keys. Use runtime credential storage or documented environment-variable references.
- A blocked/aborted model turn does not undo extension side effects. Verify filesystem and process state.
- Treat tool-call interception errors as safety-sensitive because both runtimes use fail-closed behavior on pre-execution handler failures.

## Verify the actual surface

Read [Testing and debugging](references/testing-and-debugging.md), then exercise the requested behavior:

- load the exact extension or package;
- invoke the registered command/tool/event/provider path;
- inspect the runtime's extension/tool/package listing;
- cover interactive and headless behavior when UI or mode branching changed;
- verify installation or marketplace/package metadata only after direct-load behavior passes.

Type-checking or successful import is not feature proof. Report the command or interaction performed and the observed result. If the target runtime is unavailable or the `pi` executable belongs to another product, finish static work and state precisely which runtime verification could not be performed.

## Clean cutovers

When migrating:

- update imports, manifests, discovery paths, package metadata, docs, and every loading command together;
- remove obsolete aliases and duplicate discovery entries;
- do not claim dual-runtime support until the same observable behavior has run successfully in both runtimes;
- keep platform-specific entry points when APIs diverge instead of hiding conditionals throughout one module.

## Delivery format

For implementation work, report:

1. detected runtime and version evidence;
2. changed paths and registered capabilities;
3. scope and loading/install command;
4. observed behavioral verification;
5. remaining version or cross-runtime constraints.
