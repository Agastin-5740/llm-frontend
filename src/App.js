import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

/* ================= CONSTANTS ================= */
const COLORS = ["#10a37f", "#6366f1", "#f59e0b", "#ef4444"];

/* ================= APP ================= */

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendQuery = async () => {
    if (!input.trim()) return;

    const question = input;
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { type: "user", text: question }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/nl-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          type: "bot",
          sql: data.sql,
          explanation: data.explanation,
          rows: data.rows || [],
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { type: "bot", explanation: "⚠️ Backend not reachable." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <span style={styles.logo}>🤖</span>
        <span style={styles.headerTitle}>AI Ticket Analytics</span>
      </header>

      {/* CHAT */}
      <main style={styles.main}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h3>Ask anything about your tickets</h3>
            <p>
              Examples:
              <br />• Show high priority tickets  
              <br />• Billing issues last week  
              <br />• How many open technical tickets?
            </p>
          </div>
        )}

        <div style={styles.chatArea}>
          <AnimatePresence>
            {messages.map((msg, i) =>
              msg.type === "user" ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.userRow}
                >
                  <div style={styles.avatar}>🧑</div>
                  <div style={styles.userMsg}>{msg.text}</div>
                </motion.div>
              ) : (
                <BotMessage key={i} msg={msg} />
              )
            )}
          </AnimatePresence>

          {loading && (
            <div style={styles.botRow}>
              <div style={styles.avatar}>🤖</div>
              <div style={styles.botMsg}>Analyzing data…</div>
            </div>
          )}
        </div>
      </main>

      {/* INPUT */}
      <div style={styles.inputBar}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && sendQuery()}
        />
        <button style={styles.sendBtn} onClick={sendQuery}>➤</button>
      </div>
    </div>
  );
}

/* ================= BOT MESSAGE ================= */

function BotMessage({ msg }) {
  const [showTable, setShowTable] = useState(false);

  const priorityData = useMemo(() => {
    return Object.values(
      msg.rows.reduce((acc, r) => {
        const k = r.priority || "Unknown";
        acc[k] = acc[k] || { name: k, count: 0 };
        acc[k].count++;
        return acc;
      }, {})
    );
  }, [msg.rows]);

  const categoryData = useMemo(() => {
    return Object.values(
      msg.rows.reduce((acc, r) => {
        const k = r.category || "Unknown";
        acc[k] = acc[k] || { name: k, value: 0 };
        acc[k].value++;
        return acc;
      }, {})
    );
  }, [msg.rows]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={styles.botRow}
    >
      <div style={styles.avatar}>🤖</div>
      <div style={styles.botMsg}>
        <div style={styles.botLabel}>Assistant</div>
        <p>{msg.explanation}</p>

        {msg.sql && (
          <details>
            <summary style={styles.sqlToggle}>Show SQL</summary>
            <pre style={styles.sqlBox}>{msg.sql}</pre>
          </details>
        )}

        {msg.rows.length > 0 && (
          <>
            <h4>📊 Ticket Analysis</h4>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10a37f" />
              </BarChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" label>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <button
              style={styles.secondaryBtn}
              onClick={() => setShowTable(!showTable)}
            >
              {showTable ? "Hide ticket data" : "View ticket data"}
            </button>

            {showTable && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {Object.keys(msg.rows[0]).map(col => (
                        <th key={col} style={styles.th}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.rows.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} style={styles.td}>{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: { minHeight: "100vh", background: "#f7f7f8", display: "flex", flexDirection: "column" },

  header: {
    height: 56,
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: 10,
    fontWeight: 600,
  },

  logo: { fontSize: 22 },
  headerTitle: { fontSize: 16 },

  main: { flex: 1, overflow: "auto", padding: "16px", maxWidth: 900, margin: "0 auto" },

  emptyState: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 80,
  },

  emptyIcon: { fontSize: 40, marginBottom: 10 },

  chatArea: { display: "flex", flexDirection: "column", gap: 14 },

  userRow: { display: "flex", justifyContent: "flex-end", gap: 8 },
  botRow: { display: "flex", gap: 8 },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },

  userMsg: {
    background: "#10a37f",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 16,
    maxWidth: "70%",
  },

  botMsg: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: 16,
    borderRadius: 16,
    maxWidth: "85%",
  },

  botLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },

  sqlToggle: { color: "#10a37f", cursor: "pointer", fontSize: 13 },
  sqlBox: { background: "#0f172a", color: "#e5e7eb", padding: 12, borderRadius: 8, marginTop: 6 },

  secondaryBtn: {
    marginTop: 10,
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
  },

  tableWrapper: { marginTop: 10, overflow: "auto", borderRadius: 10, border: "1px solid #e5e7eb" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { background: "#f9fafb", padding: 8, borderBottom: "1px solid #e5e7eb" },
  td: { padding: 8, borderBottom: "1px solid #f1f5f9" },

  inputBar: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    background: "#ffffff",
  },

  input: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 15,
  },

  sendBtn: {
    width: 44,
    borderRadius: 12,
    background: "#10a37f",
    color: "#fff",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
  },
};
