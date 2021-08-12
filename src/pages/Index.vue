<template>
  <q-page>
    <babylon-scene />
  </q-page>
</template>

<script lang="ts">
import BabylonScene from 'components/BabylonScene.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PageIndex',
  components: { BabylonScene },
});
</script>
