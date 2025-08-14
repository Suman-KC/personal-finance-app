import React, { useMemo, useState, useRef } from "react";

// Helpers
const monthKey = (dateStr) => dateStr?.slice(0, 7) || "";

const formatMonthLabel = (ym) => {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const shortDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// CSV helpers
const toCsv = (rows) => {
  const header = ["id", "type", "amount", "description", "date", "category"];
  const escape = (val = "") =>
    `"${String(val).replaceAll('"', '""')}"`; // RFC4180-style escaping
  const lines = [
    header.join(","),
    ...rows.map((t) =>
      [
        t.id,
        t.type,
        t.amount,
        escape(t.description),
        t.date,
        escape(t.category || "General"),
      ].join(",")
    ),
  ];
  return lines.join("\n");
};

const download = (filename, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const parseCsv = async (file) => {
  const text = await file.text();
  const [headerLine, ...dataLines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((h) => h.trim());
  const req = ["id", "type", "amount", "description", "date", "category"];

  // quick header validation (order must match our export)
  if (headers.join(",") !== req.join(",")) {
    throw new Error("CSV header must be: " + req.join(","));
  }

  // very simple CSV parse for our known format (quotes escaped double)
  const unquote = (s) =>
    s.startsWith('"') && s.endsWith('"')
      ? s.slice(1, -1).replaceAll('""', '"')
      : s;

  const rows = dataLines.map((line) => {
    // split into 6 fields while honoring quotes
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'; // escaped quote
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur);

    const [id, type, amount, description, date, category] = fields.map(unquote);
    return {
      id: Number(id) || Date.now() + Math.random(),
      type: type === "expense" ? "expense" : "income",
      amount: Number(amount) || 0,
      description: description || "",
      date: date || new Date().toISOString().slice(0, 10),
      category: category || "General",
    };
  });

  return rows;
};

export default function TransactionList({
  transactions,
  deleteTransaction,
  updateTransaction,
  setTransactions, // for CSV import
}) {
  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return [...set].filter(Boolean).sort((a, b) => (a > b ? -1 : 1));
  }, [transactions]);

  const defaultMonth = months[0] || new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const filtered = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    type: "income",
    amount: "",
    description: "",
    date: "",
    category: "General",
  });

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      type: t.type,
      amount: String(t.amount),
      description: t.description,
      date: t.date,
      category: t.category || "General",
    });
  };

  const saveEdit = () => {
    if (!editForm.amount || !editForm.description || !editForm.date) return;
    updateTransaction({
      id: editingId,
      type: editForm.type,
      amount: Number(editForm.amount),
      description: editForm.description.trim(),
      date: editForm.date,
      category: editForm.category?.trim() || "General",
    });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // CSV refs/handlers
  const fileRef = useRef(null);
  const onExport = () => {
    const monthRows = filtered.sort((a, b) => (a.date > b.date ? -1 : 1));
    download(`transactions_${selectedMonth}.csv`, toCsv(monthRows));
  };
  const onImportClick = () => fileRef.current?.click();
  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseCsv(file);
      // Merge with existing, keeping unique ids (new entries can overwrite by id)
      const map = new Map(transactions.map((t) => [t.id, t]));
      rows.forEach((r) => map.set(r.id, r));
      setTransactions(Array.from(map.values()));
      alert("CSV import complete.");
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="card">
      <div className="records-header">
        <h2>📜 Records</h2>

        <div className="records-actions">
          <button className="mini-btn" onClick={onExport}>Export CSV</button>
          <button className="mini-btn outline" onClick={onImportClick}>Import CSV</button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onImport}
            style={{ display: "none" }}
          />
        </div>

        <div className="month-picker">
          <label>Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {!months.includes(defaultMonth) && (
              <option value={defaultMonth}>{formatMonthLabel(defaultMonth)}</option>
            )}
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="summary-grid">
        <div className="pill pill-income">💵 Income: <strong>{income.toFixed(2)}</strong></div>
        <div className="pill pill-expense">💸 Expense: <strong>{expense.toFixed(2)}</strong></div>
        <div className="pill pill-balance">📊 Balance: <strong>{(income - expense).toFixed(2)}</strong></div>
      </div>

      <ul className="tx-list">
        {filtered.length === 0 && (
          <li className="empty">No transactions for {formatMonthLabel(selectedMonth)}.</li>
        )}

        {filtered
          .sort((a, b) => (a.date > b.date ? -1 : 1))
          .map((t) => {
            const isEditing = editingId === t.id;
            return (
              <li key={t.id} className={`tx-row ${t.type}`}>
                {!isEditing ? (
                  <>
                    <div className="tx-main">
                      <span className="tx-emoji">{t.type === "income" ? "💵" : "💸"}</span>
                      <div className="tx-text">
                        <div className="tx-desc">{t.description}</div>
                        <div className="tx-meta">
                          <span>{shortDate(t.date)}</span>
                          <span className="dot">•</span>
                          <span className="category">{t.category || "General"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="tx-amt">
                      {t.type === "expense" ? "-" : "+"}
                      {Number(t.amount).toFixed(2)}
                    </div>
                    <div className="row-actions">
                      <button className="mini-btn outline" onClick={() => startEdit(t)}>Edit</button>
                      <button className="delete-btn" onClick={() => deleteTransaction(t.id)}>❌</button>
                    </div>
                  </>
                ) : (
                  <div className="edit-row">
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      placeholder="Amount"
                    />

                    <input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                    />

                    <input
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      placeholder="Category"
                    />

                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />

                    <div className="row-actions">
                      <button className="mini-btn" onClick={saveEdit}>Save</button>
                      <button className="mini-btn outline" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
