<script setup lang="ts">

import { toRefs, reactive, ref, onMounted, watchEffect } from 'vue'
import { useWindowSize } from "@vueuse/core";
import listen from "../picture/listen.png"
import store from "../picture/store.png"
import hint from "../picture/ask.png"
import "../assets/edit.css"
import { app, protocol, net, BrowserWindow, ipcRenderer } from 'electron'
import path from 'node:path'
import router from '../router';


let sceneStart_with_index: any = ref([]);
let sceneStart: any = ref({});
onMounted(() => {
  const video = document.getElementById('video') as HTMLSourceElement;
  const video_path = window.electron.ipcRenderer.sendSync('get-video-path');
  video.src = video_path;
  let videoElement = document.querySelector('video') as HTMLVideoElement;
  videoElement.onloadedmetadata = () => {
    totaltime.value = videoElement.duration;
  };
  // 讀檔
  window.electron.ipcRenderer.send('read-file', 'NONE');
  window.electron.ipcRenderer.on('read-file-reply', (event, arg) => {
    if (arg.success) {
      // console.log("arg", arg.data);
      for (let key in arg.data) {
        // console.log("key", key);
        sceneStart[key] = arg.data[key]["scene-start-time"];
      }
      console.log("scene", Object.keys(sceneStart));
      for (const [key, value] of Object.entries(sceneStart)) {
        console.log("123", key, value)
        if (typeof value === 'object' && value !== null) {
          if (Object.keys(value).length == 0) {
            continue;
          }
        }
        if (value == undefined || value == null || value == "" || value == "NaN" || value == false || value == true || value == "...") {
          continue;
        }
        sceneStart_with_index.value.push(value);
        console.log("sceneStart_with_index", sceneStart_with_index.value);
        calculatePosition(value, ttvalue.value)
      }
    } else {
      console.error('Error reading file:', arg.error);
    }
  });
})

const AD_cursor = document.getElementById('ALL') as HTMLSourceElement;
//=======================
function new_AD() {
  const text = document.getElementById('new_AD') as HTMLSourceElement;
  // 寫檔到aa.txt
  window.electron.ipcRenderer.send('write-file', './aa.txt', '511561512');
  // console.log('write-file');
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
    { label: '場景開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time1', checkboxId: 'time1', value: '' },
    { label: '場景開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time2', checkboxId: 'time2', value: '' },
    { label: '場景開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time3', checkboxId: 'time3', value: '' },
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
let totaltime = ref(0);
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

function get_ad_information(index,ttvalue) {
  var temp = 0;
  for(var i = 0; i < sceneStart_with_index.value.length; i++){
    if(parseInt(sceneStart_with_index.value[i].substring(3,5),10) == ttvalue  - 1){
      temp = i;
      break;
    }
  }
  index = index + temp;
  let scene_start = sceneStart_with_index.value[index];
  window.electron.ipcRenderer.send('get_SceneData', scene_start);
  window.electron.ipcRenderer.on('get_SceneData-reply', (event, arg) => {
    if (arg.success) {
      // console.log("get_SceneData", arg.data);
      timeSettings.value[0].value = arg.data["scene-start-time"];
      timeSettings.value[1].value = arg.data["scene-end-time"];
      timeSettings.value[2].value = arg.data["AD-start-time"];
    } else {
      console.error('Error reading file:', arg.error);
    }
  });
}


function roundTo(num, decimal) {
  return Math.round((num + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
}
let show_time_bar: any = ref([]);

function calculatePosition(time, ttvalue) {
  let caltime_sec = String(time).substring(6, 8);
  let caltime_min = String(time).substring(3, 5);

  if (isNaN(Number(caltime_sec)) || isNaN(Number(caltime_min))) {
    console.error('Invalid time format:', time);
    return;
  }

  let INT_MIN = parseInt(caltime_min, 10);
  let Time = parseInt(caltime_sec, 10);
  let position = (Time / 60) * 100;
  let result = (INT_MIN * 100) + Number(roundTo(position, 2).toFixed(2));

  show_time_bar.value.push(Number(result.toFixed(2)));
  console.log("show_time_bar", show_time_bar.value);
}

function getShowTimeBar(ttvalue) {
  let SHOW_TIME_BAR: any = ref([]);
  for (let i = 0; i < show_time_bar.value.length; i++) {
    if (show_time_bar.value[i] < ttvalue * 100 && show_time_bar.value[i] >= (ttvalue - 1) * 100) {
      // if(show_time_bar.value[i] == "NaN"){
      //   continue;
      // }
      SHOW_TIME_BAR.value.push(show_time_bar.value[i]); // 修改這裡
    }
  }
  console.log("SHOW_TIME_BAR", SHOW_TIME_BAR);
  return SHOW_TIME_BAR.value;
}

</script>

<template>
  <div class="content">
    <div class="title">Project Name</div>

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
            <input type="text" class="ad_time" v-model="timeSetting.value" :placeholder="timeSetting.placeholder"
              required>
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
    <!-- <p v-for="(value, index) in getShowTimeBar()" :key="index">
      {{ value }}
    </p> -->
    <div class="time_bar">
      <div class="time_bar__line">
        <div class="time_bar__line__time" v-for="(value, index) in getShowTimeBar(ttvalue)" :key="index"
          :style="{ left: `${value}%` }">
          <div class="time_bar__line__time__line"></div>
          <!-- <div class="time_bar__line__time__text">{{ index }}</div> -->
          <img @click="get_ad_information(index,ttvalue)" src="../picture/ask.png" class="time_bar__line__time__img" alt="">
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
