import React, { useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const monthKey = (dateStr) => dateStr?.slice(0, 7) || "";
const formatMonthLabel = (ym) => {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export default function Charts({ transactions }) {
  // Build per-month aggregates
  const monthsSorted = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return [...set].filter(Boolean).sort(); // ASC for chart’s x-axis
  }, [transactions]);

  const perMonth = useMemo(() => {
    const map = new Map();
    transactions.forEach((t) => {
      const m = monthKey(t.date);
      if (!m) return;
      const obj = map.get(m) || { income: 0, expense: 0, byCat: {} };
      const amt = Number(t.amount) || 0;
      if (t.type === "income") obj.income += amt;
      else obj.expense += amt;
      const cat = (t.category || "General").trim();
      obj.byCat[cat] = (obj.byCat[cat] || 0) + amt * (t.type === "expense" ? 1 : 0); // expense categories for pie
      map.set(m, obj);
    });
    return map;
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState(
    monthsSorted[monthsSorted.length - 1] || new Date().toISOString().slice(0, 7)
  );

  const monthData = perMonth.get(selectedMonth) || { income: 0, expense: 0, byCat: {} };

  // Bar chart data (Income vs Expense per month)
  const barData = useMemo(() => {
    const labels = monthsSorted.map((m) => formatMonthLabel(m));
    const income = monthsSorted.map((m) => (perMonth.get(m)?.income || 0));
    const expense = monthsSorted.map((m) => (perMonth.get(m)?.expense || 0));

    return {
      labels,
      datasets: [
        { label: "Income", data: income },
        { label: "Expense", data: expense },
      ],
    };
  }, [monthsSorted, perMonth]);

  const pieData = useMemo(() => {
    const labels = Object.keys(monthData.byCat);
    const data = labels.map((k) => monthData.byCat[k]);
    return {
      labels,
      datasets: [{ label: "Expenses by Category", data }],
    };
  }, [monthData]);

  return (
    <div className="card">
      <h2>📈 Charts</h2>

      <div className="chart-wrap">
        <div className="chart-card">
          <h3>Income vs Expense by Month</h3>
          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>

        <div className="chart-card">
          <div className="pie-header">
            <h3>Expense Breakdown</h3>
            <div className="month-picker">
              <label>Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {monthsSorted.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
