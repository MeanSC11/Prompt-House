// src/components/Function3D/Mouse3D.js
import * as THREE from "three";

/**
 * จัดการเรื่อง selection (tool: select)
 *  - click เลือก object เดียว
 *  - drag box เลือกหลายอัน
 *  - highlight / clearSelection
 *  - สร้าง / ลบ selectionBox DOM
 */
export function createMouse3D({
  renderer,
  camera,
  raycaster,
  mouse,
  objectsRef,
  selectionRef,
  host,
}) {
  // ---------- DOM กล่องสี่เหลี่ยมเลือก ----------
  const selectionBox = document.createElement("div");
  selectionBox.style.position = "absolute";
  selectionBox.style.border = "1px dashed #2563eb";
  selectionBox.style.background = "rgba(37,99,235,0.08)";
  selectionBox.style.pointerEvents = "none";
  selectionBox.style.display = "none";

  // ให้ host เป็น position:relative เพื่อให้กล่องวางทับ canvas ได้
  if (host && host.style) {
    if (host.style.position === "" || host.style.position === "static") {
      host.style.position = "relative";
    }
    host.appendChild(selectionBox);
  }

  let isDragging = false;
  let dragStart = null;

  // ---------- helper ภายใน ----------
  function clearSelection() {
    selectionRef.current.forEach((obj) => {
      if (obj.userData.baseColor) {
        obj.material.color.copy(obj.userData.baseColor);
      }
    });
    selectionRef.current = [];
  }

  function highlight(obj) {
    if (!obj.userData.baseColor) {
      obj.userData.baseColor = obj.material.color.clone();
    }
    obj.material.color.set(0x0077ff);
  }

  function selectSingle(evt) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(
      objectsRef.current.selectable,
      true
    );

    clearSelection();

    if (hits.length > 0) {
      const target = hits[0].object;
      highlight(target);
      selectionRef.current = [target];
    }
  }

  function selectByRectangle(start, end) {
    const rect = renderer.domElement.getBoundingClientRect();

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    clearSelection();

    const selected = [];
    const v = new THREE.Vector3();
    const screenPos = new THREE.Vector2();

    objectsRef.current.selectable.forEach((obj) => {
      obj.getWorldPosition(v);
      v.project(camera);

      // NDC -> screen
      screenPos.x = (v.x * 0.5 + 0.5) * rect.width;
      screenPos.y = (-v.y * 0.5 + 0.5) * rect.height;

      if (
        screenPos.x >= minX &&
        screenPos.x <= maxX &&
        screenPos.y >= minY &&
        screenPos.y <= maxY
      ) {
        highlight(obj);
        selected.push(obj);
      }
    });

    selectionRef.current = selected;
  }

  // ---------- event handler ที่ Canvas3D จะเรียก ----------
  function onMouseDownSelect(evt) {
    if (evt.button !== 0) return; // ซ้ายเท่านั้น

    const rect = renderer.domElement.getBoundingClientRect();
    dragStart = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
    isDragging = true;
  }

  function onMouseMoveSelect(evt) {
    if (!isDragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const current = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };

    const minX = Math.min(dragStart.x, current.x);
    const maxX = Math.max(dragStart.x, current.x);
    const minY = Math.min(dragStart.y, current.y);
    const maxY = Math.max(dragStart.y, current.y);

    selectionBox.style.display = "block";
    selectionBox.style.left = `${minX}px`;
    selectionBox.style.top = `${minY}px`;
    selectionBox.style.width = `${maxX - minX}px`;
    selectionBox.style.height = `${maxY - minY}px`;
  }

  function onMouseUpSelect(evt) {
    if (!isDragging) return;
    isDragging = false;
    selectionBox.style.display = "none";

    const rect = renderer.domElement.getBoundingClientRect();
    const end = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };

    const dx = end.x - dragStart.x;
    const dy = end.y - dragStart.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      // click เดียว
      selectSingle(evt);
    } else {
      // ลากครอบ
      selectByRectangle(dragStart, end);
    }
  }

  function cleanupMouse3D() {
    clearSelection();
    if (selectionBox && selectionBox.parentNode === host) {
      host.removeChild(selectionBox);
    }
  }

  return {
    onMouseDownSelect,
    onMouseMoveSelect,
    onMouseUpSelect,
    cleanupMouse3D,
  };
}