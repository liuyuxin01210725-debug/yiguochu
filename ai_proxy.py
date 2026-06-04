#!/usr/bin/env python3
"""
本地 AI 代理 (LLM proxy) for 「今天吃什么」食物自动估算 + 菜饭生成。

启动:  双击 start.command (或 python3 ai_proxy.py)
停止:  Ctrl+C (或 lsof -ti :8765 | xargs kill -9)

依赖: 只用 Python 标准库 (Mac 自带 Python 3 直接跑)
配置: 同目录 .env 文件:
  DEEPSEEK_API_KEY=sk-xxxx    # 默认 provider
  KIMI_API_KEY=sk-xxxx        # fallback
  LLM_PROVIDER=deepseek       # 或 kimi
"""

import http.server
import json
import os
import socketserver
import sys
import urllib.request
import urllib.error
from pathlib import Path

PORT = int(os.environ.get('PORT', 8765))
HOST = os.environ.get('HOST', '127.0.0.1')  # 托管时设环境变量 HOST=0.0.0.0
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_FILE = SCRIPT_DIR / '.env'

TIMEOUT_S = 30


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


_env = load_env()
PROVIDER = (_env.get('LLM_PROVIDER') or os.environ.get('LLM_PROVIDER') or 'deepseek').lower()

if PROVIDER == 'deepseek':
    API_KEY = _env.get('DEEPSEEK_API_KEY') or os.environ.get('DEEPSEEK_API_KEY')
    API_URL = 'https://api.deepseek.com/v1/chat/completions'
    MODEL_NAME = 'deepseek-chat'
else:
    API_KEY = _env.get('KIMI_API_KEY') or os.environ.get('KIMI_API_KEY')
    API_URL = 'https://api.moonshot.cn/v1/chat/completions'
    MODEL_NAME = 'moonshot-v1-8k'

if not API_KEY:
    print(f'ERROR: {PROVIDER.upper()}_API_KEY 没找到。检查 {ENV_FILE}', file=sys.stderr)
    sys.exit(1)


SYSTEM = '你是中国食物营养专家。返回严格 JSON 营养数据，不要任何 JSON 外的解释文字。考虑食材的真实搭配习惯、口味协调、烹饪可行性。'

# V5 菜饭生成 prompt
RECIPE_SYSTEM = '''你是家常菜专家+营养师, 熟悉《中国居民膳食指南(2022)》。
你的任务: 生成一道【一日量】的简单家常单品(一锅/一碗即可吃完, 可分 1-2 顿), 一份基本覆盖全天营养主结构(主食+蛋白+多种蔬菜)。
核心要求:
- 【菜品形式要轮换, 别每次都是菜饭】在这些"一锅/一碗式"形式里换着来: 菜饭/煲仔饭/焖饭、盖浇饭、日式丼饭(亲子丼/牛丼等)、石锅拌饭式拌饭、汤面/汤粉/汤米线(连汤带料)、一锅炖菜/烩菜/杂烩汤、家庭简化"一锅煮/麻辣烫式"(多种菜+蛋白一锅煮熟、少油少盐、可微辣)、杂粮谷物碗(grain bowl)、咖喱烩饭 等。都要是真实常见的家常做法, 别瞎编。
- 【排除】真火锅(需涮、需锅具、本质聚餐外食), 以及任何需要特殊高汤/长时间备料/复杂火候的版本——本工具只出在家 40 分钟内能简单搞定的。
- 一锅煮 OR 电饭锅 OR 简单炒制 OR 蒸 — 烹饪要简单可行
- 【硬约束·简单】总时长 ≤ 40 分钟, 做法 ≤ 4 步, 难度 ≤ 2; 优先电饭锅/一锅出, 不要另起锅做第二道菜, 不要复杂火候/多步骤
- 营养尽量贴近全天目标; 蛋白/纤维/钙优先; 不要奇葩组合(如南瓜子+草莓)
- **食材多样性是关键**: 至少 8-10 种食材, 含主食 + 蛋白 + **3-5 种不同颜色/类型的蔬菜**
- 蔬菜按膳食指南: 总量 ≥ 300g, 含深色叶菜(菠菜/油菜/芥兰), 浅色蔬菜(白菜/卷心菜), 根茎(胡萝卜/南瓜), 菌菇(香菇/木耳), 豆荚(荷兰豆/芦笋) 等不同颜色类型
- 一道菜总重 800-1500g, 用户可分 1-2 顿吃
严格 JSON 输出, 不要 JSON 外文字。'''

RECIPE_TEMPLATE = '''生成一道【{meal_name}】一日量的简单家常单品(一锅/一碗式, 形式见系统提示、别总是菜饭), 用户全天营养目标约: 热量{kcal}kcal/蛋白{p}g/纤维{fb}g/钙{ca}mg。
{constraint_note}{exclude_note}
{season_note}

【强制】食材至少 8 种, 蔬菜至少 3-4 种不同颜色/类型(绿叶/根茎/菌菇/豆荚轮换)。

菜品形式 + 菜名都要有多样性 — 先在"一锅/一碗式形式"间轮换(菜饭/盖浇饭/丼饭/拌饭/汤面/一锅炖/一锅煮/grain bowl/咖喱烩饭等, 别总给菜饭), 再考虑不同菜系(粤式煲仔/上海菜饭/川味/江浙/客家/东北/海南/新疆/西北/福建/湘菜/泰式/日韩融合等)、不同主蛋白(海鲜/红肉/禽类/豆制品/蛋类轮换)、不同主食(白米/糙米/藜麦/小米/燕麦/糙米+杂粮)。

返回 JSON:
{{
  "dish_name": "菜名(具体, 如「腊肠菜心菜饭」)",
  "ingredients": [
    {{"name": "食材名", "grams": 数值, "kcal":数值, "p":数值, "fb":数值, "mg":数值, "k":数值, "ca":数值, "fe":数值, "zn":数值, "na":数值, "vc":数值, "vd":数值, "w3":数值}},
    ...
  ],
  "steps": ["步骤1", "步骤2", "步骤3"],
  "note": "<30字 这道菜的特色或营养亮点",
  "flavor_tags": ["咸鲜", "微甜", "清爽"],
  "prep_minutes": 35,
  "difficulty": 1,
  "taste_preview": "<40-70字 美食家口吻, 描述入口和余韵的具体口感, 帮用户决定要不要做>",
  "form": "形式(与系统提示一致, 如 焖饭/盖浇饭/丼饭/汤面/拌饭/一锅炖/grain bowl)",
  "why": "<一句温和的「今天为什么适合你」, 可提到用上的食材/本周鱼/想吃的口味; 别说教别堆数据>",
  "has_fish": true,
  "veg_count": 4
}}

【V7.4 字段说明 — 必填, 用户决策依赖】
- flavor_tags: 3-5 个 2-3 字口味标签, 例 ["咸鲜","微甜","油润","清爽","酸辣","酱香","蒜香"], 必须诚实, 不要全好评
- prep_minutes: 整数, 从洗菜到出锅的总时长(含备菜), 目标 ≤40, 上限 45 — 超过就简化菜式, 别给费时方案
- difficulty: 1=新手可做(切+一锅煮)/2=中等(需要简单技法/腌制) —— 本工具只出 1-2, 不要出 3(火候关键/多步骤的复杂菜)
- taste_preview: 一句话, 入口口感→中段→余韵, 别空泛, 别全好评。例: "腊味咸香打底, 米饭吸足汤汁微甜, 春笋脆嫩解腻; 油润但不腻口"

⚠️ **营养数值契约 (极重要, 错了整套数据废)**:
- 每个 ingredient 的 kcal/p/fb/mg/k/ca/fe/zn/na/vc/vd/w3 都是【每 100 克可食部分】的数值, **不是该食材在菜里的总量**
- grams 字段是该食材在这道菜里用的克数(可食部分)
- 客户端会用 grams/100 × 营养值 计算贡献
- **举例**: 米饭(熟) grams=300, 每 100g 含 116kcal/2.6g 蛋白, 你应填 {{"name":"米饭(熟)","grams":300,"kcal":116,"p":2.6,...}}, **不是** kcal:348/p:7.8
- **举例**: 鸡腿肉 grams=150, 每 100g 含 181kcal/20g 蛋白, 你应填 {{..."grams":150,"kcal":181,"p":20,...}}
- 营养值取食物成分表标准值, 别按 grams 乘出来

营养数值单位: kcal=热量, p=蛋白g, fb=纤维g, mg=镁mg, k=钾mg, ca=钙mg, fe=铁mg, zn=锌mg, na=钠mg, vc=维C mg, vd=维D μg, w3=Omega-3 g。'''


def call_recipe(meal_name, targets, constraints):
    constraint_note = ''
    def _as_list(value):
        if isinstance(value, list):
            return [str(x).strip() for x in value if str(x).strip()]
        if isinstance(value, str):
            return [x.strip() for x in value.replace('，', ',').replace('、', ',').split(',') if x.strip()]
        return []
    if constraints.get('diet') and constraints['diet'] != 'omnivore':
        diet_label = {'ovoLacto':'蛋奶素', 'vegan':'严格素食', 'glutenFree':'无麸质'}.get(constraints['diet'], '')
        if diet_label: constraint_note += f'饮食限制: {diet_label}。'
    pantry = _as_list(constraints.get('pantry'))
    if pantry:
        constraint_note += f'家里有/想用掉: {",".join(pantry)}。请优先围绕这些食材设计, 能自然用上的尽量用上; 不合适时少量补充常见食材, 不要为了全用而牺牲可吃性。'
    dislikes = _as_list(constraints.get('dislikes'))
    if dislikes:
        constraint_note += f'不吃: {",".join(dislikes)}。'
    # V8.3: 本周吃鱼不足 → 软优先安排鱼/海鲜 (膳食指南建议每周≥2次鱼; 与上面的食材轮换协调, 换没吃过的鱼)
    if constraints.get('week_fish_short'):
        constraint_note += '本周吃鱼偏少, 这一锅请优先安排一道含鱼或海鲜的菜饭(挑一种最近没吃过的)。'
    # V8.5: 后台动态调配 — 最近几天已选的菜里持续偏低的营养素, 这一锅有意多补(自然融入, 不牺牲好吃)
    balance_low = _as_list(constraints.get('balance_low'))
    if balance_low:
        constraint_note += '【最近几餐这些偏少, 这一锅请有意识地多补】' + '; '.join(balance_low) + '。要自然融进菜里, 别为补而牺牲好吃。'
    if constraints.get('balance_high_na'):
        constraint_note += '最近几餐钠偏高, 这一锅请少油少盐、少用腌制/酱料/加工肉。'
    # V9: 「换一换」意图 — 顺着用户选的方向微调(口味/菜系/清淡/省事/换蛋白)
    if constraints.get('swap_hint'):
        constraint_note += str(constraints.get('swap_hint'))
    # V9: 第二天反馈「没吃原因」→ 影响下次生成
    if constraints.get('feedback_hint'):
        constraint_note += str(constraints.get('feedback_hint'))
    # V5.1: 排除最近生成过的菜名, 防重复
    exclude_note = ''
    recent = constraints.get('recent_dishes') or []
    if recent:
        exclude_note = f'\n【绝对不要】重复以下最近已推荐的菜名: {", ".join(recent[-20:])}。要换不同菜系/食材的全新菜。'
    # V7.1: 食材轮换 — 最近 7 次推荐的主蛋白/主蔬菜/主食, 这次要换 (依据中国居民膳食指南"每周 25 种以上不同食物")
    recent_ings = constraints.get('recent_ingredients')
    if recent_ings and isinstance(recent_ings, dict):
        rotation_parts = []
        rp = recent_ings.get('recent_proteins') or []
        rv = recent_ings.get('recent_veggies') or []
        rc = recent_ings.get('recent_carbs') or []
        w = recent_ings.get('window_size', 0)
        if rp: rotation_parts.append(f'主蛋白用过: {", ".join(rp[:15])}')
        if rv: rotation_parts.append(f'主蔬菜用过: {", ".join(rv[:20])}')
        if rc: rotation_parts.append(f'主食用过: {", ".join(rc[:10])}')
        if rotation_parts:
            exclude_note += (
                f'\n\n【食材轮换 — 依据膳食指南"每周 25 种以上不同食物"】最近 {w} 次推荐里:\n'
                + '\n'.join('- ' + p for p in rotation_parts)
                + '\n这次的主蛋白和主蔬菜请明显避开以上列表, 选不同类别 (比如最近吃过鸡, 这次换鱼/虾/豆制品/牛肉; 最近吃过西兰花, 这次换茄子/菌菇/根茎)。主食也尽量换 (白米→糙米→燕麦→小米→杂粮 轮换)。'
            )
    # V6.3: 应季食材提示 (服务端基于日期判断, 不依赖前端)
    from datetime import datetime
    now = datetime.now()
    month = now.month
    season_map = {
        (3, 4, 5):  '春季(3-5月) 应季: 春笋、香椿、豌豆、蚕豆、芦笋、荠菜、菠菜、韭菜、莴笋、西红柿、草莓',
        (6, 7, 8):  '夏季(6-8月) 应季: 丝瓜、冬瓜、苦瓜、黄瓜、茄子、空心菜、苋菜、玉米、绿豆、桃、西瓜、葡萄',
        (9, 10, 11):'秋季(9-11月) 应季: 莲藕、山药、南瓜、芋头、菱角、栗子、白菜、西兰花、菠菜、苹果、梨、柿子',
        (12, 1, 2): '冬季(12-2月) 应季: 大白菜、萝卜、土豆、红薯、芋头、菠菜、油菜、菌菇、橘子、橙子、柚子',
    }
    season_text = next((v for k, v in season_map.items() if month in k), '')
    # V7.1: 应季软推荐 — 不强制, 让 LLM 自己平衡。约一半推荐里出现 1-2 种应季食材即可, 不必每道都应季
    season_note = f'\n【应季参考】当前 {now.month} 月。{season_text}。这是参考清单, 不强制每道菜都用应季, 但平均下来约一半的菜应包含 1-2 种应季食材。优先级低于「不重复最近吃过的」。' if season_text else ''
    # V6.2: 防御 client 传 None/非数字, 避免 500
    def safe_int(v, default):
        try:
            if v is None: return default
            return int(float(v))
        except (TypeError, ValueError):
            return default
    payload = {
        'model': MODEL_NAME,
        'messages': [
            {'role': 'system', 'content': RECIPE_SYSTEM},
            {'role': 'user', 'content': RECIPE_TEMPLATE.format(
                meal_name=meal_name,
                kcal=safe_int(targets.get('kcal'), 1800),
                p=safe_int(targets.get('p'), 60),
                fb=safe_int(targets.get('fb'), 25),
                ca=safe_int(targets.get('ca'), 800),
                constraint_note=constraint_note,
                exclude_note=exclude_note,
                season_note=season_note,
            )},
        ],
        'temperature': 1.0,  # V5.1: 拉高多样性
        'response_format': {'type': 'json_object'},
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        raw = resp.read().decode('utf-8')
    data = json.loads(raw)
    content = data['choices'][0]['message']['content']
    parsed = json.loads(content)
    # V6.1: 服务端 sanity check — 检测 AI 是否把 per-100g 算成总量
    ings = parsed.get('ingredients') or []
    suspicious = 0
    for ing in ings:
        for k in ('kcal','p','fb','mg','k','ca','fe','zn','na','vc','vd','w3'):
            v = ing.get(k)
            if not isinstance(v, (int, float)):
                ing[k] = 0
        # 米饭 grams=300 kcal=348 → 单位/100g 不会到 348(米饭 116) → 大概率是总量
        # 阈值: kcal>500/100g 几乎只可能是油/坚果, 蛋白>50/100g 只可能是蛋白粉, 别的就是 AI 错了
        g = ing.get('grams', 0)
        if g and g > 50:  # 只对大份量食材判断, 调味品小克数跳过
            kc = ing.get('kcal', 0) or 0
            p = ing.get('p', 0) or 0
            # 若 kcal × grams/100 与名义总热量近乎等于 kcal 本身, 几乎肯定是 AI 把总量当成 per-100g 了
            if kc > 600 and ing.get('name','') not in ('植物油','橄榄油','花生油','黄油','芝麻油','猪油','坚果','核桃','腰果'):
                suspicious += 1
            if p > 60:
                suspicious += 1
    if suspicious >= 2:
        msg = f'{suspicious} 项营养值疑似总量(不是 per-100g), 数值可能偏高'
        print(f'  ⚠️ recipe sanity warning: {msg}', flush=True)
        parsed['_warning'] = msg  # V6.2: 透传给前端展示
    # V7.2: 智能透明化 — 算 "这次为你做了什么判断", 让用户看见后台
    parsed['_intelligence'] = explain_intelligence(parsed, constraints.get('recent_ingredients'), season_text, now.month)
    usage = data.get('usage', {})
    if usage:
        parsed['_tokens'] = usage.get('total_tokens')
    return parsed


def _protein_category(name):
    """V7.5 Bug F 修: 把主蛋白归类, 避免 [:2] 字符前缀误判 (e.g. 鸡腿 vs 鸡胸 不算同蛋白)."""
    # 顺序重要: 先检查更具体的, 后检查更宽泛的
    if any(k in name for k in ['豆腐','腐竹','豆干','腐皮','豆浆','黄豆','黑豆','鹰嘴豆','扁豆','毛豆','纳豆']):
        return '豆制品'
    if any(k in name for k in ['鱼','虾','蟹','贝','墨鱼','鱿鱼','章鱼','蛤','蚌','三文','鳕','鳗','带鱼','鲈','鲢','鲶','鲭']):
        return '水产'
    if any(k in name for k in ['蛋']):
        return '蛋'
    if any(k in name for k in ['鸡','鸭','鹅']):
        return '禽肉'
    if any(k in name for k in ['牛']):
        return '牛肉'
    if any(k in name for k in ['猪','腊肠','腊肉','火腿','培根','香肠','里脊']):
        return '猪/腌制'
    if any(k in name for k in ['羊']):
        return '羊肉'
    return None

PROTEIN_KEYWORDS = ['牛','鱼','虾','蟹','贝','豆腐','腐竹','豆干','腐皮','鸭','鹅','羊','鸡','蛋','猪','三文','鳕','腊','里脊','火腿','培根','香肠','鲈','鳗']

def explain_intelligence(parsed, recent_ings, season_text, month):
    """生成 2-3 行小字, 告诉用户这次推荐为他做了什么 (V7.2)."""
    explanations = []
    ings = [i.get('name','') for i in parsed.get('ingredients', [])]
    if not ings:
        return explanations
    # 1. 食材轮换: 最近吃过的主蛋白, 这次换了
    if recent_ings and isinstance(recent_ings, dict):
        recent_p_list = recent_ings.get('recent_proteins') or []
        window = recent_ings.get('window_size', 0)
        if recent_p_list and window >= 2:
            # V7.5 Bug E 修: 阈值从 80 → 50 (减脂用户主蛋白 60g 也算)
            current_proteins = []
            for i in parsed.get('ingredients', []):
                if any(p in i.get('name','') for p in PROTEIN_KEYWORDS) and (i.get('grams', 0) or 0) >= 50:
                    current_proteins.append(i['name'])
            if current_proteins:
                # V7.5 Bug F 修: 用类别词典, 不是字符前缀
                cur_main = current_proteins[0]
                cur_cat = _protein_category(cur_main)
                recent_cats = {_protein_category(rp) for rp in recent_p_list if _protein_category(rp)}
                # 如果当前主蛋白的类别跟 recent 任何一个类别相同 → 没真换
                already_had = cur_cat and cur_cat in recent_cats
                if not already_had:
                    # 真换了 — 告诉用户
                    recent_summary = '、'.join(recent_p_list[-3:])
                    explanations.append(f'这次换了主蛋白 → {cur_main}(你最近选过 {recent_summary}, 这次给你换新的)')
        # 蔬菜轮换同理
        recent_v_list = recent_ings.get('recent_veggies') or []
        if recent_v_list and window >= 2:
            current_veggies = [i['name'] for i in parsed.get('ingredients', []) if (i.get('grams', 0) or 0) >= 80
                               and any(v in i.get('name','') for v in ['菜','椒','瓜','笋','菇','耳','藕','胡萝卜','番茄','苋','茄','洋葱','花椰','芥','西兰花','芦笋'])]
            new_veggies = [v for v in current_veggies if not any(rv[:2] in v or v[:2] in rv for rv in recent_v_list)]
            if new_veggies and len(new_veggies) >= 2:
                explanations.append(f'蔬菜也换了 → {", ".join(new_veggies[:3])} (避开你最近选过的)')
    # 2. 应季命中
    if season_text and '应季:' in season_text:
        seasonal_str = season_text.split('应季:')[1] if '应季:' in season_text else ''
        # 应季关键词: 中文 2-4 字, 用顿号/逗号分割
        import re as _re
        seasonal_keywords = [s.strip() for s in _re.split(r'[、,，\s]+', seasonal_str) if 2 <= len(s.strip()) <= 4]
        hit = []
        for n in ings:
            for s in seasonal_keywords:
                if s in n and s not in hit:
                    hit.append(s)
                    break
        if hit:
            explanations.append(f'加了 {month} 月应季 → {", ".join(hit[:3])}')
    return explanations

PROMPT_TEMPLATE = """请返回食物 "{name}" 每 100 克(可食部分)的营养数据。

【判断】这个名称是：
- 【单一食材】例如 马兰头、油茶籽油、三文鱼、糙米饭 → 按食物成分表标准值返回，note 写来源。
- 【复合菜/混合食物】例如 香干马兰头、宫保鸡丁、麻婆豆腐、青椒肉丝、番茄炒蛋 → 按典型配比的整体估算（不要保守低估，尤其蛋白和钙），category 选"复合食物"，note 字段**必须**以 "⚠️复合菜估算偏差大，建议拆开记: A + B + ..." 开头，列出主要食材。
- 【补剂/片剂/胶囊/营养剂】例如 维生素C片 1000mg、钙片、鱼油胶囊、复合维生素、蛋白粉、铁剂 → **必须严格按 per 100g 换算！**
  - 假设单片重量约 1g（除非名称带克数另指明，如"500mg 片"=0.5g/片）
  - 每 100g = 1/单片重 × 100 片 → 把有效成分 ×100
  - **举例**: "维C片 1000mg" 名称里的"1000mg"是单片含量。每片 1g 含 1000mg vit C → 每 100g = 100 片 → vc = **100000**（不是 1000！）
  - 举例: "钙片 600mg" 通常每片 1g 含 600mg 元素钙 → 每 100g → ca = 60000
  - 举例: "鱼油胶囊 1000mg" 每粒 1g 含 1000mg 鱼油（其中约 300mg EPA+DHA）→ 每 100g → w3 = 30
  - category 选"其它"
  - note 字段**必须**写: "补剂 ⚠️ 每 100g 即 N 粒，单粒含 X mg 有效成分，按需服用别多吃"

严格按下面 JSON 结构返回，数值不带单位，不知道的项目填 0：

{{
  "name": "食物全名(中文)",
  "category": "蔬菜|肉禽|水产|蛋类|坚果种子|主食谷物|水果|奶豆制品|调味品|复合食物|其它",
  "kcal": 数值,
  "p": 数值,
  "fb": 数值,
  "mg": 数值,
  "k": 数值,
  "ca": 数值,
  "fe": 数值,
  "zn": 数值,
  "na": 数值,
  "vc": 数值,
  "vd": 数值,
  "w3": 数值,
  "note": "≤50字 来源/置信度/拆分建议"
}}

字段单位: kcal=热量, p=蛋白g, fb=膳食纤维g, mg=镁mg, k=钾mg, ca=钙mg, fe=铁mg, zn=锌mg, na=钠mg, vc=维C mg, vd=维D μg, w3=Omega-3 总量g (ALA+EPA+DHA)。"""


def call_kimi(food_name: str) -> dict:
    """调用 Kimi API，返回解析后的 JSON dict。"""
    payload = {
        'model': MODEL_NAME,
        'messages': [
            {'role': 'system', 'content': SYSTEM},
            {'role': 'user', 'content': PROMPT_TEMPLATE.format(name=food_name)},
        ],
        'temperature': 0.2,
        'response_format': {'type': 'json_object'},
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        raw = resp.read().decode('utf-8')
    data = json.loads(raw)
    content = data['choices'][0]['message']['content']
    parsed = json.loads(content)
    # 确保所有 12 项数值都是数字（LLM 偶尔会返回 null）
    for key in ('kcal', 'p', 'fb', 'mg', 'k', 'ca', 'fe', 'zn', 'na', 'vc', 'vd', 'w3'):
        v = parsed.get(key)
        if not isinstance(v, (int, float)):
            parsed[key] = 0
    # 记录 token 使用（如果有）
    usage = data.get('usage', {})
    if usage:
        parsed['_tokens'] = usage.get('total_tokens')
    return parsed


ALLOWED_ORIGINS = {
    'null',  # file:// 协议 origin 是 "null"
    'http://localhost:8081',
    'http://localhost:8000',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8000',
}
# 托管上线: 环境变量加生产域名 ALLOW_ORIGIN=https://你的站点 (逗号分隔多个); 设 '*' 放开所有
ALLOW_ORIGIN_ENV = os.environ.get('ALLOW_ORIGIN', '').strip()
ALLOW_ALL_ORIGINS = (ALLOW_ORIGIN_ENV == '*')
for _o in ALLOW_ORIGIN_ENV.split(','):
    _o = _o.strip()
    if _o and _o != '*':
        ALLOWED_ORIGINS.add(_o)
# 可选限流(托管必开): RATE_LIMIT=每 IP 每天次数; 0=不限(本地默认)
import time as _time
RATE_LIMIT = int(os.environ.get('RATE_LIMIT', '0'))
_rate = {}
def _rate_ok(ip):
    if RATE_LIMIT <= 0:
        return True
    now = _time.time()
    arr = [t for t in _rate.get(ip, []) if now - t < 86400]
    if len(arr) >= RATE_LIMIT:
        _rate[ip] = arr
        return False
    arr.append(now); _rate[ip] = arr
    return True

class Handler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        # V6.1: 只允许本地 origin, 不再用 *
        origin = self.headers.get('Origin', '')
        if ALLOW_ALL_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin or '*')
        elif origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
        elif origin == '':
            # 无 Origin header (curl 等), 允许
            self.send_header('Access-Control-Allow-Origin', '*')
        # 不匹配则不发 ACAO, 浏览器自动 block
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Vary', 'Origin')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        # 简单健康检查
        if self.path in ('/', '/health'):
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'provider': PROVIDER, 'model': MODEL_NAME}).encode())
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

    def do_POST(self):
        if self.path == '/generate-meal':
            return self._handle_generate_meal()
        if self.path != '/lookup':
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8') if length else '{}'
            req = json.loads(body)
            name = (req.get('name') or '').strip()
            if not name:
                raise ValueError('请求缺少 name 字段')
            print(f'[lookup] "{name}"', flush=True)
            result = call_kimi(name)
            print(f'  → {result.get("name")} ({result.get("kcal")} kcal/100g) tokens={result.get("_tokens")}', flush=True)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        except urllib.error.HTTPError as e:
            err_body = ''
            try:
                err_body = e.read().decode('utf-8', errors='replace')
            except Exception:
                pass
            print(f'[error] Kimi HTTP {e.code}: {err_body[:300]}', flush=True)
            self.send_response(502)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'Kimi API HTTP {e.code}',
                'detail': err_body[:500],
            }).encode())
        except urllib.error.URLError as e:
            print(f'[error] URLError: {e.reason}', flush=True)
            self.send_response(504)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'网络错误: {e.reason}'}).encode())
        except json.JSONDecodeError as e:
            print(f'[error] LLM 返回非 JSON: {e}', flush=True)
            self.send_response(502)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'LLM 返回的不是有效 JSON'}).encode())
        except Exception as e:
            print(f'[error] {type(e).__name__}: {e}', flush=True)
            self.send_response(500)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def _handle_generate_meal(self):
        try:
            ip = (self.headers.get('X-Forwarded-For', '').split(',')[0].strip() or self.client_address[0])
            if not _rate_ok(ip):
                self.send_response(429); self._send_cors_headers()
                self.send_header('Content-Type', 'application/json; charset=utf-8'); self.end_headers()
                self.wfile.write(json.dumps({'error': '今天生成次数到上限了，明天再来～'}, ensure_ascii=False).encode('utf-8'))
                return
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8') if length else '{}'
            req = json.loads(body)
            meal_name = req.get('meal_name', '主餐')
            targets = req.get('targets', {})
            constraints = req.get('constraints', {})
            print(f'[recipe] {meal_name} - targets {targets}', flush=True)
            result = call_recipe(meal_name, targets, constraints)
            print(f'  → {result.get("dish_name")} ({len(result.get("ingredients", []))} 食材) tokens={result.get("_tokens")}', flush=True)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            print(f'[recipe error] {type(e).__name__}: {e}', flush=True)
            self.send_response(500)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    # 抑制默认的访问日志（我们自己 print）
    def log_message(self, *args, **kwargs):
        pass


def main():
    print('=' * 50)
    print(f'LLM proxy 启动 ({PROVIDER})')
    print(f'  监听: http://{HOST}:{PORT}  (托管: HOST=0.0.0.0 / ALLOW_ORIGIN=站点 / RATE_LIMIT=次数; 当前限流={RATE_LIMIT or "off"})')
    print(f'  API key: sk-...{API_KEY[-6:]} ({len(API_KEY)} 字符)')
    print(f'  Model: {MODEL_NAME}')
    print(f'  停止: Ctrl+C')
    print('=' * 50)
    try:
        with http.server.ThreadingHTTPServer((HOST, PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止。')
    except OSError as e:
        if 'Address already in use' in str(e):
            print(f'\nERROR: 端口 {PORT} 被占。可能已经有 proxy 在跑（其他终端窗口？）', file=sys.stderr)
            print(f'查找占用: lsof -i :{PORT}', file=sys.stderr)
        else:
            raise


if __name__ == '__main__':
    main()
