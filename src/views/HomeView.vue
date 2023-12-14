<script lang="ts">
import ResizableLR from "@/components/ResizableLR.vue";
import router from "@/router";
import {
  Management,
  List,
  ArrowDownBold,
  ArrowUpBold,
  CirclePlusFilled,
} from "@element-plus/icons-vue";
import { defineComponent, ref, watch } from "@vue/runtime-core";
import axios from "axios";
import draggable from "vuedraggable";
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import EditorAndShower from '../components/EditorAndShower.vue';

import config from '../config.json'

import { copyContentToClipboard } from "../utils/clipboard_util.js";

import "../assets/markdown.scss";
import "../assets/hljs-default.min.css";

export default defineComponent({
  htmlBox: undefined,
  setup() {
    // 获取专栏列表
    const myArray: any = ref([]);

    // 专栏 创建控制
    const createColumnUiVisitable = ref(false);
    const createColumnName = ref("");
    const createColumnDes = ref("");
    const createColumnisPublish = ref(true);

    const articleDialogUiVisitable = ref(false);
    const articleDialogType = ref("");
    const articleDialogArticleTitle = ref("");
    const articleDialogArticleDes = ref("");
    const articleDialogisPublish = ref(true);

    // 右键菜单控制
    const showRightMenu = ref(false);
    const RightMenutopNumber = ref(-500);
    const RightMenuleftNumber = ref(-500);
    const rightMenuModel = ref("");

    const editorShowModel = ref("html")

    // 存放需要正在操作的文章id
    let currentArticleId = "";
    let currentcolumnId = "";
    let currentcolumnIndex = 0;
    let currentArticleIndex = 0;

    // 存放复制的文章ID
    let copyedArticleId = "";


    // 标签页有关操作
    let tabIndex = 1;
    const editableTabsValue = ref("1");
    const editableTabs = ref([
      {
        title: "新的",
        name: "1",
        content: "<h1>欢迎使用NihilNote</h1>",
        mdData: "# 欢迎使用NihilNote",
        edited: false,
      },
    ]);

    const addTab = (articleId: string, articleTitle: string, articleMarkdownData: string, articleHtml: string) => {
      editableTabs.value.push({
        title: articleTitle,
        name: articleId,
        content: articleHtml,
        mdData: articleMarkdownData
      });
      editableTabsValue.value = articleId;
    };

    watch(editableTabsValue, newValue => {
      console.log(`New value of editableTabsValue is ${newValue}`);
    });

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
    };

    // 进入页面触发方法，加载专栏列表
    let init_data = async () => {
      let res = await axios.get(
        "http://127.0.0.1:8000/nihil-note/column/column?authorId=1&published=true"
      );
      let columnList = res.data.data.map((el: any, index: number) => {
        return {
          id: el.id,
          name: el.name,
          num: el.num,
          articles: [],
          showArticle: false,
          loaded: false,
        };
      });
      console.log(columnList);
      myArray.value = columnList;
    };

    // 前后端交互方法 --- 发送请求，加载文章列表
    const getArticleListByColumnId = async function (index: number) {
      console.log("HomeView: getArticleListByColumnId 被调用了")
      let res = await axios.get(
        "http://127.0.0.1:8000/nihil-note/column/articleList?id=" +
        myArray.value[index].id
      );
      myArray.value[index].articles = res.data.data;
      myArray.value[index].loaded = true;
      console.log(myArray.value[index].articles);
    };

    init_data();

    // 点击专栏处理方法：--- 发送请求，加载文章列表
    const controlArticleList = function (index: number) {
      console.log("HomeView: controlArticleList被调用了")
      if (!myArray.value[index].showArticle) {
        myArray.value[index].showArticle = true;
      }
      if (myArray.value[index].loaded) {
        return;
      }
      getArticleListByColumnId(index)
    };


    // 点击左侧文章列表方法：--- 发送请求，获取文章详情并进项加载
    // 获取 dom 的方法
    const onClickArticle = async function (id: string) {
      // 判断是否已经打开
      for (let i = 0; i < editableTabs.value.length; i++) {
        if (editableTabs.value[i].name == id) {
          editableTabsValue.value = id;
          return;
        }
      }
      console.log(id);
      let res = await axios.get(
        "http://127.0.0.1:8000/nihil-note/article/detail?id=" + id
      );
      addTab(id, res.data.data.title, res.data.data.markdown, res.data.data.content)
    };

    // 右键右键文章方法： --- 打开文章菜单  // element.id, index, item2.element.id, item2.element.index
    const articleRightClickHandle = function (
      columnId: string,
      columnIndex: number,
      articleId: string,
      articleIndex: number,
      event: any
    ) {
      event.stopPropagation();
      showRightMenu.value = true;
      rightMenuModel.value = "article";
      RightMenutopNumber.value = event.pageY;
      RightMenuleftNumber.value = event.pageX;
      currentcolumnId = columnId;
      currentArticleId = articleId;
      currentcolumnIndex = columnIndex;
      currentArticleIndex = articleIndex;
    };

    const onRightClickColumn = function (
      columnId: string,
      columnIndex: number,
      event: any
    ) {
      event.stopPropagation();
      showRightMenu.value = true;
      rightMenuModel.value = "column";
      RightMenutopNumber.value = event.pageY;
      RightMenuleftNumber.value = event.pageX;
      currentcolumnId = columnId;
      currentcolumnIndex = columnIndex;
    }

    // 右键空白 --- 展示空白菜单
    const leftSpaceClickHandle = function (event: any) {
      debugger
      event.stopPropagation();
      showRightMenu.value = true;
      rightMenuModel.value = "leftSpace";
      RightMenutopNumber.value = event.pageY;
      RightMenuleftNumber.value = event.pageX;
    };

    // 右键关闭方法
    const rightClickHandle = function (event: any) {
      showRightMenu.value = false;
    };

    // 点击菜单编辑文章方法：--- 跳转到文章编辑方法
    const goEdit = function () {
      router.push({
        path: "/editor",
        query: { articleId: currentArticleId },
      });
    };

    // 点击菜单编辑文章方法：--- 弹出信息编辑框
    const editArticleInfo = function () {
      showRightMenu.value = false;
      articleDialogUiVisitable.value = true;
      articleDialogType.value = "edit";
      articleDialogArticleTitle.value = myArray.value[currentcolumnIndex].articles[currentArticleIndex].title;
      articleDialogArticleDes.value = myArray.value[currentcolumnIndex].articles[currentArticleIndex].des;
      articleDialogisPublish.value = myArray.value[currentcolumnIndex].articles[currentArticleIndex].published;
    };

    // 点击菜单添加文章方法：--- 跳转到文章编辑方法
    const goEditWithOutID = function () {
      router.push({
        path: "/editor",
      });
    };

    // 点击文章菜单复制方法
    const copyArticle = function () {
      copyedArticleId = currentArticleId;
      showRightMenu.value = false;
    }

    // 点击文章菜单粘贴方法
    const pasteArticle = async function () {
      console.log("HomeView: 文章粘贴方法被执行")
      let reqData: Record<string, any> = {
        fromArticleId: copyedArticleId,
        toBeforeArticleId: currentArticleId,
        toColumnId: currentcolumnId,
      }
      let res = await axios.post(
        config.url_base + "/nihil-note/article/copyCreate",
        reqData
      )
      if (res.data.code == 200) {
        showRightMenu.value = false
        getArticleListByColumnId(currentcolumnIndex);
        myArray.value[currentcolumnIndex].num++
      }
    }

    // 点击菜单删除文章方法 --- 删除一篇文章
    const deleteArticle = function () {
      ElMessageBox.confirm("确认删除文章. Continue?", "Warning", {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning",
      })
        .then(async () => {
          let res = await axios.delete(
            "http://127.0.0.1:8000/nihil-note/column/article?columnId=" +
            currentcolumnId +
            "&articleId=" +
            currentArticleId
          );
          if (res.data.code == 200) {
            myArray.value[currentcolumnIndex].articles.splice(
              currentArticleIndex,
              1
            );
            myArray.value[currentcolumnIndex].num--
          }
          showRightMenu.value = false;
        })
        .catch(() => {
          ElMessage({
            type: "info",
            message: "Delete canceled",
          });
        });
    };

    // 文章移动触发方法 ---- 修改文章顺序
    const onArticleMoveEnd = function (evt: any, columnIndex: number) {
      let article1 = myArray.value[columnIndex].articles[evt.newDraggableIndex];
      let article2 = myArray.value[columnIndex].articles[evt.oldDraggableIndex];
      console.log(evt.newDraggableIndex+"被拖的元素:", article1);
      console.log(evt.oldDraggableIndex+"与其交换的元素:", article2);
      if (article1.id == article2.id) {
        return;
      }
      axios
        .put("http://127.0.0.1:8000/nihil-note/column/exchangeArticle", {
          articleId1: article1.id,
          articleId2: article2.id,
          columnId: myArray.value[columnIndex].id,
        })
        .then((res) => {
          console.log(res.data.data);
        });
    };

    // 点击菜单创建专栏方法 --- 弹出创建专栏的对话框（模态框）
    const createColumn = async function () {
      createColumnUiVisitable.value = true;
      showRightMenu.value = false;
    };

    // 右键菜单、右键专栏菜单方法： 删除专栏
    const delColumn = async () => {
      showRightMenu.value = false;
      if (myArray.value[currentcolumnIndex].num != 0) {
        ElMessageBox.confirm("删除专栏之前需要清空专栏内部的所有文章", "Warning", {
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          type: "warning",
        })
        return;
      }
      let res = await axios.delete(
        "http://127.0.0.1:8000/nihil-note/column/column?id=" +
        currentcolumnId
      );
      if (res.data.code == 200) {
        myArray.value.splice(
          currentcolumnIndex,
          1
        );
      }
      showRightMenu.value = false;
    }

    // 右键菜单、右键文章菜单方法：复制文章url
    const copyArticleUrl = () => {
      copyContentToClipboard("[" + myArray.value[currentcolumnIndex].articles[currentArticleIndex].title
        + "](/article?articleId=" + currentArticleId + ")")
      showRightMenu.value = false
    }

    // 右键菜单、右键文章菜单方法：复制文章标题
    const copyArticleTitle = () => {
      copyContentToClipboard(
        myArray.value[currentcolumnIndex].articles[currentArticleIndex].title)
      showRightMenu.value = false
    }

    // 点击菜单创建文章方法 --- 弹出创建文章的对话框（模态框）
    const createArticle = async function () {
      articleDialogType.value = "create";
      articleDialogUiVisitable.value = true;
      showRightMenu.value = false;
    };

    // 点击创建专栏确认方法 --- 点击确认
    const confirmCreateColumn = async function () {
      let param: Record<string, any> = {
        name: createColumnName.value,
        published: createColumnisPublish.value,
        des: createColumnDes.value,
      };
      let res = await axios.post(
        "http://127.0.0.1:8000/nihil-note/column/column",
        param
      );
      if (res.data.code == 200) {
        init_data();
        createColumnUiVisitable.value = false
      }
    };

    // 点击创建文章对话框（模态框）确认方法 --- 点击确定
    const onClickConfirmArticleDialog = async function () {
      if (articleDialogType.value == "create") {
        console.log("HomeView: 创建文章方法被调用")
        let param: Record<string, any> = {
          title: articleDialogArticleTitle.value,
          des: articleDialogArticleDes.value,
          columnId: currentcolumnId,
          published: articleDialogisPublish.value,
        }
        let res = await axios.post(
          config.url_base + "/nihil-note/article/article",
          param
        );
        if (res.data.code == 200) {
          articleDialogUiVisitable.value = false
          getArticleListByColumnId(currentcolumnIndex);
          myArray.value[currentcolumnIndex].num++
        }
      } else {
        console.log("HomeView: 编辑文章信息被调用")
        let reqData: Record<string, any> = {
          id: currentArticleId,
          title: articleDialogArticleTitle.value,
          des: articleDialogArticleDes.value,
          published: articleDialogisPublish.value,
        }
        let res = await axios.put(
          config.url_base + "/nihil-note/article/article",
          reqData
        )
        if (res.data.code == 200) {
          articleDialogUiVisitable.value = false
          getArticleListByColumnId(currentcolumnIndex);
        }
      }
    };

    // 文章保存回调方法
    const onSaveArticle = async (param: any) => {
      debugger
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
          let res = await axios.put(
            config.url_base + "/nihil-note/article/article",
            reqData
          )
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

    // Markdown Editor 显示模式控制方法
    const onClickEditorModelController = (type: string) => {
      editorShowModel.value = type
    }

    const myContent = ref('<h1>asdfdg</h1>');
    const mymarkdown = ref("12341");

    const updateContent = function (value: string) {
      console.log(value)
      myContent.value = value;
      mymarkdown.value = "123578iujhgf";
    }

    // 测试方法
    const onClickTestButtom = function () {
      console.log("-----------------")
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

    return {
      CirclePlusFilled,
      Management,
      List,
      myArray,
      controlArticleList,
      onClickArticle,
      articleRightClickHandle,
      onRightClickColumn,
      RightMenutopNumber,
      RightMenuleftNumber,
      showRightMenu,
      rightClickHandle,
      goEdit,
      goEditWithOutID,
      deleteArticle,
      leftSpaceClickHandle,
      rightMenuModel,
      createColumn,      // 右键菜单方法
      delColumn,         // 右键菜单方法
      createArticle,     // 右键菜单方法
      createColumnUiVisitable,
      onClickConfirmArticleDialog,  // 点击创建文章确定方法 --- 点击确认
      confirmCreateColumn,   // 点击创建专栏确认方法 --- 点击确认
      createColumnName,
      createColumnisPublish,
      createColumnDes,
      articleDialogUiVisitable,
      articleDialogType,
      articleDialogArticleTitle,
      articleDialogArticleDes,
      articleDialogisPublish,
      onArticleMoveEnd,
      addTab,
      removeTab,
      tabIndex,
      editableTabsValue,
      editableTabs,
      updateContent,
      onClickTestButtom,
      mymarkdown,
      myContent,
      onSaveArticle,
      onChangeMarkdown,
      editorShowModel,
      onClickEditorModelController,
      editArticleInfo,
      copyArticle,
      pasteArticle,
      onClickElTabs,
      copyArticleUrl,
      copyArticleTitle,
    };
  },
  mounted() {
  },
  components: { ResizableLR, draggable, ArrowDownBold, ArrowUpBold, EditorAndShower },

  methods: {},
});
</script>

<template>
  <!-- 窗口主页面 -->
  <div
    class="main_window"
    @contextmenu.prevent="rightClickHandle($event)"
    :onClick="rightClickHandle"
  >
    <!-- 左侧导航栏 -->
    <div class="left_nav">
      <el-icon>
        <Management />
      </el-icon>
      <el-icon>
        <List />
      </el-icon>
      <el-icon>
        <CirclePlusFilled :onClick="goEditWithOutID" />
      </el-icon>
    </div>
    <!-- 右半主体 -->
    <div class="right_content">
      <ResizableLR>
        <!-- 树状专栏文件 -->
        <template #left>
          <div
            class="column_tree"
            :style="{ width: '100%', height: '100%' }"
            @contextmenu.prevent="leftSpaceClickHandle($event)"
          >
            <draggable
              v-model="myArray"
              itemKey="id"
              :componentData="{
                tag: 'div',
                type: 'transition-group',
              }"
            >
              <template #item="{ element, index }">
                <div
                  class="column_item"
                  :onClick="
                    () => {
                      controlArticleList(index);
                    }
                  "
                  @contextmenu.prevent="
                    onRightClickColumn(element.id, index, $event)
                  "
                >
                  <el-icon>
                    <ArrowDownBold
                      v-if="!element.showArticle"
                      :onClick="
                        () => {
                          myArray[index].showArticle = true;
                        }
                      "
                    />
                    <ArrowUpBold
                      v-else
                      :onClick="(e: any) => { myArray[index].showArticle = false; e.stopPropagation() }"
                    />
                  </el-icon>
                  {{ element.name }}
                  <span>{{ element.num }}</span>
                  <draggable
                    v-if="element.showArticle"
                    v-model="myArray[index].articles"
                    itemKey="id"
                    :componentData="{
                      tag: 'div',
                      type: 'transition-group',
                    }"
                    @end="onArticleMoveEnd($event, index)"
                  >
                    <!-- 这里必须用element 接取值，注意这里的element已经编程了文章 -->
                    <template #item="item2">
                      <div
                        class="column_item"
                        @contextmenu.prevent="
                          articleRightClickHandle(
                            element.id,
                            index,
                            item2.element.id,
                            item2.index,
                            $event
                          )
                        "
                        :onClick="
                          () => {
                            onClickArticle(item2.element.id);
                          }
                        "
                      >
                        {{ item2.element.title }}
                      </div>
                    </template>
                  </draggable>
                </div>
              </template>
            </draggable>
          </div>
        </template>
        <!-- 编辑区域 -->
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
    </div>
  </div>

  <!-- 右键菜单栏 -->
  <div
    v-if="showRightMenu"
    class="right-menu"
    :style="{
      top: RightMenutopNumber + 'px',
      left: RightMenuleftNumber + 'px',
    }"
  >
    <!-- for article for文章-->
    <div v-if="'article' == rightMenuModel">
      <div class="el-menu-item" :onClick="editArticleInfo">编辑</div>
      <div class="el-menu-item" :onClick="deleteArticle">删除</div>
      <div class="el-menu-item" :onClick="copyArticle">复制</div>
      <div class="el-menu-item" :onClick="pasteArticle">粘贴</div>
      <div class="el-menu-item" :onClick="copyArticleUrl">复制连接</div>
      <div class="el-menu-item" :onClick="copyArticleTitle">复制标题</div>
    </div>

    <!-- for左侧空白 -->
    <div
      v-if="'leftSpace' == rightMenuModel"
      class="el-menu-item"
      :onClick="createColumn"
    >
      新建专栏
    </div>

    <!-- for column for 专栏 -->
    <div v-if="'column' == rightMenuModel">
      <div class="el-menu-item" :onClick="createColumn">新建专栏</div>
      <div class="el-menu-item" :onClick="delColumn">删除专栏</div>
      <div class="el-menu-item" :onClick="createArticle">新建文章</div>
    </div>
  </div>

  <!-- 添加专栏的对话框  -->
  <el-dialog
    v-model="createColumnUiVisitable"
    title="创建专栏"
    width="30%"
    center
  >
    <div>专栏名：</div>
    <el-input
      v-model="createColumnName"
      maxlength="40"
      placeholder="请输入专栏标题"
      show-word-limit
      type="text"
    />
    <div>专栏描述:</div>
    <el-input
      v-model="createColumnDes"
      maxlength="30"
      placeholder="Please input"
      show-word-limit
      type="textarea"
    />

    <div>是否公开： <el-switch v-model="createColumnisPublish" /></div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="createColumnUiVisitable = false">Cancel</el-button>
        <el-button type="primary" @click="confirmCreateColumn">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 添加文章的对话框  -->
  <el-dialog
    v-model="articleDialogUiVisitable"
    :title="articleDialogType == 'create' ? '添加文章信息' : '编辑文章信息'"
    width="30%"
    center
  >
    <div>文章标题：</div>
    <el-input
      v-model="articleDialogArticleTitle"
      maxlength="40"
      placeholder="请输入文章标题"
      show-word-limit
      type="text"
    />
    <div>文章描述:</div>
    <el-input
      v-model="articleDialogArticleDes"
      maxlength="50"
      placeholder="Please input"
      show-word-limit
      type="textarea"
    />

    <div>是否公开： <el-switch v-model="articleDialogisPublish" /></div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="articleDialogUiVisitable = false">Cancel</el-button>
        <el-button type="primary" @click="onClickConfirmArticleDialog">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss">
.main_window {
  width: 100%;
  height: 100%;
  display: flex;

  .column_tree,
  .right_box {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    overflow-y: scroll;
    overflow-x: hidden;
    .el-tab-pane {
      max-height: calc(100vh - var(--el-tabs-header-height) - 24px);
      overflow-y: scroll;
    }
  }

  //滚动条样式
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

  .nihil-ResizableLR .Right {
    padding: 8px 0 0 0;
  }

  .left_nav {
    width: 48px;
    height: 100%;
    max-width: 48px;
    min-width: 48px;

    .el-icon {
      width: 48px;
      height: 48px;

      svg {
        width: 2rem;
        height: 2rem;
      }
    }
  }

  .right_content {
    width: 0%;
    flex-grow: 1;
    height: 100%;

    .column_item {
      font-size: 1.2rem;
      padding: 4px 10px;
      border: 1px solid #333;
    }
  }
}

.right-menu {
  width: 130px;
  position: fixed;
  z-index: 1000;
  background-color: white;

  .el-menu-item {
    height: 2rem;
  }
}

.rightTopFuntionList {
  position: absolute;
  right: 16px;
  top: 56px;
  z-index: 100;
  opacity: 0.5;
  button {
    padding: 0;
    display: block;
    width: 1.4rem;
    height: 1.4rem;
    margin: 3px;
    font-size: 1rem;
    font-family: math;
    border: 1px solid gray;
    border-radius: 50%;
    cursor: pointer;
  }
}
</style>
