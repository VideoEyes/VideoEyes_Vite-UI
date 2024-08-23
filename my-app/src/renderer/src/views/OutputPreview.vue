<template>
    <div class="content">
        <div class="header">
            <el-button type="success" id="to_edit" @click="router.push('/edit')" class="title-button">Edit</el-button>
            <div class="title">{{ project_name }}</div>
        </div>
        <div class="main">
            <div class="video-container">
                <video controls>
                    <source id="video" src="" type="video/mp4">Your browser does not support the video tag.
                </video>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import router from '../router';
import "../assets/outputPreview.css"
import { onMounted } from 'vue';
import { ref } from 'vue';
let project_name = ref("Project_Name");
onMounted(() => {
    const video = document.getElementById('video') as HTMLSourceElement;
    const video_path = window.electron.ipcRenderer.sendSync('get-output-video-path');
    video.src = video_path;
    window.electron.ipcRenderer.on('get-output-video-path-reply', (event, arg) => {
        project_name.value = arg;
        const pathParts = project_name.value.split('\\');
        project_name.value = pathParts[pathParts.length - 1];
    });
    // let videoElement = document.querySelector('video') as HTMLVideoElement;
    // videoElement.onloadedmetadata = () => {
    // totaltime.value = videoElement.duration;
    // };
})

</script>