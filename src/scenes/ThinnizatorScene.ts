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
  FilesInput,
  Tools,
} from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector';

import {
  Thinnizator,
  ThinnizatorPrefabToMeshesList,
} from 'src/library/Thinnizator';

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

const allNodesPredicate = (node: Mesh) => {
  return true;
};

const BASE_URL = 'https://babylonjs.nascor.tech/boxes/';

export class ThinnizatorScene {
  private _scene!: Scene;
  private _engine!: Engine;
  private _camera!: ArcRotateCamera;
  private _gui!: GUI.AdvancedDynamicTexture;
  private _filesInput!: FilesInput;

  private _showSpawnPoints = false;
  private _showPrefabMarkers = false;
  private _showBadges = false;

  private _thinnizator: Thinnizator;

  constructor(private _canvas: HTMLCanvasElement) {
    //
    this._thinnizator = new Thinnizator();
    this.createFileInput();
  }

  createFileInput() {
    this._filesInput = new FilesInput(
      this._engine,
      null,
      null,
      null,
      null,
      null,
      function () {
        Tools.ClearLogCache();
      },
      function () {
        //
      },
      null
    );
    this._filesInput.onProcessFileCallback = (
      file: File,
      name: string,
      extension: string
    ) => {
      if (
        extension.toLowerCase() === 'glb' ||
        extension.toLowerCase() === 'gltf'
      ) {
        this._scene.dispose();
        this.createScene();
        const file = this._filesInput.filesToLoad[0];
        this._loadFromFile(file);
        return true;
      } else {
        return false;
      }
    };
    this._filesInput.monitorElementForDragNDrop(this._canvas);
  }

  private _loadFromFile(file: File) {
    SceneLoader.Append('file:', file, this._scene, (loaded) => {
      // TODO: to const
      const newRootNode = new TransformNode('Thinnizator', this._scene);
      const root = loaded.meshes.find((m) => m.name === '__root__');
      if (root) {
        const ch = root.getChildTransformNodes()[0];
        const sizes = ch.getHierarchyBoundingVectors();
        const size = {
          x: sizes.max.x - sizes.min.x,
          y: sizes.max.y - sizes.min.y,
          z: sizes.max.z - sizes.min.z,
        };
        this._camera.radius = Math.max(Math.max(size.x, size.y), size.z) * 1.2;
        ch.setParent(newRootNode);
        root.dispose();
      }
    });
  }

  createScene() {
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

    scene.clearColor = new Color4(0, 0, 0, 1);
    const camera = new ArcRotateCamera(
      'cam1',
      -1.434,
      1.046,
      70,
      new Vector3(0, 20, 0),
      scene
    );
    this._camera = camera;
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

    const origin = MeshBuilder.CreateBox(
      'zero-zero-zero',
      { size: 1 },
      this._scene
    );
    const originMaterial = new StandardMaterial('origin', this._scene);
    const originColor = new Color3(1, 1, 0);
    originMaterial.diffuseColor = originColor;
    origin.material = originMaterial;

    this.setupScene();
    this.setupFps();

    engine.runRenderLoop(() => {
      scene.render();
    });

    return scene;
  }

  public showInspector() {
    if (!this._scene) {
      return;
    }
    debugger;
    void this._scene.debugLayer.show({
      overlay: true,
      embedMode: true,
    });
  }

  public loadModel(file: File) {
    this._loadFromFile(file);
  }

  public check(startNodeId: string | null) {
    // TODO: switch to id
    // const root = this._scene.transformNodes.find((n) => n.id === startNodeId);
    startNodeId = startNodeId ?? 'Thinnizator';
    const root = this._scene.transformNodes.find((n) => n.name === startNodeId);
    if (root) {
      const thinnables = this._thinnizator.getThinnables(
        root,
        // matchNodePrefixesPredicate,
        allNodesPredicate,
        this._scene
      );
      return thinnables;
    }

    return new Map<string, ThinnizatorPrefabToMeshesList>();
  }

  public thinnize(
    putPrefabsUnderThisNode: TransformNode | string,
    startNodeId: string | null
  ) {
    if (typeof putPrefabsUnderThisNode === 'string') {
      putPrefabsUnderThisNode =
        this._scene.getTransformNodeByName(putPrefabsUnderThisNode) ??
        new TransformNode(putPrefabsUnderThisNode, this._scene);
    }
    startNodeId = startNodeId ?? 'Thinnizator';
    const root = this._scene.transformNodes.find((n) => n.name === startNodeId);
    if (root) {
      const thinnizator = new Thinnizator();
      thinnizator.thInnIze(
        root,
        matchNodePrefixesPredicate,
        putPrefabsUnderThisNode,
        this._scene
      );
    }
  }

  public toggleSpawnPoints(visible = false) {
    this._showSpawnPoints = visible || !this._showSpawnPoints;
    if (this._showSpawnPoints) {
      this._thinnizator.showSpawnPositions(this._scene);
    } else {
      this._thinnizator.hideSpawnPositions(this._scene);
    }
  }

  public togglePrefabs(visible = false) {
    this._showPrefabMarkers = visible || !this._showPrefabMarkers;
    if (this._showPrefabMarkers) {
      this._thinnizator.showPrefabMarkers(this._scene);
    } else {
      this._thinnizator.hidePrefabMarkers(this._scene);
    }
  }

  public toggleBadges() {
    this._showBadges = !this._showBadges;
    if (this._showBadges) {
      this._thinnizator.showBadges(this._gui, this._scene);
    } else {
      this._thinnizator.hideBadges(this._gui);
    }
  }

  public highliteInstance(name: string) {
    this._thinnizator.highliteInstance(name, this._gui, this._scene);
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
    // this.applyAmbientOcclusion();
    // this.applyGlass();
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
