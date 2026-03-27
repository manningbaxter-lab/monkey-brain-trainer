import React, { useState, useEffect } from "react";
import Snake from "./Snake.jsx";

const MIN_SECONDS = 10 * 60;

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState("");
  const [repeat, setRepeat] = useState(false);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState({ done: 0, quit: 0 });

  const [snakeUnlocked, setSnakeUnlocked] = useState(false);
  const [showSnake, setShowSnake] = useState(false);

  /* LOAD / SAVE */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setStreak(saved.streak || 0);
      setWeek(saved.week || { done: 0, quit: 0 });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mbt", JSON.stringify({ tasks, streak, week }));
  }, [tasks, streak, week]);

  /* MIDNIGHT RESET */
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("lastReset");
    if (today !== last) {
      setTasks(ts => ts.map(t => ({ ...t, doneToday: false })));
      localStorage.setItem("lastReset", today);
    }
  }, []);

  /* TIMER */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  function startTimer() {
    const seconds = hours * 3600 + minutes * 60;
    if (seconds < MIN_SECONDS) return alert("Minimum 10 minutes");
    setTimeLeft(seconds);
    setRunning(true);
  }

  function addTask() {
    if (!title.trim()) return;
    setTasks([...tasks, { id: Date.now(), title, repeat, doneToday: false }]);
    setTitle("");
    setRepeat(false);
  }

  function completeTask(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, doneToday: true } : t));
    setStreak(s => s + 1);
    setWeek(w => ({ ...w, done: w.done + 1 }));
    setSnakeUnlocked(true);
    setActiveId(null);
    setRunning(false);
    setTimeLeft(0);
  }

  function quitTask() {
    setWeek(w => ({ ...w, quit: w.quit + 1 }));
    setStreak(s => Math.max(0, s - 1));
    setActiveId(null);
  }

  const active = tasks.find(t => t.id === activeId);

  if (showSnake) {
    return <Snake onExit={() => { setShowSnake(false); setSnakeUnlocked(false); }} />;
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: 16 }}>
      <h2>🐵 Monkey Brain Trainer</h2>

      <input
        placeholder="Task"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <label>
        <input type="checkbox" checked={repeat} onChange={() => setRepeat(v => !v)} />
        Repeat daily
      </label>
      <button onClick={addTask}>Add</button>

      {tasks.map(t => (
        <div key={t.id}>
          <p>{t.title}</p>
          {!t.doneToday && <button onClick={() => setActiveId(t.id)}>Start</button>}
        </div>
      ))}

      {active && (
        <div>
          <input type="number" value={hours} onChange={e => setHours(+e.target.value)} /> h
          <input type="number" value={minutes} onChange={e => setMinutes(+e.target.value)} /> m
          <button onClick={startTimer}>Start Focus</button>
          {timeLeft === 0 && (
            <>
              <button onClick={() => completeTask(active.id)}>Complete</button>
              <button onClick={quitTask}>Quit</button>
            </>
          )}
        </div>
      )}

      <p>🔥 Streak: {streak}</p>
      <p>📊 Week ✅ {week.done} ❌ {week.quit}</p>

      {snakeUnlocked && (
        <button onClick={() => setShowSnake(true)}>
          Play Snake (Reward)
        </button>
      )}
    </div>
  );
}
``
