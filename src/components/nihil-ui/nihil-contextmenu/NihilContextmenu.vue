<script>
import { defineComponent, ref, watch } from "@vue/runtime-core";

export default defineComponent({
    props: {
        visible: {
            type : Boolean,
            required: false,
        },
        contextMenuEvent: {
            type : Object,
            required: true,
        },
    },
    setup(props, {emit}){
        const menuRef = ref(null)
        const menuLeft = ref(-999)
        const menuTop = ref(-999)

        watch(
            () => props.contextMenuEvent,
            () => {
                var x = props.contextMenuEvent.clientX;
                var y = props.contextMenuEvent.clientY;

                var menuWidth = menuRef.value.offsetWidth;
                var menuHeight = menuRef.value.offsetHeight;

                var screenW = window.innerWidth;
                var screenH = window.innerHeight;

                if (x + menuWidth > screenW) {
                    x -= menuWidth;
                }
                if (y + menuHeight > screenH) {
                    y = y - menuHeight + 24;
                }
                menuLeft.value = x
                menuTop.value = y -12
                console.log(menuLeft.value, menuTop.value)
            }
        );

        document.addEventListener("click", function (event) {
            menuLeft.value = -999
            menuTop.value = -999
        });

        return {close, menuRef, menuTop, menuLeft}
    },
    
})
</script>

<template>
  <div ref="menuRef" 
    class="nihil-contextmenu" 
    v-on:click="close"
    :style="{'top':menuTop+'px', 'left':menuLeft+'px'}">
      <slot></slot>
  </div>
</template>


<style scoped>
.nihil-contextmenu {
    width:100px;
    background-color:#ccc;
    position:absolute;
}
</style>
