import React,{useState,useEffect} from "react";
import Snake from "./Snake.jsx";

const MIN=10*60;

export default function App(){
  const [tasks,setTasks]=useState([]);
  const [active,setActive]=useState(null);
  const [text,setText]=useState("");
  const [repeat,setRepeat]=useState(false);
  const [h,setH]=useState(0);
  const [m,setM]=useState(30);
  const [t,setT]=useState(0);
  const [run,setRun]=useState(false);
  const [streak,setStreak]=useState(0);
  const [week,setWeek]=useState({done:0,quit:0});
  const [snake,setSnake]=useState(false);
  const [play,setPlay]=useState(false);

  useEffect(()=>{const s=JSON.parse(localStorage.getItem("mbt"));
    if(s){setTasks(s.tasks||[]);setStreak(s.streak||0);setWeek(s.week||week);}
  },[]);
  useEffect(()=>localStorage.setItem("mbt",JSON.stringify({tasks,streak,week})),[tasks,streak,week]);

  useEffect(()=>{
    if(!run||t<=0)return;
    const i=setInterval(()=>setT(x=>x-1),1000);
    return()=>clearInterval(i);
  },[run,t]);

  function start(){
    const sec=h*3600+m*60;
    if(sec<MIN)return alert("Minimum 10 minutes");
    setT(sec);setRun(true);
  }

  function add(){
    if(!text)return;
    setTasks([...tasks,{id:Date.now(),text,done:false,repeat}]);
    setText("");setRepeat(false);
  }

  function done(){
    setTasks(tasks.map(x=>x.id===active?{...x,done:true}:x));
    setStreak(s=>s+1);
    setWeek(w=>({...w,done:w.done+1}));
    setSnake(true);
    reset();
  }

  function quit(){
    setWeek(w=>({...w,quit:w.quit+1}));
    setStreak(s=>Math.max(0,s-1));
    reset();
  }

  function reset(){setActive(null);setRun(false);setT(0);}

  if(play)return<Snake onExit={()=>{setPlay(false);setSnake(false)}}/>;

  return(
    <div style={{maxWidth:420,margin:"0 auto",padding:16,color:"#fff"}}>
      <h2>🐵 Monkey Brain Trainer</h2>
      <input value={text} onChange={e=>setText(e.target.value)} placeholder="Task"/>
      <label><input type="checkbox" checked={repeat} onChange={()=>setRepeat(!repeat)}/> Daily</label>
      <button onClick={add}>Add</button>

      {tasks.map(t=>(
        <div key={t.id}>
          <p>{t.text}</p>
          {!t.done&&<button onClick={()=>setActive(t.id)}>Start</button>}
        </div>
      ))}

      {active&&(
        <>
          <input type="number" value={h} onChange={e=>setH(+e.target.value)}/>h
          <input type="number" value={m} onChange={e=>setM(+e.target.value)}/>m
          {!run&&<button onClick={start}>Start</button>}
          {t===0&&!run&&<>
            <button onClick={done}>Complete</button>
            <button onClick={quit}>Quit</button>
          </>}
        </>
      )}

      <p>🔥 Streak {streak}</p>
      <p>📊 {week.done}✅ {week.quit}❌</p>

      <button disabled={!snake} onClick={()=>snake&&setPlay(true)}>
        🐍 Snake {snake?"":"(locked)"}
      </button>
    </div>
  );
}
