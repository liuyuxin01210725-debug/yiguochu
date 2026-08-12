# Source-backed one-pot batch r282 — MAFF 海鲜饭安全字段回填

- catalog version: `source-backed-one-pot-v1-20260808-global-r282`
- catalog size: 923
- canonical additions: 0
- executable additions: 0
- field-only closures: 1 shellfish visual endpoint

## Closed field

`maff-eryngii-seafood-pan-paella` (`エリンギとシーフードミックスのパエリア風ご飯`)
now carries `shellfish_fully_cooked` using the existing FoodSafety.gov visual
contract. The MAFF page identifies the frozen seafood mix as shrimp, squid, and
clams; it instructs sautéing the frozen mix, simmering the liquid, and then
covered low-heat cooking for 15 minutes. The record keeps the endpoint scoped to
the shrimp/clams in that mix and does not turn the stovetop recipe into a rice
cooker program.

Source: https://www.maff.go.jp/j/seisan/ryutu/engei/IYFV2021/IYFV2021_menu/2_62.html

## Boundaries retained

- `fixed_batch` and `liquid_contract` remain source-backed as already recorded;
  `time_contract` stays `null` because the source publishes a 30–60 minute range,
  not a single total time.
- `cooker_adaptation.status` remains `not_adapted` for the stovetop pan workflow.
- No canonical recipe, executable recipe, or production runtime recipe was added.
