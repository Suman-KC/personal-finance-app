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

// Helpers
const monthKey = (dateStr) => dateStr?.slice(0, 7) || "";
const formatMonthLabel = (ym) => {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export default function Charts({ transactions }) {
  // Sorted list of months present (ASC for x-axis)
  const monthsSorted = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return [...set].filter(Boolean).sort();
  }, [transactions]);

  // Aggregate per month (income, expense, and expense-by-category)
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
      // Only add to category breakdown for expenses
      obj.byCat[cat] = (obj.byCat[cat] || 0) + (t.type === "expense" ? amt : 0);

      map.set(m, obj);
    });
    return map;
  }, [transactions]);

  // Default selected month = latest available (or current month)
  const [selectedMonth, setSelectedMonth] = useState(
    monthsSorted[monthsSorted.length - 1] || new Date().toISOString().slice(0, 7)
  );

  const monthData = perMonth.get(selectedMonth) || { income: 0, expense: 0, byCat: {} };

  // BAR: Income vs Expense per month
  const barData = useMemo(() => {
    const labels = monthsSorted.map((m) => formatMonthLabel(m));
    const income = monthsSorted.map((m) => perMonth.get(m)?.income ?? 0);
    const expense = monthsSorted.map((m) => perMonth.get(m)?.expense ?? 0);
    return {
      labels,
      datasets: [
        { label: "Income", data: income },
        { label: "Expense", data: expense },
      ],
    };
  }, [monthsSorted, perMonth]);

  // PIE: Expense breakdown for selected month
  const pieData = useMemo(() => {
    const labels = Object.keys(monthData.byCat);
    const data = labels.map((k) => monthData.byCat[k]);
    return {
      labels,
      datasets: [{ label: "Expenses by Category", data }],
    };
  }, [monthData]);

  // Options — tuned to keep content within card
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false, // parent controls height
    resizeDelay: 100,
    layout: { padding: { top: 4, right: 4, bottom: 4, left: 4 } },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 10,
          font: (ctx) => ({ size: ctx.chart.width < 420 ? 10 : 12 }),
        },
      },
      tooltip: { intersect: false, mode: "index" },
    },
    scales: {
      x: {
        ticks: {
          callback(val, idx) {
            // Skip every other label on very narrow screens
            const label = this.getLabelForValue(val);
            return this.chart.width < 420 && idx % 2 !== 0 ? "" : label;
          },
          maxRotation: 0,
          autoSkip: true,
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
          font: (ctx) => ({ size: ctx.chart.width < 420 ? 10 : 12 }),
        },
        grid: { drawBorder: false },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 4, right: 4, bottom: 4, left: 4 } },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 10,
          font: (ctx) => ({ size: ctx.chart.width < 420 ? 10 : 12 }),
          // Truncate long labels on very small screens
          generateLabels(chart) {
            const base = ChartJS.overrides.pie.plugins.legend.labels.generateLabels;
            const labels = base(chart);
            const maxLen = chart.width < 420 ? 14 : 24;
            return labels.map((l) => ({
              ...l,
              text: l.text.length > maxLen ? l.text.slice(0, maxLen) + "…" : l.text,
            }));
          },
        },
      },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` } },
    },
  };

  return (
    <div className="card">
      <h2>📈 Charts</h2>

      <div className="chart-wrap">
        {/* BAR CARD */}
        <div className="chart-card">
          <div className="chart-head">
            <h3>Income vs Expense by Month</h3>
          </div>
          <div className="chart-canvas">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* PIE CARD */}
        <div className="chart-card">
          <div className="chart-head pie-header">
            <h3>Expense Breakdown</h3>
            <div className="month-picker">
              <label>Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthsSorted.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="chart-canvas">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
