// src/components/Function3D/Draw3D.js
import * as THREE from "three";

export function createDraw3D({
  scene,
  camera,
  renderer,
  raycaster,
  mouse,
  guideLineRef,
  objectsRef,
  snapPointsRef,
}) {
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  const CLOSE_EPS = 0.25;                       // ระยะถือว่ากลับมาจุดเริ่ม
  const SNAP_ANGLE = (5 * Math.PI) / 180;      // 5° สำหรับ snap มุม
  const MIN_SEG_LEN = 0.01;                    // ยาวน้อยกว่านี้ถือว่าไม่สร้างเส้น
  const LENGTH_SNAP_FACTOR = 0.15;             // 15% ของความยาวเส้นแรก (from-point)
  const LENGTH_LOCK_FACTOR = 0.08;             // ล็อคความยาวเส้น ~8%

  let drawPath = [];
  let previewLine = null;

  // เส้นช่วย "From Point" สำหรับทำสี่เหลี่ยมให้ด้านตรงข้ามเท่ากัน
  let fromPointLine = null;
  (() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(0, 0.01, 0),
    ]);
    const mat = new THREE.LineDashedMaterial({
      color: 0x22c55e, // เขียวอ่อน
      dashSize: 0.3,
      gapSize: 0.18,
    });
    fromPointLine = new THREE.Line(geo, mat);
    fromPointLine.computeLineDistances();
    fromPointLine.visible = false;
    scene.add(fromPointLine);
  })();

  // ---------- core: คำนวณจุดบนพื้น + snap / guide ต่าง ๆ ----------
  function getGroundPoint(evt) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, point);
    point.y = 0;

    // ซ่อน guide ก่อนทุกครั้ง
    if (guideLineRef.current) {
      guideLineRef.current.visible = false;
    }
    if (fromPointLine) {
      fromPointLine.visible = false;
    }

    // ---------- snap ตามเส้นก่อนหน้า + มุมฉาก + แกน X/Z ----------
    if (drawPath.length > 0) {
      const last = drawPath[drawPath.length - 1];
      const dir = new THREE.Vector2(point.x - last.x, point.z - last.z);
      const dirLen = dir.length();

      if (dirLen > 1e-4) {
        const dirNorm = dir.clone().divideScalar(dirLen);
        const candidates = [];

        // แนวเส้นก่อนหน้า + มุมฉากกับเส้นก่อนหน้า
        if (drawPath.length >= 2) {
          const prev = drawPath[drawPath.length - 2];
          const prevDir = new THREE.Vector2(last.x - prev.x, last.z - prev.z);
          const prevLen = prevDir.length();
          if (prevLen > 1e-4) {
            const prevNorm = prevDir.clone().divideScalar(prevLen);
            const cand0 = prevNorm.clone();
            const cand90 = prevNorm
              .clone()
              .rotateAround(new THREE.Vector2(0, 0), Math.PI / 2);
            const candN90 = prevNorm
              .clone()
              .rotateAround(new THREE.Vector2(0, 0), -Math.PI / 2);
            candidates.push(cand0, cand90, candN90);
          }
        }

        // แกนโลก X (แดง) / Z (เขียว)
        const axisX = new THREE.Vector2(1, 0);
        const axisZ = new THREE.Vector2(0, 1);
        candidates.push(
          axisX,
          axisX.clone().negate(),
          axisZ,
          axisZ.clone().negate()
        );

        let bestDir = null;
        let bestAngle = Infinity;

        for (const c of candidates) {
          const dot = THREE.MathUtils.clamp(
            dirNorm.x * c.x + dirNorm.y * c.y,
            -1,
            1
          );
          const angle = Math.acos(dot);
          if (angle < bestAngle) {
            bestAngle = angle;
            bestDir = c;
          }
        }

        if (bestDir && bestAngle < SNAP_ANGLE) {
          const projLen = dir.x * bestDir.x + dir.y * bestDir.y;
          const snapped2D = new THREE.Vector2(
            last.x + bestDir.x * projLen,
            last.z + bestDir.y * projLen
          );

          point.x = snapped2D.x;
          point.z = snapped2D.y;

          // guide line จาก last → point
          if (guideLineRef.current) {
            const pos =
              guideLineRef.current.geometry.attributes.position.array;

            pos[0] = last.x;
            pos[1] = 0.01;
            pos[2] = last.z;

            pos[3] = point.x;
            pos[4] = 0.01;
            pos[5] = point.z;

            guideLineRef.current.geometry.attributes.position.needsUpdate =
              true;
            guideLineRef.current.computeLineDistances();
            guideLineRef.current.visible = true;
          }
        }

        // ----- length lock: ถ้าเส้นใหม่ยาวเกือบเท่าด้านแรก ให้ snap ความยาว -----
        if (drawPath.length >= 2) {
          const p0 = drawPath[0];
          const p1 = drawPath[1];
          const baseVec = new THREE.Vector2(p1.x - p0.x, p1.z - p0.z);
          const baseLen = baseVec.length();

          if (baseLen > 1e-3) {
            const lastSegStart = drawPath[drawPath.length - 1];
            const currVec = new THREE.Vector2(
              point.x - lastSegStart.x,
              point.z - lastSegStart.z
            );
            const currLen = currVec.length();

            if (currLen > 1e-4) {
              const diff = Math.abs(currLen - baseLen);
              // ถ้าความต่างน้อยกว่า ~8% ของเส้นแรก → ล็อคความยาวให้เท่ากัน
              if (diff < baseLen * LENGTH_LOCK_FACTOR) {
                const scale = baseLen / currLen;
                currVec.multiplyScalar(scale);
                point.x = lastSegStart.x + currVec.x;
                point.z = lastSegStart.z + currVec.y;
              }
            }
          }
        }
      }
    }

    // ---------- From-Point helper สำหรับทำสี่เหลี่ยม ----------
    if (drawPath.length >= 3) {
      const p0 = drawPath[0];
      const p1 = drawPath[1];
      const last = drawPath[drawPath.length - 1]; // จุดก่อนหน้าตัวที่กำลังลาก

      const v01 = new THREE.Vector2(p1.x - p0.x, p1.z - p0.z);
      const len01 = v01.length();

      if (len01 > 1e-4) {
        // candidate จุดที่ทำให้ด้านตรงข้ามขนานและยาวเท่าด้านแรก
        const candidate = new THREE.Vector3(
          last.x + v01.x,
          0,
          last.z + v01.y
        );

        const dist = candidate.distanceTo(point);
        const tol = Math.max(0.1, len01 * LENGTH_SNAP_FACTOR);

        if (dist < tol) {
          point.copy(candidate);
        }

        // วาดเส้นช่วยจากจุดแรก → จุดปัจจุบัน (สไตล์ From Point)
        if (fromPointLine) {
          const pos = fromPointLine.geometry.attributes.position.array;
          pos[0] = p0.x;
          pos[1] = 0.01;
          pos[2] = p0.z;

          pos[3] = point.x;
          pos[4] = 0.01;
          pos[5] = point.z;

          fromPointLine.geometry.attributes.position.needsUpdate = true;
          fromPointLine.computeLineDistances();
          fromPointLine.visible = true;
        }
      }
    }

    return point;
  }

  // ---------- geometry helper ----------
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

  function addFaceFromPath(path) {
    if (path.length < 3) return;

    const base = path[0];

    const shape = new THREE.Shape(
      path.map((p) => new THREE.Vector2(p.x - base.x, -(p.z - base.z)))
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

  // ---------- preview line ----------
  function clearPreviewLine() {
    if (previewLine) {
      scene.remove(previewLine);
      previewLine.geometry.dispose();
      previewLine.material.dispose();
      previewLine = null;
    }
  }

  function updatePreviewLine(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      from.clone().setY(0.01),
      to.clone().setY(0.01),
    ]);

    if (!previewLine) {
      const mat = new THREE.LineDashedMaterial({
        color: 0x03045e,
      });
      previewLine = new THREE.Line(geo, mat);
      scene.add(previewLine);
    } else {
      previewLine.geometry.dispose();
      previewLine.geometry = geo;
    }
  }

  // ---------- handler ที่ Canvas3D ใช้ ----------
  function onCanvasClickDraw(evt) {
    const p = getGroundPoint(evt);

    if (drawPath.length === 0) {
      // จุดแรก
      drawPath.push(p.clone());
      snapPointsRef.current.push(p.clone());
      clearPreviewLine();
      return;
    }

    const last = drawPath[drawPath.length - 1];
    const first = drawPath[0];

    // ปิดรูปถ้าคลิกกลับมาใกล้จุดแรก
    if (p.distanceTo(first) < CLOSE_EPS && drawPath.length >= 3) {
      addEdge(last, first);
      drawPath.push(first.clone());
      addFaceFromPath(drawPath);
      drawPath = [];
      clearPreviewLine();
      if (fromPointLine) fromPointLine.visible = false;
      return;
    }

    // ไม่สร้าง segment ถ้าแทบไม่ขยับ
    if (last.distanceTo(p) < MIN_SEG_LEN) return;

    addEdge(last, p);
    drawPath.push(p.clone());
    snapPointsRef.current.push(p.clone());
    clearPreviewLine();
    if (fromPointLine) fromPointLine.visible = false;
  }

  function onMouseMoveDraw(evt) {
    if (drawPath.length === 0) return;
    const last = drawPath[drawPath.length - 1];
    const p = getGroundPoint(evt);
    updatePreviewLine(last, p);
  }

  function cleanupDraw3D() {
    clearPreviewLine();
    drawPath = [];
    if (fromPointLine) {
      scene.remove(fromPointLine);
      fromPointLine.geometry.dispose();
      fromPointLine.material.dispose();
      fromPointLine = null;
    }
  }

  return {
    onCanvasClickDraw,
    onMouseMoveDraw,
    cleanupDraw3D,
  };
}
