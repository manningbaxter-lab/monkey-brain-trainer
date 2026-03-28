import React, { useState, useEffect } from "react";

const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const MIN_SECONDS = 10 * 60;

/* ------------------------------------------
   Helpers
------------------------------------------- */
function now() {
  return Date.now();
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------------------
   App
------------------------------------------- */
export default function App() {
  /* ---------- Tasks ---------- */
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  /* ---------- Focus / Timer ---------- */
  const [focusEndTime, setFocusEndTime] = useState(null); // timestamp in ms
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  /* ---------- Screen Time Level‑1 ---------- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  /* ---------- Smart Nudges ---------- */
  const [earlyEndsToday, setEarlyEndsToday] = useState(0);
  const [showNudge, setShowNudge] = useState(false);

  /* ---------- Load / Save ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (!saved) return;

    setTasks(saved.tasks || []);
    setScreenTimeReady(saved.screenTimeReady || false);
    setEarlyEndsToday(saved.earlyEndsToday || 0);
    setFocusEndTime(saved.focusEndTime || null);
    setActiveTaskId(saved.activeTaskId || null);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({
        tasks,
        screenTimeReady,
        earlyEndsToday,
        focusEndTime,
        activeTaskId
      })
    );
  }, [tasks, screenTimeReady, earlyEndsToday, focusEndTime, activeTaskId]);

  /* ---------- Timer Refresh Loop (UI only) ---------- */
  useEffect(() => {
    const i = setInterval(() => {
      if (!focusEndTime) return;

      const diff = focusEndTime - now();
      setTimeLeftMs(diff);

      if (diff <= 0) {
        endFocus(true);
      }
    }, 1000);

    return () => clearInterval(i);
  }, [focusEndTime]);

  /* ------------------------------------------
     Actions
  ------------------------------------------- */
  function addTask() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask }]);
    setNewTask("");
  }

  function startFocus(taskId, hours, minutes) {
    if (isiOS && !screenTimeReady) {
      setShowGuide(true);
      return;
    }

    const seconds = hours * 3600 + minutes * 60;
    if (seconds < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }

    const end = now() + seconds * 1000;
    setActiveTaskId(taskId);
    setFocusEndTime(end);
    setTimeLeftMs(end - now());
  }

  function endFocus(auto = false) {
    if (!auto) {
      const count = earlyEndsToday + 1;
      setEarlyEndsToday(count);
      if (count >= 2) setShowNudge(true);
    }

    setFocusEndTime(null);
    setTimeLeftMs(0);
    setActiveTaskId(null);
  }

  /* ------------------------------------------
     Screen Time Guide (1)
  ------------------------------------------- */
  if (showGuide) {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <div style={styles.card}>
            <h2>Set up Focus Blocking</h2>

            <p style={styles.dim}>
              Monkey Brain Trainer works best when iOS Screen Time helps reduce distractions.
            </p>

            <ol style={styles.list}>
              <li>Open your iPhone’s <b>Settings</b></li>
              <li>Tap <b>Screen Time</b> → Turn On</li>
              <li>Set <b>App Limits</b> for distracting apps</li>
              <li>Optionally enable <b>Downtime</b> during focus hours</li>
            </ol>

            <button
              style={styles.btn}
              onClick={() => {
                setScreenTimeReady(true);
                setShowGuide(false);
              }}
            >
              I’ve set it up
            </button>

            <button
              style={styles.subtleBtn}
              onClick={() => setShowGuide(false)}
            >
              Do this later
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------
     Main UI
  ------------------------------------------- */
  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h1>🐵 Monkey Brain Trainer</h1>

        {showNudge && (
          <div style={styles.notice}>
            You’ve ended focus early a few times today.
            Consider a shorter session or checking Screen Time.
            <button style={styles.linkBtn} onClick={() => setShowNudge(false)}>
              Got it
            </button>
          </div>
        )}

        {isiOS && !screenTimeReady && (
          <div style={styles.notice}>
            Focus Blocking isn’t set up yet.
            <button style={styles.linkBtn} onClick={() => setShowGuide(true)}>
              Set it up
            </button>
          </div>
        )}

        <div style={styles.card}>
          <input
            style={styles.input}
            placeholder="One important task"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
          />
          <button style={styles.btn} onClick={addTask}>
            Add task
          </button>
        </div>

        {tasks.map(task => (
          <div key={task.id} style={styles.card}>
            <p>{task.title}</p>

            {!focusEndTime && (
              <button
                style={styles.btn}
                onClick={() => startFocus(task.id, 0, 30)}
              >
                Start 30 min focus
              </button>
            )}

            {focusEndTime && activeTask?.id === task.id && (
              <>
                <p style={styles.timer}>{formatTime(timeLeftMs)}</p>
                <button style={styles.penaltyBtn} onClick={() => endFocus(false)}>
                  End early
                </button>
              </>
            )}
          </div>
        ))}

        <p style={styles.footer}>Comfort rots. Effort adapts.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------
   Styles
------------------------------------------- */
const styles = {
  page: {
    background: "#0b0b0f",
    color: "#f5f5f7",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: 16,
    fontFamily: "system-ui, -apple-system"
  },
  app: { width: "100%", maxWidth: 420 },
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
    border: "1px solid #333",
    background: "#0f0f15",
    color: "#fff",
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
    color: "#9ca3af",
    marginTop: 8
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
  notice: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 12
  },
  linkBtn: {
    marginLeft: 8,
    background: "none",
    border: "none",
    color: "#93c5fd"
  },
  dim: { opacity: 0.7 },
  list: { fontSize: 14, lineHeight: 1.5 },
  timer: { fontSize: 20, marginTop: 6 },
  footer: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 16
  }
};
