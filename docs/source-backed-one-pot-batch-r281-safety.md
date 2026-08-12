# Source-backed one-pot batch r281 — 春湖鱼饭安全字段回填

- catalog version: `source-backed-one-pot-v1-20260808-global-r281`
- catalog size: 923
- canonical additions: 0
- executable additions: 0
- field-only closures: 1 safety endpoint

## Closed field

`hubei-yangxin-chunhu-fish-rice` (`春湖鱼饭`) now carries the existing controlled
`seafood_fully_cooked` endpoint at 63°C, sourced from `S-SAFETY-TEMPERATURES-1`.
The Yangxin County Government page says the live fish is scaled/gutted, placed in
boiling water until the flesh is soft, deboned, and only then combined with washed
rice for the final braise. FoodSafety.gov supplies the fish minimum internal
temperature reference; it does not create a household batch, liquid, time, or
electric-rice-cooker contract.

Source: https://yx.gov.cn/zjyx/whyc/201612/t20161220_95834.html

## Boundaries retained

- `fixed_batch`, `liquid_contract`, and `time_contract` remain `null` because the
  government page gives a large traditional fish example but no household rice
  amount, liquid amount, or total time.
- `cooker_adaptation.status` remains `not_adapted`; the historical boiling/braising
  vessel is not silently converted into a modern rice-cooker program.
- No canonical recipe, executable recipe, or production runtime recipe was added.
