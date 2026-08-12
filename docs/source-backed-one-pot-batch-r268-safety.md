# r268 安全补证：三条 MAFF 地域海鲜饭

基线为 `source-backed-one-pot-v1-20260808-global-r267` / 923 条。本批没有新增 canonical，也没有晋升 executable；只为 3 条已经在目录中的 `recipe_fact_checked` 记录补可直接对应原文流程的海鲜安全终点。

| recipe_id | 官方原文事实 | 回填字段 | 保留边界 |
| --- | --- | --- | --- |
| `jp-miyagi-hokki-meshi` | [MAFF 宫城ほっきめし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/hokki_meshi_miyagi.html)：4–6 人、米 3 合、北寄贝 4–6 只；贝肉先焯至桃红，过滤煮汁，电饭煲炊饭后分段拌贝。 | `shellfish_fully_cooked`：肉质呈珍珠白或白色且不透明；`S-SAFETY-TEMPERATURES-1`。 | 保留分段焯贝和电饭煲原文，不把它改成生贝全程同锅。 |
| `jp-ehime-tako-meshi` | [MAFF 爱媛たこ飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tako_meshi_ehime.html)：4 人、章鱼 200g；原文先盐煮并切片，锅中沸腾时加入章鱼炊煮，也记录生章鱼同炊变体。 | `seafood_fully_cooked`：最低核心温度 63°C；`S-SAFETY-SEAFOOD-GENERAL-CDC-1`。 | 不跨入三重等同名地域版本，不外推普通电饭煲。 |
| `maff-miyagi-harako-meshi` | [MAFF 宫城はらこ飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/harako_meshi_miyagi.html)：4 人、鲑鱼 240g、鲑鱼籽 80g；鲑鱼先煮熟取出，煮汁炊饭，最后装配。 | `seafood_fully_cooked`：最低核心温度 63°C；`S-SAFETY-SEAFOOD-GENERAL-CDC-1`。 | 鲑鱼籽另有 50–60°C 热水和短暂入汁步骤，不推导独立鱼卵端点；保留分段装配。 |

## 验证

- TDD：先在 r267 基线运行 `node --test tools/tests/source-backed-one-pot-batch-r268-safety.test.mjs`，版本及端点断言失败；写入后 2/2 通过。
- 3 条仍为 `recipe_fact_checked`，不改变原有 `cooker_adaptation`、批量、液体、总时长或非 executable 状态。
- 生成 artifacts、目录校验和全量测试需在本批结束后统一运行。

