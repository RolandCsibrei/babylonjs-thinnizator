//  Roland Csibrei, NascorTech ltd., 2021

import {
  ArcRotateCamera,
  Color3,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
  Scene,
  Material,
  SceneLoader,
  Color4,
} from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders';

import { Thinnizator } from 'src/library/Thinnizator';

const nodePrefixesToThinnize = [
  'Cube',
  'Kiosk',
  'Circle',
  'Mesh5310',
  'Vankus',
  'Tlaciaren',
  'Tabula',
  'HP11_3',
  'Mesh21293',
  'Mesh21145',
  'Box35939',
  'Mys',
  'Cylinder',
  'Mesh4121',
  'Object5467',
  'Plans',
  'Stolik maly',
  'Vstavane skriny typ1',
  'Stolík maly',
  'Plane',
  'Whiteboard_001',
  'Vstavana skrina typ1',
];

const matchNodePrefixesPredicate = (node: Mesh) => {
  if (node && node.name) {
    const matched =
      nodePrefixesToThinnize.findIndex((p) => node.name.startsWith(p)) > -1;
    return matched;
  }
  return false;
};

const BASE_URL = 'https://babylonjs.nascor.tech/boxes/';

export class ThinnizatorScene {
  private _scene!: Scene;
  private _engine!: Engine;
  private _gui!: GUI.AdvancedDynamicTexture;

  constructor(private _canvas: HTMLCanvasElement) {
    //
  }

  setupButton(button: GUI.Button) {
    button.width = 1;
    button.height = '40px';
    button.color = 'white';
    button.fontSizeInPixels = 12;
    button.background = '#333';
  }

  async createScene() {
    const engine = new Engine(this._canvas);
    this._engine = engine;
    if (!this._engine) {
      return;
    }

    const scene = new Scene(engine);
    this._scene = scene;

    if (!this._scene) {
      return;
    }

    scene.clearColor = new Color4(1, 0, 0, 1);
    const camera = new ArcRotateCamera(
      'cam1',
      -1.434,
      1.046,
      70,
      new Vector3(0, 20, 0),
      scene
    );
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this._canvas, true);

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 1;
    camera.maxZ = 10000;

    this._gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
      'UI',
      true,
      scene
    );

    const panel = new GUI.StackPanel();
    panel.width = '100px';

    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this._gui.addControl(panel);

    const btnThinnize = GUI.Button.CreateSimpleButton(
      'btnThinnize',
      'thInnIze'
    );
    const btnToggleSpawnPoints = GUI.Button.CreateSimpleButton(
      'btnToggleSpawnPoints',
      'Toggle spawn points'
    );
    const btnTogglePrefabs = GUI.Button.CreateSimpleButton(
      'btnTogglePrefabs',
      'Toggle prefabs position'
    );
    const btnToggleBadges = GUI.Button.CreateSimpleButton(
      'btnToggleBadges',
      'Toggle badges'
    );

    this.setupButton(btnThinnize);
    this.setupButton(btnToggleBadges);
    this.setupButton(btnTogglePrefabs);
    this.setupButton(btnToggleSpawnPoints);

    // const putPrefabsUnderThisNode = new TransformNode('prefabsParent', scene);

    btnThinnize.onPointerClickObservable.add(() => {
      const root = scene.transformNodes.find((n) => n.name === 'Building');
      if (root) {
        void scene.debugLayer.show({});
        const thinnizator = new Thinnizator();
        const thinnables = thinnizator.getThinnables(
          root,
          matchNodePrefixesPredicate,
          scene
        );
        console.log(thinnables);
        // thinnizator.thInnIze(
        //   root,
        //   matchNodePrefixesPredicate,
        //   putPrefabsUnderThisNode,
        //   this._scene
        // );
      }
      btnThinnize.isEnabled = false;
    });

    // btnToggleSpawnPoints.onPointerClickObservable.add(() => {
    //   this._showSpawnPoints = !this._showSpawnPoints;
    //   this._spawnPoints.forEach((p) => p.setEnabled(this._showSpawnPoints));
    // });

    // btnTogglePrefabs.onPointerClickObservable.add(() => {
    //   this._showPrefabMarkers = !this._showPrefabMarkers;
    //   this._prefabMarkers.forEach((p) => p.setEnabled(this._showPrefabMarkers));
    // });

    // btnToggleBadges.onPointerClickObservable.add(() => {
    //   this._showBadges = !this._showBadges;
    //   if (this._showBadges) {
    //     this.drawBadges();
    //   } else {
    //     this.clearBadges();
    //   }
    // });

    panel.addControl(btnThinnize);
    panel.addControl(btnToggleBadges);
    panel.addControl(btnTogglePrefabs);
    panel.addControl(btnToggleSpawnPoints);

    const origin = MeshBuilder.CreateBox(
      'zero-zero-zero',
      { size: 1 },
      this._scene
    );
    const originMaterial = new StandardMaterial('origin', this._scene);
    const originColor = new Color3(1, 1, 0);
    originMaterial.diffuseColor = originColor;
    origin.material = originMaterial;

    const buildingNode = new TransformNode('Building', this._scene);

    const loaded = await SceneLoader.ImportMeshAsync(
      '',
      BASE_URL,
      'floor.glb',
      scene
    );
    const root = loaded.meshes[0];
    const floorNode = root.getChildTransformNodes()[0];
    floorNode.setParent(buildingNode);
    root.dispose();
    this.setupScene();
    this.setupFps();

    engine.runRenderLoop(() => {
      scene.render();
    });

    return scene;
  }

  setupFps() {
    const rect1 = new GUI.Rectangle();
    rect1.width = 0.1;
    rect1.height = '40px';
    rect1.cornerRadius = 4;
    rect1.color = 'Orange';
    rect1.thickness = 0;
    rect1.background = 'black';
    rect1.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rect1.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this._gui.addControl(rect1);

    const label = new GUI.TextBlock();
    label.text = '0 FPS';
    label.color = '#ffffff';

    rect1.addControl(label);

    this._scene.onBeforeRenderObservable.add(() => {
      label.text = this._engine.getFps().toFixed() + ' FPS';
    });
  }

  setupScene() {
    this.applyAmbientOcclusion();
    this.applyGlass();
  }

  getFloorNode(floor: string) {
    const floorobj = this._scene.transformNodes.find(
      (m) => m.name === `Floor ${floor} Objects`
    );
    return floorobj;
  }

  applyAmbientOcclusion() {
    const prefix = 'Floor 2 Architecture All_primitive';
    const meshes = this._scene.meshes.filter((m) => m.name.startsWith(prefix));
    const texture = new Texture(`${BASE_URL}floor-ao.png`, this._scene);
    texture.gammaSpace = false;
    texture.uScale = 1;
    texture.vScale = -1;
    texture.coordinatesIndex = 1;

    meshes.forEach((mesh) => {
      let material = mesh.material;
      if (!material) {
        material = new PBRMaterial('AO-floor', this._scene);
        mesh.material = material;
      }

      if (material instanceof PBRMaterial) {
        material.lightmapTexture = texture;
        material.useLightmapAsShadowmap = true;
      }
    });
  }

  applyGlass() {
    const materialName = 'Glass';

    this._scene.materials.forEach((m) => {
      if (m.name.startsWith(materialName)) {
        m.alpha = 0.2;
        m.transparencyMode = Material.MATERIAL_ALPHABLEND;
        m.alphaMode = 4; // ALPHA_MULTIPLY
      }
    });
  }
}
