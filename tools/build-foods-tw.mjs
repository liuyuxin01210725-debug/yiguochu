// ============================================================================
// build-foods-tw.mjs — 台湾食品营养成分资料库 → 本项目营养底座 (tools/data/foods-tw.json)
//
// 数据来源(权威, 合规可商用):
//   台湾卫生福利部食品药物管理署「食品营养成分资料库」
//   政府资料开放平台: https://data.gov.tw/dataset/8543
//   授权: 政府资料开放授权条款-第1版 (OGDL-Taiwan-1.0) —— 允许商业利用, 须标示来源(署名)
//   CSV(zip)下载: https://data.fda.gov.tw/opendata/exportDataList.do?method=ExportData&InfoId=20&logType=2
//
// ⚠️ 署名义务: 使用本数据的产品须标注「资料来源: 台湾卫福部食药署 食品营养成分资料库 (OGDL-Taiwan-1.0)」。
//
// 复现步骤:
//   1. 下载并解压 CSV:
//      curl -sL "https://data.fda.gov.tw/opendata/exportDataList.do?method=ExportData&InfoId=20&logType=2" -o tfnd.zip
//      unzip -o tfnd.zip            # 得 20_2.csv (约 65MB, 繁体长表)
//   2. 安装依赖(仅构建用, 不进前端运行时):  npm i opencc-js
//   3. node tools/build-foods-tw.mjs ./20_2.csv
//
// 产物: tools/data/foods-tw.json  (简体, 精简字段, 每条 {n,code,cat,(a),12营养})
//   营养单位与本项目 FOODS 一致: kcal / p,fb=g / mg,k,ca,fe,zn,na,vc=mg / vd=μg / w3=g
//   (原始营养值均为每 100 克可食部分)
// ============================================================================
import fs from 'node:fs';
import readline from 'node:readline';
import * as OpenCC from 'opencc-js';

const SRC = process.argv[2] || '/tmp/20_2.csv';
const OUT = new URL('./data/foods-tw.json', import.meta.url).pathname;
const conv = OpenCC.Converter({ from: 'tw', to: 'cn' });
const KEYS = ['kcal', 'p', 'fb', 'mg', 'k', 'ca', 'fe', 'zn', 'na', 'vc', 'vd', 'w3'];

// 台湾库列(0-based): 0食品分類 2整合編號 3樣品名稱 4俗名 9分析項 11每100克含量
const C_CAT = 0, C_ID = 2, C_NAME = 3, C_ALIAS = 4, C_ANALYSIS = 9, C_PER100 = 11;

function parseCSV(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur); return out;
}
function num(s) {
  if (s == null) return null;
  const t = String(s).replace(/[, \t]/g, '').trim();
  if (t === '' || t === 'Tr' || t === '-' || t === 'N/A') return null;
  const v = parseFloat(t); return Number.isFinite(v) ? v : null;
}
function pick(A, names) { for (const n of names) if (A.has(n)) return A.get(n); return null; }
function pickInc(A, sub) { for (const [k, v] of A) if (k.includes(sub)) return v; return null; }
// Omega-3 = n-3 系脂肪酸求和(EPA 20:5 / DHA 22:6 / DPA 22:5 / ALA 18:3 n-3)。原值单位 mg → 转 g。
function omega3(A) {
  let s = 0, hit = false;
  for (const [k, v] of A) {
    if (v == null) continue;
    if (/\(20:5|\(22:6|\(22:5/.test(k) || (/\(18:3/.test(k) && /n-?3|ω-?3/.test(k)) || /n-?3|ω-?3/.test(k)) { s += v; hit = true; }
  }
  return hit ? Math.round(s / 1000 * 1000) / 1000 : null;
}

const foods = new Map();
let first = true;
const rl = readline.createInterface({ input: fs.createReadStream(SRC), crlfDelay: Infinity });
for await (const line of rl) {
  if (first) { first = false; continue; }
  if (!line.trim()) continue;
  const f = parseCSV(line);
  if (f.length <= C_PER100) continue;
  const id = f[C_ID]; if (!id) continue;
  let rec = foods.get(id);
  if (!rec) { rec = { id, name: f[C_NAME], cat: f[C_CAT], alias: f[C_ALIAS] || '', A: new Map() }; foods.set(id, rec); }
  const ana = f[C_ANALYSIS], val = num(f[C_PER100]);
  if (ana && val != null && !rec.A.has(ana)) rec.A.set(ana, val);
}

const out = [];
for (const rec of foods.values()) {
  const A = rec.A;
  const wide = {
    kcal: pick(A, ['熱量', '修正熱量']), p: pick(A, ['粗蛋白', '蛋白質']),
    fb: pick(A, ['膳食纖維', '膳食纖維(總量)', '總膳食纖維']),
    mg: pick(A, ['鎂']), k: pick(A, ['鉀']), ca: pick(A, ['鈣']),
    fe: pick(A, ['鐵']), zn: pick(A, ['鋅']), na: pick(A, ['鈉']),
    vc: pickInc(A, '維生素C'), vd: pickInc(A, '維生素D'), w3: omega3(A),
  };
  const o = { n: conv(rec.name || ''), code: rec.id, cat: conv(rec.cat || '') };
  const a = conv(rec.alias || ''); if (a && a !== o.n) o.a = a;
  for (const k of KEYS) if (wide[k] != null) o[k] = wide[k];
  out.push(o);
}

fs.mkdirSync(new URL('./data/', import.meta.url).pathname, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`foods-tw.json: ${out.length} 条, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
