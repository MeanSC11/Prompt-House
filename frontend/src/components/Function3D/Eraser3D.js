// src/components/Function3D/Eraser3D.js
import * as THREE from "three";

export function createEraser3D({
  scene,
  camera,
  renderer,
  raycaster,
  mouse,
  objectsRef,
}) {
  let isErasing = false;

  // เก็บ object ที่โดนลากผ่านในรอบการลบครั้งนี้
  const pendingDelete = new Set();

  const highlightColor = new THREE.Color(0xffd54f); // เหลืองเตือนว่าจะโดนลบ

  // ---- ช่วยหา object ที่จะลบจาก event เมาส์ ----
  function pickObjectAtEvent(evt) {
    const placed = objectsRef.current.placed;
    if (!placed || placed.length === 0) return null;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(placed, true);
    if (!hits.length) return null;

    let target = hits[0].object;

    // ไต่ขึ้น parent จนเจอ object ที่อยู่ใน placed
    while (target && !placed.includes(target)) {
      target = target.parent;
    }
    return target || null;
  }

  // ---- ทำให้ object กลายเป็น “กำลังจะถูกลบ” (เปลี่ยนสีเหลือง + เก็บไว้ใน set) ----
  function markForDelete(obj) {
    if (!obj || pendingDelete.has(obj)) return;
    if (!obj.material || !obj.material.color) return;

    if (!obj.userData.eraserOriginalColor) {
      obj.userData.eraserOriginalColor = obj.material.color.clone();
    }
    obj.material.color.copy(highlightColor);
    pendingDelete.add(obj);
  }

  // ---- ลบทุก object ที่โดน mark ----
  function flushDelete() {
    if (!pendingDelete.size) return;

    const placed = objectsRef.current.placed || [];
    const selectable = objectsRef.current.selectable || [];

    pendingDelete.forEach((obj) => {
      // เอาออกจาก scene
      if (obj.parent) {
        obj.parent.remove(obj);
      } else {
        scene.remove(obj);
      }

      // เอาออกจาก array ต่าง ๆ
      objectsRef.current.placed = placed.filter((o) => o !== obj);
      objectsRef.current.selectable = selectable.filter((o) => o !== obj);

      // ไม่ต้องคืนสีเพราะลบออกไปแล้ว
    });

    pendingDelete.clear();
  }

  // ---- handlers ที่ Canvas3D เรียกใช้ ----
  function onMouseDownEraser(evt) {
    if (evt.button !== 0) return; // ซ้ายเท่านั้น
    isErasing = true;
    pendingDelete.clear(); // เริ่มรอบใหม่
  }

  function onMouseMoveEraser(evt) {
    if (!isErasing) return;
    const obj = pickObjectAtEvent(evt);
    if (obj) {
      markForDelete(obj); // แค่ mark (เปลี่ยนเป็นสีเหลือง) ยังไม่ลบ
    }
  }

  function onMouseUpEraser(evt) {
    if (!isErasing) return;
    isErasing = false;

    // เผื่อกรณีคลิกเฉย ๆ แล้วยังไม่เคยลากผ่าน object เลย
    const obj = pickObjectAtEvent(evt);
    if (obj) {
      markForDelete(obj);
    }

    // ปล่อยเม้าส์ทีเดียว ลบทุกเส้น/face ที่เคยโดนลากผ่านในรอบนี้
    flushDelete();
  }

  function cleanupEraser3D() {
    // ถ้ามีค้างอยู่แล้วยังไม่ลบ ให้คืนสีเดิมแล้วเคลียร์
    pendingDelete.forEach((obj) => {
      if (
        obj.material &&
        obj.material.color &&
        obj.userData.eraserOriginalColor
      ) {
        obj.material.color.copy(obj.userData.eraserOriginalColor);
      }
    });
    pendingDelete.clear();
    isErasing = false;
  }

  return {
    onMouseDownEraser,
    onMouseMoveEraser,
    onMouseUpEraser,
    cleanupEraser3D,
  };
}