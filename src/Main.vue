<script setup>
    import ChunkReader from '@src/JNG/ChunkRead.ts';
    import {ref} from "vue";

    //
    const jpeg = ref(null);
    const png  = ref(null);

    //
    fetch("../assets/jng/TCBA8S.jng").then(async (res)=>{
        const jngData = new ChunkReader(new Uint8Array(await res.arrayBuffer()));

        //
        jngData.readData();

        //
        const parts = jngData.reconstruct();
        jpeg.value  = URL.createObjectURL(parts[0]);
        png.value   = URL.createObjectURL(parts[1]);
    });

</script>

<!-- -->
<template>

    <img :src="jpeg" alt="JPEG"/>
    <img :src="png"  alt="PNG"/>

</template>
