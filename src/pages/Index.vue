<template>
  <q-page>
    <babylon-scene-viewer />
  </q-page>
</template>

<script lang="ts">
import BabylonSceneViewer from 'src/components/BabylonSceneViewer.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PageIndex',
  components: { BabylonSceneViewer },
});
</script>
