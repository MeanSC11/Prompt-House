// src/components/Function3D/Rectangle3D.js
import * as THREE from "three";

export function createRectangle3D({
  scene,
  camera,
  renderer,
  raycaster,
  mouse,
  objectsRef,
}) {
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const MIN_SIZE = 0.02; // ถ้าเล็กกว่านี้ถือว่าไม่ได้วาด
  const SQUARE_TOLERANCE = 0.08; // ต่างกันไม่เกิน 8% ถือว่าเป็นจตุรัส

  let isDrawing = false;
  let startPoint = null;

  let previewLine = null;   // เส้นรอบสี่เหลี่ยม (LineLoop)
  let previewDiag = null;   // เส้นทแยงสำหรับกรณีจตุรัส

  // ---------- helper: world point บนพื้นจาก event ----------
  function getGroundPoint(evt) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const p = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, p);
    p.y = 0;
    return p;
  }

  // ---------- helper: สร้าง/อัปเดต preview ----------
  function ensurePreviewObjects() {
    if (!previewLine) {
      const geo = new THREE.BufferGeometry();
      // 5 จุดปิด loop: p0,p1,p2,p3,p0
      const pos = new Float32Array(5 * 3);
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x1d4ed8 });
      previewLine = new THREE.LineLoop(geo, mat);
      scene.add(previewLine);
    }

    if (!previewDiag) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(2 * 3);
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineDashedMaterial({
        color: 0x1d4ed8,
        dashSize: 0.25,
        gapSize: 0.15,
      });
      previewDiag = new THREE.Line(geo, mat);
      previewDiag.computeLineDistances();
      previewDiag.visible = false;
      scene.add(previewDiag);
    }
  }

  function updatePreview(p0, p1, p2, p3, isSquare) {
    ensurePreviewObjects();

    // อัปเดตเส้นรอบสี่เหลี่ยม
    const pos = previewLine.geometry.attributes.position.array;
    // p0
    pos[0] = p0.x; pos[1] = 0.01; pos[2] = p0.z;
    // p1
    pos[3] = p1.x; pos[4] = 0.01; pos[5] = p1.z;
    // p2
    pos[6] = p2.x; pos[7] = 0.01; pos[8] = p2.z;
    // p3
    pos[9]  = p3.x; pos[10] = 0.01; pos[11] = p3.z;
    // กลับมาที่ p0
    pos[12] = p0.x; pos[13] = 0.01; pos[14] = p0.z;

    previewLine.geometry.attributes.position.needsUpdate = true;
    previewLine.visible = true;

    // อัปเดตเส้นทแยงเฉพาะกรณีจตุรัส
    if (previewDiag) {
      const dpos = previewDiag.geometry.attributes.position.array;
      dpos[0] = p0.x; dpos[1] = 0.01; dpos[2] = p0.z;
      dpos[3] = p2.x; dpos[4] = 0.01; dpos[5] = p2.z;
      previewDiag.geometry.attributes.position.needsUpdate = true;
      previewDiag.computeLineDistances();
      previewDiag.visible = !!isSquare;
    }
  }

  function clearPreview() {
    if (previewLine) {
      scene.remove(previewLine);
      previewLine.geometry.dispose();
      previewLine.material.dispose();
      previewLine = null;
    }
    if (previewDiag) {
      scene.remove(previewDiag);
      previewDiag.geometry.dispose();
      previewDiag.material.dispose();
      previewDiag = null;
    }
  }

  // ---------- helper: สร้าง geometry จริง ----------
  function addEdge(a, b, color = 0x03045e) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      a.clone().setY(0.01),
      b.clone().setY(0.01),
    ]);
    const mat = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    objectsRef.current.placed.push(line);
    objectsRef.current.selectable.push(line);
  }

  function addFaceFromCorners(corners) {
    // corners: [p0,p1,p2,p3] ตามเข็ม/ทวนเข็ม
    const base = corners[0];
    const shape = new THREE.Shape(
      corners.map((p) => new THREE.Vector2(p.x - base.x, -(p.z - base.z)))
    );

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.05,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(base.x, 0.01, base.z);
    scene.add(mesh);

    objectsRef.current.placed.push(mesh);
    objectsRef.current.selectable.push(mesh);
  }

  // ---------- handlers ที่ Canvas3D เรียก ----------
  function onMouseDownRectangle(evt) {
    if (evt.button !== 0) return; // left only
    isDrawing = true;
    startPoint = getGroundPoint(evt);
  }

  function onMouseMoveRectangle(evt) {
    if (!isDrawing || !startPoint) return;

    const current = getGroundPoint(evt);

    let dx = current.x - startPoint.x;
    let dz = current.z - startPoint.z;

    // ถ้ามันเล็กมากก็ยังไม่ต้องโชว์อะไร
    if (Math.abs(dx) < MIN_SIZE && Math.abs(dz) < MIN_SIZE) return;

    // snap ให้เป็นจตุรัสถ้าด้านใกล้เคียงกันพอ
    const absDx = Math.abs(dx);
    const absDz = Math.abs(dz);
    let isSquare = false;

    const maxSide = Math.max(absDx, absDz);
    if (maxSide > MIN_SIZE) {
      const diff = Math.abs(absDx - absDz);
      if (diff < maxSide * SQUARE_TOLERANCE) {
        // snap ให้เท่ากัน
        isSquare = true;
        if (absDx > absDz) {
          dz = Math.sign(dz || 1) * absDx;
        } else {
          dx = Math.sign(dx || 1) * absDz;
        }
      }
    }

    const p0 = startPoint.clone();
    const p1 = new THREE.Vector3(startPoint.x + dx, 0, startPoint.z);
    const p2 = new THREE.Vector3(startPoint.x + dx, 0, startPoint.z + dz);
    const p3 = new THREE.Vector3(startPoint.x, 0, startPoint.z + dz);

    updatePreview(p0, p1, p2, p3, isSquare);
  }

  function onMouseUpRectangle(evt) {
    if (!isDrawing || !startPoint) return;
    isDrawing = false;

    const end = getGroundPoint(evt);

    let dx = end.x - startPoint.x;
    let dz = end.z - startPoint.z;

    const absDx = Math.abs(dx);
    const absDz = Math.abs(dz);
    if (absDx < MIN_SIZE || absDz < MIN_SIZE) {
      // เล็กเกินไป ไม่สร้างอะไร
      clearPreview();
      startPoint = null;
      return;
    }

    // snap จตุรัสอีกครั้งแบบเดียวกับตอน move
    let isSquare = false;
    const maxSide = Math.max(absDx, absDz);
    const diff = Math.abs(absDx - absDz);
    if (diff < maxSide * SQUARE_TOLERANCE) {
      isSquare = true;
      if (absDx > absDz) {
        dz = Math.sign(dz || 1) * absDx;
      } else {
        dx = Math.sign(dx || 1) * absDz;
      }
    }

    const p0 = startPoint.clone();
    const p1 = new THREE.Vector3(startPoint.x + dx, 0, startPoint.z);
    const p2 = new THREE.Vector3(startPoint.x + dx, 0, startPoint.z + dz);
    const p3 = new THREE.Vector3(startPoint.x, 0, startPoint.z + dz);
    const corners = [p0, p1, p2, p3];

    // สร้าง 4 เส้นรอบ + face
    addEdge(p0, p1);
    addEdge(p1, p2);
    addEdge(p2, p3);
    addEdge(p3, p0);
    addFaceFromCorners(corners);

    // ไม่ต้องเก็บเส้นทแยงจริง ๆ ไว้ใน scene (ตามตัวอย่าง sketchup เป็นแค่ helper)
    clearPreview();
    startPoint = null;
  }

  function cleanupRectangle3D() {
    clearPreview();
    isDrawing = false;
    startPoint = null;
  }

  return {
    onMouseDownRectangle,
    onMouseMoveRectangle,
    onMouseUpRectangle,
    cleanupRectangle3D,
  };
}