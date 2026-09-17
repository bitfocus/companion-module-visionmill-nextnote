// variables.ts
// Variables exposed to Companion — usable in button text via $(visionmill-nextnote:variable_id)

import type { CompanionVariableDefinitions } from '@companion-module/base'

export function getVariableDefinitions(): CompanionVariableDefinitions {
	return {
		scroll_speed: { name: 'Scroll Speed (0=stopped, 1–9)' },
		pointer_enabled: { name: 'Pointer Enabled (0 or 1)' },
		prompter_text_visible: { name: 'Prompter Text Visible (0=hidden, 1=visible; 0 until first feedback)' },
		presentation_name: { name: 'Presentation Name' },
		slide_current: { name: 'Current Slide Number' },
		slide_total: { name: 'Total Slide Count' },
		connected_helper: { name: 'Connected Helper Name' },
		memory_slot: { name: 'Active Memory Slot (0=none, 1–20)' },
		current_layout: { name: 'Current Layout (above/below/left/right/notes)' },
		build_current: { name: 'Current Build Number' },
		build_total: { name: 'Total Build Count' },
		...Object.fromEntries(
			Array.from({ length: 20 }, (_, i) => [`memory${i + 1}_name`, { name: `Memory Slot ${i + 1} Name` }]),
		),
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => [`media${i + 1}_name`, { name: `Media ${i + 1} Clip Name` }]),
		),
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => [
				`media${i + 1}_state`,
				{ name: `Media ${i + 1} State (playing/paused/stopped)` },
			]),
		),
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => [
				`media${i + 1}_duration`,
				{ name: `Media ${i + 1} Total Duration (seconds)` },
			]),
		),
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => [
				`media${i + 1}_duration_fmt`,
				{ name: `Media ${i + 1} Total Duration (M:SS)` },
			]),
		),
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => [
				`media${i + 1}_remaining`,
				{ name: `Media ${i + 1} Remaining Time (seconds)` },
			]),
		),
		...Object.fromEntries(
			Array.from({ length: 6 }, (_, i) => [
				`media${i + 1}_remaining_fmt`,
				{ name: `Media ${i + 1} Remaining Time (M:SS)` },
			]),
		),
	}
}
