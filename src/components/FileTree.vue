<script lang="ts">
import { defineComponent, ref } from "vue";
import type Node from 'element-plus/es/components/tree/src/model/node'
import { getColumns, addColumn, addArticle, deleteArticle, getArticleList, deleteNodeSafely, moveFileNode, updateArticle } from '../client/FileNodeClient'
import {reSetCSRFToken} from "../client/AxiosCustom"
import { checkRes } from '../utils/CommenResultHandler'
import { ElMessage, ElMessageBox, ElNotification, ElTree } from 'element-plus'
import typeFolder from '../assets/icon/type_folder.svg'
import typeMarkdown from '../assets/icon/type_markdown.svg'
import NihilContextmenu from '../components/nihil-ui/nihil-contextmenu/NihilContextmenu.vue'
import config from "../config.json";

import type { DragEvents } from 'element-plus/es/components/tree/src/model/useDragNode'
import type {
  AllowDropType,
  NodeDropType,
} from 'element-plus/es/components/tree/src/tree.type'

import { copyContentToClipboard } from "../utils/clipboard_util.js";

export default defineComponent({

  emits: ["onClickFileNode"],
  setup(props, {emit}) {
    interface Tree {
      id: number
      name: string
      children?: Tree[]
      fileNum?: number
      isLeaf?: boolean
      type:string
    }

    const elTreeProps = ref({
      children: 'children',
      isLeaf: 'isLeaf',
    })


    // 类型图标映射
    const typeIconMap = ref({
      'FOLDER': typeFolder,
      'markdown': typeMarkdown,
    })

    const fileTreeIniExpanded = ref<Array<any>>([])

    // 显示数据
    const fileNodeTreeData = ref<Array<Tree>>([]);

    // 获取树状控件
    const fileTree = ref<any>();


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

    // 显示控制变量：控制右键菜单展开
    const contextmenuVisible = ref(false)
    const contextMenuEvent = ref({});

    // 临时变量
    const selectNodeData = ref<Tree>({
      id: -1,
      name: "",
      fileNum: 0,
      isLeaf: true,
      type: "FOLDER"
    });

    const selectNode = ref<Node>();

    // 前后端交互方法——获取专栏下的所有文章
    getColumns().then((res) => {
      if(res.request.responseURL.endsWith("/login")){
        location.href = "https://169.254.253.34/nihil-note/oauth2/authorization/default-client"
        location.href = "https://127.0.0.1/nihil-note/oauth2/authorization/default-client"
      }
      if (checkRes(res)) {
        let rootId = res.data.data.folderId
        fileTreeIniExpanded.value = [rootId]
        fileNodeTreeData.value = [
          {
            id: rootId,
            name: res.data.data.folderName,
            type : "FOLDER",
            // children: res.data.data.childFiles.map((item: any) => {
            //   item.isLeaf = item.fileNum == 0;
            //   return item;
            // }),
            isLeaf: false,

          }]
      }
    }).then(()=>{
      reSetCSRFToken();
    })

    const remove = (node: Node, data: Tree) => {
      const parent = node.parent
      const children: Tree[] = parent.data.children || parent.data
      const index = children.findIndex((d) => d.id === data.id)
      children.splice(index, 1)
      fileNodeTreeData.value = [...fileNodeTreeData.value]
    }

    // 右键菜单、右键专栏菜单方法： 删除专栏
    const delColumn = async () => {
      contextmenuVisible.value = false;
      if (!selectNode.value?.isLeaf) {
        ElMessageBox.confirm("删除专栏之前需要清空专栏内部的所有文章", "Warning", {
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          type: "warning",
        })
        return;
      }

      ElMessageBox.confirm("确认删除? Continue?", "Warning", {
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        type: "warning",
      })
        .then(async () => {
          let res;
          if(selectNode.value?.data.type == 'FOLDER'){
            res = await deleteNodeSafely(selectNodeData.value.id)
          }
          else{
            res = await deleteArticle(selectNodeData.value.id)
          }
          if (res.data.code == 200) {
            fileTree.value.remove(selectNodeData.value)
          }
        })
        .catch(() => {
          ElMessage({
            type: "info",
            message: "Delete canceled",
          });
        });

      contextmenuVisible.value = false;
    }

    // 点击菜单创建文章方法 --- 弹出创建文章的对话框（模态框）
    const createArticle = async function () {
      articleDialogType.value = "create";
      articleDialogUiVisitable.value = true;
      contextmenuVisible.value = false;
    };

    // 点击菜单创建专栏方法 --- 弹出创建专栏的对话框（模态框）
    const createColumn = async function () {
      createColumnUiVisitable.value = true;
      contextmenuVisible.value = false;
    };

    // 确认方法：点击创建专栏确认方法 --- 点击确认
    const confirmCreateColumn = async function () {
      let param: Record<string, any> = {
        pid: selectNodeData.value.id,
        name: createColumnName.value,
        published: createColumnisPublish.value,
        des: createColumnDes.value,
      };
      addColumn(param).then((res) => {
        if (checkRes(res)) {
          const newChild = {
            id: res.data.data,
            name: createColumnName.value,
            children: [],
            isLeaf: true,
            type: "FOLDER",
          }
          if (!selectNodeData.value.children) {
            selectNodeData.value.children = []
          }
          // selectNodeData.value.children.push(newChild)
          // fileNodeTreeData.value = [...fileNodeTreeData.value]

          if(!selectNode.value?.loaded && selectNodeData.value.isLeaf){
            let oldfolderData = selectNodeData.value
            let oldParentData = selectNode.value?.parent.data
            fileTree.value.remove(oldfolderData)
            oldfolderData.isLeaf = false
            fileTree.value.append(oldfolderData, oldParentData)
          }
          fileTree.value.append(newChild, selectNodeData.value)
        }

        console.log(fileNodeTreeData.value)
      })
    };

    // 点击创建文章对话框（模态框）确认方法 --- 点击确定
    const onClickConfirmArticleDialog = async function () {
      if (articleDialogType.value == "create") {
        console.log("HomeView: 创建文章方法被调用")
        let param: Record<string, any> = {
          title: articleDialogArticleTitle.value,
          des: articleDialogArticleDes.value,
          columnId: selectNodeData.value.id,
          published: articleDialogisPublish.value,
        }
        addArticle(param).then(res=>{
          if(checkRes(res)){
            const newChild = {
              id: res.data.data,
              name: articleDialogArticleTitle.value,
              isLeaf: true,
              type: config.markdown_type,
            }
            if(!selectNode.value?.loaded && selectNodeData.value.isLeaf){
              let oldfolderData = selectNodeData.value
              let oldParentData = selectNode.value?.parent.data
              fileTree.value.remove(oldfolderData)
              oldfolderData.isLeaf = false
              fileTree.value.append(oldfolderData, oldParentData)
            }
            fileTree.value.append(newChild, selectNodeData.value)
          }
        })
      } else {
        console.log("HomeView: 编辑文章信息被调用")
        let reqData: Record<string, any> = {
          id: selectNodeData.value.id,
          title: articleDialogArticleTitle.value,
        }
        updateArticle(reqData).then((res)=>{
          if(checkRes(res)){
            selectNodeData.value.name = articleDialogArticleTitle.value
          }
        })
      }
    };

    // 右键点击事件
    const onContextMenuClick = (event:any, data:any, node:Node)=>{
      console.log(event)
      console.log(data)
      contextMenuEvent.value = event
      selectNodeData.value = data
      selectNode.value = node
    }

    // 左键点击事件
    const onClickFileNode = (data:any) => {
      emit("onClickFileNode", data)
    }

    // 
    const fileTreeloadNode = (node: Node, resolve: (data: Tree[]) => void) => {
      console.log(node)
      if(node.data.id){
        getArticleList(node.data.id).then((res)=>{
          if(checkRes(res)){
            resolve(res.data.data.map((item: any) => {
                item.isLeaf = item.fileNum == 0;
                return item;
              }))
          }
        })
      }
    }

    // 拖入控制，不允许非文件夹节点被 拖入
    const allowDrop = (draggingNode: Node, dropNode: Node, type: AllowDropType) => {
      if(dropNode.data.type !== 'FOLDER'){
        return type !== 'inner'
      }
      if(dropNode.data.name == ".nihil_note"){
        return false;
      }
      return true;
    }

    // 拖拽结束时事件
    const handleDragEnd = (
      draggingNode: Node,
      dropNode: Node,
      dropType: NodeDropType,
      ev: DragEvents
    ) => {
      console.log("draggingNode:", draggingNode)
      console.log("dropNode:", dropNode)
      console.log('tree drag end:', dropNode && dropNode.label, dropType)
      if(dropType == "none"){
        return
      }
      moveFileNode({
        nodeId:draggingNode.data.id,
        targetId:dropNode.data.id,
        type: dropType
      }).then((res)=>{
        if(checkRes(res)){
          console.log("handleDragEnd > OK")
        }
      })
    }

    // 菜单点击事件
    const onMenuClickEdit = () => {
      if(selectNodeData.value.type == 'markdown'){
        articleDialogArticleTitle.value = selectNodeData.value.name;
        articleDialogType.value = "edit";
        articleDialogUiVisitable.value = true;
        contextmenuVisible.value = false;
      }
    }

    const onMenuClickCopyFileName = () => {
      copyContentToClipboard(selectNodeData.value.name)
      contextmenuVisible.value = false
    }


    return {
      contextmenuVisible,
      fileNodeTreeData, remove, createColumn, delColumn, createArticle,
      createColumnName,
      createColumnDes,
      createColumnisPublish,
      createColumnUiVisitable,
      articleDialogUiVisitable,
      articleDialogType,
      articleDialogArticleTitle,
      articleDialogArticleDes,
      articleDialogisPublish,
      fileTreeloadNode,
      confirmCreateColumn,
      onClickConfirmArticleDialog,  // 点击创建文章确定方法 --- 点击确认
      onMenuClickEdit,
      onMenuClickCopyFileName,
      onContextMenuClick,
      onClickFileNode,
      elTreeProps,
      typeFolder,
      contextMenuEvent,
      fileTreeIniExpanded,
      typeIconMap,
      allowDrop,
      fileTree,
      handleDragEnd,
    };
  },
  components:{NihilContextmenu}
});
</script>

<template>
  <div>
    <el-tree
      :allow-drop="allowDrop"
      draggable
      ref="fileTree"
      :data="fileNodeTreeData"
      node-key="id"
      lazy 
      :props="elTreeProps"
      :load="fileTreeloadNode"
      :default-expanded-keys="fileTreeIniExpanded"
      @node-drag-end="handleDragEnd"
      class="nihil_file_tree"
    >
      <template #default="{ node, data }">
        <div 
          v-on:contextmenu.prevent="onContextMenuClick($event, data, node)"
          v-on:click="onClickFileNode(data)"
        >
          <img class="file_icon" :src="typeIconMap[data.type]">
          <span> {{ data.name }}</span>
        </div>
      </template>
    </el-tree>
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

  <NihilContextmenu v-model:visible="contextmenuVisible" :contextMenuEvent="contextMenuEvent">
    <div class="el-menu-item" :onClick="delColumn">删除</div>
    <div class="el-menu-item" :onClick="onMenuClickEdit">编辑</div>
    <div class="el-menu-item" :onClick="createColumn">新建专栏</div>
    <div class="el-menu-item" :onClick="createArticle">新建文章</div>
    <div class="el-menu-item" :onClick="onMenuClickCopyFileName">复制文件名</div>
  </NihilContextmenu>
</template>

<style scoped>
.file_icon{
  width: 1.2rem;
  height: 1.2rem;
  vertical-align: middle;
}
.el-menu-item{
    height: 28px;
    line-height: 28px;
    background-color: #eee;
}
</style>