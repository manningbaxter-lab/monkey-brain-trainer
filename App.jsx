import React, { useState, useEffect } from "react";

const MIN_SECONDS = 10 * 60;

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [title, setTitle] = useState("");
  const [repeat, setRepeat] = useState(false);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const [brutalMode, setBrutalMode] = useState(
    JSON.parse(localStorage.getItem("brutalMode")) ?? false
  );

  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState({ done: 0, quit: 0 });

  /* ---------- LOAD ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setStreak(saved.streak || 0);
      setWeek(saved.week || { done: 0, quit: 0 });
      setBrutalMode(saved.brutalMode ?? false);
    }
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({ tasks, streak, week, brutalMode })
    );
  }, [tasks, streak, week, brutalMode]);

  /* ---------- MIDNIGHT RESET ---------- */
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("lastReset");

    if (today !== last) {
      setTasks(ts => ts.map(t => ({ ...t, doneToday: false })));
      localStorage.setItem("lastReset", today);
    }
  }, []);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && running) setRunning(false);
  }, [timeLeft, running]);

  function startTimer() {
    const seconds = hours * 3600 + minutes * 60;
    if (seconds < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }
    setTimeLeft(seconds);
    setRunning(true);
  }

  function addTask() {
    if (!title.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title,
        repeat,
        doneToday: false
      }
    ]);
    setTitle("");
    setRepeat(false);
  }

  function completeTask(id) {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, doneToday: true } : t
    ));
    setStreak(s => s + 1);
    setWeek(w => ({ ...w, done: w.done + 1 }));
    setActiveId(null);
    setRunning(false);
    setTimeLeft(0);
  }

  function quitTask() {
    setWeek(w => ({ ...w, quit: w.quit + 1 }));
    setStreak(s => Math.max(0, s - 1));
    setRunning(false);
    setTimeLeft(0);
    setActiveId(null);
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
    if (activeId === id) {
      setRunning(false);
      setTimeLeft(0);
      setActiveId(null);
    }
  }

  const active = tasks.find(t => t.id === activeId);

  return (
    <div style={styles.page}>
      <h2>🐵 Monkey Brain Trainer</h2>

      <label style={styles.toggle}>
        <input
          type="checkbox"
          checked={brutalMode}
          onChange={() => setBrutalMode(v => !v)}
        /> Brutal Mode (hide timer)
      </label>

      {/* ADD TASK */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Task"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <label style={styles.small}>
          <input
            type="checkbox"
            checked={repeat}
            onChange={() => setRepeat(v => !v)}
          /> Repeat daily
        </label>
        <button style={styles.btn} onClick={addTask}>Add task</button>
      </div>

      {/* TASK LIST */}
      {tasks.map(t => (
        <div key={t.id} style={styles.card}>
          <p>{t.title} {t.repeat && "(daily)"}</p>

          {!t.doneToday && (
            <button style={styles.btn} onClick={() => setActiveId(t.id)}>
              Start
            </button>
          )}

          <button style={styles.delete} onClick={() => deleteTask(t.id)}>
            Delete
          </button>
        </div>
      ))}

      {/* ACTIVE TASK */}
      {active && (
        <div style={styles.card}>
          <h3>{active.title}</h3>

          <div>
            <input
              type="number"
              style={styles.time}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
            /> h
            <input
              type="number"
              style={styles.time}
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value))}
            /> m
          </div>

          {!brutalMode && (
            <p style={styles.timer}>
              {timeLeft
                ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
                : "Ready"}
            </p>
          )}

          {!running && (
            <button style={styles.btn} onClick={startTimer}>
              Start focus
            </button>
          )}

          {timeLeft === 0 && !running && (
            <>
              <button style={styles.btn} onClick={() => completeTask(active.id)}>
                Mark complete
              </button>
              <button style={styles.penalty} onClick={quitTask}>
                I quit / got distracted
              </button>
            </>
          )}
        </div>
      )}

      {/* STATS */}
      <div style={styles.card}>
        <p>🔥 Streak: {streak}</p>
        <p>📊 This week — ✅ {week.done} ❌ {week.quit} ⚖ {week.done - week.quit}</p>
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
    marginBottom: 12
  },
  input: {
    width: "100%",
    padding: 12,
    background: "#000",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 8
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
  delete: {
    width: "100%",
    padding: 10,
    marginTop: 6,
    background: "#400",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  penalty: {
    width: "100%",
    padding: 10,
    marginTop: 6,
    background: "#600",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  time: {
    width: 60,
    margin: 4,
    padding: 8,
    textAlign: "center"
  },
  small: {
    fontSize: 12,
    color: "#777"
  },
  toggle: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8
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
