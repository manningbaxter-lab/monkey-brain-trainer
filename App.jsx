import React, { useState, useEffect } from "react";

/* -------------------------------------------------
   Utilities
-------------------------------------------------- */
const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

function openScreenTimeSettings() {
  if (isiOS) {
    window.location.href = "App-Prefs:SCREEN_TIME";
  } else {
    alert("Screen Time setup is available on iPhone and iPad.");
  }
}

/* -------------------------------------------------
   Main App
-------------------------------------------------- */
export default function App() {
  /* ----- Core Task / Focus State ----- */
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  /* ----- Screen Time Level‑1 State ----- */
  const [screenTimeReady, setScreenTimeReady] = useState(false);
  const [showScreenTimeGuide, setShowScreenTimeGuide] = useState(false);

  /* ----- Persistence ----- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt_state"));
    if (saved) {
      setTasks(saved.tasks || []);
      setScreenTimeReady(saved.screenTimeReady || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "mbt_state",
      JSON.stringify({ tasks, screenTimeReady })
    );
  }, [tasks, screenTimeReady]);

  /* ----- Timer ----- */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  /* -------------------------------------------------
     Task / Focus Actions
  -------------------------------------------------- */
  function addTask() {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask }]);
    setNewTask("");
  }

  function startFocus(taskId) {
    // 🔔 Reminder if Screen Time not set up
    if (!screenTimeReady && isiOS) {
      setShowScreenTimeGuide(true);
      return;
    }

    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds < 10 * 60) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }

    setActiveTaskId(taskId);
    setTimeLeft(totalSeconds);
    setRunning(true);
  }

  function endFocus() {
    setRunning(false);
    setTimeLeft(0);
    setActiveTaskId(null);
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);

  /* -------------------------------------------------
     Screen Time Instruction Screen
  -------------------------------------------------- */
  if (showScreenTimeGuide) {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <div style={styles.card}>
            <h2>Finish setting up Focus Blocking</h2>

            <p style={styles.textDim}>
              Monkey Brain Trainer works best when iOS Screen Time is enabled.
            </p>

            <ol style={styles.list}>
              <li>
                <b>Turn on Screen Time</b>
                <br />
                Settings → Screen Time → Turn On
              </li>

              <li>
                <b>Set App Limits</b>
                <br />
                Settings → Screen Time → App Limits
                <br />
                Add limits for apps you don’t want during focus:
                <br />
                Instagram, TikTok, YouTube, Reddit
              </li>

              <li>
                <b>Optional (recommended)</b>
                <br />
                Enable <b>Downtime</b> during your focus hours.
              </li>
            </ol>

            <button style={styles.btn} onClick={openScreenTimeSettings}>
              Open Screen Time Settings
            </button>

            <button
              style={styles.subtleBtn}
              onClick={() => {
                setScreenTimeReady(true);
                setShowScreenTimeGuide(false);
              }}
            >
              I’ve set it up
            </button>

            <button
              style={styles.subtleBtn}
              onClick={() => setShowScreenTimeGuide(false)}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------
     Main UI
  -------------------------------------------------- */
  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h1 style={{ marginBottom: 8 }}>🐵 Monkey Brain Trainer</h1>

        {!screenTimeReady && isiOS && (
          <div style={styles.notice}>
            Focus Blocking is not set up yet.
            <button
              style={styles.linkBtn}
              onClick={() => setShowScreenTimeGuide(true)}
            >
              Set it up
            </button>
          </div>
        )}

        {/* Add Task */}
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

        {/* Task List */}
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
                />
                h
                <input
                  type="number"
                  style={styles.time}
                  value={minutes}
                  onChange={e => setMinutes(Number(e.target.value))}
                />
                m
                <button
                  style={styles.btn}
                  onClick={() => startFocus(task.id)}
                >
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
                <button style={styles.penaltyBtn} onClick={endFocus}>
                  End focus session
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

/* -------------------------------------------------
   Styles (calmer, Dopy‑like)
-------------------------------------------------- */
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
    color: "#fff",
    marginBottom: 8
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
    width: "100%",
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    marginTop: 8
  },
  linkBtn: {
    marginLeft: 8,
    background: "none",
    border: "none",
    color: "#93c5fd",
    cursor: "pointer"
  },
  penaltyBtn: {
    width: "100%",
    padding: 14,
    marginTop: 8,
    background: "#7f1d1d",
    borderRadius: 12,
    border: "none",
    color: "#fff"
  },
  notice: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 12
  },
  textDim: {
    opacity: 0.7
  },
  list: {
    fontSize: 14,
    lineHeight: 1.5
  },
  time: {
    width: 60,
    marginRight: 4,
    marginLeft: 4
  },
  timer: {
    fontSize: 20,
    marginTop: 6
  },
  footer: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 16
  }
};
