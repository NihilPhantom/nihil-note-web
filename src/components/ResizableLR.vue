<script lang="ts">

import { defineComponent, ref } from '@vue/runtime-core';

export default defineComponent({

  setup() {

  },

  mounted() {
    let resize = this.$refs.middle as any;
    let box = this.$refs.box as any;
    let left = this.$refs.left as any;
    let right = this.$refs.right as any;


    let initX = box.clientWidth / 3 > 240 ? 240 : box.clientWidth / 3;
    left.style.width = initX + "px";
    right.style.width = (box.clientWidth - initX - 5) + "px";

    if (resize != null && box != null && left != null && right != null) {
      resize.onmousedown = function (e: any) {
        let startX = e.clientX;
        resize.left = resize.offsetLeft - box.offsetLeft;
        document.onmousemove = function (e: any) {
          let endX = e.clientX;
          let moveLen = resize.left + (endX - startX);
          resize.style.left = moveLen;
          left.style.width = moveLen + "px";
          right.style.width = (box.clientWidth - moveLen - 5) + "px";
        }
        document.onmouseup = function (evt) {
          evt.stopPropagation()
          document.onmousemove = null;
          document.onmouseup = null;
          resize.releaseCapture && resize.releaseCapture();
        }

        resize.setCapture && resize.setCapture();
        return false;
      };
      window.onresize = function (e: any) {
        let initX = box.clientWidth / 3 > 240 ? 240 : box.clientWidth / 3;
        left.style.width = initX + "px";
        right.style.width = (box.clientWidth - initX - 5) + "px";
      }
    }
  }
})
</script>

<template>
  <div class="nihil-ResizableLR" ref="box">
    <div class="nihil-ResizableL" ref="left">
      <slot name="left"></slot>
    </div>
    <div class="Middle" ref="middle"></div>
    <div class="Right" ref="right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style lang="css">
.nihil-ResizableLR {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: space-between;
}

.nihil-ResizableLR .nihil-ResizableL {
  width: 240px;
}

.nihil-ResizableLR .Right {
  width: 100%;
  position: relative;
  padding: 20px;
}

.nihil-ResizableLR .Middle {
  cursor: col-resize;
  height: 100%;
  position: relative;
  width: 2px;
  border-left: 1px solid #8f949a;
}

.nihil-ResizableLR .Middle:hover {
  border: 1px solid #8f949a;
  background-color: #8f949a;
}

.nihil-ResizableLR .Middle:active {
  border: 1px solid #8f949a;
  background-color: #8f949a;
}
</style>
