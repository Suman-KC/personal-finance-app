import React, { useState, useEffect } from "react";
import ProfileForm from "./Components/ProfileForm";
import TransactionForm from "./Components/TransactionForm";
import TransactionList from "./Components/TransactionList";
import Charts from "./Components/Charts";

export default function App() {
  const [profile, setProfile] = useState(() =>
    JSON.parse(localStorage.getItem("profile")) || { name: "", email: "", photo: "" }
  );

  const [transactions, setTransactions] = useState(() =>
    JSON.parse(localStorage.getItem("transactions")) || []
  );

  const [showRecords, setShowRecords] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    localStorage.setItem("profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTransaction = (updated) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <div style={{ maxWidth: "900px", margin: "auto" }}>
      <h1>💰 Personal Finance Manager</h1>

      <ProfileForm profile={profile} setProfile={setProfile} />
      <TransactionForm addTransaction={addTransaction} />

      <div className="toggle-row">
        <button className="toggle-btn" onClick={() => setShowRecords((s) => !s)}>
          {showRecords ? "Hide Records" : "Show Records"}
        </button>
        <button className="toggle-btn secondary" onClick={() => setShowCharts((s) => !s)}>
          {showCharts ? "Hide Charts" : "Show Charts"}
        </button>
      </div>

      {showRecords && (
        <TransactionList
          transactions={transactions}
          deleteTransaction={deleteTransaction}
          updateTransaction={updateTransaction}
          setTransactions={setTransactions}  // for CSV import convenience
        />
      )}

      {showCharts && <Charts transactions={transactions} />}
    </div>
  );
}
