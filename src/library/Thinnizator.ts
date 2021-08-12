//
//
// ThInnIzator
//
// Roland Csibrei, NascorTech ltd., 2021
//
//

import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  Scene,
  Matrix,
  Quaternion,
} from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

export interface ThinnizatorPrefabToMeshesList {
  prefab: Mesh;
  meshes: Mesh[];
}

export class Thinnizator {
  private _spawnPoints: { name: string; position: Vector3 }[] = [];
  public _prefabMarkers: { name: string; position: Vector3 }[] = [];

  private _showSpawnPoints = false;
  private _showBadges = false;
  private _showPrefabMarkers = false;

  private _spawnPointColor = new Color3(0, 1, 0);
  private _spawnPointColorHex = '#595';
  private _prefabMarkerColor = new Color3(0.5, 0, 0);
  private _prefabMarkerColorHex = '#f55';

  public showBadges(gui: GUI.AdvancedDynamicTexture, scene: Scene) {
    if (this._showSpawnPoints) {
      this.drawBadgesImpl(
        gui,
        this._spawnPoints,
        this._spawnPointColorHex,
        scene
      );
    }

    if (this._showPrefabMarkers) {
      this.drawBadgesImpl(
        gui,
        this._prefabMarkers,
        this._prefabMarkerColorHex,
        scene
      );
    }
  }

  drawBadgesImpl(
    gui: GUI.AdvancedDynamicTexture,
    nodes: { name: string; position: Vector3 }[],
    color: string,
    scene: Scene
  ) {
    nodes.forEach((node) => {
      const label = `${node.name
        .replace('prefabPosition-', '')
        .replace('spawnPosition-', '')}
        [${node.position.x.toFixed(3)}, ${node.position.y.toFixed(
        3
      )}, ${node.position.z.toFixed(3)}]`;
      const width = '300px';
      // if (width < 60) width = 60
      const height = '80px';
      const cornerRadius = 6;

      //

      const rect = new GUI.Rectangle();
      rect.paddingTopInPixels = 10;
      rect.width = width;
      rect.height = height;
      rect.thickness = 0;
      rect.color = color;
      rect.cornerRadius = cornerRadius;
      rect.name = `badge-rect-${node.name}`;
      rect.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      gui.addControl(rect);

      const btn = GUI.Button.CreateSimpleButton(
        `badge-btn-${node.name}`,
        label
      );
      btn.width = width;
      btn.height = height;
      btn.color = '#fff';
      btn.fontFamily = 'arial';
      btn.fontSizeInPixels = 14;
      btn.background = color;
      btn.paddingBottomInPixels = 2;
      btn.paddingTopInPixels = 2;
      btn.paddingLeftInPixels = 2;
      btn.paddingRightInPixels = 2;
      btn.cornerRadius = cornerRadius;
      btn.thickness = 0;

      btn.onPointerClickObservable.add(() => {
        //         const info = `Name: ${node.name}
        // Material: ${node.material?.name}
        // Position: [${node.position.x.toFixed(3)}, ${node.position.y.toFixed(
        //           3
        //         )}, ${node.position.z.toFixed(3)}]
        // Rotation: [${node.rotation.x.toFixed(3)}, ${node.rotation.y.toFixed(
        //           3
        //         )}, ${node.rotation.z.toFixed(3)}]
        // Scaling: [${node.scaling.x.toFixed(3)}, ${node.scaling.y.toFixed(
        //           3
        //         )}, ${node.scaling.z.toFixed(3)}]`;
        //         console.log(info, node);
      });

      rect.addControl(btn);
      const mesh = scene.getMeshByName(node.name);
      // rect.linkWithMesh(mesh);
      rect.linkOffsetYInPixels = -100;

      const line = new GUI.Line();
      line.connectedControl = btn;
      line.lineWidth = 4;
      line.color = '#fff';
      line.name = `badge-line-${node.name}`;
      gui.addControl(line);
      line.linkWithMesh(mesh);

      line.y2 = 40;
      // line.linkOffsetY = -100;
      line.linkOffsetX = 0;
      line.dash = [2, 2];
    });
  }

  public hideBadges(gui: GUI.AdvancedDynamicTexture) {
    const controls = gui.getDescendants();
    controls.forEach((c) => {
      if (c && c.name && c.name.startsWith('badge-')) {
        gui.removeControl(c);
      }
    });
  }

  public highliteInstance(
    name: string,
    gui: GUI.AdvancedDynamicTexture,
    scene: Scene
  ) {
    this.hideBadges(gui);
    const mesh = scene.getMeshByName(
      Thinnizator._getSpawnPointNameforMeshName(name)
    );
    if (mesh) {
      const nodes = [
        {
          name,
          position: mesh.getAbsolutePosition().clone(),
        },
      ];
      this.drawBadgesImpl(gui, nodes, this._spawnPointColorHex, scene);
    }
  }

  public highlitePrefab(
    name: string,
    gui: GUI.AdvancedDynamicTexture,
    scene: Scene
  ) {
    console.log(name);
    this.hideBadges(gui);
    const mesh = scene.getMeshByName(
      Thinnizator._getPrefabMarkerNameforMeshName(name)
    );
    if (mesh) {
      const nodes = [
        {
          name,
          position: mesh.getAbsolutePosition().clone(),
        },
      ];
      this.drawBadgesImpl(gui, nodes, this._prefabMarkerColorHex, scene);
    }
  }

  isPrefab(prefabs: Mesh[], mesh: Mesh) {
    return prefabs.findIndex((p) => p.name === mesh.name) > -1;
  }

  private static _getSpawnPointNameforMeshName(name: string) {
    return `spawnPoint-${name}`;
  }

  private static _getPrefabMarkerNameforMeshName(name: string) {
    return `prefabPosition-${name}`;
  }

  showPrefabMarkers(scene: Scene) {
    if (this._showPrefabMarkers === true) {
      return;
    }
    this._showPrefabMarkers = true;

    const prefabMarkersParent = new TransformNode('prefabPositions', scene);

    const prefabMaterial = new StandardMaterial('prefabMaterial', scene);
    prefabMaterial.diffuseColor = new Color3(1, 0, 0);
    prefabMaterial.emissiveColor = new Color3(1, 0, 0);
    prefabMaterial.disableLighting = true;

    this._prefabMarkers.forEach((prefab) => {
      const marker = MeshBuilder.CreateBox(
        Thinnizator._getPrefabMarkerNameforMeshName(prefab.name),
        { size: 1 },
        scene
      );
      marker.position = prefab.position;
      marker.material = prefabMaterial;
      marker.parent = prefabMarkersParent;
    });
  }

  hidePrefabMarkers(scene: Scene) {
    this._prefabMarkers.forEach((p) => {
      const mesh = scene.getMeshByName(
        Thinnizator._getPrefabMarkerNameforMeshName(p.name)
      );
      if (mesh) {
        mesh.dispose();
      }
    });

    const prefabMaterial = scene.getMaterialByName('prefabMaterial');
    prefabMaterial?.dispose();

    this._showPrefabMarkers = false;
  }

  showSpawnPositions(scene: Scene) {
    if (this._showSpawnPoints === true) {
      return;
    }
    this._showSpawnPoints = true;

    const spawnPositionsParent = new TransformNode('spawnPositions', scene);

    const spawnPositionMaterial = new StandardMaterial(
      'spawnPositionMaterial',
      scene
    );
    spawnPositionMaterial.diffuseColor = new Color3(0, 1, 0);

    this._spawnPoints.forEach((spawn) => {
      const box = MeshBuilder.CreateBox(
        Thinnizator._getSpawnPointNameforMeshName(spawn.name),
        { size: 1 },
        scene
      );
      box.position = spawn.position;
      box.material = spawnPositionMaterial;
      box.parent = spawnPositionsParent;
      box.visibility = 0.2;
    });
  }

  hideSpawnPositions(scene: Scene) {
    this._spawnPoints.forEach((p) => {
      const mesh = scene.getMeshByName(
        Thinnizator._getSpawnPointNameforMeshName(p.name)
      );
      if (mesh) {
        mesh.dispose();
      }
    });

    const spawnPositionMaterial = scene.getMaterialByName(
      'spawnPositionMaterial'
    );
    spawnPositionMaterial?.dispose();

    this._showSpawnPoints = false;
  }

  thInnIze(
    parentNode: TransformNode,
    predicate: (mesh: Mesh) => boolean,
    prefabsNode: TransformNode,
    scene: Scene
  ) {
    if (parentNode) {
      this.hidePrefabMarkers(scene);
      this.hideSpawnPositions(scene);

      const log: string[] = [];

      const thinnableConfig = this.getThinnables(parentNode, predicate, scene);

      const toDispose: Mesh[] = [];
      const prefabs: Mesh[] = [];

      thinnableConfig.forEach((config) => {
        const prefabMesh = config.prefab;
        const meshes = config.meshes;

        const bufferMatrices = new Float32Array(16 * meshes.length);
        for (let i = 0; i < meshes.length; i++) {
          const mesh = meshes[i];
          // if (isPrefab(prefabs, mesh)) continue

          const meshRotation = this.getAbsoluteRotation(mesh).clone();
          toDispose.push(mesh);

          const meshScale = mesh.parent
            ? (<Mesh>mesh.parent)?.scaling
            : mesh.scaling
            ? mesh.scaling
            : new Vector3(1, 1, 1);

          const thinPosition = mesh.getAbsolutePosition().clone(); // prefabMesh.position.subtract(mesh.position)
          const thinScale = meshScale;

          const rotationVector = meshRotation.toEulerAngles();
          rotationVector.z = 0;

          const matrix3 = Matrix.Compose(
            thinScale,
            rotationVector.toQuaternion(),
            thinPosition
          );
          matrix3.copyToArray(bufferMatrices, i * 16);

          log.push(
            `MATRIX3: ${mesh.name} using prefab ${prefabMesh.name} material ${
              prefabMesh.material?.name ?? 'n/a'
            } scaling ${thinScale.toString()} spawning at ${thinPosition.x}, ${
              thinPosition.y
            }, ${thinPosition.z}
              matrix3 (${matrix3.toArray().join(', ')})
                    `
          );
        }

        if (prefabMesh && prefabMesh.thinInstanceSetBuffer) {
          log.push(
            `THINNING prefab ${prefabMesh.name} ${
              bufferMatrices.length / 16
            } times`
          );
          // prefabMesh.thinInstanceAddSelf()

          prefabMesh.setParent(prefabsNode);
          const mat = prefabMesh.material;
          if (mat) {
            prefabMesh.material = mat.clone(`prefabMat-${mat.name}`);
            // prefabMesh.material.sideOrientation = Material.ClockWiseSideOrientation;

            prefabMesh.name = 'prefab-' + prefabMesh.name;
            prefabMesh.setAbsolutePosition(Vector3.Zero());
            prefabMesh.rotation = Vector3.Zero();
            prefabMesh.scaling = Vector3.One();
            prefabMesh.thinInstanceSetBuffer(
              'matrix',
              bufferMatrices,
              16,
              false
            );
          }
        }
      });

      console.log('toDispose', toDispose.map((m) => m.name).join(', '));
      console.log('prefabs', prefabs.map((m) => m.name).join(', '));

      toDispose.forEach((m) => {
        // do not dispose prefabs
        if (prefabs.findIndex((p) => p.name === m.name) === -1) {
          log.push('Disposing ' + m.name);
          m.dispose();
        }
      });

      // scene.transformNodes.forEach((n) => {
      //   if (n.getChildMeshes().length === 0) {
      //     n.dispose();
      //   }
      // });

      console.log('log:', log.join('\r\n'));
    }
  }

  getAbsoluteRotation(mesh: Mesh) {
    const rotation = Quaternion.Identity();
    const position = Vector3.Zero();

    mesh.getWorldMatrix().decompose(Vector3.Zero(), rotation, position);
    return rotation;
  }

  getThinnables(
    parentNode: TransformNode,
    predicate: (node: Mesh) => boolean,
    scene: Scene
  ): Map<string, ThinnizatorPrefabToMeshesList> {
    this._prefabMarkers.length = 0;
    this._spawnPoints.length = 0;

    const thinnableConfig = new Map<string, ThinnizatorPrefabToMeshesList>();

    const childMeshes = parentNode.getChildMeshes();
    const thinnables: {
      hash: string;
      node: string;
      id: string;
      materialName: string;
      meshPrefix: string;
      primitive: string;
      primitiveIndexFromName: string;
      parent: TransformNode | null;
    }[] = [];

    childMeshes.forEach((m) => {
      if (m.name === 'Circle.141') {
        debugger;
      }
      if (!predicate || predicate(<Mesh>m)) {
        let hashSuffix = m.material ? m.material.name : '';
        if (
          m.getChildMeshes().length > 0 &&
          m.parent &&
          m.parent.name !== parentNode.name
        ) {
          const allMeshes = m.parent.getChildMeshes();
          hashSuffix = allMeshes
            .map((m, idx) => {
              const suffix = m.material ? m.material.name : idx.toString();
              return suffix;
            })
            .join('-');
        }

        const node = m.name.split('.')[0];
        const primitive = m.name.split('_')[1];
        // TODO: make a better hash
        const hash = `${hashSuffix}-${m.getTotalVertices()}`;
        // TODO: don't use metadata
        m.metadata = { hash };
        const id = m.id;
        const materialName = m.material?.name;
        if (materialName) {
          const meshPrefix = m.name.split('_')[0];
          const primitiveIndexFromName = primitive?.substr(-1);
          thinnables.push({
            hash,
            node,
            id,
            materialName,
            meshPrefix,
            primitive,
            primitiveIndexFromName,
            parent: <TransformNode>m.parent,
          });
        }
      }
    });

    const uniqueThinnables = thinnables.filter(
      (p, idx, self) =>
        self.findIndex((s) => s && p && s.hash === p.hash) === idx
    );

    uniqueThinnables.forEach((thinnableGroup) => {
      const meshesForThinnableGroup = scene.meshes.filter(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (m) => m.metadata?.hash === thinnableGroup.hash
      );

      let prefab;

      // thinnize only when more than
      const thinnizatorTreshold = 2;
      if (meshesForThinnableGroup.length >= thinnizatorTreshold) {
        prefab = meshesForThinnableGroup[0];

        this._prefabMarkers.push({
          name: prefab.name,
          position: prefab.getAbsolutePosition(),
        });

        this._spawnPoints = this._spawnPoints.concat(
          meshesForThinnableGroup.map((m) => {
            return {
              name: m.name,
              position: m.getAbsolutePosition(),
            };
          })
        );

        const cfg: ThinnizatorPrefabToMeshesList = {
          prefab: <Mesh>prefab,
          meshes: <Mesh[]>meshesForThinnableGroup,
        };

        thinnableConfig.set(thinnableGroup.hash, cfg);
      }
    });

    console.log(
      'thinnableConfig',
      thinnableConfig,
      this._prefabMarkers,
      this._spawnPoints
    );

    return thinnableConfig;
  }
}
