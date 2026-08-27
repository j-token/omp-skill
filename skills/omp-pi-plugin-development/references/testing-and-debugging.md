# Testing and debugging extensions and packages

Verification must cross the same boundary the feature changes. Import success proves only loading; a tool, command, event, provider, UI, or package requires its own behavioral check.

## Preflight

Record before changing code:

- runtime product and version;
- import namespace and installed dependencies;
- entry point and manifest key;
- project/user/profile scope;
- ambient extensions/packages that may duplicate registrations;
- requested observable behavior.

For an ambiguous `pi` executable, inspect `pi --help`. If it identifies another product or lacks Pi Coding Agent's extension/package surfaces, do not use it for Pi verification.

## Verification ladder

Run the lowest step that proves each boundary, in order:

1. **Static contract:** type/import/schema consistency with the installed runtime.
2. **Direct load:** load the exact extension entry without packaging.
3. **Behavior:** invoke the command/tool/event/provider/UI path.
4. **Discovery:** prove the intended project/user location is found.
5. **Package:** load the package root and its sibling resources.
6. **Managed install:** link/install/list/doctor only after direct behavior passes.
7. **Distribution:** validate marketplace/npm/Git metadata and clean-install behavior.

Do not jump directly to publishing or a global install to debug a factory error.

## OMP checks

### Isolated direct load

```bash
omp --no-extensions --extension ./src/index.ts
```

Use an interactive session for commands and TUI. Inspect:

```text
/extensions
/tools
```

Invoke every changed registration:

- `/command args` for a command;
- prompt the model to call the custom tool and inspect its result;
- trigger the relevant event with the real operation;
- make one provider request for provider extensions.

### Managed plugin

```bash
omp plugin install --dry-run ./
omp plugin link .
omp plugin list --json
omp plugin doctor
omp plugin config validate <name>
```

In an existing session, use `/reload-plugins` and invoke the feature again. A linked source changing on disk is not proof that the active session reloaded it.

### Logs

OMP writes structured logs under the active state root, normally `~/.omp/logs/`. Extension load failures include the entry path and error. Use the active profile/state root rather than assuming the default path.

Common OMP failure causes:

| Symptom | Check |
| --- | --- |
| File ignored | native `.omp/extensions` root, cwd, profile, `--no-extensions` |
| Duplicate command/tool | same absolute path discovered twice, another plugin registration, built-in name conflict |
| Factory throws | runtime action called during load, missing dependency, wrong default export |
| Tool absent | feature disabled, tool inactive/discoverable, package manifest entry missing |
| UI silently absent | headless/RPC/ACP mode does not support the method |
| Session crashes later | raw timer/detached promise rejection, missing resource cleanup |
| Pi dynamic skill port fails | `resources_discover` not emitted in the installed OMP path |

## Pi checks

### Direct extension

```bash
pi -e ./extensions/index.ts
```

For an auto-discovered extension, place it in `.pi/extensions/` or `~/.pi/agent/extensions/`, trust the project when appropriate, then use `/reload`.

### Direct package

```bash
pi -e ./
```

This proves package manifest/convention discovery without a permanent install. Then inspect/configure active resources with Pi's package/config surfaces and invoke the actual feature.

### Managed package

```bash
pi install -l ./
pi list
pi config -l
```

Use a disposable project for install-flow testing. Confirm the package's runtime dependencies are available under a production-style install; `devDependencies` are not a runtime contract.

Common Pi failure causes:

| Symptom | Check |
| --- | --- |
| Project extension ignored | project trust, `.pi/extensions`, project settings |
| Import failure after distribution | runtime library incorrectly left in `devDependencies` |
| Google rejects tool schema | literal union used instead of `StringEnum` |
| File update lost | mutation did not wrap the full read-modify-write in `withFileMutationQueue()` |
| State changes after branch/reload | closure-only state, missing reconstruction from branch/details |
| RPC has UI but overlay fails | `ctx.hasUI` true does not mean TUI `custom()` exists |
| Tool returns apparent error but not `isError` | `execute` returned an error-shaped value instead of throwing |

## Behavioral scenarios

### Tool

Check:

- valid boundary input;
- invalid input/schema error;
- cancellation with `AbortSignal`;
- meaningful progress update if implemented;
- returned `content` and `details`;
- correct approval/effect classification on OMP;
- concurrent access for files or shared state;
- renderer on success and failure if custom rendering changed.

### Command

Check:

- empty and nonempty arguments;
- behavior while the agent is idle/streaming if message delivery matters;
- session-control operation completes before stale context is reused;
- command name does not collide with a built-in.

### Event/interception

Check both allow and block/transform branches. For a safety gate, prove the dangerous call is blocked and a benign call still executes. A test that only registers the handler does not defend policy behavior.

### State

Check:

- reload;
- session switch;
- branch/tree navigation;
- shutdown and restart;
- corrupted or absent optional external state where applicable.

### UI

Exercise the actual TUI for visual/interactive changes. Also run the relevant headless mode to prove the extension degrades without waiting for input or crashing. For RPC/ACP support, use a client that answers the real UI request rather than inferring from types.

### Provider

Check:

- provider/model discovery;
- credential resolution without exposing secrets;
- one successful streamed request;
- cancellation;
- API/domain failure mapping;
- unregister/reload cleanup when implemented.

## Package and release checks

OMP plugin:

- manifest entries exist and load;
- sibling resources resolve inside the plugin root;
- dry-run/install/link points at intended scope;
- `plugin doctor` is clean;
- marketplace source/ref/SHA and plugin name are correct.

Pi package:

- `pi` manifest globs or conventional directories resolve intended resources only;
- package identity and keyword are correct;
- runtime dependencies and peer dependencies match imports;
- local, npm, or Git source is pinned as intended;
- project trust and `-l` scope behavior are documented.

## Evidence format

Report exact observations:

```text
Runtime: OMP 18.0.6 (`omp --version`)
Load: `omp --no-extensions -e ./src/index.ts`
Exercise: invoked `/greet Ada`
Observed: visible `Hello, Ada!` message; extension remained loaded in `/extensions`
Package: not tested / `omp plugin doctor` clean
```

Do not report “tests pass” when only type-checking ran. If runtime verification is blocked by an unrelated executable collision or missing runtime, say which static checks succeeded and name the unperformed command/interaction.
