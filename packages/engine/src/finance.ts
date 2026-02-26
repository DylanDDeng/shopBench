import type { Loan, FinancialRecord } from "./types.js";
import { randomUUID } from "node:crypto";

export class FinanceManager {
  cash: number;
  loans: Loan[];
  history: FinancialRecord[];
  dailyRent: number;

  constructor(initialCash: number, monthlyRent: number) {
    this.cash = initialCash;
    this.loans = [];
    this.history = [];
    this.dailyRent = monthlyRent / 30;
  }

  spend(amount: number, _description?: string): boolean {
    if (this.cash - amount < 0) {
      throw new Error(`Insufficient cash: need ¥${amount.toFixed(2)}, have ¥${this.cash.toFixed(2)}`);
    }
    this.cash -= amount;
    return true;
  }

  earn(amount: number): void {
    this.cash += amount;
  }

  canAfford(amount: number): boolean {
    return this.cash >= amount;
  }

  takeLoan(amount: number, termDays: number, day: number): Loan {
    const loan: Loan = {
      id: randomUUID(),
      principal: amount,
      remainingBalance: amount,
      dailyInterestRate: 0.0005,
      termDays,
      startDay: day,
    };
    this.loans.push(loan);
    this.cash += amount;
    return loan;
  }

  repayLoan(loanId: string, amount: number): number {
    const loan = this.loans.find(l => l.id === loanId);
    if (!loan) throw new Error(`Loan not found: ${loanId}`);
    if (!this.canAfford(amount)) {
      throw new Error(`Cannot afford repayment of ¥${amount}, cash: ¥${this.cash.toFixed(2)}`);
    }
    const repayment = Math.min(amount, loan.remainingBalance);
    this.cash -= repayment;
    loan.remainingBalance -= repayment;
    if (loan.remainingBalance <= 0) {
      this.loans = this.loans.filter(l => l.id !== loanId);
    }
    return loan.remainingBalance;
  }

  processDaily(
    day: number,
    revenue: number,
    costOfGoods: number,
    wages: number,
    marketingSpend: number,
    otherExpenses: number,
  ): FinancialRecord {
    // Accrue loan interest
    let loanInterest = 0;
    for (const loan of this.loans) {
      const interest = loan.remainingBalance * loan.dailyInterestRate;
      loan.remainingBalance += interest;
      loanInterest += interest;
    }

    const rent = this.dailyRent;
    this.cash += revenue;
    this.cash -= wages + rent + loanInterest + marketingSpend + otherExpenses;

    const netProfit = revenue - costOfGoods - wages - rent - loanInterest - marketingSpend - otherExpenses;

    const record: FinancialRecord = {
      day,
      revenue: round2(revenue),
      costOfGoods: round2(costOfGoods),
      wages: round2(wages),
      rent: round2(rent),
      loanInterest: round2(loanInterest),
      marketingSpend: round2(marketingSpend),
      otherExpenses: round2(otherExpenses),
      netProfit: round2(netProfit),
      cashBalance: round2(this.cash),
    };

    this.history.push(record);
    return record;
  }

  getOutstandingLoans(): number {
    return this.loans.reduce((sum, l) => sum + l.remainingBalance, 0);
  }

  getFinancialSummary(n = 7): FinancialRecord[] {
    return this.history.slice(-n);
  }

  snapshot() {
    return structuredClone({ cash: this.cash, loans: this.loans, history: this.history });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
