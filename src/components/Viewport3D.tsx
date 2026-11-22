import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  AR_BACKDROP_IMAGES,
  ArBackdropMode,
  JAPANESE_PAVILION_STOPS,
  LAHORE_FORT_STOPS,
  LightingPreset,
  ModuleId,
  TourStop,
} from '../data/tourData';
import {
  buildJapanesePavilionScene,
  JAPANESE_CHARACTER_MODEL_URL,
  JapanesePavilionBuildResult,
} from '../three/japaneseScene';
import {
  buildLahoreFortScene,
  CharacterRig,
  LAHORE_GUIDE_MODEL_URL,
  LahoreFortBuildResult,
} from '../three/lahoreFortScene';
import { createProceduralTexturePack } from '../three/proceduralTextures';

interface Viewport3DProps {
  activeModule: ModuleId;
  activeStop: TourStop;
  isSpeaking: boolean;
  speechAmplitudeRef: React.MutableRefObject<number>;
  arBackdropMode: ArBackdropMode;
  lightingPreset: LightingPreset;
  customLahoreModelUrl: string | null;
  customJapaneseModelUrl: string | null;
  onSelectStop: (stopId: string) => void;
  onCameraError: (message: string) => void;
}

// Pre-allocated math helpers outside render loop (zero GC)
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _guideTargetPos = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  activeModule,
  activeStop,
  isSpeaking,
  speechAmplitudeRef,
  arBackdropMode,
  lightingPreset,
  customLahoreModelUrl,
  customJapaneseModelUrl,
  onSelectStop,
  onCameraError,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Latest props stored in refs so WebGL scene never tears down on state changes
  const activeModuleRef = useRef(activeModule);
  const activeStopRef = useRef(activeStop);
  const isSpeakingRef = useRef(isSpeaking);
  const arBackdropModeRef = useRef(arBackdropMode);
  const lightingPresetRef = useRef(lightingPreset);
  const onSelectStopRef = useRef(onSelectStop);

  activeModuleRef.current = activeModule;
  activeStopRef.current = activeStop;
  isSpeakingRef.current = isSpeaking;
  arBackdropModeRef.current = arBackdropMode;
  lightingPresetRef.current = lightingPreset;
  onSelectStopRef.current = onSelectStop;

  // Imperative bridge refs for scene transitions and custom GLTF loading
  const sceneControlRef = useRef<{
    triggerCameraGlide: (stop: TourStop) => void;
    applySceneState: () => void;
    loadCustomModel: (targetModule: ModuleId, url: string | null) => void;
  } | null>(null);

  // Handle Live Camera AR Video Feed
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      if (arBackdropMode !== 'live-camera') {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onCameraError('Live camera API unavailable in this browser; showing AR photo backdrop.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) {
          onCameraError('Camera access declined; switched to simulated AR courtyard backdrop.');
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [arBackdropMode, onCameraError]);

  // Mount Three.js WebGLRenderer once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      120,
    );
    camera.position.set(
      activeStopRef.current.cameraPos[0],
      activeStopRef.current.cameraPos[1],
      activeStopRef.current.cameraPos[2],
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.target.set(
      activeStopRef.current.cameraTarget[0],
      activeStopRef.current.cameraTarget[1],
      activeStopRef.current.cameraTarget[2],
    );
    controls.update();

    // 3-Point Studio + Outdoor Rig (Warm Key, Cool Hemi Fill, Rim Backlight)
    const hemiLight = new THREE.HemisphereLight(0xcbe2ff, 0x6b4f3a, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe6c2, 1.85);
    keyLight.position.set(8, 12, 7);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 36;
    const d = 11;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9ec5ff, 0.75);
    rimLight.position.set(-7, 6, -8);
    scene.add(rimLight);

    // Procedural textures & both 3D modules
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTexturePack(maxAnisotropy);

    const lahoreBuild: LahoreFortBuildResult = buildLahoreFortScene(textures, false);
    const japaneseBuild: JapanesePavilionBuildResult = buildJapanesePavilionScene(textures, false);
    scene.add(lahoreBuild.root);
    scene.add(japaneseBuild.root);

    // Subtle AR spatial floor reticle ring (visible in AR Backdrop / Live Camera modes)
    const arReticle = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 4.72, 64),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.48,
      }),
    );
    arReticle.rotation.x = -Math.PI / 2;
    arReticle.position.y = 0.03;
    scene.add(arReticle);

    // Animation Mixers for custom uploaded GLTF models
    let lahoreCustomMixer: THREE.AnimationMixer | null = null;
    let japaneseCustomMixer: THREE.AnimationMixer | null = null;
    const gltfLoader = new GLTFLoader();

    function applySceneState() {
      const mod = activeModuleRef.current;
      const arMode = arBackdropModeRef.current;
      const preset = lightingPresetRef.current;
      const isTransparentAr = arMode !== 'studio-3d';

      lahoreBuild.root.visible = mod === 'lahore-fort';
      japaneseBuild.root.visible = mod === 'japanese-pavilion';
      arReticle.visible = isTransparentAr;

      if (isTransparentAr) {
        scene.background = null;
        scene.fog = null;
        renderer.setClearColor(0x000000, 0);
      } else if (preset === 'twilight') {
        const bgCol = mod === 'lahore-fort' ? 0x121622 : 0x101724;
        scene.background = new THREE.Color(bgCol);
        scene.fog = new THREE.FogExp2(bgCol, 0.028);
        renderer.setClearColor(bgCol, 1);
      } else {
        const bgCol = mod === 'lahore-fort' ? 0x1b1714 : 0x171b20;
        scene.background = new THREE.Color(bgCol);
        scene.fog = new THREE.FogExp2(bgCol, 0.025);
        renderer.setClearColor(bgCol, 1);
      }

      if (preset === 'twilight') {
        keyLight.color.setHex(0x9fb8f5);
        keyLight.intensity = 1.05;
        hemiLight.intensity = 0.55;
        japaneseBuild.interiorLight.intensity = 4.2;
      } else {
        keyLight.color.setHex(0xffe4bd);
        keyLight.intensity = 1.85;
        hemiLight.intensity = 0.78;
        japaneseBuild.interiorLight.intensity = 2.4;
      }
    }

    // Smooth camera glide state (cancelled immediately when user grabs OrbitControls)
    let isGliding = false;
    function triggerCameraGlide(stop: TourStop) {
      _targetPos.set(stop.cameraPos[0], stop.cameraPos[1], stop.cameraPos[2]);
      _targetLook.set(stop.cameraTarget[0], stop.cameraTarget[1], stop.cameraTarget[2]);
      isGliding = true;
    }

    controls.addEventListener('start', () => {
      isGliding = false;
    });

    function loadCustomModel(targetModule: ModuleId, url: string | null) {
      // The Akbar Badshah model is a full standing figure, so it uses the same height as the Japanese guide
      const targetHeight = 1.78;
      const rig: CharacterRig =
        targetModule === 'lahore-fort' ? lahoreBuild.guideRig : japaneseBuild.characterRig;

      // Clear previous custom children
      while (rig.customModelContainer.children.length > 0) {
        rig.customModelContainer.remove(rig.customModelContainer.children[0]);
      }
      if (targetModule === 'lahore-fort') lahoreCustomMixer = null;
      else japaneseCustomMixer = null;

      if (!url) {
        rig.bodyGroup.visible = true;
        rig.hasCustomModel = false;
        return;
      }

      gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = !isSoftwareGl;
              child.receiveShadow = true;
            }
          });

          // Normalize height (see targetHeight) and ground bottom-center at y = 0
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const scaleFactor = size.y > 0.001 ? targetHeight / size.y : 1;
          model.scale.setScalar(scaleFactor);

          const scaledBox = new THREE.Box3().setFromObject(model);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          model.position.x -= scaledCenter.x;
          model.position.z -= scaledCenter.z;
          model.position.y -= scaledBox.min.y;

          rig.bodyGroup.visible = false;
          rig.hasCustomModel = true;
          rig.customModelContainer.add(model);

          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
            if (targetModule === 'lahore-fort') lahoreCustomMixer = mixer;
            else japaneseCustomMixer = mixer;
          }
        },
        undefined,
        () => {
          rig.bodyGroup.visible = true;
          rig.hasCustomModel = false;
        },
      );
    }

    sceneControlRef.current = {
      triggerCameraGlide,
      applySceneState,
      loadCustomModel,
    };

    applySceneState();
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting on layer 1 with click-vs-drag protection
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_pointerNdc, camera);
      const targets =
        activeModuleRef.current === 'lahore-fort'
          ? lahoreBuild.clickableTargets
          : japaneseBuild.clickableTargets;
      const hits = raycaster.intersectObjects(targets, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return; // User was orbiting, not clicking

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_pointerNdc, camera);

      const targets =
        activeModuleRef.current === 'lahore-fort'
          ? lahoreBuild.clickableTargets
          : japaneseBuild.clickableTargets;
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const landmarkId = hits[0].object.userData.landmarkId as string | undefined;
        if (landmarkId) {
          onSelectStopRef.current(landmarkId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop with software WebGL pacing
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function animateRigSpeaking(rig: CharacterRig, elapsed: number, delta: number, speaking: boolean, amp: number) {
      // Lip-sync jaw opening
      const targetJaw = speaking ? 0.08 + amp * 0.42 : 0;
      rig.jawGroup.rotation.x = THREE.MathUtils.damp(rig.jawGroup.rotation.x, targetJaw, 18, delta);

      // Gentle breathing & speaking head/arm kinematics
      const breath = Math.sin(elapsed * 2.1) * 0.012;
      rig.bodyGroup.position.y = breath;
      rig.customModelContainer.position.y = speaking ? Math.abs(Math.sin(elapsed * 5.2)) * 0.015 : breath;

      const targetHeadPitch = speaking ? Math.sin(elapsed * 4.2) * 0.08 : Math.sin(elapsed * 1.1) * 0.025;
      const targetHeadYaw = speaking ? Math.sin(elapsed * 2.3) * 0.14 : 0;
      rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, targetHeadPitch, 8, delta);
      rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, targetHeadYaw, 8, delta);

      const targetRightArmX = speaking ? -0.75 + Math.sin(elapsed * 4.8) * 0.24 : -0.12;
      const targetRightArmZ = speaking ? -0.25 - Math.cos(elapsed * 3.1) * 0.1 : -0.06;
      const targetLeftArmX = speaking ? -0.38 + Math.cos(elapsed * 3.6) * 0.1 : -0.18;
      rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, targetRightArmX, 8, delta);
      rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, targetRightArmZ, 8, delta);
      rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, targetLeftArmX, 8, delta);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const speaking = isSpeakingRef.current;
      const amp = speechAmplitudeRef.current;
      const currentStop = activeStopRef.current;

      // Smooth exponential camera glide toward active landmark
      if (isGliding) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, 4.5, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLook.x, 4.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLook.y, 4.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLook.z, 4.5, delta);

        if (camera.position.distanceTo(_targetPos) < 0.04 && controls.target.distanceTo(_targetLook) < 0.04) {
          isGliding = false;
        }
      }

      controls.update();

      if (activeModuleRef.current === 'lahore-fort') {
        // Move Lahore Fort 3D Tourist Guide smoothly to stand beside clicked landmark
        const stop =
          LAHORE_FORT_STOPS.find((s) => s.id === currentStop.id) ?? LAHORE_FORT_STOPS[0];
        _guideTargetPos.set(stop.guideSpot[0], stop.guideSpot[1], stop.guideSpot[2]);
        const gRoot = lahoreBuild.guideRig.root;
        gRoot.position.x = THREE.MathUtils.damp(gRoot.position.x, _guideTargetPos.x, 3.8, delta);
        gRoot.position.z = THREE.MathUtils.damp(gRoot.position.z, _guideTargetPos.z, 3.8, delta);

        // Turn guide toward camera smoothly
        const angleToCam = Math.atan2(
          camera.position.x - gRoot.position.x,
          camera.position.z - gRoot.position.z,
        );
        gRoot.rotation.y = THREE.MathUtils.damp(gRoot.rotation.y, angleToCam, 5, delta);

        animateRigSpeaking(lahoreBuild.guideRig, elapsed, delta, speaking, amp);
        if (lahoreCustomMixer) lahoreCustomMixer.update(delta);

        // Animate AR landmark marker beacons & highlight active stop
        lahoreBuild.markers.forEach((m, id) => {
          const isActive = id === stop.id;
          m.beacon.rotation.y = elapsed * (isActive ? 2.4 : 1.0);
          const baseScale = isActive ? 1.35 + Math.sin(elapsed * 4) * 0.12 : 0.9;
          m.beacon.scale.setScalar(baseScale);
          m.ring.scale.setScalar(isActive ? 1.45 + Math.sin(elapsed * 3.5) * 0.15 : 1.0);
          (m.ring.material as THREE.MeshBasicMaterial).color.setHex(isActive ? 0x10b981 : 0xf59e0b);
          (m.beacon.material as THREE.MeshStandardMaterial).emissive.setHex(
            isActive ? 0x059669 : 0xd97706,
          );
        });
      } else {
        // Japanese Pavilion Module: still commander standing in front of the heritage house
        const jRoot = japaneseBuild.characterRig.root;
        // Commander stands perfectly still, facing forward in front of the heritage house
        jRoot.rotation.y = 0;
        jRoot.position.y = 0;
        japaneseBuild.characterRig.customModelContainer.position.y = 0;
        if (japaneseCustomMixer) japaneseCustomMixer.update(delta);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (isSoftwareGl) frameId = window.setTimeout(tick, 16);
    else frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      textures.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [speechAmplitudeRef]);

  // Trigger camera glide whenever activeStop changes
  useEffect(() => {
    sceneControlRef.current?.triggerCameraGlide(activeStop);
  }, [activeStop]);

  // Sync scene background, module visibility, and lighting preset
  useEffect(() => {
    sceneControlRef.current?.applySceneState();
  }, [activeModule, arBackdropMode, lightingPreset]);

  // Sync custom uploaded .glb models
  useEffect(() => {
    sceneControlRef.current?.loadCustomModel('lahore-fort', customLahoreModelUrl ?? LAHORE_GUIDE_MODEL_URL);
  }, [customLahoreModelUrl]);

  useEffect(() => {
    // Falls back to the bundled Japanese character GLB when no custom model is uploaded
    sceneControlRef.current?.loadCustomModel(
      'japanese-pavilion',
      customJapaneseModelUrl ?? JAPANESE_CHARACTER_MODEL_URL,
    );
  }, [customJapaneseModelUrl]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0e1116]">
      {/* AR Simulated Photo Backdrop */}
      {arBackdropMode === 'ar-backdrop' && (
        <img
          src={AR_BACKDROP_IMAGES[activeModule]}
          alt={
            activeModule === 'lahore-fort'
              ? 'Lahore Fort courtyard AR backdrop'
              : 'Traditional Japanese machiya garden AR backdrop'
          }
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none select-none"
        />
      )}

      {/* Live Device Camera Feed for AR View */}
      {arBackdropMode === 'live-camera' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Scrim over photo/camera backdrop to keep 3D shadows and HUD crisp */}
      {arBackdropMode !== 'studio-3d' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,12,16,0.42) 0%, rgba(10,12,16,0.12) 45%, rgba(10,12,16,0.65) 100%)',
          }}
        />
      )}

      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Graceful Fallback if WebGL unavailable */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#12161d] p-8 text-center">
          <img
            src={AR_BACKDROP_IMAGES[activeModule]}
            alt="Heritage landmark preview"
            referrerPolicy="no-referrer"
            className="w-full max-w-2xl rounded-xl object-cover aspect-video mb-6 border border-white/10"
          />
          <h2 className="font-display text-2xl text-[#f4f1ea] mb-2">{activeStop.name}</h2>
          <p className="text-sm text-[#b9b4aa] max-w-lg">{activeStop.summary}</p>
        </div>
      )}
    </div>
  );
};