<template>
    <div class="content">
        <div class="header">
            <el-button type="success" id="to_edit" @click="router.push('/edit')" class="title-button">Edit</el-button>
            <div class="title">Project Name</div>
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

    onMounted(() => {
    const video = document.getElementById('video') as HTMLSourceElement;
    const video_path = window.electron.ipcRenderer.sendSync('get-output-video-path');
    video.src = video_path;
    // let videoElement = document.querySelector('video') as HTMLVideoElement;
    // videoElement.onloadedmetadata = () => {
    // totaltime.value = videoElement.duration;
    // };
    })

</script>