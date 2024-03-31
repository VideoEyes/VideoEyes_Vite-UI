<script setup lang="ts">

import { toRefs, reactive, ref, onMounted } from 'vue'
import { useWindowSize } from "@vueuse/core";
import listen from "../picture/listen.png"
import store from "../picture/store.png"
import "../assets/edit.css"
import { app, protocol, net, BrowserWindow, ipcRenderer } from 'electron'
import path from 'node:path'
import router from '../router';

const inconlist = Object.values(import.meta.glob('../picture/scene/*', { eager: true })).map((v: any) => v.default);


onMounted(() => {
  
  const video = document.getElementById('video') as HTMLSourceElement;
  const video_path  = window.electron.ipcRenderer.sendSync('get-video-path');
  console.log('video_path', video_path)
  video.src = video_path;
})



// protocol.registerSchemesAsPrivileged([
//   {
//     scheme: 'animation',
//     privileges: {
//       bypassCSP: true,
//       stream: true,
//     }
//   }
// ])
// function createWindow() {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       nodeIntegration: false,
//       // preload: path.join(__dirname, 'preload.js')
//     }
//   })

//   // and load the index.html of the app.
//   mainWindow.loadFile('index.html')

//   app.whenReady().then(() => {
//     protocol.handle('animation', function (request) {
//       console.log('request.url', request.url)
//       return net.fetch('file://' + request.url.slice('animation://'.length))
//     })

//     createWindow()

//     app.on('activate', function () {

//       if (BrowserWindow.getAllWindows().length === 0) createWindow()
//     })
//   })
// }
// import "https://unpkg.com/open-props";
// import "https://unpkg.com/open-props/normalize.min.css";
const state = reactive({
  tools: [
    { id: 'listen', link: '#', image: listen, text: 'listen' },
    { id: 'store1', link: '#', image: store, text: 'store' },
    { id: 'store2', link: '#', image: store, text: 'store' }
  ],
  outside_tool_item: [
    { href: '#', id: 'listen', icon: "demo_png", alt: 'Home', content: 'Menu' },
    { href: '#', id: 'store', icon: "./assets2/demo.png", alt: 'About', content: 'Home' },
    { href: '#', id: 'store', icon: "", alt: 'Contact', content: 'Edit' },
    { href: '#', id: 'store', icon: "", alt: 'Services', content: 'Demo' },
  ],
  windows: [
    { id: 'window1', number: 1, clicked: false, color: 'rgb(255,255,255)' },
    { id: 'window2', number: 2, clicked: false, color: 'rgb(255,255,255)' },
    { id: 'window3', number: 3, clicked: false, color: 'rgb(255,255,255)' },
    { id: 'window4', number: 4, clicked: false, color: 'rgb(255,255,255)' },
  ],
  timeSettings: [
    { label: '場景開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time1', checkboxId: 'time1' },
    { label: '場景開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time2', checkboxId: 'time2' },
    { label: '場景開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time3', checkboxId: 'time3' },
  ],
})
const { tools, windows, timeSettings } = toRefs(state)
// const IMAGE = require.context('../picture/scene', false, /\.png$/)
const toggleWindow = (window) => {
  for (let i = 0; i < windows.value.length; i++) {
    windows.value[i].color = 'rgb(255,255,255)'
  }
  window.color = '#282828';

};





// const a = window.addEventListener('resize', function () {
//   var width = window.innerWidth;

//   if (width <= 600) {
//     const topLeftElement = document.querySelector('.top__left');
//     if (topLeftElement) {
//       topLeftElement.style.minWidth = '300px';
//     }
//     const topMiddleElement = document.querySelector('.top__middle');
//     if (topMiddleElement) {
//       topMiddleElement.style.minWidth = '300px';
//     }
//     const topRightElement = document.querySelector('.top__right');
//     if (topRightElement) {
//       topRightElement.style.minWidth = '200px';
//     }

//   } else {
//     const topLeftElement = document.querySelector('.top__left');
//     if (topLeftElement) {
//       topLeftElement.style.minWidth = '0px';
//     }
//     const topMiddleElement = document.querySelector('.top__middle');
//     if (topMiddleElement) {
//       topMiddleElement.style.minWidth = '0px';
//     }
//     const topRightElement = document.querySelector('.top__right');
//     if (topRightElement) {
//       topRightElement.style.minWidth = '200px';
//     }
//   }});
</script>

<template>
  <div class="content">
    <div class="title">甚麼時候可以睡覺</div>
    <hr>
    <div class="top">
      <div class="top__left">
        <div class="left_title">影片素材</div>
        <div class="left_container">
        </div>
      </div>
      <div class="top__middle">
        <video controls width="640" height="360">
          <source id="video" src="" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
      <div class="top__right">
        <div class="right_title">
          <span>AD 參數設定</span>
        </div>
        <div class="ad_content_wrpaer">
          <div class="ad_time_addcontent" v-for="(timeSetting, index) in timeSettings" :key="index">
            <input type="text" class="ad_time" :placeholder="timeSetting.placeholder" required>
            <div class="underline"></div>
            <label>{{ timeSetting.label }}</label>
          </div>
        </div>
        <hr>
        <div class="wrpaer_ad">
          <div class="new_window">
            <div class="window" v-for="window in windows" :key="window.id" :id="window.id"
              :style="{ backgroundColor: window.color }" @click="toggleWindow(window)">
              <span class="number">{{ window.number }}</span>
            </div>
          </div>
          <hr>
          <hr>
          <hr>
          <div class="write_ad">
            <form action="/test.aspx" method="post">
              <textarea class="textarea_size" name="" id="" cols="" rows="" style="resize:none;"
                placeholder=""></textarea>
            </form>
          </div>
          <div class="ad_tool">
            <button class="btn">
              <span>STORE</span>
            </button>
            <button class="btn">
              <span>STORE</span>
            </button>
            <button class="btn">
              <span>STORE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="down">
      <div class="media-scroller snaps-inline">
        <div class="scrollmenu">
          <img v-for="(item, i) in inconlist" :key="i" :src="item">
        </div>
      </div>


    </div>
  </div>
</template>
