# Target routing

Identify the runtime before reading or writing extension code. OMP and Pi use similar names and factory shapes, and unrelated products may also install a `pi` executable.

## Detection order

Use repository evidence before asking the user:

1. Inspect extension imports.
2. Inspect `package.json` extension manifests and dependencies.
3. Inspect native resource paths and config files.
4. Run version/help commands when the corresponding executable is available.
5. Inspect the command banner and supported subcommands; a version-shaped response alone does not establish product identity.
6. Resolve project/user/profile scope from existing files.

### Strong identifiers

| Evidence | Target |
| --- | --- |
| `@oh-my-pi/pi-coding-agent` | OMP |
| `"omp": { "extensions": ... }` | OMP plugin |
| `.omp/extensions/`, `.omp/config.yml` | OMP |
| `omp plugin ...` | OMP plugin manager |
| `@earendil-works/pi-coding-agent` | current Pi Coding Agent |
| `@mariozechner/pi-coding-agent` | legacy Pi Coding Agent |
| `.pi/extensions/`, `.pi/settings.json` | Pi Coding Agent |
| `"pi": { "extensions": ... }` | usually Pi package; also accepted by OMP compatibility loading |
| `pi install`, `pi config`, `/reload` with Pi package resources | Pi Coding Agent |

A `pi.extensions` manifest alone is ambiguous because OMP accepts it for compatibility. Use imports, paths, dependencies, and the requested install workflow to break the tie.

## Command checks

For OMP:

```bash
omp --version
omp --help
omp plugin --help
```

For Pi Coding Agent:

```bash
pi --version
pi --help
```

Expected Pi evidence includes Pi Coding Agent resource flags such as `--extension/-e`, `--no-extensions`, package/config commands, and the `~/.pi/agent` model. If help identifies another program, do not execute package or extension commands from this skill against it.

## Classify the artifact

```text
Need model-callable behavior, commands, lifecycle, provider, or UI?
  -> extension

Need only an on-demand instruction pack?
  -> skill

Need event interception in existing OMP legacy structure?
  -> hook; otherwise prefer extension

Need an OMP-installable bundle of extensions/resources?
  -> OMP plugin

Need a Pi-installable npm/Git/local resource bundle?
  -> Pi package

Need a service usable from several clients?
  -> MCP server; this skill covers only bundling its config
```

Do not implement executable behavior as a skill. Do not create an MCP server for a small in-process runtime integration unless cross-client use is required.

## Resolve scope

| Goal | OMP | Pi |
| --- | --- | --- |
| One test run | `omp -e ./entry.ts` | `pi -e ./entry.ts` |
| Project auto-discovery | `.omp/extensions/` | `.pi/extensions/` |
| User auto-discovery | `~/.omp/agent/extensions/` | `~/.pi/agent/extensions/` |
| Managed/distributed bundle | OMP plugin | Pi package |

OMP named profiles change the active user agent directory. Pi project packages and extensions are gated by project trust. Preserve an existing scope rather than adding the same extension to a second discovery path.

## Version rules

- Prefer installed type declarations, command help, and a matching tagged official document over snippets copied from newer `main`.
- OMP plugin fields and extension events evolve independently from Pi.
- Current Pi uses `@earendil-works/*`; `@mariozechner/*` indicates a pre-0.74-era dependency or legacy extension.
- Never silently modernize imports without updating the owning dependency and verifying runtime identity.

## When to ask

Ask one targeted question only when evidence supports materially different deliverables, for example:

- both runtimes are present and the user has not chosen one;
- “support Pi” could mean current Earendil Pi or an unrelated local `pi` program;
- dual-runtime support would require separate entry points and the user has not accepted that maintenance cost.

Otherwise choose the repository's established runtime and proceed.
