import React, { useState, useEffect } from "react";
import Snake from "./Snake.jsx";

const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const MIN_FOCUS_SECONDS = 10 * 60;

/* =================================================
   Helpers
================================================= */
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

/* =================================================
   App
================================================= */
export default function App() {
  /* ---------- Tasks + Per‑Task Stats ---------- */
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [newTask, setNewTask] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  /* ---------- Focus Timing (robust) ---------- */
  const [focusStartTime, setFocusStartTime] = useState(null);
  const [focusEndTime, setFocusEndTime] = useState(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  /* ---------- Screen Time (Level 1) ---------- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  /* ---------- Adaptive Nudges ---------- */
  const [earlyEndsToday, setEarlyEndsToday] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
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

  /* ---------- Snake ---------- */
  const [snakeUnlocked, setSnakeUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* =================================================
     Load / Save
  ================================================= */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setTaskStats(saved.taskStats || {});
      setScreenTimeReady(saved.screenTimeReady || false);
      setEarlyEndsToday(saved.earlyEndsToday || 0);
      setCompletedToday(saved.completedToday || 0);
      setActiveTaskId(saved.activeTaskId || null);
      setFocusStartTime(saved.focusStartTime || null);
      setFocusEndTime(saved.focusEndTime || null);
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
        screenTimeReady,
        earlyEndsToday,
        completedToday,
        activeTaskId,
        focusStartTime,
        focusEndTime,
        snakeUnlocked
      })
    );
  }, [
    tasks,
    taskStats,
    screenTimeReady,
    earlyEndsToday,
    completedToday,
    activeTaskId,
    focusStartTime,
    focusEndTime,
    snakeUnlocked
  ]);

  useEffect(() => {
    localStorage.setItem(
      weekKey,
      JSON.stringify({ stats: weeklyStats, reflection: weeklyReflection })
    );
  }, [weeklyStats, weeklyReflection, weekKey]);

  /* =================================================
     Timer UI refresh (time‑safe)
  ================================================= */
  useEffect(() => {
    const i = setInterval(() => {
      if (!focusEndTime) return;
      const diff = focusEndTime - now();
      setTimeLeftMs(diff);
      if (diff <= 0) endFocus(true);
    }, 1000);

    return () => clearInterval(i);
  }, [focusEndTime]);

  /* =================================================
     Derived Suggestions
  ================================================= */
  function getRecommendedMinutes() {
    if (earlyEndsToday >= 2) return 20;
    if (completedToday >= 2) return 40;
    return 30;
  }

  function getTaskDifficultyHint(taskId) {
    const stats = taskStats[taskId];
    if (!stats) return null;

    if (stats.early >= 2) {
      return "Suggestion: break this task into a smaller step";
    }
    if (stats.completed >= 3 && stats.early === 0) {
      return "Suggestion: this may be too easy — consider increasing challenge";
    }
    return null;
  }

  /* =================================================
     Actions
  ================================================= */
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

    setWeeklyStats(s => ({ ...s, started: s.started + 1 }));
    setActiveTaskId(taskId);
    setFocusStartTime(start);
    setFocusEndTime(end);
    setTimeLeftMs(end - start);
  }

  function endFocus(auto = false) {
    if (!activeTaskId) return;

    const workedMs = focusStartTime ? now() - focusStartTime : 0;
    const stats = taskStats[activeTaskId] || { early: 0, completed: 0 };

    if (auto) {
      setTaskStats({
        ...taskStats,
        [activeTaskId]: {
          ...stats,
          completed: stats.completed + 1
        }
      });
      setCompletedToday(c => c + 1);
      setWeeklyStats(s => ({
        ...s,
        completed: s.completed + 1,
        focusedMs: s.focusedMs + workedMs
      }));
      setSnakeUnlocked(true);
    } else {
      const count = earlyEndsToday + 1;
      setEarlyEndsToday(count);
      if (count >= 2) setShowNudge(true);

      setTaskStats({
        ...taskStats,
        [activeTaskId]: {
          ...stats,
          early: stats.early + 1
        }
      });
      setWeeklyStats(s => ({
        ...s,
        endedEarly: s.endedEarly + 1,
        focusedMs: s.focusedMs + workedMs
      }));
    }

    setActiveTaskId(null);
    setFocusStartTime(null);
    setFocusEndTime(null);
    setTimeLeftMs(0);
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);
  const recommendedMinutes = getRecommendedMinutes();

  /* =================================================
     Screens (unchanged except additions)
  ================================================= */

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

  if (showGuide) {
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
            <button
              style={styles.btn}
              onClick={() => {
                setScreenTimeReady(true);
                setShowGuide(false);
              }}
            >
              I’ve set it up
            </button>
            <button style={styles.subtleBtn} onClick={() => setShowGuide(false)}>
              Do this later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showWeeklySummary) {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <div style={styles.card}>
            <h2>This Week</h2>
            <p>Started: {weeklyStats.started}</p>
            <p>Completed: {weeklyStats.completed}</p>
            <p>Ended early: {weeklyStats.endedEarly}</p>
            <p>Focused: {formatTime(weeklyStats.focusedMs)}</p>
            <textarea
              style={styles.textarea}
              placeholder="Reflection..."
              value={weeklyReflection}
              onChange={e => setWeeklyReflection(e.target.value)}
            />
            <button style={styles.btn} onClick={() => setShowWeeklySummary(false)}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =================================================
     Main UI
  ================================================= */
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h1>🐵 Monkey Brain Trainer</h1>

        {showNudge && (
          <div style={styles.notice}>
            You’ve ended focus early a few times today.
            Shorter sessions or simpler tasks may help.
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

        {tasks.map(task => {
          const hint = getTaskDifficultyHint(task.id);

          return (
            <div key={task.id} style={styles.card}>
              <p>{task.title}</p>

              {hint && <p style={styles.dim}>{hint}</p>}

              {!focusEndTime && (
                <>
                  <p style={styles.dim}>
                    Suggested focus: {recommendedMinutes} minutes
                  </p>
                  <button
                    style={styles.btn}
                    onClick={() => startFocus(task.id, recommendedMinutes)}
                  >
                    Start recommended focus
                  </button>
                  <button
                    style={styles.subtleBtn}
                    onClick={() => startFocus(task.id, 30)}
                  >
                    Start 30‑minute focus
                  </button>
                </>
              )}

              {focusEndTime && activeTask?.id === task.id && (
                <>
                  <p style={styles.timer}>{formatTime(timeLeftMs)}</p>
                  <button
                    style={styles.penaltyBtn}
                    onClick={() => endFocus(false)}
                  >
                    End early
                  </button>
                </>
              )}
            </div>
          );
        })}

        <button
          style={{ ...styles.btn, opacity: snakeUnlocked ? 1 : 0.4 }}
          disabled={!snakeUnlocked}
          onClick={() => snakeUnlocked && setShowSnake(true)}
        >
          🐍 Snake — {snakeUnlocked ? "Reward unlocked" : "Complete a focus session"}
        </button>

        <p style={styles.footer}>Comfort rots. Effort adapts.</p>
      </div>
    </div>
  );
}

/* =================================================
   Styles
================================================= */
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
    width: "100%",
    padding: 12,
    borderRadius: 12,
    background: "#0f0f15",
    color: "#fff",
    border: "1px solid #333",
    marginBottom: 8
  },
  textarea: {
    width: "100%",
    minHeight: 80,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    background: "#0f0f15",
    color: "#fff",
    border: "1px solid #333"
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
    marginBottom: 6
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
  dim: { opacity: 0.7, marginBottom: 6 },
  list: { fontSize: 14, lineHeight: 1.5 },
  timer: { fontSize: 20, marginTop: 6 },
  footer: { fontSize: 11, opacity: 0.6, textAlign: "center", marginTop: 16 }
};
