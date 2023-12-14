<script lang="ts">
import { defineComponent, ref } from "vue";
import type Node from 'element-plus/es/components/tree/src/model/node'
import { getColumns, addColumn, addArticle, getArticleList } from '../client/FileNodeClient'
import { checkRes } from '../utils/CommenResultHandler'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import typeFolder from '../assets/icon/type_folder.svg'
import typeMarkdown from '../assets/icon/type_markdown.svg'
import NihilContextmenu from '../components/nihil-ui/nihil-contextmenu/NihilContextmenu.vue'
import config from "../config.json";
export default defineComponent({
  setup() {

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

    // 前后端交互方法——获取专栏下的所有文章
    getColumns().then((res) => {
      if (checkRes(res)) {
        let rootId = res.data.data.folderId
        fileTreeIniExpanded.value = [rootId]
        fileNodeTreeData.value = [
          {
            id: rootId,
            name: res.data.data.folderName,
            type : "FOLDER",
            children: res.data.data.childFiles.map((item: any) => {
              item.isLeaf = item.fileNum == 0;
              return item;
            }),
            isLeaf: false
          }]
      }
    })


    // 操作方法

    // const append = (data: Tree) => {
    //   const newChild = { id: id++, name: 'testtest', children: [] }
    //   if (!data.children) {
    //     data.children = []
    //   }
    //   data.children.push(newChild)
    //   dataSource.value = [...dataSource.value]
    // }

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
          selectNodeData.value.children.push(newChild)
          fileNodeTreeData.value = [...fileNodeTreeData.value]
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
            if (!selectNodeData.value.children) {
              selectNodeData.value.children = []
            }
            selectNodeData.value.children.push(newChild)
            fileNodeTreeData.value = [...fileNodeTreeData.value]
          }
        })
      } else {
        console.log("HomeView: 编辑文章信息被调用")
        let reqData: Record<string, any> = {
          id: selectNodeData.value.id,
          title: articleDialogArticleTitle.value,
          des: articleDialogArticleDes.value,
          published: articleDialogisPublish.value,
        }
        // let res = await axios.put(
        //   config.url_base + "/nihil-note/article/article",
        //   reqData
        // )
        // if (res.data.code == 200) {
        //   articleDialogUiVisitable.value = false
        //   getArticleListByColumnId(currentcolumnIndex);
        // }
      }
    };

    // 右键点击事件
    const onContextMenuClick = (event:any, data:any)=>{
      console.log(event)
      console.log(data)
      contextMenuEvent.value = event
      selectNodeData.value = data
    }

    // 
    const fileTreeloadNode = (node: Node, resolve: (data: Tree[]) => void) => {
      console.log(node)

      getArticleList(node.data.id).then((res)=>{
        if(checkRes(res)){
          resolve(res.data.data.map((item: any) => {
              item.isLeaf = item.fileNum == 0;
              return item;
            }))
        }
      })
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
      onContextMenuClick,
      elTreeProps,
      typeFolder,
      contextMenuEvent,
      fileTreeIniExpanded,
      typeIconMap,
    };
  },
  components:{NihilContextmenu}
});
</script>

<template>
  <br />
  <br />
  <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
  <div>
    <p>Using scoped slot</p>
    <el-tree
      :data="fileNodeTreeData"
      node-key="id"
      lazy 
      :props="elTreeProps"
      :load="fileTreeloadNode"
      :default-expanded-keys="fileTreeIniExpanded"
    >
      <template #default="{ node, data }">
        <div v-on:contextmenu.prevent="onContextMenuClick($event, data)">
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
    <div class="el-menu-item" :onClick="createColumn">新建专栏</div>
    <div class="el-menu-item" :onClick="delColumn">删除专栏</div>
    <div class="el-menu-item" :onClick="createArticle">新建文章</div>
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