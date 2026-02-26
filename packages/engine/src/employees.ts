import type { Employee, EmployeeRole, Shift } from "./types.js";
import type { SeededRNG } from "./rng.js";
import { randomUUID } from "node:crypto";

const NAMES = [
  "小明", "小红", "小刚", "小丽", "阿强", "阿芳", "大伟", "小燕",
  "志强", "美玲", "建国", "秀英", "文杰", "晓华", "国庆", "春花",
];

export class EmployeeManager {
  private employees: Employee[];
  private nameIndex = 0;
  private rng: SeededRNG;

  constructor(initial: Omit<Employee, "id" | "daysEmployed">[], rng: SeededRNG) {
    this.rng = rng;
    this.employees = initial.map(e => ({
      ...e,
      id: randomUUID(),
      daysEmployed: 0,
    }));
  }

  hire(role: EmployeeRole, dailyWage: number): Employee {
    const name = NAMES[this.nameIndex % NAMES.length];
    this.nameIndex++;

    const employee: Employee = {
      id: randomUUID(),
      name,
      role,
      dailyWage,
      morale: 70 + Math.floor(this.rng.random() * 20),
      skill: 30 + Math.floor(this.rng.random() * 30),
      shift: "full_day",
      daysEmployed: 0,
    };
    this.employees.push(employee);
    return employee;
  }

  fire(employeeId: string): Employee {
    const idx = this.employees.findIndex(e => e.id === employeeId);
    if (idx === -1) throw new Error(`Employee ${employeeId} not found`);
    const [removed] = this.employees.splice(idx, 1);
    return removed;
  }

  assignShift(employeeId: string, shift: Shift): void {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) throw new Error(`Employee ${employeeId} not found`);
    emp.shift = shift;
  }

  /** Process daily: increase experience, drift morale, return total wages */
  processDaily(): { totalWages: number; events: string[] } {
    let totalWages = 0;
    const events: string[] = [];

    for (const emp of this.employees) {
      emp.daysEmployed++;
      // Skill grows slowly
      if (emp.skill < 95) emp.skill += 0.3;
      // Morale drifts
      emp.morale += (this.rng.random() - 0.5) * 4;
      emp.morale = Math.max(10, Math.min(100, emp.morale));

      // Low morale events
      if (emp.morale < 30 && this.rng.random() < 0.2) {
        events.push(`${emp.name} is very unhappy and considering quitting.`);
      }
      if (emp.morale < 15 && this.rng.random() < 0.3) {
        events.push(`${emp.name} quit due to low morale!`);
        this.employees = this.employees.filter(e => e.id !== emp.id);
        continue;
      }

      totalWages += emp.dailyWage;
    }

    return { totalWages: Math.round(totalWages * 100) / 100, events };
  }

  /** Apply morale change to all employees */
  applyMoraleChange(delta: number): void {
    for (const emp of this.employees) {
      emp.morale = Math.max(0, Math.min(100, emp.morale + delta));
    }
  }

  /** Get service quality multiplier based on staffing */
  getServiceQuality(): number {
    if (this.employees.length === 0) return 0.5;
    const avgSkill = this.employees.reduce((s, e) => s + e.skill, 0) / this.employees.length;
    const avgMorale = this.employees.reduce((s, e) => s + e.morale, 0) / this.employees.length;
    return 0.5 + (avgSkill / 100) * 0.3 + (avgMorale / 100) * 0.2;
  }

  getAll(): Employee[] {
    return this.employees;
  }

  get(id: string): Employee | undefined {
    return this.employees.find(e => e.id === id);
  }

  snapshot(): Employee[] {
    return structuredClone(this.employees);
  }
}
