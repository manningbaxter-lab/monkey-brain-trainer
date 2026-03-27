import React, { useState, useEffect } from "react";

export default function App() {
  const [task, setTask] = useState("");
  const [taskCommitted, setTaskCommitted] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

  const [locked, setLocked] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const [streak, setStreak] = useState(0);

  // TIMER
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
    setTimeLeft(minutes * 60);
  }

  function commitTask() {
    if (!task.trim()) return;
    setTaskCommitted(true);
  }

  function completeTask() {
    if (taskDone) return;
    setTaskDone(true);
    setStreak(s => s + 1);
  }

  return (
    <div style={styles.page}>
      <h2>🐵 Monkey Brain Trainer</h2>

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
              <button style={styles.btn} onClick={() => start(30)}>
                30 min work
              </button>
              <button style={styles.btn} onClick={() => start(60)}>
                60 min work
              </button>
            </>
          )}
        </div>
      )}

      {/* TASK INPUT — ALWAYS VISIBLE */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="One hard task"
          value={task}
          disabled={taskCommitted}
          onChange={e => setTask(e.target.value)}
        />

        {!taskCommitted && (
          <button style={styles.btn} onClick={commitTask}>
            Commit task
          </button>
        )}

        {taskCommitted && !taskDone && (
          <p style={styles.hint}>Do the task. Phone down.</p>
        )}
      </div>

      {/* TASK DONE */}
      {taskCommitted && (
        <div style={styles.card}>
          <p style={{ textDecoration: taskDone ? "line-through" : "none" }}>
            {task}
          </p>
          {!taskDone && (
            <button style={styles.btn} onClick={completeTask}>
              Mark complete
            </button>
          )}
        </div>
      )}

      {/* STREAK */}
      <div style={styles.card}>
        <p>🔥 Streak: {streak}</p>
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
    margin: "12px 0",
    display: "grid",
    gap: 8
  },
  input: {
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#000",
    color: "#fff"
  },
  btn: {
    padding: 12,
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14
  },
  timer: {
    fontSize: 20,
    margin: "8px 0"
  },
  hint: {
    fontSize: 12,
    color: "#777"
  },
  footer: {
    fontSize: 11,
    color: "#666",
    marginTop: 12
  }
};
