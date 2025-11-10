// src/components/Canvas3D.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMouse3D } from "./Function3D/Mouse3D";
import { createDraw3D } from "./Function3D/Draw3D";
import { createEraser3D } from "./Function3D/Eraser3D";
import { createRectangle3D } from "./Function3D/Rectangle3D";
import { createPushPull3D } from "./Function3D/PushPull3D";   

export default function Canvas3D({ tool }) {
  const hostRef = useRef(null);
  const objectsRef = useRef({ placed: [], redo: [], selectable: [] });
  const selectionRef = useRef([]);
  const snapPointsRef = useRef([]);
  const guideLineRef = useRef(null);

  // เก็บ tool ปัจจุบันไว้ใน ref (scene ไม่ reset)
  const toolRef = useRef(tool);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    const host = hostRef.current;
    const width = host.clientWidth;
    const height = host.clientHeight;

    // --- Scene / Camera / Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f5f7);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(10, 8, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    host.appendChild(renderer.domElement);

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(8, 12, 6);
    scene.add(dir);

    // --- Ground + Grid + Axes ---
    const grey1 = 0xe7e9eb;
    const grey2 = 0xf0f1f3;

    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const plane1 = new THREE.Mesh(
      planeGeo,
      new THREE.MeshBasicMaterial({ color: grey1 })
    );
    plane1.rotation.x = -Math.PI / 2;
    scene.add(plane1);

    const plane2 = new THREE.Mesh(
      planeGeo,
      new THREE.MeshBasicMaterial({ color: grey2 })
    );
    plane2.rotation.x = -Math.PI / 2;
    plane2.position.y = -0.01;
    scene.add(plane2);

    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    const xLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-100, 0, 0),
        new THREE.Vector3(100, 0, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0xff4b4b })
    );
    scene.add(xLine);

    const zLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -100),
        new THREE.Vector3(0, 0, 100),
      ]),
      new THREE.LineBasicMaterial({ color: 0x4caf50 })
    );
    scene.add(zLine);

    const yLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -100, 0),
        new THREE.Vector3(0, 100, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x3f51b5 })
    );
    scene.add(yLine);

    // --- ตัวคน ---
    const charGeo = new THREE.BoxGeometry(0.4, 1.6, 0.4);
    const charMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const character = new THREE.Mesh(charGeo, charMat);
    character.position.set(0, 0.8, 0);
    scene.add(character);
    // objectsRef.current.selectable.push(character);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.8, 0);
    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };

    // --- guide line for draw ---
    const guideGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(0, 0.01, 0),
    ]);
    const guideMat = new THREE.LineDashedMaterial({
      color: 0x00b4d8,
      dashSize: 0.35,
      gapSize: 0.2,
    });
    const guideLine = new THREE.Line(guideGeo, guideMat);
    guideLine.computeLineDistances();
    guideLine.visible = false;
    scene.add(guideLine);
    guideLineRef.current = guideLine;

    // --- Raycaster / mouse shared ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ---------- สร้าง helper ----------
    const mouse3D = createMouse3D({
      renderer,
      camera,
      raycaster,
      mouse,
      objectsRef,
      selectionRef,
      host,
    });

    const draw3D = createDraw3D({
      scene,
      camera,
      renderer,
      raycaster,
      mouse,
      guideLineRef,
      objectsRef,
      snapPointsRef,
    });

    const eraser3D = createEraser3D({
      scene,
      camera,
      renderer,
      raycaster,
      mouse,
      objectsRef,
    });

    const rectangle3D = createRectangle3D({
      scene,
      camera,
      renderer,
      raycaster,
      mouse,
      objectsRef,
    });

    const pushPull3D = createPushPull3D({
      scene,
      camera,
      renderer,
      raycaster,
      mouse,
      objectsRef,
    });

    // ---------- Event handlers wrapper ----------
    function handleClick(evt) {
      const activeTool = toolRef.current;
      // draw ยังใช้ click ปิด segment
      if (activeTool === "draw") {
        draw3D.onCanvasClickDraw(evt);
      }
      // erase / rectangle / push-pull ใช้ down-move-up แทน
    }

    function handleMouseDown(evt) {
      const activeTool = toolRef.current;
      if (activeTool === "select") {
        mouse3D.onMouseDownSelect(evt);
      } else if (activeTool === "erase") {
        eraser3D.onMouseDownEraser(evt);
      } else if (activeTool === "rectangle") {
        rectangle3D.onMouseDownRectangle(evt);
      } else if (activeTool === "push/pull") {
        pushPull3D.onMouseDownPushPull(evt);
      }
    }

    function handleMouseMove(evt) {
      const activeTool = toolRef.current;
      if (activeTool === "select") {
        mouse3D.onMouseMoveSelect(evt);
      } else if (activeTool === "draw") {
        draw3D.onMouseMoveDraw(evt);
      } else if (activeTool === "erase") {
        eraser3D.onMouseMoveEraser(evt);
      } else if (activeTool === "rectangle") {
        rectangle3D.onMouseMoveRectangle(evt);
      } else if (activeTool === "push/pull") {
        pushPull3D.onMouseMovePushPull(evt);
      }
    }

    function handleMouseUp(evt) {
      const activeTool = toolRef.current;
      if (activeTool === "select") {
        mouse3D.onMouseUpSelect(evt);
      } else if (activeTool === "erase") {
        eraser3D.onMouseUpEraser(evt);
      } else if (activeTool === "rectangle") {
        rectangle3D.onMouseUpRectangle(evt);
      } else if (activeTool === "push/pull") {
        pushPull3D.onMouseUpPushPull(evt);
      }
    }

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // --- undo / redo จาก toolbar ---
    function onToolbarEvt(e) {
      const action = e.detail;
      if (action === "undo") {
        const last = objectsRef.current.placed.pop();
        if (last) {
          scene.remove(last);
          objectsRef.current.redo.push(last);
        }
      } else if (action === "redo") {
        const obj = objectsRef.current.redo.pop();
        if (obj) {
          scene.add(obj);
          objectsRef.current.placed.push(obj);
        }
      }
    }
    window.addEventListener("ph:toolbar", onToolbarEvt);

    // --- Resize ---
    const resizeObserver = new ResizeObserver(() => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(host);

    // --- Render loop ---
    let frameId = 0;
    const renderLoop = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("ph:toolbar", onToolbarEvt);

      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      mouse3D.cleanupMouse3D();
      draw3D.cleanupDraw3D();
      eraser3D.cleanupEraser3D();
      rectangle3D.cleanupRectangle3D();
      pushPull3D.cleanupPushPull3D();

      if (guideLineRef.current) {
        scene.remove(guideLineRef.current);
        guideLineRef.current.geometry.dispose();
        guideLineRef.current.material.dispose();
        guideLineRef.current = null;
      }

      host.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []); // รันครั้งเดียว

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    />
  );
}