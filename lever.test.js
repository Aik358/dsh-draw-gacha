// Offline composer-lever contract tests for dsh-draw-gacha.
// Run: node lever.test.js
//
// Loads the real lib/client.js through a stub module loader, then renders the
// registered Lever component under both host contracts:
//   legacy  (dsh <= 0.1.4):      owner prop `input: InputState` (draftText era)
//   current (dsh >= 0.1.5-rc.1): NO owner props on 'conversation.input.right'
//                                (host commit 5f1eca58ea); the draft arrives
//                                through the standard `useInput` selector hook,
//                                beside standard `inputActions` / `sessionId`
// Regression under test (issue #1): reading the draft from `props.input` alone
// left the lever permanently disabled on every current host, because that owner
// prop no longer exists.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// --- minimal host surfaces the bundle touches -----------------------------
const h = (type, props, ...children) => ({
  type,
  props: { ...(props ?? {}), children: children.length <= 1 ? children[0] : children }
});
// Hooks are inert here: components are invoked as plain functions, so useRef
// persistence does not matter as long as one render's handlers stay together.
const React = {
  createElement: h,
  useState: (value) => [value, () => {}],
  useRef: (value) => ({ current: value }),
  useEffect: () => {}
};

const styleTag = { dataset: {}, textContent: '', remove() {} };
globalThis.document = { createElement: () => styleTag, head: { appendChild() {} } };
const windowStub = { __ModuleLoader__: { load(module) { windowStub.loaded = module; } } };
globalThis.window = windowStub;
new Function('window', readFileSync(join(root, 'lib', 'client.js'), 'utf8'))(windowStub);

const bundle = windowStub.loaded.factory((id) => {
  if (id === 'react') return React;
  throw new Error(`unexpected require('${id}')`);
});
if (typeof bundle.apply !== 'function') throw new Error('lib/client.js exports no apply()');

// --- harness --------------------------------------------------------------
const mount = () => {
  const slots = new Map();
  const requests = [];
  globalThis.fetch = (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) });
    return Promise.resolve({ json: async () => ({ ok: true, generation: 7 }) });
  };
  const ctx = {
    slots: {
      inject: (_key, register) => register(),
      register: (options, component) => {
        slots.set(options.name, component);
        return () => slots.delete(options.name);
      }
    },
    // Timers are captured, never fired: launch() schedules presentation phases.
    timeout: (fn, ms) => ({ fn, ms }),
    interval: (fn, ms) => ({ fn, ms }),
    effect: (fn) => fn()
  };
  bundle.apply(ctx);
  return { lever: slots.get('conversation.input.right'), overlay: slots.get('shell.overlay'), requests };
};

const actionsFor = (counter) => ({
  setDraft() {}, addAttachments() {}, removeAttachment() {}, pruneAttachments() {},
  submit() { counter.submits += 1; }
});
// Current InputState shape (host: SessionInputShell.compose()).
const inputState = (over = {}) => ({
  draft: '画一只像素猫', attachmentIds: [], draftRev: 3, phase: 'plain',
  occurrences: [], queue: [], ...over
});
// Current contract: the slot receives no owner props at all.
const currentProps = (input, actions, over = {}) => ({
  useInput: (select) => select(input),
  inputActions: actions,
  sessionId: 'session-1',
  ...over
});
const buttonOf = (tree) => tree.props.children;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let failed = 0;
const check = (label, actual, expected) => {
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : ` (expected ${expected}, got ${actual})`}`);
};

// --- gate: current contract (the reported bug) ----------------------------
{
  const { lever, overlay } = mount();
  const counter = { submits: 0 };
  const actions = actionsFor(counter);
  const props = currentProps(inputState(), actions);

  check('registered both slots', typeof lever === 'function' && typeof overlay === 'function', true);
  check('[current] non-empty draft enables the lever', buttonOf(lever(props)).props.disabled, false);

  const { useInput, ...noHook } = props;
  check('[current] no owner input and no useInput stays disabled (issue #1 shape)', buttonOf(lever(noHook)).props.disabled, true);

  check('[current] blank draft stays disabled', buttonOf(lever(currentProps(inputState({ draft: '   ' }), actions))).props.disabled, true);
  check('[current] phase adjudicating disables the lever', buttonOf(lever(currentProps(inputState({ phase: 'adjudicating' }), actions))).props.disabled, true);
  check('[current] phase submitting disables the lever', buttonOf(lever(currentProps(inputState({ phase: 'submitting' }), actions))).props.disabled, true);
  check('[current] phase claimed stays sendable (host primary parity)', buttonOf(lever(currentProps(inputState({ phase: 'claimed' }), actions))).props.disabled, false);
  check('[current] the hook wins over a stale owner input', buttonOf(lever(currentProps(inputState(), actions, { input: { draft: '' } }))).props.disabled, false);
  check('[current] missing inputActions stays disabled', buttonOf(lever({ useInput: props.useInput, sessionId: 'session-1' })).props.disabled, true);
}

// --- gate: legacy contract stays supported --------------------------------
{
  const { lever } = mount();
  const actions = actionsFor({ submits: 0 });
  const legacy = (input) => ({ input, inputActions: actions, sessionId: 'session-1' });

  check('[legacy] owner input.draftText enables the lever', buttonOf(lever(legacy({ draftText: '画一只猫' }))).props.disabled, false);
  check('[legacy] owner input.draft also works', buttonOf(lever(legacy({ draft: '画一只猫' }))).props.disabled, false);
  check('[legacy] empty draftText stays disabled', buttonOf(lever(legacy({ draftText: '' }))).props.disabled, true);
  check('[legacy] input.submitting disables the lever', buttonOf(lever(legacy({ draftText: 'x', submitting: true }))).props.disabled, true);
  check('[legacy] input.blocked disables the lever', buttonOf(lever(legacy({ draftText: 'x', blocked: true }))).props.disabled, true);
  check('[legacy] absent input stays disabled', buttonOf(lever(legacy(undefined))).props.disabled, true);
}

// --- pull-to-send on the current contract ---------------------------------
{
  const { lever, requests } = mount();
  const counter = { submits: 0 };
  const props = currentProps(inputState(), actionsFor(counter));
  // One render's handlers drive the whole drag (a real drag stays mounted).
  const button = buttonOf(lever(props));

  button.props.onPointerDown({ clientY: 100, pointerId: 1, currentTarget: { setPointerCapture() {} } });
  check('[drag] pull starts', buttonOf(lever(props)).props.className.includes('is-pulling'), true);
  button.props.onPointerMove({ clientY: 190 });
  check('[drag] pull past the arm threshold', buttonOf(lever(props)).props.className.includes('is-armed'), true);
  button.props.onPointerUp();
  await flush();

  check('[drag] start request posted', requests.length === 1 && requests[0].url === '/api/draw-gacha/start', true);
  check('[drag] start request carries the standard sessionId', requests[0]?.body.sessionId, 'session-1');
  check('[drag] host submit() called once', counter.submits, 1);
  check('[drag] lever locks during the presentation', buttonOf(lever(props)).props.disabled, true);
}

// --- an empty draft must not fire -----------------------------------------
{
  const { lever, requests } = mount();
  const counter = { submits: 0 };
  const props = currentProps(inputState({ draft: '' }), actionsFor(counter));
  const button = buttonOf(lever(props));
  button.props.onPointerDown({ clientY: 100, pointerId: 1, currentTarget: { setPointerCapture() {} } });
  button.props.onPointerUp();
  await flush();
  check('[drag] blank draft sends nothing', requests.length + counter.submits, 0);
}

// --- keyboard path --------------------------------------------------------
{
  const { lever, requests } = mount();
  const counter = { submits: 0 };
  const props = currentProps(inputState(), actionsFor(counter));
  buttonOf(lever(props)).props.onKeyDown({ key: 'Enter', preventDefault() {} });
  await flush();
  check('[key] Enter sends through the current contract', requests.length === 1 && counter.submits === 1, true);
}

if (failed) {
  console.error(`FAILED (${failed})`);
  process.exit(1);
}
console.log('PASS: lever gate honours the current slot contract and the legacy owner prop');
