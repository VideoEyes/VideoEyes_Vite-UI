<template>
    <div class="content">
        <div class="header">
            <img src="../assets/back_arrow.png" alt="logo" @click="router.push('/edit')"/>
            <div class="title">Project Name</div>
        </div>
        <div class="main">
            <div class="video-container">
                <video controls>
                    <source id="video" src="" type="video/mp4">
                    Your browser does not support the video tag.
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