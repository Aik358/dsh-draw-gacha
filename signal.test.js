// Offline signal-statistics tests for dsh-draw-gacha.
// Run: node tests/signal.test.js
// Mirrors the host SIGNAL_SOURCES / scanChunk logic so CI can verify
// detection without booting DSH.
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
const matches = (text, source) => { if (typeof text !== 'string') return 0; const re = new RegExp(source, 'gi'); let n = 0; while (re.exec(text) !== null) n++; return n; };
const countAll = (text) => { const out = {}; for (const k of Object.keys(SIGNAL_SOURCES)) { let n = 0; for (const s of SIGNAL_SOURCES[k]) n += matches(text, s); out[k] = n; } return out; };
const TAIL_LEN = 120;
function scanChunk(state, text) { const tail = state.tail || ''; const combined = tail + text; const now = countAll(combined); const prev = countAll(tail); for (const k of Object.keys(SIGNAL_SOURCES)) state.counts[k] += Math.max(0, now[k] - prev[k]); state.tail = combined.slice(-TAIL_LEN); }
const emptyCounts = () => ({ letMe:0,iNeed:0,iWill:0,weNeed:0,weShould:0,lets:0,verify:0,selfCorrect:0,constraint:0,structure:0 });

const EN = "Let me think about this. First, I need to check the constraint. However, I'll reconsider the approach. We need to verify the edge case. Actually, let's validate it. We should confirm the plan. Finally, I'll test the risk. But wait, I was wrong about the boundary. Let me recheck the assumption. We can then examine the trade-off. I'm going to summarize the steps now.";
const ZH = "首先我需要验证约束条件，但是我觉得可以重新考虑。我们需要的方案是：我们应该检查边界情况，我来试试跑一遍，最后确认。我会先总结步骤，我们一起看看，然后我们试试另一种。";

function run(text, label) {
  const state = { counts: emptyCounts(), tail: '' };
  let i = 0; let step = 5;
  while (i < text.length) { const cut = Math.min(text.length, i + step); scanChunk(state, text.slice(i, cut)); i = cut; step = 5 + (i % 6); }
  const zero = Object.keys(state.counts).filter(k => state.counts[k] <= 0);
  console.log(`${label}:`, JSON.stringify(state.counts));
  return zero;
}

let failed = 0;
const enZero = run(EN, 'EN (5-char splits)');
const zhZero = run(ZH, 'ZH (5-char splits)');
if (enZero.length) { failed++; console.error('EN zero signals:', enZero.join(',')); }
if (zhZero.length) { failed++; console.error('ZH zero signals:', zhZero.join(',')); }
if (failed) { console.error(`FAILED (${failed})`); process.exit(1); }
console.log('PASS: all 10 signal classes detected across token splits (EN + ZH)');
