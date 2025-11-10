export default function Toolbelt({ tool, setTool }) {
  const tools = [
    { key:"select", icon:"🖱️" },
    { key:"erase",  icon:"🧹" },
    { key:"draw",   icon:"✏️" },
    { action:"undo", icon:"↩️" },
    { action:"redo", icon:"↪️" },
    { action:"more", icon:"⋯" }
  ];
  const click = t => {
    if (t.action)
      window.dispatchEvent(new CustomEvent("ph:toolbar", { detail: t.action }));
    else setTool(t.key);
  };
  return (
    <div style={{
      position:"fixed", 
      left:12, 
      right:12, 
      bottom:12,
      background:"#fff", 
      border:"1px solid #e5e7eb", 
      borderRadius:16, 
      padding:6,
      display:"flex", 
      gap:8, 
      justifyContent:"center",
      boxShadow:"0 10px 24px rgba(15,23,42,.06)"
    }}>
      {tools.map((t,i)=>(
        <button key={i} onClick={()=>click(t)} title={t.key||t.action}
          style={{
            border:0, 
            background:"#eaf2f8", 
            borderRadius:12, 
            padding:"10px 12px",
            fontSize:18, 
            outline:(t.key && t.key===tool)?"2px solid #2563eb":"none"
          }}>
          {t.icon}
        </button>
      ))}
    </div>
  );
}