# Start and sessions

Use this reference for installation, the interactive terminal, commands and keys, configuration precedence, run modes, sessions, context management, planning, goals, and handoffs.

## Overview

Source: https://omp.sh/docs

Run `omp` in a project and ask for a concrete outcome plus a way to verify it. Use `/plan` before large or risky changes. Work is visible as tool cards; `Ctrl+O` expands output. `Escape` stops the active turn. OMP can edit and execute locally, while prompts and selected context go to the chosen provider.

## Quickstart

Source: https://omp.sh/docs/quickstart

```sh
# macOS/Linux
curl -fsSL https://omp.sh/install | sh

# Windows PowerShell
irm https://omp.sh/install.ps1 | iex

omp --version
cd path/to/project
omp
```

Use `/login` to authenticate, `/model` to choose a model, `/exit` to quit, and `omp --continue` to resume the newest session. Follow the installer's PATH instructions and open a new terminal if `omp` is not found.

## Using the TUI

Source: https://omp.sh/docs/using

- `Enter`: submit; while active, steer the current turn.
- `Shift+Enter`, `Ctrl+J`, or `Alt+Enter`: newline. Windows Terminal generally works best with `Alt+Enter`.
- `Ctrl+Q` or `Ctrl+Enter`: queue a follow-up. `Alt+Up`/`Shift+Up` returns a queued item to the editor.
- `Escape`: interrupt or dismiss the focused surface. `.` or `c`: continue. `Alt+R`: retry.
- `@`: attach a file; paste, drag, or use `@path/to/image.png` for images.
- `Ctrl+G`: external editor (`$VISUAL`, then `$EDITOR`); `Ctrl+R`: prompt history.
- `! command`: run shell and include output in context; `!! command`: display without context.
- `$ code`: shared Python kernel and include output; `$$ code`: display without context. A space after `$` is required.
- `/model` or `Alt+M`: persistent role selection. `/switch` or `Alt+P`: session-only model switch.
- `Ctrl+P`/`Ctrl+Shift+P`: cycle configured roles. `Shift+Tab`: thinking effort. `Ctrl+T`: only thinking-block visibility.
- Recovery: `omp -c` for newest; `omp -r` for the picker. Use `/compact` near a context limit.

## Slash commands

Source: https://omp.sh/docs/slash

Type `/` for completion, filter by typing, accept with `Tab`/`Enter`, dismiss with `Escape`. Arguments follow a space; quoted arguments preserve spaces. `/force write` and `/force:write` are equivalent. There is no universal `/help`; use `/hotkeys` and command-specific help such as `/mcp help`.

Important groups:

- Setup/models: `/settings`, `/setup`, `/providers`, `/login [provider]`, `/logout [provider]`, `/model`, `/switch`, `/fast`, `/extended-context`, `/vision`, `/prewalk`, `/advisor`.
- Work modes: `/plan`, `/plan-review`, `/vibe`, `/goal`, `/guided-goal`, `/loop`, `/force:<tool>`, `/pause`.
- Sessions/context: `/new`, `/fresh`, `/clear`, `/drop`, `/resume`, `/session`, `/tree`, `/branch`, `/fork`, `/compact`, `/shake`, `/handoff`, `/retry`.
- Project roots: `/move`, `/add-dir`, `/remove-dir`, `/dirs`.
- State: `/todo`, `/jobs`, `/usage`, `/stats`, `/context`, `/tools`, `/extensions`, `/agents`, `/debug`, `/memory`.
- Export/collaboration: `/export`, `/dump`, `/share`, `/collab`, `/join`, `/leave`. `/dump` may contain raw context and secrets.
- Integrations: `/mcp`, `/ssh`, `/marketplace`, `/plugins`, `/reload-plugins`, `/review`, `/security`.
- Skills/templates: `/skill:<name> [arguments]`; file commands and prompt templates are separately discovered.

Plan, goal, and vibe are mutually exclusive. `/loop` takes precedence over automatic goal continuation. Destructive session commands and exports require explicit care.

## Keybindings

Source: https://omp.sh/docs/keybindings

Run `/hotkeys` for the active map. Common defaults include `Ctrl+C` clear (twice quickly exits), `Ctrl+D` exit, `Ctrl+O` expand tool output, `Alt+L` redraw, `Alt+A` Agent Hub, `Alt+Shift+P` plan toggle, and `Ctrl+L` live voice.

Remap action IDs in:

- `~/.omp/agent/keybindings.yml`
- `~/.omp/profiles/<name>/agent/keybindings.yml`
- `$PI_CODING_AGENT_DIR/keybindings.yml`

An empty binding array unbinds an action. Action families are `app.*`, `tui.editor.*`, `tui.input.*`, and `tui.select.*`. Context matters: in the main editor, `Ctrl+D` exits, so forward delete is `Delete`.

## Settings and precedence

Source: https://omp.sh/docs/settings

Use `/settings` for effective interactive values. Use the CLI for exact or non-UI values:

```sh
omp config list
omp config list --json
omp config get theme.dark
omp config set compaction.enabled false
omp config reset theme.dark
omp config path
```

Locations:

- Global: `~/.omp/agent/config.yml`
- Named profile: `~/.omp/profiles/<name>/agent/config.yml`, selected by `--profile` or `OMP_PROFILE`
- Project: `<cwd>/.omp/config.yml`; parent directories are not searched
- Process overlays: `PI_CONFIG_FILES`, then repeated `--config`

Precedence, low to high: built-in defaults → active global/profile → project → `PI_CONFIG_FILES` in listed order → `--config` in CLI order → runtime flags and feature-specific environment variables. Mappings merge recursively, scalar values are replaced, and arrays replace rather than concatenate. Invalid YAML or rejected keys can prevent startup. A broken config may be renamed to `*.broken-<timestamp>-<pid>-<id>`. Existing sessions may need `/reload-settings` or `/reload-plugins`.

## Run modes

Source: https://omp.sh/docs/modes

- Interactive: `omp` or `omp "first prompt"`.
- One-shot text: `omp -p "prompt"` or `omp --mode text "prompt"`; final text is stdout and progress is stderr.
- JSON: `omp --mode json "prompt"`.
- RPC: `omp --mode rpc`; stdin/stdout are protocol frames, not prompts.
- RPC with host UI: `omp --mode rpc-ui`.
- Editor ACP: `omp acp` or `omp --mode acp`.

Launch modes are mutually exclusive. `git diff | omp -p "Review this diff"` is valid. `/loop [count|duration] [prompt]` repeats work; invoke `/loop` again or press `Escape` to stop. `/force:<tool>` forces the next call only. `/fast` applies only where the provider/model supports the service tier.

## Sessions

Source: https://omp.sh/docs/sessions

Sessions save completed messages and tool activity automatically. Streaming output is committed when complete, so a hard crash can lose the unfinished tail.

- `omp -c`/`--continue`: terminal breadcrumb first, otherwise the most recently modified session for the directory.
- `omp -r`/`--resume`: picker. `omp -r <id-or-path>` selects one.
- `/new`: preserve current session and start another. `/drop`: delete current session and start fresh.
- `/rename`, `/pin`, `/move <path>`, `/session info` manage metadata.
- `/branch`: alternate path within the same session tree. `/fork`: clone current tree and artifacts to a new session ID.
- `/export [path]`, `omp --export session.jsonl session.html`, `omp share`, and `omp --fork received.jsonl` handle portability.
- `--no-session`: no persistence, crash recovery, resume, or durable tree.

Default storage is `~/.omp/agent/sessions/`; profiles use `~/.omp/profiles/<name>/agent/sessions/`. Override with `--session-dir`.

## Session tree

Source: https://omp.sh/docs/session-tree

`/tree` shows in-file branches. Highlighting does not switch paths until `Enter`. `Shift+Enter` summarizes the path being left before switching. `/fork` creates a separate session; `/tree` does not. Useful keys: arrows, `Alt+Up`/`Alt+Down` for message turns, `PgUp`/`PgDn`, `Home`/`End`, typing to search, `Shift+L` labels, `Ctrl+O`/`Ctrl+Shift+O` filters. Tree state and compaction dividers persist only in saved sessions.

## Memory

Source: https://omp.sh/docs/memory

Memory is cross-session knowledge; compaction only reduces one session. It defaults to `off`. Select one backend with `/settings` or:

```sh
omp config set memory.backend local
omp config set memory.backend mnemopi
omp config set memory.backend hindsight
```

- `local`: per-working-directory generated summaries under `~/.omp/agent/memories/<encoded-project>/`.
- `mnemopi`: local SQLite with structured recall/retention and configurable embeddings/LLM extraction.
- `hindsight`: remote bank, default `http://localhost:8888`; retained text leaves the machine.

Use `/memory`, `/memory stats`, `/memory diagnose`, `/memory enqueue`, `/memory clear`, and backend-specific mental-model commands. `local` clear removes generated memory, not session transcripts. Hindsight clear does not delete the remote bank. Privacy-sensitive Mnemopi can use `noEmbeddings: true` and `llmMode: none`.

## Compaction

Source: https://omp.sh/docs/compaction

Automatic compaction is enabled by default. `/context` shows usage. Manual choices:

- `/compact [focus]`: conventional summary.
- `/compact soft [focus]`: soft summary.
- `/compact remote [focus]`: provider-native, falling back to soft.
- `/compact snapcompact`: image archive plus vision model; no focus argument.
- `/handoff [focus]`: task-state checkpoint.
- `/shake [elide|images|thinking]`: remove bulk without a summary.

Key defaults: `compaction.enabled: true`, `methodOrder: [remote, snapcompact, handoff, shake, soft]`, `thresholdTokens: -1`, `thresholdPercent: -1`, `keepRecentTokens: 20000`, `midTurnEnabled: true`, `asyncEnabled: true`, `autoContinue: true`. A positive token threshold overrides percentage. `Escape` cancels active compaction.

## Plan mode

Source: https://omp.sh/docs/plan

`/plan <objective>` performs a read-only planning turn, then opens Plan Review. Choices are approve and execute in a fresh session, approve and compact, approve while keeping context, refine, or save and quit. Leaving without approval changes nothing. `--plan <model>` selects the plan model role but does not enter Plan mode. `plan.defaultOnStartup` applies only to fresh interactive sessions. Plan cannot start while goal or vibe is active.

## Goal mode

Source: https://omp.sh/docs/goal

Use `/goal <bounded testable objective>` for work that spans multiple turns but has a clear finish line. Commands: `/goal show`, `pause`, `resume`, `budget <positive integer>`, `budget off`, `set <objective>`, and `drop`. `set` resets counters; `drop` permanently stops the goal. Interruptions reopen it paused; budget exhaustion yields `budget-limited`. Completion requires verification, not just an implementation claim. Goal, plan, and vibe are mutually exclusive.

## Handoff

Source: https://omp.sh/docs/handoff

`/handoff [focus]` summarizes completed work, decisions, constraints, and next steps, then compacts in place. It does not create, fork, rename, or switch a session. Manual handoff never writes a separate file; `handoffSaveToDisk` applies only to automatic handoffs in persisted sessions. If generation fails or is cancelled, the original context remains active.
