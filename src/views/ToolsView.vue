<script>
import { defineComponent, ref } from '@vue/runtime-core';

export default defineComponent({
    setup() {
        const rawInput = ref("");
                const rgbOutput = ref("");
        const onClickRGBTrans = ()=>{
            let res = "#"
            const numArray = rawInput.value.match(/\d+/g).map(Number);
            console.log(numArray)
            for(let i = 0; i < Math.min(numArray.length,3) ; i++){
                res = res + numArray[i].toString(16).padStart(2, '0')
            }
            rgbOutput.value = res
        }

        return {
            rawInput,
            onClickRGBTrans,
            rgbOutput,
        }
    },
    mounted() {},
})
</script>

<template>
<div>
  <h2>颜色转化</h2>  
  <p>
    请输入数值的颜色：
    <input v-model="rawInput" />
    <button v-on:click="onClickRGBTrans">转化</button>
    <p>{{ rgbOutput }}</p>
  </p>
</div>
</template>