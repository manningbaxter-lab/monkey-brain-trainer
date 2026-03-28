import React, { useState, useEffect } from "react";
import Snake from "./Snake.jsx";

const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const MIN_FOCUS_SECONDS = 10 * 60;

/* ================= Helpers ================= */
function now() {
  return Date.now();
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getWeekKey(date = new Date()) {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / 86400000);
  return `${date.getFullYear()}-W${Math.ceil((days + firstJan.getDay() + 1) / 7)}`;
}

/* ================= App ================= */
export default function App() {
  /* ---------- Navigation ---------- */
  const [view, setView] = useState("home"); // home | tasks | history | weekly

  /* ---------- Tasks ---------- */
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  /* ---------- Focus Timing ---------- */
  const [focusStartTime, setFocusStartTime] = useState(null);
  const [focusEndTime, setFocusEndTime] = useState(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  /* ---------- Screen Time ---------- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  /* ---------- Adaptive ---------- */
  const [earlyEndsToday, setEarlyEndsToday] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [showNudge, setShowNudge] = useState(false);

  /* ---------- Per‑Task Stats ---------- */
  const [taskStats, setTaskStats] = useState({});

  /* ---------- History ---------- */
  const [history, setHistory] = useState([]);

  /* ---------- Weekly ---------- */
  const weekKey = getWeekKey();
  const [weeklyStats, setWeeklyStats] = useState({
    started: 0,
    completed: 0,
    endedEarly: 0,
    focusedMs: 0
  });
  const [weeklyReflection, setWeeklyReflection] = useState("");

  /* ---------- Snake ---------- */
  const [snakeUnlocked, setSnakeUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* ================= Load / Save ================= */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      Object.assign(
        {
          tasks: setTasks,
          screenTimeReady: setScreenTimeReady,
          earlyEndsToday: setEarlyEndsToday,
          completedToday: setCompletedToday,
          taskStats: setTaskStats,
          history: setHistory,
          snakeUnlocked: setSnakeUnlocked
        },
        Object.entries(saved || {}).reduce((a,[k,v]) => (a[k] = () => {}, a), {})
      );
      setTasks(saved.tasks || []);
      setTaskStats(saved.taskStats || {});
      setHistory(saved.history || []);
      setScreenTimeReady(saved.screenTimeReady || false);
      setEarlyEndsToday(saved.earlyEndsToday || 0);
      setCompletedToday(saved.completedToday || 0);
      setSnakeUnlocked(saved.snakeUnlocked || false);
    }

    const ws = JSON.parse(localStorage.getItem(weekKey));
    if (ws) {
      setWeeklyStats(ws.stats);
      setWeeklyReflection(ws.reflection || "");
    }
  }, [weekKey]);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({
        tasks,
        taskStats,
        history,
        screenTimeReady,
        earlyEndsToday,
        completedToday,
        snakeUnlocked
      })
    );
  }, [tasks, taskStats, history, screenTimeReady, earlyEndsToday, completedToday, snakeUnlocked]);

  useEffect(() => {
    localStorage.setItem(
      weekKey,
      JSON.stringify({ stats: weeklyStats, reflection: weeklyReflection })
    );
  }, [weeklyStats, weeklyReflection, weekKey]);

  /* ================= Timer ================= */
  useEffect(() => {
    const i = setInterval(() => {
      if (!focusEndTime) return;
      const diff = focusEndTime - now();
      setTimeLeftMs(diff);
      if (diff <= 0) endFocus(true);
    }, 1000);
    return () => clearInterval(i);
  }, [focusEndTime]);

  /* ================= Logic ================= */

  function getRecommendedMinutes() {
    if (earlyEndsToday >= 2) return 20;
    if (completedToday >= 2) return 40;
    return 30;
  }

  function getTaskHint(taskId) {
    const s = taskStats[taskId];
    if (!s) return null;
    if (s.early >= 2) return "Suggestion: break this into a smaller step";
    if (s.completed >= 3 && s.early === 0) return "Suggestion: increase challenge";
    return null;
  }

  function addTask() {
    if (!newTask.trim()) return;
    const id = Date.now();
    setTasks([...tasks, { id, title: newTask }]);
    setTaskStats({ ...taskStats, [id]: { early: 0, completed: 0 } });
    setNewTask("");
  }

  function startFocus(taskId, minutes) {
    if (isiOS && !screenTimeReady) {
      setShowGuide(true);
      return;
    }
    const seconds = minutes * 60;
    if (seconds < MIN_FOCUS_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }
    const start = now();
    const end = start + seconds * 1000;
    setActiveTaskId(taskId);
    setFocusStartTime(start);
    setFocusEndTime(end);
    setTimeLeftMs(end - start);
    setWeeklyStats(s => ({ ...s, started: s.started + 1 }));
    setView("tasks");
  }

  function endFocus(completed) {
    const worked = focusStartTime ? now() - focusStartTime : 0;
    const task = tasks.find(t => t.id === activeTaskId);
    const stats = taskStats[activeTaskId] || { early: 0, completed: 0 };

    setHistory([
      {
        id: Date.now(),
        task: task?.title,
        duration: worked,
        result: completed ? "completed" : "ended early",
        date: new Date().toLocaleString()
      },
      ...history
    ]);

    if (completed) {
      setTaskStats({ ...taskStats, [activeTaskId]: { ...stats, completed: stats.completed + 1 } });
      setWeeklyStats(s => ({ ...s, completed: s.completed + 1, focusedMs: s.focusedMs + worked }));
      setCompletedToday(c => c + 1);
      setSnakeUnlocked(true);
    } else {
      const e = earlyEndsToday + 1;
      setEarlyEndsToday(e);
      if (e >= 2) setShowNudge(true);
      setTaskStats({ ...taskStats, [activeTaskId]: { ...stats, early: stats.early + 1 } });
      setWeeklyStats(s => ({ ...s, endedEarly: s.endedEarly + 1, focusedMs: s.focusedMs + worked }));
    }

    setActiveTaskId(null);
    setFocusStartTime(null);
    setFocusEndTime(null);
    setTimeLeftMs(0);
  }

  /* ================= Screens ================= */

  if (showSnake) {
    return <Snake onExit={() => { setShowSnake(false); setSnakeUnlocked(false); }} />;
  }

  if (showGuide) {
    return (
      <ScreenTimeGuide
        onDone={() => { setScreenTimeReady(true); setShowGuide(false); }}
        onLater={() => setShowGuide(false)}
      />
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <Nav view={view} setView={setView} />

        {view === "home" && (
          <>
            <h2>Today</h2>
            <p style={styles.dim}>
              Suggested focus length: {getRecommendedMinutes()} minutes
            </p>
            {snakeUnlocked && <p>🐍 Reward available</p>}
          </>
        )}

        {view === "tasks" && (
          <>
            <div style={styles.card}>
              <input
                style={styles.input}
                placeholder="New task"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
              />
              <button style={styles.btn} onClick={addTask}>Add task</button>
            </div>

            {tasks.map(t => (
              <div key={t.id} style={styles.card}>
                <p>{t.title}</p>
                {getTaskHint(t.id) && <p style={styles.dim}>{getTaskHint(t.id)}</p>}
                {!focusEndTime && (
                  <button
                    style={styles.btn}
                    onClick={() => startFocus(t.id, getRecommendedMinutes())}
                  >
                    Start focus
                  </button>
                )}
                {focusEndTime && activeTaskId === t.id && (
                  <>
                    <p>{formatTime(timeLeftMs)}</p>
                    <button style={styles.penaltyBtn} onClick={() => endFocus(false)}>
                      End early
                    </button>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {view === "history" && (
          <>
            <h2>History</h2>
            {history.length === 0 && <p style={styles.dim}>No sessions yet.</p>}
            {history.map(h => (
              <div key={h.id} style={styles.card}>
                <p><b>{h.task}</b></p>
                <p>{h.result} – {formatTime(h.duration)}</p>
                <p style={styles.dim}>{h.date}</p>
              </div>
            ))}
          </>
        )}

        {view === "weekly" && (
          <>
            <h2>This Week</h2>
            <p>Completed: {weeklyStats.completed}</p>
            <p>Ended early: {weeklyStats.endedEarly}</p>
            <p>Focused: {formatTime(weeklyStats.focusedMs)}</p>
            <textarea
              style={styles.textarea}
              placeholder="Reflection…"
              value={weeklyReflection}
              onChange={e => setWeeklyReflection(e.target.value)}
            />
          </>
        )}

        <button
          style={{ ...styles.btn, opacity: snakeUnlocked ? 1 : 0.4 }}
          disabled={!snakeUnlocked}
          onClick={() => setShowSnake(true)}
        >
          🐍 Snake
        </button>

        {showNudge && (
          <div style={styles.notice}>
            You’ve ended focus early a few times today. Shortening or simplifying a task may help.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Components ================= */

function Nav({ view, setView }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      {["home","tasks","history","weekly"].map(v => (
        <button
          key={v}
          style={{ ...styles.subtleBtn, fontWeight: view === v ? "bold" : "normal" }}
          onClick={() => setView(v)}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}

function ScreenTimeGuide({ onDone, onLater }) {
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <div style={styles.card}>
          <h2>Set up Focus Blocking</h2>
          <ol style={styles.list}>
            <li>Open Settings</li>
            <li>Screen Time → Turn On</li>
            <li>Set App Limits</li>
            <li>Optional: Downtime</li>
          </ol>
          <button style={styles.btn} onClick={onDone}>I’ve set it up</button>
          <button style={styles.subtleBtn} onClick={onLater}>Do later</button>
        </div>
      </div>
    </div>
  );
}

/* ================= Styles ================= */

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
  app: { maxWidth: 420, width: "100%" },
  card: { background: "#16161d", borderRadius: 16, padding: 14, marginBottom: 12 },
  input: {
    width: "100%", padding: 12, borderRadius: 12,
    background: "#0f0f15", color: "#fff", border: "1px solid #333", marginBottom: 8
  },
  textarea: {
    width: "100%", minHeight: 80, marginTop: 8,
    borderRadius: 12, padding: 12, background: "#0f0f15", color: "#fff", border: "1px solid #333"
  },
  btn: {
    width: "100%", padding: 14, background: "#1f2937",
    borderRadius: 12, border: "none", color: "#fff", marginTop: 6
  },
  subtleBtn: {
    background: "transparent", border: "none",
    color: "#9ca3af", cursor: "pointer"
  },
  penaltyBtn: {
    width: "100%", padding: 14, background: "#7f1d1d",
    borderRadius: 12, border: "none", color: "#fff", marginTop: 6
  },
  notice: { marginTop: 12, fontSize: 13, opacity: 0.85 },
  dim: { opacity: 0.7 },
  list: { fontSize: 14, lineHeight: 1.5 }
};
