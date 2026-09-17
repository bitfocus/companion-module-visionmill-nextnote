## Connection Setup

**In NextNote Display**
1. Open **Settings → System Settings**
2. Enable **OSC Control**
3. Note the **Listener Port** (default: `8000`)
4. Set **Feedback IP** to the IP address of your Companion machine
5. Set **Feedback Port** (default: `9000`)

**In Companion**
| Field | Value |
|---|---|
| **NextNote Display IP Address:**   |   IP of the machine running NextNote Display |
| **NextNote OSC Listener Port:**   |   Must match the Listener Port set in NextNote (default: `8000`) |
| **Companion Feedback Receive Port:**   |   Must match the Feedback Port set in NextNote (default: `9000`) |

---

## What This Module Controls

- **Helpers** — Select a connected helper machine by name
- **Info** - Presentation Name, Slide info, Build info
- **Layout** — Switch between Slides Above, Below, Left, Right, or Notes Only
- **Media** - up to 6 media players can be detected showing clip name and remaining time/duration
- **Memory Slots** — Recall up to 20 named layout memories
- **Prompter** — Scroll up/down (press again to increase speed, max 9), Stop, Pointer on/off, Text Show/Hide/Toggle
- **Slides** — First, Previous, Next, Last, Hide (black screen), Show


---

## Feedback & Buttons

Buttons update automatically when NextNote sends state changes:

- **Layout buttons** light up when that layout is active
- **Memory buttons** show the name and light up when recalled
- **Scroll Speed** button changes colour by speed (green → orange → red → purple)
- **Pointer** button lights up when the pointer is active
- **Prompter Text** button toggles text visibility and lights green when NextNote reports visible text. Show and Hide actions are also available. Visibility does not change the pointer or scrolling settings.
- **Media buttons** show clip name, remaining time, and runtime, colour-coded by playback state (green = playing, orange = paused, red = ready/finished)

---

## Notes

- Companion requests full state from NextNote 3 seconds after connecting — buttons will update shortly after the connection is established
- Helper names and memory slot names populate automatically as NextNote broadcasts them
- The `prompter_text_visible` variable is 1 for visible text and 0 for hidden text. It starts at 0 until the first visibility feedback arrives.
- Media slots support up to 6 simultaneous clips per slide
