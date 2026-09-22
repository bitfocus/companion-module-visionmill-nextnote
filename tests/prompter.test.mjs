/* eslint-disable n/no-missing-import, n/no-unpublished-import */
import assert from 'node:assert/strict'
import dgram from 'node:dgram'
import { once } from 'node:events'
import fs from 'node:fs'
import test from 'node:test'
import { NextNoteInstance } from '../dist/main.js'
/* eslint-enable n/no-missing-import, n/no-unpublished-import */

globalThis.COMPANION_LOGGER = () => {}

async function fixture() {
	const variables = {}
	const definitions = {}
	const checks = []
	const instance = new NextNoteInstance({
		id: 'owned-test',
		label: 'Owned test',
		_isInstanceContext: true,
		setVariableValues: (values) => Object.assign(variables, values),
		setVariableDefinitions: (values) => {
			definitions.variables = values
		},
		setFeedbackDefinitions: (values) => {
			definitions.feedbacks = values
		},
		setActionDefinitions: (values) => {
			definitions.actions = values
		},
		setPresetDefinitions: (structure, presets) => {
			definitions.structure = structure
			definitions.presets = presets
		},
		updateStatus() {},
		checkFeedbacks: (ids) => checks.push(...ids),
	})
	instance.startFeedbackListener = () => {}
	instance.requestStateFromNextNote = () => {}
	await instance.init({ targetHost: '127.0.0.1', targetPort: 1, feedbackPort: 1 })
	return { instance, variables, definitions, checks }
}

function oscString(value) {
	const bytes = Buffer.from(value, 'utf8')
	const padded = Buffer.alloc(Math.ceil((bytes.length + 1) / 4) * 4)
	bytes.copy(padded)
	return padded
}

function feedback(value, tag = ',i') {
	const argument = tag === ',s' ? oscString(value) : Buffer.alloc(4)
	if (tag === ',i') argument.writeInt32BE(value)
	return Buffer.concat([oscString('/nextnote/feedback/prompter_text'), oscString(tag), argument])
}

test('Show, Hide and Toggle send actual OSC datagrams without changing feedback optimistically', async () => {
	const { instance, variables, definitions } = await fixture()
	const receiver = dgram.createSocket('udp4')
	try {
		receiver.bind(0, '127.0.0.1')
		await once(receiver, 'listening')
		instance.config.targetPort = receiver.address().port
		const packets = {}
		for (const [action, command] of [
			['prompter_text_show', 'PrompterTextShow'],
			['prompter_text_hide', 'PrompterTextHide'],
			['prompter_text_toggle', 'PrompterTextToggle'],
		]) {
			const received = once(receiver, 'message', { signal: AbortSignal.timeout(2000) })
			await definitions.actions[action].callback({ options: {} })
			const [packet] = await received
			assert.deepEqual(packet, Buffer.concat([oscString(`/nextnote/${command}`), oscString(',')]))
			packets[command] = packet.toString('base64')
			assert.equal(variables.prompter_text_visible, 0)
		}
		if (process.env.NEXTNOTE_COMMAND_CAPTURE)
			fs.writeFileSync(process.env.NEXTNOTE_COMMAND_CAPTURE, JSON.stringify(packets, null, 2) + '\n')
	} finally {
		receiver.close()
		await instance.destroy()
	}
})

test('Visibility feedback updates the variable and button independently of pointer and scroll', async () => {
	const { instance, variables, definitions, checks } = await fixture()
	try {
		assert.ok(definitions.variables.prompter_text_visible)
		instance.state.pointerEnabled = true
		instance.state.scrollSpeed = 4
		for (const value of [1, 1, 0, 0, 1]) {
			instance.handleOSCMessage(feedback(value))
			assert.equal(variables.prompter_text_visible, value)
			assert.equal(definitions.feedbacks.prompter_text_visible.callback(), value === 1)
			assert.equal(checks.at(-1), 'prompter_text_visible')
			assert.equal(instance.state.pointerEnabled, true)
			assert.equal(instance.state.scrollSpeed, 4)
		}
		for (const packet of [feedback(2), feedback(-1), feedback('0', ',s'), Buffer.from('invalid')]) {
			instance.handleOSCMessage(packet)
			assert.equal(variables.prompter_text_visible, 1)
			assert.equal(definitions.feedbacks.prompter_text_visible.callback(), true)
		}
		const { structure, presets } = definitions
		assert.ok(
			structure
				.flatMap((group) => group.definitions)
				.find((group) => group.id === 'prompter')
				.presets.includes('prompter_text_toggle'),
		)
		assert.equal(presets.prompter_text_toggle.steps[0].down[0].actionId, 'prompter_text_toggle')
		assert.equal(presets.prompter_text_toggle.feedbacks[0].feedbackId, 'prompter_text_visible')
	} finally {
		await instance.destroy()
	}
})
