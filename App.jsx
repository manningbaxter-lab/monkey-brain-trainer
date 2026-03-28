import React, { useState, useEffect } from "react";
import Snake from "./Snake.jsx";

/* ================== CONSTANTS ================== */
const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const MIN_FOCUS_SECONDS = 10 * 60;

/* ================== HELPERS ================== */
const now = () => Date.now();
const formatTime = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/* ================== APP ================== */
export default function App() {
  /* ---------- Navigation ---------- */
  const [view, setView] = useState("home");

  /* ---------- Onboarding (2) ---------- */
  const [showOnboarding, setShowOnboarding] = useState(false);

  /* ---------- Toast notifications (3) ---------- */
  const [toast, setToast] = useState(null);

  /* ---------- Tasks ---------- */
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState("");

  /* ---------- Focus ---------- */
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [focusStartTime, setFocusStartTime] = useState(null);
  const [focusEndTime, setFocusEndTime] = useState(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  /* ---------- Adaptation ---------- */
  const [earlyEndsToday, setEarlyEndsToday] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  /* ---------- History ---------- */
  const [history, setHistory] = useState([]);

  /* ---------- Screen Time ---------- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);

  /* ---------- Snake ---------- */
  const [snakeUnlocked, setSnakeUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* ================== LOAD ================== */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setHistory(saved.history || []);
      setEarlyEndsToday(saved.earlyEndsToday || 0);
      setCompletedToday(saved.completedToday || 0);
      setScreenTimeReady(saved.screenTimeReady || false);
      setShowOnboarding(!saved.onboarded);
      setSnakeUnlocked(saved.snakeUnlocked || false);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({
        tasks,
        history,
        earlyEndsToday,
        completedToday,
        screenTimeReady,
        snakeUnlocked,
        onboarded: !showOnboarding
      })
    );
  }, [
    tasks,
    history,
    earlyEndsToday,
    completedToday,
    screenTimeReady,
    snakeUnlocked,
    showOnboarding
  ]);

  /* ================== TIMER ================== */
  useEffect(() => {
    const i = setInterval(() => {
      if (!focusEndTime) return;
      const diff = focusEndTime - now();
      setTimeLeftMs(diff);
      if (diff <= 0) endFocus(true);
    }, 1000);
    return () => clearInterval(i);
  }, [focusEndTime]);

  /* ================== DERIVED ================== */
  const recommendedMinutes =
    earlyEndsToday >= 2 ? 20 : completedToday >= 2 ? 40 : 30;

  /* ================== ACTIONS ================== */
  function addTask() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask }]);
    setNewTask("");
    setShowAddModal(false);
    setToast("Task added");
    setView("focus");
  }

  function startFocus(taskId) {
    const seconds = recommendedMinutes * 60;
    if (seconds < MIN_FOCUS_SECONDS) return;

    const start = now();
    const end = start + seconds * 1000;

    setActiveTaskId(taskId);
    setFocusStartTime(start);
    setFocusEndTime(end);
    setTimeLeftMs(end - start);
    setView("focus");
  }

  function endFocus(completed) {
    const worked = focusStartTime ? now() - focusStartTime : 0;
    const task = tasks.find(t => t.id === activeTaskId);

    setHistory([
      {
        id: Date.now(),
        task: task?.title,
        result: completed ? "Completed" : "Stopped early",
        duration: worked,
        time: new Date().toLocaleString()
      },
      ...history
    ]);

    if (completed) {
      setCompletedToday(c => c + 1);
      setSnakeUnlocked(true);
      setToast("Focus complete ✅");
    } else {
      setEarlyEndsToday(e => e + 1);
      setToast("Session stopped early");
    }

    setActiveTaskId(null);
    setFocusStartTime(null);
    setFocusEndTime(null);
    setTimeLeftMs(0);
    setView("home");
  }

  /* ================== SPECIAL SCREENS ================== */

  if (showSnake) {
    return <Snake onExit={() => setShowSnake(false)} />;
  }

  if (showOnboarding) {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <h2>Welcome</h2>
          <p style={styles.dim}>
            Focus first. Reward later.
          </p>
          <ul style={styles.list}>
            <li>Short, intentional focus sessions</li>
            <li>Difficulty adapts over time</li>
            <li>No shame — only adjustment</li>
          </ul>
          <button
            style={styles.btn}
            onClick={() => setShowOnboarding(false)}
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  /* ================== MAIN UI ================== */
  return (
    <div style={styles.page}>
      {toast && (
        <div style={styles.toast} onAnimationEnd={() => setToast(null)}>
          {toast}
        </div>
      )}

      <BottomNav view={view} setView={setView} />

      {view === "home" && (
        <>
          <h2>Today</h2>
          <p style={styles.dim}>
            Suggested focus: {recommendedMinutes} minutes
          </p>
          {tasks[0] && (
            <button
              style={styles.btn}
              onClick={() => startFocus(tasks[0].id)}
            >
              Start focus
            </button>
          )}
          {snakeUnlocked && <p>🐍 Reward available</p>}
        </>
      )}

      {view === "focus" && (
        <>
          <h2>Focus</h2>
          {tasks.map(t => (
            <div key={t.id} style={styles.card}>
              <p>{t.title}</p>
              {!focusEndTime ? (
                <button
                  style={styles.btn}
                  onClick={() => startFocus(t.id)}
                >
                  Start {recommendedMinutes}‑min focus
                </button>
              ) : activeTaskId === t.id ? (
                <>
                  <p>{formatTime(timeLeftMs)}</p>
                  <button
                    style={styles.penaltyBtn}
                    onClick={() => endFocus(false)}
                  >
                    Stop session
                  </button>
                </>
              ) : null}
            </div>
          ))}
        </>
      )}

      {view === "review" && (
        <>
          <h2>History</h2>
          {history.map(h => (
            <div key={h.id} style={styles.card}>
              <b>{h.task}</b>
              <p>{h.result}</p>
              <p style={styles.dim}>{formatTime(h.duration)} · {h.time}</p>
            </div>
          ))}
        </>
      )}

      {view === "settings" && (
        <>
          <h2>Settings</h2>
          <p style={styles.dim}>Screen Time (optional)</p>
          <button
            style={styles.btn}
            onClick={() => setScreenTimeReady(true)}
          >
            Mark Screen Time as set up
          </button>
        </>
      )}

      {/* ---------- COOL ADD FAB ---------- */}
      <button
        style={styles.fab}
        onClick={() => setShowAddModal(true)}
      >
        +
      </button>

      {showAddModal && (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <h3>New task</h3>
            <input
              style={styles.input}
              placeholder="What do you want to focus on?"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
            />
            <button style={styles.btn} onClick={addTask}>
              Add task
            </button>
            <button
              style={styles.subtleBtn}
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== NAV ================== */
function BottomNav({ view, setView }) {
  return (
    <div style={styles.nav}>
      {["home","focus","review","settings"].map(v => (
        <button
          key={v}
          onClick={() => setView(v)}
          style={{
            background: "none",
            border: "none",
            color: view === v ? "#fff" : "#777",
            fontWeight: view === v ? 600 : 400
          }}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ================== STYLES ================== */
const styles = {
  page: {
    background: "#0b0b0f",
    color: "#f5f5f7",
    minHeight: "100vh",
    padding: 16,
    fontFamily: "system-ui"
  },
  nav: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: 12
  },
  card: {
    background: "#16161d",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    background: "#0f0f15",
    color: "#fff",
    border: "1px solid #333",
    marginBottom: 8
  },
  btn: {
    width: "100%",
    padding: 14,
    background: "#1f2937",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    marginTop: 6
  },
  penaltyBtn: {
    width: "100%",
    padding: 14,
    background: "#7f1d1d",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    marginTop: 6
  },
  subtleBtn: {
    background: "transparent",
    border: "none",
    color: "#9ca3af"
  },
  dim: { opacity: 0.7 },
  fab: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#22c55e",
    color: "#000",
    fontSize: 32,
    border: "none",
    cursor: "pointer"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  toast: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1f2937",
    padding: "10px 16px",
    borderRadius: 12,
    animation: "fade 2s"
  },
  list: {
    fontSize: 14,
    lineHeight: 1.5
  }
};
