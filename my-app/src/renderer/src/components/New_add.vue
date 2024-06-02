<script setup>
import { ref, watch } from 'vue';
import Swal from 'sweetalert2';

let flag = ref({
    Store: false,
    delete: false,
    mergeAudio: false,
    save: false
});

let Store_AD_text = ref('儲存');
let delete_AD_text = ref('刪除');
let mergeAudioToVideo_text = ref('輸出檔案');
let save_AD_text = ref('存檔口述');

let operation_flag = ref(false);
watch(flag, (newVal) => {
    operation_flag.value = true;
    if (newVal.Store) {
        delete_AD_text.value = operation_cancel();
        mergeAudioToVideo_text.value = '視聽片段';
        save_AD_text.value = confirm_ckeck();
    } else if (newVal.delete) {
        Store_AD_text.value = '刪除';
        delete_AD_text.value = '取消刪除';
        mergeAudioToVideo_text.value = '輸出檔案';
        save_AD_text.value = '存檔口述';
    } else if (newVal.mergeAudio) {
        // 
    } else if (newVal.save) {
        // 
    }
});

const initial = () => {
    Store_AD_text.value = ('儲存');
    delete_AD_text.value = ('刪除');
    mergeAudioToVideo_text.value = ('輸出檔案');
    save_AD_text.value = ('存檔口述');
    operation_flag.value = false;
    flag.value = ref({
        Store: false,
        delete: false,
        mergeAudio: false,
        save: false
    });
}

const operation_cancel = () => {
    return "取消";
}

const confirm_ckeck = () => {
    return "確認";
}

const Store_AD = () => {
    flag.value = {
        Store: true,
        delete: false,
        mergeAudio: false,
        save: false
    };
}

const delete_AD = () => {
    if (operation_flag.value) {
        initial();
    } else {
        flag.value = {
            Store: true,
            delete: false,
            mergeAudio: false,
            save: false
        };
    }

}

const mergeAudioToVideo = () => {
    flag.value = {
        Store: false,
        delete: true,
        mergeAudio: false,
        save: false
    };
}

const save_AD = () => {
    if (operation_flag.value) {
        Swal.fire({
            title: "Do you want to save the changes?",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Save",
            denyButtonText: `Don't save`,
            showCancelButton: false,
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire("Saved!", "", "success");
                initial();
            }
        });
    } else {
        flag.value = {
            Store: false,
            delete: false,
            mergeAudio: false,
            save: true
        };
    }

}


</script>

<template>
    <div class="ad_tool">
        <div class="Tool">
            <div class="ad_tool_add" @click="Store_AD">
                {{ Store_AD_text }}
            </div>
            <div class="ad_tool_add" @click="delete_AD">
                {{ delete_AD_text }}
            </div>
        </div>
        <div class="Tool">
            <div class="ad_tool_add" @click="mergeAudioToVideo">
                {{ mergeAudioToVideo_text }}
            </div>
            <div class="ad_tool_add" @click="save_AD">
                {{ save_AD_text }}
            </div>
        </div>
    </div>
</template>