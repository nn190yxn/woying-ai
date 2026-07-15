# 复盘沉淀

## 概念

复盘沉淀是把用户每次执行后的数据、诊断结果和有效内容类型保存下来，再聚合为下一轮计划建议的机制。

当前实现集中在抖音链路。

## 数据来源

用户在 `/douyin/video-diagnoser` 输入执行数据并生成诊断后，前端会调用 `/api/douyin/review-records` 保存记录。

保存字段包括：

- 行业。
- 目标。
- 来源上下文。
- 复盘输入。
- 诊断结果。
- 有效内容类型。
- 下一步行动。

## 数据表

表名：`douyin_review_records`。

关键字段：

- `user_id`：用户隔离。
- `industry`：行业。
- `goal`：目标。
- `source_context`：来自计划表或其他入口的上下文。
- `input_data`：复盘输入指标。
- `result_data`：诊断输出结果。
- `effective_content_types`：有效内容类型数组。
- `next_actions`：下一步行动数组。
- `created_at`：创建时间。
- `updated_at`：更新时间。

## 洞察接口

接口：`GET /api/douyin/review-records/insights`。

权限：`pro`。

统计范围：当前登录用户最近 20 条复盘记录。

输出包括：

- `recordCount`：参与统计的记录数。
- `topContentTypes`：有效内容类型排行。
- `metrics.totalViews`：总播放。
- `metrics.completionRate`：完播率。
- `metrics.inquiryRate`：咨询率。
- `metrics.redemptionRate`：核销率。
- `metrics.roi`：投流 ROI。
- `nextRoundSuggestion`：下一轮计划建议。

## 短板判断

当前后端判断规则：

- 完播率低于 25%，短板为内容完播不足。
- 咨询率低于 0.5%，短板为私信咨询不足。
- 核销率低于 30%，短板为到店核销不足。
- ROI 存在且低于 1.5，短板为投流效率不足。
- 其他情况短板为有效内容可放大。

## 下一轮联动

复盘页的“生成下一轮计划”入口会把以下上下文带给 `/douyin/quick-plan`：

- 有效内容类型。
- 下一轮建议。
- 关键数据摘要。
- 当前短板。

后端 `/api/douyin/quick-plan` 会在 prompt 中读取这些上下文，让下一轮 15 天计划优先围绕已验证内容类型和当前短板展开。

## 验证建议

复盘沉淀改动后，至少验证：

- 保存复盘返回 `status: success`。
- 最近复盘能正确读取。
- 洞察接口能返回 `recordCount` 和 `nextRoundSuggestion.title`。
- 有效内容类型排行能在前端展示。
- 从复盘页进入计划页时，query 上下文能被计划生成使用。
