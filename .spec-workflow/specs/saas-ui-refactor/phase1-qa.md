# Phase 1 QA 交付物

## 1. 风险列表

| 等级 | 风险 | 影响 | 缓解措施 |
| --- | --- | --- | --- |
| 高 | 引擎注册表仅保存在内存，服务重启会丢失健康状态，可能导致不健康引擎被重新调度 | 重启后的前几次请求可能触发故障，影响 SLA | 在阶段 2/3 计划接入持久化健康探针（Redis/SQLite），并在启动时强制执行 `EngineRegistry.probe_health()`；同时为引擎提供外部健康检查回调 |
| 中 | TextLayer 批量更新依赖单事务操作，大批量 (>200) 更新会锁表 | 图层编辑峰值时延迟上升 | 在 Phase 4 引入分页批处理（拆分为 50 条/批）并监控 SQL 执行时间；必要时为 `translation_id` + `id` 添加复合索引 |
| 中 | Aliyun 引擎 API 受限于公网网络，网络抖动会放大 fallback 延迟 | 最大延迟 = N 个候选引擎串行调用 | 在 Phase 2 之前针对主备引擎设置 1.5s 超时并在 `EngineRegistry.translate_with_fallback` 中记录 metrics；后续考虑并行竞速（race）策略 |
| 低 | CacheService 使用进程内存，若开启多实例无法共享缓存 | 缓存命中率下降，吞吐降低 | 后续阶段通过 Redis/Dragonfly 替换，实现跨实例共享 |

## 2. 性能分析

### 引擎切换延迟
- 当前策略：串行尝试优先引擎 → 候选引擎。
- `FAILURE_THRESHOLD=3`，意味着最坏情况下同一实例需要 3 次失败才能熔断。
- 估算：单次 Aliyun API 耗时 ~1.2s，最坏 fallback（3 引擎）≈ 3.6s。
- 建议：
  - 在 Phase 2 加入 request-scoped timeout（1.5s）+ 失败快速标记。
  - 记录 `EngineRegistry` 成功/失败指标，供 HPA 参考。

### 数据库索引
- `text_layers.translation_id` 已加索引，覆盖 `list_layers` / `batch_update` 主查询。
- 仍缺少：`text_layers.updated_at`（未来历史排序）与 `(translation_id, id)` 复合索引（批量更新 in 子句）。
- 建议：
  - Phase 4 之前视真实数据量补充复合索引。
  - 监控 SQLite `ANALYZE` 输出，确保查询计划走索引。

## 3. 可能的 Bug
- 并发编辑同时命中 `batch_update` 与单个 `update_layer`，会因版本校验抛 409，但前端未统一处理 → 需在 Phase 4 useOptimisticUpdate 中捕获并回放最新层数据。
- `EngineRegistry.describe_engines()` 返回顺序依赖 dict 插入顺序，若未来切换到多进程/持久化有序性可能变化，需在 Phase 2 引入排序逻辑。
- `CacheService` TTL 默认 1h，若图片包含敏感内容需要更短 TTL/按用户隔离，后续需增加命名空间支持。
- 未对 `/api/translate` 的 `engine` 参数做 availability 校验（只校验存在）——若引擎处于 unhealthy 仍可能被选中；需要在 Phase 2 对不可用引擎返回 503 并提示客户端。

## 4. 维护难点
- 多引擎配置管理：每个引擎的 AK/SK、地域、限流策略不同，建议抽象 `EngineConfig`，集中由 settings 管理，避免散落在代码中。
- ORM + Pydantic 字段映射：TextLayer `style`/`bbox` 采用 JSON，需要持续保持前后端 schema 一致；推荐在 Phase 3 建立 shared schema 测试（利用 JSON fixtures 验证）。
- 熔断状态观测：目前只在日志中打印，运维难以察觉；后续需将 `_health_state` 暴露为 `/api/engines` 字段或 Prometheus metrics。
- 单元/集成测试覆盖：目前 API 集成测试借助 Fake 服务覆盖 Happy Path，尚未覆盖 SSE/Job queue；建议 Phase 2/3 加入更多 e2e/contract 测试以防回归。
