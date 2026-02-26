#!/usr/bin/env python3
"""
ShopBench 综合分析脚本 - 对所有11个模型进行全面深度分析
"""

import json
import os
import re
from collections import defaultdict, Counter
from pathlib import Path

DATA_DIR = Path("/Users/chengshengdeng/bench/shopbench/data")
NEW_MODELS = [
    "anthropic/claude-opus-4.6",
    "deepseek/deepseek-v3.2",
]

# ─────────────────────────────────────────────
# 辅助函数
# ─────────────────────────────────────────────

def short_name(model_id: str) -> str:
    """缩短模型名称用于表格显示"""
    mapping = {
        "anthropic/claude-opus-4.6": "Claude Opus 4.6",
        "anthropic/claude-sonnet-4.6": "Claude Sonnet 4.6",
        "deepseek/deepseek-v3.2": "DeepSeek v3.2",
        "google/gemini-3-flash-preview": "Gemini 3 Flash",
        "google/gemini-3.1-pro-preview": "Gemini 3.1 Pro",
        "minimax/minimax-m2.5": "MiniMax M2.5",
        "moonshotai/kimi-k2.5": "Kimi K2.5",
        "openai/gpt-5.3-codex": "GPT-5.3 Codex",
        "qwen/qwen3.5-122b-a10b": "Qwen3.5-122B",
        "qwen/qwen3.5-plus-02-15": "Qwen3.5-Plus",
        "z-ai/glm-5": "GLM-5",
    }
    return mapping.get(model_id, model_id.split("/")[-1])


def load_all_data():
    """加载所有JSON数据文件"""
    models = []
    for f in sorted(DATA_DIR.glob("*.json")):
        if f.name.startswith("."):
            continue
        with open(f) as fp:
            data = json.load(fp)
        models.append(data)
    return models


def extract_metrics(data):
    """从一个模型的数据中提取全部分析指标"""
    m = data["metrics"]
    days = data["days"]
    info = {}

    # 基本信息
    info["model"] = data["model"]
    info["short_name"] = short_name(data["model"])
    info["finalScore"] = data["finalScore"]
    info["finalCash"] = m["finalCash"]
    info["inventoryValue"] = m["inventoryValue"]
    info["outstandingLoans"] = m["outstandingLoans"]
    info["cashFlowBreakDays"] = m["cashFlowBreakDays"]
    info["inventoryWasteRate"] = m["inventoryWasteRate"]
    info["bankruptcyTriggered"] = m["bankruptcyTriggered"]
    info["totalToolCalls"] = m["totalToolCalls"]
    info["avgDailyProfit"] = m["avgDailyProfit"]

    # 客户满意度趋势
    cst = m["customerSatisfactionTrend"]
    info["satisfaction_start"] = cst[0] if cst else None
    info["satisfaction_end"] = cst[-1] if cst else None
    info["satisfaction_delta"] = (cst[-1] - cst[0]) if cst else 0
    info["satisfaction_trend"] = cst

    # 声誉趋势
    info["reputation_start"] = days[0]["stateSnapshot"]["reputation"]
    info["reputation_end"] = days[-1]["stateSnapshot"]["reputation"]
    info["reputation_delta"] = info["reputation_end"] - info["reputation_start"]

    # 每日利润趋势
    info["dailyProfitTrend"] = m["dailyProfitTrend"]

    # 总收入和总支出
    total_revenue = sum(d["settlement"]["revenue"] for d in days)
    total_expenses = sum(d["settlement"]["expenses"] for d in days)
    info["total_revenue"] = total_revenue
    info["total_expenses"] = total_expenses
    info["revenue_expense_ratio"] = total_revenue / total_expenses if total_expenses > 0 else 0

    # 工具调用分析
    tool_counts = Counter()
    error_count = 0
    total_calls = 0
    for d in days:
        for tc in d["toolCalls"]:
            tool_counts[tc["name"]] += 1
            total_calls += 1
            r = tc["result"]
            if isinstance(r, dict) and "error" in r:
                error_count += 1
            elif isinstance(r, str) and "error" in r.lower():
                error_count += 1
    info["tool_counts"] = dict(tool_counts)
    info["error_count"] = error_count
    info["error_rate"] = error_count / total_calls if total_calls > 0 else 0
    info["actual_total_calls"] = total_calls

    # 员工管理
    hire_count = 0
    fire_count = 0
    for d in days:
        for tc in d["toolCalls"]:
            if tc["name"] == "hire_employee":
                r = tc["result"]
                if isinstance(r, dict) and "error" not in r:
                    hire_count += 1
            elif tc["name"] == "fire_employee":
                r = tc["result"]
                if isinstance(r, dict) and "error" not in r:
                    fire_count += 1
    info["hire_count"] = hire_count
    info["fire_count"] = fire_count

    # 采购模式
    purchase_count = tool_counts.get("purchase_goods", 0)
    purchase_spend = 0
    for d in days:
        for tc in d["toolCalls"]:
            if tc["name"] == "purchase_goods":
                r = tc["result"]
                if isinstance(r, dict) and "totalCost" in r:
                    purchase_spend += r["totalCost"]
                elif isinstance(r, dict) and "error" not in r:
                    # try to extract cost from result
                    if "cost" in r:
                        purchase_spend += r["cost"]
    info["purchase_count"] = purchase_count
    info["purchase_spend"] = purchase_spend

    # 定价策略
    info["set_price_count"] = tool_counts.get("set_price", 0)

    # 促销使用
    info["run_promotion_count"] = tool_counts.get("run_promotion", 0)

    # 末期行为（最后5天）
    last5 = days[-5:]
    last5_purchases = 0
    last5_promotions = 0
    last5_revenue = []
    for d in last5:
        for tc in d["toolCalls"]:
            if tc["name"] == "purchase_goods":
                last5_purchases += 1
            elif tc["name"] == "run_promotion":
                last5_promotions += 1
        last5_revenue.append(d["settlement"]["revenue"])
    info["last5_purchases"] = last5_purchases
    info["last5_promotions"] = last5_promotions
    info["last5_revenue_trend"] = last5_revenue
    info["last5_revenue_avg"] = sum(last5_revenue) / len(last5_revenue) if last5_revenue else 0

    # 现金趋势
    first5_cash = [days[i]["stateSnapshot"]["cash"] for i in range(min(5, len(days)))]
    last5_cash = [days[i]["stateSnapshot"]["cash"] for i in range(max(0, len(days)-5), len(days))]
    info["first5_cash_avg"] = sum(first5_cash) / len(first5_cash)
    info["last5_cash_avg"] = sum(last5_cash) / len(last5_cash)
    info["cash_trend"] = [d["stateSnapshot"]["cash"] for d in days]

    # 每日客户数趋势
    info["daily_customers"] = [d["settlement"]["customerCount"] for d in days]
    info["customer_start_avg"] = sum(info["daily_customers"][:5]) / min(5, len(info["daily_customers"]))
    info["customer_end_avg"] = sum(info["daily_customers"][-5:]) / min(5, len(info["daily_customers"]))

    # 每日收入
    info["daily_revenue"] = [d["settlement"]["revenue"] for d in days]

    # 员工数趋势
    info["employee_counts"] = [len(d["stateSnapshot"]["employees"]) for d in days]

    # 库存过期
    total_expired_qty = 0
    for d in days:
        for item in d["settlement"].get("expiredItems", []):
            total_expired_qty += item.get("quantity", 0)
    info["total_expired_qty"] = total_expired_qty

    # 贷款使用
    info["loan_taken"] = any(len(d["stateSnapshot"].get("loans", [])) > 0 for d in days)

    # 店铺升级
    info["upgrades"] = []
    for d in days:
        ups = d["stateSnapshot"].get("upgrades", [])
        if ups:
            info["upgrades"] = ups
            break  # just get the last known upgrades
    # actually get from last day
    info["upgrades"] = days[-1]["stateSnapshot"].get("upgrades", [])

    # 日均工具调用
    info["avg_tool_calls_per_day"] = total_calls / len(days)

    # 每日详细数据（用于深度分析）
    info["days_data"] = days

    return info


def print_separator(char="═", length=120):
    print(char * length)


def print_header(title):
    print()
    print_separator()
    print(f"  {title}")
    print_separator()
    print()


def format_money(val):
    if val >= 0:
        return f"¥{val:,.2f}"
    return f"-¥{abs(val):,.2f}"


def format_pct(val):
    return f"{val:.1%}"


def trend_arrow(val):
    if val > 0:
        return f"+{val:.1f} ^"
    elif val < 0:
        return f"{val:.1f} v"
    return f"{val:.1f} -"


# ─────────────────────────────────────────────
# 主分析
# ─────────────────────────────────────────────

def main():
    print("\n" + "=" * 120)
    print("    ShopBench 模拟经营基准测试 —— 全面综合分析报告")
    print("    分析模型数量：11    模拟天数：30天    初始资金：¥20,000")
    print("=" * 120)

    raw_data = load_all_data()
    all_metrics = [extract_metrics(d) for d in raw_data]

    # 按 finalScore 排序
    all_metrics.sort(key=lambda x: x["finalScore"], reverse=True)

    # ═══════════════════════════════════════════
    # 1. 综合排名表
    # ═══════════════════════════════════════════
    print_header("一、综合排名表（按最终净利润排序）")

    # Header
    print(f"{'排名':>4} │ {'模型名称':<20} │ {'净利润':>12} │ {'最终现金':>12} │ {'库存价值':>10} │ {'贷款':>8} │ "
          f"{'日均利润':>10} │ {'总收入':>12} │ {'收支比':>6} │ {'破产':>4}")
    print("─" * 130)

    for i, m in enumerate(all_metrics):
        bankrupt_str = "是" if m["bankruptcyTriggered"] else "否"
        marker = " **" if m["model"] in NEW_MODELS else ""
        print(f"{i+1:>4} │ {m['short_name'] + marker:<20} │ {format_money(m['finalScore']):>12} │ "
              f"{format_money(m['finalCash']):>12} │ {format_money(m['inventoryValue']):>10} │ "
              f"{format_money(m['outstandingLoans']):>8} │ {format_money(m['avgDailyProfit']):>10} │ "
              f"{format_money(m['total_revenue']):>12} │ {m['revenue_expense_ratio']:>6.2f} │ {bankrupt_str:>4}")

    print()
    print("  ** 标记为本次新增模型")

    # ═══════════════════════════════════════════
    # 2. 运营指标详细对比
    # ═══════════════════════════════════════════
    print_header("二、运营指标详细对比")

    print(f"{'排名':>4} │ {'模型名称':<20} │ {'满意度变化':>12} │ {'声誉变化':>10} │ {'客户趋势':>12} │ "
          f"{'库存浪费率':>10} │ {'过期数量':>8} │ {'错误率':>8} │ {'工具调用':>8} │ {'日均调用':>8}")
    print("─" * 130)

    for i, m in enumerate(all_metrics):
        sat_str = f"{m['satisfaction_start']}->{m['satisfaction_end']}"
        rep_str = f"{m['reputation_start']}->{m['reputation_end']}"
        cust_str = f"{m['customer_start_avg']:.0f}->{m['customer_end_avg']:.0f}"
        print(f"{i+1:>4} │ {m['short_name']:<20} │ {sat_str:>12} │ {rep_str:>10} │ {cust_str:>12} │ "
              f"{format_pct(m['inventoryWasteRate']):>10} │ {m['total_expired_qty']:>8} │ "
              f"{format_pct(m['error_rate']):>8} │ {m['totalToolCalls']:>8} │ {m['avg_tool_calls_per_day']:>8.1f}")

    # ═══════════════════════════════════════════
    # 3. 策略行为对比
    # ═══════════════════════════════════════════
    print_header("三、策略行为对比")

    print(f"{'排名':>4} │ {'模型名称':<20} │ {'采购次数':>8} │ {'采购支出':>12} │ {'定价调整':>8} │ "
          f"{'促销次数':>8} │ {'招聘':>4} │ {'解雇':>4} │ {'贷款':>4} │ {'升级数':>6} │ {'末期采购':>8} │ {'末期促销':>8}")
    print("─" * 130)

    for i, m in enumerate(all_metrics):
        loan_str = "是" if m["loan_taken"] else "否"
        upgrade_count = len(m["upgrades"])
        print(f"{i+1:>4} │ {m['short_name']:<20} │ {m['purchase_count']:>8} │ {format_money(m['purchase_spend']):>12} │ "
              f"{m['set_price_count']:>8} │ {m['run_promotion_count']:>8} │ {m['hire_count']:>4} │ {m['fire_count']:>4} │ "
              f"{loan_str:>4} │ {upgrade_count:>6} │ {m['last5_purchases']:>8} │ {m['last5_promotions']:>8}")

    # ═══════════════════════════════════════════
    # 4. 工具使用详细分解
    # ═══════════════════════════════════════════
    print_header("四、工具使用分布")

    # Get all tool names
    all_tools = set()
    for m in all_metrics:
        all_tools.update(m["tool_counts"].keys())
    all_tools = sorted(all_tools)

    # 分类工具
    info_tools = ["check_inventory", "check_market_trends", "check_weather_forecast", "view_competitors",
                  "view_customer_feedback", "view_employee_status", "view_financials", "view_pending_orders",
                  "view_sales_history", "view_suppliers", "estimate_order"]
    action_tools = ["purchase_goods", "set_price", "run_promotion", "hire_employee", "fire_employee",
                    "adjust_store_hours", "assign_shift"]

    print("  【信息收集类工具】")
    print(f"{'模型名称':<20}", end="")
    for t in info_tools:
        if t in all_tools:
            label = t.replace("check_", "").replace("view_", "")[:10]
            print(f" │ {label:>10}", end="")
    print()
    print("─" * 160)
    for m in all_metrics:
        print(f"{m['short_name']:<20}", end="")
        for t in info_tools:
            if t in all_tools:
                count = m["tool_counts"].get(t, 0)
                print(f" │ {count:>10}", end="")
        print()

    print()
    print("  【行动执行类工具】")
    print(f"{'模型名称':<20}", end="")
    for t in action_tools:
        if t in all_tools:
            label = t[:12]
            print(f" │ {label:>12}", end="")
    print()
    print("─" * 130)
    for m in all_metrics:
        print(f"{m['short_name']:<20}", end="")
        for t in action_tools:
            if t in all_tools:
                count = m["tool_counts"].get(t, 0)
                print(f" │ {count:>12}", end="")
        print()

    # 信息/行动比
    print()
    print("  【信息收集 vs 行动执行比例】")
    print(f"{'模型名称':<20} │ {'信息调用':>8} │ {'行动调用':>8} │ {'信息占比':>8} │ {'行动占比':>8} │ {'信息/行动比':>10}")
    print("─" * 80)
    for m in all_metrics:
        info_cnt = sum(m["tool_counts"].get(t, 0) for t in info_tools)
        action_cnt = sum(m["tool_counts"].get(t, 0) for t in action_tools)
        total = info_cnt + action_cnt
        ratio = info_cnt / action_cnt if action_cnt > 0 else float("inf")
        print(f"{m['short_name']:<20} │ {info_cnt:>8} │ {action_cnt:>8} │ {info_cnt/total*100:>7.1f}% │ "
              f"{action_cnt/total*100:>7.1f}% │ {ratio:>10.2f}")

    # ═══════════════════════════════════════════
    # 5. 财务效率分析
    # ═══════════════════════════════════════════
    print_header("五、财务效率深度分析")

    print(f"{'模型名称':<20} │ {'总收入':>12} │ {'总支出':>12} │ {'净利润':>12} │ {'利润率':>8} │ "
          f"{'采购ROI':>8} │ {'前5日均现金':>12} │ {'后5日均现金':>12} │ {'现金变化':>10}")
    print("─" * 130)
    for m in all_metrics:
        profit_margin = m["finalScore"] / m["total_revenue"] if m["total_revenue"] > 0 else 0
        purchase_roi = (m["total_revenue"] - m["purchase_spend"]) / m["purchase_spend"] if m["purchase_spend"] > 0 else 0
        cash_change = m["last5_cash_avg"] - m["first5_cash_avg"]
        print(f"{m['short_name']:<20} │ {format_money(m['total_revenue']):>12} │ {format_money(m['total_expenses']):>12} │ "
              f"{format_money(m['finalScore']):>12} │ {profit_margin:>7.1%} │ {purchase_roi:>7.1%} │ "
              f"{format_money(m['first5_cash_avg']):>12} │ {format_money(m['last5_cash_avg']):>12} │ "
              f"{trend_arrow(cash_change):>10}")

    # ═══════════════════════════════════════════
    # 6. 每日利润趋势对比（简化）
    # ═══════════════════════════════════════════
    print_header("六、每日利润趋势对比（前10天 / 中10天 / 后10天 均值）")

    print(f"{'模型名称':<20} │ {'前10天均值':>12} │ {'中10天均值':>12} │ {'后10天均值':>12} │ {'趋势判断':<20}")
    print("─" * 90)
    for m in all_metrics:
        dpt = m["dailyProfitTrend"]
        avg1 = sum(dpt[:10]) / 10
        avg2 = sum(dpt[10:20]) / 10
        avg3 = sum(dpt[20:]) / len(dpt[20:]) if len(dpt) > 20 else 0
        if avg3 > avg1 and avg3 > 0:
            trend = "持续改善 ^"
        elif avg3 < avg1 and avg3 < 0:
            trend = "持续恶化 v"
        elif avg3 > avg2:
            trend = "末期回升 ~^"
        elif avg3 < avg2:
            trend = "末期下滑 ~v"
        else:
            trend = "相对稳定 -"
        print(f"{m['short_name']:<20} │ {format_money(avg1):>12} │ {format_money(avg2):>12} │ "
              f"{format_money(avg3):>12} │ {trend:<20}")

    # ═══════════════════════════════════════════
    # 7. 两个新模型的深度分析
    # ═══════════════════════════════════════════
    for new_model_id in NEW_MODELS:
        m = next((x for x in all_metrics if x["model"] == new_model_id), None)
        if not m:
            continue

        rank = next(i+1 for i, x in enumerate(all_metrics) if x["model"] == new_model_id)

        print_header(f"七-{'A' if new_model_id == NEW_MODELS[0] else 'B'}. 【新模型深度分析】{m['short_name']}（排名 #{rank}/11）")

        # 总体概览
        print("  ┌─ 核心指标概览 ─────────────────────────────────────────┐")
        print(f"  │  最终净利润: {format_money(m['finalScore']):>12}  │  最终现金: {format_money(m['finalCash']):>12}        │")
        print(f"  │  库存价值:   {format_money(m['inventoryValue']):>12}  │  未偿贷款: {format_money(m['outstandingLoans']):>12}        │")
        print(f"  │  日均利润:   {format_money(m['avgDailyProfit']):>12}  │  总工具调用: {m['totalToolCalls']:>8}              │")
        print(f"  │  总收入:     {format_money(m['total_revenue']):>12}  │  总支出:   {format_money(m['total_expenses']):>12}        │")
        print(f"  │  满意度:     {m['satisfaction_start']}->{m['satisfaction_end']:>3}       │  声誉:     {m['reputation_start']}->{m['reputation_end']:>3}             │")
        print(f"  │  错误次数:   {m['error_count']:>8}           │  错误率:   {format_pct(m['error_rate']):>8}               │")
        print(f"  │  库存浪费率: {format_pct(m['inventoryWasteRate']):>8}           │  过期数量: {m['total_expired_qty']:>8}               │")
        print(f"  │  破产触发:   {'是' if m['bankruptcyTriggered'] else '否':>4}               │  现金断流天: {m['cashFlowBreakDays']:>4}                  │")
        print("  └───────────────────────────────────────────────────────┘")

        # 逐日策略分解
        print()
        print("  【逐日策略分解】")
        print(f"  {'天':>4} │ {'收入':>8} │ {'支出':>8} │ {'净利润':>8} │ {'客户数':>6} │ {'现金':>10} │ {'声誉':>4} │ {'满意度':>4} │ {'工具':>4} │ {'关键行动'}")
        print("  " + "─" * 115)

        days_data = m["days_data"]
        for d in days_data:
            day_num = d["day"]
            s = d["settlement"]
            ss = d["stateSnapshot"]

            # 收集关键行动
            actions = []
            for tc in d["toolCalls"]:
                args = tc["arguments"]
                if tc["name"] == "purchase_goods":
                    pid = args.get("item", args.get("productId", "?"))
                    qty = args.get("quantity", "?")
                    actions.append(f"采购({pid}x{qty})")
                elif tc["name"] == "set_price":
                    pid = args.get("item", args.get("productId", "?"))
                    price = args.get("price", args.get("newPrice", "?"))
                    actions.append(f"定价({pid}={price})")
                elif tc["name"] == "run_promotion":
                    pid = args.get("item", args.get("productId", "?"))
                    disc = args.get("discount_pct", args.get("discountPct", "?"))
                    dur = args.get("duration_days", "")
                    dur_str = f",{dur}天" if dur else ""
                    actions.append(f"促销({pid},{disc}%{dur_str})")
                elif tc["name"] == "hire_employee":
                    role = args.get("role", "?")
                    actions.append(f"招聘({role})")
                elif tc["name"] == "fire_employee":
                    eid = args.get("employee_id", args.get("id", ""))
                    actions.append(f"解雇({eid[:6]})" if eid else "解雇")
                elif tc["name"] == "adjust_store_hours":
                    o = args.get("open", args.get("openHour", "?"))
                    c = args.get("close", args.get("closeHour", "?"))
                    actions.append(f"营业({o}-{c})")

            action_str = "; ".join(actions[:4])
            if len(actions) > 4:
                action_str += f" +{len(actions)-4}项"

            # 事件
            events = s.get("events", [])
            event_names = [e.get("name", "")[:8] for e in events]
            if event_names:
                action_str += f" [事件:{','.join(event_names)}]"

            tc_count = len(d["toolCalls"])
            sat_val = m["satisfaction_trend"][day_num - 1] if day_num <= len(m["satisfaction_trend"]) else "?"

            print(f"  {day_num:>4} │ {s['revenue']:>8.0f} │ {s['expenses']:>8.0f} │ {s['netProfit']:>8.1f} │ "
                  f"{s['customerCount']:>6} │ {ss['cash']:>10.0f} │ {ss['reputation']:>4} │ {sat_val:>4} │ "
                  f"{tc_count:>4} │ {action_str}")

        # 关键转折点分析
        print()
        print("  【关键转折点分析】")
        dpt = m["dailyProfitTrend"]
        for i in range(1, len(dpt)):
            prev = dpt[i-1]
            curr = dpt[i]
            if (prev >= 0 and curr < -100) or (prev < -100 and curr >= 0):
                direction = "盈利->亏损" if curr < 0 else "亏损->盈利"
                print(f"    第{i+1}天: {direction} (¥{prev:.1f} -> ¥{curr:.1f})")
                # describe what happened
                day_data = days_data[i]
                events = day_data["settlement"].get("events", [])
                if events:
                    for e in events:
                        print(f"      原因: 事件 [{e['name']}] - {e['description'][:60]}")
                # check if no purchases or low revenue
                rev = day_data["settlement"]["revenue"]
                cust = day_data["settlement"]["customerCount"]
                print(f"      当日: 收入¥{rev:.0f}, 客户{cust}人")

        # 做得好和做得差
        print()
        print("  【优势与不足分析】")

        # Strengths
        print("    优势:")
        if m["satisfaction_delta"] > 10:
            print(f"      + 客户满意度持续提升 ({m['satisfaction_start']}->{m['satisfaction_end']})")
        if m["reputation_delta"] > 10:
            print(f"      + 声誉稳步增长 ({m['reputation_start']}->{m['reputation_end']})")
        if m["error_rate"] < 0.02:
            print(f"      + 工具使用精准，错误率极低 ({format_pct(m['error_rate'])})")
        if m["total_revenue"] > 15000:
            print(f"      + 较高的总收入水平 ({format_money(m['total_revenue'])})")
        if m["revenue_expense_ratio"] > 1.0:
            print(f"      + 收入覆盖支出 (收支比: {m['revenue_expense_ratio']:.2f})")
        if not m["bankruptcyTriggered"]:
            print(f"      + 未触发破产")
        if m["inventoryWasteRate"] < 0.05:
            print(f"      + 库存浪费率低 ({format_pct(m['inventoryWasteRate'])})")
        if m["run_promotion_count"] > 10:
            print(f"      + 积极使用促销策略 ({m['run_promotion_count']}次)")
        if m["purchase_count"] > 30:
            print(f"      + 采购频率高，保持库存充足 ({m['purchase_count']}次)")

        # Weaknesses
        print("    不足:")
        if m["finalScore"] < 0:
            print(f"      - 最终亏损 ({format_money(m['finalScore'])})")
        if m["avgDailyProfit"] < 0:
            print(f"      - 日均利润为负 ({format_money(m['avgDailyProfit'])})")
        if m["inventoryWasteRate"] > 0.1:
            print(f"      - 库存浪费率偏高 ({format_pct(m['inventoryWasteRate'])})")
        if m["error_rate"] > 0.05:
            print(f"      - 工具调用错误率偏高 ({format_pct(m['error_rate'])})")
        if m["customer_end_avg"] < m["customer_start_avg"]:
            print(f"      - 客户数呈下降趋势 ({m['customer_start_avg']:.0f}->{m['customer_end_avg']:.0f})")
        if m["outstandingLoans"] > 0:
            print(f"      - 存在未偿还贷款 ({format_money(m['outstandingLoans'])})")
        # Check for long loss streaks
        loss_streak = 0
        max_loss_streak = 0
        for p in dpt:
            if p < 0:
                loss_streak += 1
                max_loss_streak = max(max_loss_streak, loss_streak)
            else:
                loss_streak = 0
        if max_loss_streak >= 5:
            print(f"      - 最长连续亏损天数: {max_loss_streak}天")
        if m["purchase_count"] < 10:
            print(f"      - 采购频率偏低 ({m['purchase_count']}次)，可能库存不足")
        if m["set_price_count"] < 5:
            print(f"      - 定价调整次数少 ({m['set_price_count']}次)，定价策略不够灵活")

        # 独特策略
        print()
        print("  【独特策略分析（与其他模型对比）】")

        # Compare to averages
        avg_purchase = sum(x["purchase_count"] for x in all_metrics) / len(all_metrics)
        avg_promo = sum(x["run_promotion_count"] for x in all_metrics) / len(all_metrics)
        avg_price = sum(x["set_price_count"] for x in all_metrics) / len(all_metrics)
        avg_revenue = sum(x["total_revenue"] for x in all_metrics) / len(all_metrics)
        avg_tools = sum(x["totalToolCalls"] for x in all_metrics) / len(all_metrics)
        avg_hire = sum(x["hire_count"] for x in all_metrics) / len(all_metrics)

        if m["purchase_count"] > avg_purchase * 1.3:
            print(f"    * 采购频率显著高于平均 ({m['purchase_count']} vs 均值{avg_purchase:.0f}) -> 积极补货策略")
        elif m["purchase_count"] < avg_purchase * 0.7:
            print(f"    * 采购频率显著低于平均 ({m['purchase_count']} vs 均值{avg_purchase:.0f}) -> 保守库存策略")

        if m["run_promotion_count"] > avg_promo * 1.5:
            print(f"    * 促销使用远高于平均 ({m['run_promotion_count']} vs 均值{avg_promo:.0f}) -> 促销驱动型")
        elif m["run_promotion_count"] < avg_promo * 0.5:
            print(f"    * 促销使用远低于平均 ({m['run_promotion_count']} vs 均值{avg_promo:.0f}) -> 非促销依赖型")

        if m["set_price_count"] > avg_price * 1.5:
            print(f"    * 定价调整频繁 ({m['set_price_count']} vs 均值{avg_price:.0f}) -> 动态定价策略")
        elif m["set_price_count"] < avg_price * 0.5:
            print(f"    * 定价调整较少 ({m['set_price_count']} vs 均值{avg_price:.0f}) -> 稳定定价策略")

        if m["totalToolCalls"] > avg_tools * 1.3:
            print(f"    * 工具调用量高 ({m['totalToolCalls']} vs 均值{avg_tools:.0f}) -> 信息密集型决策")
        elif m["totalToolCalls"] < avg_tools * 0.7:
            print(f"    * 工具调用量低 ({m['totalToolCalls']} vs 均值{avg_tools:.0f}) -> 精简决策型")

        if m["hire_count"] > avg_hire * 1.5:
            print(f"    * 招聘更积极 ({m['hire_count']} vs 均值{avg_hire:.0f}) -> 重视人力资源扩张")

        # 声誉和满意度变化原因分析
        print()
        print("  【声誉与满意度变化原因分析】")
        print(f"    声誉: {m['reputation_start']} -> {m['reputation_end']} (变化: {m['reputation_delta']:+d})")
        print(f"    满意度: {m['satisfaction_start']} -> {m['satisfaction_end']} (变化: {m['satisfaction_delta']:+d})")

        # Analyze reputation by phase
        rep_trend = [d["stateSnapshot"]["reputation"] for d in days_data]
        print(f"    声誉趋势(每5天): ", end="")
        for i in range(0, 30, 5):
            avg_rep = sum(rep_trend[i:i+5]) / min(5, len(rep_trend[i:i+5]))
            print(f"D{i+1}-{i+5}:{avg_rep:.0f}", end="  ")
        print()

        # Check what drove reputation
        print("    影响因素:")
        if m["run_promotion_count"] > 5:
            print(f"      - 促销活动 ({m['run_promotion_count']}次) 有助于吸引客户、提升满意度")
        stockout_mentions = 0
        for d in days_data:
            summary = d["settlement"].get("summary", "")
            if "缺货" in summary or "stockout" in summary.lower() or "out of stock" in summary.lower():
                stockout_mentions += 1
        if stockout_mentions > 0:
            print(f"      - 出现缺货情况约{stockout_mentions}天，可能影响声誉")
        total_events = sum(len(d["settlement"].get("events", [])) for d in days_data)
        if total_events > 0:
            print(f"      - 遭遇{total_events}个随机事件，影响经营稳定性")
        if m["satisfaction_delta"] > 0:
            print(f"      - 满意度持续提升说明服务质量和产品供应逐步改善")
        if m["reputation_delta"] > 0:
            print(f"      - 声誉增长反映了持续经营带来的品牌积累")

    # ═══════════════════════════════════════════
    # 8. 策略分型与综合对比
    # ═══════════════════════════════════════════
    print_header("八、策略分型与综合对比分析")

    print("  【策略原型分类】")
    print()

    for m in all_metrics:
        # Determine archetype
        archetypes = []

        # Check aggression
        if m["purchase_count"] > 40 and m["run_promotion_count"] > 15:
            archetypes.append("激进扩张型")
        elif m["purchase_count"] < 15 and m["run_promotion_count"] < 5:
            archetypes.append("极度保守型")
        elif m["purchase_count"] > 30:
            archetypes.append("积极补货型")

        if m["set_price_count"] > 30:
            archetypes.append("动态定价型")
        elif m["set_price_count"] < 5:
            archetypes.append("固定定价型")

        if m["hire_count"] >= 3:
            archetypes.append("人力扩张型")
        if m["loan_taken"]:
            archetypes.append("杠杆经营型")
        if m["run_promotion_count"] > 20:
            archetypes.append("促销驱动型")

        info_cnt = sum(m["tool_counts"].get(t, 0) for t in info_tools)
        action_cnt = sum(m["tool_counts"].get(t, 0) for t in action_tools)
        if info_cnt / (action_cnt + 1) > 3:
            archetypes.append("信息密集型")
        elif action_cnt / (info_cnt + 1) > 1:
            archetypes.append("行动导向型")

        if m["revenue_expense_ratio"] > 1.1:
            archetypes.append("高效盈利型")
        elif m["revenue_expense_ratio"] < 0.9:
            archetypes.append("入不敷出型")

        if not archetypes:
            archetypes.append("平衡稳健型")

        archetype_str = " | ".join(archetypes)
        marker = "★ " if m["model"] in NEW_MODELS else "  "
        print(f"  {marker}{m['short_name']:<20} -> {archetype_str}")

    # 综合维度评分
    print()
    print("  【综合维度评分（相对排名，1=最佳，11=最差）】")
    print()

    # Create rankings for multiple dimensions
    dimensions = {
        "盈利能力": sorted(all_metrics, key=lambda x: x["finalScore"], reverse=True),
        "收入规模": sorted(all_metrics, key=lambda x: x["total_revenue"], reverse=True),
        "成本控制": sorted(all_metrics, key=lambda x: x["revenue_expense_ratio"], reverse=True),
        "客户管理": sorted(all_metrics, key=lambda x: x["satisfaction_delta"], reverse=True),
        "声誉建设": sorted(all_metrics, key=lambda x: x["reputation_delta"], reverse=True),
        "库存管理": sorted(all_metrics, key=lambda x: -x["inventoryWasteRate"]),
        "风险控制": sorted(all_metrics, key=lambda x: (x["bankruptcyTriggered"], x["outstandingLoans"], x["cashFlowBreakDays"])),
        "工具效率": sorted(all_metrics, key=lambda x: x["finalScore"] / max(x["totalToolCalls"], 1), reverse=True),
    }

    # Build ranking map
    rankings = {m["model"]: {} for m in all_metrics}
    for dim_name, sorted_list in dimensions.items():
        for rank, m in enumerate(sorted_list, 1):
            rankings[m["model"]][dim_name] = rank

    dim_names = list(dimensions.keys())
    print(f"  {'模型名称':<20}", end="")
    for dn in dim_names:
        print(f" │ {dn:>8}", end="")
    print(f" │ {'综合均分':>8}")
    print("  " + "─" * 110)

    for m in all_metrics:
        marker = "★" if m["model"] in NEW_MODELS else " "
        print(f"  {marker}{m['short_name']:<19}", end="")
        scores = []
        for dn in dim_names:
            r = rankings[m["model"]][dn]
            scores.append(r)
            print(f" │ {r:>8}", end="")
        avg_rank = sum(scores) / len(scores)
        print(f" │ {avg_rank:>8.1f}")

    # 风险管理对比
    print()
    print("  【风险管理对比】")
    print(f"  {'模型名称':<20} │ {'破产':>4} │ {'贷款':>4} │ {'现金断流天':>10} │ {'最大连续亏损':>12} │ {'最低现金':>10} │ {'风险等级'}")
    print("  " + "─" * 90)

    for m in all_metrics:
        # Calc max consecutive losses
        loss_streak = 0
        max_loss_streak = 0
        for p in m["dailyProfitTrend"]:
            if p < 0:
                loss_streak += 1
                max_loss_streak = max(max_loss_streak, loss_streak)
            else:
                loss_streak = 0

        # Min cash
        min_cash = min(m["cash_trend"])

        # Risk level
        risk_score = 0
        if m["bankruptcyTriggered"]:
            risk_score += 5
        if m["outstandingLoans"] > 0:
            risk_score += 2
        if m["cashFlowBreakDays"] > 0:
            risk_score += 2
        if max_loss_streak >= 10:
            risk_score += 3
        elif max_loss_streak >= 5:
            risk_score += 1
        if min_cash < 5000:
            risk_score += 2
        elif min_cash < 10000:
            risk_score += 1

        if risk_score >= 5:
            risk_level = "高风险"
        elif risk_score >= 3:
            risk_level = "中风险"
        else:
            risk_level = "低风险"

        bankrupt_str = "是" if m["bankruptcyTriggered"] else "否"
        loan_str = "是" if m["loan_taken"] else "否"

        print(f"  {m['short_name']:<20} │ {bankrupt_str:>4} │ {loan_str:>4} │ {m['cashFlowBreakDays']:>10} │ "
              f"{max_loss_streak:>12}天 │ {format_money(min_cash):>10} │ {risk_level}")

    # 客户管理效果
    print()
    print("  【客户管理效果对比】")
    print(f"  {'模型名称':<20} │ {'满意度变化':>10} │ {'声誉变化':>8} │ {'客户数变化':>10} │ {'促销次数':>8} │ "
          f"{'前5日客户均值':>12} │ {'后5日客户均值':>12} │ {'客户增长率':>10}")
    print("  " + "─" * 115)

    for m in all_metrics:
        cust_growth = (m["customer_end_avg"] - m["customer_start_avg"]) / m["customer_start_avg"] * 100 if m["customer_start_avg"] > 0 else 0
        print(f"  {m['short_name']:<20} │ {m['satisfaction_delta']:>+10} │ {m['reputation_delta']:>+8} │ "
              f"{m['customer_end_avg'] - m['customer_start_avg']:>+10.0f} │ {m['run_promotion_count']:>8} │ "
              f"{m['customer_start_avg']:>12.0f} │ {m['customer_end_avg']:>12.0f} │ {cust_growth:>+9.1f}%")

    # ═══════════════════════════════════════════
    # 9. 总结
    # ═══════════════════════════════════════════
    print_header("九、最终总结与洞察")

    best = all_metrics[0]
    worst = all_metrics[-1]

    print(f"  最佳表现: {best['short_name']} (净利润: {format_money(best['finalScore'])})")
    print(f"  最差表现: {worst['short_name']} (净利润: {format_money(worst['finalScore'])})")
    print()

    # Profitability
    profitable = [m for m in all_metrics if m["finalScore"] > 0]
    unprofitable = [m for m in all_metrics if m["finalScore"] <= 0]
    print(f"  盈利模型: {len(profitable)}/11 ({', '.join(m['short_name'] for m in profitable)})")
    print(f"  亏损模型: {len(unprofitable)}/11 ({', '.join(m['short_name'] for m in unprofitable)})")
    print()

    # New models summary
    print("  【新模型表现总结】")
    for nm_id in NEW_MODELS:
        m = next((x for x in all_metrics if x["model"] == nm_id), None)
        if not m:
            continue
        rank = next(i+1 for i, x in enumerate(all_metrics) if x["model"] == nm_id)
        print(f"\n  {m['short_name']} (排名 #{rank}/11):")
        print(f"    净利润: {format_money(m['finalScore'])}")
        print(f"    核心特征: ", end="")

        traits = []
        if m["purchase_count"] > 30:
            traits.append("积极采购")
        elif m["purchase_count"] < 15:
            traits.append("保守采购")
        if m["set_price_count"] > 20:
            traits.append("频繁调价")
        if m["run_promotion_count"] > 10:
            traits.append("善用促销")
        if m["satisfaction_delta"] > 10:
            traits.append("满意度提升明显")
        if m["reputation_delta"] > 10:
            traits.append("声誉增长好")
        if m["error_rate"] < 0.02:
            traits.append("操作精准")
        if m["finalScore"] > 0:
            traits.append("成功盈利")
        else:
            traits.append("最终亏损")
        print(", ".join(traits))

    print()

    # Key insights
    print("  【关键洞察】")
    print()

    # 1. Revenue vs Profit correlation
    max_rev_model = max(all_metrics, key=lambda x: x["total_revenue"])
    print(f"  1. 收入最高的模型 ({max_rev_model['short_name']}, ¥{max_rev_model['total_revenue']:,.0f}) "
          f"{'并非' if max_rev_model != best else '同时也是'}利润最高的模型。"
          f"{'说明高收入不等于高利润，成本控制同样重要。' if max_rev_model != best else ''}")

    # 2. Tool calls efficiency
    max_tools_model = max(all_metrics, key=lambda x: x["totalToolCalls"])
    min_tools_model = min(all_metrics, key=lambda x: x["totalToolCalls"])
    print(f"\n  2. 工具调用最多: {max_tools_model['short_name']} ({max_tools_model['totalToolCalls']}次, 利润{format_money(max_tools_model['finalScore'])})")
    print(f"     工具调用最少: {min_tools_model['short_name']} ({min_tools_model['totalToolCalls']}次, 利润{format_money(min_tools_model['finalScore'])})")
    print(f"     -> 工具调用数量与利润{'正相关' if max_tools_model['finalScore'] > min_tools_model['finalScore'] else '无明显正相关'}，决策质量比数量更重要。")

    # 3. Promotion effectiveness
    high_promo = sorted(all_metrics, key=lambda x: x["run_promotion_count"], reverse=True)[:3]
    low_promo = sorted(all_metrics, key=lambda x: x["run_promotion_count"])[:3]
    avg_profit_high_promo = sum(m["finalScore"] for m in high_promo) / 3
    avg_profit_low_promo = sum(m["finalScore"] for m in low_promo) / 3
    print(f"\n  3. 促销频率最高3个模型的平均利润: {format_money(avg_profit_high_promo)}")
    print(f"     促销频率最低3个模型的平均利润: {format_money(avg_profit_low_promo)}")
    promo_effect = "促销策略总体有助于提升利润" if avg_profit_high_promo > avg_profit_low_promo else "过多促销并不一定带来更高利润"
    print(f"     -> {promo_effect}")

    # 4. Bankruptcy insight
    bankrupt_models = [m for m in all_metrics if m["bankruptcyTriggered"]]
    if bankrupt_models:
        print(f"\n  4. 触发破产的模型: {', '.join(m['short_name'] for m in bankrupt_models)}")
        print(f"     共同特征: ", end="")
        common = []
        if all(m["outstandingLoans"] > 0 for m in bankrupt_models):
            common.append("均有未偿贷款")
        if all(m["purchase_count"] > 30 for m in bankrupt_models):
            common.append("采购过于激进")
        if common:
            print(", ".join(common))
        else:
            print("各有不同的失败原因")
    else:
        print(f"\n  4. 所有模型均未触发破产，说明整体风险控制水平较好。")

    # 5. Satisfaction vs Profit
    high_sat = sorted(all_metrics, key=lambda x: x["satisfaction_delta"], reverse=True)[:3]
    print(f"\n  5. 满意度提升最大的3个模型:")
    for m in high_sat:
        print(f"     {m['short_name']}: 满意度+{m['satisfaction_delta']}, 利润{format_money(m['finalScore'])}")
    print(f"     -> 客户满意度提升{'与利润表现正相关' if high_sat[0]['finalScore'] > 0 else '并不总是伴随盈利'}。")

    print()
    print_separator()
    print("  分析完毕。以上为ShopBench全部11个模型的综合分析报告。")
    print_separator()
    print()


if __name__ == "__main__":
    main()
