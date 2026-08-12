# r307 茅山青精饭研究卡补全

基线：`source-backed-one-pot-v1-20260810-global-r293` / 923 条。

本批不新增 canonical，也不把传统工艺晋升为 executable；只把已有身份卡
`cn-jiangsu-jintan-maoshan-qingjing-rice-technique` 从“只有名录身份”补成可追溯的研究起步卡。

## 变更

- 常州市人民政府名录继续作为金坛项目身份的一手来源。
- 道音文化公开资料补充南烛叶/枝汁处理、白粳米浸染至墨绿色、蒸熟三步。
- 传统器具保留为石臼/榨汁器和蒸锅；没有把它外推为普通电饭煲。
- 米量、液体对象、浸泡/蒸制时间、植物安全和电饭煲合同仍为 `null`/缺口。
- 该来源是历史/宗教文化资料（tier 4、搜索摘录可读），不是金坛传承点的现代定量原方；页面中的九蒸九晒等扩展工艺不写入本卡。

## 验证

```text
node --test tools/tests/source-backed-one-pot-research-card-batch-r307-qingjing.test.mjs
```

