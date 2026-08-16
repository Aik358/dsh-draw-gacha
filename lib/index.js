const prefix = '/api/draw-gacha';
const aux = new Set(['compaction', 'session-title']);
const active = new Map();
const generations = new Map();
let clock = 0;
const stamp = () => ++clock;
const clean = (v) => typeof v === 'string' ? v.trim().slice(0, 256) : '';
const counts = () => ({ letMe: 0, iNeed: 0, iWill: 0, weNeed: 0, weShould: 0, lets: 0, verify: 0, selfCorrect: 0, constraint: 0, structure: 0 });
// 中文思维链信号词（放宽版）：中文无词边界，直接用字符串包含匹配；禁止单字，只用短语。
const CN = {
  letMe: '让我|我来|我试试|我试|我想|我先|我打算|我准备|我决定|我试着|我试着去|我来试试|我来做|我负责|我来说',
  iNeed: '我需要|我必须|我得|我要|我应该|我应当|我们得|我必须得|我得先|我需要确保|我必须确保',
  iWill: '我会|我将|我要|我打算|我准备|我将会|我将要|我会先|我接下来会',
  weNeed: '我们需要|我们要|我们得|咱们|让我们|我们一起|我们来|咱们一起|我们试试|让我们一起|我们打算',
  weShould: '我们应该|我们应当|我们有必要|我们最好',
  lets: '我们(一起|来)|咱们|咱们一起|让我们|让我们一起|我们试试',
  verify: '验证|检查|确认|测试|核实|校验|核对|复查|审查|审阅|测试一下|确认一下|验证一下|看一下|看看|查一下|检查一下|试一下|跑一下|测一下|复核|自查|排查|检测|检验|试验|试跑|跑一遍|过一遍|对照|比对|逐项|逐一|确认无误|检查无误',
  selfCorrect: '但是|然而|不过|重新|再想想|实际上|等等|更正|修正|我错了|等一下|换个角度|另一种|其实|反过来|仔细想想|再检查|哦对|差点忘了|补充一下|刚才说|另一方面|换个思路|换个说法|准确来说|严格来说|不对|错了|搞错了|更正一下|修正一下|我重新|重新考虑|再考虑|重新审视|重新评估|回头再看|回头检查|推翻|之前说|前面说|严格讲|说白了',
  constraint: '约束|限制|边界|权衡|风险|前提|假设|特殊情况|注意|小心|别忘了|潜在|例外|代价|成本|复杂度|仔细|关键|细节|极端情况|最坏情况|兜底|谨慎|保守|稳妥|容错|异常|边界情况|注意点|要点',
  structure: '首先|其次|最后|第一步|第二步|第三步|第四步|最后一步|总结|综上|步骤|计划|方案|流程|接下来|然后|先|再|最终|总而言之|整体|第三|第四|接着|随后|后续|下面|下一步|分步|分为|阶段|步骤一|步骤二|综上所述|最终结论|结论|总体来看|总的来说'
};
function matches(text, source) {
  if (typeof text !== 'string') return 0;
  const re = new RegExp(source, 'gi');
  let n = 0;
  while (re.exec(text) !== null) n++;
  return n;
}
// 信号源：英文正则 + 中文短语，逐项匹配（跨 chunk 由 scanChunk 拼接统计）
const SIGNAL_SOURCES = {
  letMe: ['\\blet\\s+me\\b', "\\blemme\\b", '\\bi\\s+guess\\b', '\\bi\\s+think\\b', '\\bi\\s+suppose\\b', '\\bi\\s+assume\\b', '\\bi\\s+believe\\b', '\\bi\\s+imagine\\b', '\\bi\\s+reckon\\b', '\\bi\\s+figured\\b', '\\bi\\s+wonder\\b', '\\bi\\s+take\\s+a\\s+look\\b', CN.letMe],
  iNeed: ['\\bi\\s+need\\b', '\\bi\\s+must\\b', '\\bi\\s+should\\b', '\\bi\\s+have\\s+to\\b', '\\bi\\s+got\\s+to\\b', '\\bi\\s+want\\s+to\\b', '\\bi\\s+ought\\s+to\\b', "\\bi'll\\s+need\\b", "\\bi'd\\s+need\\b", '\\bi\\s+need\\s+to\\b', CN.iNeed],
  iWill: ['\\bi\\s+will\\b', "\\bi'll\\b", '\\bi\\s+am\\s+going\\s+to\\b', "\\bi'm\\s+going\\s+to\\b", '\\bi\\s+plan\\s+to\\b', '\\bi\\s+intend\\s+to\\b', '\\bi\\s+shall\\b', "\\bi'd\\b", "\\bi'm\\s+going\\b", '\\bi\\s+am\\s+about\\s+to\\b', CN.iWill],
  weNeed: ['\\bwe\\s+need\\b', '\\bwe\\s+must\\b', '\\bwe\\s+should\\b', '\\bwe\\s+have\\s+to\\b', '\\bwe\\s+got\\s+to\\b', '\\bwe\\s+want\\s+to\\b', "\\bwe'll\\s+need\\b", '\\bwe\\s+need\\s+to\\b', '\\bwe\\s+can\\s+then\\b', CN.weNeed],
  weShould: ['\\bwe\\s+should\\b', '\\bwe\\s+ought\\s+to\\b', '\\bwe\\s+had\\s+better\\b', '\\bwe\\s+need\\s+to\\b', '\\bwe\\s+must\\b', "\\bwe'll\\s+have\\s+to\\b", '\\bwe\\s+can\\b', '\\bwe\\s+could\\b', CN.weShould],
  lets: ["\\blet'?s\\b", '\\blet\\s+us\\b', '\\bwe\\s+can\\b', '\\bwe\\s+could\\b', '\\bwe\\s+should\\b', '\\bwe\\s+might\\b', '\\bwe\\s+may\\b', '\\bwe\\s+will\\b', '\\bwe\\s+would\\b', '\\bwe\\s+are\\s+going\\s+to\\b', "\\bwe're\\s+going\\s+to\\b", CN.lets],
  verify: ['\\b(verify|verification|check|test|validate|confirm|ensure|assure|double-?check|re-?check|scrutinize|inspect|review|examine|prove)\\b', '\\b(must|need|should)\\s+check\\b', '\\b(check|test|verify)\\s+(if|whether|that)\\b', "\\b(let'?s|we|i)\\s+(check|test|verify|confirm)\\b", '\\b(make\\s+sure)\\b', '\\b(be\\s+sure)\\b', '\\b(see\\s+if)\\b', '\\b(look\\s+at|look\\s+into|look\\s+up)\\b', '\\b(try\\s+it|try\\s+this|try\\s+that)\\b', CN.verify],
  selfCorrect: ['\\b(however|but|yet|though|although|rethink|reconsider|instead|actually|hmm|wait|hold\\s+on|nevermind|never\\s+mind|correction|revise|revised|revisit|re-examine|rethink|alternatively|on\\s+the\\s+other\\s+hand|that\\s+said|that\\s+being\\s+said|let\\s+me\\s+reconsider|let\\s+me\\s+rethink|let\\s+me\\s+check\\s+again|actually\\s+no|oh\\s+wait|wait\\s+no|i\\s+was\\s+wrong|i\\s+misspoke|scratch\\s+that|let\\s+me\\s+start\\s+over)\\b', '\\b(but\\s+then|but\\s+wait|but\\s+actually|however\\s+,|however\\s+\\b)\\b', CN.selfCorrect],
  constraint: ['\\b(constraint|constraints|trade-?off|edge\\s+case|edge\\s+cases|risk|risks|invariant|boundary|boundaries|limitation|limitations|caveat|caveats|pitfall|pitfalls|gotcha|gotchas|exception|exceptions|corner\\s+case|special\\s+case|worst\\s+case|best\\s+case|prerequisite|dependency|dependencies|assumption|assumptions|precondition)\\b', '\\b(be\\s+careful|careful|caution|be\\s+mindful|mindful|watch\\s+out|note\\s+that|important\\s+to|it\\s+is\\s+important)\\b', CN.constraint],
  structure: ['\\b(first|second|third|fourth|fifth|finally|final|step|steps|plan|planned|next|then|afterwards|subsequently|meanwhile|lastly|last|firstly|secondly|thirdly|to\\s+begin|to\\s+start|in\\s+conclusion|conclusion|summarize|overview|outline|phase|stage|round|iteration|approach)\\b', '\\b(step\\s+1|step\\s+2|step\\s+3|part\\s+1|part\\s+2|phase\\s+1|phase\\s+2)\\b', CN.structure]
};
const countAll = (text) => {
  const out = {};
  for (const key of Object.keys(SIGNAL_SOURCES)) {
    let n = 0;
    for (const src of SIGNAL_SOURCES[key]) n += matches(text, src);
    out[key] = n;
  }
  return out;
};
// 跨 chunk 增量匹配：保留上一 chunk 的尾部（最多 48 字符），拼接后匹配，
// 减去尾部单独能匹配到的数量 = 新增（含跨 chunk 拼出来的完整词）。
const TAIL_LEN = 120;
function scanChunk(state, text) {
  const tail = state.tail || '';
  const combined = tail + text;
  const now = countAll(combined);
  const prev = countAll(tail);
  for (const key of Object.keys(SIGNAL_SOURCES)) {
    state.counts[key] += Math.max(0, now[key] - prev[key]);
  }
  state.tail = combined.slice(-TAIL_LEN);
}
function score(s) {
  const c = s.counts;
  const observed = s.reasoningChars + s.textChars;
  const planning = Math.min(4, (c.iWill > 0 ? 1 : 0) + (c.iNeed > 0 ? 1 : 0) + (c.weNeed > 0 ? 2 : 0) + (c.weShould > 0 ? 1 : 0) + (c.lets > 0 ? 1 : 0));
  const rigor = Math.min(5, (c.verify > 0 ? 2 : 0) + (c.selfCorrect > 0 ? 2 : 0) + (c.constraint > 0 ? 1 : 0) + (c.structure > 0 ? 1 : 0));
  const length = observed >= 6000 ? 5 : observed >= 3000 ? 3 : observed >= 1200 ? 2 : observed >= 400 ? 1 : 0;
  // tool-calls 是中间状态（模型还在执行工具继续干活），不视为正常完成；
  // 只有 stop（或尚未 finish）才按正常路径结算，避免中途误判稀有度。
  const normal = s.finish === null || s.finish === 'stop';
  // let me 负向惩罚：比旧版更敏感（letMe/2 起算，强信号按 1/3 抵扣），但上限 2 不失控。
  const letMePenalty = Math.min(2, Math.max(0, Math.ceil(c.letMe / 2) - Math.floor((planning + rigor) / 3)));
  const total = planning + rigor + length + (normal ? 1 : 0) - letMePenalty;
  if (s.finish === 'error' || s.finish === 'aborted') return observed >= 1200 ? { rarity: 'gold', total } : { rarity: 'blue', total };
  if (observed >= 3000 && total >= 7 && normal) return { rarity: 'red', total };
  if (observed >= 1200 && total >= 3 && normal) return { rarity: 'gold', total };
  return { rarity: 'blue', total };
}
function result(s) {
  const scored = score(s);
  const observed = s.reasoningChars + s.textChars;
  if (scored.rarity === 'red' && observed >= 3000) return { rarity: 'red', tails: ['red', 'red', 'red'], stars: 6, centerStage: 'slam', finish: s.finish || 'stop', counts: s.counts, reasoningChars: s.reasoningChars, textChars: s.textChars, seed: s.generation, flavorText: '夯力过载，三舱全红！' };
  if (scored.rarity === 'red') return { rarity: 'red', tails: ['gold', 'red', 'gold'], stars: 5, centerStage: 'steady', finish: s.finish || 'stop', counts: s.counts, reasoningChars: s.reasoningChars, textChars: s.textChars, seed: s.generation, flavorText: '人物红，双侧金光落地。' };
  return { rarity: scored.rarity, tails: ['blue', 'gold', 'blue'], stars: 4, centerStage: 'pull', finish: s.finish || 'stop', counts: s.counts, reasoningChars: s.reasoningChars, textChars: s.textChars, seed: s.generation, flavorText: '人物金，双侧蓝色武器保底。' };
}
function visible(s) { return s ? { ok: true, sessionId: s.sessionId, generation: s.generation, phase: s.phase, reasoningChars: s.reasoningChars, textChars: s.textChars, counts: s.counts, provisionalRarity: score(s).rarity, finish: s.finish, result: s.result } : { ok: true, phase: 'idle', generation: 0, result: null }; }
function start(body) {
  const sessionId = clean(body.sessionId);
  if (!sessionId) return { ok: false, error: 'sessionId-required' };
  const generation = (generations.get(sessionId) || 0) + 1;
  generations.set(sessionId, generation);
  active.set(sessionId, { sessionId, generation, phase: 'armed', reasoningChars: 0, textChars: 0, counts: counts(), tail: '', finish: null, result: null, updatedAt: stamp() });
  return { ok: true, generation, phase: 'armed' };
}
function getState(body) {
  const s = active.get(clean(body.sessionId));
  if (!s) return visible(null);
  const generation = Number(body.generation);
  if (generation && generation !== s.generation) return { ok: false, stale: true, generation, result: null };
  return visible(s);
}
function cancel(body) {
  const s = active.get(clean(body.sessionId));
  if (!s || s.generation !== Number(body.generation)) return { ok: true, stale: true };
  if (s.phase === 'armed' || s.phase === 'running') { s.phase = 'cancelled'; s.finish = 'aborted'; s.result = result(s); s.updatedAt = stamp(); }
  return { ok: true };
}
function observe(options, chunk) {
  if (!options || !clean(options.sessionId) || aux.has(options.purpose)) return;
  const s = active.get(clean(options.sessionId));
  if (!s || s.generation !== generations.get(s.sessionId)) return;
  if (s.phase === 'armed') s.phase = 'running';
  if (chunk.type === 'reasoning-delta' || chunk.type === 'text-delta') {
    const t = typeof chunk.text === 'string' ? chunk.text : '';
    if (chunk.type === 'reasoning-delta') s.reasoningChars += t.length; else s.textChars += t.length;
    scanChunk(s, t);
  }
  else if (chunk.type === 'finish') {
    const r = typeof chunk.reason === 'string' ? chunk.reason : chunk.reason && (chunk.reason.kind || chunk.reason.type);
    s.finish = ['stop', 'tool-calls', 'max-tokens', 'aborted', 'error'].includes(r) ? r : 'error';
    if (s.finish === 'tool-calls') {
      // 模型要调用工具继续干活，任务尚未完成：保持 running，继续累计后续轮次的 reasoning/text。
      s.phase = 'running';
    } else {
      s.result = result(s);
      s.phase = s.finish === 'aborted' ? 'cancelled' : s.finish === 'error' ? 'error' : 'settled';
    }
  }
  s.updatedAt = stamp();
}
function json(res, status, value) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); }
function bodyOf(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (x) => { raw += x; if (raw.length > 65536) reject(new Error('body-too-large')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } }); req.on('error', reject); }); }
function route(path, fn) { return { kind: 'exact', path, handler: (req, res) => { if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method-not-allowed' }); bodyOf(req).then(fn).then((v) => json(res, 200, v), (e) => json(res, 400, { ok: false, error: String(e.message || e) })); } }; }
export const name = 'draw-gacha';
export const inject = ['webServer'];
export function apply(ctx) {
  const routes = [route(`${prefix}/start`, start), route(`${prefix}/state`, getState), route(`${prefix}/cancel`, cancel)];
  ctx.effect(() => {
    const disposers = routes.map((r) => ctx.webServer.register(r));
    return () => disposers.forEach((dispose) => dispose());
  }, 'draw-gacha: routes');
  ctx.on('llm/stream', (options, next) => (async function* () { try { for await (const chunk of next()) { observe(options, chunk); yield chunk; } } catch (e) { observe(options, { type: 'finish', reason: 'error' }); throw e; } })());
  ctx.effect(() => () => { active.clear(); generations.clear(); });
}
