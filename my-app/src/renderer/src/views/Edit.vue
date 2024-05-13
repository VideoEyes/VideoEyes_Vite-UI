<script setup lang="ts">

import { toRefs, reactive, ref, onMounted, watchEffect } from 'vue'
import { useWindowSize } from "@vueuse/core";
import listen from "../picture/listen.png"
import store from "../picture/store.png"
import hint from "../picture/ask.png"
import iconUrl from "../picture/Hint.png"
import "../assets/edit.css"
import { app, protocol, net, BrowserWindow, ipcRenderer } from 'electron'
import path from 'node:path'
import router from '../router';
import Swal from 'sweetalert2';

var nowSelectedAD = null; //現在選擇的AD，全域變數(待修改)
import { watch } from 'vue';

let sceneStart_with_index = ref([] as any);
let sceneStart: any = ref({});
let KEY_main_json = ref([] as any);
let FIRST_come_in_system = ref(true);
onMounted(() => {

  // window.onbeforeunload = (event) => {
  //   event.preventDefault();
  //   console.log("I want to close the window");
  //   window.electron.ipcRenderer.send('window-close', JSON.stringify(all_information));
  // }
  const video = document.getElementById('video') as HTMLSourceElement;

  const video_path = window.electron.ipcRenderer.sendSync('get-video-path');
  video.src = video_path;
  let videoElement = document.querySelector('video') as HTMLVideoElement;
  videoElement.onloadedmetadata = () => {
    totaltime.value = videoElement.duration;
  };
  initialalize();
})

let all_information = ref({} as any);
function initialalize() {
  sceneStart_with_index = ref([]);
  sceneStart = ref({});
  KEY_main_json = ref([]);

  FIRST_come_in_system.value = false;
  window.electron.ipcRenderer.send('read-file', 'NONE');
  window.electron.ipcRenderer.on('read-file-reply', (event, arg) => {
    if (arg.success) {
      // console.log("arg", arg.data);
      all_information = arg.data;
      // 寫檔案暫存到json  
      for (let key in arg.data) {
        KEY_main_json.value.push(key);
        console.log("KEY_main_json", KEY_main_json);
        sceneStart[key] = arg.data[key]["scene-start-time"];
      }
      for (const [key, value] of Object.entries(sceneStart)) {
        if (typeof value === 'object' && value !== null) {
          if (Object.keys(value).length == 0) {
            continue;
          }
        }
        if (value == undefined || value == null || value == "" || value == "NaN" || value == false || value == true || value == "...") {
          continue;
        }
        sceneStart_with_index.value.push(value);
        calculatePosition(value, ttvalue.value)
      }
    } else {
      console.error('Error reading file:', arg.error);
    }
  });
}
const AD_cursor = document.getElementById('ALL') as HTMLSourceElement;
//=======================

let AD_ALL_time = ref({} as any);
let textareaValue = ref('');

const Toast_add = Swal.mixin({
  toast: true,
  position: "bottom-start",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const Toast_delete = Swal.mixin({
  toast: true,
  position: "bottom-start",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

function new_AD() {
  // console.log('write-file');
  Toast_add.fire({
    icon: "success",
    title: "可以新增口述影像瞜！",
    text: "請點選右上角的時間參數，選擇要新增的時間點",
  });
  timeSettings.value[0].value = "";
  timeSettings.value[1].value = "";
  timeSettings.value[2].value = "";
}

let delete_flag = ref(false);
function delete_AD_hint() {
  Toast_delete.fire({
    icon: "info",
    title: "可以刪除口述影像瞜！",
    text: "請點選下方時間點，選擇要刪除的時間點",
  });
  delete_flag.value = true;
  // console.log("all_information", all_information);
}

function Store_AD() {
  nowSelectedAD = null;
  if (!KEY_main_json.value.length) {
    console.error("KEY_main_json is empty.");
    return;
  }
  console.log("KEY_main_json is not empty", KEY_main_json.value);
  let MAN_index = -1;
  let flag = true;
  for (let i in KEY_main_json.value) {
    if (KEY_main_json.value[i].substring(0, 2) == "AD") {
      let temp = parseInt(KEY_main_json.value[i].substring(2,), 10);
      if (temp > MAN_index) {
        MAN_index = temp;
      }
    }
  }
  let last_ID = MAN_index + 1;
  // last_ID = parseInt(last_ID.replace(/[^0-9]/g, "")) + 1;
  // last_ID = "AD" + last_ID;
  let LAST = "AD" + String(last_ID);
  console.log("LAST", LAST);
  let data = {
    [LAST]: {
      "scene-start-time": timeSettings.value[0].value,
      "scene-end-time": timeSettings.value[1].value,
      "AD-start-time": timeSettings.value[2].value,
      "AD-content": [textareaValue.value, "", "", ""],
      "AD-content-ID": 0
    }
  };

  // console.log("data to be sent", data);
  window.electron.ipcRenderer.send('write-file', JSON.stringify(data));
  window.electron.ipcRenderer.on('write-file-reply', (event, arg) => {

    if (arg.success) {
      initialalize();
      window.location.reload();
    } else {
      console.error('Error writing file:', arg.error);
    }

  });
  window.location.reload();
}

function change_AD_choice(index) {
  console.log("change_AD", index);
  if (nowSelectedAD != null) {
    window.electron.ipcRenderer.send('change-AD-choice',nowSelectedAD, index);
  }
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
    { id: 'window1', number: 1, clicked: true, color: 'rgb(255,255,255)' },
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
  change_AD_choice(window.number);
  // console.log('toggleWindow', window.number);
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

function check_AD_Choice22222() {
  console.log("check_AD_Choice");
  for (let i = 0; i < windows.value.length; i++) {
    windows.value[i].color = 'rgb(255,255,255)'
  }
  windows.value[0].color = 'rgb(0,0,0)'
}

function check_AD_choice() {
  if (nowSelectedAD != null) {
    window.electron.ipcRenderer.send('check-AD-choice',nowSelectedAD);
    window.electron.ipcRenderer.once('now_Selected_AD-reply', (event, arg) => {
      console.log(arg); // 輸出來自主進程的回覆
      for (let i = 0; i < windows.value.length; i++) {
        windows.value[i].color = 'rgb(255,255,255)'
      }
      windows.value[arg].color = 'rgb(0,0,0)'
    });
  }
}


function get_ad_information(index, ttvalue) {

  var temp = 0;
  for (var i = 0; i < sceneStart_with_index.value.length; i++) {
    if (parseInt(sceneStart_with_index.value[i].substring(3, 5), 10) == ttvalue - 1) {
      temp = i;
      break;
    }
  }
  index = index + temp;
  nowSelectedAD = index; //現在選擇的AD
  check_AD_choice(); //檢查現在選擇的AD，改變顏色用
  let scene_start = sceneStart_with_index.value[index];
  window.electron.ipcRenderer.send('get_SceneData', scene_start);
  window.electron.ipcRenderer.once('get_SceneData-reply', (event, arg) => {
    if (arg.success) {
      if (delete_flag.value) {
        delete_flag.value = false;
        Swal.fire({
          title: "你確定要刪除這段口述影像嗎",
          html: `
          場景開始時間: ${arg.data["scene-start-time"]}<br>
          場景結束時間: ${arg.data["scene-end-time"]}<br>
          口述開始時間: ${arg.data["AD-start-time"]}<br>
          口述影像內容: ${arg.data["AD-content"]}<br>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "對拉!! 媽的快點刪除",
          denyButtonText: "取消刪除",
        }).then((result) => {
          if (result.isConfirmed) {
            for (let key in all_information) {
              if (all_information[key]["scene-start-time"] == arg.data["scene-start-time"]) {
                delete all_information[key];
                break;
              }
            }
            let temp_json = JSON.parse(all_information.value);
            console.log("temp_json", JSON.stringify(temp_json, null, 4));
            window.electron.ipcRenderer.send('write-file', JSON.stringify(temp_json, null, 4));
            initialalize();
          } else if(result.isDenied){
            window.location.reload();
          }
          
        });
        initialalize();
        // window.location.reload();
        return;
      }
      timeSettings.value[0].value = arg.data["scene-start-time"];
      timeSettings.value[1].value = arg.data["scene-end-time"];
      timeSettings.value[2].value = arg.data["AD-start-time"];
      // console.log("arg.data", arg.data);
    } else {
      console.error('Error reading file:', arg.error);
    }
  });
}


function roundTo(num, decimal) {
  return Math.round((num + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
}
let show_time_bar = ref([] as any);

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
  // console.log("show_time_bar", show_time_bar.value);
}

function getShowTimeBar(ttvalue) {
  let SHOW_TIME_BAR = ref([] as any);
  for (let i = 0; i < show_time_bar.value.length; i++) {
    if (show_time_bar.value[i] < ttvalue * 100 && show_time_bar.value[i] >= (ttvalue - 1) * 100) {
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
            <el-button type="primary" id="new_AD" @click="new_AD()">新增</el-button>
            <el-button type="danger" id="delete_AD" @click="delete_AD_hint()">刪除</el-button>

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
              <textarea class="textarea_size" v-model="textareaValue" style="resize:none; " placeholder=""></textarea>
            </form>
          </div>
          <div class="ad_tool">
            <div class="ad_tool_add" @click="Store_AD">要新增</div>
            <div class="ad_tool_add">要刪除</div>
            <button class="btn" id="btn_add">
              <span>新增</span>
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
          <img @click="get_ad_information(index, ttvalue)" src="../picture/ask.png" class="time_bar__line__time__img"
            alt="">
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