import React, { useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ addTransaction }) {
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    description: "",
    date: today(),
    category: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.date) return;

    addTransaction({
      id: Date.now(),
      type: form.type,
      amount: Number(form.amount),
      description: form.description.trim(),
      date: form.date, // YYYY-MM-DD
      category: form.category?.trim() || "General"
    });

    setForm({ type: "income", amount: "", description: "", date: today(), category: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="card form-grid">
      <h2>➕ Add Transaction</h2>

      <label>
        Type
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </label>

      <label>
        Amount
        <input
          name="amount"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          min="0"
          required
        />
      </label>

      <label>
        Description
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          required
        />
      </label>

      <label>
        Category (optional)
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="e.g., Food, Rent, Salary"
        />
      </label>

      <label>
        Date
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
        />
      </label>

      <button type="submit">Add</button>
    </form>
  );
}
