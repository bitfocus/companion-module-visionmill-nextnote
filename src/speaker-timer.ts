import { combineRgb, type CompanionActionDefinitions, type CompanionFeedbackDefinitions, type CompanionVariableDefinitions, type CompanionSimplePresetDefinition, type CompanionPresetGroupSimple } from '@companion-module/base'
import type { NextNoteInstance } from './main.js'

export const timerOutputs = ['presenter', 'next', 'prompter', 'fullscreen', 'web'] as const
const states = ['ready', 'running', 'paused', 'finished', 'overtime']
export interface TimerSnapshot {
 session: string; sequence: number; enabled: boolean; duration: number; remaining: number
 formatted: string; state: string; stage: string; color: string; clock: string; speaker: string
 outputs: Record<string, { enabled: boolean; mode: string }>
 visible?: boolean
 flashing?: boolean
}
export function parseTimerSnapshot(value: unknown): TimerSnapshot | null {
 if (typeof value !== 'string' || value.length > 8192) return null
 try {
  const s = JSON.parse(value) as TimerSnapshot
  if (!s || typeof s.session !== 'string' || !s.session || !Number.isSafeInteger(s.sequence) || s.sequence < 0 ||
   typeof s.enabled !== 'boolean' || !Number.isInteger(s.duration) || s.duration < 1 || s.duration > 359999 ||
   !Number.isInteger(s.remaining) || Math.abs(s.remaining) > 359999 || !states.includes(s.state) ||
   !['green', 'amber', 'red'].includes(s.stage) || typeof s.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(s.color) ||
   (s.visible !== undefined && typeof s.visible !== 'boolean') ||
   (s.flashing !== undefined && typeof s.flashing !== 'boolean') ||
   !['formatted', 'clock', 'speaker'].every(k => typeof s[k as keyof TimerSnapshot] === 'string') ||
   !timerOutputs.every(k => typeof s.outputs?.[k]?.enabled === 'boolean' && ['countdown', 'timeOfDay', 'both'].includes(s.outputs[k].mode))) return null
  return s
 } catch { return null }
}

export class SpeakerTimerCompanion {
 snapshot: TimerSnapshot | null = null
 fresh = false
 private pulseInterval: ReturnType<typeof setInterval> | undefined
 private received = 0
 private retired = new Set<string>()
 private interval: ReturnType<typeof setInterval> | undefined
 constructor(private readonly instance: NextNoteInstance) {}
 start(): void {
  this.stop(); this.snapshot = null; this.retired.clear(); this.publish()
  this.interval = setInterval(() => {
   if (this.fresh && performance.now() - this.received > 2500) { this.fresh = false; this.publish() }
   if (!this.fresh) this.instance.sendOSC('/nextnote/timer/request')
  }, 1000)
  this.pulseInterval = setInterval(() => {
   if (this.fresh && this.snapshot?.enabled && ['running', 'overtime', 'paused'].includes(this.snapshot.state)) this.instance.checkFeedbacks('timer_transport')
  }, 100)
 }
 stop(): void { if (this.pulseInterval) clearInterval(this.pulseInterval); this.pulseInterval = undefined; if (this.interval) clearInterval(this.interval); this.interval = undefined; this.fresh = false }
 receive(value: unknown): void {
  const s = parseTimerSnapshot(value)
  if (!s || this.retired.has(s.session)) return
  if (this.snapshot?.session === s.session && s.sequence <= this.snapshot.sequence) return
  if (this.snapshot && this.snapshot.session !== s.session) this.retired.add(this.snapshot.session)
  this.snapshot = s; this.received = performance.now(); this.fresh = true; this.publish()
 }
 private publish(): void {
  const s = this.fresh ? this.snapshot : null
  const absolute = Math.abs(s?.remaining ?? 0)
  this.instance.setVariableValues({ timer_hours: s ? `${s.remaining < 0 ? '−' : ''}${String(Math.floor(absolute / 3600)).padStart(2, '0')}` : '—',
   timer_minutes: s ? String(Math.floor(absolute / 60) % 60).padStart(2, '0') : '—',
   timer_seconds: s ? String(absolute % 60).padStart(2, '0') : '—', timer_duration: s?.duration ?? '', timer_remaining: s?.remaining ?? '',
   timer_formatted: s?.formatted ?? '—', timer_state: s?.state ?? 'unavailable', timer_stage: s?.stage ?? 'unknown',
   timer_speaker: s?.speaker ?? '', timer_clock: s?.clock ?? '', timer_fresh: s ? 1 : 0, timer_enabled: s?.enabled ? 1 : 0, timer_flashing: s?.flashing ? 1 : 0 })
  this.instance.checkFeedbacks('timer_colour', 'timer_state', 'timer_output', 'timer_stale', 'timer_flashing', 'timer_visible', 'timer_transport')
 }
}

export const timerVariables: CompanionVariableDefinitions = Object.fromEntries(
 ['hours', 'minutes', 'seconds', 'duration', 'remaining', 'formatted', 'state', 'stage', 'speaker', 'clock', 'fresh', 'enabled', 'flashing'].map(id => [`timer_${id}`, { name: `Speaker timer: ${id}` }]),
)

export function parseTimerDuration(value: unknown): number | null {
 if (typeof value !== 'string' && typeof value !== 'number') return null
 const text = String(value).trim()
 let seconds: number
 if (/^\d+$/.test(text)) seconds = Number(text)
 else {
  const parts = text.split(':')
  if (parts.length < 2 || parts.length > 3 || !parts.every(p => /^\d{1,2}$/.test(p))) return null
  const numbers = parts.map(Number)
  if (numbers.at(-1)! >= 60 || (numbers.length === 3 && numbers[1] >= 60)) return null
  seconds = numbers.reduce((total, part) => total * 60 + part, 0)
 }
 return Number.isSafeInteger(seconds) && seconds >= 1 && seconds <= 359999 ? seconds : null
}

export function timerActions(instance: NextNoteInstance): CompanionActionDefinitions {
 const actions: CompanionActionDefinitions = {}
 for (const action of ['start', 'pause', 'resume', 'toggle', 'reset', 'undo', 'flash-toggle', 'visibility-toggle']) actions[`timer_${action}`] = {
  name: `Speaker timer: ${action}`, options: [], callback: () => instance.sendOSC(`/nextnote/timer/${action}`),
 }
 for (const action of ['set', 'set-start', 'adjust']) actions[`timer_${action}`] = {
  name: `Speaker timer: ${action === 'set-start' ? 'set duration and start' : action === 'set' ? 'set duration (ready)' : 'adjust time'}`,
  options: action === 'adjust'
   ? [{ type: 'number', id: 'seconds', label: 'Seconds to add (negative subtracts)', default: 30, min: -359999, max: 359999 }]
   : [{ type: 'textinput', id: 'seconds', label: 'Duration (H:MM:SS or MM:SS)', default: '0:15:00' }],
  callback: event => { const n = action === 'adjust' ? Number(event.options.seconds) : parseTimerDuration(event.options.seconds); if (n !== null && Number.isInteger(n) && n >= (action === 'adjust' ? -359999 : 1) && n <= 359999) instance.sendOSC(`/nextnote/timer/${action}/${n}`) },
 }
 actions.timer_enable = { name: 'Speaker timer: enable or disable', options: [{ type: 'checkbox', id: 'enabled', label: 'Enabled', default: true }], callback: event => instance.sendOSC(`/nextnote/timer/enable/${event.options.enabled ? 1 : 0}`) }
 actions.timer_flash = { name: 'Speaker timer: flash on or off', options: [{ type: 'checkbox', id: 'enabled', label: 'Flashing', default: true }], callback: event => instance.sendOSC(`/nextnote/timer/flash/${event.options.enabled ? 1 : 0}`) }
 const outputOption = { type: 'dropdown' as const, id: 'output', label: 'Output', default: 'presenter', choices: timerOutputs.map(id => ({ id, label: id })) }
 actions.timer_visibility = { name: 'Speaker timer: output visibility (does not open a window)', options: [outputOption, { type: 'checkbox', id: 'visible', label: 'Visible', default: true }], callback: event => { const output = String(event.options.output); if (timerOutputs.includes(output as typeof timerOutputs[number])) instance.sendOSC(`/nextnote/timer/visibility/${output}/${event.options.visible ? 1 : 0}`) } }
 actions.timer_mode = { name: 'Speaker timer: output display mode', options: [{ ...outputOption, choices: outputOption.choices.filter(choice => choice.id !== 'web' && choice.id !== 'fullscreen') }, { type: 'dropdown', id: 'mode', label: 'Mode', default: 'countdown', choices: ['countdown', 'timeOfDay', 'both'].map(id => ({ id, label: id })) }], callback: event => {
  const output = String(event.options.output), mode = String(event.options.mode)
  if (output !== 'web' && output !== 'fullscreen' && timerOutputs.includes(output as typeof timerOutputs[number]) && ['countdown', 'timeOfDay', 'both'].includes(mode)) instance.sendOSC(`/nextnote/timer/mode/${output}/${mode}`)
 } }
 return actions
}

// Fixed transport labels with a gentle brightness pulse only for the confirmed active state.
export function timerTransportColour(snapshot: TimerSnapshot | null, fresh: boolean, control: string, now = performance.now()): number {
 const active = fresh && snapshot?.enabled && (control === 'start' ? ['running', 'overtime'].includes(snapshot.state) : snapshot.state === 'paused')
 if (!fresh || !snapshot?.enabled) return 0x475569
 const base = control === 'start' ? [21, 100, 48] : [154, 65, 8]
 const light = control === 'start' ? [34, 170, 80] : [234, 130, 35]
 const pulse = active ? (1 + Math.cos(now / 1000 * 2 * Math.PI)) / 2 : 0
 return combineRgb(...base.map((channel, index) => Math.round(channel + (light[index] - channel) * pulse)) as [number, number, number])
}

export function timerFeedbacks(instance: NextNoteInstance): CompanionFeedbackDefinitions {
 const timer = instance.speakerTimer
 return {
  timer_transport: { type: 'advanced', name: 'Speaker timer: pulsing transport state', options: [{ type: 'dropdown', id: 'control', label: 'Button', default: 'start', choices: [{ id: 'start', label: 'Start' }, { id: 'pause', label: 'Pause' }] }], callback: event => ({ bgcolor: timerTransportColour(timer.snapshot, timer.fresh, String(event.options.control)) }) },
  timer_visible: { type: 'boolean', name: 'Speaker timer: globally visible', defaultStyle: { bgcolor: 0x15803d }, options: [], callback: () => timer.fresh && timer.snapshot?.enabled === true && timer.snapshot.visible !== false },
  timer_flashing: { type: 'boolean', name: 'Speaker timer: flashing', defaultStyle: { bgcolor: combineRgb(126, 34, 206) }, options: [], callback: () => timer.fresh && timer.snapshot?.flashing === true },
  timer_colour: { type: 'advanced', name: 'Speaker timer: live warning colour', options: [], callback: () => ({ color: timer.fresh && timer.snapshot?.enabled ? parseInt(timer.snapshot.color.slice(1), 16) : combineRgb(140, 140, 140), bgcolor: combineRgb(10, 10, 10) }) },
  timer_stale: { type: 'boolean', name: 'Speaker timer: feedback unavailable', defaultStyle: { bgcolor: combineRgb(100, 60, 0) }, options: [], callback: () => !timer.fresh },
  timer_state: { type: 'boolean', name: 'Speaker timer: playback state', defaultStyle: { bgcolor: combineRgb(0, 100, 60) }, options: [{ type: 'dropdown', id: 'state', label: 'State', default: 'running', choices: states.map(id => ({ id, label: id })) }], callback: event => timer.fresh && timer.snapshot?.enabled === true && timer.snapshot?.state === event.options.state },
  timer_output: { type: 'boolean', name: 'Speaker timer: output visible', defaultStyle: { bgcolor: combineRgb(0, 100, 60) }, options: [{ type: 'dropdown', id: 'output', label: 'Output', default: 'presenter', choices: timerOutputs.map(id => ({ id, label: id })) }], callback: event => timer.fresh && timer.snapshot?.enabled === true && timer.snapshot?.outputs[String(event.options.output)]?.enabled === true },
 }
}

const timerAdjustments = [-300, -60, -30, 30, 60, 300]
const timerDurations = [300, 600, 900, 1200, 1800, 3600]
// Stable preset ids keep existing buttons usable. Grouping only changes the preset browser.
export const timerPresetGroups: CompanionPresetGroupSimple[] = [
 { id: 'speaker_timer', name: 'Speaker Timer — Controls', type: 'simple', presets: [
  'timer_reset', 'timer_flash', 'timer_visibility_toggle', 'timer_pause', 'timer_start', ...timerAdjustments.map(n => `timer_adjust_${n}`),
  'timer_set_custom', 'timer_undo',
 ] },
 { id: 'speaker_timer_durations', name: 'Speaker Timer — Durations', type: 'simple', presets: timerDurations.map(n => `timer_set_${n}`) },
 { id: 'speaker_timer_displays', name: 'Speaker Timer — Info', type: 'simple', presets: ['timer_countdown', 'timer_hours', 'timer_minutes', 'timer_seconds'] },
]

export function timerPresets(): Record<string, CompanionSimplePresetDefinition> {
 const presets: Record<string, CompanionSimplePresetDefinition> = {}
 const add = (id: string, text: string, actionId?: string, options: Record<string, string | number | boolean> = {}, bgcolor = 0x475569) => {
  const preset: CompanionSimplePresetDefinition = { type: 'simple', name: `Speaker timer ${text.replaceAll('\n', ' ')}`, keywords: ['timer', 'clock'],
   style: { text, size: '14', color: 0xffffff, bgcolor }, steps: actionId ? [{ down: [{ actionId, options }], up: [] }] : [],
   feedbacks: [{ feedbackId: 'timer_stale', options: {}, style: { bgcolor: 0x475569 } }] }
  presets[id] = preset
  return preset
 }
 add('timer_reset', 'Reset', 'timer_reset', {}, 0xdc2626)
 add('timer_flash', 'Flash', 'timer_flash-toggle').feedbacks.unshift({ feedbackId: 'timer_flashing', options: {}, style: { text: 'Flash\nON', bgcolor: 0x7e22ce } })
 for (const control of ['start', 'pause']) add(`timer_${control}`, control === 'start' ? 'Start' : 'Pause', `timer_${control}`).feedbacks.unshift({ feedbackId: 'timer_transport', options: { control } })
 for (const seconds of timerAdjustments) {
  const amount = Math.abs(seconds) < 60 ? '30s' : `${Math.abs(seconds) / 60}m`
  add(`timer_adjust_${seconds}`, `${seconds < 0 ? '−' : '+'}${amount}`, 'timer_adjust', { seconds }, 0x2563eb)
 }
 const custom = add('timer_set_custom', 'Set\nTimer', 'timer_set', { seconds: '0:15:00' }, 0x2563eb)
 custom.name = 'Speaker timer Set Timer — edit H:MM:SS or MM:SS in the button action (default 15 minutes)'
 custom.steps[0].down[0].headline = 'Enter H:MM:SS or MM:SS; loads ready for Start.'
 for (const seconds of timerDurations) add(`timer_set_${seconds}`, `Set\n${seconds / 60}m`, 'timer_set', { seconds: `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:00` }, 0x2563eb)
 add('timer_undo', 'Undo\nAdjust', 'timer_undo')
 add('timer_visibility_toggle', 'Show Timer', 'timer_visibility-toggle', {}, 0xdc2626).feedbacks.unshift({ feedbackId: 'timer_visible', options: {}, style: { text: 'Hide Timer', bgcolor: 0x475569 } })
 add('timer_countdown', '$(visionmill-nextnote:timer_speaker)\n$(visionmill-nextnote:timer_formatted)\n$(visionmill-nextnote:timer_state)').feedbacks = [{ feedbackId: 'timer_colour', options: {} }]
 for (const unit of ['hours', 'minutes', 'seconds']) {
  const preset = add(`timer_${unit}`, `$(visionmill-nextnote:timer_${unit})`)
  preset.name = `Speaker timer ${unit}`
  preset.style.size = 'auto'
  preset.feedbacks = [{ feedbackId: 'timer_colour', options: {} }]
 }
 return presets
}
