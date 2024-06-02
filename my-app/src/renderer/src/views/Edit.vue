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

import {
  ArrowLeft,
  ArrowRight,
  Delete,
  Edit,
  Share,
} from '@element-plus/icons-vue'

var nowSelectedAD = null; //現在選擇的AD，全域變數(待修改)
var nowSelectedADIndex = null; //現在選擇的AD，全域變數(待修改)
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


// const ffmpeg = require('fluent-ffmpeg');
import ffmpeg from 'fluent-ffmpeg';

function mergeAudioToVideo() {
  // console.log("mergeAudioToVideo");
  window.electron.ipcRenderer.send('mergeAudioToVideo');
}



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
        // console.log("KEY_main_json", KEY_main_json);
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

function read_AD() {
  if (nowSelectedAD == null) {
    Swal.fire({
      icon: "error",
      title: "請選擇要生成語音的口述影像",
    });
    return;
  }
  window.electron.ipcRenderer.send('read-AD', KEY_main_json.value[nowSelectedAD], nowAdChoice, sceneStart[KEY_main_json.value[nowSelectedAD]]);
}

function new_AD() {
  // console.log('write-file');
  Store_AD();
  // Toast_add.fire({
  //   icon: "success",
  //   title: "可以新增口述影像瞜！",
  //   text: "請點選右上角的時間參數，選擇要新增的時間點",
  // });
  // timeSettings.value[0].value = "";
  // timeSettings.value[1].value = "";
  // timeSettings.value[2].value = "";
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

let NOW_select_AD_name = ref("");

function save_AD() {
  // console.log("save_AD");
  if (NOW_select_AD_name.value == "") {
    Swal.fire({
      icon: "error",
      title: "請選擇要存檔的口述影像",
    });
  } else {
    // let data = [NOW_select_AD_name.value, textareaValue.value];
    // console.log("data to be sent", data);
    window.electron.ipcRenderer.send('save_AD', nowSelectedADIndex, textareaValue.value, nowAdChoice);
    window.location.reload();
  }

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
  // console.log("change_AD", index);
  if (nowSelectedAD != null) {
    window.electron.ipcRenderer.send('change-AD-choice', nowSelectedAD, index);
    window.electron.ipcRenderer.once('change-AD-choice-reply', (event, arg) => {
      console.log(arg); // 輸出來自主進程的回覆
      textareaValue.value = arg;
    });
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
    { label: '場景結束時間', placeholder: '', checkboxValue: '1', checkboxName: 'time2', checkboxId: 'time2', value: '' },
    { label: '旁白開始時間', placeholder: '', checkboxValue: '1', checkboxName: 'time3', checkboxId: 'time3', value: '' },
  ],
})
const { tools, windows, timeSettings } = toRefs(state)
// const IMAGE = require.context('../picture/scene', false, /\.png$/)
let nowAdChoice = -1;
const toggleWindow = (window) => {
  nowAdChoice = window.number - 1;
  change_AD_choice(window.number);
  // nowAdChoice = window.number;
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

// function check_AD_Choice22222() {
//   console.log("check_AD_Choice");
//   for (let i = 0; i < windows.value.length; i++) {
//     windows.value[i].color = 'rgb(255,255,255)'
//   }
//   windows.value[0].color = 'rgb(0,0,0)'
// }

function check_AD_choice() {
  if (nowSelectedAD != null) {
    window.electron.ipcRenderer.send('check-AD-choice', nowSelectedAD);
    window.electron.ipcRenderer.once('now_Selected_AD-reply', (event, arg) => {
      console.log(arg); // 輸出來自主進程的回覆
      for (let i = 0; i < windows.value.length; i++) {
        windows.value[i].color = 'rgb(255,255,255)'
      }
      windows.value[arg].color = 'rgb(0,0,0)'
      nowAdChoice = arg
    });
  }
}

let scene_output_video = ref("" as any);
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
  // 要給存AD的 AD name
  NOW_select_AD_name.value = "AD" + index;
  console.log("NOW_select_AD_nameBB", NOW_select_AD_name);
  let scene_start = sceneStart_with_index.value[index];
  window.electron.ipcRenderer.send('get_SceneData', scene_start);
  window.electron.ipcRenderer.once('get_SceneData-reply', (event, arg) => {
    scene_output_video.value = arg.data["index"];
    console.log("scene_output_video", scene_output_video);
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
          showCancelButton: false,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "對拉!! 媽的快點刪除",
          showDenyButton: true,
          denyButtonText: "取消刪除",
          showDenyButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            for (let key in all_information) {
              console.log("delete_write_file", key);
              if (all_information[key]["scene-start-time"] == arg.data["scene-start-time"]) {
                console.log("delete_write_file", key);
                window.electron.ipcRenderer.send('delete_write_file', key);
                window.location.reload();
                break;
              }
            }
          } else if (result.isDenied) {
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
      nowAdChoice = arg.data["AD-content-ID"];
      textareaValue.value = arg.data["AD-content"][nowAdChoice];
      nowSelectedADIndex = arg.data["index"];
      // console.log(arg.data["AD-content"][0])
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
  // console.log("SHOW_TIME_BAR", SHOW_TIME_BAR);
  return SHOW_TIME_BAR.value;
}

async function re_read_AD() {
  await window.electron.ipcRenderer.send('read-All-AD');
  mergeAudioToVideo();
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
            <div class="ATool">
              <div class="ad_tool_add"  id="new_AD" @click="new_AD()">新增</div>
              <div class="ad_tool_add" id="delete_AD" @click="delete_AD_hint()">刪除</div>
              <!-- <div class="ad_tool_add" id="read_AD" @click="read_AD()">生成語音</div> -->
              <div class="ad_tool_add" id="" @click="re_read_AD()">匯出</div>
              <!-- <div class="ad_tool_add"id="" @click="router.push('/outputPreview')">去output</div> -->
            </div>
            <!-- <el-button type="primary" id="new_AD" @click="new_AD()">新增</el-button>
            <el-button type="danger" id="delete_AD" @click="delete_AD_hint()">刪除</el-button>
            <el-button type="danger" id="read_AD" @click="read_AD()">生成語音</el-button>
            <el-button type="danger" id="" @click="re_read_AD()">生成全部語音</el-button>
            <el-button type="danger" id="" @click="router.push('/outputPreview')">去output</el-button> -->
          </div>
        </div>
        <div class="left_container">
        </div>
      </div>
      <div class="top__middle">
        <video controls>
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
            <div class="Tool">
              <div class="ad_tool_add" @click="">Gemini</div>
              <div class="ad_tool_add" @click="read_AD">試聽</div>
            </div>
            <!-- <div class = "Tool">
              <div class="ad_tool_add" @click="Store_AD">要新增</div>
              <div class="ad_tool_add">要刪除</div>
            </div> -->
            <div class="Tool">
              <div class="ad_tool_add"
                @click="">
                刪除</div>
              <div class="ad_tool_add" @click="save_AD">儲存</div>
            </div>
            <!-- <div class = "Tool">
              <div class="ad_tool_add"
                @click="mergeAudioToVideo('D:\\Download\\chinobio.mp4', 'D:\\Download\\TESTT.mp3', 'D:\\Download\\AAAA.mp4', scene_output_video)">
                輸出檔案</div>
              <div class="ad_tool_add" @click="save_AD">存檔口述</div>
            </div> -->
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
      <button class="right_arrow" @click="ttvalue = (ttvalue > 1) ? ttvalue - 1 : 1">
        <el-icon :size="30" height="100" color="#ffffff">
          <ArrowLeft />
        </el-icon>
      </button>
      <!-- <div class="TT" @mousemove="handleMouseMove">{{ ttvalue }}
        <div class="hover-info"
          :style="{ flex: hoverInfoFlex, left: `${mousePosition.x}%`, top: `${mousePosition.y}%` }">
          X: {{ mousePosition.x.toFixed(2) }}%
        </div>
        {{ now_video_time }}
        <div class="TT_last" :style="{ flex: 1 - hoverInfoFlex }"></div>

      </div>  -->
      <img src="../picture/sound-8825_512.gif" width="1500px" height="100px" alt="Description of the GIF">

      <button class="right_arrow"
        @click="ttvalue = (ttvalue < Math.ceil(totaltime / 60)) ? ttvalue + 1 : Math.ceil(totaltime / 60)">
        <el-icon :size="30" height="100" color="#ffffff">
          <ArrowRight />
        </el-icon>
      </button>
      <!-- 不足60 取整數 -->
    </div>
  </div>
</template>
<!-- <img v-for="(item, i) in inconlist" :key="i" :src="item"> -->