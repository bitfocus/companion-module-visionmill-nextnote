# companion-module-visionmill-nextnote

Bitfocus Companion module for **NextNote Display** by Visionmill.

Controls presentation display software including slide navigation, teleprompter scrolling, pointer control, layout switching, helper selection, and media playback monitoring — all via OSC over UDP.

This version targets **Companion module API 2.0** for Companion **4.3+**.

---

## Setup

### In NextNote Display
1. Open **Settings → System Settings**
2. Enable **OSC Control**
3. Set **Listener Port** (default: `8000`) — this is the port NextNote listens on for commands
4. Set **Feedback IP** to your Companion machine's IP address
5. Set **Feedback Port** (default: `9000`) — this is the port Companion will listen on

### In Companion
1. Add a new connection: **Visionmill → NextNote Display**
2. Set **NextNote Display IP Address** to the IP of the machine running NextNote Display
3. Set **NextNote OSC Listener Port** to match the port set in NextNote (default: `8000`)
4. Set **Companion Feedback Receive Port** to match the port set in NextNote's Feedback Port field (default: `9000`)

---

## Actions

| Action | OSC Command Sent |
|---|---|
| Layout: Slides Above Notes | `/nextnote/Above` |
| Layout: Slides Left, Notes Right | `/nextnote/Left` |
| Layout: Slides Below Notes | `/nextnote/Below` |
| Layout: Notes Left, Slides Right | `/nextnote/Right` |
| Layout: Notes Only | `/nextnote/Notes` |
| Slide: Go to First | `/nextnote/First` |
| Slide: Previous | `/nextnote/Previous` |
| Slide: Next | `/nextnote/Next` |
| Slide: Go to Last | `/nextnote/Last` |
| Slide: Hide (Black Screen) | `/nextnote/Hide` |
| Slide: Show (Restore Screen) | `/nextnote/Show` |
| Pointer: Turn On | `/nextnote/PointerOn` |
| Pointer: Turn Off | `/nextnote/PointerOff` |
| Pointer: Toggle | `/nextnote/PointerToggle` |
| Prompter Text: Show | `/nextnote/PrompterTextShow` |
| Prompter Text: Hide | `/nextnote/PrompterTextHide` |
| Prompter Text: Toggle | `/nextnote/PrompterTextToggle` |
| Scroll: Up | `/nextnote/Up` |
| Scroll: Stop | `/nextnote/Stop` |
| Scroll: Down | `/nextnote/Down` |
| Memory: Recall Slot 1–20 | `/nextnote/speakerlayout1` – `/nextnote/speakerlayout20` |
| Helper: Select by Name | `/nextnote/<HelperName>` |

**Scroll speed:** Pressing Up or Down repeatedly increases speed (1→9). Press Stop to halt scrolling.

**Prompter text:** Show and Hide set visibility explicitly; Toggle reverses it. These actions leave the pointer and scrolling settings unchanged. The Prompter Text preset lights green when NextNote reports visible text. It updates from Display feedback, including changes made in NextNote itself, rather than assuming a command succeeded.

**Memory slots:** Up to 20 named memory slots. Slot names are sent automatically by NextNote and appear as button labels in the Memory preset category.

**Helper selection:** As NextNote sends feedback about available helpers, their names automatically populate the dropdown in the **Select Helper** action and generate preset buttons in the **Helpers** category.

---

## Feedbacks

| Feedback | Condition |
|---|---|
| Pointer: Is Active | Lights up when teleprompter pointer is enabled |
| Prompter Text: Is Visible | Lights up when prompter text is visible |
| Scroll: Is Active | Lights up when scrolling at any speed |
| Scroll: Speed Matches Value | Lights up when scroll speed equals selected value (0–9) |
| Layout: Is Active | Lights up when the selected layout is currently active |
| Memory: Slot Is Active | Lights up when the selected memory slot is currently active |
| Helper: Is Connected | Lights up when the named helper is the active connection |
| Media N: Is Playing | Lights up green when media slot N state is `playing` |
| Media N: Is Paused | Lights up orange when media slot N state is `paused` |
| Media N: Is Ready or Finished | Lights up red when media slot N state is `ready` or `finished` |

---

## Variables

| Variable | Content |
|---|---|
| `$(visionmill-nextnote:scroll_speed)` | Current scroll speed (0–9) |
| `$(visionmill-nextnote:pointer_enabled)` | Pointer state (0 or 1) |
| `$(visionmill-nextnote:prompter_text_visible)` | Text visibility: 0=hidden, 1=visible; initially 0 until feedback arrives |
| `$(visionmill-nextnote:presentation_name)` | Current presentation filename |
| `$(visionmill-nextnote:slide_current)` | Current slide number |
| `$(visionmill-nextnote:slide_total)` | Total number of slides |
| `$(visionmill-nextnote:build_current)` | Current build number within slide |
| `$(visionmill-nextnote:build_total)` | Total builds within slide |
| `$(visionmill-nextnote:connected_helper)` | Name of connected helper machine |
| `$(visionmill-nextnote:current_layout)` | Current layout (above/below/left/right/notes) |
| `$(visionmill-nextnote:memory_slot)` | Active memory slot number (0 = none) |
| `$(visionmill-nextnote:memory1_name)` – `memory20_name` | Name of each memory slot |
| `$(visionmill-nextnote:media1_name)` – `media6_name` | Clip name for media slots 1–6 |
| `$(visionmill-nextnote:media1_state)` – `media6_state` | Playback state: `playing`, `paused`, `ready`, or `finished` |
| `$(visionmill-nextnote:media1_duration)` – `media6_duration` | Total clip duration in seconds |
| `$(visionmill-nextnote:media1_duration_fmt)` – `media6_duration_fmt` | Total clip duration formatted as M:SS |
| `$(visionmill-nextnote:media1_remaining)` – `media6_remaining` | Remaining time in seconds |
| `$(visionmill-nextnote:media1_remaining_fmt)` – `media6_remaining_fmt` | Remaining time formatted as M:SS |

---

## Preset Categories

| Category | Contents |
|---|---|
| **Layout** | One button per layout mode, lights up when active |
| **Slides** | First, Previous, Next, Last, Hide, Show |
| **Prompter** | Scroll Up, Stop, Down, Pointer Toggle, Prompter Text Toggle, Speed display |
| **Info** | Filename, Slide counter, Build counter |
| **Memory** | 20 recall buttons labelled with slot names, lights up when active |
| **Media** | Name, remaining time, and runtime display for up to 6 clips, colour-coded by playback state |
| **Helpers** | Auto-generated button per known helper, lights up when connected |
