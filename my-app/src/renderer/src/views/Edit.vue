<script setup lang="ts">

import { toRefs, reactive, ref, onMounted } from 'vue'
import { useWindowSize } from "@vueuse/core";
import listen from "../picture/listen.png"
import store from "../picture/store.png"
import "../assets/edit.css"
import { app, protocol, net, BrowserWindow, ipcRenderer } from 'electron'
import path from 'node:path'
import router from '../router';
onMounted(() => {
  const video = document.getElementById('video') as HTMLSourceElement;
  const video_path = window.electron.ipcRenderer.sendSync('get-video-path');
  video.src = video_path;
})

const AD_cursor = document.getElementById('ALL') as HTMLSourceElement;
//=======================
function new_AD() {
  const text = document.getElementById('new_AD') as HTMLSourceElement;
  // 寫檔到aa.txt
  window.electron.ipcRenderer.send('write-file', './aa.txt', '511561512');
  console.log('write-file');
  AD_cursor.style.cursor = 'crosshair';
}

//=======================

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
let ttvalue = ref(1);
let totaltime = ref(305);

let mousePosition = ref({ x: 0, y: 0 });
let now_video_time = ref(0);
let hoverInfoFlex = ref(1);

function handleMouseMove(event) {
  let rect = event.target.getBoundingClientRect();
  mousePosition.value = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
  // 1分鐘
  now_video_time.value = Math.round(((ttvalue.value - 1) * 60 + mousePosition.value.x * 60 / 100) * 100) / 100;

  if ((ttvalue.value == Math.ceil(totaltime.value / 60)) && totaltime.value != ttvalue.value * 60) {
    const last = totaltime.value - (ttvalue.value - 1) * 60;
    hoverInfoFlex.value = last / 60;
  } else {
    hoverInfoFlex.value = 1;
  }

}


</script>

<template>
  <div class="content">
    <div class="title">甚麼時候可以睡覺</div>
    <hr>
    <div class="top">
      <div class="top__left">
        <div class="left_title">
          <div class="edit-button">
            <el-button type="primary" id="new_AD" @click="new_AD">新增</el-button>
            <el-button type="danger">刪除</el-button>

          </div>
        </div>
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
    <div class="down" id="ALL">

      <button class="right_arrow" @click="ttvalue = (ttvalue > 1) ? ttvalue - 1 : 1">123456</button>
      <div class="TT" @mousemove="handleMouseMove">{{ ttvalue }}
        <div class="hover-info"
          :style="{ flex: hoverInfoFlex, left: `${mousePosition.x}%`, top: `${mousePosition.y}%` }">
          X: {{ mousePosition.x.toFixed(2) }}%
        </div>
        {{ now_video_time }}
        <div class="TT_last" :style="{ flex: 1 - hoverInfoFlex }"></div>
      </div>

      <button class="right_arrow"
        @click="ttvalue = (ttvalue < Math.ceil(totaltime / 60)) ? ttvalue + 1 : Math.ceil(totaltime / 60)">123456</button>
      <!-- 不足60 取整數 -->
    </div>
  </div>
</template>
<!-- <img v-for="(item, i) in inconlist" :key="i" :src="item"> -->
