import { useState, useEffect } from "react";
import {
  Lock,
  Timer,
  CheckCircle,
  Flame,
  Brain,
  Skull,
  Cloud,
  CloudOff,
  Shield
} from "lucide-react";

export default function App() {
  const [task, setTask] = useState("");
  const [hasTask, setHasTask] = useState(false);
  const [done, setDone] = useState(false);

  const [locked, setLocked] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const [streak, setStreak] = useState(0);
  const [pain, setPain] = useState(0);

  const [dopamine, setDopamine] = useState({
    youtube: false,
    sugar: false,
    gaming: false
  });

  const [cloudSynced, setCloudSynced] = useState(false);

  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) setLocked(false);
  }, [timeLeft]);

  useEffect(() => {
    setCloudSynced(false);
    const t = setTimeout(() => setCloudSynced(true), 1200);
    return () => clearTimeout(t);
  }, [done, streak]);

  function start(minutes) {
    setLocked(true);
    setTimeLeft(minutes * 60);
  }

  function commit() {
    if (task.trim()) setHasTask(true);
  }

  function complete() {
    if (done) return;
    setDone(true);
    setStreak(s => s + 1);
    setPain(p => p + 5);
  }

  function fail(type) {
    setDopamine(d => ({ ...d, [type]: true }));
    setStreak(s => Math.max(0, s - 2));
    setPain(p => Math.max(0, p - 3));
  }

  if (!locked && !hasTask) {
    return <div style={styles.blank}>No interface until a hard task is chosen.</div>;
  }

  return (
    <div style={styles.page}>
      <h2>🐵 Monkey Brain Trainer</h2>

      {locked && (
        <div style={styles.card}>
          <Lock />
          <p>{timeLeft ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}` : "Start"}</p>
          {!timeLeft && (
            <>
              <button style={styles.btn} onClick={() => start(30)}>
                <Timer /> 30 min
              </button>
              <button style={styles.btn} onClick={() => start(60)}>
                <Timer /> 60 min
              </button>
            </>
          )}
        </div>
      )}

      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="One hard task"
          value={task}
          disabled={hasTask}
          onChange={e => setTask(e.target.value)}
        />
        {!hasTask && <button style={styles.btn} onClick={commit}>Commit</button>}
      </div>

      {hasTask && (
        <div style={styles.card}>
          <p style={{ textDecoration: done ? "line-through" : "none" }}>{task}</p>
          <button style={styles.btn} onClick={complete}><CheckCircle /></button>
        </div>
      )}

      <div style={styles.card}>
        {Object.keys(dopamine).map(k => (
          <button
            key={k}
            style={{ ...styles.btn, background: dopamine[k] ? "#400" : "#222" }}
            onClick={() => fail(k)}
          >
            {dopamine[k] ? <Skull /> : <Brain />} {k}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <p>🔥 Streak: {streak}</p>
        <p>⚡ Pain: {pain}</p>
        <Flame />
      </div>

      <div style={styles.footer}>
        {cloudSynced ? <Cloud /> : <CloudOff />} Cloud
        <Shield /> PWA Ready
      </div>

      <p style={styles.motto}>Comfort rots. Effort adapts.</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    padding: 16,
    fontFamily: "system-ui",
    textAlign: "center"
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 12,
    padding: 12,
    margin: "12px 0",
    display: "grid",
    gap: 8
  },
  btn: {
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#000",
    color: "#fff"
  },
  blank: {
    minHeight: "100vh",
    background: "#000",
    color: "#666",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  footer: {
    fontSize: 12,
    color: "#777",
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between"
  },
  motto: {
    fontSize: 11,
    color: "#666"
  }
};
