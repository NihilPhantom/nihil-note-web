<script lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
import { SemiSelect, TopRight, Plus } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { defineComponent } from 'vue'
import axios from 'axios';

import '../assets/markdown.scss'

const articleDes = ref(''); // 使用描述


let articleId = "";


export default defineComponent({
  setup() {

    // 已选择的标签
    const imageUrl = ref("")

    const titleTex = ref("")

    const labelOptions = [
      {
        value: 'Option1',
        label: 'Option1',
      },
      {
        value: 'Option2',
        label: 'Option2',
      },
      {
        value: 'Option3',
        label: 'Option3',
      },
      {
        value: 'Option4',
        label: 'Option4',
      },
      {
        value: 'Option5',
        label: 'Option5',
      },
    ]
    const columnOptions = ref([
      {
        value: 'Option1',
        label: 'Option1',
      },
      {
        value: 'Option2',
        label: 'Option2',
      },
    ])


    return {
      SemiSelect, TopRight, Plus, articleDes, labelOptions, columnOptions,
      imageUrl, titleTex
    }  // 数据绑定必须使用 return 把数据返回出去
  },

  mounted() {
    // 文章初始化方法：如果是编辑已经存在的文章，就获取文章详情，并且赋值给对应数据
    articleId = this.$route.query.articleId as string;
    let _previewWindow = this.$refs.previewWindow as any;      // html显示区域的dom

    (async () => {
      if (articleId) {
        let res = await axios.get("http://127.0.0.1:8000/nihil-note/article/detail?id=" + articleId)
        this.titleTex = res.data.data.title
        this.articleDes = res.data.data.des
        this.imageUrl = res.data.data.imgHref
        _previewWindow.innerHTML = res.data.data.content
      }
    })()
  }
})

</script>

<template>
  <div>
    <!-- 头部信息 -->
    <div>
      <el-row>
        <el-button type="primary" round>测试1</el-button>
        <el-button type="info" round>测试2</el-button>
      </el-row>
    </div>
    <!-- 页面主要内容 -->
    <el-row>
      <div class="left_part"></div>
      <div
        id="previewWindow"
        ref="previewWindow"
        class="el-col el-col-24 markdown"
      ></div>
    </el-row>
  </div>
</template>

<style>
.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.left_part {
  width: 300px;
  height: 100%;
  background: #eee;
}
</style>