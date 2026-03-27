import React, { useState, useEffect } from "react";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  const [newTask, setNewTask] = useState("");
  const [newHour, setNewHour] = useState("");
  const [newMinute, setNewMinute] = useState("");
  const [repeatDaily, setRepeatDaily] = useState(false);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const MIN_SECONDS = 10 * 60;

  /* ---------- LOAD / SAVE ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt_tasks"));
    if (saved) setTasks(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("mbt_tasks", JSON.stringify(tasks));
  }, [tasks]);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && running) setRunning(false);
  }, [timeLeft, running]);

  /* ---------- HELPERS ---------- */
  function totalSeconds() {
    return hours * 3600 + minutes * 60;
  }

  function startTimer() {
    const secs = totalSeconds();
    if (secs < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }
    setTimeLeft(secs);
    setRunning(true);
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: newTask,
        time: `${newHour}:${newMinute}`,
        repeat: repeatDaily,
        doneToday: false
      }
    ]);
    setNewTask("");
    setNewHour("");
    setNewMinute("");
    setRepeatDaily(false);
  }

  function completeTask(id) {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, doneToday: true } : t
    ));
    setActiveTaskId(null);
    setRunning(false);
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div style={styles.page}>
      <h2>🐵 Monkey Brain Trainer</h2>

      {/* ADD TASK */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Task description"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />

        <div style={styles.row}>
          <input
            style={styles.time}
            placeholder="HH"
            value={newHour}
            onChange={e => setNewHour(e.target.value)}
          />
          :
          <input
            style={styles.time}
            placeholder="MM"
            value={newMinute}
            onChange={e => setNewMinute(e.target.value)}
          />
        </div>

        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={repeatDaily}
            onChange={() => setRepeatDaily(v => !v)}
          />
          Repeat daily
        </label>

        <button style={styles.btn} onClick={addTask}>Add task</button>
      </div>

      {/* TASK LIST */}
      {tasks.map(task => (
        <div key={task.id} style={styles.card}>
          <p>
            {task.title} {task.time && `@ ${task.time}`}
            {task.repeat && " (daily)"}
          </p>

          {!task.doneToday && (
            <button
              style={styles.btn}
              onClick={() => setActiveTaskId(task.id)}
            >
              Start
            </button>
          )}

          {task.doneToday && <p style={styles.done}>Done</p>}
        </div>
      ))}

      {/* ACTIVE TASK */}
      {activeTask && (
        <div style={styles.card}>
          <h3>{activeTask.title}</h3>

          <div style={styles.row}>
            <input
              type="number"
              style={styles.time}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
            />
            h
            <input
              type="number"
              style={styles.time}
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value))}
            />
            m
          </div>

          <p style={styles.timer}>
            {timeLeft > 0
              ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
              : "Ready"}
          </p>

          {!running && (
            <button style={styles.btn} onClick={startTimer}>
              Start focus
            </button>
          )}

          {timeLeft === 0 && !running && (
            <button
              style={styles.btn}
              onClick={() => completeTask(activeTask.id)}
            >
              Mark complete
            </button>
          )}
        </div>
      )}

      <p style={styles.footer}>Comfort rots. Effort adapts.</p>
    </div>
  );
}

/* ---------- STYLES ---------- */
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
    marginBottom: 12
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    marginBottom: 8
  },
  time: {
    width: 60,
    padding: 8,
    margin: 4,
    textAlign: "center",
    borderRadius: 6,
    border: "1px solid #333",
    background: "#000",
    color: "#fff"
  },
  row: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 4
  },
  btn: {
    width: "100%",
    padding: 12,
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    marginTop: 8
  },
  checkbox: {
    fontSize: 12,
    color: "#777",
    marginTop: 4
  },
  done: {
    color: "#6f6"
  },
  timer: {
    fontSize: 20,
    margin: 8
  },
  footer: {
    fontSize: 11,
    color: "#666",
    marginTop: 16
  }
};
