import test from 'node:test'
import assert from 'node:assert/strict'
import { SpeakerTimerCompanion, parseTimerSnapshot, timerActions, timerFeedbacks, timerOutputs, timerPresets, timerPresetGroups, timerTransportColour } from '../dist/speaker-timer.js'
import { getPresets } from '../dist/presets.js'

function snapshot(sequence = 1, session = 'show-a') {
 return { session, sequence, enabled: true, duration: 900, remaining: -30, formatted: '−00:30', state: 'overtime', stage: 'red', color: '#EF4444', clock: '19:30:00', speaker: 'Clare', outputs: Object.fromEntries(timerOutputs.map(k => [k, { enabled: true, mode: 'countdown' }])) }
}
test('timer feedback validates the complete native contract', () => {
 assert.deepEqual(parseTimerSnapshot(JSON.stringify(snapshot())), snapshot())
 for (const invalid of [null, '{', JSON.stringify({ ...snapshot(), duration: 0 }), JSON.stringify({ ...snapshot(), remaining: NaN }), JSON.stringify({ ...snapshot(), outputs: {} }), JSON.stringify({ ...snapshot(), color: 'red' })]) assert.equal(parseTimerSnapshot(invalid), null)
})
test('reordered feedback and retired app sessions cannot roll state back', () => {
 const values = []; const instance = { setVariableValues: v => values.push(v), checkFeedbacks() {}, sendOSC() {} }
 const timer = new SpeakerTimerCompanion(instance)
 timer.receive(JSON.stringify(snapshot(2)))
 timer.receive(JSON.stringify(snapshot(1)))
 assert.equal(timer.snapshot.sequence, 2)
 timer.receive(JSON.stringify(snapshot(1, 'show-b')))
 timer.receive(JSON.stringify(snapshot(3)))
 assert.equal(timer.snapshot.session, 'show-b')
 assert.equal(values.at(-1).timer_remaining, -30)
 assert.equal(values.at(-1).timer_fresh, 1)
})
test('stale feedback clears live values and requests authoritative state', t => {
 const values = [], commands = []; let now = 0
 t.mock.method(performance, 'now', () => now)
 t.mock.timers.enable({ apis: ['setInterval'] })
 const timer = new SpeakerTimerCompanion({ setVariableValues: v => values.push(v), checkFeedbacks() {}, sendOSC: c => commands.push(c) })
 timer.start(); timer.receive(JSON.stringify(snapshot()))
 now = 3000; t.mock.timers.tick(3000)
 assert.equal(timer.fresh, false)
 assert.equal(values.at(-1).timer_formatted, '—')
 assert.equal(values.at(-1).timer_stage, 'unknown')
 assert.ok(commands.includes('/nextnote/timer/request'))
 timer.stop()
})
test('duration, live adjustment and output commands use the common bounded paths', () => {
 const sent = [], actions = timerActions({ sendOSC: address => sent.push(address) })
 actions['timer_set-start'].callback({ options: { seconds: 900 } })
 actions.timer_adjust.callback({ options: { seconds: -30 } })
 actions.timer_visibility.callback({ options: { output: 'web', visible: false } })
 actions.timer_mode.callback({ options: { output: 'prompter', mode: 'both' } })
 actions.timer_set.callback({ options: { seconds: 0 } })
 actions.timer_adjust.callback({ options: { seconds: 1.5 } })
 actions.timer_mode.callback({ options: { output: '../control', mode: 'both' } })
 actions.timer_mode.callback({ options: { output: 'web', mode: 'countdown' } })
 actions.timer_mode.callback({ options: { output: 'fullscreen', mode: 'countdown' } })
 assert.deepEqual(actions.timer_mode.options[0].choices.map(choice => choice.id), ['presenter', 'next', 'prompter'])
 assert.deepEqual(sent, ['/nextnote/timer/set-start/900', '/nextnote/timer/adjust/-30', '/nextnote/timer/visibility/web/0', '/nextnote/timer/mode/prompter/both'])
 const presets = timerPresets()
 for (const preset of Object.values(presets)) for (const step of preset.steps) for (const action of step.down) assert.ok(actions[action.actionId])
})
test('flash supports toggle, explicit on/off and fresh selected feedback', () => {
 const sent = [], values = []
 const instance = { sendOSC: address => sent.push(address), setVariableValues: value => values.push(value), checkFeedbacks() {} }
 instance.speakerTimer = new SpeakerTimerCompanion(instance)
 const actions = timerActions(instance), feedbacks = timerFeedbacks(instance)
 actions['timer_flash-toggle'].callback({ options: {} })
 actions.timer_flash.callback({ options: { enabled: true } })
 actions.timer_flash.callback({ options: { enabled: false } })
 assert.deepEqual(sent, ['/nextnote/timer/flash-toggle', '/nextnote/timer/flash/1', '/nextnote/timer/flash/0'])
 instance.speakerTimer.receive(JSON.stringify({ ...snapshot(), flashing: true }))
 assert.equal(values.at(-1).timer_flashing, 1)
 assert.equal(feedbacks.timer_flashing.callback(), true)
 instance.speakerTimer.stop()
 assert.equal(feedbacks.timer_flashing.callback(), false)
 assert.equal(parseTimerSnapshot(JSON.stringify({ ...snapshot(), flashing: 'true' })), null)
 assert.equal(timerPresets().timer_flash.steps[0].down[0].actionId, 'timer_flash-toggle')
})

test('timer presets are discoverable without a Helper and send the intended native commands', () => {
 const sent = []
 const instance = { state: { memorySlotNames: {}, knownHelpers: [] }, sendOSC: address => sent.push(address) }
 const { structure, presets } = getPresets(instance), actions = timerActions(instance)
 const groups = structure.flatMap(section => section.definitions).filter(group => group.id.startsWith('speaker_timer'))
 assert.deepEqual(groups, timerPresetGroups)
 const ids = groups.flatMap(group => group.presets)
 assert.equal(ids.length, new Set(ids).size)
 assert.deepEqual(new Set(ids), new Set(Object.keys(timerPresets())))
 for (const id of ids) {
  assert.ok(presets[id], `Registered timer preset ${id}`)
  for (const step of presets[id].steps) for (const action of step.down) assert.ok(actions[action.actionId], `Preset ${id} references a real action`)
 }
 for (const [id, path] of [
  ['timer_reset', 'reset'], ['timer_flash', 'flash-toggle'], ['timer_start', 'start'], ['timer_pause', 'pause'],
  ['timer_adjust_-300', 'adjust/-300'], ['timer_adjust_-60', 'adjust/-60'], ['timer_adjust_-30', 'adjust/-30'],
  ['timer_adjust_30', 'adjust/30'], ['timer_adjust_60', 'adjust/60'], ['timer_adjust_300', 'adjust/300'],
  ['timer_set_custom', 'set/900'], ['timer_undo', 'undo'],
 ]) {
  for (const action of presets[id].steps[0].down) actions[action.actionId].callback({ options: action.options })
  assert.equal(sent.at(-1), `/nextnote/timer/${path}`)
 }
 // The custom preset's duration is edited in Companion, and Set never auto-starts.
 const action = presets.timer_set_custom.steps[0].down[0]
 actions[action.actionId].callback({ options: { ...action.options, seconds: 4500 } })
 assert.equal(sent.at(-1), '/nextnote/timer/set/4500')
 assert.ok(presets.scroll_stop && presets.slide_next, 'Existing prompter and slide presets remain registered')
})

test('dedicated transport pulses only while its state is active and resets to steady grey', t => {
 const calls = []
 t.mock.timers.enable({ apis: ['setInterval'] })
 const instance = { setVariableValues() {}, checkFeedbacks: (...ids) => calls.push(ids), sendOSC() {} }
 const timer = instance.speakerTimer = new SpeakerTimerCompanion(instance)
 timer.start()
 for (const [index, state] of ['ready', 'running', 'overtime', 'paused', 'finished', 'ready'].entries()) {
  const s = { ...snapshot(index + 1), state }
  timer.receive(JSON.stringify(s))
  for (const control of ['start', 'pause']) {
   const active = control === 'start' ? ['running', 'overtime'].includes(state) : state === 'paused'
   const bright = timerTransportColour(s, true, control, 0), dim = timerTransportColour(s, true, control, 500)
   if (active) assert.notEqual(bright, dim)
   else assert.equal(bright, control === 'start' ? 0x156430 : 0x9a4108)
   assert.equal(timerTransportColour(s, false, control, 0), 0x475569)
   assert.equal(timerTransportColour({ ...s, enabled: false }, true, control, 0), 0x475569)
  }
  calls.length = 0; t.mock.timers.tick(100)
  assert.equal(calls.some(ids => ids.includes('timer_transport')), ['running', 'overtime', 'paused'].includes(state))
 }
 timer.stop(); calls.length = 0; t.mock.timers.tick(1000); assert.equal(calls.length, 0)
 const presets = timerPresets()
 assert.equal(presets.timer_start.style.text, 'Start')
 assert.equal(presets.timer_pause.style.text, 'Pause')
 assert.ok(presets.timer_start.feedbacks.some(f => f.feedbackId === 'timer_transport'))
 assert.ok(presets.timer_pause.feedbacks.some(f => f.feedbackId === 'timer_transport'))
})

test('separate time digits are padded, signed once and cleared when stale', () => {
 let values;const timer = new SpeakerTimerCompanion({setVariableValues:v=>values=v,checkFeedbacks(){},sendOSC(){}});
 timer.receive(JSON.stringify({...snapshot(),remaining:4205}));
 assert.deepEqual([values.timer_hours,values.timer_minutes,values.timer_seconds],['01','10','05']);
 timer.receive(JSON.stringify({...snapshot(2),remaining:-5}));
 assert.deepEqual([values.timer_hours,values.timer_minutes,values.timer_seconds],['−00','00','05']);
 timer.start();assert.deepEqual([values.timer_hours,values.timer_minutes,values.timer_seconds],['—','—','—']);timer.stop();
 for(const unit of ['hours','minutes','seconds']) assert.ok(timerPresets()[`timer_${unit}`]);
})
test('global visibility preset sends toggle and follows native feedback', () => {
 const sent=[];const instance={sendOSC:path=>sent.push(path),speakerTimer:{fresh:true,snapshot:{...snapshot(),visible:false}}};
 timerActions(instance)['timer_visibility-toggle'].callback();
 assert.deepEqual(sent,['/nextnote/timer/visibility-toggle']);
 assert.equal(timerFeedbacks(instance).timer_visible.callback(),false);
 instance.speakerTimer.snapshot.visible=true;assert.equal(timerFeedbacks(instance).timer_visible.callback(),true);
 assert.equal(timerPresetGroups.find(g=>g.id==='speaker_timer_displays').name,'Speaker Timer — Info');
})

test('Set accepts hours/minutes/seconds and minutes/seconds, rejecting malformed input', () => {
 const sent=[];const actions=timerActions({sendOSC:path=>sent.push(path)});
 for(const [text,seconds] of [['1:10:05',4205],['10:05',605],['00:55',55],['0:15:00',900]]) {
  actions.timer_set.callback({options:{seconds:text}});assert.equal(sent.at(-1),`/nextnote/timer/set/${seconds}`);
  actions['timer_set-start'].callback({options:{seconds:text}});assert.equal(sent.at(-1),`/nextnote/timer/set-start/${seconds}`);
 }
 const count=sent.length;
 for(const text of ['1:60:00','10:60','0:00','','abc','1:2:3:4','-1:00']) actions.timer_set.callback({options:{seconds:text}});
 assert.equal(sent.length,count);
})
