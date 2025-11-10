import React from "react";
import { LiaMousePointerSolid } from "react-icons/lia";
import { CiPen } from "react-icons/ci";
import { FaEraser } from "react-icons/fa";
import { PiRectangleDashedDuotone } from "react-icons/pi";
import { TbStackPush, TbRulerMeasure } from "react-icons/tb";
import { IoMoveSharp } from "react-icons/io5";
import { FaArrowsRotate } from "react-icons/fa6";
import { LuImageUpscale, LuOrbit, LuUndo2, LuRedo2 } from "react-icons/lu";
import { RiPaintFill, RiExpandHorizontalLine } from "react-icons/ri";
import { TfiLayoutMenuSeparated } from "react-icons/tfi";

const ICON_COLOR = "#03045E";

export default function Toolbar3D({ tool, setTool, isChatOpen }) {
  const tools = [
    {
      key: "select",
      icon: <LiaMousePointerSolid size={25} color={ICON_COLOR} />,
      title: "Select / Place marker",
    },
    {
      key: "draw",
      icon: <CiPen size={25} color={ICON_COLOR} />,
      title: "Draw wall",
    },
    {
      key: "erase",
      icon: <FaEraser size={25} color={ICON_COLOR} />,
      title: "Erase last",
    },
    {
      key: "rectangle",
      icon: <PiRectangleDashedDuotone size={25} color={ICON_COLOR} />,
      title: "Rectangle",
    },
    {
      key: "push/pull",
      icon: <TbStackPush size={25} color={ICON_COLOR} />,
      title: "push/pull",
    },
    {
      key: "move",
      icon: <IoMoveSharp size={25} color={ICON_COLOR} />,
      title: "move point",
    },
    {
      key: "rotate",
      icon: <FaArrowsRotate size={25} color={ICON_COLOR} />,
      title: "rotate 2 point",
    },
    {
      key: "scale",
      icon: <LuImageUpscale size={25} color={ICON_COLOR} />,
      title: "scale",
    },
    {
      key: "paint",
      icon: <RiPaintFill size={25} color={ICON_COLOR} />,
      title: "paint all",
    },
    {
      key: "orbit",
      icon: <LuOrbit size={25} color={ICON_COLOR} />,
      title: "orbit",
    },
    {
      key: "pan",
      icon: <RiExpandHorizontalLine size={25} color={ICON_COLOR} />,
      title: "pan camera",
    },
    {
      key: "tape measure",
      icon: <TbRulerMeasure size={25} color={ICON_COLOR} />,
      title: "tape measure",
    },
  ];

  const actions = [
    {
      action: "undo",
      icon: <LuUndo2 size={25} color={ICON_COLOR} />,
      title: "Undo",
    },
    {
      action: "redo",
      icon: <LuRedo2 size={25} color={ICON_COLOR} />,
      title: "Redo",
    },
    {
      action: "more",
      icon: <TfiLayoutMenuSeparated size={25} color={ICON_COLOR} />,
      title: "More (future tools)",
    },
  ];

  const sendToolbarEvent = (action) => {
    window.dispatchEvent(new CustomEvent("ph:toolbar", { detail: action }));
  };

  // กำหนดระยะเลื่อนตามความกว้างแชท
  // ใน MenuChat เราใช้ width: 26vw; maxWidth: 360; minWidth: 260;
  const toolbarLeft = isChatOpen ? "calc(26vw + 16px)" : "16px";

  return (
    <div
      style={{
        position: "fixed",
        left: toolbarLeft,
        right: 16,
        bottom: 16,
        padding: 8,
        borderRadius: 20,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "center",
        gap: 10,
        boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
        zIndex: 10,
        transition: "left 0.25s ease", // ให้เลื่อนนุ่ม ๆ
      }}
    >
      {/* tools */}
      {tools.map((t) => {
        const isActive = tool === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            title={t.title}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "10px 12px",
              cursor: "pointer",
              background: isActive ? "#00B4D8" : "#E0F2FE",
              boxShadow: isActive ? "0 0 0 2px #90E0EF inset" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#03045E", // เผื่อมี text
            }}
          >
            {t.icon}
          </button>
        );
      })}

      {/* spacer */}
      <div style={{ width: 24 }} />

      {/* actions */}
      {actions.map((a) => (
        <button
          key={a.action}
          onClick={() => sendToolbarEvent(a.action)}
          title={a.title}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "10px 12px",
            cursor: "pointer",
            background: "#E0F2FE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#03045E",
          }}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
}
