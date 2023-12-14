<script lang="ts">

import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    items: {
      type : Object,
      required: true,
    },
  },

  setup() {

  }
})
</script>

<template>
  <div class="nihil_file_tree_node">
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
        <nihil-file-tree-node :items="item.children" v-if="item.children" />
      </li>
    </ul>
  </div>
</template>
