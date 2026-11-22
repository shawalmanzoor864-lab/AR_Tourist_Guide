import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LAHORE_FORT_STOPS } from '../data/tourData';
import { ProceduralTexturePack } from './proceduralTextures';

/** Default Akbar Badshah (king) guide model for the Lahore Fort module (served from /public/models) */
export const LAHORE_GUIDE_MODEL_URL = `${import.meta.env.BASE_URL}models/lahore-akbar.glb`;
/** Akbari Mahal background building for the Lahore Fort module (served from /public/models) */
export const LAHORE_FORT_BG_MODEL_URL = `${import.meta.env.BASE_URL}models/lahore-akbari-mahal.glb`;

/** Footprint (longest horizontal side) of the Akbari Mahal backdrop, in scene units */
const FORT_BG_FOOTPRINT = 8.2;
/** Where the building's bottom-center sits (same spot as the Japanese pavilion house) */
const FORT_BG_POSITION: [number, number, number] = [0, 0, -4.4];

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
 * Builds the Lahore Fort scene: the Akbari Mahal model with 6 clickable tour markers.
 */
export function buildLahoreFortScene(
  textures: ProceduralTexturePack,
  isArBackdrop: boolean,
): LahoreFortBuildResult {
  const root = new THREE.Group();
  const clickableTargets: THREE.Object3D[] = [];
  const markers = new Map<string, { ring: THREE.Mesh; beacon: THREE.Mesh }>();

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

  // AKBARI MAHAL (GLB model): the Lahore Fort building standing behind the guide.
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
    },
  );

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