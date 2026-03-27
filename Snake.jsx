import React, { useEffect, useRef } from "react";

export default function Snake({ onExit }) {
  const canvasRef = useRef(null);
  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let dir = { x: 1, y: 0 };
  const size = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const move = () => {
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.y < 0 || head.x >= 20 || head.y >= 20) {
        onExit();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        food = {
          x: Math.floor(Math.random() * 20),
          y: Math.floor(Math.random() * 20)
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

    const interval = setInterval(move, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.key === "ArrowUp") dir = { x: 0, y: -1 };
      if (e.key === "ArrowDown") dir = { x: 0, y: 1 };
      if (e.key === "ArrowLeft") dir = { x: -1, y: 0 };
      if (e.key === "ArrowRight") dir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div style={{ textAlign: "center", color: "#fff" }}>
      <p>Reward unlocked. 3 minutes.</p>
      <canvas ref={canvasRef} width={400} height={400} />
      <button onClick={onExit} style={{ marginTop: 10 }}>
        Exit
      </button>
    </div>
  );
}
