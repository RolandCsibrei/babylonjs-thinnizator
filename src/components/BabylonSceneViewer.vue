<template>
  <q-splitter v-model="splitterModel">
    <template v-slot:before>
      <div class="q-pa-md bg-grey-10">
        <div class="text-h6 q-mb-md">BabylonJS thInnIzator Playground</div>
        <div class="q-gutter-sm row">
          <div class="col">
            <q-file
              v-model="filesToLoad"
              filled
              label="Select a GLB or GLTF model file or drag one onto the scene"
              accept=".glb, .gltf"
              max-file-size="80971520"
              @rejected="onRejected"
              @change="loadModel"
            />
          </div>
          <div class="col-1 q-mr-sm">
            <q-btn label="Load demo" color="orange" @click="loadDemo" />
          </div>
        </div>
      </div>
      <div class="q-pa-md">
        <div>
          <q-chip>{{ allMeshesCount }}</q-chip>
          <q-chip>{{ allVerticesCount }}</q-chip>
        </div>
      </div>
      <q-splitter v-model="infoSplitterModel">
        <template v-slot:before>
          <q-list v-if="thinnableItems" class="col" separator>
            <q-item>
              <q-item-section>Prefabs</q-item-section>
              <q-item-section side>Thinnized count</q-item-section>
            </q-item>
          </q-list>
          <q-scroll-area style="height: calc(100vh - 270px)">
            <q-list v-if="thinnableItems" class="col" separator>
              <q-item v-for="(item, idx) in thinnableItems" :key="idx" clickable @click="thinnableSelected = item[0]" @mouseenter="highlitePrefab(item[1].parentName)">
                <q-item-section>
                  <q-item-label>
                    {{ item[1].prefabName }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ item[0] }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  {{ item[1].spawnPointsCount }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </template>
        <template v-slot:after>
          <q-list separator class="col">
            <q-item>
              <q-item-section>Thin instances</q-item-section>
              <q-item-section side>Position</q-item-section>
            </q-item>
          </q-list>
          <q-scroll-area style="height: calc(100vh - 320px)">
            <q-list v-if="thinnableItemsForSelectedThinnable" separator class="col">
              <q-item v-for="item in thinnableItemsForSelectedThinnable" :key="item.replacedMeshName" clickable @mouseenter="highliteInstance(item.replacedMeshName)">
                <q-item-section>
                  {{ item.replacedMeshName }}
                </q-item-section>
                <q-item-section>
                  <div class="row items-center">
                    <q-chip color="red-5" size="sm" class="col-4 position-info-chip no-margin">{{ item.replacedMeshPosition.x }}</q-chip>

                    <q-chip color="green" size="sm" class="col-4 position-info-chip no-margin">{{ item.replacedMeshPosition.y }}</q-chip>
                    <q-chip color="blue" size="sm" class="col-4 position-info-chip no-margin">{{ item.replacedMeshPosition.z }}</q-chip>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </template>
      </q-splitter>
    </template>
    <template v-slot:after>
      <div class="no-scroll overflow-hidden row q-mr-md">
        <div class="col-12 row q-mx-lg q-my-md q-col-gutter-xs">
          <div>
            <q-btn label="Check scene" color="positive" @click="checkScene" />
          </div>
          <div>
            <q-btn label="Toggle prefabs" color="primary" @click="togglePrefabs">
              <q-badge color="red" floating>{{ prefabsCount }}</q-badge>
            </q-btn>
          </div>
          <div>
            <q-btn label="Toggle thin instances" color="primary" @click="toggleInstances">
              <q-badge color="green" floating>{{ instancesCount }}</q-badge>
            </q-btn>
          </div>
          <q-space />
          <div>
            <q-btn label="Thinnize" color="negative" @click="thinnize" />
          </div>
          <div class="q-mr-lg">
            <q-btn label="Show inspector" color="orange" @click="showInspector" />
          </div>
        </div>
        <div id="holder" class="col-12 q-ml-md">
          <canvas ref="bjsCanvas" style="height: calc(100vh - 100px)" />
        </div>
      </div>
    </template>
  </q-splitter>
</template>

<script lang="ts">
import { ref, onMounted, computed } from '@vue/runtime-core';
import { ThinnizatorScene } from '../scenes/ThinnizatorScene';
import { ThinnizatorPrefabToMeshesList } from 'src/library/Thinnizator';
import { Vector3 } from '@babylonjs/core';
import { useQuasar } from 'quasar';

export default {
  name: 'BabylonScene',
  setup() {
    const $q = useQuasar();

    const filesToLoad = ref<File[]>([]);

    const allMeshesCount = ref('0 vertices');
    const allVerticesCount = ref('0 meshes');

    const prefabsCount = ref(0);
    const instancesCount = ref(0);

    const splitterModel = ref(40);
    const infoSplitterModel = ref(40);
    const startNodeId = ref('');
    const startNodes = ref<{ name: string; id: string }[]>([]);
    const bjsCanvas = ref<HTMLCanvasElement | null>(null);
    let scene: ThinnizatorScene | undefined;

    onMounted(() => {
      const canvas = bjsCanvas.value;
      if (canvas) {
        const holder = document.getElementById('holder');
        if (holder) {
          canvas.width = holder.clientWidth;
          canvas.height = holder.clientHeight;
        }
        scene = new ThinnizatorScene(canvas);
        scene.createScene();
      }
    });

    const highlitePrefab = (name: string) => {
      if (!scene) {
        return;
      }

      scene.highlitePrefab(name);
    };

    const highliteInstance = (name: string) => {
      if (!scene) {
        return;
      }

      scene.highliteInstance(name);
    };

    const thinnableSelected = ref('');
    const thinnablesList = ref<Map<string, ThinnizatorPrefabToMeshesList> | null>(null);

    const thinnableItemsForSelectedThinnable = computed(() => {
      let ti: {
        replacedMeshName: string;
        replacedMeshPosition: {
          x: string;
          y: string;
          z: string;
        };
      }[] = [];
      thinnablesList.value?.forEach((value, key) => {
        if (key === thinnableSelected.value) {
          ti = value.meshes.map((m) => {
            return {
              replacedMeshName: m.name,
              replacedMeshPosition: {
                x: m.getAbsolutePosition()._x.toFixed(4),
                y: m.getAbsolutePosition()._y.toFixed(4),
                z: m.getAbsolutePosition()._z.toFixed(4),
              },
            };
          });
        }
      });

      return ti;
    });

    const thinnableItems = computed(() => {
      const ti = new Map<
        string,
        {
          prefabName: string;
          parentName?: string;
          // material: string,
          prefabPosition: Vector3;
          spawnPointsCount: number;
        }
      >();

      thinnablesList.value?.forEach((value, key) => {
        ti.set(key, {
          parentName: value.prefab.parent?.name,
          prefabName: value.prefab.name,
          prefabPosition: value.prefab.getAbsolutePosition(),
          spawnPointsCount: value.meshes.length,
        });
      });
      return ti;
    });

    const showInspector = () => {
      scene?.showInspector();
    };

    const reload = () => {
      scene?.reload();
    };

    const loadModel = () => {
      const files = filesToLoad.value;
      const file = Array.isArray(files) && files.length > 0 ? files[0] : files;
      scene?.loadModel(<File>file);
    };

    const loadDemo = () => {
      scene?.loadDemo();
    };

    const checkScene = () => {
      if (scene) {
        const info = scene.getSceneInfo();
        allMeshesCount.value = `${info.allMeshesCount} meshes`;
        allVerticesCount.value = `${info.allVerticesCount} vertices`;

        const thinnables = scene.check(null);
        if (thinnablesList) {
          thinnablesList.value = thinnables;
          prefabsCount.value = thinnables.size;
          instancesCount.value = Array.from(thinnables.values()).reduce((sum, t) => (sum += t.meshes.length), 0);
          scene.togglePrefabs(true);
          scene.toggleSpawnPoints(true);
        }
      }
    };

    const thinnize = () => {
      if (scene) {
        scene.thinnize('prefabs');
      }
    };

    const toggleBadges = () => {
      if (scene) {
        scene.toggleBadges();
      }
    };
    const togglePrefabs = () => {
      if (scene) {
        scene.togglePrefabs();
      }
    };
    const toggleInstances = () => {
      if (scene) {
        scene.toggleSpawnPoints();
      }
    };

    return {
      allVerticesCount,
      allMeshesCount,
      prefabsCount,
      instancesCount,
      startNodeId,
      startNodes,
      filesToLoad,
      showInspector,
      highliteInstance,
      highlitePrefab,
      thinnableItems,
      thinnableSelected,
      thinnableItemsForSelectedThinnable,
      checkScene,
      thinnize,
      toggleBadges,
      togglePrefabs,
      toggleInstances,
      splitterModel,
      infoSplitterModel,
      bjsCanvas,
      thinnablesList,
      filesImages: ref(null),
      filesMaxSize: ref(null),
      filesMaxTotalSize: ref(null),
      filesMaxNumber: ref(null),
      loadModel,
      loadDemo,
      reload,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onRejected(rejectedEntries: any) {
        if (Array.isArray(rejectedEntries)) {
          https: $q.notify({
            type: 'negative',
            message: `${rejectedEntries.length} file(s) did not pass validation constraints`,
          });
        }
      },
    };
  },
};
</script>

<style scoped>
.position-info-chip {
  min-width: 60px;
  text-align: center;
}
canvas {
  outline: none;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0); /* mobile webkit */
}
</style>
