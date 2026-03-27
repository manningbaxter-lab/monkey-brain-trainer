import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Flame,
  Lock,
  Timer,
  Brain,
  Skull,
  CloudOff,
  Cloud,
  Shield
} from "lucide-react";

export default function MonkeyBrainTrainerUltimate() {
  const [task, setTask] = useState("");
  const [hasTask, setHasTask] = useState(false);
  const [taskDone, setTaskDone] = useState(false);

  const [streak, setStreak] = useState(0);
  const [painScore, setPainScore] = useState(0);

  const [locked, setLocked] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  const [dopamineFast, setDopamineFast] = useState({
    youtube: false,
    sugar: false,
    gaming: false
  });

  const [cloudSynced, setCloudSynced] = useState(false);
  const [lastDay, setLastDay] = useState(new Date().toDateString());

  /* -------- TIMER -------- */
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && sessionStarted) {
      setLocked(false);
    }
  }, [timeLeft, sessionStarted]);

  /* -------- DAILY RESET + DECAY -------- */
  useEffect(() => {
    const today = new Date().toDateString();
    if (today !== lastDay) {
      setTask("");
      setHasTask(false);
      setTaskDone(false);
      setDopamineFast({ youtube: false, sugar: false, gaming: false });
      setPainScore(0);
      setStreak(prev => Math.max(0, prev - 1));
      setLocked(true);
      setSessionStarted(false);
      setLastDay(today);
    }
  }, [lastDay]);

  /* -------- CLOUD SYNC (SIMULATED) -------- */
  useEffect(() => {
    setCloudSynced(false);
    const t = setTimeout(() => setCloudSynced(true), 1500);
    return () => clearTimeout(t);
  }, [taskDone, streak]);

  /* -------- ACTIONS -------- */
  function startSession(min) {
    setLocked(true);
    setSessionStarted(true);
    setTimeLeft(min * 60);
  }

  function commitTask() {
    if (!task.trim()) return;
    setHasTask(true);
  }

  function completeTask() {
    if (taskDone) return;
    setTaskDone(true);
    setStreak(s => s + 1);
    setPainScore(p => p + 5);
  }

  function breakFast(type) {
    setDopamineFast(prev => ({ ...prev, [type]: true }));
    setStreak(s => Math.max(0, s - 2));
    setPainScore(p => Math.max(0, p - 3));
  }

  /* -------- ULTRA HARD MODE -------- */
  if (!locked && !hasTask) {
    return (
      <div style={styles.blank}>
        No interface until a hard task is chosen.
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <motion.h1 style={styles.title}>
        🐵 Monkey Brain Trainer — Ultimate
      </motion.h1>

      {/* LOCK SCREEN */}
      <AnimatePresence>
        {locked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={styles.card}>
              <Lock />
              <p>Discomfort is required.</p>
              <strong>
                {timeLeft > 0
                  ? `${Math.floor(timeLeft / 60)}:${String(
                      timeLeft % 60
                    ).padStart(2, "0")}`
                  : "Start"}
              </strong>

              {!sessionStarted && (
                <>
                  <button style={styles.btn} onClick={() => startSession(30)}>
                    <Timer /> 30 min
                  </button>
                  <button style={styles.btn} onClick={() => startSession(60)}>
                    <Timer /> 60 min
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TASK INPUT */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="One hard task only"
          value={task}
          onChange={e => setTask(e.target.value)}
          disabled={hasTask}
        />
        {!hasTask && (
          <button style={styles.btn} onClick={commitTask}>
            Commit
          </button>
        )}
      </div>

      {/* ACTIVE TASK */}
      {hasTask && (
        <div style={styles.card}>
          <span style={{ textDecoration: taskDone ? "line-through" : "none" }}>
            {task}
          </span>
          <button style={styles.btn} onClick={completeTask}>
            <CheckCircle />
          </button>
        </div>
      )}

      {/* DOPAMINE FAST */}
      <div style={styles.card}>
        <p>Dopamine Rules</p>
        {Object.keys(dopamineFast).map(d => (
          <button
            key={d}
            style={{
              ...styles.btn,
              background: dopamineFast[d] ? "#400" : "#222"
            }}
            onClick={() => breakFast(d)}
          >
            {dopamineFast[d] ? <Skull /> : <Brain />} {d}
          </button>
        ))}
      </div>

      {/* METRICS */}
      <div style={styles.card}>
        <div>🔥 Streak: {streak}</div>
        <div>⚖ Pain: {painScore}</div>
        <Flame />
      </div>

      {/* STATUS */}
      <div style={styles.footer}>
        {cloudSynced ? <Cloud /> : <CloudOff />} Cloud
        <Shield /> PWA Ready
      </div>

      <p style={styles.motto}>Comfort rots. Effort adapts.</p>
    </div>
  );
}

/* -------- STYLES -------- */
const styles = {
  container: {
    minHeight: "100vh",
    background: "black",
    color: "white",
    padding: 16,
    fontFamily: "system-ui"
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 12
  },
  card: {
    background: "#111",
    border: "1px solid #222",
