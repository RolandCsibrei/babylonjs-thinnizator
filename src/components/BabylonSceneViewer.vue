<template>
  <q-splitter v-model="splitterModel">
    <template v-slot:before>
      <q-splitter v-model="infoSplitterModel">
        <template v-slot:before>
          <q-list v-if="thinnableItems" class="col" separator>
            <q-item class="items-center">
              <q-item-label :lines="1">Prefabs</q-item-label>
            </q-item>
            <q-item
              v-for="(item, idx) in thinnableItems"
              :key="idx"
              clickable
              @click="thinnableSelected = item[0]"
            >
              <q-item-section>
                {{ item[1].prefabName }}
              </q-item-section>
              <q-item-section side>
                {{ item[1].spawnPointsCount }}
              </q-item-section>
            </q-item>
          </q-list>
        </template>
        <template v-slot:after>
          <q-list
            v-if="thinnableItemsForSelectedThinnable"
            separator
            class="col"
          >
            <q-item class="items-center">
              <q-item-label>Thin instances</q-item-label>
            </q-item>
            <q-item
              v-for="item in thinnableItemsForSelectedThinnable"
              :key="item.replacedMeshName"
              clickable
              @mouseenter="highliteInstance(item.replacedMeshName)"
            >
              <q-item-section>
                {{ item.replacedMeshName }}
              </q-item-section>
              <q-item-section>
                <div class="row items-center">
                  <q-chip
                    color="red-5"
                    size="sm"
                    class="col-4 position-info-chip no-margin"
                    >{{ item.replacedMeshPosition.x }}</q-chip
                  >

                  <q-chip
                    color="green"
                    size="sm"
                    class="col-4 position-info-chip no-margin"
                    >{{ item.replacedMeshPosition.y }}</q-chip
                  >
                  <q-chip
                    color="blue"
                    size="sm"
                    class="col-4 position-info-chip no-margin"
                    >{{ item.replacedMeshPosition.z }}</q-chip
                  >
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-splitter>
    </template>
    <template v-slot:after>
      <div class="no-scroll overflow-hidden row">
        <div class="col-12 q-ma-md q-gutter-sm">
          <q-file
            v-model="filesToLoad"
            filled
            label="Select a GLB or GLTF model file or drag one on the scene"
            accept=".glb, .gltf"
            @rejected="onRejected"
            @change="loadModel"
          />
        </div>
        <div class="col-12 q-ma-md q-gutter-sm">
          <q-btn label="Check scene" color="positive" @click="checkScene" />
          <q-btn label="Toggle badges" color="primary" @click="toggleBadges" />
          <q-btn
            label="Toggle prefabs"
            color="primary"
            @click="togglePrefabs"
          />
          <q-btn
            label="Toggle thin instances"
            color="primary"
            @click="toggleInstances"
          />
          <q-btn label="Thinnize" color="negative" @click="thinnize" />
          <q-btn label="Show inspector" color="orange" @click="showInspector" />
        </div>
        <div id="holder" class="col-12 full-height">
          <canvas ref="bjsCanvas" height="600" />
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

    const highliteInstance = (name: string) => {
      if (!scene) {
        return;
      }

      scene.highliteInstance(name);
    };

    const thinnableSelected = ref('');
    const thinnablesList = ref<Map<
      string,
      ThinnizatorPrefabToMeshesList
    > | null>(null);

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
          // material: string,
          prefabPosition: Vector3;
          spawnPointsCount: number;
        }
      >();

      thinnablesList.value?.forEach((value, key) => {
        ti.set(key, {
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

    const loadModel = () => {
      const files = filesToLoad.value;
      const file = Array.isArray(files) && files.length > 0 ? files[0] : files;
      scene?.loadModel(<File>file);
    };

    const checkScene = () => {
      if (scene) {
        const thinnables = scene.check(null);
        if (thinnablesList) {
          thinnablesList.value = thinnables;
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
      startNodeId,
      startNodes,
      filesToLoad,
      showInspector,
      highliteInstance,
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

      onRejected(rejectedEntries: any) {
        // Notify plugin needs to be installed
        // https://quasar.dev/quasar-plugins/notify#Installation
        // $q.notify({
        //   type: 'negative',
        //   message: `${rejectedEntries.length} file(s) did not pass validation constraints`,
        // });
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
</style>
