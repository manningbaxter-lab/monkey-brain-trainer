import React, { useState, useEffect } from "react";

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

  const [brutalMode, setBrutalMode] = useState(
    JSON.parse(localStorage.getItem("brutalMode")) ?? false
  );

  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState({ done: 0, quit: 0 });

  /* ---------- LOAD ---------- */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("mbt"));
    if (saved) {
      setTasks(saved.tasks || []);
      setStreak(saved.streak || 0);
      setWeek(saved.week || { done: 0, quit: 0 });
      setBrutalMode(saved.brutalMode ?? false);
    }
  }, []);

  /* ---------- SAVE ---------- */
  useEffect(() => {
    localStorage.setItem(
      "mbt",
      JSON.stringify({ tasks, streak, week, brutalMode })
    );
  }, [tasks, streak, week, brutalMode]);

  /* ---------- MIDNIGHT RESET ---------- */
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("lastReset");

    if (today !== last) {
      setTasks(ts => ts.map(t => ({ ...t, doneToday: false })));
      localStorage.setItem("lastReset", today);
    }
  }, []);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && running) setRunning(false);
  }, [timeLeft, running]);

  function startTimer() {
    const seconds = hours * 3600 + minutes * 60;
    if (seconds < MIN_SECONDS) {
      alert("Minimum focus time is 10 minutes.");
      return;
    }
    setTimeLeft(seconds);
    setRunning(true);
  }

  function addTask() {
    if (!title.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title,
        repeat,
        doneToday: false
      }
    ]);
    setTitle("");
    setRepeat(false);
  }

  function completeTask(id) {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, doneToday: true } : t
    ));
    setStreak(s => s + 1);
    setWeek(w => ({ ...w, done: w.done + 1 }));
    setActiveId(null);
    setRunning(false);
    setTimeLeft(0);
  }

  function quitTask() {
    setWeek(w => ({ ...w, quit: w.quit + 1 }));
    setStreak(s => Math.max(0, s - 1));
    setRunning(false);
    setTimeLeft(0);
    setActiveId(null);
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
    if (activeId === id) {
      setRunning(false);
      setTimeLeft(0);
      setActiveId(null);
    }
  }

  const active = tasks.find(t => t.id === activeId);

  return (
    <div style={styles.page}>
      <h2>🐵 Monkey Brain Trainer</h2>

      <label style={styles.toggle}>
        <input
          type="checkbox"
          checked={brutalMode}
          onChange={() => setBrutalMode(v => !v)}
        /> Brutal Mode (hide timer)
      </label>

      {/* ADD TASK */}
      <div style={styles.card}>
        <input
          style={styles.input}
          placeholder="Task"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <label style={styles.small}>
          <input
            type="checkbox"
            checked={repeat}
            onChange={() => setRepeat(v => !v)}
          /> Repeat daily
        </label>
        <button style={styles.btn} onClick={addTask}>Add task</button>
      </div>

      {/* TASK LIST */}
      {tasks.map(t => (
        <div key={t.id} style={styles.card}>
          <p>{t.title} {t.repeat && "(daily)"}</p>

          {!t.doneToday && (
            <button style={styles.btn} onClick={() => setActiveId(t.id)}>
              Start
            </button>
          )}

