const NUTRIENT_KEYS = ['kcal', 'p', 'fb', 'mg', 'k', 'ca', 'fe', 'zn', 'na', 'vc', 'vd', 'w3'];
// 每 100g 合理上限(防模型把"整道菜总量"误当每100g, 乘 grams 后营养暴涨)
const NUTRIENT_MAX = { kcal: 900, p: 100, fb: 100, mg: 1200, k: 5000, ca: 1500, fe: 50, zn: 50, na: 40000, vc: 2000, vd: 50, w3: 60 };
const RATE_BUCKETS = new Map();

// ===== 第二层兜底: 台湾食药署食品营养成分库(权威, OGDL-Taiwan-1.0)。模型生成的食材做高置信匹配, 命中即覆盖为权威值。=====
let TW_CACHE = null;
function twNorm(s) { return String(s || '').toLowerCase().replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, ''); }
function twBase(s) { return twNorm(s).replace(/\(.*$/, ''); }
async function getTwLib(env, request) {
  if (TW_CACHE) return TW_CACHE;
  TW_CACHE = { idx: new Map(), size: 0 };
  try {
    if (!env.ASSETS) return TW_CACHE;
    const u = new URL('/foods-tw.json', request.url);
    const r = await env.ASSETS.fetch(new Request(u.toString()));
    if (r && r.ok) {
      const arr = await r.json();
      for (const rec of arr) {
        if (rec.n) { const k = twNorm(rec.n); if (!TW_CACHE.idx.has(k)) TW_CACHE.idx.set(k, rec); }
        if (rec.a) for (const a of String(rec.a).split(/[,;、，]/)) { const t = twNorm(a); if (t && !TW_CACHE.idx.has(t)) TW_CACHE.idx.set(t, rec); }
      }
      TW_CACHE.size = arr.length;
    }
  } catch (_e) { /* 库不可用则跳过, 不影响生成 */ }
  return TW_CACHE;
}
function twLookup(lib, name) {
  const q = twNorm(name); if (!q || !lib.idx.size) return null;
  let h = lib.idx.get(q); if (h) return h;                 // 1. 全名精确
  const qb = twBase(name);                                 // 2. 去括号基名精确(且库项基名也相等)
  if (qb.length >= 2) { h = lib.idx.get(qb); if (h && twBase(h.n) === qb) return h; }
  return null;
}
// 调味料集合: 这些即使台湾库命中也不覆盖(其高钠权威值不应计入营养, 与前端 isSeasoning 归零一致)
const TW_SEASONING = new Set(['盐','食盐','酱油','生抽','老抽','蒸鱼豉油','蚝油','料酒','黄酒','米酒','醋','白醋','陈醋','香醋','米醋','姜','生姜','姜末','姜片','姜丝','葱','葱花','香葱','小葱','大葱','蒜','蒜末','蒜蓉','蒜泥','蒜头','咖喱粉','五香粉','十三香','胡椒粉','白胡椒','黑胡椒','胡椒','辣椒粉','干辣椒','花椒','八角','桂皮','香叶','孜然','糖','白糖','冰糖','红糖','味精','鸡精','淀粉','生粉','玉米淀粉','水淀粉','香油','芝麻油','豆瓣酱','郫县豆瓣','番茄酱','鱼露','咖喱酱','油','食用油','色拉油','调和油']);
function twIsSeasoning(name) { return TW_SEASONING.has(twNorm(name)) || TW_SEASONING.has(twBase(name)); }
async function enrichWithTw(meal, env, request) {
  const lib = await getTwLib(env, request);
  if (!lib.idx.size) return meal;
  let matched = 0;
  for (const ing of meal.ingredients) {
    if (twIsSeasoning(ing.name)) continue; // 调味料不覆盖: 避免酱油/蚝油/味精的高钠权威值漏进营养
    const hit = twLookup(lib, ing.name);
    if (!hit) continue;
    for (const key of NUTRIENT_KEYS) if (hit[key] != null) ing[key] = hit[key];
    ing.auth = 'tw'; ing.authCode = hit.code; matched++;
  }
  meal._twMatched = matched;
  return meal;
}

const RECIPE_SYSTEM = `你是家常菜专家+营养师, 熟悉《中国居民膳食指南(2022)》。
你的任务: 生成一道【一日量】的简单家常单品(一锅/一碗即可吃完, 可分 1-2 顿), 一份基本覆盖全天营养主结构(主食+蛋白+多种蔬菜)。
核心要求:
- 菜品形式要轮换, 别每次都是菜饭。在这些形式里换着来: 菜饭/煲仔饭/焖饭、盖浇饭、日式丼饭、石锅拌饭式拌饭、汤面/汤粉/汤米线、一锅炖菜/烩菜/杂烩汤、家庭简化一锅煮/麻辣烫式、杂粮谷物碗、咖喱烩饭等。
- 排除真火锅, 以及需要特殊高汤/长时间备料/复杂火候的版本。
- 一锅煮 OR 电饭锅 OR 简单炒制 OR 蒸; 烹饪要简单可行。
- 硬约束: 总时长 <= 40 分钟, 做法 <= 4 步, 难度 <= 2; 优先电饭锅/一锅出, 不要另起锅做第二道菜。
- 营养尽量贴近全天目标; 蛋白/纤维/钙优先; 不要奇葩组合。
- **主蛋白必须轮换**: 在 鱼/虾/鸡/鸭/猪/牛/蛋/豆制品 之间换着来, 不要连续几次或总是同一种, **尤其不要默认三文鱼**; 一道菜主蛋白选 1-2 种即可。
- 食材至少 8-10 种, 含主食 + 蛋白 + 3-5 种不同颜色/类型的蔬菜。
- 蔬菜总量尽量 >= 300g, 含绿叶菜、浅色蔬菜、根茎、菌菇、豆荚等不同类型。
- 一道菜总重 800-1500g, 用户可分 1-2 顿吃。
严格 JSON 输出, 不要 JSON 外文字。`;

const RECIPE_TEMPLATE = `生成一道【{meal_name}】一日量的简单家常单品(一锅/一碗式, 形式见系统提示、别总是菜饭), 用户全天营养目标约: 热量{kcal}kcal/蛋白{p}g/纤维{fb}g/钙{ca}mg。
{constraint_note}{exclude_note}
{season_note}

【强制】食材至少 8 种, 蔬菜至少 3-4 种不同颜色/类型(绿叶/根茎/菌菇/豆荚轮换)。

返回 JSON:
{
  "dish_name": "菜名(具体, 如「腊肠菜心菜饭」)",
  "ingredients": [
    {"name": "食材名", "grams": 数值, "kcal":数值, "p":数值, "fb":数值, "mg":数值, "k":数值, "ca":数值, "fe":数值, "zn":数值, "na":数值, "vc":数值, "vd":数值, "w3":数值}
  ],
  "steps": ["步骤1", "步骤2", "步骤3"],
  "note": "<30字 这道菜的特色或营养亮点",
  "flavor_tags": ["咸鲜", "微甜", "清爽"],
  "prep_minutes": 35,
  "difficulty": 1,
  "taste_preview": "<40-70字 美食家口吻, 描述入口和余韵的具体口感, 帮用户决定要不要做>",
  "form": "形式(焖饭/盖浇饭/丼饭/汤面/拌饭/一锅炖/grain bowl等)",
  "why": "<一句温和的「今天为什么适合你」, 可提到用上的食材/本周鱼/想吃的口味; 别说教别堆数据>",
  "has_fish": true,
  "veg_count": 4
}

字段要求:
- flavor_tags: 3-5 个 2-3 字口味标签, 必须诚实。
- prep_minutes: 整数, 从洗菜到出锅的总时长, 目标 <=40, 上限 45。
- difficulty: 1=新手可做, 2=中等; 不要出 3。
- taste_preview: 一句话, 入口口感 -> 中段 -> 余韵, 别空泛, 别全好评。

营养数值契约:
- 每个 ingredient 的 kcal/p/fb/mg/k/ca/fe/zn/na/vc/vd/w3 都是【每 100 克可食部分】的数值, 不是该食材在菜里的总量。
- grams 是该食材在这道菜里用的克数。
- 客户端会用 grams/100 × 营养值计算贡献。
- 营养值取食物成分表标准值, 别按 grams 乘出来。
- 单位: kcal=热量, p=蛋白g, fb=纤维g, mg=镁mg, k=钾mg, ca=钙mg, fe=铁mg, zn=锌mg, na=钠mg, vc=维C mg, vd=维D μg, w3=Omega-3 g。`;

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || 'https://yiguochu.pages.dev',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function asList(value) {
  let arr = [];
  if (Array.isArray(value)) arr = value.map(x => String(x).trim());
  else if (typeof value === 'string') arr = value.replace(/[，、]/g, ',').split(',').map(x => x.trim());
  // #12: 每项去换行 + 限长, 列表限项数, 防用户输入注入 prompt
  return arr.map(x => x.replace(/[\r\n]+/g, ' ').slice(0, 20)).filter(Boolean).slice(0, 20);
}

function safeInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function shanghaiParts(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = type => parts.find(p => p.type === type)?.value || '';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, month: Number(get('month')) };
}

function seasonNote(now) {
  const month = shanghaiParts(now).month || (now.getUTCMonth() + 1);
  const seasons = [
    { months: [3, 4, 5], text: '春季(3-5月) 应季: 春笋、香椿、豌豆、蚕豆、芦笋、荠菜、菠菜、韭菜、莴笋、西红柿、草莓' },
    { months: [6, 7, 8], text: '夏季(6-8月) 应季: 丝瓜、冬瓜、苦瓜、黄瓜、茄子、空心菜、苋菜、玉米、绿豆、桃、西瓜、葡萄' },
    { months: [9, 10, 11], text: '秋季(9-11月) 应季: 莲藕、山药、南瓜、芋头、菱角、栗子、白菜、西兰花、菠菜、苹果、梨、柿子' },
    { months: [12, 1, 2], text: '冬季(12-2月) 应季: 大白菜、萝卜、土豆、红薯、芋头、菠菜、油菜、菌菇、橘子、橙子、柚子' },
  ];
  const found = seasons.find(s => s.months.includes(month));
  if (!found) return '';
  return `\n【应季参考】当前 ${month} 月。${found.text}。这是参考清单, 不强制每道菜都用应季, 但平均下来约一半的菜应包含 1-2 种应季食材。优先级低于「不重复最近吃过的」。`;
}

function buildPrompt(mealName, targets, constraints) {
  let constraintNote = '';
  const diet = constraints.diet;
  if (diet && diet !== 'omnivore') {
    const label = { ovoLacto: '蛋奶素', vegan: '严格素食', glutenFree: '无麸质' }[diet];
    if (label) constraintNote += `饮食限制: ${label}。`;
  }

  const pantry = asList(constraints.pantry);
  if (pantry.length) {
    constraintNote += `家里有/想用掉: ${pantry.join(',')}。请优先围绕这些食材设计, 能自然用上的尽量用上; 不合适时少量补充常见食材, 不要为了全用而牺牲可吃性。`;
  }

  const dislikes = asList(constraints.dislikes);
  if (dislikes.length) constraintNote += `不吃: ${dislikes.join(',')}。`;

  if (constraints.week_fish_short) {
    constraintNote += '本周可安排一次鱼或海鲜即可(膳食指南建议每周≥2次, 但不必每餐都安排鱼); 若这餐安排鱼, 挑一种最近没吃过的鱼虾贝, 不要默认三文鱼。';
  }

  const balanceLow = asList(constraints.balance_low);
  if (balanceLow.length) {
    constraintNote += `【最近几餐这些偏少, 这一锅请有意识地多补】${balanceLow.join('; ')}。要自然融进菜里, 别为补而牺牲好吃。`;
  }
  if (constraints.balance_high_na) {
    constraintNote += '最近几餐钠偏高, 这一锅请少油少盐、少用腌制/酱料/加工肉。';
  }
  if (constraints.swap_hint) constraintNote += String(constraints.swap_hint);
  if (constraints.feedback_hint) constraintNote += String(constraints.feedback_hint);

  let excludeNote = '';
  const recent = asList(constraints.recent_dishes).slice(-20);
  if (recent.length) {
    excludeNote += `\n【绝对不要】重复以下最近已推荐的菜名: ${recent.join(', ')}。要换不同菜系/食材的全新菜。`;
  }

  const recentIngredients = constraints.recent_ingredients;
  if (recentIngredients && typeof recentIngredients === 'object') {
    const parts = [];
    const proteins = asList(recentIngredients.recent_proteins).slice(0, 15);
    const veggies = asList(recentIngredients.recent_veggies).slice(0, 20);
    const carbs = asList(recentIngredients.recent_carbs).slice(0, 10);
    if (proteins.length) parts.push(`主蛋白用过: ${proteins.join(', ')}`);
    if (veggies.length) parts.push(`主蔬菜用过: ${veggies.join(', ')}`);
    if (carbs.length) parts.push(`主食用过: ${carbs.join(', ')}`);
    if (parts.length) {
      excludeNote += `\n\n【食材轮换】最近 ${safeInt(recentIngredients.window_size, 0)} 次推荐里:\n-${parts.join('\n-')}\n这次的主蛋白和主蔬菜请明显避开以上列表, 选不同类别。`;
    }
  }

  return RECIPE_TEMPLATE
    .replace('{meal_name}', mealName)
    .replace('{kcal}', safeInt(targets.kcal, 1800))
    .replace('{p}', safeInt(targets.p, 60))
    .replace('{fb}', safeInt(targets.fb, 25))
    .replace('{ca}', safeInt(targets.ca, 800))
    .replace('{constraint_note}', constraintNote)
    .replace('{exclude_note}', excludeNote)
    .replace('{season_note}', seasonNote(new Date()));
}

function parseModelJson(text) {
  const raw = String(text || '').trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(raw);
  } catch (_err) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw _err;
  }
}

function normalizeMeal(meal, usage) {
  if (!meal || typeof meal !== 'object') throw new Error('模型返回空结果');
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  meal.ingredients = ingredients.slice(0, 14).map(item => {
    const out = { name: String(item?.name || '').trim(), grams: safeInt(item?.grams, 0) };
    for (const key of NUTRIENT_KEYS) {
      const n = Number(item?.[key]);
      out[key] = Number.isFinite(n) ? Math.min(Math.max(n, 0), NUTRIENT_MAX[key] ?? n) : 0;
    }
    return out;
  }).filter(item => item.name && item.grams > 0);
  if (meal.ingredients.length < 3) throw new Error('模型返回食材过少');

  meal.dish_name = String(meal.dish_name || '今日一锅出').trim();
  meal.steps = Array.isArray(meal.steps) ? meal.steps.map(x => String(x).trim()).filter(Boolean).slice(0, 6) : [];
  meal.flavor_tags = Array.isArray(meal.flavor_tags) ? meal.flavor_tags.map(String).slice(0, 5) : [];
  meal.prep_minutes = safeInt(meal.prep_minutes, 35);
  meal.difficulty = Math.min(2, Math.max(1, safeInt(meal.difficulty, 1)));
  meal.note = String(meal.note || '').trim();
  meal.taste_preview = String(meal.taste_preview || '').trim();
  meal.form = String(meal.form || '一锅主餐').trim();
  meal.why = String(meal.why || '').trim();
  meal.has_fish = Boolean(meal.has_fish);
  meal.veg_count = safeInt(meal.veg_count, 3);
  if (usage?.total_tokens) meal._tokens = usage.total_tokens;
  return meal;
}

function rateOk(request, env) {
  const limit = safeInt(env.RATE_LIMIT, 50);
  if (limit <= 0) return true;
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const day = shanghaiParts(new Date()).day;
  const key = `${day}:${ip}`;
  const used = RATE_BUCKETS.get(key) || 0;
  if (used >= limit) return false;
  RATE_BUCKETS.set(key, used + 1);
  if (RATE_BUCKETS.size > 5000) {
    for (const oldKey of RATE_BUCKETS.keys()) {
      if (!oldKey.startsWith(day + ':')) RATE_BUCKETS.delete(oldKey);
    }
  }
  return true;
}

async function handleGenerate(request, env) {
  if (!env.DEEPSEEK_API_KEY) return jsonResponse({ error: 'DEEPSEEK_API_KEY 未配置' }, 500, env);
  if (!rateOk(request, env)) return jsonResponse({ error: '今天生成次数到上限了，明天再来～' }, 429, env);

  const req = await request.json().catch(() => ({}));
  const targets = req.targets && typeof req.targets === 'object' ? req.targets : {};
  const constraints = req.constraints && typeof req.constraints === 'object' ? req.constraints : {};
  const mealName = String(req.meal_name || '主餐');
  const prompt = buildPrompt(mealName, targets, constraints);
  const body = {
    model: env.MODEL_NAME || 'deepseek-chat',
    messages: [
      { role: 'system', content: RECIPE_SYSTEM },
      { role: 'user', content: prompt },
    ],
    temperature: 1.0,
    response_format: { type: 'json_object' },
  };

  const upstream = await fetch(env.API_URL || 'https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    console.error('DeepSeek upstream error', upstream.status, raw.slice(0, 300));
    return jsonResponse({ error: '生成失败，请稍后再试' }, 502, env);
  }

  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content;
  const meal = normalizeMeal(parseModelJson(content), data.usage);
  await enrichWithTw(meal, env, request); // 第二层: 台湾权威库覆盖命中食材的营养(标 auth:'tw')
  return jsonResponse(meal, 200, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(env) });
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ status: 'ok', provider: 'deepseek', model: env.MODEL_NAME || 'deepseek-chat' }, 200, env);
    }
    if (request.method === 'POST' && url.pathname === '/generate-meal') {
      try {
        return await handleGenerate(request, env);
      } catch (err) {
        return jsonResponse({ error: err?.message || String(err) }, 500, env);
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return jsonResponse({ error: 'not found' }, 404, env);
  },
};
