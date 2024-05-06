<template>
  <img alt="logo" class="logo" src="../assets/Logo_HD_blue.png" />
  <div class="creator" style="text-align: center;">Made by <br> PENG-YU CHENG, CHUAN-KAI LIU, YINE-ZHE CHUANG, CHIH
    CHUAN YANG</div>
  <div class="text">
    Listen to the video with
    <span class="vue">Video Eye</span>
  </div>
  <p class="tip">Press <code>選擇檔案</code> to edit audio description</p>

  <div class="actions">
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="handleFileChange">選擇檔案</a>
    </div>
    <div class="action">
      <a target="_blank" rel="noreferrer" @click="openOldFile">開啟舊檔</a>
    </div>
  </div>

  <div v-if="overlayVisible" class="overlay"></div>
  <Versions />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Versions from '../components/Versions.vue';
import router from '../router';

const overlayVisible = ref(false);

const handleFileChange = (e: MouseEvent) => {
  // 啟動覆蓋層
  overlayVisible.value = true;
  window.electron.ipcRenderer.send('file');
};

const openOldFile = (e: MouseEvent) => {
  router.push('/edit');
};

window.electron.ipcRenderer.on('get-video', (event, arg) => {
  console.log("file-name:", arg);
  if (arg.length > 0) {
    window.electron.ipcRenderer.send('start_PySceneDetect');
  }
});

window.electron.ipcRenderer.on('meow', (event, arg) => {
  console.log("wewew:", arg);
});

window.electron.ipcRenderer.once('start_PySceneDetect', (event, arg) => {
  console.log('start_PySceneDetect結束', arg);
  if(arg == 'Success') {
    // 顯示成功訊息
    console.log('成功');
    //切換至編輯頁面
    router.push('/edit');
    //關閉loading畫面
    overlayVisible.value = false;
  } else {
    // 顯示錯誤訊息
    console.log('失敗');
    handleFileChangeBack();
    overlayVisible.value = false;
  }
});
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3); /* 半透明黑色背景 */
  z-index: 999; /* 使覆蓋層位於最上層 */
}
</style>