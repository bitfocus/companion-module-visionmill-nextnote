import { timerActions } from './speaker-timer.js'
// actions.ts
// All Companion actions mapped to /nextnote/ OSC commands

import type { CompanionActionDefinitions } from '@companion-module/base'
import type { NextNoteInstance } from './main.js'

export function getActions(instance: NextNoteInstance): CompanionActionDefinitions {
	return {
        ...timerActions(instance),
		// MARK: - Layout
		layout_above: {
			name: 'Layout: Slides Above Notes',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Above'),
		},
		layout_side: {
			name: 'Layout: Slides Left, Notes Right',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Left'),
		},
		layout_below: {
			name: 'Layout: Slides Below Notes',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Below'),
		},
		layout_slidesright: {
			name: 'Layout: Notes Left, Slides Right',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Right'),
		},
		layout_notes: {
			name: 'Layout: Notes Only',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Notes'),
		},

		// MARK: - Slide Navigation
		slide_first: {
			name: 'Slide: Go to First',
			options: [],
			callback: () => instance.sendOSC('/nextnote/First'),
		},
		slide_previous: {
			name: 'Slide: Previous',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Previous'),
		},
		slide_next: {
			name: 'Slide: Next',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Next'),
		},
		slide_last: {
			name: 'Slide: Go to Last',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Last'),
		},
		slide_hide: {
			name: 'Slide: Hide (Black Screen)',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Hide'),
		},
		slide_show: {
			name: 'Slide: Show (Restore Screen)',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Show'),
		},

		// MARK: - Teleprompter Pointer
		pointer_on: {
			name: 'Pointer: Turn On',
			options: [],
			callback: () => instance.sendOSC('/nextnote/PointerOn'),
		},
		pointer_off: {
			name: 'Pointer: Turn Off',
			options: [],
			callback: () => instance.sendOSC('/nextnote/PointerOff'),
		},
		pointer_toggle: {
			name: 'Pointer: Toggle',
			options: [],
			callback: () => instance.sendOSC('/nextnote/PointerToggle'),
		},

		// MARK: - Teleprompter Text Visibility
		prompter_text_show: {
			name: 'Prompter Text: Show',
			options: [],
			callback: () => instance.sendOSC('/nextnote/PrompterTextShow'),
		},
		prompter_text_hide: {
			name: 'Prompter Text: Hide',
			options: [],
			callback: () => instance.sendOSC('/nextnote/PrompterTextHide'),
		},
		prompter_text_toggle: {
			name: 'Prompter Text: Toggle',
			options: [],
			callback: () => instance.sendOSC('/nextnote/PrompterTextToggle'),
		},

		// MARK: - Teleprompter Scroll
		scroll_up: {
			name: 'Scroll: Up (press again to increase speed, max speed 9)',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Up'),
		},
		scroll_stop: {
			name: 'Scroll: Stop',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Stop'),
		},
		scroll_down: {
			name: 'Scroll: Down (press again to increase speed, max speed 9)',
			options: [],
			callback: () => instance.sendOSC('/nextnote/Down'),
		},

		// MARK: - Memory Slot Recall
		// Sends /nextnote/speakerlayout1 through speakerlayout20
		...Object.fromEntries(
			Array.from({ length: 20 }, (_, i) => {
				const n = i + 1
				return [
					`speakerlayout${n}`,
					{
						name: `Memory: Recall Slot ${n}`,
						options: [],
						callback: () => instance.sendOSC(`/nextnote/speakerlayout${n}`),
					},
				]
			}),
		),

		// MARK: - Helper Selection
		// Sends /nextnote/<HelperName> — OSCService routes unknown commands as helper names
		select_helper: {
			name: 'Helper: Select by Name',
			options: [
				{
					type: 'dropdown',
					id: 'helperName',
					label: 'Helper Name',
					default: '',
					choices: instance.getHelperChoices(),
					allowCustom: true,
				},
			],
			callback: (action) => {
				const name = action.options['helperName'] as string
				if (name) instance.sendOSC(`/nextnote/${name}`)
			},
		},
	}
}
