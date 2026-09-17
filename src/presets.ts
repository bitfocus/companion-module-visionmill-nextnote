// presets.ts
// Auto-generated preset buttons. Helper presets regenerate when the known helpers list changes.

import { combineRgb } from '@companion-module/base'
import type { NextNoteInstance } from './main.js'

type PresetDefinitions = Record<string, any>
type PresetStructure = Array<{
	id: string
	name: string
	definitions: Array<{
		id: string
		name: string
		type: 'simple'
		presets: string[]
	}>
}>

export function getPresets(instance: NextNoteInstance): { structure: PresetStructure; presets: PresetDefinitions } {
	const presets: PresetDefinitions = {}

	const simplePreset = (
		name: string,
		text: string,
		bgcolor: number,
		actionId?: string,
		feedbacks: any[] = [],
		size = '14',
	) => ({
		type: 'simple',
		name,
		style: { text, size, color: combineRgb(255, 255, 255), bgcolor },
		steps: actionId ? [{ down: [{ actionId, options: {} }], up: [] }] : [],
		feedbacks,
	})

	const layoutFeedback = (layout: string) => [
		{
			feedbackId: 'layout_active',
			options: { layout },
			style: { bgcolor: combineRgb(0, 80, 200), color: combineRgb(255, 255, 255) },
		},
	]

	// MARK: - Layout
	presets.layout_above = simplePreset(
		'Slides Above Notes',
		'Above',
		combineRgb(40, 40, 80),
		'layout_above',
		layoutFeedback('above'),
	)
	presets.layout_side = simplePreset(
		'Slides Left Notes Right',
		'Left',
		combineRgb(40, 40, 80),
		'layout_side',
		layoutFeedback('left'),
	)
	presets.layout_below = simplePreset(
		'Slides Below Notes',
		'Below',
		combineRgb(40, 40, 80),
		'layout_below',
		layoutFeedback('below'),
	)
	presets.layout_slidesright = simplePreset(
		'Notes Left Slides Right',
		'Right',
		combineRgb(40, 40, 80),
		'layout_slidesright',
		layoutFeedback('right'),
	)
	presets.layout_notes = simplePreset(
		'Notes Only',
		'Notes',
		combineRgb(40, 40, 80),
		'layout_notes',
		layoutFeedback('notes'),
	)

	// MARK: - Slide Navigation
	presets.slide_first = simplePreset('First Slide', '|◀', combineRgb(30, 30, 30), 'slide_first', [], '24')
	presets.slide_previous = simplePreset('Previous Slide', '◀', combineRgb(30, 30, 30), 'slide_previous', [], '24')
	presets.slide_next = simplePreset('Next Slide', '▶', combineRgb(30, 30, 30), 'slide_next', [], '24')
	presets.slide_last = simplePreset('Last Slide', '▶|', combineRgb(30, 30, 30), 'slide_last', [], '24')
	presets.slide_hide = simplePreset('Hide Screen', 'HIDE', combineRgb(180, 60, 0), 'slide_hide')
	presets.slide_show = simplePreset('Show Screen', 'SHOW', combineRgb(0, 140, 0), 'slide_show')

	// MARK: - Pointer
	presets.pointer_toggle = simplePreset('Pointer Toggle', 'POINTER', combineRgb(60, 60, 60), 'pointer_toggle', [
		{
			feedbackId: 'pointer_active',
			options: {},
			style: { bgcolor: combineRgb(255, 100, 0), color: combineRgb(255, 255, 255) },
		},
	])

	// MARK: - Prompter Text Visibility
	presets.prompter_text_toggle = simplePreset(
		'Prompter Text Toggle',
		'PROMPTER\nTEXT',
		combineRgb(60, 60, 60),
		'prompter_text_toggle',
		[
			{
				feedbackId: 'prompter_text_visible',
				options: {},
				style: { bgcolor: combineRgb(0, 180, 0), color: combineRgb(255, 255, 255) },
			},
		],
	)

	// MARK: - Scroll
	presets.scroll_up = simplePreset('Scroll Up', '▲\nUP', combineRgb(30, 30, 30), 'scroll_up')
	presets.scroll_stop = simplePreset('Scroll Stop', '■\nSTOP', combineRgb(180, 0, 0), 'scroll_stop', [
		{
			feedbackId: 'scroll_active',
			options: {},
			style: { bgcolor: combineRgb(180, 0, 0), color: combineRgb(255, 255, 255) },
		},
	])
	presets.scroll_down = simplePreset('Scroll Down', '▼\nDOWN', combineRgb(30, 30, 30), 'scroll_down')

	presets.display_speed = {
		type: 'simple',
		name: 'Scroll Speed',
		style: {
			text: 'Speed\n$(visionmill-nextnote:scroll_speed)',
			size: '14',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(20, 60, 20),
		},
		steps: [],
		feedbacks: [
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 1 },
				style: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 2 },
				style: { bgcolor: combineRgb(0, 140, 0), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 3 },
				style: { bgcolor: combineRgb(180, 100, 0), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 4 },
				style: { bgcolor: combineRgb(180, 100, 0), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 5 },
				style: { bgcolor: combineRgb(160, 0, 0), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 6 },
				style: { bgcolor: combineRgb(160, 0, 0), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 7 },
				style: { bgcolor: combineRgb(100, 0, 160), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 8 },
				style: { bgcolor: combineRgb(100, 0, 160), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'scroll_speed_match',
				options: { speed: 9 },
				style: { bgcolor: combineRgb(100, 0, 160), color: combineRgb(255, 255, 255) },
			},
		],
	}

	// MARK: - Info display buttons
	presets.display_presentation = simplePreset(
		'Presentation Name',
		'Filename:\n$(visionmill-nextnote:presentation_name)',
		combineRgb(20, 20, 60),
	)
	presets.display_slide = simplePreset(
		'Current Slide',
		'Slide:\n$(visionmill-nextnote:slide_current)/$(visionmill-nextnote:slide_total)',
		combineRgb(20, 20, 60),
	)
	presets.display_build = simplePreset(
		'Current Build',
		'Build:\n$(visionmill-nextnote:build_current)/$(visionmill-nextnote:build_total)',
		combineRgb(20, 20, 60),
	)

	// MARK: - Memory slot recall presets (slots 1–20)
	const memoryPresetIds: string[] = []
	for (let n = 1; n <= 20; n++) {
		const slotName = instance.state.memorySlotNames[n]
		const presetId = `speakerlayout${n}`
		memoryPresetIds.push(presetId)
		presets[presetId] = {
			type: 'simple',
			name: slotName ? `Memory: ${slotName}` : `Memory: Slot ${n}`,
			style: {
				text: `Memory ${n}\n$(visionmill-nextnote:memory${n}_name)`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(50, 0, 80),
			},
			steps: [{ down: [{ actionId: presetId, options: {} }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'memory_slot_active',
					options: { slot: n },
					style: { bgcolor: combineRgb(120, 0, 200), color: combineRgb(255, 255, 255) },
				},
			],
		}
	}

	// MARK: - Media slot info presets (slots 1–6)
	const mediaBgcolors: [number, number, number][] = [
		[0, 40, 80],
		[50, 0, 80],
		[0, 60, 60],
		[45, 55, 0],
		[70, 0, 30],
		[30, 50, 40],
	]
	const mediaPresetIds: string[] = []
	for (let n = 1; n <= 6; n++) {
		const [r, g, b] = mediaBgcolors[n - 1]
		const nameId = `media${n}_name`
		const timeId = `media${n}_time`
		mediaPresetIds.push(nameId, timeId)
		presets[nameId] = simplePreset(`Media ${n} Name`, `$(visionmill-nextnote:media${n}_name)`, combineRgb(r, g, b))
		presets[timeId] = {
			type: 'simple',
			name: `Media ${n} Time Remaining`,
			style: {
				text: `$(visionmill-nextnote:media${n}_remaining_fmt)\nRT: $(visionmill-nextnote:media${n}_duration_fmt)`,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(r, g, b),
			},
			steps: [],
			feedbacks: [
				{
					feedbackId: `media${n}_state_playing`,
					options: {},
					style: { bgcolor: combineRgb(0, 180, 0), color: combineRgb(255, 255, 255) },
				},
				{
					feedbackId: `media${n}_state_paused`,
					options: {},
					style: { bgcolor: combineRgb(255, 140, 0), color: combineRgb(255, 255, 255) },
				},
				{
					feedbackId: `media${n}_state_inactive`,
					options: {},
					style: { bgcolor: combineRgb(180, 0, 0), color: combineRgb(255, 255, 255) },
				},
			],
		}
	}

	// MARK: - Auto-generated helper selection presets
	const helperPresetIds: string[] = []
	for (const helper of instance.state.knownHelpers) {
		const safeId = helper.replace(/[^a-zA-Z0-9_-]/g, '_')
		const presetId = `helper_${safeId}`
		helperPresetIds.push(presetId)
		presets[presetId] = {
			type: 'simple',
			name: `Connect: ${helper}`,
			style: {
				text: helper,
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(30, 30, 80),
			},
			steps: [{ down: [{ actionId: 'select_helper', options: { helperName: helper } }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'helper_connected',
					options: { helperName: helper },
					style: { bgcolor: combineRgb(0, 100, 255), color: combineRgb(255, 255, 255) },
				},
			],
		}
	}

	const structure: PresetStructure = [
		{
			id: 'main',
			name: 'NextNote',
			definitions: [
				{
					id: 'layout',
					name: 'Layout',
					type: 'simple',
					presets: ['layout_above', 'layout_side', 'layout_below', 'layout_slidesright', 'layout_notes'],
				},
				{
					id: 'slides',
					name: 'Slides',
					type: 'simple',
					presets: ['slide_first', 'slide_previous', 'slide_next', 'slide_last', 'slide_hide', 'slide_show'],
				},
				{
					id: 'prompter',
					name: 'Prompter',
					type: 'simple',
					presets: [
						'pointer_toggle',
						'prompter_text_toggle',
						'scroll_up',
						'scroll_stop',
						'scroll_down',
						'display_speed',
					],
				},
				{
					id: 'info',
					name: 'Info',
					type: 'simple',
					presets: ['display_presentation', 'display_slide', 'display_build'],
				},
				{ id: 'memory', name: 'Memory', type: 'simple', presets: memoryPresetIds },
				{ id: 'media', name: 'Media', type: 'simple', presets: mediaPresetIds },
				...(helperPresetIds.length > 0
					? [{ id: 'helpers', name: 'Helpers', type: 'simple' as const, presets: helperPresetIds }]
					: []),
			],
		},
	]

	return { structure, presets }
}
