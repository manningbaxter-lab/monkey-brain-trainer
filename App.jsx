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

function getWeekKey(date = new Date()) {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / 86400000);
  return `${date.getFullYear()}-W${Math.ceil((days + firstJan.getDay() + 1) / 7)}`;
}

/* ------------------------------------------
   App
------------------------------------------- */
export default function App() {
  /* ---------- Tasks ---------- */
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  /* ---------- Focus Timer (robust) ---------- */
  const [focusEndTime, setFocusEndTime] = useState(null);
  const [focusStartTime, setFocusStartTime] = useState(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  /* ---------- Screen Time (Level‑1) ---------- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  /* ---------- Smart Nudges ---------- */
  const [earlyEndsToday, setEarlyEndsToday] = useState(0);
  const [showNudge, setShowNudge] = useState(false);

  /* ---------- Weekly Summary ---------- */
  const weekKey = getWeekKey();
  const [weeklyStats, setWeeklyStats] = useState({
    started: 0,
    completed: 0,
    endedEarly: 0,
    focusedMs: 0
  });
  const [weeklyReflection, setWeeklyReflection] = useState("");
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  /* ---------- Load / Save ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setScreenTimeReady(saved.screenTimeReady || false);
      setEarlyEndsToday(saved.earlyEndsToday || 0);
      setFocusEndTime(saved.focusEndTime || null);
      setFocusStartTime(saved.focusStartTime || null);
      setActiveTaskId(saved.activeTaskId || null);
    }

    const savedWeek = JSON.parse(localStorage.getItem(weekKey));
    if (savedWeek) {
      setWeeklyStats(savedWeek.stats);
      setWeeklyReflection(savedWeek.reflection || "");
    }
  }, [weekKey]);

  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({
        tasks,
        screenTimeReady,
        earlyEndsToday,
        focusEndTime,
        focusStartTime,
        activeTaskId
      })
    );
  }, [tasks, screenTimeReady, earlyEndsToday, focusEndTime, focusStartTime, activeTaskId]);

  useEffect(() => {
    localStorage.setItem(
      weekKey,
      JSON.stringify({
        stats: weeklyStats,
        reflection: weeklyReflection
      })
    );
  }, [weeklyStats, weeklyReflection, weekKey]);

  /* ---------- Timer UI refresh ---------- */
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

  function startFocus(taskId, minutes = 30) {
    if (isiOS && !screenTimeReady) {
      setShowGuide(true);
      return;
    }

    const seconds = minutes * 60;
    if (seconds < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }

    const start = now();
    const end = start + seconds * 1000;

    setWeeklyStats(s => ({ ...s, started: s.started + 1 }));
    setActiveTaskId(taskId);
    setFocusStartTime(start);
    setFocusEndTime(end);
    setTimeLeftMs(end - start);
  }

  function endFocus(auto = false) {
    if (focusStartTime) {
      const workedMs = Math.max(0, now() - focusStartTime);

      if (auto) {
        setWeeklyStats(s => ({
          ...s,
          completed: s.completed + 1,
          focusedMs: s.focusedMs + workedMs
        }));
      } else {
        const count = earlyEndsToday + 1;
        setEarlyEndsToday(count);
        if (count >= 2) setShowNudge(true);

        setWeeklyStats(s => ({
          ...s,
          endedEarly: s.endedEarly + 1,
          focusedMs: s.focusedMs + workedMs
        }));
      }
    }

    setFocusEndTime(null);
    setFocusStartTime(null);
    setTimeLeftMs(0);
    setActiveTaskId(null);
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);

  /* ------------------------------------------
     Screen Time Guide
  ------------------------------------------- */
  if (showGuide) {
    return (
      <ScreenTimeGuide
        onDone={() => {
          setScreenTimeReady(true);
          setShowGuide(false);
        }}
        onLater={() => setShowGuide(false)}
      />
    );
  }

  /* ------------------------------------------
     Weekly Summary Screen
  ------------------------------------------- */
  if (showWeeklySummary) {
    return (
      <WeeklySummary
        stats={weeklyStats}
        reflection={weeklyReflection}
        setReflection={setWeeklyReflection}
        onClose={() => setShowWeeklySummary(false)}
      />
    );
  }

  /* ------------------------------------------
     Main UI
  ------------------------------------------- */
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h1>🐵 Monkey Brain Trainer</h1>

        {showNudge && (
          <div style={styles.notice}>
            You’ve ended focus early a few times today.
            Consider shorter sessions or checking Screen Time.
            <button style={styles.linkBtn} onClick={() => setShowNudge(false)}>
              Got it
            </button>
          </div>
        )}

        <button style={styles.subtleBtn} onClick={() => setShowWeeklySummary(true)}>
          Weekly focus summary
        </button>

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
              <button style={styles.btn} onClick={() => startFocus(task.id)}>
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
   Sub‑components
------------------------------------------- */

function ScreenTimeGuide({ onDone, onLater }) {
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <div style={styles.card}>
          <h2>Set up Focus Blocking</h2>
          <p style={styles.dim}>
            Use iOS Screen Time to reduce distractions during focus.
          </p>

          <ol style={styles.list}>
            <li>Open <b>Settings</b></li>
            <li>Tap <b>Screen Time</b> → Turn On</li>
            <li>Set <b>App Limits</b> for distracting apps</li>
            <li>Optionally enable <b>Downtime</b></li>
          </ol>

          <button style={styles.btn} onClick={onDone}>
            I’ve set it up
          </button>
          <button style={styles.subtleBtn} onClick={onLater}>
            Do this later
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklySummary({ stats, reflection, setReflection, onClose }) {
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <div style={styles.card}>
          <h2>This Week</h2>
          <p>Started: <b>{stats.started}</b></p>
          <p>Completed: <b>{stats.completed}</b></p>
          <p>Ended early: <b>{stats.endedEarly}</b></p>
          <p>
            Focused time: <b>{formatTime(stats.focusedMs)}</b>
          </p>

          <textarea
            style={styles.textarea}
            placeholder="What worked well this week? What didn’t?"
            value={reflection}
            onChange={e => setReflection(e.target.value)}
          />

          <button style={styles.btn} onClick={onClose}>
            Done
          </button>
        </div>
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
    fontFamily: "system-ui"
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
  textarea: {
    width: "100%",
    minHeight: 80,
    borderRadius: 12,
    padding: 12,
    background: "#0f0f15",
    color: "#fff",
    border: "1px solid #333",
    marginTop: 8
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
    marginBottom: 8
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
  notice: { fontSize: 13, opacity: 0.85, marginBottom: 12 },
  linkBtn: { marginLeft: 8, background: "none", border: "none", color: "#93c5fd" },
  dim: { opacity: 0.7 },
  list: { fontSize: 14, lineHeight: 1.5 },
  timer: { fontSize: 20, marginTop: 6 },
  footer: { fontSize: 11, opacity: 0.6, textAlign: "center", marginTop: 16 }
};
