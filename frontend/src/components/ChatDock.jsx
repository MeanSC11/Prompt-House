import { useState } from "react";

export default function ChatDock(){
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const API = process.env.REACT_APP_API_BASE || "";

  const send = () => {
    if (!input.trim()) return;
    const prompt = input.trim();
    setMsgs(m=>[...m,{role:"user",text:prompt},{role:"ai",text:""}]); setInput("");

    const ev = new EventSource(`${API}/api/chat/stream?q=${encodeURIComponent(prompt)}`);
    ev.onmessage = (e)=>{
      if(e.data==="[DONE]"){ ev.close(); return; }
      setMsgs(m => {
        const last=m[m.length-1];
        if (!last || last.role!=="ai") return m;
        const c=m.slice(); c[c.length-1]={...last,text:last.text+e.data};
        return c;
      });
    };
    ev.onerror = ()=>ev.close();
  };

  return (
    <div style={{
        position:"fixed", 
        right:12, 
        top:12, 
        width:360, 
        height:420,
      background:"#fff", 
      border:"1px solid #e5e7eb", 
      borderRadius:12, 
      display:"flex", 
      flexDirection:"column"}}>
      <div style={{
        padding:10, 
        borderBottom:"1px solid #e5e7eb", 
        fontWeight:600}}>AI Chat</div>
      <div 
      style={{
        flex:1, 
        overflow:"auto", 
        padding:10, 
        display:"flex", 
        flexDirection:"column", 
        gap:8}}>
        {msgs.map((m,i)=>(
          <div key={i} 
          style={{
            alignSelf:m.role==="user"?"flex-end":"flex-start",
            background:m.role==="user"?"#e8f3ff":"#f4f6f8", 
            padding:"8px 10px", 
            borderRadius:10, 
            maxWidth:"80%"
          }}>{m.text||"…"}</div>
        ))}
      </div>
      <div style={{
        display:"flex", 
        gap:8, 
        padding:10, 
        borderTop:"1px solid #e5e7eb"}}>
        <input 
        value={input} 
        onChange={e=>setInput(e.target.value)} 
        onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Describe your house..." 
          style={{
            flex:1, 
            padding:10, 
            border:"1px solid #cfe3f6", 
            borderRadius:10}}/>
        <button 
        onClick={send} 
        style={{
            padding:"10px 14px", 
            border:0, 
            borderRadius:10, 
            background:"#1f7fd0", 
            color:"#fff"}}>Send</button>
      </div>
    </div>
  );
}