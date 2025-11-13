// src/components/Function3D/Sunlight3D.js
import * as THREE from "three";

/**
 * จัดการดวงอาทิตย์ + แสงท้องฟ้า แบบสมจริงขึ้น
 * ใช้ร่วมกับ Canvas3D:
 *   const { setTimeOfDay, cleanupSunlight3D } = createSunlight3D({ scene });
 *   setTimeOfDay(12); // เริ่มต้นเที่ยง
 */
export function createSunlight3D({ scene }) {
  // --- ดวงอาทิตย์หลัก (DirectionalLight) ---
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.castShadow = true;

  // ปรับคุณภาพเงา
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  sunLight.shadow.bias = -0.0005;

  // ให้เล็งมาที่จุด (0,0,0) เป็นค่าเริ่มต้น
  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, 0, 0);
  scene.add(sunTarget);
  sunLight.target = sunTarget;

  scene.add(sunLight);

  // --- แสงท้องฟ้า (HemisphereLight) ให้บรรยากาศฟ้า/พื้นดิน ---
  const hemiLight = new THREE.HemisphereLight(
    0xbfd7ff, // สีท้องฟ้าตอนกลางวัน
    0xb8b09a, // สีพื้นดิน
    0.6
  );
  scene.add(hemiLight);

  // ถ้าอยาก debug ตำแหน่งดวงอาทิตย์ เปิดอันนี้ได้
  // const sunHelper = new THREE.Mesh(
  //   new THREE.SphereGeometry(0.2, 16, 16),
  //   new THREE.MeshBasicMaterial({ color: 0xffcc33 })
  // );
  // scene.add(sunHelper);

  /**
   * แปลงเวลา (0–24 ชม.) → ตำแหน่งดวงอาทิตย์ + สี + ความสว่าง
   */
  function setTimeOfDay(hour) {
    // ทำให้ค่าอยู่ในช่วง 0–24 เสมอ
    let h = hour;
    if (h < 0) h = 24 + (h % 24);
    h = h % 24;

    // ช่วงกลางวัน (ประมาณ 6:00–18:00)
    const isDay = h >= 6 && h <= 18;

    // --- คำนวณมุมดวงอาทิตย์แบบง่ายแต่ดูสมจริง ---
    let elevation; // มุมเงยจากขอบฟ้า (rad)
    let azimuth;   // มุมรอบ ๆ แกน Y (rad) - แนวตะวันออก/ตะวันตก

    if (isDay) {
      // map 6→0, 12→0.5, 18→1
      const t = (h - 6) / 12; // 0..1

      // ความสูงของดวงอาทิตย์: 0 ที่ขอบฟ้า, สูงสุดตอนเที่ยง
      const maxElev = THREE.MathUtils.degToRad(70); // สูงสุด ~70°
      const elevFactor = Math.sin(t * Math.PI);     // 0→1→0
      elevation = elevFactor * maxElev;

      // ดวงอาทิตย์เคลื่อนจากทิศตะวันออก(-90°) → ตะวันตก(+90°)
      azimuth = THREE.MathUtils.degToRad(-90 + t * 180);
    } else {
      // กลางคืน: แสงหลักจะหายไปเกือบหมด แต่ยังให้มีทิศทางเล็ก ๆ
      // จะใช้มุมต่ำ ๆ ให้เหมือนแสงจันทร์อ่อน ๆ
      const maxElevNight = THREE.MathUtils.degToRad(20);
      elevation = maxElevNight * 0.1; // เกือบ ๆ ขอบฟ้า
      azimuth = THREE.MathUtils.degToRad(120); // เอียง ๆ ทิศเดียว
    }

    // --- แปลงมุมเป็นตำแหน่ง ---
    const radius = 60; // ระยะห่างจาก origin (ใหญ่หน่อยเพื่อให้เงาเนียน)
    const y = radius * Math.sin(elevation);
    const rProj = radius * Math.cos(elevation);
    const x = rProj * Math.cos(azimuth);
    const z = rProj * Math.sin(azimuth);

    sunLight.position.set(x, y, z);
    sunTarget.position.set(0, 0, 0);
    sunTarget.updateMatrixWorld();

    // if (sunHelper) {
    //   sunHelper.position.copy(sunLight.position);
    // }

    // --- ปรับสี / ความเข้มของแสงตามมุมและเวลา ---
    const elevNorm = Math.max(0, Math.sin(elevation)); // 0 ที่ขอบฟ้า, 1 ตอนสูงสุด

    // สีแสงดวงอาทิตย์: เช้า/เย็นจะออกส้ม ๆ กลางวันขาว ๆ
    const warmColor = new THREE.Color(0xffd6a3); // ส้มอุ่น ๆ
    const neutralColor = new THREE.Color(0xffffff);
    const warmFactor = 1 - elevNorm; // elevation ต่ำ = อุ่นมากขึ้น
    const sunColor = neutralColor.clone().lerp(warmColor, warmFactor);
    sunLight.color.copy(sunColor);

    // ความสว่าง: กลางวันสว่างสุด กลางคืนเบามาก
    if (isDay) {
      const baseIntensity = 0.6; // ระดับพื้นฐานกลางวัน
      sunLight.intensity = baseIntensity + elevNorm * 0.8; // รวม ~0.6–1.4
    } else {
      sunLight.intensity = 0.08; // แสงอ่อน ๆ ตอนกลางคืน (คล้ายแสงจันทร์)
    }

    // --- ปรับแสงท้องฟ้า (Hemisphere) ให้เข้ากับเวลา ---
    const skyDay = new THREE.Color(0xbfd7ff);     // ฟ้ากลางวัน
    const skyNight = new THREE.Color(0x050816);   // ฟ้ามืดกลางคืน
    const groundDay = new THREE.Color(0xb8b09a);  // พื้นดินกลางวัน
    const groundNight = new THREE.Color(0x050608);

    const dayFactor = isDay ? elevNorm : 0.0; // กลางวันยิ่งสูงยิ่งสว่าง

    hemiLight.color.copy(skyNight.clone().lerp(skyDay, dayFactor));
    hemiLight.groundColor.copy(groundNight.clone().lerp(groundDay, dayFactor));
    hemiLight.intensity = 0.15 + dayFactor * 0.75; // คืนมืดๆ ยังมีแสงนิดหน่อย

    // อยากให้ scene มีหมอกจาง ๆ ตอนกลางวันก็ทำได้ (ถ้าอยาก)
    // scene.fog = new THREE.Fog(0xf3f5f7, 40, 140);
  }

  function cleanupSunlight3D() {
    scene.remove(sunLight);
    scene.remove(hemiLight);
    scene.remove(sunTarget);
    if (sunLight.shadow && sunLight.shadow.map) {
      sunLight.shadow.map.dispose();
    }
  }

  return {
    setTimeOfDay,
    cleanupSunlight3D,
  };
}
