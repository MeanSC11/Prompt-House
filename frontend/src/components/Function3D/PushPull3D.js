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
  const HEIGHT_SCALE = 0.02;
  const HEIGHT_STEP = 0.1;
  const MIN_HEIGHT = 0.01;

  let isDragging = false;
  let activeFace = null;
  let startMouseY = 0;
  let previewMesh = null;

  function pickFace(evt) {
    const selectable = objectsRef.current.selectable || [];
    if (!selectable.length) return null;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(selectable, true);
    if (!hits.length) return null;

    let obj = hits[0].object;
    while (obj && !selectable.includes(obj)) obj = obj.parent;
    if (!obj || !obj.userData?.isFace) return null;

    return obj;
  }

  function makePrismFromFace(face, height, materialOptions = {}) {
    const contour = face.userData?.contour;
    if (!contour || contour.length < 3) return null;

    const base = face.userData?.base || contour[0];
    const shape = new THREE.Shape(
      contour.map((p) => new THREE.Vector2(p.x - base.x, -(p.z - base.z)))
    );

    const h = Math.max(MIN_HEIGHT, Math.abs(height));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: h,
      bevelEnabled: false,
      steps: 1,
    });

    const mat = new THREE.MeshStandardMaterial({
      color:
        face.material?.color?.clone() || new THREE.Color(0xffffff),
      roughness: 0.9,
      metalness: 0.05,
      ...materialOptions,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(base.x, 0.01, base.z);
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
    const dy = startMouseY - evt.clientY;
    const raw = dy * HEIGHT_SCALE;
    return Math.round(raw / HEIGHT_STEP) * HEIGHT_STEP;
  }

  function onMouseDownPushPull(evt) {
    if (evt.button !== 0) return;
    const face = pickFace(evt);
    if (!face) return;

    activeFace = face;
    isDragging = true;
    startMouseY = evt.clientY;
    clearPreview();
  }

  function onMouseMovePushPull(evt) {
    if (!isDragging || !activeFace) return;

    const h = computeHeight(evt);
    if (Math.abs(h) < MIN_HEIGHT) {
      clearPreview();
      return;
    }

    clearPreview();
    const prism = makePrismFromFace(activeFace, h, {
      transparent: true,
      opacity: 0.6,
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

    if (Math.abs(h) < MIN_HEIGHT) {
      activeFace = null;
      return;
    }

    const prism = makePrismFromFace(activeFace, h);
    if (prism) {
      scene.add(prism);
      objectsRef.current.placed.push(prism);
      objectsRef.current.selectable.push(prism);

      // remove old face
      scene.remove(activeFace);
      objectsRef.current.placed = objectsRef.current.placed.filter(
        (o) => o !== activeFace
      );
      objectsRef.current.selectable =
        objectsRef.current.selectable.filter((o) => o !== activeFace);
    }

    activeFace = null;
  }

  function cleanupPushPull3D() {
    clearPreview();
    isDragging = false;
    activeFace = null;
  }

  return {
    onMouseDownPushPull,
    onMouseMovePushPull,
    onMouseUpPushPull,
    cleanupPushPull3D,
  };
}