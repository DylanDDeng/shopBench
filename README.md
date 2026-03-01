# ShopBench Benchmark

一个用于评估 LLM Agent 经营能力的基准测试。

---

## 1) 这个 Benchmark 是做什么的

ShopBench 模拟一个 **30 天便利店经营场景**。  
模型每天会收到经营状态，然后通过工具调用来做决策（进货、调价、促销、排班、借还款等）。

它评估的不是“单步问答能力”，而是模型在连续经营中的综合能力：

- 是否能把策略转成稳定现金结果
- 是否能在不确定条件下持续执行
- 是否会出现“分析很多、动作很少”或“高毛利但现金失败”等经营偏差

核心导向：**最终看现金，不看期末库存账面价值**。

---

## 2) 提供给模型的工具（24 个）

### 信息查询（11）

1. `check_inventory`
2. `view_financials`
3. `check_market_trends`
4. `view_customer_feedback`
5. `view_competitors`
6. `check_weather_forecast`
7. `view_employee_status`
8. `view_suppliers`
9. `view_pending_orders`
10. `estimate_order`
11. `view_sales_history`

### 运营动作（5）

1. `purchase_goods`
2. `set_price`
3. `run_promotion`
4. `adjust_store_hours`
5. `dispose_goods`

### 人员管理（3）

1. `hire_employee`
2. `fire_employee`
3. `assign_shift`

### 金融工具（2）

1. `take_loan`
2. `repay_loan`

### 策略工具（3）

1. `negotiate_supplier`
2. `upgrade_store`
3. `launch_marketing`

说明：在 `base` 场景下，每天最多可调用 `20` 次工具（`maxToolCallsPerDay`）。

---

## 3) 衡量指标（排名与诊断）

## 主指标（用于最终排名）

### `30 天净现金`（`finalScore`）

项目中的主分数定义为：

`finalScore = finalCash + inventoryValue - initialCash - outstandingLoans`

在默认配置下，`inventoryLiquidationRate = 0`，因此等价于：

`finalScore ≈ finalCash - initialCash - outstandingLoans`

这意味着：

- 期末没卖掉的库存默认不计分
- 借款未还会直接拉低最终结果
- 排名按 `finalScore` 从高到低

## 次指标（用于分析，不直接决定排名）

### `毛利率`

`grossMargin = (totalRevenue - totalCOGS) / totalRevenue`

用于衡量销售结构和加价能力。  
注意：毛利率高不代表现金结果一定好。

### `工具调用错误率`

`errorRate = failedToolCalls / totalToolCalls`

用于衡量执行可靠性和工具调用质量。

### `每日净利润/净现金相关趋势`

用于观察模型在 30 天中的经营稳定性、波动和阶段性失误（例如连续零收入天）。

---

## 4) 一句话理解 ShopBench

这是一个看“**模型是否能把经营动作持续兑现为真实现金结果**”的 benchmark，而不是只看单日利润或单次决策是否漂亮。
