import React, { useState, useEffect } from "react";

export default function App() {
  const [task, setTask] = useState("");
  const [committed, setCommitted] = useState(false);
  const [done, setDone] = useState(false);

  const [locked, setLocked] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const [streak, setStreak] = useState(0);
  const [penalty, setPenalty] = useState(false);

  // ✅ LOAD PERSISTED STATE
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTask(saved.task);
      setCommitted(saved.committed);
      setDone(saved.done);
      setStreak(saved.streak);
    }
  }, []);

  // ✅ SAVE STATE
  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({ task, committed, done, streak })
    );
  }, [task, committed, done, streak]);

  // ✅ TIMER
  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) setLocked(false);
  }, [timeLeft]);

  function start(minutes) {
    setLocked(true);
    setPenalty(false);
    setTimeLeft(minutes * 60);
  }

  function commitTask() {
    if (!task.trim()) return;
    setCommitted(true);
  }

  function completeTask() {
    if (done) return;
    setDone(true);
    setStreak(s => s + 1);
  }

  function failDiscipline() {
    setPenalty(true);
    setStreak(s => Math.max(0, s - 1));
  }

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: 8 }}>🐵 Monkey Brain Trainer</h2>

      {/* LOCK */}
      {locked && (
        <div style={styles.card}>
          <p>Focus first.</p>
          <p style={styles.timer}>
            {timeLeft
              ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
              : "Start a session"}
          </p>
          {!timeLeft && (
            <>
              <button style={styles.btn} onClick={() => start(30)}>30 min</button>
              <button style={styles.btn} onClick={() => start(60)}>60 min</button>
            </>
          )}
        </div>
      )}

      {/* TASK INPUT */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="One hard task"
          value={task}
          disabled={committed}
          onChange={e => setTask(e.target.value)}
        />
        {!committed && (
          <button style={styles.btn} onClick={commitTask}>
            Commit task
          </button>
        )}
        {committed && !done && (
          <p style={styles.hint}>Do it. Phone down.</p>
        )}
      </div>

      {/* COMPLETE */}
      {committed && (
        <div style={styles.card}>
          <p style={{ textDecoration: done ? "line-through" : "none" }}>
            {task}
          </p>
          {!done && (
            <button style={styles.btn} onClick={completeTask}>
              Mark complete
            </button>
          )}
        </div>
      )}

      {/* PENALTY */}
      {!done && committed && (
        <button style={styles.penalty} onClick={failDiscipline}>
          I quit / got distracted
        </button>
      )}

      {/* STATS */}
      <div style={styles.card}>
        <p>🔥 Streak: {streak}</p>
        {penalty && <p style={{ color: "#f66" }}>Penalty applied</p>}
      </div>

      <p style={styles.footer}>Comfort rots. Effort adapts.</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    padding: 16,
    fontFamily: "system-ui",
    textAlign: "center"
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 12,
    padding: 12,
    margin: "12px 0"
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#000",
    color: "#fff"
  },
  btn: {
    width: "100%",
    padding: 12,
    marginTop: 8,
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  timer: {
    fontSize: 20,
    margin: "8px 0"
  },
  hint: {
    fontSize: 12,
    color: "#777"
  },
  penalty: {
    width: "100%",
    padding: 10,
    background: "#400",
    border: "none",
    borderRadius: 8,
    color: "#fff"
  },
  footer: {
    fontSize: 11,
    color: "#666",
    marginTop: 16
  }
};
