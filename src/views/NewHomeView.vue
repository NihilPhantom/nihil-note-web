<script lang="ts">
import ResizableLR from '@/components/ResizableLR.vue';

import { defineComponent, ref } from '@vue/runtime-core';
import  FileTree from '@/components/FileTree.vue';
import {getArticle, updateArticle} from '../client/FileNodeClient';
import EditorAndShower from '@/components/EditorAndShower.vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import config from "../config.json";

export default defineComponent({
  props: {
    xxx: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    // 控制数据：Tab展示的是第几个  articleId
    const editableTabsValue = ref("1");

    // 控制数据：控制当前文档的编辑模式
    const editorShowModel = ref("html")

    // 内容数据：一个 Tab 所包含的数据
    const editableTabs = ref([
      {
        title: "新的",
        name: "1",
        content: "<h1>欢迎使用NihilNote</h1>",
        mdData: "# 欢迎使用NihilNote",
        edited: false,
      },
    ]);

    // 点击事件：当Tab 页面关闭时触发的事件
    const removeTab = (targetName: string) => {
      const tabs = editableTabs.value;
      let activeName = editableTabsValue.value;
      if (activeName === targetName) {
        tabs.forEach((tab, index) => {
          if (tab.name === targetName) {
            const nextTab = tabs[index + 1] || tabs[index - 1];
            if (nextTab) {
              activeName = nextTab.name;
            }
          }
        });
      }
      editableTabsValue.value = activeName;
      editableTabs.value = tabs.filter((tab) => tab.name !== targetName);
    }

    // 页面跳转监听方法  -- 页面内a标签点击方法，实现页内跳转
    const onClickElTabs = (e: PointerEvent) => {
      if (e.ctrlKey) {
        return
      }
      if (e.target.href) {
        let url = new URL(e.target.href)
        const origin = window.location.origin;
        if (url.origin == origin && url.pathname == "/article") {
          let articleId = url.searchParams.get('articleId');
          if (articleId != null) { onClickArticle(articleId) }
          e.preventDefault();
        }
      }
      console.log("onClickElTabs 已被触发")
      e.preventDefault();
    }

    // 内容更新方法
    const myContent = ref('<h1>asdfdg</h1>');
    const mymarkdown = ref("12341");
    const updateContent = function (value: string) {
      console.log(value)
      myContent.value = value;
      mymarkdown.value = "123578iujhgf";
    }

    // markdown 变化回调方法
    const onChangeMarkdown = (mdData: string) => {
      console.log("更改的文章ID:", editableTabsValue.value)
      console.log("更改的文章MD:", mdData)
      const tabs = editableTabs.value;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].name == editableTabsValue.value) {
          // debugger
          tabs[i].edited = true
          break;
        }
      }
    }

    // 文章保存回调方法
    const onSaveArticle = async (param: any) => {
      console.log("保存文章ID:", editableTabsValue)
      console.log("保存文章MD:", param.mdData)
      console.log("保存文章HTML:", param.content)

      const tabs = editableTabs.value;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].name == editableTabsValue.value) {
          let reqData: Record<string, any> = {
            id: editableTabsValue.value,
            markdown: param.mdData,
            content: param.content,
          }
          let res = await updateArticle(reqData)

          if (res.data.code == 200) {
            localStorage.removeItem("tempId")
            ElNotification({
              title: 'Success',
              message: '文章发布成功',
              type: 'success',
            })
          }
          tabs[i].edited = false
          break;
        }
      }
    }

    // 添加 Tab 方法
    const addTab = (articleId: string) => {
      getArticle(articleId).then(
        (res)=>{
          editableTabs.value.push({
            title: res.data.data.title,
            name: articleId,
            content: res.data.data.content,
            mdData: res.data.data.markdown
          });
          editableTabsValue.value = articleId;
        }
      )
    };

    // 点击事件：文件节点点击事件 
    const onFileClick = async (nodeData)=>{
      if(nodeData.type === config.markdown_type){
        console.log(nodeData)
        let id = nodeData.id
        // 判断是否已经打开
        for (let i = 0; i < editableTabs.value.length; i++) {
          if (editableTabs.value[i].name == id) {
            editableTabsValue.value = id;
            return;
          }
        }
        console.log(id);
        addTab(id)
      }
    }

    // Markdown Editor 显示模式控制方法
    const onClickEditorModelController = (type: string) => {
      editorShowModel.value = type
    }

    return {
      onFileClick,
      editableTabsValue,
      removeTab,
      onClickElTabs,
      editableTabs,
      editorShowModel,
      updateContent,
      onChangeMarkdown,
      onSaveArticle,
      onClickEditorModelController,
    }
  },
  mounted() {},
  components:{
    ResizableLR, 
    FileTree, 
    EditorAndShower,
  }
})
</script>

<template>
<ResizableLR>
  <template #left>
    <FileTree @onClickFileNode="onFileClick"></FileTree>
  </template>
  <template #right>
    <div class="right_box">
      <!-- 功能按键 -->
      <div class="rightTopFuntionList">
        <button
          @click="() => onClickEditorModelController('markdown')"
          title="仅MarkDown"
        >
          M
        </button>
        <button
          @click="() => onClickEditorModelController('html')"
          title="仅展示HTML"
        >
          H
        </button>
        <button
          @click="() => onClickEditorModelController('all')"
          title="双栏模式"
        >
          A
        </button>
        <button @click="onClickTestButtom" title="测试">T</button>
      </div>
      <el-tabs
        v-model="editableTabsValue"
        type="card"
        class="demo-tabs"
        closable
        @tab-remove="removeTab"
        :onClick="onClickElTabs"
      >
        <el-tab-pane
          v-for="item in editableTabs"
          :key="item.name"
          :label="item.edited ? '*' + item.title : item.title"
          :name="item.name"
        >
          <EditorAndShower
            :content="item.content"
            :mdData="item.mdData"
            :showMode="editorShowModel"
            @update-content="updateContent"
            @change-markdown="onChangeMarkdown"
            @save="onSaveArticle"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </template>
</ResizableLR>
</template>

<style lang="scss">
.nihil-ResizableLR .Right {
  padding: 0;
}
.nihil-ResizableL, .right_box{
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: scroll;
  overflow-x: hidden;
  overflow-x: hidden;
  .el-tab-pane {
    max-height: calc(100vh - var(--el-tabs-header-height) - 24px);
    overflow-y: scroll;
  }
}

div::-webkit-scrollbar {
  width: 4px;
}
div::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  opacity: 0.2;
  background: fade(red, 60%);
}
div::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 0;
  background: fade(red, 30%);
}
.el-tabs__header {
  margin: 0;
}
</style>