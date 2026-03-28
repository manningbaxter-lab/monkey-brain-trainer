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
  const [view, setView] = useState("home"); // home | focus | review | settings
  const [transitionKey, setTransitionKey] = useState(0);

  /* ---------- Onboarding ---------- */
  const [showOnboarding, setShowOnboarding] = useState(false);

  /* ---------- Tasks ---------- */
  const [tasks, setTasks] = useState([]);
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
  const [screenTimeMode, setScreenTimeMode] = useState("guided");
  const [screenTimeReady, setScreenTimeReady] = useState(false);

  /* ---------- Snake ---------- */
  const [snakeUnlocked, setSnakeUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* ================== LOAD ================== */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (!saved) return;

    setTasks(saved.tasks || []);
    setHistory(saved.history || []);
    setScreenTimeReady(saved.screenTimeReady || false);
    setScreenTimeMode(saved.screenTimeMode || "guided");
    setCompletedToday(saved.completedToday || 0);
    setEarlyEndsToday(saved.earlyEndsToday || 0);
    setShowOnboarding(saved.onboarded !== true);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({
        tasks,
        history,
        screenTimeReady,
        screenTimeMode,
        completedToday,
        earlyEndsToday,
        snakeUnlocked,
        onboarded: !showOnboarding
      })
    );
  }, [
    tasks,
    history,
    screenTimeReady,
    screenTimeMode,
    completedToday,
    earlyEndsToday,
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

  function navigate(v) {
    setTransitionKey(k => k + 1);
    setView(v);
  }

  /* ================== ACTIONS ================== */
  function addTask() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask }]);
    setNewTask("");
    navigate("focus");
  }

  function startFocus(taskId) {
    if (isiOS && screenTimeMode === "native" && !screenTimeReady) {
      alert("Native screen blocking not yet enabled.");
      return;
    }

    const seconds = recommendedMinutes * 60;
    if (seconds < MIN_FOCUS_SECONDS) return;

    const start = now();
    const end = start + seconds * 1000;
    setActiveTaskId(taskId);
    setFocusStartTime(start);
    setFocusEndTime(end);
    setTimeLeftMs(end - start);
    navigate("focus");
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
    } else {
      setEarlyEndsToday(e => e + 1);
    }

    setActiveTaskId(null);
    setFocusStartTime(null);
    setFocusEndTime(null);
    setTimeLeftMs(0);
    navigate("home");
  }

  /* ================== SPECIAL SCREENS ================== */

  if (showSnake) {
    return <Snake onExit={() => setShowSnake(false)} />;
  }

  if (showOnboarding) {
    return (
      <Screen transitionKey={0}>
        <h2>Welcome</h2>
        <p style={styles.dim}>
          Monkey Brain Trainer helps you build focus before reward.
        </p>
        <ul>
          <li>Start small, increase naturally</li>
          <li>Effort unlocks rewards</li>
          <li>No shame, only adaptation</li>
        </ul>
        <button style={styles.btn} onClick={() => setShowOnboarding(false)}>
          Get started
        </button>
      </Screen>
    );
  }

  /* ================== MAIN ================== */

  return (
    <div style={styles.page}>
      <BottomNav view={view} navigate={navigate} />

      <Screen transitionKey={transitionKey}>
        {view === "home" && (
          <>
            <h2>Today</h2>
            <p style={styles.dim}>
              Suggested focus: {recommendedMinutes} minutes
            </p>
            {tasks[0] && (
              <button style={styles.btn} onClick={() => startFocus(tasks[0].id)}>
                Start focus
              </button>
            )}
            {snakeUnlocked && <p>🐍 Reward available</p>}
          </>
        )}

        {view === "focus" && (
          <>
            <h2>Focus</h2>
            <input
              style={styles.input}
              placeholder="New task"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
            />
            <button style={styles.btn} onClick={addTask}>
              Add task
            </button>

            {tasks.map(t => (
              <div key={t.id} style={styles.card}>
                <p>{t.title}</p>
                {!focusEndTime ? (
                  <button style={styles.btn} onClick={() => startFocus(t.id)}>
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

            {snakeUnlocked && (
              <button style={styles.btn} onClick={() => setShowSnake(true)}>
                🐍 Play Snake
              </button>
            )}
          </>
        )}

        {view === "review" && (
          <>
            <h2>Review</h2>
            {history.map(h => (
              <div key={h.id} style={styles.card}>
                <b>{h.task}</b>
                <p>{h.result}</p>
                <p style={styles.dim}>
                  {formatTime(h.duration)} · {h.time}
                </p>
              </div>
            ))}
          </>
        )}

        {view === "settings" && (
          <>
            <h2>Settings</h2>
            <p style={styles.dim}>
              Screen blocking mode
            </p>
            <button
              style={styles.btn}
              onClick={() =>
                setScreenTimeMode(
                  screenTimeMode === "guided" ? "native" : "guided"
                )
              }
            >
              Mode: {screenTimeMode}
            </button>
            <button
              style={styles.subtleBtn}
              onClick={() => setScreenTimeReady(true)}
            >
              Mark Screen Time as set up
            </button>
          </>
        )}
      </Screen>
    </div>
  );
}

/* ================== COMPONENTS ================== */

function Screen({ children, transitionKey }) {
  return (
    <div
      key={transitionKey}
      style={{
        animation: "fadeSlide 250ms ease",
        padding: 16
      }}
    >
      {children}
    </div>
  );
}

function BottomNav({ view, navigate }) {
  return (
    <div style={styles.nav}>
      {["home", "focus", "review", "settings"].map(v => (
        <button
          key={v}
          onClick={() => navigate(v)}
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
    fontFamily: "system-ui"
  },
  nav: {
    display: "flex",
    justifyContent: "space-around",
    padding: 12,
    borderBottom: "1px solid #222"
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
  subtleBtn: {
    background: "transparent",
    border: "none",
    color: "#9ca3af"
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
  dim: { opacity: 0.7 }
};
