<template>
  <q-page class="row items-center justify-evenly">
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
