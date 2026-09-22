# Speaker Timer module

Timer-specific Companion code lives in `src/speaker-timer.ts`. `main.ts` owns lifecycle; the existing action, variable, feedback and preset factories register its definitions. NextNote Display owns timing; Companion only sends commands and renders confirmed state.

## Presets

- **Speaker Timer — Controls:** Reset, Flash, global Show/Hide Timer, Pause, Start, ±5m/1m/30s, Set Timer and Undo Adjust. Pause is dark orange and Start dark green; the active transport pulses lighter. Reset stops transport pulsing. Flash has independent selected feedback. Stale feedback returns neutral styling.
- **Speaker Timer — Durations:** 5, 10, 15, 20, 30 and 60 minutes, loaded ready for Start.
- **Speaker Timer — Info:** speaker/time/state together, plus separate Hours, Minutes and Seconds for larger displays.

Set Timer accepts H:MM:SS or MM:SS. Existing numeric action values remain seconds. Set replaces the run without modifying saved speaker memory. Explicit start/pause/resume/toggle and per-output actions remain available; per-output visibility does not open windows. Existing user buttons are not rewritten: drag the new presets to replace older button designs.

## Protocol

OSC uses `/nextnote/timer/<action>/<values>` with no arguments: `set/900`, `set-start/900`, `adjust/-30`, `visibility/prompter/0`, `mode/presenter/both`. Playback actions are start, pause, resume, toggle, reset and undo. `visibility-toggle` controls global display visibility without restarting timing. `enable` and `flash` take 0/1; `flash-toggle` and `request` take no value. Durations are 1–359999 seconds; adjustments are signed within ±359999. Output identifiers: presenter, next, prompter, fullscreen, web. Display modes apply only to presenter, next and prompter; fixed outputs reject mode changes.

Feedback is JSON on `/nextnote/feedback/timer`. Session/sequence checks reject malformed, reordered and retired-session state. After 2.5 seconds without fresh feedback, live values clear and Companion requests authoritative state. Pulse intervals are stopped when the module stops. No optimistic state changes or adjustment retries.

Variables: timer_hours, timer_minutes, timer_seconds, timer_duration, timer_remaining, timer_formatted, timer_state, timer_stage, timer_speaker, timer_clock, timer_fresh, timer_enabled, timer_flashing.

## Build and verification

Use Node 22.20+ and Yarn 4: `yarn test` builds TypeScript and runs 12 timer/UDP regression tests; `yarn build` produces `dist`; `yarn dev` watches source. Live Companion acceptance was confirmed by the owner on 20 September 2026. The internal package version remains 1.0.2; no release was published in this task.

The active local development folder is `~/Companion-Module-Dev/companion-module-visionmill-nextnote-api2`. Its source differs from this repository: do not overwrite it or rebuild it without reconciliation. Tested `dist` was copied there, with backups in workspace `Companion/dev-build-backups`. This repository is authoritative. Older ignored tgz packages are development artifacts, not the final release; rebuild any distributable from main.
