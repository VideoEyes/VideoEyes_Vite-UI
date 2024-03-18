<script setup lang="ts">

import Versions from '../components/Versions.vue'

import router from '../router';

const handleFileChange = (e) => {

  window.electron.ipcRenderer.send('file')

};

window.electron.ipcRenderer.on('get-video', (event, arg) => {
  console.log("file-name:", arg)
  if (arg.length > 0) {
    router.push('/edit');
  }
})

</script>

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
  </div>
  <Versions />
</template>
