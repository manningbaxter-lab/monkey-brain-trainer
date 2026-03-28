import React, { useState, useEffect } from "react";

const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const MIN_FOCUS_SECONDS = 10 * 60;

/* -------------------------------------------
   Helpers
-------------------------------------------- */
function getWeekKey(date = new Date()) {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / 86400000);
  return `${date.getFullYear()}-W${Math.ceil((days + firstJan.getDay() + 1) / 7)}`;
}

/* -------------------------------------------
   App
-------------------------------------------- */
export default function App() {
  /* ---------- Core State ---------- */
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  /* ---------- Screen Time (Level‑1) ---------- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  /* ---------- Smart Nudge Tracking ---------- */
  const [earlyEndsToday, setEarlyEndsToday] = useState(0);
  const [showNudge, setShowNudge] = useState(false);

  /* ---------- Weekly Stats + Reflection ---------- */
  const [weekKey] = useState(getWeekKey());
  const [weekStats, setWeekStats] = useState({
    started: 0,
    completed: 0,
    endedEarly: 0
  });
  const [reflection, setReflection] = useState("");
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  /* ---------- Persistence ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt_state"));
    if (saved) {
      setTasks(saved.tasks || []);
      setScreenTimeReady(saved.screenTimeReady || false);
      setEarlyEndsToday(saved.earlyEndsToday || 0);
    }

    const weekly = JSON.parse(localStorage.getItem(`mbt_week_${weekKey}`));
    if (weekly) {
      setWeekStats(weekly.stats);
      setReflection(weekly.reflection || "");
    }
  }, [weekKey]);

  useEffect(() => {
    localStorage.setItem(
      "mbt_state",
      JSON.stringify({ tasks, screenTimeReady, earlyEndsToday })
    );
  }, [tasks, screenTimeReady, earlyEndsToday]);

  useEffect(() => {
    localStorage.setItem(
      `mbt_week_${weekKey}`,
      JSON.stringify({ stats: weekStats, reflection })
    );
  }, [weekStats, reflection, weekKey]);

  /* ---------- Timer ---------- */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  /* -------------------------------------------
     Actions
  -------------------------------------------- */
  function addTask() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask }]);
    setNewTask("");
  }

  function startFocus(taskId) {
    if (isiOS && !screenTimeReady) {
      setShowGuide(true);
      return;
    }

    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds < MIN_FOCUS_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }

    setWeekStats(s => ({ ...s, started: s.started + 1 }));
    setActiveTaskId(taskId);
    setTimeLeft(totalSeconds);
    setRunning(true);
  }

  function completeFocus() {
    setWeekStats(s => ({ ...s, completed: s.completed + 1 }));
    resetFocus();
  }

  function endEarly() {
    const newCount = earlyEndsToday + 1;
    setEarlyEndsToday(newCount);
    setWeekStats(s => ({ ...s, endedEarly: s.endedEarly + 1 }));

    if (newCount >= 2) {
      setShowNudge(true);
    }

    resetFocus();
  }

  function resetFocus() {
    setRunning(false);
    setTimeLeft(0);
    setActiveTaskId(null);
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);

  /* -------------------------------------------
     Screen Time Guide (Level‑1)
  -------------------------------------------- */
  if (showGuide) {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <div style={styles.card}>
            <h2>Set up Focus Blocking</h2>
            <p style={styles.dim}>
              To reduce distractions, use iOS Screen Time during focus sessions.
            </p>

            <ol style={styles.list}>
              <li>Open the <b>Settings</b> app</li>
              <li>Go to <b>Screen Time</b> → Turn On</li>
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

  /* -------------------------------------------
     Weekly Review Screen (Feature 3)
  -------------------------------------------- */
  if (showWeeklyReview) {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <div style={styles.card}>
            <h2>This Week</h2>

            <p>Focus sessions started: <b>{weekStats.started}</b></p>
            <p>Completed: <b>{weekStats.completed}</b></p>
            <p>Ended early: <b>{weekStats.endedEarly}</b></p>

            <textarea
              style={styles.textarea}
              placeholder="Reflection: What helped? What got in the way?"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
            />

            <button
              style={styles.btn}
              onClick={() => setShowWeeklyReview(false)}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------
     Main UI
  -------------------------------------------- */
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h1>🐵 Monkey Brain Trainer</h1>

        {/* Reminder nudge */}
        {showNudge && (
          <div style={styles.notice}>
            You’ve ended focus early a few times today.  
            Consider a shorter session, or double‑check Screen Time setup.
            <button style={styles.linkBtn} onClick={() => setShowNudge(false)}>
              Got it
            </button>
          </div>
        )}

        {/* Weekly review access */}
        <button
          style={styles.subtleBtn}
          onClick={() => setShowWeeklyReview(true)}
        >
          Weekly review
        </button>

        {/* Screen Time reminder */}
        {isiOS && !screenTimeReady && (
          <div style={styles.notice}>
            Focus Blocking isn’t set up yet.
            <button style={styles.linkBtn} onClick={() => setShowGuide(true)}>
              Set it up
            </button>
          </div>
        )}

        {/* Add task */}
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

        {/* Tasks */}
        {tasks.map(task => (
          <div key={task.id} style={styles.card}>
            <p>{task.title}</p>

            {!running && (
              <>
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
                <button style={styles.btn} onClick={() => startFocus(task.id)}>
                  Start focus
                </button>
              </>
            )}

            {running && activeTask?.id === task.id && (
              <>
                <p style={styles.timer}>
                  {Math.floor(timeLeft / 60)}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </p>
                <button style={styles.btn} onClick={completeFocus}>
                  Finish
                </button>
                <button style={styles.penaltyBtn} onClick={endEarly}>
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

/* -------------------------------------------
   Styles
-------------------------------------------- */
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
  app: { maxWidth: 420, width: "100%" },
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
    border: "none",
    borderRadius: 12,
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
    border: "none",
    borderRadius: 12,
    color: "#fff",
    marginTop: 6
  },
  time: { width: 60, margin: "0 4px" },
  timer: { fontSize: 20, marginTop: 6 },
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
  footer: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 16
  }
};
