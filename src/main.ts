import { SpeakerTimerCompanion } from './speaker-timer.js'
// main.ts
// NextNote Display — Bitfocus Companion Module
// Controls NextNote Display via OSC over UDP.
// Sends commands to the configured target port, receives feedback on the feedback port.

import {
	InstanceBase,
	InstanceStatus,
	type CompanionActionSchema,
	type CompanionFeedbackSchema,
	type CompanionOptionValues,
	type SomeCompanionConfigField,
	type CompanionVariableValues,
	type DropdownChoice,
	type InstanceTypes,
	type JsonObject,
} from '@companion-module/base'
import dgram from 'node:dgram'
import { getConfigFields, type NextNoteConfig } from './config.js'
import { getActions } from './actions.js'
import { getFeedbacks } from './feedbacks.js'
import { getPresets } from './presets.js'
import { getVariableDefinitions } from './variables.js'

// Internal state mirrored from NextNote feedback messages
export interface NextNoteState {
	scrollSpeed: number
	pointerEnabled: boolean
	prompterTextVisible: boolean
	presentationName: string
	slideCurrentNumber: number
	slideTotalCount: number
	connectedHelper: string
	knownHelpers: string[]
	currentMemorySlot: number // 0 = none active, 1–20 = active slot
	currentLayout: string // 'above' | 'side' | 'notes'
	memorySlotNames: Record<number, string> // slot id → name ('': unoccupied)
	mediaStates: Record<number, string> // slot id → 'playing' | 'paused' | 'stopped' | ''
}

type OSCArg = string | number

type NextNoteVariables = CompanionVariableValues

interface NextNoteInstanceTypes extends InstanceTypes {
	config: NextNoteConfig & JsonObject
	secrets: undefined
	actions: Record<string, CompanionActionSchema<CompanionOptionValues>>
	feedbacks: Record<string, CompanionFeedbackSchema<CompanionOptionValues>>
	variables: NextNoteVariables
}

export class NextNoteInstance extends InstanceBase<NextNoteInstanceTypes> {
	config!: NextNoteConfig
	readonly speakerTimer = new SpeakerTimerCompanion(this)

	state: NextNoteState = {
		scrollSpeed: 0,
		pointerEnabled: false,
		prompterTextVisible: false,
		presentationName: '',
		slideCurrentNumber: 0,
		slideTotalCount: 0,
		connectedHelper: '',
		knownHelpers: [],
		currentMemorySlot: 0,
		currentLayout: 'above',
		memorySlotNames: {},
		mediaStates: {},
	}

	private feedbackSocket: dgram.Socket | null = null

	// MARK: - Lifecycle

	async init(config: NextNoteConfig & JsonObject): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		this.setVariableDefinitions(getVariableDefinitions())
		this.setActionDefinitions(getActions(this))
		this.setFeedbackDefinitions(getFeedbacks(this))
		this.setPresetDefinitionsForApi2()
		this.initVariableValues()

		this.startFeedbackListener()
		this.speakerTimer.start()
		this.updateStatus(InstanceStatus.Ok)

		// Request full state from NextNote after a short delay to allow UDP bind to complete
		// 3000ms gives the UDP socket time to fully bind before Swift responds
		setTimeout(() => this.requestStateFromNextNote(), 3000)
	}
	async destroy(): Promise<void> {
		this.speakerTimer.stop()
		this.stopFeedbackListener()
	}

	async configUpdated(config: NextNoteConfig & JsonObject): Promise<void> {
		this.config = config
		this.stopFeedbackListener()
		this.startFeedbackListener()
		this.speakerTimer.start()
		setTimeout(() => this.requestStateFromNextNote(), 3000)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	// MARK: - State Request

	/**
	 * Send a RequestState command to NextNote — triggers sendFullFeedback on the Swift side.
	 * Called on init and config update so variables and presets are always current.
	 */
	private requestStateFromNextNote(): void {
		this.sendOSC('/nextnote/RequestState')
		this.sendOSC('/nextnote/timer/request')
		this.log('info', 'Sent RequestState to NextNote Display')
	}

	// MARK: - OSC Send

	/**
	 * Send a no-argument OSC message to NextNote Display via UDP.
	 * Uses a hand-rolled minimal OSC encoder — no external dependency needed.
	 */
	sendOSC(address: string): void {
		try {
			const packet = encodeOSCMessage(address)
			const socket = dgram.createSocket('udp4')
			socket.send(packet, this.config.targetPort, this.config.targetHost, (err) => {
				socket.close()
				if (err) this.log('error', `OSC send failed: ${err.message}`)
			})
		} catch (err) {
			this.log('error', `OSC encode failed: ${String(err)}`)
		}
	}

	// MARK: - Feedback UDP Listener

	private startFeedbackListener(): void {
		const port = this.config.feedbackPort ?? 9000
		try {
			const socket = dgram.createSocket('udp4')
			socket.on('message', (msg) => this.handleOSCMessage(msg))
			socket.on('error', (err) => {
				this.log('error', `Feedback socket error: ${err.message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
			})
			socket.bind(port, () => {
				this.log('info', `OSC feedback listener on UDP port ${port}`)
				this.updateStatus(InstanceStatus.Ok)
			})
			this.feedbackSocket = socket
		} catch (err) {
			this.log('error', `Failed to bind feedback port ${port}: ${String(err)}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, `Cannot bind port ${port}`)
		}
	}

	private stopFeedbackListener(): void {
		if (this.feedbackSocket) {
			try {
				this.feedbackSocket.close()
			} catch {
				// ignore close errors
			}
			this.feedbackSocket = null
		}
	}

	// MARK: - OSC Receive

	private handleOSCMessage(buf: Buffer): void {
		try {
			const { address, args } = decodeOSCMessage(buf)
			this.applyFeedback(address, args)
		} catch {
			// Malformed packet — ignore
		}
	}

	private applyFeedback(address: string, args: OSCArg[]): void {
		const value = args[0]
		if (address === '/nextnote/feedback/timer') {
			this.speakerTimer.receive(value)
			return
		}

		switch (address) {
			case '/nextnote/feedback/speed': {
				const speed = typeof value === 'number' ? Math.round(value) : 0
				this.state.scrollSpeed = speed
				this.setVariableValues({ scroll_speed: speed })
				this.checkFeedbacks('scroll_active', 'scroll_speed_match')
				break
			}
			case '/nextnote/feedback/pointer': {
				const enabled = typeof value === 'number' ? value !== 0 : false
				this.state.pointerEnabled = enabled
				this.setVariableValues({ pointer_enabled: enabled ? 1 : 0 })
				this.checkFeedbacks('pointer_active')
				break
			}
			case '/nextnote/feedback/prompter_text': {
				if (value !== 0 && value !== 1) break
				this.state.prompterTextVisible = value === 1
				this.setVariableValues({ prompter_text_visible: value })
				this.checkFeedbacks('prompter_text_visible')
				break
			}
			case '/nextnote/feedback/presentation': {
				const name = typeof value === 'string' ? value : ''
				this.state.presentationName = name
				this.setVariableValues({ presentation_name: name })
				break
			}
			case '/nextnote/feedback/slide': {
				const num = typeof value === 'number' ? Math.round(value) : 0
				this.state.slideCurrentNumber = num
				this.setVariableValues({ slide_current: num })
				break
			}
			case '/nextnote/feedback/slides_total': {
				const total = typeof value === 'number' ? Math.round(value) : 0
				this.state.slideTotalCount = total
				this.setVariableValues({ slide_total: total })
				break
			}
			case '/nextnote/feedback/helper': {
				const name = typeof value === 'string' ? value : ''
				this.state.connectedHelper = name

				// Add to known helpers if new — regenerates presets and dropdowns
				if (name && !this.state.knownHelpers.includes(name)) {
					this.state.knownHelpers = [...this.state.knownHelpers, name].sort()
					this.setPresetDefinitionsForApi2()
					this.setActionDefinitions(getActions(this))
					this.setFeedbackDefinitions(getFeedbacks(this))
				}

				this.setVariableValues({ connected_helper: name })
				this.checkFeedbacks('helper_connected')
				break
			}
			case '/nextnote/feedback/layout': {
				const layout = typeof value === 'string' ? value : 'above'
				this.state.currentLayout = layout
				this.setVariableValues({ current_layout: layout })
				this.checkFeedbacks('layout_active')
				break
			}
			case '/nextnote/feedback/memory_slot': {
				const slot = typeof value === 'number' ? Math.round(value) : 0
				this.state.currentMemorySlot = slot
				this.setVariableValues({ memory_slot: slot })
				this.checkFeedbacks('memory_slot_active')
				break
			}
			case '/nextnote/feedback/build_current': {
				const current = typeof value === 'number' ? Math.round(value) : 0
				this.setVariableValues({ build_current: current })
				break
			}
			case '/nextnote/feedback/build_total': {
				const total = typeof value === 'number' ? Math.round(value) : 0
				this.setVariableValues({ build_total: total })
				break
			}
			case '/nextnote/feedback/helper_available': {
				// Broadcast from Swift when availableHelpers changes — populates dropdowns
				const name = typeof value === 'string' ? value : ''
				if (name && !this.state.knownHelpers.includes(name)) {
					this.state.knownHelpers = [...this.state.knownHelpers, name].sort()
					this.setPresetDefinitionsForApi2()
					this.setActionDefinitions(getActions(this))
					this.setFeedbackDefinitions(getFeedbacks(this))
				}
				break
			}
			// Individual memory name paths: /nextnote/feedback/memory1_name … memory20_name
			// Media field paths: /nextnote/feedback/mediaN_name/state/duration/remaining
			default: {
				const memoryMatch = address.match(/^\/nextnote\/feedback\/memory(\d+)_name$/)
				if (memoryMatch) {
					const slotID = parseInt(memoryMatch[1], 10)
					if (slotID >= 1 && slotID <= 20) {
						const name = typeof value === 'string' ? value : ''
						this.state.memorySlotNames[slotID] = name
						this.setVariableValues({
							[`memory${slotID}_name`]: name || `Slot ${slotID}`,
						})
					}
					break
				}
				const mediaMatch = address.match(/^\/nextnote\/feedback\/media(\d+)_(name|state|duration|remaining)$/)
				if (mediaMatch) {
					const mediaID = parseInt(mediaMatch[1], 10)
					const field = mediaMatch[2]
					if (mediaID >= 1 && mediaID <= 6) {
						if (field === 'duration' || field === 'remaining') {
							const secs = typeof value === 'number' ? Math.round(value) : 0
							const fmt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
							this.setVariableValues({
								[`media${mediaID}_${field}`]: secs,
								[`media${mediaID}_${field}_fmt`]: fmt,
							})
						} else {
							const strVal = typeof value === 'string' ? value : ''
							this.setVariableValues({ [`media${mediaID}_${field}`]: strVal })
							// Mirror state into instance.state so feedback callbacks can read it
							if (field === 'state') {
								this.state.mediaStates[mediaID] = strVal
							}
						}
						// Trigger state feedbacks when state field updates
						if (field === 'state') {
							this.checkFeedbacks(
								`media${mediaID}_state_playing`,
								`media${mediaID}_state_paused`,
								`media${mediaID}_state_inactive`,
							)
						}
					}
					break
				}
			}
		}
	}

	// MARK: - Helpers

	getHelperChoices(): DropdownChoice[] {
		return this.state.knownHelpers.map((name) => ({ id: name, label: name }))
	}

	private setPresetDefinitionsForApi2(): void {
		const { structure, presets } = getPresets(this)
		this.setPresetDefinitions(structure, presets)
	}

	private initVariableValues(): void {
		const values: CompanionVariableValues = {
			scroll_speed: 0,
			pointer_enabled: 0,
			prompter_text_visible: 0,
			presentation_name: '',
			slide_current: 0,
			slide_total: 0,
			connected_helper: '',
			memory_slot: 0,
			current_layout: 'above',
			...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`memory${i + 1}_name`, `Slot ${i + 1}`])),
			...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`media${i + 1}_name`, ''])),
			...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`media${i + 1}_state`, 'stopped'])),
			...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`media${i + 1}_duration`, 0])),
			...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`media${i + 1}_duration_fmt`, '0:00'])),
			...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`media${i + 1}_remaining`, 0])),
			...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`media${i + 1}_remaining_fmt`, '0:00'])),
		}
		this.setVariableValues(values)
	}
}

export default NextNoteInstance

// MARK: - Minimal OSC codec (no external dependency)

/**
 * Encode a no-argument OSC message into a Buffer.
 * Address is null-terminated and padded to 4-byte boundary.
 */
function encodeOSCMessage(address: string): Buffer {
	const padTo4 = (n: number): number => Math.ceil(n / 4) * 4

	const addrBytes = Buffer.from(address + '\0', 'utf8')
	const addrPadded = Buffer.alloc(padTo4(addrBytes.length))
	addrBytes.copy(addrPadded)

	const typeTag = Buffer.from(',\0\0\0', 'utf8')

	return Buffer.concat([addrPadded, typeTag])
}

/**
 * Decode an OSC message from a Buffer.
 * Supports int32 ('i'), float32 ('f'), and string ('s') argument types.
 */
function decodeOSCMessage(buf: Buffer): { address: string; args: OSCArg[] } {
	if (buf.length < 8) throw new Error('Packet too short')

	let offset = 0

	const addrEnd = buf.indexOf(0, offset)
	if (addrEnd < 0) throw new Error('No address terminator')
	const address = buf.subarray(offset, addrEnd).toString('utf8')
	offset = Math.ceil((addrEnd + 1) / 4) * 4

	const tagEnd = buf.indexOf(0, offset)
	if (tagEnd < 0) return { address, args: [] }
	const typeTag = buf.subarray(offset + 1, tagEnd).toString('utf8')
	offset = Math.ceil((tagEnd + 1) / 4) * 4

	const args: OSCArg[] = []
	for (const type of typeTag) {
		if (offset >= buf.length) break
		switch (type) {
			case 'i':
				args.push(buf.readInt32BE(offset))
				offset += 4
				break
			case 'f':
				args.push(buf.readFloatBE(offset))
				offset += 4
				break
			case 's': {
				const end = buf.indexOf(0, offset)
				if (end < 0) break
				args.push(buf.subarray(offset, end).toString('utf8'))
				offset = Math.ceil((end + 1) / 4) * 4
				break
			}
		}
	}

	return { address, args }
}
