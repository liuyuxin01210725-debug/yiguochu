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
import copy
import json
import math
import os
import re
import socketserver
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

PORT = int(os.environ.get('PORT', 8765))
HOST = os.environ.get('HOST', '127.0.0.1')  # 托管时设环境变量 HOST=0.0.0.0
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_FILE = SCRIPT_DIR / '.env'
RECIPE_LIBRARY_FILE = SCRIPT_DIR / 'tools' / 'data' / 'recipe-library.json'

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

SYSTEM = '你是中国食物营养专家。返回严格 JSON 营养数据，不要任何 JSON 外的解释文字。考虑食材的真实搭配习惯、口味协调、烹饪可行性。'

# 本地开发生成契约；worker/src/worker.js 是权威源。
RECIPE_SYSTEM = '''你是家常菜专家+营养师, 熟悉《中国居民膳食指南(2022)》。
你的任务: 生成一道【一日量】的简单家常单品(一锅/一碗即可吃完, 可分 1-2 顿), 一份基本覆盖全天营养主结构(主食+蛋白+多种蔬菜)。
核心要求:
- 菜品形式和菜系都要轮换, 别每次都是中式菜饭。形式换着来: 菜饭/煲仔饭/焖饭、盖浇饭、日式丼饭、石锅拌饭、汤面/汤粉/汤米线、一锅炖菜/烩菜/杂烩汤、家庭一锅煮/麻辣烫式、杂粮谷物碗、咖喱烩饭、印尼炒饭式炒饭、泰式椰浆咖喱烩饭、越式/中式凉拌碗(grain bowl)等。
- 菜系也轮换: 中式家常/泰式/日式/韩式/越南/印尼/粤式 之间换着来——任何国家"一锅或一碗装、多食材、家庭可做"的主餐都符合一锅出。异国成品复合酱(绿咖喱酱/叻沙酱/甜酱油等)钠和热量不可忽略, 一律限1.5勺、其营养标 est 不当权威值现编; 能用"酱油+糖"等基础调味料替代的就替代。
- 排除真火锅, 以及需要特殊高汤/长时间备料/复杂火候的版本。
- 一锅煮 OR 电饭锅 OR 简单炒制 OR 蒸 OR 出锅后凉拌(冷制碗); 烹饪要简单可行。
- 硬约束: 总时长 <= 40 分钟, 做法 <= 4 步, 难度 <= 2; 优先电饭锅/一锅出, 不要另起锅做第二道菜。
- 营养尽量贴近全天目标; 蛋白/纤维/钙优先; 不要奇葩组合。
- **热量硬要求(落实到克数)**: 整锅总热量须达到目标的85%以上。具体: 主食给足(熟饭/熟面/熟杂粮合计≥400g, 或生米生面≥180g, 或薯类≥500g), 蛋白食材(肉/鱼/蛋/豆制品)合计≥250g, 烹调油8-15g。常见错误是只给一锅蔬菜的热量(约800kcal)——那只有目标一半, 不合格。
- **不得依赖提前准备**: 步骤里禁止出现「提前煮好/提前过夜」; 主食要么把烹煮时间计入总时长, 要么明确写用剩饭或免煮快熟主食(如燕麦/快煮杂粮包)。
- **主蛋白必须轮换**: 在 鱼/虾/鸡/鸭/猪/牛/蛋/豆制品 之间换着来, 不要连续几次或总是同一种, **尤其不要默认三文鱼**; 一道菜主蛋白选 1-2 种即可。
- 食材至少 8-10 种, 含主食 + 蛋白 + 3-5 种不同颜色/类型的蔬菜。
- 蔬菜总量尽量 >= 300g, 含绿叶菜、浅色蔬菜、根茎、菌菇、豆荚等不同类型。
- 一道菜总重 800-1500g, 用户可分 1-2 顿吃。
【冷拌/发酵碗(低频形式, 夏季或换口味时偶尔出, 约每5-6次一次)】
- 冷碗热量天生比热菜低, 但绝不能是"一碗菜叶"(≈800kcal=不合格)。靠三件套把它做成一份扎实正餐: ①熟主食≥400g(现成糙米饭/快煮杂粮包/燕麦/熟荞麦面, 偏轻就加到500g, 干米粉/干面≥120g); ②蛋白≥250g; ③必加一个高热量载体——牛油果半个 或 花生酱/芝麻酱约30g 或 坚果30g, 至少选一样; 主蛋白偏瘦(虾仁/鸡胸)时这条尤其不能省。沙拉汁里的油计入总油8-15g。
- 热量尽量堆高(靠加主食/牛油果/坚果, 绝不靠加蔬菜); 但即便达不到全天目标也别虚标营养值充数——按真实份量如实给, app 会如实提示"比一天目标略少"。
- 发酵碗(区别于普通沙拉)须含一样发酵食材(辣白菜/纳豆/酸奶/豆豉)作特色; 发酵益生菌食材必须"出锅后/装碗最后一步"拌入, 不得下锅加热(否则活菌失活)。
- 钠平衡: 用了发酵高钠食材(辣白菜≤120g/豆豉≤15g)时, 额外盐归零、不再加酱油, 用柠檬汁/醋/香料提味; note 里提示"含发酵食材钠偏高, 额外盐请减半或不加"。
- 凉拌也禁止"提前煮好/过夜", 主食烹煮时间计入总时长或用剩饭/免煮快熟主食。
严格 JSON 输出, 不要 JSON 外文字。'''

RECIPE_TEMPLATE = '''生成一道【{meal_name}】一日量的简单家常单品(一锅/一碗式, 形式见系统提示、别总是菜饭), 用户全天营养目标约: 热量{kcal}kcal/蛋白{p}g/纤维{fb}g/钙{ca}mg。(整锅总热量须≥目标的85%)
{constraint_note}{exclude_note}
{season_note}

【强制】食材至少 8 种, 蔬菜至少 3-4 种不同颜色/类型(绿叶/根茎/菌菇/豆荚轮换)。

{recipe_grounding}

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
  "form": "形式(焖饭/盖浇饭/丼饭/汤面/拌饭/一锅炖/grain bowl/凉拌碗等)",
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
- 单位: kcal=热量, p=蛋白g, fb=纤维g, mg=镁mg, k=钾mg, ca=钙mg, fe=铁mg, zn=锌mg, na=钠mg, vc=维C mg, vd=维D μg, w3=Omega-3 g。

【最终提交自检】
1. 双向一致：steps中的投入物都须在ingredients有同义name和数字grams，逐一复查食用油、盐、胡椒和留在成品中的水；洗、淘、泡后倒掉的水可不列。除获准小量香辛料外，每个ingredient须在steps出现。已选库存同时出现在ingredients与steps；未用库存不得出现在ingredients、steps或why。
2. 安全终点：每种生禽肉、猪肉、海鲜、普通鸡蛋都必须在含该ingredient原名的步骤写已达到的熟制终点；“表面变色”、只写时长或仅“米熟”不算。普通鸡蛋须写“鸡蛋熟透，蛋白和蛋黄完全凝固，不得流心”；只写蛋白凝固不算。
3. 一锅限时：全程只用一口烹饪容器；禁止提前、过夜或隐藏预处理。主食必须在steps中完成烹煮，或ingredient名明确写剩饭/即食；所有用时计入prep_minutes，steps≤4且总时长≤40分钟。
4. 过敏复核：重查忌口/过敏；其直接名称和带前后缀形态不得出现在模型JSON任何字段，例如米过敏时不得写“配米饭”。
只返回JSON，禁止JSON外文字。'''

NUTRIENT_KEYS = ('kcal', 'p', 'fb', 'mg', 'k', 'ca', 'fe', 'zn', 'na', 'vc', 'vd', 'w3')
NUTRIENT_MAX = {
    'kcal': 900, 'p': 100, 'fb': 100, 'mg': 1200, 'k': 5000, 'ca': 1500,
    'fe': 50, 'zn': 50, 'na': 40000, 'vc': 2000, 'vd': 50, 'w3': 60,
}
RECIPE_GROUNDING_TOKEN_RE = re.compile(r'\{recipe_grounding\}', re.IGNORECASE)
RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID = 'rice-allergy-complete-main'
_UNDEFINED = object()


class RecipeLibraryUnavailable(RuntimeError):
    """The trusted recipe library cannot serve this request."""


class NoSafeRecipe(RecipeLibraryUnavailable):
    """The trusted library has no reviewed rice-free complete main for these constraints."""


try:
    RECIPE_LIBRARY = json.loads(RECIPE_LIBRARY_FILE.read_text(encoding='utf-8'))
    if not isinstance(RECIPE_LIBRARY.get('recipes'), list) or not RECIPE_LIBRARY['recipes']:
        raise ValueError('recipe library is empty')
    RECIPE_LIBRARY_ERROR = None
except (OSError, ValueError, json.JSONDecodeError) as exc:
    RECIPE_LIBRARY = None
    RECIPE_LIBRARY_ERROR = exc


def get_recipe_library():
    if RECIPE_LIBRARY is None:
        raise RecipeLibraryUnavailable('可信菜谱库暂时不可用') from RECIPE_LIBRARY_ERROR
    return RECIPE_LIBRARY


def _js_string(value):
    if value is None or value is _UNDEFINED:
        return ''
    if value is True:
        return 'true'
    if value is False:
        return 'false'
    return str(value)


def sanitize_prompt_text(value, max_length=160):
    text = RECIPE_GROUNDING_TOKEN_RE.sub('', _js_string(value))
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:max_length]


def base_recipe_ingredient(name):
    text = _js_string(name).lower()
    text = re.sub(r'过敏|不吃|忌口|不要', '', text)
    text = text.replace('（', '(').replace('）', ')')
    text = re.sub(r'\(.*?\)', '', text)
    text = re.sub(r'[\s_-]+', '', text)
    return re.sub(r'[丁片块丝末粒]$', '', text)


def normalize_recipe_aliases(aliases):
    normalized = {}
    if not isinstance(aliases, dict):
        return normalized
    for raw_key, raw_value in aliases.items():
        key = base_recipe_ingredient(raw_key)
        value = base_recipe_ingredient(raw_value)
        if key and value and key not in normalized:
            normalized[key] = value
    return normalized


def resolve_recipe_alias(norm, aliases):
    path = []
    first_seen = {}
    current = norm
    while current in aliases:
        if current in first_seen:
            cycle = sorted(path[first_seen[current]:])
            return cycle[0] if cycle else current
        first_seen[current] = len(path)
        path.append(current)
        current = aliases[current]
    return current


def canonical_recipe_ingredient(name, aliases=None):
    return resolve_recipe_alias(base_recipe_ingredient(name), normalize_recipe_aliases(aliases or {}))


def recipe_constraint_list(value):
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = value.replace('，', ',').replace('、', ',').split(',')
    else:
        return []
    return [clean for item in items if (clean := sanitize_prompt_text(item, 80))]


def sanitize_recipe_constraints(value):
    source = value if isinstance(value, dict) else {}
    result = dict(source)
    recent = source.get('recent_ingredients')
    if isinstance(recent, dict):
        recent_clean = dict(recent)
        recent_clean['recent_proteins'] = recipe_constraint_list(recent.get('recent_proteins'))
        recent_clean['recent_veggies'] = recipe_constraint_list(recent.get('recent_veggies'))
        recent_clean['recent_carbs'] = recipe_constraint_list(recent.get('recent_carbs'))
        result['recent_ingredients'] = recent_clean
    result.update({
        'diet': sanitize_prompt_text(source.get('diet'), 20),
        'purpose': sanitize_prompt_text(source.get('purpose'), 20),
        'pantry': recipe_constraint_list(source.get('pantry')),
        'dislikes': recipe_constraint_list(source.get('dislikes')),
        'recent_dishes': recipe_constraint_list(source.get('recent_dishes')),
        'recent_families': recipe_constraint_list(source.get('recent_families')),
        'recent_base_recipes': recipe_constraint_list(source.get('recent_base_recipes')),
        'balance_low': recipe_constraint_list(source.get('balance_low')),
        'swap_hint': sanitize_prompt_text(source.get('swap_hint'), 160),
        'feedback_hint': sanitize_prompt_text(source.get('feedback_hint'), 160),
    })
    return result


def recipe_constraint_profile(recipe, profile_id):
    profiles = recipe.get('constraint_profiles') if isinstance(recipe, dict) else None
    if not isinstance(profiles, list):
        return None
    for profile in profiles:
        if (isinstance(profile, dict)
                and profile.get('id') == profile_id
                and isinstance(profile.get('basis'), str)):
            return {
                'id': profile['id'],
                'basis': profile['basis'].strip(),
            }
    return None


def select_recipe_candidates(library, constraints=None):
    library = library if isinstance(library, dict) else {}
    constraints = constraints if isinstance(constraints, dict) else {}
    rice_allergy_active = _validation_rice_allergen_active(
        constraints.get('dislikes'),
        library.get('ingredient_aliases') or {},
    )
    aliases = normalize_recipe_aliases(library.get('ingredient_aliases'))

    def canonical(name):
        return resolve_recipe_alias(base_recipe_ingredient(name), aliases)

    pantry = recipe_constraint_list(constraints.get('pantry'))
    dislikes = {item for name in recipe_constraint_list(constraints.get('dislikes')) if (item := canonical(name))}
    recent_families = set(recipe_constraint_list(constraints.get('recent_families')))
    recent_recipes = set(recipe_constraint_list(constraints.get('recent_base_recipes')))
    families = library.get('families') if isinstance(library.get('families'), list) else []
    family_by_id = {family.get('id'): family for family in families if isinstance(family, dict)}
    candidates = []

    recipes = library.get('recipes') if isinstance(library.get('recipes'), list) else []
    for recipe in recipes:
        if not isinstance(recipe, dict):
            continue
        qualified_constraint_profile = recipe_constraint_profile(
            recipe,
            RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID,
        )
        if rice_allergy_active and qualified_constraint_profile is None:
            continue
        constraint_profile = qualified_constraint_profile if rice_allergy_active else None
        core = {item for name in (recipe.get('core_ingredients') or []) if (item := canonical(name))}
        optional = {item for name in (recipe.get('optional_ingredients') or []) if (item := canonical(name))}
        slots = recipe.get('substitution_slots') if isinstance(recipe.get('substitution_slots'), list) else []
        allowed = {
            item
            for slot in slots if isinstance(slot, dict)
            for name in (slot.get('allowed') or [])
            if (item := canonical(name))
        }

        blocked_core = False
        for core_item in core:
            if core_item not in dislikes:
                continue
            replaceable = False
            for slot in slots:
                if not isinstance(slot, dict):
                    continue
                replaces = [canonical(name) for name in (slot.get('replaces') or [])]
                if core_item not in replaces:
                    continue
                for name in (slot.get('allowed') or []):
                    raw = _js_string(name).strip()
                    substitute = canonical(raw)
                    if (substitute and substitute != core_item and substitute not in dislikes
                            and not re.match(r'^不(?:放|加|用)', raw)):
                        replaceable = True
                        break
                if replaceable:
                    break
            if not replaceable:
                blocked_core = True
                break
        if blocked_core:
            continue

        discouraged = {
            item
            for rule in (recipe.get('discouraged') or []) if isinstance(rule, dict)
            for name in (rule.get('ingredients') or [])
            if (item := canonical(name))
        }
        score = 0
        used_pantry = []
        unused_pantry = []
        for item in pantry:
            canonical_item = canonical(item)
            if not canonical_item or canonical_item in dislikes:
                unused_pantry.append(item)
                continue
            if canonical_item in core:
                score += 12
                used_pantry.append(item)
            elif canonical_item in allowed or canonical_item in optional:
                score += 5
                used_pantry.append(item)
            else:
                unused_pantry.append(item)
            if canonical_item in discouraged:
                score -= 8

        if _js_string(constraints.get('purpose')) in (recipe.get('purposes') or []):
            score += 3
        if recipe.get('family_id') in recent_families:
            score -= 20
        if recipe.get('id') in recent_recipes:
            score -= 100
        candidates.append({
            'recipe': recipe,
            'family': family_by_id.get(recipe.get('family_id')),
            'ingredient_aliases': library.get('ingredient_aliases') or {},
            'score': score,
            'used_pantry': used_pantry,
            'unused_pantry': unused_pantry,
            'constraint_profile': constraint_profile,
        })

    candidates.sort(key=lambda item: (-item['score'], _js_string(item['recipe'].get('id'))))
    selected = []
    selected_ids = set()
    selected_families = set()
    for candidate in candidates:
        recipe_id = candidate['recipe'].get('id')
        family_id = candidate['recipe'].get('family_id')
        if recipe_id in selected_ids or family_id in selected_families:
            continue
        selected.append(candidate)
        selected_ids.add(recipe_id)
        selected_families.add(family_id)
        if len(selected) == 3:
            return selected
    for candidate in candidates:
        recipe_id = candidate['recipe'].get('id')
        if recipe_id in selected_ids:
            continue
        selected.append(candidate)
        selected_ids.add(recipe_id)
        if len(selected) == 3:
            break
    return selected


def _compact_recipe_list(value, fallback='无'):
    items = [sanitize_prompt_text(item, 240) for item in value] if isinstance(value, list) else []
    items = [item for item in items if item]
    return '、'.join(items) if items else fallback


def build_recipe_grounding(selection):
    selection = selection if isinstance(selection, dict) else {}
    recipe = selection.get('recipe') if isinstance(selection.get('recipe'), dict) else {}
    family = selection.get('family') if isinstance(selection.get('family'), dict) else {}
    slots = []
    for slot in recipe.get('substitution_slots') or []:
        if not isinstance(slot, dict):
            continue
        slots.append(
            f"{sanitize_prompt_text(slot.get('slot') or '替换位', 80)}"
            f"[{_compact_recipe_list(slot.get('replaces'))}→{_compact_recipe_list(slot.get('allowed'))}]"
        )
    discouraged = []
    for rule in recipe.get('discouraged') or []:
        if not isinstance(rule, dict):
            continue
        discouraged.append(
            f"{_compact_recipe_list(rule.get('ingredients'))}"
            f"({sanitize_prompt_text(rule.get('reason') or '不适合基础结构', 240)})"
        )
    family_line = f"菜谱家族: {sanitize_prompt_text(family.get('id') or recipe.get('family_id') or 'unknown', 100)} {sanitize_prompt_text(family.get('name'), 100)}".strip()
    recipe_line = f"基础菜谱: {sanitize_prompt_text(recipe.get('id') or 'unknown', 100)} {sanitize_prompt_text(recipe.get('name'), 100)}".strip()
    profile = selection.get('constraint_profile') if isinstance(selection.get('constraint_profile'), dict) else None
    profile_lines = []
    if profile:
        profile_lines = [
            f"受控完整主餐资格: {sanitize_prompt_text(profile.get('id'), 100)}",
            f"完整性依据: {sanitize_prompt_text(profile.get('basis'), 300)}",
            '稻米过敏安全模式: 严格沿用这张基础菜谱。不得添加或建议搭配任何额外主食，尤其不得出现大米、米饭、粥、米粉、米线、河粉、年糕、饭团或任何饭类菜名。',
        ]
    return '\n'.join([
        '【可信基础菜谱】',
        family_line,
        recipe_line,
        f"固定核心: {_compact_recipe_list(recipe.get('core_ingredients'))}",
        f"只允许以下替换: {_compact_recipe_list(slots)}",
        f"不鼓励: {_compact_recipe_list(discouraged)}",
        f"关键技法: {_compact_recipe_list(recipe.get('technique'))}",
        f"比例规则: {_compact_recipe_list(recipe.get('ratio_rules'))}",
        f"安全规则: {_compact_recipe_list(recipe.get('safety_rules'))}",
        f"已选库存: {_compact_recipe_list(selection.get('used_pantry'))}",
        f"舍弃库存: {_compact_recipe_list(selection.get('unused_pantry'))}",
        *profile_lines,
        '【输出完整性契约】',
        '除获准免提的小用量香辛料外，每个 ingredients[].name 必须至少在一个 steps[] 步骤中出现；优先逐字使用食材表名称。若做法改变形态，同一步必须同时写原名和形态，例如“鸡胸肉切成鸡丝”“大蒜切成蒜末”。',
        '食用油、盐、胡椒和留在成品中的水都必须在 ingredients 有同义 name 和数字 grams；洗、淘、泡后倒掉的水可不列。',
        f"服务器已选库存（{_compact_recipe_list(selection.get('used_pantry'))}）必须同时出现在 ingredients 与 steps；服务器舍弃库存（{_compact_recipe_list(selection.get('unused_pantry'))}）必须同时从 ingredients 与 steps 排除。",
        '生的禽肉、猪肉、海鲜和普通鸡蛋必须在相关食材所在步骤写明安全熟制终点，只可用“熟透”“中心不见粉红”“煮熟”“炒熟”“煎熟”“焖熟”“炖熟”或“蒸熟”等明确词；对鸡肉，“表面变色”、只有时长或仅“米熟”均不算。',
        '全程只用一口烹饪容器，不得另起或使用其他锅、平底锅。',
        '返回 JSON 前逐项自查以上跨字段契约；JSON 外不要输出任何文字。',
        '不合适的库存食材不要使用；why可笼统写“有库存不适合”，但不得重复或点名任何舍弃食材。',
        '你必须以这张基础菜谱为底稿，只能在允许替换列表内改动。库存食材不合适时必须舍弃，不得为了全用而改变菜谱结构。来源字段由服务器添加，你不要编造来源。',
    ])


def _validation_ingredient_names(meal):
    if not isinstance(meal, dict) or not isinstance(meal.get('ingredients'), list):
        return []
    names = []
    for item in meal['ingredients']:
        if isinstance(item, str):
            name = item.strip()
        elif isinstance(item, dict):
            name = _js_string(item.get('name')).strip()
        else:
            name = ''
        if name:
            names.append(name)
    return names


def _validation_steps(meal):
    if not isinstance(meal, dict) or not isinstance(meal.get('steps'), list):
        return []
    return [step.strip() for step in meal['steps'] if isinstance(step, str) and step.strip()]


def _validation_seasoning(name):
    norm = re.sub(r'\s+', '', _js_string(name))
    return bool(re.match(r'^(?:生?姜(?:末|片|丝)?|[大小香]?葱(?:花|段|末)?|蒜(?:头|末|蓉|泥|片)?|(?:白|陈|香|米|果)?醋|料酒|.*香料)$', norm))


def _validation_form_name(name):
    return re.sub(r'[\s_-]+', '', _js_string(name).lower().replace('（', '(').replace('）', ')'))


_VALIDATION_CANONICAL_FORMS = {
    '鸡腿肉去骨': '鸡腿肉',
    '白蘑菇': '蘑菇',
    '干黑眼豆': '黑眼豆',
    '红甜椒': '甜椒',
}


def _validation_canonical_ingredient(name, aliases):
    bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    return canonical_recipe_ingredient(_VALIDATION_CANONICAL_FORMS.get(bare, name), aliases)


_VALIDATION_RICE_ALLERGEN_ACTIVATORS = {
    '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
    '米饭', '白米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭',
    '剩米饭', '隔夜米饭', '即食米饭',
}
_VALIDATION_RICE_ALLERGEN_TOKENS = sorted([
    '隔夜米饭', '即食米饭', '剩余米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭', '白米饭', '剩米饭',
    '大米粥', '糙米粥', '糙米粉',
    '煲仔饭', '盖浇饭', '咖喱饭', '香料饭', '番茄饭',
    '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
    '米饭', '白粥', '米粥', '米粉', '米浆', '米糊', '米线', '河粉', '米皮',
    '年糕', '糍粑', '饭团', '焖饭', '炒饭', '烩饭', '泡饭', '汤饭', '菜饭', '丼饭',
], key=lambda item: -len(item))
_VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE = re.compile(r'(?:小|玉|薏|粱)$')
_VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE = re.compile(r'^(?:椒|醋|酒)')
_VALIDATION_RICE_ALLERGEN_NEGATION_RE = re.compile(
    r'(?:不(?:使用|含|要|放|加|配|吃|选|用)|无需(?:使用|加入|搭配)?'
    r'|避免(?:使用|选择|加入|搭配)?|去掉|排除|无)(?:任何|额外|所有|全部)?$'
)
_VALIDATION_RICE_GENERIC_TOKENS = {'米饭', '米粥', '米粉', '米浆', '米糊', '米线'}
_VALIDATION_RICE_RAW_TOKENS = {'大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米'}


def _validation_rice_allergen_active(dislikes, aliases):
    for name in recipe_constraint_list(dislikes):
        bare = base_recipe_ingredient(name)
        canonical = _validation_canonical_ingredient(name, aliases)
        if canonical == '大米' or bare in _VALIDATION_RICE_ALLERGEN_ACTIVATORS:
            return True
    return False


def _validation_rice_allergen_fields(meal):
    meal = meal if isinstance(meal, dict) else {}
    fields = []

    def push(value, display=''):
        if not isinstance(value, str):
            return
        text = _validation_form_name(value)
        if text:
            fields.append({'text': text, 'display': display})

    push(meal.get('dish_name'))
    for item in meal.get('ingredients') if isinstance(meal.get('ingredients'), list) else []:
        if isinstance(item, str):
            push(item, item.strip())
        elif isinstance(item, dict) and isinstance(item.get('name'), str):
            push(item['name'], item['name'].strip())
    for step in meal.get('steps') if isinstance(meal.get('steps'), list) else []:
        push(step)
    push(meal.get('note'))
    push(meal.get('taste_preview'))
    push(meal.get('form'))
    push(meal.get('why'))
    for tag in meal.get('flavor_tags') if isinstance(meal.get('flavor_tags'), list) else []:
        push(tag)
    return fields


def _validation_rice_allergen_token_blocked(text, index, token):
    prefix = text[max(0, index - 18):index]
    suffix = text[index + len(token):]
    if _VALIDATION_RICE_ALLERGEN_NEGATION_RE.search(prefix):
        return True
    if (token in _VALIDATION_RICE_GENERIC_TOKENS
            and _VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE.search(prefix)):
        return True
    if (token in _VALIDATION_RICE_RAW_TOKENS
            and _VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE.search(suffix)):
        return True
    return False


def _validation_rice_allergen_matches(text):
    matches = []
    index = 0
    while index < len(text):
        token = next((
            candidate for candidate in _VALIDATION_RICE_ALLERGEN_TOKENS
            if text.startswith(candidate, index)
        ), None)
        if token is None:
            index += 1
            continue
        if not _validation_rice_allergen_token_blocked(text, index, token):
            matches.append(token)
        index += len(token)
    return matches


def _validation_rice_allergen_flags(meal, dislikes, aliases):
    if not _validation_rice_allergen_active(dislikes, aliases):
        return []
    flags = []
    seen = set()
    for field in _validation_rice_allergen_fields(meal):
        matches = _validation_rice_allergen_matches(field['text'])
        if not matches:
            continue
        displays = [field['display']] if field['display'] else matches
        for display in displays:
            flag = f'allergen_present:{display}'
            if flag not in seen:
                seen.add(flag)
                flags.append(flag)
    return flags


_VALIDATION_COOKING_OIL_NAMES = {
    '烹调油', '植物油', '食用油', '食用植物油', '蔬菜油', '菜籽油', '花生油', '大豆油', '玉米油',
    '橄榄油', '葵花籽油', '葵花油', '米糠油', '稻米油', '色拉油', '调和油', '芝麻油', '香油', '猪油', '牛油', '黄油',
    '椰子油', '棕榈油', '葡萄籽油', '亚麻籽油',
}
_VALIDATION_SALT_NAMES = {'盐', '食盐', '海盐', '低钠盐'}
_VALIDATION_PEPPER_NAMES = {'胡椒', '胡椒粉', '黑胡椒', '黑胡椒粉', '白胡椒', '白胡椒粉'}
_VALIDATION_WATER_NAMES = {'水', '清水', '饮用水', '凉开水', '温水', '热水'}
_VALIDATION_SALT_TOKEN_SOURCE = r'(?:食盐|海盐|低钠盐|盐)(?!水)'
_VALIDATION_PEPPER_TOKEN_SOURCE = r'(?:黑胡椒粉|白胡椒粉|胡椒粉|黑胡椒|白胡椒|胡椒)'
_VALIDATION_SEASONING_TOKEN_SOURCE = (
    rf'(?:{_VALIDATION_SALT_TOKEN_SOURCE}|{_VALIDATION_PEPPER_TOKEN_SOURCE})'
)
_VALIDATION_SEASONING_INPUT_RE = re.compile(
    rf'(?:加入?|放入?|撒入?|撒上?|调入?|拌入?|下)'
    rf'(?:根据口味|按口味|少许|适量|一点|些许)?{_VALIDATION_SEASONING_TOKEN_SOURCE}'
    rf'(?:(?:和|及|、){_VALIDATION_SEASONING_TOKEN_SOURCE})*(?:调味)?'
    rf'|(?:用)?(?:少许|适量|一点|些许)?{_VALIDATION_SEASONING_TOKEN_SOURCE}'
    rf'(?:(?:和|及|、){_VALIDATION_SEASONING_TOKEN_SOURCE})*调味'
)
_VALIDATION_SALT_TOKEN_RE = re.compile(_VALIDATION_SALT_TOKEN_SOURCE)
_VALIDATION_PEPPER_TOKEN_RE = re.compile(_VALIDATION_PEPPER_TOKEN_SOURCE)
_VALIDATION_RETAINED_WATER_ACTION_RE = re.compile(
    r'(?:加入?|倒入?|放入?|添入?|注入?|兑入?|补入?|加)'
    r'(?:[^，,。；;！？!?]{0,32}?)(?:饮用水|凉开水|温水|热水|清水|水)(?!淀粉|果|油|产)'
)
_VALIDATION_WATER_DISCARD_RE = re.compile(r'(?:倒掉|弃去|滤掉|沥干|倒出)')
_VALIDATION_NEXT_CLAUSE_WATER_DISCARD_RE = re.compile(
    r'^(?:(?:再|然后|随后|接着))?'
    r'(?:(?:将|把)(?:焯水|水|汤|汤汁|液体)(?:全部)?(?:倒掉|弃去|滤掉|倒出)'
    r'|(?:倒掉|弃去|滤掉|倒出)(?:焯水|水|汤|汤汁|液体)|沥干)'
)
_VALIDATION_COOKING_OIL_ACTION_RE = re.compile(
    r'(?:热油(?!菜)|(?:加入?|下|倒入?|放入?|淋入?|刷上?|抹上?|(?<!食)用|留底)(?:少许|适量|一点|些许)?(?:'
    + '|'.join(sorted((re.escape(name) for name in _VALIDATION_COOKING_OIL_NAMES), key=len, reverse=True))
    + r'|油)(?!菜))'
)
_VALIDATION_GENERIC_COOKING_OIL_ACTION_RE = re.compile(
    r'(?:热油(?!菜)|(?:加入?|下|倒入?|放入?|淋入?|刷上?|抹上?|(?<!食)用|留底)'
    r'(?:少许|适量|一点|些许)?油(?!菜))'
)
_VALIDATION_ACTION_NEGATION_RE = re.compile(
    r'(?:不需要|无需|不用|不要|避免|禁止|切勿|不可|未|不)'
    r'(?:(?:再|另行)?(?:另(?:起|取|用)(?:一口|一只|一个|一)?|使用|用|加|放|下|倒入?|刷上?|抹上?|留底)?)?$'
)


def _validation_action_negated(text, action_index):
    prefix = _js_string(text)[max(0, action_index - 18):action_index]
    return bool(_VALIDATION_ACTION_NEGATION_RE.search(prefix))


def _validation_active_action_matches(text, pattern):
    return [match for match in pattern.finditer(_js_string(text))
            if not _validation_action_negated(text, match.start())]


def _validation_controlled_tokens(name):
    normalized = _validation_form_name(name)
    bare = re.sub(r'\(.*?\)', '', normalized)
    if bare == '鸡胸肉':
        return ['鸡肉', '鸡丝', '鸡丁', '鸡块', '鸡片']
    if bare in ('去骨鸡腿肉', '鸡腿肉', '鸡腿肉去骨'):
        return ['鸡腿肉', '鸡肉', '鸡丝', '鸡丁', '鸡块', '鸡片']
    if bare in ('猪瘦肉', '瘦猪肉'):
        return ['猪肉', '瘦肉', '里脊', '肉丝', '肉丁', '肉片', '肉块']
    if bare == '大米':
        return ['米饭', '米']
    if bare == '大蒜':
        return ['蒜蓉', '蒜末', '蒜']
    if bare in _VALIDATION_COOKING_OIL_NAMES:
        return ['油']
    if bare in _VALIDATION_SALT_NAMES:
        return list(_VALIDATION_SALT_NAMES)
    if bare in _VALIDATION_PEPPER_NAMES:
        return list(_VALIDATION_PEPPER_NAMES)
    if bare in _VALIDATION_WATER_NAMES:
        return list(_VALIDATION_WATER_NAMES)
    if '白芸豆' in bare and re.search(r'(?:罐头|罐装|沥干)', normalized):
        return ['白芸豆']
    if '白豆' in bare and re.search(r'(?:罐头|罐装|沥干)', normalized):
        return ['白豆']
    return []


def _validation_prepared_high_risk_exemption(name):
    return bool(re.fullmatch(r'(?:鸡高汤|高汤\(鸡高汤\)|浓缩鸡汤|皮蛋)', _validation_form_name(name)))


def _validation_cooking_oil_ingredient(name):
    bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    return bare == '油' or bare in _VALIDATION_COOKING_OIL_NAMES


def _validation_ingredient_matches_names(name, names):
    bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    return bare in names


def _validation_step_uses_seasoning_group(step, token_re):
    text = _validation_form_name(step)
    for match in _VALIDATION_SEASONING_INPUT_RE.finditer(text):
        if not _validation_action_negated(text, match.start()) and token_re.search(match.group(0)):
            return True
    return False


def _validation_step_uses_retained_water(step):
    text = _validation_form_name(step)
    clauses = [clause for clause in re.split(r'[，,。；;！？!?]+', text) if clause]
    for clause_index, clause in enumerate(clauses):
        for match in _VALIDATION_RETAINED_WATER_ACTION_RE.finditer(clause):
            if _validation_action_negated(clause, match.start()):
                continue
            discarded_in_clause = _VALIDATION_WATER_DISCARD_RE.search(clause[match.end():])
            next_clause = clauses[clause_index + 1] if clause_index + 1 < len(clauses) else ''
            discarded_next = _VALIDATION_NEXT_CLAUSE_WATER_DISCARD_RE.search(next_clause)
            if not discarded_in_clause and not discarded_next:
                return True
    return False


def _validation_step_uses_cooking_oil(step):
    text = _validation_form_name(step)
    return bool(_validation_active_action_matches(text, _VALIDATION_COOKING_OIL_ACTION_RE))


def _validation_search_tokens(name, aliases):
    canonical = _validation_canonical_ingredient(name, aliases)
    target_bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    tokens = {item for item in (base_recipe_ingredient(name), canonical, *_validation_controlled_tokens(name)) if item}
    if isinstance(aliases, dict):
        for alias in aliases:
            alias_token = base_recipe_ingredient(alias)
            conflicting_pepper_color = target_bare == '红甜椒' and re.fullmatch(
                r'(?:青椒|彩椒|(?:[黄绿橙紫白黑蓝]|彩色|多彩|五彩)甜椒)', alias_token
            )
            if not conflicting_pepper_color and _validation_canonical_ingredient(alias, aliases) == canonical:
                tokens.add(alias_token)
    if '鸡蛋' in tokens:
        tokens.add('蛋液')
    if '蛋液' in tokens:
        tokens.add('鸡蛋')
    return sorted((item for item in tokens if item), key=lambda item: -len(item))


_VALIDATION_NEGATED_RE = re.compile(r'(?:不加|不放|不用|不使用|未加|未放|无|免加|无需)(?:任何|额外|一点|少许)?$')
_VALIDATION_COOKED_RE = re.compile(r'(?:中心(?:不见|无)粉红色?|煮沸|煮熟|煎熟|炒熟|焖熟|炖熟|蒸熟|烧开|熟透|熟)')
_VALIDATION_COOKED_NEGATION_RE = re.compile(r'(?:并非|不是|仍不|尚未|还未|还没|未|没有|没能|不能|无法)(?:已经|已|完全|彻底|真正|实际)*(?:达到|达|确认|保证)?$')
_VALIDATION_UNHEATED_RELATION_RE = re.compile(r'(?:备用|放一旁|最后拌入|出锅后加入|盛出后加入|装盘后加入)')
_VALIDATION_DELAYED_ADD_RE = re.compile(r'(?:后加入|后放入|后拌入|再加入|再放入|再拌入)$')
_VALIDATION_FUTURE_COOKING_SUFFIX_RE = re.compile(r'^(?:需(?:要)?后续|稍后|待会(?:儿)?|之后再|后续再?|随后再)')
_VALIDATION_INCOMPLETE_COOKING_SUFFIX_RE = re.compile(r'^(?:(?:的)?(?:状态|标准|程度)?(?:仍|还|尚)?(?:未|没)(?:完全|彻底|真正|实际)?(?:达到|达成|确认|实现)?|(?:的)?(?:状态|标准|目标)?(?:仍|还|尚)?(?:预计|预期|计划|准备)(?:达到|达成|确认|实现)?)')
_VALIDATION_PLANNED_COOKED_PREFIX_RE = re.compile(r'应(?:当|该)?$')
_VALIDATION_FUTURE_COOKING_MARKER_RE = re.compile(r'(?:需(?:要)?后续|稍后|待会(?:儿)?|之后再|后续再?|随后再|(?:未来|将来)(?:应|要|会|将|需)?|(?:预计|预期|计划|准备)(?:会|要|将|达到|达成|确认|实现|煮至|煮到|煮|炒|焖|炖|蒸|烧|加热)?|应(?:当|该)?(?:再)?(?:达到|达成|确认|实现|煮至|煮到|煮|炒|焖|炖|蒸|烧|加热))')
_VALIDATION_EGG_NOT_COAGULATED_RE = re.compile(r'(?:鸡蛋|蛋液|蛋黄)(?:仍|还|尚|依然)?(?:未|没(?:有)?)(?:完全|充分|彻底)?凝固')
_VALIDATION_EGG_SOFT_STATE_RE = re.compile(r'(?:流心|溏心|半熟)')
_VALIDATION_EGG_SOFT_STATE_NEGATION_RE = re.compile(r'(?:不是|没有|不再|不|无|非|避免|防止|拒绝|杜绝|不要|不得|不可|不能|切勿|别)(?:做成?|成为|出现|保持|带有|有)?$')
_VALIDATION_EGG_SOFT_STATE_SUBJECT_RE = re.compile(r'(?:鸡蛋|蛋液|蛋黄)(?:仍|还|尚|依然|略|微|稍|有点|呈|为|保持|处于|达到|至|到)?$')
_VALIDATION_EGG_SAFE_RECOVERY_STATE_RE = re.compile(r'(?:(?:蛋白(?:和|与|及|、)蛋黄)|蛋黄|鸡蛋|蛋液)(?:均|都|已经|已)?(?:完全|充分|彻底)凝固|(?:鸡蛋|蛋液|蛋黄)(?:已经|已)?(?:不再|没有|不是)流心(?:蛋)?')
_VALIDATION_EGG_HEATING_ACTION_RE = re.compile(r'(?:再(?:继续)?|继续|重新|随后|然后)?(?:加热|煮|焖|蒸|炒|煎)')
_VALIDATION_EGG_PLANNED_HEATING_PREFIX_RE = re.compile(r'(?:计划|预计|预期|准备)(?:稍后|随后|之后|后续)?(?:要|将|会)?$')
_VALIDATION_EGG_RECOVERY_WINDOW = 24
_VALIDATION_MULTI_POT_RE = re.compile(r'(?:另(?:起|取|用)(?:一口|一只|一个|一)?|另一口|第二口)(?:炒锅|平底锅|汤锅|锅)')
_VALIDATION_GENERIC_MEAT_FORMS = {'肉丝', '肉丁', '肉片', '肉块'}
_VALIDATION_GENERIC_MEAT_BOUNDARY_RE = re.compile(r'(?:切成|切为|改刀成|将|把|放入|加入|下入|倒入|取|成)$')


def _validation_generic_meat_form_allowed(text, index):
    if index == 0:
        return True
    prefix = text[:index]
    clause_prefix = re.split(r'[，,。；;！？!?]', prefix)[-1]
    if not clause_prefix:
        return True
    boundary = _VALIDATION_GENERIC_MEAT_BOUNDARY_RE.search(clause_prefix)
    if not boundary:
        return False
    source_prefix = clause_prefix[:boundary.start()]
    for source in re.finditer(r'[\u3400-\u9fff]肉', source_prefix):
        through_source = source_prefix[:source.end()]
        if not re.search(r'(?:猪瘦肉|瘦猪肉|猪肉|瘦肉)$', through_source):
            return False
    return True


def _validation_token_positions(text, token):
    positions = []
    active_oil_positions = ({match.start() + match.group(0).rfind('油')
                             for match in _validation_active_action_matches(text, _VALIDATION_GENERIC_COOKING_OIL_ACTION_RE)}
                            if token == '油' else None)
    offset = 0
    while offset <= len(text) - len(token):
        index = text.find(token, offset)
        if index < 0:
            break
        prefix = text[max(0, index - 10):index]
        negated = bool(_VALIDATION_NEGATED_RE.search(prefix))
        blocked_short_form = token in ('米', '米饭') and index > 0 and text[index - 1] in '玉小'
        blocked_garlic_green = token == '蒜' and re.match(r'(?:苗|苔|薹)', text[index + len(token):])
        blocked_chicken_species = (token in ('鸡腿肉去骨', '鸡腿肉', '鸡肉', '鸡丝', '鸡丁', '鸡块', '鸡片')
                                   and index > 0 and text[index - 1] == '火')
        blocked_generic_meat_form = (token in _VALIDATION_GENERIC_MEAT_FORMS
                                     and not _validation_generic_meat_form_allowed(text, index))
        blocked_pork_species = (token in ('猪肉', '瘦肉', '里脊')
                                and index > 0 and text[index - 1] in '牛羊鸡鸭鹅鱼')
        blocked_cooking_oil = token == '油' and index not in active_oil_positions
        token_suffix = text[index + len(token):]
        token_prefix = text[index - 1] if index > 0 else ''
        blocked_consumable_compound = (
            (token == '盐' and re.match(r'水', token_suffix))
            or (token == '水' and re.match(r'(?:淀粉|果|油|产)', token_suffix))
        )
        blocked_controlled_form = (
            (token in ('白蘑菇', '干黑眼豆', '红甜椒', '蘑菇', '黑眼豆', '甜椒')
             and re.match(r'(?:酱|粉|汤料)', token_suffix))
            or (token == '蘑菇' and bool(token_prefix) and token_prefix in '白毒')
            or (token == '黑眼豆' and token_prefix == '干')
            or (token == '甜椒' and bool(token_prefix) and token_prefix in '红青黄绿橙紫白黑蓝彩色')
        )
        if (not negated and not blocked_short_form and not blocked_garlic_green
                and not blocked_chicken_species and not blocked_generic_meat_form
                and not blocked_pork_species and not blocked_cooking_oil
                and not blocked_consumable_compound and not blocked_controlled_form):
            positions.append(index)
        offset = index + len(token)
    return positions


def _validation_step_mentions(step, name, aliases):
    text = re.sub(r'[\s_-]+', '', _js_string(step).lower().replace('（', '(').replace('）', ')'))
    return any(_validation_token_positions(text, token) for token in _validation_search_tokens(name, aliases))


def _validation_clause_cooks_target(clause, name, aliases):
    text = re.sub(r'[\s_-]+', '', _js_string(clause).lower().replace('（', '(').replace('）', ')'))
    target_positions = [
        position
        for token in _validation_search_tokens(name, aliases)
        for position in _validation_token_positions(text, token)
    ]
    unheated_relation = _VALIDATION_UNHEATED_RELATION_RE.search(text)
    for cooked in _VALIDATION_COOKED_RE.finditer(text):
        cooked_end = cooked.end()
        cooked_prefix = text[:cooked.start()]
        future_prefix = cooked_prefix
        future_suffix = text[cooked_end:cooked_end + 16]
        if (_VALIDATION_FUTURE_COOKING_MARKER_RE.search(future_prefix)
                or _VALIDATION_FUTURE_COOKING_SUFFIX_RE.search(future_suffix)):
            continue
        if (_VALIDATION_PLANNED_COOKED_PREFIX_RE.search(future_prefix)
                and re.match(r'(?:煮熟|煎熟|炒熟|焖熟|炖熟|蒸熟|熟透|熟)', cooked.group(0))):
            continue
        if _VALIDATION_INCOMPLETE_COOKING_SUFFIX_RE.search(future_suffix):
            continue
        if _VALIDATION_COOKED_NEGATION_RE.search(cooked_prefix):
            continue
        if unheated_relation and unheated_relation.start() <= cooked.start():
            continue
        target_is_rice = any(token in ('大米', '米饭', '米') for token in _validation_search_tokens(name, aliases))
        if not target_is_rice and re.search(r'(?:大米|米饭|米|饭)(?:(?:完全|彻底|全部|基本|已经|已))*$', cooked_prefix):
            continue
        belongs_to_earlier = any(
            target_index >= cooked_end
            and _VALIDATION_DELAYED_ADD_RE.search(text[cooked_end:target_index])
            for target_index in target_positions
        )
        if not belongs_to_earlier:
            return True
    return False


def _validation_ordinary_egg_ingredient(name, aliases):
    bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    canonical = _validation_canonical_ingredient(name, aliases)
    return bare in ('鸡蛋', '蛋液') or canonical in ('鸡蛋', '蛋液')


def _validation_ordinary_egg_incomplete_states(text):
    states = [(match.start(), match.end()) for match in _VALIDATION_EGG_NOT_COAGULATED_RE.finditer(text)]
    for match in _VALIDATION_EGG_SOFT_STATE_RE.finditer(text):
        prefix = text[max(0, match.start() - 16):match.start()]
        suffix = text[match.end():match.end() + 4]
        if _VALIDATION_EGG_SOFT_STATE_NEGATION_RE.search(prefix):
            continue
        standalone_egg_state = (suffix.startswith('蛋')
                                or (match.group(0) == '溏心' and re.match(r'(?:状态|程度)', suffix)))
        if (not _VALIDATION_EGG_SOFT_STATE_SUBJECT_RE.search(prefix)
                and not standalone_egg_state):
            continue
        states.append((match.start(), match.end()))
    return sorted(states)


def _validation_ordinary_egg_safe_recovery(tail, name, aliases, ingredient_names):
    target = _validation_canonical_ingredient(name, aliases)
    other_ingredients = [
        other for other in ingredient_names
        if _validation_canonical_ingredient(other, aliases) != target
    ]
    clauses = [part.strip() for part in re.split(r'[，,。；;！！？!?]+', tail) if part.strip()]
    for clause in clauses:
        for state in _VALIDATION_EGG_SAFE_RECOVERY_STATE_RE.finditer(clause):
            action_start = max(0, state.start() - _VALIDATION_EGG_RECOVERY_WINDOW)
            action_window = clause[action_start:state.start()]
            actions = list(_VALIDATION_EGG_HEATING_ACTION_RE.finditer(action_window))
            if not actions:
                continue
            action = actions[-1]
            action_index = action_start + action.start()
            if _validation_action_negated(clause, action_index):
                continue
            planned_prefix = clause[max(0, action_index - 16):action_index]
            if _VALIDATION_EGG_PLANNED_HEATING_PREFIX_RE.search(planned_prefix):
                continue
            action_end = action_index + len(action.group(0))
            action_prefix = clause[:action_end]
            binding_span = clause[action_index:state.end()]
            egg_named_before_action = bool(re.search(r'(?:鸡蛋|蛋液|蛋黄)', action_prefix))
            other_named_before_action = any(
                _validation_step_mentions(action_prefix, other, aliases)
                for other in other_ingredients
            )
            other_named_in_binding_span = any(
                _validation_step_mentions(binding_span, other, aliases)
                for other in other_ingredients
            )
            if other_named_in_binding_span or (other_named_before_action and not egg_named_before_action):
                continue
            return True
    return False


def _validation_ordinary_egg_unsafe_final_state(name, steps, aliases, ingredient_names):
    if not _validation_ordinary_egg_ingredient(name, aliases):
        return False
    text = '。'.join(_validation_form_name(step) for step in steps)
    states = _validation_ordinary_egg_incomplete_states(text)
    if not states:
        return False
    tail = text[states[-1][1]:]
    return not _validation_ordinary_egg_safe_recovery(tail, name, aliases, ingredient_names)


def _validation_high_risk_cooked(name, steps, aliases, ingredient_names):
    if _validation_ordinary_egg_unsafe_final_state(name, steps, aliases, ingredient_names):
        return False
    target = _validation_canonical_ingredient(name, aliases)
    other_ingredients = [
        other for other in ingredient_names
        if _validation_canonical_ingredient(other, aliases) != target
    ]
    for step in steps:
        clauses = [part.strip() for part in re.split(r'[，,。；;！？!?]+', step) if part.strip()]
        for index, clause in enumerate(clauses):
            if not _validation_step_mentions(clause, name, aliases):
                continue
            if _validation_clause_cooks_target(clause, name, aliases):
                return True
            if _VALIDATION_UNHEATED_RELATION_RE.search(clause):
                continue
            next_clause = clauses[index + 1] if index + 1 < len(clauses) else ''
            next_names_other = any(_validation_step_mentions(next_clause, other, aliases) for other in other_ingredients)
            if (next_clause and not next_names_other
                    and _validation_clause_cooks_target(next_clause, name, aliases)):
                return True
    return False


def validate_grounded_meal(meal, selection, constraints=None):
    selection = selection if isinstance(selection, dict) else {}
    constraints = constraints if isinstance(constraints, dict) else {}
    aliases = selection.get('ingredient_aliases') or {}
    ingredient_names = _validation_ingredient_names(meal)
    steps = _validation_steps(meal)
    flags = []
    seen_flags = set()

    def add_flag(flag):
        if flag not in seen_flags:
            seen_flags.add(flag)
            flags.append(flag)

    rice_allergen_active = _validation_rice_allergen_active(constraints.get('dislikes'), aliases)
    for flag in _validation_rice_allergen_flags(meal, constraints.get('dislikes'), aliases):
        add_flag(flag)

    canonical_ingredients = {
        item for name in ingredient_names if (item := _validation_canonical_ingredient(name, aliases))
    }
    dislikes = [
        item for name in recipe_constraint_list(constraints.get('dislikes'))
        if (item := _validation_canonical_ingredient(name, aliases))
    ]
    for name in ingredient_names:
        canonical = _validation_canonical_ingredient(name, aliases)
        direct_rice_ingredient = (
            rice_allergen_active
            and bool(_validation_rice_allergen_matches(_validation_form_name(name)))
        )
        if canonical in dislikes and not direct_rice_ingredient:
            add_flag(f'allergen_present:{name}')
        if not _validation_seasoning(name) and not any(_validation_step_mentions(step, name, aliases) for step in steps):
            add_flag(f'ingredient_missing_in_steps:{name}')
        if (not _validation_prepared_high_risk_exemption(name)
                and re.search(r'(?:禽|鸡|鸭|猪|虾|蟹|贝|鱼|蛋)', f'{name}{canonical}')):
            if not _validation_high_risk_cooked(name, steps, aliases, ingredient_names):
                add_flag(f'high_risk_not_cooked:{name}')

    consumable_groups = (
        ('step_ingredient_missing:烹调油', _validation_cooking_oil_ingredient, _validation_step_uses_cooking_oil),
        (
            'step_ingredient_missing:盐',
            lambda name: _validation_ingredient_matches_names(name, _VALIDATION_SALT_NAMES),
            lambda step: _validation_step_uses_seasoning_group(step, _VALIDATION_SALT_TOKEN_RE),
        ),
        (
            'step_ingredient_missing:胡椒',
            lambda name: _validation_ingredient_matches_names(name, _VALIDATION_PEPPER_NAMES),
            lambda step: _validation_step_uses_seasoning_group(step, _VALIDATION_PEPPER_TOKEN_RE),
        ),
        (
            'step_ingredient_missing:水',
            lambda name: _validation_ingredient_matches_names(name, _VALIDATION_WATER_NAMES),
            _validation_step_uses_retained_water,
        ),
    )
    for flag, ingredient_matches, step_uses in consumable_groups:
        if not any(ingredient_matches(name) for name in ingredient_names) and any(step_uses(step) for step in steps):
            add_flag(flag)

    for item in selection.get('used_pantry') if isinstance(selection.get('used_pantry'), list) else []:
        canonical = _validation_canonical_ingredient(item, aliases)
        if canonical and canonical not in canonical_ingredients:
            add_flag(f'used_pantry_missing:{item}')
    for item in selection.get('unused_pantry') if isinstance(selection.get('unused_pantry'), list) else []:
        canonical = _validation_canonical_ingredient(item, aliases)
        if canonical and canonical in canonical_ingredients:
            add_flag(f'unused_pantry_used:{item}')

    recipe = selection.get('recipe') if isinstance(selection.get('recipe'), dict) else {}
    anchors = {
        item
        for name in [*(recipe.get('core_ingredients') or []), *(selection.get('used_pantry') or [])]
        if (item := _validation_canonical_ingredient(name, aliases))
    }
    required_anchor_hits = min(2, len(anchors))
    anchor_hits = sum(anchor in canonical_ingredients for anchor in anchors)
    if anchor_hits < required_anchor_hits:
        add_flag('base_recipe_anchor_missing')
    named_vessels = set()
    for step in steps:
        clauses = [clause for clause in re.split(r'[，,。；;！!？?]+', re.sub(r'\s+', '', step)) if clause]
        for clause in clauses:
            vessels = list(re.finditer(r'(?:电饭锅|炒锅|平底锅|汤锅)', clause))
            if len(vessels) > 1 and re.search(r'(?:或|或者|任选|二选一)', clause):
                continue
            for vessel in vessels:
                if _validation_action_negated(clause, vessel.start()):
                    continue
                named_vessels.add(vessel.group(0))
    if (any(_validation_active_action_matches(re.sub(r'\s+', '', step), _VALIDATION_MULTI_POT_RE) for step in steps)
            or len(named_vessels) > 1):
        add_flag('multi_pot_step')
    return flags


def _js_number(value):
    if value is _UNDEFINED:
        return math.nan
    if value is None:
        return 0.0
    if value is True:
        return 1.0
    if value is False:
        return 0.0
    if isinstance(value, str) and not value.strip():
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return math.nan


def safe_int(value, fallback):
    number = _js_number(value)
    return math.floor(number + 0.5) if math.isfinite(number) else fallback


def _prompt_list(value):
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = value.replace('，', ',').replace('、', ',').split(',')
    else:
        return []
    result = [clean for item in items if (clean := sanitize_prompt_text(item, 20))]
    return result[:20]


def season_note(now=None):
    now = now or datetime.now(ZoneInfo('Asia/Shanghai'))
    month = now.month
    seasons = [
        ((3, 4, 5), '春季(3-5月) 应季: 春笋、香椿、豌豆、蚕豆、芦笋、荠菜、菠菜、韭菜、莴笋、西红柿、草莓'),
        ((6, 7, 8), '夏季(6-8月) 应季: 丝瓜、冬瓜、苦瓜、黄瓜、茄子、空心菜、苋菜、玉米、绿豆、桃、西瓜、葡萄'),
        ((9, 10, 11), '秋季(9-11月) 应季: 莲藕、山药、南瓜、芋头、菱角、栗子、白菜、西兰花、菠菜、苹果、梨、柿子'),
        ((12, 1, 2), '冬季(12-2月) 应季: 大白菜、萝卜、土豆、红薯、芋头、菠菜、油菜、菌菇、橘子、橙子、柚子'),
    ]
    for months, text in seasons:
        if month in months:
            return f'\n【应季参考】当前 {month} 月。{text}。这是参考清单, 不强制每道菜都用应季, 但平均下来约一半的菜应包含 1-2 种应季食材。优先级低于「不重复最近吃过的」。'
    return ''


def build_prompt(meal_name, targets, constraints, recipe_grounding):
    targets = targets if isinstance(targets, dict) else {}
    constraints = constraints if isinstance(constraints, dict) else {}
    trusted_template = RECIPE_TEMPLATE.replace('{recipe_grounding}', _js_string(recipe_grounding), 1)
    constraint_note = ''
    diet = constraints.get('diet')
    if diet and diet != 'omnivore':
        label = {'ovoLacto': '蛋奶素', 'vegan': '严格素食', 'glutenFree': '无麸质'}.get(diet)
        if label:
            constraint_note += f'饮食限制: {label}。'
    pantry = _prompt_list(constraints.get('pantry'))
    if pantry:
        constraint_note += f'家里现有库存: {",".join(pantry)}。是否使用以可信基础菜谱的已选/舍弃清单为准；不合适的库存必须舍弃。'
    dislikes = _prompt_list(constraints.get('dislikes'))
    if dislikes:
        constraint_note += f'不吃/过敏(务必严格避开, 含同类与微量也不要用): {"、".join(dislikes)}。'
    if constraints.get('week_fish_short'):
        constraint_note += '本周可安排一次鱼或海鲜即可(膳食指南建议每周≥2次, 但不必每餐都安排鱼); 若这餐安排鱼, 挑一种最近没吃过的鱼虾贝, 不要默认三文鱼。'
    balance_low = _prompt_list(constraints.get('balance_low'))
    if balance_low:
        constraint_note += f'【最近几餐这些偏少, 这一锅请有意识地多补】{"; ".join(balance_low)}。要自然融进菜里, 别为补而牺牲好吃。'
    if constraints.get('balance_high_na'):
        constraint_note += '最近几餐钠偏高, 这一锅请少油少盐、少用腌制/酱料/加工肉。'
    if constraints.get('swap_hint'):
        constraint_note += sanitize_prompt_text(constraints.get('swap_hint'), 160)
    if constraints.get('feedback_hint'):
        constraint_note += _js_string(constraints.get('feedback_hint'))

    exclude_note = ''
    recent = _prompt_list(constraints.get('recent_dishes'))[-20:]
    if recent:
        exclude_note += f'\n【绝对不要】重复以下最近已推荐的菜名: {", ".join(recent)}。要换不同菜系/食材的全新菜。'
    recent_ingredients = constraints.get('recent_ingredients')
    if isinstance(recent_ingredients, dict):
        parts = []
        proteins = _prompt_list(recent_ingredients.get('recent_proteins'))[:15]
        veggies = _prompt_list(recent_ingredients.get('recent_veggies'))[:20]
        carbs = _prompt_list(recent_ingredients.get('recent_carbs'))[:10]
        if proteins:
            parts.append(f'主蛋白用过: {", ".join(proteins)}')
        if veggies:
            parts.append(f'主蔬菜用过: {", ".join(veggies)}')
        if carbs:
            parts.append(f'主食用过: {", ".join(carbs)}')
        if parts:
            window = safe_int(recent_ingredients.get('window_size', _UNDEFINED), 0)
            exclude_note += f'\n\n【食材轮换】最近 {window} 次推荐里:\n-{"\n-".join(parts)}\n这次的主蛋白和主蔬菜请明显避开以上列表, 选不同类别。'

    replacements = [
        ('{meal_name}', sanitize_prompt_text(meal_name, 80)),
        ('{kcal}', str(safe_int(targets.get('kcal', _UNDEFINED), 1800))),
        ('{p}', str(safe_int(targets.get('p', _UNDEFINED), 60))),
        ('{fb}', str(safe_int(targets.get('fb', _UNDEFINED), 25))),
        ('{ca}', str(safe_int(targets.get('ca', _UNDEFINED), 800))),
        ('{constraint_note}', constraint_note),
        ('{exclude_note}', exclude_note),
        ('{season_note}', season_note()),
    ]
    prompt = trusted_template
    for token, value in replacements:
        prompt = prompt.replace(token, value, 1)
    return RECIPE_GROUNDING_TOKEN_RE.sub('', prompt)


def build_recipe_request(meal_name, targets, constraints, library=None):
    library = library if library is not None else get_recipe_library()
    selections = select_recipe_candidates(library, constraints)
    if not selections:
        if _validation_rice_allergen_active(
            constraints.get('dislikes'),
            library.get('ingredient_aliases') or {},
        ):
            raise NoSafeRecipe('暂时没有符合这些过敏或忌口条件的可信无米主餐')
        raise RecipeLibraryUnavailable('没有符合本次限制的可信基础菜谱')
    selection = selections[0]
    payload = {
        'model': MODEL_NAME,
        'messages': [
            {'role': 'system', 'content': RECIPE_SYSTEM},
            {'role': 'user', 'content': build_prompt(meal_name, targets, constraints, build_recipe_grounding(selection))},
        ],
        'temperature': 1.0,
        'response_format': {'type': 'json_object'},
    }
    return payload, selection


def parse_model_json(text):
    raw = _js_string(text).strip()
    raw = re.sub(r'^```(?:json)?', '', raw, flags=re.IGNORECASE)
    raw = re.sub(r'```$', '', raw).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find('{')
        end = raw.rfind('}')
        if start >= 0 and end > start:
            return json.loads(raw[start:end + 1])
        raise


def normalize_meal(meal, usage=None):
    if not isinstance(meal, dict):
        raise ValueError('模型返回空结果')
    ingredients = meal.get('ingredients') if isinstance(meal.get('ingredients'), list) else []
    normalized = []
    for item in ingredients[:14]:
        item = item if isinstance(item, dict) else {}
        out = {
            'name': _js_string(item.get('name')).strip(),
            'grams': safe_int(item.get('grams', _UNDEFINED), 0),
        }
        for key in NUTRIENT_KEYS:
            number = _js_number(item.get(key, _UNDEFINED))
            out[key] = min(max(number, 0), NUTRIENT_MAX[key]) if math.isfinite(number) else 0
            if isinstance(out[key], float) and out[key].is_integer():
                out[key] = int(out[key])
        if out['name'] and out['grams'] > 0:
            normalized.append(out)
    meal['ingredients'] = normalized
    if len(normalized) < 3:
        raise ValueError('模型返回食材过少')
    meal['dish_name'] = _js_string(meal.get('dish_name') or '今日一锅出').strip()
    meal['steps'] = [_js_string(step).strip() for step in meal.get('steps', []) if _js_string(step).strip()][:6] if isinstance(meal.get('steps'), list) else []
    meal['flavor_tags'] = [_js_string(item) for item in meal.get('flavor_tags', [])][:5] if isinstance(meal.get('flavor_tags'), list) else []
    meal['prep_minutes'] = safe_int(meal.get('prep_minutes', _UNDEFINED), 35)
    meal['difficulty'] = min(2, max(1, safe_int(meal.get('difficulty', _UNDEFINED), 1)))
    meal['note'] = _js_string(meal.get('note')).strip()
    meal['taste_preview'] = _js_string(meal.get('taste_preview')).strip()
    meal['form'] = _js_string(meal.get('form') or '一锅主餐').strip()
    meal['why'] = _js_string(meal.get('why')).strip()
    meal['has_fish'] = bool(meal.get('has_fish'))
    meal['veg_count'] = safe_int(meal.get('veg_count', _UNDEFINED), 3)
    if isinstance(usage, dict) and usage.get('total_tokens'):
        meal['_tokens'] = usage['total_tokens']
    return meal


def _grounded_safety_endpoint(name, raw_risk_category):
    if raw_risk_category == 'egg':
        return f'继续在原锅加热{name}至熟透并确保蛋白和蛋黄完全凝固且不得流心'
    if raw_risk_category == 'poultry_pork':
        return f'继续在原锅加热{name}至熟透，中心不见粉红'
    return f'继续在原锅加热{name}至熟透'


_VALIDATION_NON_RAW_HIGH_RISK_CATEGORY_RE = re.compile(
    r'(?:高汤|汤底|汤料|汤|露|酱|汁|膏|粉|精|调味料|油)$'
)
_VALIDATION_EXPLICIT_UNSAFE_STATE_RE = re.compile(
    r'(?:(?:尚未|还未|仍未|还没|尚没|仍没|没(?:有)?|不|未)(?:完全|彻底|充分)?(?:预|煮|炒|煎|焖|炖|蒸|烧)?熟|半熟|[0-9零〇一二两三四五六七八九]分熟)'
)
_VALIDATION_PREPARED_STATE_MARKER_RE = re.compile(r'(?:即食|熟制|预熟|烟熏|罐装|罐头|熟)')
_VALIDATION_PREPARED_HIGH_RISK_EXACT_FORMS = {
    '炸鸡', '鸡肉松', '鱼丸', '鱼罐头', '虾饺', '蟹棒',
    '皮蛋', '蛋黄酱', '蛋粉', '茶叶蛋', '咸鸭蛋',
}
_VALIDATION_RAW_EGG_FORMS = {
    '鸡蛋', '蛋液', '鲜鸡蛋', '土鸡蛋', '全蛋液', '鸡蛋液',
}
_VALIDATION_RAW_POULTRY_PORK_FORMS = {
    '禽肉', '鸡肉', '鸡胸', '鸡胸肉', '鸡腿', '鸡腿肉', '去骨鸡腿肉', '鸡翅', '鸡爪', '鸡胗', '鸡肝',
    '火鸡', '火鸡肉', '鸭肉', '鸭胸', '鸭胸肉', '鸭腿', '鸭腿肉', '鹅肉',
    '猪肉', '猪里脊', '猪里脊肉', '猪瘦肉', '瘦猪肉', '猪五花肉', '五花肉', '猪排骨', '排骨',
}
_VALIDATION_RAW_SEAFOOD_FORMS = {
    '鱼', '鱼肉', '鱼片', '鲜鱼', '三文鱼', '鲑鱼', '鳕鱼', '鲈鱼', '鲫鱼', '鲤鱼', '草鱼', '黑鱼',
    '鳗鱼', '带鱼', '黄花鱼', '鲳鱼', '鲷鱼', '龙利鱼', '巴沙鱼', '金枪鱼', '鲅鱼', '青花鱼', '沙丁鱼', '秋刀鱼',
    '虾', '虾仁', '鲜虾', '大虾', '蟹', '蟹肉', '螃蟹', '梭子蟹', '大闸蟹',
    '贝', '贝肉', '贝类', '蛤蜊', '花蛤', '扇贝', '牡蛎', '生蚝', '鱿鱼', '章鱼', '墨鱼',
}


def _validation_unsafe_state_form(name):
    return _VALIDATION_EXPLICIT_UNSAFE_STATE_RE.sub('', _validation_form_name(name))


def _validation_raw_risk_form(name):
    return re.sub(r'\(.*?\)', '', _validation_unsafe_state_form(name))


def _validation_raw_risk_category_for_form(form):
    if form in _VALIDATION_RAW_EGG_FORMS:
        return 'egg'
    if form in _VALIDATION_RAW_POULTRY_PORK_FORMS:
        return 'poultry_pork'
    if form in _VALIDATION_RAW_SEAFOOD_FORMS:
        return 'seafood'
    return ''


def _validation_resolve_raw_alias(name, aliases):
    normalized = {}
    if isinstance(aliases, dict):
        for raw_key, raw_value in aliases.items():
            key = base_recipe_ingredient(raw_key)
            value = base_recipe_ingredient(raw_value)
            raw_form = _validation_form_name(raw_value)
            unsafe_form = _validation_unsafe_state_form(raw_value)
            if key and value and key not in normalized:
                normalized[key] = {
                    'raw_value': raw_value,
                    'value': value,
                    'unsafe_form': unsafe_form,
                    'unsafe_value': base_recipe_ingredient(unsafe_form),
                    'explicit_unsafe': unsafe_form != raw_form,
                }

    bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    initial = _VALIDATION_CANONICAL_FORMS.get(bare, name)
    first_seen = set()
    current = base_recipe_ingredient(initial)
    terminal_explicit_unsafe = False
    aliased = base_recipe_ingredient(name) in normalized
    while current in normalized:
        if current in first_seen:
            return {
                'canonical': current,
                'classifiable': False,
                'aliased': aliased,
                'explicit_unsafe': False,
            }
        first_seen.add(current)
        edge = normalized[current]
        if _VALIDATION_PREPARED_STATE_MARKER_RE.search(edge['unsafe_form']):
            return {
                'canonical': current,
                'classifiable': False,
                'aliased': aliased,
                'explicit_unsafe': False,
            }
        if edge['value'] == current and edge['explicit_unsafe']:
            return {
                'canonical': edge['unsafe_value'],
                'classifiable': True,
                'aliased': aliased,
                'explicit_unsafe': True,
            }
        terminal_explicit_unsafe = edge['explicit_unsafe']
        current = edge['value']
    return {
        'canonical': current,
        'classifiable': True,
        'aliased': aliased,
        'explicit_unsafe': terminal_explicit_unsafe,
    }


def _validation_raw_risk_category(name, aliases):
    exact_normalized = _validation_unsafe_state_form(name)
    if (not exact_normalized
            or _VALIDATION_PREPARED_STATE_MARKER_RE.search(exact_normalized)):
        return ''
    exact = _validation_raw_risk_form(exact_normalized)
    if not exact or exact in _VALIDATION_PREPARED_HIGH_RISK_EXACT_FORMS:
        return ''
    if (_validation_cooking_oil_ingredient(exact)
            or _VALIDATION_NON_RAW_HIGH_RISK_CATEGORY_RE.search(exact)):
        return ''
    exact_category = _validation_raw_risk_category_for_form(exact)
    resolved = _validation_resolve_raw_alias(name, aliases)
    if exact_category and not resolved['aliased']:
        return exact_category
    if not resolved['classifiable']:
        return ''
    canonical_normalized = _validation_unsafe_state_form(resolved['canonical'])
    if not canonical_normalized:
        return ''
    canonical = _validation_raw_risk_form(canonical_normalized)
    if (not canonical
            or (canonical == exact and not resolved['explicit_unsafe'])
            or canonical in _VALIDATION_PREPARED_HIGH_RISK_EXACT_FORMS):
        return ''
    if (_validation_cooking_oil_ingredient(canonical)
            or _VALIDATION_NON_RAW_HIGH_RISK_CATEGORY_RE.search(canonical)):
        return ''
    return _validation_raw_risk_category_for_form(canonical)


def repair_grounded_meal_safety(meal, selection, constraints=None):
    selection = selection if isinstance(selection, dict) else {}
    constraints = constraints if isinstance(constraints, dict) else {}
    aliases = selection.get('ingredient_aliases') or {}
    ingredient_names = _validation_ingredient_names(meal)
    steps = _validation_steps(meal)
    prefix = 'high_risk_not_cooked:'
    candidates = []
    for flag in validate_grounded_meal(meal, selection, constraints):
        if not flag.startswith(prefix):
            continue
        name = flag[len(prefix):]
        category = _validation_raw_risk_category(name, aliases)
        if (name in ingredient_names
                and category
                and any(_validation_step_mentions(step, name, aliases) for step in steps)
                and all(candidate['name'] != name for candidate in candidates)):
            candidates.append({'name': name, 'category': category})
    if not candidates:
        return 0
    instruction = '安全收尾：' + '；'.join(
        _grounded_safety_endpoint(candidate['name'], candidate['category'])
        for candidate in candidates
    ) + '。'
    if not isinstance(meal.get('steps'), list):
        meal['steps'] = []
    if len(meal['steps']) < 4:
        meal['steps'].append(instruction)
    else:
        meal['steps'][-1] = f'{_js_string(meal["steps"][-1]).strip()} {instruction}'.strip()
    return len(candidates)


def attach_grounded_metadata(meal, selection, constraints):
    meal.pop('constraint_profile', None)
    meal.pop('constraint_profiles', None)
    meal.pop('active_constraint_profile', None)
    repair_grounded_meal_safety(meal, selection, constraints)
    recipe = selection['recipe']
    aliases = selection.get('ingredient_aliases') or {}
    used_pantry = list(selection.get('used_pantry') or [])
    unused_pantry = list(selection.get('unused_pantry') or [])
    fixed_core = {
        item for name in recipe.get('core_ingredients') or []
        if (item := canonical_recipe_ingredient(name, aliases))
    }
    only_fixed_core = all(canonical_recipe_ingredient(item, aliases) in fixed_core for item in used_pantry)
    recipe_name = _js_string(recipe.get('name') or recipe.get('id') or '基础菜谱')
    meal['family_id'] = _js_string(recipe.get('family_id') or (selection.get('family') or {}).get('id'))
    meal['base_recipe_id'] = _js_string(recipe.get('id'))
    meal['basis_level'] = 'classic' if only_fixed_core else 'adapted'
    meal['pairing_basis'] = (
        f'以「{recipe_name}」为基础，使用{"、".join(used_pantry)}。'
        if used_pantry else f'以「{recipe_name}」为基础，按原有结构制作。'
    )
    meal['used_pantry'] = used_pantry
    meal['unused_pantry'] = unused_pantry
    meal['source_refs'] = copy.deepcopy(recipe.get('source_refs') if isinstance(recipe.get('source_refs'), list) else [])
    meal['safety_checks'] = list(recipe.get('safety_rules')) if isinstance(recipe.get('safety_rules'), list) else []
    meal['validation_flags'] = validate_grounded_meal(meal, selection, constraints)
    return meal


def call_recipe(meal_name, targets, constraints):
    if not API_KEY:
        raise RuntimeError(f'{PROVIDER.upper()}_API_KEY 没找到。检查 {ENV_FILE}')
    constraints = sanitize_recipe_constraints(constraints)
    payload, selection = build_recipe_request(meal_name, targets, constraints)
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
    usage = data.get('usage', {})
    parsed = normalize_meal(parse_model_json(content), usage)
    attach_grounded_metadata(parsed, selection, constraints)
    now = datetime.now(ZoneInfo('Asia/Shanghai'))
    current_season = season_note(now)
    season_text = current_season.split('。', 2)[1] if current_season else ''
    parsed['_intelligence'] = explain_intelligence(
        parsed, constraints.get('recent_ingredients'), season_text, now.month,
    )
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
    if not API_KEY:
        raise RuntimeError(f'{PROVIDER.upper()}_API_KEY 没找到。检查 {ENV_FILE}')
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
            print(f'[recipe] request meal={sanitize_prompt_text(meal_name, 80)}', flush=True)
            result = call_recipe(meal_name, targets, constraints)
            print(json.dumps({
                'evt': 'gen',
                'ok': True,
                'base': result.get('base_recipe_id'),
                'family': result.get('family_id'),
                'flags': len(result.get('validation_flags') or []),
                'tokens': result.get('_tokens') or 0,
                'n': len(result.get('ingredients') or []),
            }, ensure_ascii=False, separators=(',', ':')), flush=True)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
        except NoSafeRecipe as e:
            self.send_response(422)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e),
                'code': 'no_safe_recipe',
            }, ensure_ascii=False).encode('utf-8'))
        except RecipeLibraryUnavailable as e:
            self.send_response(503)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e),
                'code': 'recipe_library_unavailable',
            }, ensure_ascii=False).encode('utf-8'))
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
    if not API_KEY:
        print(f'ERROR: {PROVIDER.upper()}_API_KEY 没找到。检查 {ENV_FILE}', file=sys.stderr)
        return 1
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
    return 0


def recipe_match_cli(raw):
    try:
        constraints = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f'ERROR: --recipe-match JSON 无效: {exc.msg}', file=sys.stderr)
        return 2
    if not isinstance(constraints, dict):
        print('ERROR: --recipe-match 需要一个 JSON 对象', file=sys.stderr)
        return 2
    try:
        library = get_recipe_library()
        selections = select_recipe_candidates(library, sanitize_recipe_constraints(constraints))
    except RecipeLibraryUnavailable as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 3
    if not selections:
        print('ERROR: 没有符合本次限制的可信菜谱候选', file=sys.stderr)
        return 3
    selection = selections[0]
    print(json.dumps({
        'base_recipe_id': selection['recipe'].get('id'),
        'family_id': (selection.get('family') or {}).get('id') or selection['recipe'].get('family_id'),
        'used_pantry': selection['used_pantry'],
        'unused_pantry': selection['unused_pantry'],
    }, ensure_ascii=False, separators=(',', ':')))
    return 0


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == '--recipe-match':
        if len(sys.argv) != 3:
            print('ERROR: 用法: ai_proxy.py --recipe-match <JSON>', file=sys.stderr)
            sys.exit(2)
        sys.exit(recipe_match_cli(sys.argv[2]))
    sys.exit(main())
