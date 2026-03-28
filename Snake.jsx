import React, { useEffect, useRef, useState } from "react";

export default function Snake({ onExit }) {
  const canvasRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const [progress, setProgress] = useState(100);

  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 15 };
  let dir = { x: 1, y: 0 };

  const grid = 20;
  const size = 20;
  const speed = 120;
  const MAX_TIME = 3 * 60 * 1000;

  function vibrateAndExit() {
    navigator.vibrate?.([200, 100, 200]);
    onExit();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const move = () => {
      const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= grid || h.y >= grid) {
        vibrateAndExit();
        return;
      }

      snake.unshift(h);
      if (h.x === food.x && h.y === food.y) {
        food = { x: Math.random()*20|0, y: Math.random()*20|0 };
      } else snake.pop();

      ctx.clearRect(0, 0, 400, 400);
      ctx.fillStyle = "#0f0";
      snake.forEach(s => ctx.fillRect(s.x*size, s.y*size, size-2, size-2));
      ctx.fillStyle = "#f00";
      ctx.fillRect(food.x*size, food.y*size, size-2, size-2);
    };

    const interval = setInterval(move, speed);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now()-start)/MAX_TIME)*100);
      setProgress(pct);
      if (pct === 0) vibrateAndExit();
    }, 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const k = e => {
      if (e.key === "ArrowUp") dir={x:0,y:-1};
      if (e.key === "ArrowDown") dir={x:0,y:1};
      if (e.key === "ArrowLeft") dir={x:-1,y:0};
      if (e.key === "ArrowRight") dir={x:1,y:0};
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  function touchStartHandler(e) {
    const t = e.touches[0];
    touchStart.current={x:t.clientX,y:t.clientY};
  }
  function touchEndHandler(e) {
    const t=e.changedTouches[0];
    const dx=t.clientX-touchStart.current.x;
    const dy=t.clientY-touchStart.current.y;
    if (Math.abs(dx)>Math.abs(dy)) dir={x:dx>0?1:-1,y:0};
    else dir={x:0,y:dy>0?1:-1};
  }

  return (
    <div style={{textAlign:"center",color:"#fff",padding:16}}>
      <div style={{background:"#222",height:6,borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${progress}%`,height:"100%",background:"#0f0"}}/>
      </div>
      <canvas ref={canvasRef} width={400} height={400}
        onTouchStart={touchStartHandler}
        onTouchEnd={touchEndHandler}
        style={{touchAction:"none",marginTop:12}}
      />
      <button onClick={vibrateAndExit} style={{marginTop:12}}>Exit</button>
    </div>
  );
}
