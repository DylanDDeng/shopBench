/**
 * OpenRouter-compatible tool definitions for ShopBench.
 * Each tool follows the OpenAI function calling schema.
 */

export interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  };
}

export const TOOL_DEFINITIONS: ToolDef[] = [
  // ─── Information Queries ───
  {
    type: "function",
    function: {
      name: "check_inventory",
      description: "View current inventory details including stock levels, prices, and batch info for all products.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "view_financials",
      description: "View financial report including cash balance, P&L for recent days, outstanding loans, and inventory value.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "check_market_trends",
      description: "View market trends and price direction for all products.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "view_customer_feedback",
      description: "View customer satisfaction, reputation score, and recent feedback.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "view_competitors",
      description: "View competitor information including their pricing level, promotions, and reputation.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "check_weather_forecast",
      description: "View weather forecast for the next 3 days. Weather affects customer foot traffic.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "view_employee_status",
      description: "View all employees with their roles, shifts, morale, skill levels, and wages.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "view_suppliers",
      description: "View all supplier details including products with actual unit costs, delivery days, reliability, and minimum order amount (in ¥).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "view_pending_orders",
      description: "View all in-transit purchase orders with their items, cost, order day, and expected arrival day.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_order",
      description: "Preview an order cost without placing it. Returns unit cost, total cost, whether it meets the supplier minimum, and delivery days.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "Product ID" },
          quantity: { type: "number", description: "Number of units" },
          supplier: { type: "string", description: "Supplier ID (optional, uses default if omitted)" },
        },
        required: ["item", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_sales_history",
      description: "View sales history for the last 7 days: daily average sold, total sold, total revenue, and stockout days per product.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  // ─── Operations ───
  {
    type: "function",
    function: {
      name: "purchase_goods",
      description: "Order goods from a supplier. Items arrive after delivery delay (1-3 days). Cost is deducted immediately.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "Product ID to purchase" },
          quantity: { type: "number", description: "Number of units to order" },
          supplier: { type: "string", description: "Supplier ID (optional, uses cheapest if omitted)" },
        },
        required: ["item", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_price",
      description: "Set the selling price for a product. Affects all current inventory of that product.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "Product ID" },
          price: { type: "number", description: "New selling price in ¥" },
        },
        required: ["item", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_promotion",
      description: "Start a discount promotion on a product for a specified duration.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "Product ID" },
          discount_pct: { type: "number", description: "Discount percentage (1-80)" },
          duration_days: { type: "number", description: "Number of days the promotion runs" },
        },
        required: ["item", "discount_pct", "duration_days"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_store_hours",
      description: "Change store opening and closing hours. Longer hours = more customers but higher costs.",
      parameters: {
        type: "object",
        properties: {
          open_hour: { type: "number", description: "Opening hour (0-23)" },
          close_hour: { type: "number", description: "Closing hour (1-24)" },
        },
        required: ["open_hour", "close_hour"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dispose_goods",
      description: "Dispose of expired or unwanted inventory. Useful before health inspections.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "Product ID" },
          quantity: { type: "number", description: "Number of units to dispose" },
        },
        required: ["item", "quantity"],
      },
    },
  },

  // ─── Personnel ───
  {
    type: "function",
    function: {
      name: "hire_employee",
      description: "Hire a new employee. More staff improves service quality but increases wage costs.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", description: "Employee role", enum: ["cashier", "stocker", "cleaner", "manager"] },
          wage: { type: "number", description: "Daily wage in ¥" },
        },
        required: ["role", "wage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fire_employee",
      description: "Fire an employee by their ID.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "string", description: "Employee ID" },
        },
        required: ["employee_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_shift",
      description: "Assign a shift to an employee.",
      parameters: {
        type: "object",
        properties: {
          employee_id: { type: "string", description: "Employee ID" },
          shift: { type: "string", description: "Shift type", enum: ["morning", "afternoon", "evening", "full_day"] },
        },
        required: ["employee_id", "shift"],
      },
    },
  },

  // ─── Finance ───
  {
    type: "function",
    function: {
      name: "take_loan",
      description: "Take a loan. 0.05% daily interest. Adds cash immediately. Must repay within term.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Loan amount in ¥ (100-50000)" },
          term_days: { type: "number", description: "Repayment term in days (5-30)" },
        },
        required: ["amount", "term_days"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "repay_loan",
      description: "Repay part or all of an outstanding loan.",
      parameters: {
        type: "object",
        properties: {
          loan_id: { type: "string", description: "Loan ID" },
          amount: { type: "number", description: "Amount to repay in ¥" },
        },
        required: ["loan_id", "amount"],
      },
    },
  },

  // ─── Strategy ───
  {
    type: "function",
    function: {
      name: "negotiate_supplier",
      description: "Negotiate with a supplier for better terms. ~40% success rate, can reduce prices 5-10%.",
      parameters: {
        type: "object",
        properties: {
          supplier_id: { type: "string", description: "Supplier ID" },
          proposed_terms: { type: "string", description: "Your negotiation proposal" },
        },
        required: ["supplier_id", "proposed_terms"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upgrade_store",
      description: "Install a store upgrade. One-time cost, permanent benefit.",
      parameters: {
        type: "object",
        properties: {
          upgrade_type: {
            type: "string",
            description: "Type of upgrade",
            enum: ["refrigerator", "shelving", "decoration", "security", "pos_system"],
          },
        },
        required: ["upgrade_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "launch_marketing",
      description: "Launch a marketing campaign to boost reputation and foot traffic.",
      parameters: {
        type: "object",
        properties: {
          channel: {
            type: "string",
            description: "Marketing channel",
            enum: ["flyers", "social_media", "local_newspaper", "loudspeaker"],
          },
          budget: { type: "number", description: "Budget in ¥ (higher = more impact)" },
        },
        required: ["channel", "budget"],
      },
    },
  },
];
