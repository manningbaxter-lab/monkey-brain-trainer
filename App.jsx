import React, { useState, useEffect } from "react";
import Snake from "./Snake.jsx";

const MIN_SECONDS = 10 * 60;

export default function App() {
  /* ---------------- STATE ---------------- */
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [newTask, setNewTask] = useState("");
  const [repeatDaily, setRepeatDaily] = useState(false);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);

  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const [brutalMode, setBrutalMode] = useState(false);

  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState({ done: 0, quit: 0 });

  const [snakeUnlocked, setSnakeUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* ---------------- LOAD / SAVE ---------------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setStreak(saved.streak || 0);
      setWeek(saved.week || { done: 0, quit: 0 });
      setBrutalMode(saved.brutalMode || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({ tasks, streak, week, brutalMode })
    );
  }, [tasks, streak, week, brutalMode]);

  /* ---------------- MIDNIGHT RESET ---------------- */
  useEffect(() => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem("lastReset");

    if (today !== lastReset) {
      setTasks(ts => ts.map(t => ({ ...t, doneToday: false })));
      localStorage.setItem("lastReset", today);
    }
  }, []);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const i = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(i);
  }, [running, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && running) setRunning(false);
  }, [timeLeft, running]);

  function startTimer() {
    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }
    setTimeLeft(totalSeconds);
    setRunning(true);
  }

  /* ---------------- TASK ACTIONS ---------------- */
  function addTask() {
    if (!newTask.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: newTask,
        repeat: repeatDaily,
        doneToday: false
      }
    ]);
    setNewTask("");
    setRepeatDaily(false);
  }

  function completeTask(id) {
    setTasks(ts =>
      ts.map(t => (t.id === id ? { ...t, doneToday: true } : t))
    );
    setStreak(s => s + 1);
    setWeek(w => ({ ...w, done: w.done + 1 }));
    setSnakeUnlocked(true);
    setActiveId(null);
    setRunning(false);
    setTimeLeft(0);
  }

  function quitTask() {
    setWeek(w => ({ ...w, quit: w.quit + 1 }));
    setStreak(s => Math.max(0, s - 1));
    resetFocus();
  }

  function deleteTask(id) {
    setTasks(ts => ts.filter(t => t.id !== id));
    if (activeId === id) resetFocus();
  }

  function resetFocus() {
    setActiveId(null);
    setRunning(false);
    setTimeLeft(0);
  }

  const activeTask = tasks.find(t => t.id === activeId);

  /* ---------------- SNAKE REWARD ---------------- */
  if (showSnake) {
    return (
      <Snake
        onExit={() => {
          setShowSnake(false);
          setSnakeUnlocked(false);
        }}
      />
    );
  }

  return (
    <div style={styles.page}>
      <h2>🐵 Monkey Brain Trainer</h2>

      <label style={styles.toggle}>
        <input
          type="checkbox"
          checked={brutalMode}
          onChange={() => setBrutalMode(v => !v)}
        />{" "}
        Brutal Mode (hide timer)
      </label>

      {/* ADD TASK */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Task"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
        />
        <label style={styles.small}>
          <input
            type="checkbox"
            checked={repeatDaily}
            onChange={() => setRepeatDaily(v => !v)}
          /> Repeat daily
        </label>
        <button style={styles.btn} onClick={addTask}>
          Add task
        </button>
      </div>

      {/* TASK LIST */}
      {tasks.map(t => (
        <div key={t.id} style={styles.card}>
          <p>
            {t.title} {t.repeat && "(daily)"}
          </p>

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
      {activeTask && (
        <div style={styles.card}>
          <h3>{activeTask.title}</h3>

          <div>
            <input
              type="number"
              style={styles.time}
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
            />{" "}
            h
            <input
              type="number"
              style={styles.time}
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value))}
            />{" "}
            m
          </div>

          {!brutalMode && (
            <p style={styles.timer}>
              {timeLeft > 0
                ? `${Math.floor(timeLeft / 60)}:${String(
                    timeLeft % 60
                  ).padStart(2, "0")}`
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
              <button
                style={styles.btn}
                onClick={() => completeTask(activeTask.id)}
              >
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
        <p>
          📊 This week — ✅ {week.done} ❌ {week.quit} ⚖{" "}
          {week.done - week.quit}
        </p>
      </div>

      {snakeUnlocked && (
        <button style={styles.btn} onClick={() => setShowSnake(true)}>
          Play Snake (reward)
        </button>
      )}

      <p style={styles.footer}>Comfort rots. Effort adapts.</p>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: {
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
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
    border: "1px solid #333",
    color: "#fff",
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
    borderRadius: 8
  },
  penalty: {
    width: "100%",
    padding: 10,
    marginTop: 6,
    background: "#600",
    color: "#fff",
    borderRadius: 8
  },
  time: {
    width: 60,
    margin: 4,
    padding: 8
  },
  timer: {
    fontSize: 20,
    margin: 8
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
  footer: {
    fontSize: 11,
    color: "#666",
    marginTop: 16
  }
};
