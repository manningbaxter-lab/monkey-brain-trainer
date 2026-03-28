import React, { useState, useEffect } from "react";
import Snake from "./Snake.jsx";

const MIN_SECONDS = 10 * 60;

export default function App() {
  /* ---------------- CORE STATE ---------------- */
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [newTask, setNewTask] = useState("");
  const [repeatDaily, setRepeatDaily] = useState(false);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState({ done: 0, quit: 0 });

  const [snackUnlocked, setSnackUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* ---------------- SOCIAL BLOCK STATE ---------------- */
  const [blockedApps, setBlockedApps] = useState([
    "Instagram",
    "TikTok",
    "YouTube",
    "Reddit"
  ]);

  const [newBlockedApp, setNewBlockedApp] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  /* ---------------- LOAD / SAVE ---------------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setStreak(saved.streak || 0);
      setWeek(saved.week || { done: 0, quit: 0 });
      setBlockedApps(saved.blockedApps || blockedApps);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({ tasks, streak, week, blockedApps })
    );
  }, [tasks, streak, week, blockedApps]);

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

  function startTimer() {
    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }
    setTimeLeft(totalSeconds);
    setRunning(true);
  }

  function resetFocus() {
    setActiveId(null);
    setRunning(false);
    setTimeLeft(0);
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
    setSnackUnlocked(true);
    resetFocus();
  }

  function quitTask(reason = "quit") {
    setWeek(w => ({ ...w, quit: w.quit + 1 }));
    setStreak(s => Math.max(0, s - 1));
    resetFocus();
  }

  /* ---------------- SOCIAL BLOCK ACTIONS ---------------- */
  function addBlockedApp() {
    if (!newBlockedApp.trim()) return;
    setBlockedApps([...blockedApps, newBlockedApp.trim()]);
    setNewBlockedApp("");
  }

  function removeBlockedApp(app) {
    setBlockedApps(blockedApps.filter(a => a !== app));
  }

  /* ---------------- ACTIVE TASK ---------------- */
  const activeTask = tasks.find(t => t.id === activeId);

  /* ---------------- SNAKE ---------------- */
  if (showSnake) {
    return (
      <Snake
        onExit={() => {
          setShowSnake(false);
          setSnackUnlocked(false);
        }}
      />
    );
  }

  /* ---------------- SETUP GUIDE ---------------- */
  if (showSetup) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h3>Set up Focus Blocking</h3>

          <p>
            This app can’t block other apps directly.  
            To make focus effective, enable your phone’s built‑in tools:
          </p>

          <h4>📱 iPhone</h4>
          <ol>
            <li>Open <b>Settings → Screen Time</b></li>
            <li>Turn on Screen Time</li>
            <li>Go to <b>App Limits</b></li>
            <li>Add limits for:</li>
            <ul>
              {blockedApps.map(app => (
                <li key={app}>{app}</li>
              ))}
            </ul>
          </ol>

          <h4>🤖 Android</h4>
          <ol>
            <li>Open <b>Settings → Digital Wellbeing</b></li>
            <li>Enable Focus Mode</li>
            <li>Select apps to restrict:</li>
            <ul>
              {blockedApps.map(app => (
                <li key={app}>{app}</li>
              ))}
            </ul>
          </ol>

          <button style={styles.btn} onClick={() => setShowSetup(false)}>
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h2>🐵 Monkey Brain Trainer</h2>

        <button style={styles.subtleBtn} onClick={() => setShowSetup(true)}>
          Set up Focus Blocking
        </button>

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
            />{" "}
            Repeat daily
          </label>
          <button style={styles.btn} onClick={addTask}>
            Add task
          </button>
        </div>

        {/* TASK LIST */}
        {tasks.map(t => (
          <div key={t.id} style={styles.card}>
            <p>{t.title}</p>
            {!t.doneToday && (
              <button style={styles.btn} onClick={() => setActiveId(t.id)}>
                Start
              </button>
            )}
          </div>
        ))}

        {/* ACTIVE TASK */}
        {activeTask && (
          <div style={styles.card}>
            <h3>{activeTask.title}</h3>

            <p style={styles.notice}>
              🚫 Blocked during focus:
              <br />
              {blockedApps.join(", ")}
            </p>

            <input
              type="number"
              value={hours}
              onChange={e => setHours(Number(e.target.value))}
            />{" "}
            h
            <input
              type="number"
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value))}
            />{" "}
            m

            {!running && (
              <button style={styles.btn} onClick={startTimer}>
                Start focus session
              </button>
            )}

            {timeLeft === 0 && running && (
              <p>Focus session ended</p>
            )}

            {running && (
              <button
                style={styles.penalty}
                onClick={() => quitTask("social")}
              >
                I opened a blocked app
              </button>
            )}

            {timeLeft === 0 && !running && (
              <>
                <button
                  style={styles.btn}
                  onClick={() => completeTask(activeTask.id)}
                >
                  Finish focus session
                </button>
                <button
                  style={styles.penalty}
                  onClick={() => quitTask("manual")}
                >
                  End session early
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

        {/* SNAKE */}
        <button
          style={{
            ...styles.btn,
            opacity: snackUnlocked ? 1 : 0.4
          }}
          disabled={!snackUnlocked}
          onClick={() => snackUnlocked && setShowSnake(true)}
        >
          🐍 Snake — {snackUnlocked ? "Reward unlocked" : "Complete a task"}
        </button>

        <p style={styles.footer}>Comfort rots. Effort adapts.</p>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: {
    background: "#0b0b0f",
    color: "#f5f5f7",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: 16,
    fontFamily: "system-ui"
  },
  app: {
    width: "100%",
    maxWidth: 420
  },
  card: {
    background: "#16161d",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #333",
    background: "#0f0f15",
    color: "#fff"
  },
  btn: {
    width: "100%",
    padding: 14,
    marginTop: 8,
    background: "#1f2937",
    color: "#fff",
    borderRadius: 12,
    border: "none"
  },
  penalty: {
    width: "100%",
    padding: 14,
    marginTop: 8,
    background: "#7f1d1d",
    color: "#fff",
    borderRadius: 12,
    border: "none"
  },
  subtleBtn: {
    background: "transparent",
    color: "#9ca3af",
    border: "none",
    marginBottom: 8
  },
  small: {
    fontSize: 12,
    color: "#9ca3af"
  },
  notice: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8
  },
  footer: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 16
  }
};
``
