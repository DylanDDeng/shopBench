import type { World } from "@shopbench/engine";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute a tool call against the world state.
 * Returns a structured result suitable for sending back to the model.
 */
export function executeToolCall(world: World, call: ToolCall): ToolResult {
  try {
    const data = dispatch(world, call.name, call.arguments);
    return { name: call.name, success: true, data };
  } catch (err: any) {
    return { name: call.name, success: false, error: err.message ?? String(err) };
  }
}

function dispatch(world: World, name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    // Information
    case "check_inventory":
      return world.checkInventory();
    case "view_financials":
      return world.viewFinancials();
    case "check_market_trends":
      return world.checkMarketTrends();
    case "view_customer_feedback":
      return world.viewCustomerFeedback();
    case "view_competitors":
      return world.viewCompetitors();
    case "check_weather_forecast":
      return world.checkWeatherForecast();
    case "view_employee_status":
      return world.viewEmployeeStatus();
    case "view_suppliers":
      return world.viewSuppliers();
    case "view_pending_orders":
      return world.viewPendingOrders();
    case "view_sales_history":
      return world.viewSalesHistory();
    case "estimate_order":
      return world.estimateOrder(
        args.item as string,
        args.quantity as number,
        args.supplier as string | undefined,
      );

    // Operations
    case "purchase_goods":
      return world.purchaseGoods(
        args.item as string,
        args.quantity as number,
        args.supplier as string | undefined,
      );
    case "set_price":
      return world.setPrice(args.item as string, args.price as number);
    case "run_promotion":
      return world.runPromotion(
        args.item as string,
        args.discount_pct as number,
        args.duration_days as number,
      );
    case "adjust_store_hours":
      return world.adjustStoreHours(args.open_hour as number, args.close_hour as number);
    case "dispose_goods":
      return world.disposeGoods(args.item as string, args.quantity as number);

    // Personnel
    case "hire_employee":
      return world.hireEmployee(args.role as string, args.wage as number);
    case "fire_employee":
      return world.fireEmployee(args.employee_id as string);
    case "assign_shift":
      return world.assignShift(args.employee_id as string, args.shift as string);

    // Finance
    case "take_loan":
      return world.takeLoan(args.amount as number, args.term_days as number);
    case "repay_loan":
      return world.repayLoan(args.loan_id as string, args.amount as number);

    // Strategy
    case "negotiate_supplier":
      return world.negotiateSupplier(args.supplier_id as string, args.proposed_terms as string);
    case "upgrade_store":
      return world.upgradeStore(args.upgrade_type as any);
    case "launch_marketing":
      return world.launchMarketing(args.channel as any, args.budget as number);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
