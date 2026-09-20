import { timerFeedbacks } from './speaker-timer.js'
// feedbacks.ts
// Companion feedbacks — change button appearance based on NextNote state

import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { NextNoteInstance } from './main.js'

export function getFeedbacks(instance: NextNoteInstance): CompanionFeedbackDefinitions {
	return {
        ...timerFeedbacks(instance),
		pointer_active: {
			type: 'boolean',
			name: 'Pointer: Is Active',
			description: 'Button lights up when the teleprompter pointer is enabled',
			defaultStyle: {
				bgcolor: combineRgb(255, 100, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => instance.state.pointerEnabled,
		},

		prompter_text_visible: {
			type: 'boolean',
			name: 'Prompter Text: Is Visible',
			description: 'Button lights up when NextNote reports that prompter text is visible',
			defaultStyle: {
				bgcolor: combineRgb(0, 180, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => instance.state.prompterTextVisible,
		},

		scroll_active: {
			type: 'boolean',
			name: 'Scroll: Is Active',
			description: 'Button lights up when teleprompter is scrolling at any speed',
			defaultStyle: {
				bgcolor: combineRgb(0, 180, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => instance.state.scrollSpeed > 0,
		},

		scroll_speed_match: {
			type: 'boolean',
			name: 'Scroll: Speed Matches Value',
			description: 'Button lights up when scroll speed matches the selected value',
			defaultStyle: {
				bgcolor: combineRgb(0, 180, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'number',
					id: 'speed',
					label: 'Speed (0=stopped, 1–9)',
					default: 1,
					min: 0,
					max: 9,
				},
			],
			callback: (feedback) => instance.state.scrollSpeed === (feedback.options['speed'] as number),
		},

		layout_active: {
			type: 'boolean',
			name: 'Layout: Is Active',
			description: 'Button lights up when the selected layout is currently active',
			defaultStyle: {
				bgcolor: combineRgb(0, 80, 200),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'layout',
					label: 'Layout',
					default: 'above',
					choices: [
						{ id: 'above', label: 'Slides Above Notes' },
						{ id: 'left', label: 'Slides Left, Notes Right' },
						{ id: 'below', label: 'Slides Below Notes' },
						{ id: 'right', label: 'Notes Left, Slides Right' },
						{ id: 'notes', label: 'Notes Only' },
					],
				},
			],
			callback: (feedback) => instance.state.currentLayout === (feedback.options['layout'] as string),
		},

		memory_slot_active: {
			type: 'boolean',
			name: 'Memory: Slot Is Active',
			description: 'Button lights up when the selected memory slot is currently active',
			defaultStyle: {
				bgcolor: combineRgb(120, 0, 200),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'number',
					id: 'slot',
					label: 'Slot Number (1–20)',
					default: 1,
					min: 1,
					max: 20,
				},
			],
			callback: (feedback) => instance.state.currentMemorySlot === (feedback.options['slot'] as number),
		},

		helper_connected: {
			type: 'boolean',
			name: 'Helper: Is Connected',
			description: 'Button lights up when the named helper is the active connection',
			defaultStyle: {
				bgcolor: combineRgb(0, 100, 255),
				color: combineRgb(255, 255, 255),
			},
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
			callback: (feedback) => instance.state.connectedHelper === (feedback.options['helperName'] as string),
		},

		// MARK: - Media state feedbacks (one set per slot, 1–6)
		// Used by the media time preset to colour-code playback state
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => {
				const n = i + 1
				return [
					[
						`media${n}_state_playing`,
						{
							type: 'boolean' as const,
							name: `Media ${n}: Is Playing`,
							description: `True when media slot ${n} state is 'playing'`,
							defaultStyle: { bgcolor: combineRgb(0, 180, 0), color: combineRgb(255, 255, 255) },
							options: [],
							callback: () => instance.state.mediaStates[n] === 'playing',
						},
					],
					[
						`media${n}_state_paused`,
						{
							type: 'boolean' as const,
							name: `Media ${n}: Is Paused`,
							description: `True when media slot ${n} state is 'paused'`,
							defaultStyle: { bgcolor: combineRgb(255, 140, 0), color: combineRgb(255, 255, 255) },
							options: [],
							callback: () => instance.state.mediaStates[n] === 'paused',
						},
					],
					[
						`media${n}_state_inactive`,
						{
							type: 'boolean' as const,
							name: `Media ${n}: Is Ready or Finished`,
							description: `True when media slot ${n} state is 'ready' or 'finished'`,
							defaultStyle: { bgcolor: combineRgb(180, 0, 0), color: combineRgb(255, 255, 255) },
							options: [],
							callback: () => {
								const s = instance.state.mediaStates[n]
								return s === 'ready' || s === 'finished'
							},
						},
					],
				]
			}).flat(1),
		),
	}
}
