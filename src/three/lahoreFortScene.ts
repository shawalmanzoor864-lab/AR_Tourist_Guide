import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LAHORE_FORT_STOPS } from '../data/tourData';
import { ProceduralTexturePack } from './proceduralTextures';

/** Default Akbar Badshah (king) guide model for the Lahore Fort module (served from /public/models) */
export const LAHORE_GUIDE_MODEL_URL = `${import.meta.env.BASE_URL}models/lahore-akbar.glb`;
/** Akbari Mahal background building for the Lahore Fort module (served from /public/models) */
export const LAHORE_FORT_BG_MODEL_URL = `${import.meta.env.BASE_URL}models/lahore-akbari-mahal.glb`;

/** Footprint (longest horizontal side) of the Akbari Mahal backdrop, in scene units */
const FORT_BG_FOOTPRINT = 11;
/** Where the backdrop's bottom-center sits: just behind the courtyard's rear rampart */
const FORT_BG_POSITION: [number, number, number] = [0, 0, -10.6];

export interface CharacterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  jawGroup: THREE.Group;
  rightArm: THREE.Group;
  leftArm: THREE.Group;
  customModelContainer: THREE.Group;
  hasCustomModel: boolean;
}

export interface LahoreFortBuildResult {
  root: THREE.Group;
  guideRig: CharacterRig;
  markers: Map<string, { ring: THREE.Mesh; beacon: THREE.Mesh }>;
  clickableTargets: THREE.Object3D[];
}

function addRaycastProxy(
  parent: THREE.Group,
  landmarkId: string,
  size: [number, number, number],
  offset: [number, number, number],
  clickableTargets: THREE.Object3D[],
) {
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  proxy.position.set(offset[0], offset[1], offset[2]);
  proxy.layers.enable(1);
  proxy.userData.landmarkId = landmarkId;
  parent.add(proxy);
  clickableTargets.push(proxy);
}

/**
 * Builds the 3D AR Tourist Guide character in heritage Pakistani/Mughal guide attire.
 * Pivot is bottom-center at y = 0.
 */
export function createTourGuideAvatar(contactShadowTex: THREE.Texture): CharacterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const customModelContainer = new THREE.Group();
  root.add(customModelContainer);

  // Contact shadow disc
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.35),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  const sherwaniMat = new THREE.MeshStandardMaterial({
    color: 0x164e3f, // Emerald heritage coat
    roughness: 0.72,
    metalness: 0.08,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    color: 0xeae2d2,
    roughness: 0.8,
    metalness: 0.02,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd49b38,
    roughness: 0.28,
    metalness: 0.85,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xc98f68,
    roughness: 0.62,
    metalness: 0.02,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x3b2316,
    roughness: 0.45,
    metalness: 0.15,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1f1a17,
    roughness: 0.88,
    metalness: 0.04,
  });

  // 1. Boots & Legs
  [-0.14, 0.14].forEach((x) => {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), shoeMat);
    shoe.position.set(x, 0.04, 0.04);
    shoe.castShadow = true;
    bodyGroup.add(shoe);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.68, 12), trouserMat);
    leg.position.set(x, 0.4, 0);
    leg.castShadow = true;
    bodyGroup.add(leg);
  });

  // 2. Sherwani Coat Lower & Torso
  const coatSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.46, 16), sherwaniMat);
  coatSkirt.position.y = 0.78;
  coatSkirt.castShadow = true;
  bodyGroup.add(coatSkirt);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.5, 16), sherwaniMat);
  torso.position.y = 1.18;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // 3. Sash & Gold Heritage Badge
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.1, 16), goldTrimMat);
  sash.position.y = 0.96;
  bodyGroup.add(sash);

  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.03), goldTrimMat);
  badge.position.set(0.1, 1.26, 0.22);
  bodyGroup.add(badge);

  // 4. Neck & Head Group
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 12), skinMat);
  neck.position.y = 1.46;
  bodyGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0);
  bodyGroup.add(headGroup);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), skinMat);
  cranium.scale.set(0.95, 1.08, 0.98);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Mustache & beard accent
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), hairMat);
  beard.scale.set(0.92, 0.65, 0.85);
  beard.position.set(0, -0.07, 0.04);
  headGroup.add(beard);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 });
  [-0.055, 0.055].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), eyeMat);
    eye.position.set(ex, 0.025, 0.142);
    headGroup.add(eye);
  });

  // Articulated Jaw for Lip-Sync
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.055, 0.08);
  headGroup.add(jawGroup);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.026, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x7c2d26, roughness: 0.5 }),
  );
  mouth.position.set(0, -0.01, 0.055);
  jawGroup.add(mouth);

  // Jinnah Cap / Heritage Turban Cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.16, 0.14, 18),
    new THREE.MeshStandardMaterial({ color: 0x26262a, roughness: 0.85 }),
  );
  cap.position.set(0, 0.13, -0.01);
  cap.rotation.x = -0.1;
  cap.castShadow = true;
  headGroup.add(cap);

  const capBand = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.015, 8, 24), goldTrimMat);
  capBand.rotation.x = Math.PI / 2 - 0.1;
  capBand.position.set(0, 0.08, -0.01);
  headGroup.add(capBand);

  // 5. Left Arm (holding heritage tablet/guidebook)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 1.36, 0);
  bodyGroup.add(leftArm);

  const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.44, 12), sherwaniMat);
  lSleeve.position.y = -0.2;
  lSleeve.castShadow = true;
  leftArm.add(lSleeve);

  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), skinMat);
  lHand.position.y = -0.44;
  leftArm.add(lHand);

  const tablet = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.24, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.35, metalness: 0.5 }),
  );
  tablet.position.set(0.06, -0.42, 0.1);
  tablet.rotation.set(-0.5, 0.2, 0);
  leftArm.add(tablet);

  // 6. Right Arm (explaining/pointing arm with brass staff)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 1.36, 0);
  bodyGroup.add(rightArm);

  const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.44, 12), sherwaniMat);
  rSleeve.position.y = -0.2;
  rSleeve.castShadow = true;
  rightArm.add(rSleeve);

  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), skinMat);
  rHand.position.y = -0.44;
  rightArm.add(rHand);

  return {
    root,
    bodyGroup,
    headGroup,
    jawGroup,
    rightArm,
    leftArm,
    customModelContainer,
    hasCustomModel: false,
  };
}

/**
 * Builds the Lahore Fort (Shahi Qila) architectural diorama with 6 clickable landmarks.
 */
export function buildLahoreFortScene(
  textures: ProceduralTexturePack,
  isArBackdrop: boolean,
): LahoreFortBuildResult {
  const root = new THREE.Group();
  const clickableTargets: THREE.Object3D[] = [];
  const markers = new Map<string, { ring: THREE.Mesh; beacon: THREE.Mesh }>();

  const sandstoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstone,
    roughness: 0.85,
    metalness: 0.04,
  });
  const darkSandstoneMat = new THREE.MeshStandardMaterial({
    color: 0x7c3120,
    roughness: 0.88,
    metalness: 0.05,
  });
  const marbleMat = new THREE.MeshStandardMaterial({
    map: textures.marble,
    roughness: 0.28,
    metalness: 0.08,
  });
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xe6edf5,
    roughness: 0.08,
    metalness: 0.94,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe3a842,
    roughness: 0.22,
    metalness: 0.9,
  });
  const kashiMat = new THREE.MeshStandardMaterial({
    map: textures.kashiMosaic,
    roughness: 0.35,
    metalness: 0.15,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.cedarWood,
    roughness: 0.72,
    metalness: 0.05,
  });
  const lawnMat = new THREE.MeshStandardMaterial({
    color: 0x3b5f3a,
    roughness: 0.95,
    metalness: 0,
  });

  // Ground courtyard plinth (always grounded at y=0)
  const courtyardBase = new THREE.Mesh(
    new THREE.CylinderGeometry(8.8, 9.2, 0.3, 48),
    new THREE.MeshStandardMaterial({
      map: textures.courtyardStone,
      roughness: 0.86,
      metalness: 0.02,
      transparent: isArBackdrop,
      opacity: isArBackdrop ? 0.82 : 1,
    }),
  );
  courtyardBase.position.y = -0.15;
  courtyardBase.receiveShadow = true;
  root.add(courtyardBase);

  // Mughal Charbagh lawn strips in center courtyard
  [-1.9, 1.9].forEach((x) => {
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 3.1), lawnMat);
    lawn.position.set(x, 0.02, 1.8);
    lawn.receiveShadow = true;
    root.add(lawn);
  });

  // Central reflecting water channel
  const waterChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.04, 5.2),
    new THREE.MeshStandardMaterial({ color: 0x2c6b7a, roughness: 0.12, metalness: 0.65 }),
  );
  waterChannel.position.set(0, 0.025, 1.9);
  root.add(waterChannel);

  // Perimeter connecting rampart walls
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.5, 0.5), darkSandstoneMat);
  backWall.position.set(0, 0.75, -4.6);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 8.8), darkSandstoneMat);
  eastWall.position.set(5.6, 0.75, -0.3);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  root.add(eastWall);

  // AKBARI MAHAL (GLB model) BACKDROP behind the courtyard.
  // The plain rear rampart wall above is only kept as a fallback if the GLB fails to load.
  new GLTFLoader().load(
    LAHORE_FORT_BG_MODEL_URL,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Normalize: longest horizontal side = FORT_BG_FOOTPRINT, centered on x/z, bottom on y = 0
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const k = FORT_BG_FOOTPRINT / Math.max(size.x, size.z, 0.001);
      model.scale.setScalar(k);
      const b2 = new THREE.Box3().setFromObject(model);
      const c2 = b2.getCenter(new THREE.Vector3());
      model.position.set(-c2.x, -b2.min.y, -c2.z);

      const pivot = new THREE.Group();
      pivot.position.set(FORT_BG_POSITION[0], FORT_BG_POSITION[1], FORT_BG_POSITION[2]);
      pivot.add(model);
      root.add(pivot);

      backWall.visible = false;
    },
    undefined,
    () => {
      // GLB failed to load: keep the procedural rear rampart wall
    },
  );

  // 1. ALAMGIRI GATE (Front Grand Entrance)
  const alamgiri = new THREE.Group();
  alamgiri.position.set(0, 0, 4.4);
  root.add(alamgiri);

  const gateMain = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.3, 1.0), sandstoneMat);
  gateMain.position.y = 1.15;
  gateMain.castShadow = true;
  gateMain.receiveShadow = true;
  alamgiri.add(gateMain);

  const gateArchRecess = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.65, 1.06), woodMat);
  gateArchRecess.position.y = 0.82;
  alamgiri.add(gateArchRecess);

  const gateMarbleTrim = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.85, 1.03), marbleMat);
  gateMarbleTrim.position.y = 0.94;
  alamgiri.add(gateMarbleTrim);

  // Twin fluted bastions with marble domes
  [-1.55, 1.55].forEach((bx) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 2.85, 14), sandstoneMat);
    tower.position.set(bx, 1.425, 0.1);
    tower.castShadow = true;
    tower.receiveShadow = true;
    alamgiri.add(tower);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
      marbleMat,
    );
    dome.position.set(bx, 2.88, 0.1);
    dome.castShadow = true;
    alamgiri.add(dome);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 8), goldMat);
    finial.position.set(bx, 3.45, 0.1);
    alamgiri.add(finial);
  });
  addRaycastProxy(alamgiri, 'alamgiri-gate', [4.4, 3.8, 1.8], [0, 1.8, 0], clickableTargets);

  // 2. SHEESH MAHAL (Northwest White Marble Palace of Mirrors)
  const sheesh = new THREE.Group();
  sheesh.position.set(-3.8, 0, -2.6);
  root.add(sheesh);

  const sheeshPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 2.6), sandstoneMat);
  sheeshPlinth.position.y = 0.3;
  sheeshPlinth.castShadow = true;
  sheeshPlinth.receiveShadow = true;
  sheesh.add(sheeshPlinth);

  const sheeshHall = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.5, 2.1), marbleMat);
  sheeshHall.position.y = 1.35;
  sheeshHall.castShadow = true;
  sheeshHall.receiveShadow = true;
  sheesh.add(sheeshHall);

  // Mirror-inlaid vaulted chamber facade
  const mirrorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.05, 0.12), mirrorMat);
  mirrorPanel.position.set(0, 1.25, 1.04);
  sheesh.add(mirrorPanel);

  // Chhatri cupolas on roof
  [-0.95, 0.95].forEach((cx) => {
    const chhatri = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), marbleMat);
    chhatri.position.set(cx, 2.3, 0);
    chhatri.castShadow = true;
    sheesh.add(chhatri);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 8), goldMat);
    tip.position.set(cx, 2.75, 0);
    sheesh.add(tip);
  });
  addRaycastProxy(sheesh, 'sheesh-mahal', [3.6, 3.1, 2.8], [0, 1.5, 0], clickableTargets);

  // 3. DIWAN-E-AAM (Central 40-Pillar Sandstone Hall)
  const diwan = new THREE.Group();
  diwan.position.set(0.2, 0, -0.4);
  root.add(diwan);

  const diwanPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 2.2), sandstoneMat);
  diwanPlinth.position.y = 0.175;
  diwanPlinth.receiveShadow = true;
  diwan.add(diwanPlinth);

  const diwanRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 2.0), sandstoneMat);
  diwanRoof.position.y = 1.8;
  diwanRoof.castShadow = true;
  diwan.add(diwanRoof);

  // Colonnade pillars (3x5 grid)
  for (let px = -1.45; px <= 1.45; px += 0.725) {
    for (let pz = -0.75; pz <= 0.75; pz += 0.75) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 1.35, 10), sandstoneMat);
      col.position.set(px, 1.02, pz);
      col.castShadow = true;
      diwan.add(col);
    }
  }

  // Elevated Marble Jharokha Balcony
  const jharokha = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.9, 0.75), marbleMat);
  jharokha.position.set(0, 1.15, -0.55);
  jharokha.castShadow = true;
  diwan.add(jharokha);
  addRaycastProxy(diwan, 'diwan-e-aam', [4.0, 2.4, 2.4], [0, 1.1, 0], clickableTargets);

  // 4. NAULAKHA PAVILION (Curved Bangaldar Marble Pavilion)
  const naulakha = new THREE.Group();
  naulakha.position.set(-5.1, 0, 0.9);
  root.add(naulakha);

  const nauBase = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 1.8), marbleMat);
  nauBase.position.y = 0.225;
  nauBase.castShadow = true;
  nauBase.receiveShadow = true;
  naulakha.add(nauBase);

  [-0.75, 0.75].forEach((x) => {
    [-0.55, 0.55].forEach((z) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.25, 10), marbleMat);
      pillar.position.set(x, 1.05, z);
      pillar.castShadow = true;
      naulakha.add(pillar);
    });
  });

  // Curved Bengali roof (extruded gentle arch)
  const nauRoof = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.4, 2.1, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
    marbleMat,
  );
  nauRoof.rotation.z = Math.PI / 2;
  nauRoof.scale.set(0.42, 1, 0.85);
  nauRoof.position.y = 1.48;
  nauRoof.castShadow = true;
  naulakha.add(nauRoof);

  const nauFinial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), goldMat);
  nauFinial.position.y = 2.18;
  naulakha.add(nauFinial);
  addRaycastProxy(naulakha, 'naulakha-pavilion', [2.4, 2.6, 2.2], [0, 1.2, 0], clickableTargets);

  // 5. PICTURE WALL & HATHI POL (Southwest Glazed Tile Mural Wall)
  const picWall = new THREE.Group();
  picWall.position.set(-4.9, 0, 4.1);
  root.add(picWall);

  const wallCore = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 0.65), sandstoneMat);
  wallCore.position.y = 1.1;
  wallCore.castShadow = true;
  wallCore.receiveShadow = true;
  picWall.add(wallCore);

  const muralFacade = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.8, 0.7), kashiMat);
  muralFacade.position.y = 1.12;
  picWall.add(muralFacade);

  const hathiArch = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.35, 0.76), woodMat);
  hathiArch.position.set(0.95, 0.68, 0);
  picWall.add(hathiArch);
  addRaycastProxy(picWall, 'picture-wall', [3.6, 2.5, 1.4], [0, 1.2, 0], clickableTargets);

  // 6. MOTI MASJID (Eastern White Marble Pearl Mosque)
  const moti = new THREE.Group();
  moti.position.set(4.2, 0, -2.5);
  root.add(moti);

  const motiCourtyard = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.3, 2.8), marbleMat);
  motiCourtyard.position.y = 0.15;
  motiCourtyard.receiveShadow = true;
  moti.add(motiCourtyard);

  const prayerHall = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.35, 1.35), marbleMat);
  prayerHall.position.set(0, 0.95, -0.55);
  prayerHall.castShadow = true;
  prayerHall.receiveShadow = true;
  moti.add(prayerHall);

  // Triple onion marble domes
  [-0.78, 0, 0.78].forEach((dx, idx) => {
    const rad = idx === 1 ? 0.44 : 0.34;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 14), marbleMat);
    dome.scale.set(1, 1.18, 1);
    dome.position.set(dx, 1.85, -0.55);
    dome.castShadow = true;
    moti.add(dome);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 8), goldMat);
    spire.position.set(dx, 1.85 + rad * 1.18 + 0.12, -0.55);
    moti.add(spire);
  });
  addRaycastProxy(moti, 'moti-masjid', [3.3, 2.8, 3.0], [0, 1.3, 0], clickableTargets);

  // AR Spatial Beacon Rings above every clickable landmark
  const ringGeo = new THREE.RingGeometry(0.32, 0.42, 32);
  const beaconGeo = new THREE.OctahedronGeometry(0.14, 0);

  LAHORE_FORT_STOPS.forEach((stop) => {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(stop.position[0], stop.position[1] + 1.55, stop.position[2]);
    root.add(ring);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.8,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(stop.position[0], stop.position[1] + 1.88, stop.position[2]);
    beacon.layers.enable(1);
    beacon.userData.landmarkId = stop.id;
    clickableTargets.push(beacon);
    root.add(beacon);

    markers.set(stop.id, { ring, beacon });
  });

  // Create Tourist Guide Avatar standing at first stop
  const guideRig = createTourGuideAvatar(textures.contactShadow);
  const initialStop = LAHORE_FORT_STOPS[0];
  guideRig.root.position.set(
    initialStop.guideSpot[0],
    initialStop.guideSpot[1],
    initialStop.guideSpot[2],
  );
  root.add(guideRig.root);

  return { root, guideRig, markers, clickableTargets };
}