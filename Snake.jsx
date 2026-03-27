import React, { useEffect, useRef, useState } from "react";

export default function Snake({ onExit }) {
  const canvasRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });

  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let dir = { x: 1, y: 0 };

  const grid = 20;
  const size = 20;
  const speed = 120;

  const MAX_TIME = 3 * 60 * 1000; // 3 minutes
  const [progress, setProgress] = useState(100);

  /* ---------- GAME LOOP ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const move = () => {
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= grid ||
        head.y >= grid
      ) {
        vibrateAndExit();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        food = {
          x: Math.floor(Math.random() * grid),
          y: Math.floor(Math.random() * grid)
        };
      } else {
        snake.pop();
      }

      ctx.clearRect(0, 0, 400, 400);
      ctx.fillStyle = "#0f0";
      snake.forEach(s =>
        ctx.fillRect(s.x * size, s.y * size, size - 2, size - 2)
      );
      ctx.fillStyle = "#f00";
      ctx.fillRect(food.x * size, food.y * size, size - 2, size - 2);
    };

    const interval = setInterval(move, speed);
    return () => clearInterval(interval);
  }, []);

  /* ---------- HARD AUTO-END + PROGRESS ---------- */
  useEffect(() => {
    const start = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / MAX_TIME) * 100);
      setProgress(remaining);

      if (elapsed >= MAX_TIME) {
        vibrateAndExit();
      }
    }, 200);

    return () => clearInterval(tick);
  }, []);

  /* ---------- KEYBOARD ---------- */
  useEffect(() => {
    const onKey = e => {
      if (e.key === "ArrowUp") dir = { x: 0, y: -1 };
      if (e.key === "ArrowDown") dir = { x: 0, y: 1 };
      if (e.key === "ArrowLeft") dir = { x: -1, y: 0 };
      if (e.key === "ArrowRight") dir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- TOUCH CONTROLS ---------- */
  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) dir = { x: 1, y: 0 };
      else if (dx < -20) dir = { x: -1, y: 0 };
    } else {
      if (dy > 20) dir = { x: 0, y: 1 };
      else if (dy < -20) dir = { x: 0, y: -1 };
    }
  }

  /* ---------- VIBRATION ---------- */
  function vibrateAndExit() {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    onExit();
  }

  return (
    <div style={{ textAlign: "center", color: "#fff" }}>
      <p>Reward unlocked — limited time</p>

      {/* TIME BAR */}
      <div
        style={{
          width: "100%",
          height: 6,
          background: "#222",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 8
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#0f0",
            transition: "width 0.2s linear"
          }}
        />
      </div>

      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      />

      <button onClick={vibrateAndExit} style={{ marginTop: 12 }}>
        Exit
      </button>
    </div>
  );
}
