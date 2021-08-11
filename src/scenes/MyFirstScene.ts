import {
  Engine,
  Scene,
  Vector3,
  StandardMaterial,
  HemisphericLight,
  SceneLoader,
  ArcRotateCamera,
  Mesh,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { MeshFingerprint } from 'src/library/MeshFingerprint';

const loadMesh = async (file: string, meshNames: string[], scene: Scene) => {
  const loaded = await SceneLoader.ImportMeshAsync(
    meshNames,
    '/models/',
    file,
    scene
  );
  return <Mesh>loaded.meshes[1];
};

const setupCameraAndLight = (scene: Scene, canvas: HTMLCanvasElement) => {
  const camera = new ArcRotateCamera(
    'camera1',
    1,
    1,
    40,
    new Vector3(0, 0, 0),
    scene
  );
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);

  //

  new HemisphericLight('light', Vector3.Up(), scene);
};

const createScene = async (canvas: HTMLCanvasElement) => {
  const engine = new Engine(canvas);
  const scene = new Scene(engine);

  const m1 = await loadMesh('distorted-cube-01.glb', ['Cube'], scene);
  m1.position.x = -6;

  const m2 = await loadMesh('distorted-cube-02.glb', ['Cube'], scene);
  m2.position.x = 6;

  // const meshFingerprint = new MeshFingerprint();
  MeshFingerprint.createFingerprint(m1);

  setupCameraAndLight(scene, canvas);

  const material = new StandardMaterial('material', scene);
  m1.material = material;
  m2.material = material;

  engine.runRenderLoop(() => {
    scene.render();
  });
};

export { createScene };
