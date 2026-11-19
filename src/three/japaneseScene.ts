import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterRig } from './lahoreFortScene';
import { ProceduralTexturePack } from './proceduralTextures';

export interface JapanesePavilionBuildResult {
  root: THREE.Group;
  characterRig: CharacterRig;
  interiorLight: THREE.PointLight;
  clickableTargets: THREE.Object3D[];
}

/** Default 3D assets for the Japanese Pavilion module (served from /public/models) */
export const JAPANESE_CHARACTER_MODEL_URL = `${import.meta.env.BASE_URL}models/japanese-character.glb`;
export const JAPANESE_HOUSE_MODEL_URL = `${import.meta.env.BASE_URL}models/japanese-house.glb`;

/** Footprint (longest horizontal side) of the pavilion house model, in scene units */
const HOUSE_FOOTPRINT = 8.2;
/** Rotation (radians, about Y) so the house model's facade faces the +Z camera side */
const HOUSE_YAW = 0;

function addClickBox(
  parent: THREE.Object3D,
  landmarkId: string,
  size: [number, number, number],
  offset: [number, number, number],
  clickableTargets: THREE.Object3D[],
) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  box.position.set(offset[0], offset[1], offset[2]);
  box.layers.enable(1);
  box.userData.landmarkId = landmarkId;
  parent.add(box);
  clickableTargets.push(box);
  return box;
}

/**
 * Builds the Japanese Heritage 3D Character Model (Kimono + Hakama + Folding Fan)
 * Pivot grounded at bottom-center (y = 0).
 */
export function createJapaneseCharacter(contactShadowTex: THREE.Texture): CharacterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const customModelContainer = new THREE.Group();
  root.add(customModelContainer);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
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

  const kimonoMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f, // Deep indigo aizome fabric
    roughness: 0.78,
    metalness: 0.05,
  });
  const hakamaMat = new THREE.MeshStandardMaterial({
    color: 0x262933, // Charcoal pleated hakama
    roughness: 0.82,
    metalness: 0.04,
  });
  const obiMat = new THREE.MeshStandardMaterial({
    color: 0xc2652b, // Terracotta-gold silk obi
    roughness: 0.36,
    metalness: 0.35,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.7,
    metalness: 0.02,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe6be9e,
    roughness: 0.6,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x17171a,
    roughness: 0.85,
    metalness: 0.08,
  });
  const woodGetaMat = new THREE.MeshStandardMaterial({
    color: 0x6e472b,
    roughness: 0.68,
    metalness: 0.05,
  });

  // 1. Geta sandals & Tabi socks
  [-0.14, 0.14].forEach((x) => {
    const geta = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.065, 0.24), woodGetaMat);
    geta.position.set(x, 0.032, 0.03);
    geta.castShadow = true;
    bodyGroup.add(geta);

    const tabi = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.19), collarMat);
    tabi.position.set(x, 0.09, 0.02);
    bodyGroup.add(tabi);
  });

  // 2. Pleated Hakama Skirt/Trousers
  const hakama = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.86, 16), hakamaMat);
  hakama.position.y = 0.54;
  hakama.castShadow = true;
  hakama.receiveShadow = true;
  bodyGroup.add(hakama);

  // 3. Kimono Upper Torso + Collar + Obi Sash
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.52, 16), kimonoMat);
  torso.position.y = 1.2;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.026, 8, 18), collarMat);
  collar.rotation.x = Math.PI / 2 - 0.35;
  collar.position.set(0, 1.42, 0.04);
  bodyGroup.add(collar);

  const obi = new THREE.Mesh(new THREE.CylinderGeometry(0.232, 0.232, 0.14, 16), obiMat);
  obi.position.y = 0.99;
  bodyGroup.add(obi);

  // 4. Head + Topknot + Articulated Jaw
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.11, 12), skinMat);
  neck.position.y = 1.48;
  bodyGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.64, 0);
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), skinMat);
  head.scale.set(0.94, 1.06, 0.96);
  head.castShadow = true;
  headGroup.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat,
  );
  hairCap.rotation.x = -0.25;
  hairCap.position.set(0, 0.02, -0.015);
  headGroup.add(hairCap);

  const topknot = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.045, 0.11, 10), hairMat);
  topknot.position.set(0, 0.18, -0.04);
  topknot.rotation.x = -0.35;
  headGroup.add(topknot);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.2 });
  [-0.055, 0.055].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 10), eyeMat);
    eye.position.set(ex, 0.02, 0.142);
    headGroup.add(eye);
  });

  // Jaw group for lip-sync animation
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.055, 0.08);
  headGroup.add(jawGroup);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.024, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x8f3730, roughness: 0.48 }),
  );
  mouth.position.set(0, -0.008, 0.055);
  jawGroup.add(mouth);

  // 5. Left Kimono Sleeve Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.29, 1.36, 0);
  bodyGroup.add(leftArm);

  const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.24), kimonoMat);
  lSleeve.position.set(0, -0.2, -0.02);
  lSleeve.castShadow = true;
  leftArm.add(lSleeve);

  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinMat);
  lHand.position.set(0, -0.42, 0.04);
  leftArm.add(lHand);

  // 6. Right Kimono Sleeve Arm + Traditional Sensu Folding Fan
  const rightArm = new THREE.Group();
  rightArm.position.set(0.29, 1.36, 0);
  bodyGroup.add(rightArm);

  const rSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.24), kimonoMat);
  rSleeve.position.set(0, -0.2, -0.02);
  rSleeve.castShadow = true;
  rightArm.add(rSleeve);

  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinMat);
  rHand.position.set(0, -0.42, 0.04);
  rightArm.add(rHand);

  // Folding fan (Sensu)
  const fan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.03, 0.012, 12, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf4e4c1, roughness: 0.55, side: THREE.DoubleSide }),
  );
  fan.rotation.set(Math.PI / 2 - 0.3, 0, -0.4);
  fan.position.set(0.06, -0.42, 0.16);
  rightArm.add(fan);

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
 * Builds the Japanese Heritage 3D Model standing in front of his Traditional Japanese House
 * (heritage house model behind him).
 */
export function buildJapanesePavilionScene(
  textures: ProceduralTexturePack,
  isArBackdrop: boolean,
): JapanesePavilionBuildResult {
  const root = new THREE.Group();
  const clickableTargets: THREE.Object3D[] = [];

  const cedarMat = new THREE.MeshStandardMaterial({
    map: textures.cedarWood,
    roughness: 0.75,
    metalness: 0.04,
  });
  const darkTimberMat = new THREE.MeshStandardMaterial({
    color: 0x3b2618,
    roughness: 0.7,
    metalness: 0.05,
  });
  const shojiMat = new THREE.MeshStandardMaterial({
    map: textures.shojiLattice,
    emissive: 0xffc773,
    emissiveIntensity: 0.42,
    roughness: 0.85,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: textures.kawaraRoof,
    roughness: 0.48,
    metalness: 0.25,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x7b7f82,
    roughness: 0.9,
    metalness: 0.04,
  });
  const plasterMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d0,
    roughness: 0.88,
    metalness: 0.02,
  });

  // Ground courtyard & Zen gravel floor
  const gardenGround = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.9, 0.28, 48),
    new THREE.MeshStandardMaterial({
      map: textures.zenGravel,
      roughness: 0.94,
      metalness: 0,
      transparent: isArBackdrop,
      opacity: isArBackdrop ? 0.82 : 1,
    }),
  );
  gardenGround.position.y = -0.14;
  gardenGround.receiveShadow = true;
  root.add(gardenGround);

  // JAPANESE PAVILION HOUSE (GLB model) BEHIND THE CHARACTER.
  // The old procedural machiya below is kept only as a fallback if the GLB fails to load.
  const houseRoot = new THREE.Group();
  houseRoot.position.set(0, 0, -4.4);
  root.add(houseRoot);

  const house = new THREE.Group();
  house.visible = false;
  houseRoot.add(house);

  // 1. Stone Foundation Plinth (Ishizue)
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.36, 4.4), stoneMat);
  foundation.position.y = 0.18;
  foundation.receiveShadow = true;
  foundation.castShadow = true;
  house.add(foundation);

  // 2. Main Ground Floor Timber & Shoji Structure
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.35, 3.6), plasterMat);
  mainBody.position.set(0, 1.52, -0.2);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  house.add(mainBody);

  // Structural cedar corner & center columns
  [-3.5, -1.75, 0, 1.75, 3.5].forEach((px) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.42, 0.16), darkTimberMat);
    post.position.set(px, 1.55, 1.6);
    post.castShadow = true;
    house.add(post);
  });

  // 3. Sliding Shoji Screens across front facade
  [-2.62, -0.88, 0.88, 2.62].forEach((sx) => {
    const shoji = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.98, 0.08), shojiMat);
    shoji.position.set(sx, 1.4, 1.62);
    house.add(shoji);
  });

  // Noren Entrance Curtain over center doorway
  const noren = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.55, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.88 }),
  );
  noren.position.set(0, 2.15, 1.78);
  house.add(noren);

  // 4. Engawa Raised Cedar Veranda & Entrance Steps
  const engawa = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 1.1), cedarMat);
  engawa.position.set(0, 0.42, 2.05);
  engawa.castShadow = true;
  engawa.receiveShadow = true;
  house.add(engawa);

  const stepStone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.55), stoneMat);
  stepStone.position.set(0, 0.09, 2.75);
  stepStone.receiveShadow = true;
  house.add(stepStone);

  // 5. Lower Eaves Overhang (Hisashi)
  const lowerEaves = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.16, 1.35), roofMat);
  lowerEaves.position.set(0, 2.62, 2.05);
  lowerEaves.rotation.x = 0.24;
  lowerEaves.castShadow = true;
  house.add(lowerEaves);

  // 6. Second Story Machiya Loft
  const upperStory = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.3, 3.0), darkTimberMat);
  upperStory.position.set(0, 3.32, -0.2);
  upperStory.castShadow = true;
  house.add(upperStory);

  [-1.8, 0, 1.8].forEach((wx) => {
    const mushiko = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.08), shojiMat);
    mushiko.position.set(wx, 3.3, 1.32);
    house.add(mushiko);
  });

  // 7. Sweeping Irimoya Kawara Roof (4-sided pitched roof + ridge)
  const roofPyramid = new THREE.Mesh(new THREE.ConeGeometry(5.6, 1.95, 4), roofMat);
  roofPyramid.rotation.y = Math.PI / 4;
  roofPyramid.scale.set(1.22, 1, 0.72);
  roofPyramid.position.set(0, 4.92, -0.2);
  roofPyramid.castShadow = true;
  house.add(roofPyramid);

  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 0.28), roofMat);
  ridgeBeam.position.set(0, 5.75, -0.2);
  house.add(ridgeBeam);

  // Interior Warm Lantern PointLight glowing in front of the facade
  const interiorLight = new THREE.PointLight(0xffb454, 2.6, 9, 1.8);
  interiorLight.position.set(0, 1.6, 3.2);
  houseRoot.add(interiorLight);

  const overviewBox = addClickBox(houseRoot, 'house-overview', [8.0, 4.4, 6.5], [0, 2.2, 0], clickableTargets);
  const entranceBox = addClickBox(houseRoot, 'engawa-shoji', [6.0, 2.2, 1.5], [0, 1.1, 3.2], clickableTargets);

  new GLTFLoader().load(
    JAPANESE_HOUSE_MODEL_URL,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.rotation.y = HOUSE_YAW;

      // Normalize: longest horizontal side = HOUSE_FOOTPRINT, centered on x/z, bottom on y = 0
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const k = HOUSE_FOOTPRINT / Math.max(size.x, size.z, 0.001);
      model.scale.setScalar(k);
      const b2 = new THREE.Box3().setFromObject(model);
      const c2 = b2.getCenter(new THREE.Vector3());
      model.position.set(-c2.x, -b2.min.y, -c2.z);
      houseRoot.add(pivot);

      // Fit the invisible click targets to the real model bounds
      const fit = new THREE.Box3().setFromObject(pivot);
      const fs = fit.getSize(new THREE.Vector3());
      overviewBox.geometry.dispose();
      overviewBox.geometry = new THREE.BoxGeometry(fs.x, fs.y, fs.z);
      overviewBox.position.set(0, fs.y / 2, 0);
      entranceBox.geometry.dispose();
      entranceBox.geometry = new THREE.BoxGeometry(fs.x * 0.7, Math.min(2.4, fs.y * 0.55), 1.4);
      entranceBox.position.set(0, Math.min(2.4, fs.y * 0.55) / 2, fit.max.z - 0.4);
      interiorLight.position.set(0, 1.6, fit.max.z + 0.8);
    },
    undefined,
    () => {
      house.visible = true; // fallback to procedural machiya
    },
  );

  // 10. JAPANESE 3D CHARACTER MODEL STANDING IN FRONT OF HIS HOUSE
  const characterRig = createJapaneseCharacter(textures.contactShadow);
  characterRig.root.position.set(0, 0, 0.8);
  addClickBox(characterRig.root, 'character-intro', [1.1, 1.9, 1.0], [0, 0.95, 0], clickableTargets);
  root.add(characterRig.root);

  return {
    root,
    characterRig,
    interiorLight,
    clickableTargets,
  };
}
