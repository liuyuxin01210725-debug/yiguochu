// Worker 与 Planner 共用的唯一过敏/忌口语义。前端与 Python 仍由 parity 测试锁定同一张表和行为。
export const ALLERGEN_GROUPS = {
  '海鲜': ['鱼','鲈鱼','鳕鱼','三文鱼','金枪鱼','带鱼','黄花鱼','鲫鱼','鲤鱼','草鱼','鱼头','鱼片','虾','虾仁','虾皮','虾米','海米','蟹','螃蟹','蛤蜊','扇贝','干贝','瑶柱','牡蛎','生蚝','鲍鱼','蛏子','鱿鱼','章鱼','墨鱼','海参','海螺','贝类'],
  '蛋': ['鸡蛋','鸭蛋','鹌鹑蛋','皮蛋','咸蛋','咸鸭蛋','蛋白','蛋黄','蛋液'],
  '奶': ['牛奶','羊奶','奶粉','奶酪','芝士','黄油','奶油','淡奶油','酸奶','炼乳'],
  '花生': ['花生','花生米','花生酱'],
  '坚果': ['核桃','杏仁','腰果','开心果','榛子','松子','碧根果','夏威夷果','巴旦木','板栗','芝麻','芝麻酱'],
  '大豆': ['大豆','黄豆','豆腐','嫩豆腐','老豆腐','油炸豆腐','炸豆腐','豆浆','豆皮','腐竹','酱油','豆豉','味噌'],
  '鸡肉': ['鸡肉','鸡腿','鸡腿肉','鸡胸','鸡胸肉','鸡翅','鸡爪','鸡柳','土鸡','乌鸡','三黄鸡','鸡胗','鸡肝','鸡汤'],
  '牛肉': ['牛肉','牛里脊','牛腩','牛腱','肥牛','牛肉片','牛肉末','牛排','牛仔骨'],
  '猪肉': ['猪肉','猪里脊','五花肉','猪排','排骨','猪蹄','猪肝','猪腰','腊肉','腊肠','培根','火腿'],
  '羊肉': ['羊腿肉','去骨羊腿肉']
};

function baseAllergenIngredient(name) {
  return String(name || '').toLowerCase()
    .replace(/过敏|不吃|忌口|不要/g, '')
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/\(.*?\)/g, '').replace(/[\s_-]+/g, '')
    .replace(/丁$|片$|块$|丝$|末$|粒$/g, '');
}

function normalizedAliases(aliases) {
  const normalized = new Map();
  if (!aliases || typeof aliases !== 'object') return normalized;
  for (const [rawKey, rawValue] of Object.entries(aliases)) {
    const key = baseAllergenIngredient(rawKey);
    const value = baseAllergenIngredient(rawValue);
    if (key && value && !normalized.has(key)) normalized.set(key, value);
  }
  return normalized;
}

function resolveAlias(value, aliases) {
  const path = [];
  const firstSeen = new Map();
  let current = value;
  while (aliases.has(current)) {
    if (firstSeen.has(current)) return path.slice(firstSeen.get(current)).sort()[0] || current;
    firstSeen.set(current, path.length);
    path.push(current);
    current = aliases.get(current);
  }
  return current;
}

function allergyMatchForms(name, aliases) {
  const raw = baseAllergenIngredient(name);
  const resolved = resolveAlias(raw, normalizedAliases(aliases));
  return [...new Set([raw, resolved].filter(Boolean))];
}

// 双向子串；只有忌口词本身等于类别名时才展开组成员。原词与 alias 归一词同时保留，
// 防止 alias 把“豆腐/香菇”等保护面收窄。
export function matchAllergy(dislikeTerm, ingredientName, aliases = {}) {
  const dForms = allergyMatchForms(dislikeTerm, aliases);
  const iForms = allergyMatchForms(ingredientName, aliases);
  if (!dForms.length || !iForms.length) return false;
  const groupNames = dForms.filter(dislike => ALLERGEN_GROUPS[dislike]);
  if (groupNames.length) {
    if (dForms.some(dislike => iForms.some(ingredient => ingredient === dislike
      || (dislike.length >= 2 && ingredient.includes(dislike))))) return true;
    return groupNames.some(group => ALLERGEN_GROUPS[group].some(member => {
      const memberForms = allergyMatchForms(member, aliases);
      return memberForms.some(memberForm => iForms.some(ingredient => ingredient.includes(memberForm)
        || memberForm.includes(ingredient)));
    }));
  }
  return dForms.some(dislike => iForms.some(ingredient => ingredient.includes(dislike)
    || dislike.includes(ingredient)));
}
