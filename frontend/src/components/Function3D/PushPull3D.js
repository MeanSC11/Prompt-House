// src/components/Function3D/PushPull3D.js
import * as THREE from "three";

export function createPushPull3D({
  scene,
  camera,
  renderer,
  raycaster,
  mouse,
  objectsRef,
}) {
  const HEIGHT_SCALE = 0.02; // world units ต่อ 1px การลากเม้าส์
  const HEIGHT_STEP = 0.1;   // snap ทีละ 0.1
  const MIN_HEIGHT = 0.01;

  let isDragging = false;
  let activeFace = null;
  let startMouseY = 0;
  let previewMesh = null;

  // ---------------- helper: หา face จาก event ----------------
  function pickFace(evt) {
    const selectable = objectsRef.current.selectable || [];
    if (!selectable.length) return null;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(selectable, true);
    if (!hits.length) return null;

    // เดินทีละ hit จนกว่าจะเจอ object ที่เป็น face จริง ๆ
    for (const hit of hits) {
      let obj = hit.object;
      while (obj && !selectable.includes(obj)) {
        obj = obj.parent;
      }
      if (obj && obj.userData && obj.userData.isFace) {
        return obj;
      }
    }

    return null;
  }

  // ---------------- helper: สร้าง prism จาก face + height ----------------
  function makePrismFromFace(face, height, materialOptions = {}) {
    const contour = face.userData && face.userData.contour;
    if (!contour || contour.length < 3) return null;

    const base =
      (face.userData && face.userData.base && face.userData.base.clone()) ||
      contour[0].clone();

    const shape = new THREE.Shape(
      contour.map((p) => new THREE.Vector2(p.x - base.x, -(p.z - base.z)))
    );

    const h = Math.max(MIN_HEIGHT, Math.abs(height));

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h,          // extrude ตาม local Z
      bevelEnabled: false,
      steps: 1,
    });

    const mat = new THREE.MeshStandardMaterial({
      color:
        face.material && face.material.color
          ? face.material.color.clone()
          : new THREE.Color(0xffffff),
      roughness: 0.9,
      metalness: 0.05,
      ...materialOptions,
    });

    const mesh = new THREE.Mesh(geo, mat);
    // ทำให้ local Z (extrude) ไปทิศ world Y
    mesh.rotation.x = -Math.PI / 2;

    // ดันขึ้น/ลงตามทิศที่ลาก (บน/ล่าง)
    const sign = height >= 0 ? 1 : -1;
    mesh.position.set(base.x, 0.01 + (sign > 0 ? 0 : -h), base.z);

    mesh.castShadow = true;
    mesh.receiveShadow = false;

    return mesh;
  }

  function clearPreview() {
    if (previewMesh) {
      scene.remove(previewMesh);
      previewMesh.geometry.dispose();
      previewMesh.material.dispose();
      previewMesh = null;
    }
  }

  function computeHeight(evt) {
    const dy = startMouseY - evt.clientY; // เม้าส์ขึ้น = สูงขึ้น
    const raw = dy * HEIGHT_SCALE;
    return Math.round(raw / HEIGHT_STEP) * HEIGHT_STEP;
  }

  // ---------------- handlers ----------------
  function onMouseDownPushPull(evt) {
    if (evt.button !== 0) return; // left only

    const face = pickFace(evt);
    if (!face) return;

    activeFace = face;
    isDragging = true;
    startMouseY = evt.clientY;
    clearPreview();

    // ไฮไลต์ face ที่กำลังจะดึง (ประมาณจุดฟ้า ๆ ใน sketchup)
    if (!activeFace.userData.pushPullOriginalMaterial) {
      activeFace.userData.pushPullOriginalMaterial = activeFace.material;
    }
    activeFace.material = activeFace.material.clone();
    activeFace.material.color.offsetHSL(0, -0.1, 0.1);
  }

  function onMouseMovePushPull(evt) {
    if (!isDragging || !activeFace) return;

    const h = computeHeight(evt);
    if (Math.abs(h) < MIN_HEIGHT) {
      clearPreview();
      return;
    }

    clearPreview();

    // preview โปร่ง ๆ ให้เห็นปริมาตรที่จะเกิดขึ้น
    const prism = makePrismFromFace(activeFace, h, {
      transparent: true,
      opacity: 0.35,
    });

    if (prism) {
      previewMesh = prism;
      scene.add(previewMesh);
    }
  }

  function onMouseUpPushPull(evt) {
    if (!isDragging || !activeFace) return;

    const h = computeHeight(evt);
    isDragging = false;

    clearPreview();

    // คืน material เดิมให้ face ถ้ายังอยู่
    if (
      activeFace &&
      activeFace.userData &&
      activeFace.userData.pushPullOriginalMaterial
    ) {
      activeFace.material = activeFace.userData.pushPullOriginalMaterial;
      delete activeFace.userData.pushPullOriginalMaterial;
    }

    if (Math.abs(h) < MIN_HEIGHT) {
      activeFace = null;
      return;
    }

    const prism = makePrismFromFace(activeFace, h);
    if (prism) {
      scene.add(prism);
      objectsRef.current.placed.push(prism);
      objectsRef.current.selectable.push(prism);

      // เอา face เดิมออก กัน z-fighting
      const placed = objectsRef.current.placed;
      const selectable = objectsRef.current.selectable;

      scene.remove(activeFace);
      objectsRef.current.placed = placed.filter((o) => o !== activeFace);
      objectsRef.current.selectable = selectable.filter(
        (o) => o !== activeFace
      );
    }

    activeFace = null;
  }

  function cleanupPushPull3D() {
    clearPreview();
    isDragging = false;

    if (
      activeFace &&
      activeFace.userData &&
      activeFace.userData.pushPullOriginalMaterial
    ) {
      activeFace.material = activeFace.userData.pushPullOriginalMaterial;
      delete activeFace.userData.pushPullOriginalMaterial;
    }

    activeFace = null;
  }

  return {
    onMouseDownPushPull,
    onMouseMovePushPull,
    onMouseUpPushPull,
    cleanupPushPull3D,
  };
}