<script setup lang="ts">
import { toRefs, reactive,ref, onMounted } from 'vue'
import { useWindowSize } from "@vueuse/core";
// import App from './Edit.vue';
// const app = createApp(App);



import listen from "../picture/listen.png"
import store from "../picture/store.png"
import "../assets/edit.css"

const inconlist = Object.values(import.meta.glob('../picture/scene/*',{eager:true})).map((v:any) => v.default);

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
    { id: 'window1', number: 1 },
    { id: 'window2', number: 2 },
    { id: 'window3', number: 3 },
    { id: 'window4', number: 4 },
  ],
  timeSettings: [
    { label: '場景開始時間', placeholder: '00:00:00', checkboxValue: '1', checkboxName: 'time1', checkboxId: 'time1' },
    { label: '場景結束時間', placeholder: '00:00:00', checkboxValue: '1', checkboxName: 'time2', checkboxId: 'time2' },
    { label: 'AD開始時間', placeholder: '00:00:00', checkboxValue: '1', checkboxName: 'time3', checkboxId: 'time3' },
  ],
})
const { tools, windows, timeSettings } = toRefs(state)
// const IMAGE = require.context('../picture/scene', false, /\.png$/)
const changeAllWindowColors = () => {
  const windows = document.querySelectorAll('.window')
  windows.forEach(window => {
    window.style.backgroundColor = 'rgb(255,255,255)'
  })
}

</script>

<template>
  <div class="content">
    <div class="top">
      <div class="top__left">
        <div class="edit_ad">
          <div class="ad_window">
            <!-- <div class="outside_ad_tool">
              <div class="outside_tool_item" v-for="(tool, index) in tools" :key="index">
                <a :href="tool.link" :id="tool.id" class="outside_tool__link">
                  <img :src="tool.image" :alt="tool.text" class="outside_tool_icon">
                  <span class="tooltiptext">{{ tool.text }}</span>
                </a>
              </div>
            </div> -->
            <div class="wrpaer_ad">
              <div class="new_window">
                <div class="window" v-for="window in windows" :key="window.id" :id="window.id"
                  @click="changeAllWindowColors">
                  <span>{{ window.number }}</span>
                </div>
              </div>
              <div class="write_ad">
                <form action="/test.aspx" method="post">
                  <textarea class="textarea_size" name="" id="" cols="" rows="" style="resize:none;"
                    placeholder="請填入口述影像"></textarea>
                </form>
              </div>
              <div class="ad_tool">
                <button class="btn">
                  <span>STORE</span>
                </button>
              </div>
            </div>
          </div>
          <div class="ad_content_wrpaer">
            <div class="ad_time_addcontent" v-for="(timeSetting, index) in timeSettings" :key="index">
              <div class="ad_content">
                <span>{{ timeSetting.label }}</span>
              </div>
              <input type="text" class="ad_time" :placeholder="timeSetting.placeholder">
              <input type="checkbox" :value="timeSetting.checkboxValue" :name="timeSetting.checkboxName"
                :id="timeSetting.checkboxId" class="checkbox">
            </div>
          </div>
        </div>
      </div>
      <div class="top__right">
        <div class="top__right__user">
          <video src="https://www.youtube.com/watch?v=hiCnxbwO5-M" width="650" controls></video>
        </div>
      </div>
    </div>
    <div class="down">
      <div class="media-scroller snaps-inline">
        <div class="scrollmenu">
          <img v-for="(item , i) in inconlist" :key ="i" :src="item" >
        </div>
      </div>


    </div>
  </div>
</template>
