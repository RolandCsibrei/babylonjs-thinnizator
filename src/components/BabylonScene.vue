<template>
  <div id="holder" style="width: 100%; height: 800px">
    <canvas ref="bjsCanvas" class="col" />
  </div>
</template>

<script>
import { ref, onMounted } from '@vue/runtime-core';
import { ThinnizatorScene } from '../scenes/ThinnizatorScene';

export default {
  name: 'BabylonScene',
  setup() {
    const bjsCanvas = ref(null);

    onMounted(async () => {
      if (bjsCanvas.value) {
        const holder = document.getElementById('holder');
        bjsCanvas.value.width = holder.clientWidth;
        bjsCanvas.value.height = holder.offsetHeight;
        const scene = new ThinnizatorScene(bjsCanvas.value);
        await scene.createScene();
      }
    });

    return {
      bjsCanvas,
    };
  },
};
</script>
