#!/usr/bin/env python3
"""一锅出 · 菜谱库 CLI（独立；不接 plan-meal）"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CARDS = ROOT / "cards"
INDEX = ROOT / "index.json"
SCHEMA = ROOT / "schema.json"

ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
FORMS = ["菜饭", "焖饭", "汤泡饭", "咖喱一锅", "手抓饭", "煲类一锅", "其他一锅"]
STATUSES = ["待试", "已验证"]


def load_index() -> dict:
    if not INDEX.exists():
        return {
            "schema_version": "yiguochu-recipe-library-v0",
            "title": "一锅出 · 菜谱库",
            "branch_note": "独立于 plan-meal / 旧 matcher；family-restart P0",
            "cards": [],
        }
    return json.loads(INDEX.read_text(encoding="utf-8"))


def save_index(data: dict) -> None:
    INDEX.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_card(card_id: str) -> dict:
    path = CARDS / f"{card_id}.json"
    if not path.exists():
        raise SystemExit(f"找不到卡：{path}")
    return json.loads(path.read_text(encoding="utf-8"))


def save_card(card: dict) -> Path:
    CARDS.mkdir(parents=True, exist_ok=True)
    path = CARDS / f"{card['id']}.json"
    path.write_text(json.dumps(card, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def search_keywords(card: dict) -> str:
    """列表搜索用：食材、步骤、打包说明、来源。不含营养数字，不含备注里的对照菜名。"""
    parts: list[str] = []
    # 备注常拿别的菜名作对照（例如「与白菜豆腐焖饭不是同一道」），不放进搜索串，避免搜到不是这道菜的词。
    pack_notes = card.get("pack_notes")
    if isinstance(pack_notes, str) and pack_notes.strip():
        parts.append(pack_notes.strip())
    src = card.get("source") if isinstance(card.get("source"), dict) else {}
    for key in ("kind", "label"):
        val = src.get(key)
        if isinstance(val, str) and val.strip():
            parts.append(val.strip())
    for key in ("ingredients", "prep_optional", "steps_now"):
        seq = card.get(key) or []
        if isinstance(seq, list):
            parts.extend(str(item).strip() for item in seq if str(item).strip())
    text = re.sub(r"\s+", " ", " ".join(parts)).strip()
    return text[:1200]


def summary_row(card: dict) -> dict:
    row = {
        "id": card["id"],
        "name": card["name"],
        "form": card["form"],
        "status": card["status"],
        "packable": card.get("packable", False),
        "time_total": card.get("time_minutes", {}).get("total"),
        "file": f"cards/{card['id']}.json",
    }
    keywords = search_keywords(card)
    if keywords:
        row["keywords"] = keywords
    return row


def cmd_list(_: argparse.Namespace) -> None:
    idx = load_index()
    rows = idx.get("cards") or []
    if not rows:
        print("(空库)")
        return
    print(f"{'id':<28} {'形态':<8} {'状态':<6} {'打包':<4} {'分钟':>4}  名称")
    print("-" * 72)
    for r in rows:
        pack = "是" if r.get("packable") else "否"
        t = r.get("time_total") or "-"
        print(f"{r['id']:<28} {r.get('form',''):<8} {r.get('status',''):<6} {pack:<4} {str(t):>4}  {r.get('name','')}")


def cmd_show(args: argparse.Namespace) -> None:
    card = load_card(args.id)
    print(f"# {card['name']}  [{card['form']} · {card['status']}]")
    print(f"id: {card['id']}")
    serv = card.get("servings") or {}
    print(f"份量: {serv.get('summary', '')}")
    tm = card.get("time_minutes") or {}
    print(f"耗时: 动手 {tm.get('active', '?')} 分钟 / 合计 {tm.get('total', '?')} 分钟")
    print(f"打包: {'适合' if card.get('packable') else '不适合'}" + (f" — {card['pack_notes']}" if card.get("pack_notes") else ""))
    src = card.get("source") or {}
    print(f"来源: {src.get('label', '')}")
    if card.get("ingredients"):
        print("\n食材:")
        for line in card["ingredients"]:
            print(f"  - {line}")
    print("\n现在动手:")
    for i, step in enumerate(card.get("steps_now") or [], 1):
        print(f"  {i}. {step}")
    if card.get("prep_optional"):
        print("\n可折叠准备:")
        for line in card["prep_optional"]:
            print(f"  - {line}")
    if card.get("notes"):
        print(f"\n备注: {card['notes']}")


def validate_card(card: dict, path: Path) -> list[str]:
    errs: list[str] = []
    for key in ("id", "name", "form", "servings", "steps_now", "time_minutes", "packable", "source", "status"):
        if key not in card:
            errs.append(f"{path.name}: 缺字段 {key}")
    if "id" in card and not ID_RE.match(card["id"]):
        errs.append(f"{path.name}: id 格式须为小写+短横线")
    if card.get("id") and path.stem != card["id"]:
        errs.append(f"{path.name}: 文件名与 id 不一致（{card.get('id')}）")
    if card.get("form") not in FORMS:
        errs.append(f"{path.name}: form 不在 {FORMS}")
    if card.get("status") not in STATUSES:
        errs.append(f"{path.name}: status 须为 待试|已验证")
    serv = card.get("servings")
    if not isinstance(serv, dict) or not serv.get("summary"):
        errs.append(f"{path.name}: servings.summary 必填")
    steps = card.get("steps_now")
    if not isinstance(steps, list) or len(steps) < 1:
        errs.append(f"{path.name}: steps_now 至少 1 步")
    tm = card.get("time_minutes")
    if not isinstance(tm, dict) or not isinstance(tm.get("total"), int) or tm["total"] < 1:
        errs.append(f"{path.name}: time_minutes.total 须为正整数")
    if not isinstance(card.get("packable"), bool):
        errs.append(f"{path.name}: packable 须为 boolean")
    src = card.get("source")
    if not isinstance(src, dict) or not src.get("label"):
        errs.append(f"{path.name}: source.label 必填（诚实来源）")
    return errs


def cmd_validate(_: argparse.Namespace) -> None:
    errs: list[str] = []
    files = sorted(CARDS.glob("*.json"))
    if not files:
        print("无卡片")
        return
    for path in files:
        try:
            card = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errs.append(f"{path.name}: JSON 无效 ({e})")
            continue
        errs.extend(validate_card(card, path))
    idx = load_index()
    index_ids = {r["id"] for r in idx.get("cards") or []}
    file_ids = {p.stem for p in files}
    for missing in sorted(file_ids - index_ids):
        errs.append(f"index.json 缺少 {missing}")
    for extra in sorted(index_ids - file_ids):
        errs.append(f"index.json 有幽灵条目 {extra}")
    pins = idx.get("weekly_pins") or []
    if pins and not isinstance(pins, list):
        errs.append("weekly_pins 须为数组")
    elif isinstance(pins, list):
        for pin in pins:
            pid = pin.get("id") if isinstance(pin, dict) else pin
            if not isinstance(pid, str) or pid not in file_ids:
                errs.append(f"weekly_pins 指向不存在的卡 {pid}")
    if errs:
        print("校验失败：")
        for e in errs:
            print(f"  - {e}")
        raise SystemExit(1)
    print(f"OK · {len(files)} 张卡")


def cmd_reindex(_: argparse.Namespace) -> None:
    idx = load_index()
    rows = []
    for path in sorted(CARDS.glob("*.json")):
        card = json.loads(path.read_text(encoding="utf-8"))
        rows.append(summary_row(card))
    idx["cards"] = rows
    save_index(idx)
    print(f"已重建 index.json · {len(rows)} 张")


def cmd_new(args: argparse.Namespace) -> None:
    card_id = args.id
    if not ID_RE.match(card_id):
        raise SystemExit("id 仅允许小写字母、数字、短横线，如 qingcai-jidang-fan")
    if (CARDS / f"{card_id}.json").exists():
        raise SystemExit(f"已存在：cards/{card_id}.json")
    form = args.form
    if form not in FORMS:
        raise SystemExit(f"form 须为其一：{', '.join(FORMS)}")
    name = args.name or card_id
    card = {
        "id": card_id,
        "name": name,
        "form": form,
        "servings": {"summary": "（待填：家用量或克数；是否一锅双用）", "rice": "", "people": ""},
        "ingredients": ["（待填）"],
        "steps_now": ["（待填：早晨可跟的第一步）", "（待填）"],
        "prep_optional": [],
        "time_minutes": {"active": 0, "total": 1},
        "packable": True,
        "pack_notes": "（待填：耐放/复热）",
        "source": {
            "kind": "家庭口述",
            "label": "（待填：诚实来源；勿冒充已验证）",
            "refs": [],
        },
        "status": "待试",
        "notes": "",
    }
    path = save_card(card)
    idx = load_index()
    cards = [r for r in (idx.get("cards") or []) if r.get("id") != card_id]
    cards.append(summary_row(card))
    cards.sort(key=lambda r: r["id"])
    idx["cards"] = cards
    save_index(idx)
    print(f"已创建 {path.relative_to(ROOT)}")
    print("请编辑步骤/份量/来源后执行：python3 cli.py validate")


def main() -> None:
    parser = argparse.ArgumentParser(description="一锅出菜谱库 CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="列出全部卡")
    p_list.set_defaults(func=cmd_list)

    p_show = sub.add_parser("show", help="打开一张卡")
    p_show.add_argument("id")
    p_show.set_defaults(func=cmd_show)

    p_new = sub.add_parser("new", help="新建卡模板")
    p_new.add_argument("id", help="短横线英文 id")
    p_new.add_argument("--name", default="", help="中文菜名")
    p_new.add_argument("--form", default="焖饭", choices=FORMS)
    p_new.set_defaults(func=cmd_new)

    p_val = sub.add_parser("validate", help="校验全部卡与 index")
    p_val.set_defaults(func=cmd_validate)

    p_re = sub.add_parser("reindex", help="按 cards/*.json 重建 index.json")
    p_re.set_defaults(func=cmd_reindex)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
