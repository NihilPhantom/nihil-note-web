<script lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
import { SemiSelect, TopRight, Plus } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { defineComponent } from 'vue'

import { basicSetup, EditorView } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { ViewPlugin, keymap } from '@codemirror/view'



import MarkdownIt from "markdown-it"
import mk from '@iktakahiro/markdown-it-katex'
import hljs, { type HighlightOptions } from 'highlight.js'     // https://highlightjs.org/

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

import type { UploadProps } from 'element-plus'

import TimerUtil from '../utils/time_util.js'

import axios from 'axios';

import config from '../config.json'

import '../assets/markdown.scss'


// 初始化 markdown
let md = MarkdownIt({
  html: true,
  highlight: function (str: string | HighlightOptions, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>';
      } catch (__) { }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

md.use(mk);

let view: EditorView;

const articleDes = ref(''); // 使用描述

let headImgUrl: String;

const titleTex = ref('')

const imageUrl = ref('')

const isPublish = ref(false)

let articleId = "";


export default defineComponent({
  setup() {

    // 已选择的标签
    const selectedLabelList = ref([])

    let uploadUiVisitable = ref(false)

    // 
    const selectedColumn = ref('')
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


    // 图片上传成功触发方法 
    const handleAvatarSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
      imageUrl.value = URL.createObjectURL(uploadFile.raw!)
      console.log(response)
      headImgUrl = response.data.thumbUrl
    }

    // 提交 添加文章触发方法 
    const confirmUpdate = async function () {
      let param: Record<string, any> = {
        title: titleTex.value,
        des: articleDes.value,
        imgHref: headImgUrl,
        labelList: selectedLabelList.value,
        columnId: selectedColumn.value,
        markdown: view.state.doc.toString(),
        content: md.render(view.state.doc.toString()),
        published: isPublish.value,
      }
      console.log(param)

      if (articleId) {
        param.id = articleId
        let res = await axios.put(
          config.url_base + "/nihil-note/article/article",
          param
        )
        localStorage.removeItem(articleId)
      } else {
        let res = await axios.post(
          config.url_base + "/nihil-note/article/article",
          param,
        )
        if (res.data.code == 200) {
          localStorage.removeItem("tempId")
          ElNotification({
            title: 'Success',
            message: '文章发布成功',
            type: 'success',
          })
        }
      }
      uploadUiVisitable.value = false;
    }

    const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
      if (rawFile.size / 1024 / 1024 > 2) {
        ElMessage.error('Avatar picture size can not exceed 2MB!')
        return false
      }
      return true
    }

    // 【发布】按钮：点击触发方法
    const publishHandle = async function () {
      // 打开选择框
      uploadUiVisitable.value = true

      // 获取专栏
      let res = await axios.get("http://127.0.0.1:8000/nihil-note/column/column?authorId=1&published=true")
      let columnList = res.data.data.map((el: any, index: number) => {
        if (el.name == "临时专栏") {
          selectedColumn.value = el.id
        }
        return {
          'value': el.id,
          'label': el.name,
        }
      })
      columnOptions.value = columnList
    }

    return {
      titleTex, SemiSelect, TopRight, Plus, uploadUiVisitable, articleDes, selectedLabelList, labelOptions, selectedColumn, columnOptions,
      handleAvatarSuccess, beforeAvatarUpload, confirmUpdate, publishHandle, imageUrl, isPublish
    }  // 数据绑定必须使用 return 把数据返回出去
  },
  mounted() {

    // 文章初始化方法：如果是编辑已经存在的文章，就获取文章详情，并且赋值给对应数据
    articleId = this.$route.query.articleId as string;
    let markdownText = "Hello\n\n```javascript\nlet x = 'y'\n```";
    let _previewWindow = this.$refs.previewWindow as any;      // html显示区域的dom

    // 前端保存文章方法
    const saveArticleInlocalstorage = function () {
      if (articleId) {
        localStorage.setItem(articleId, view.state.doc.toString()); //转换成json字符串序列
      } else {
        localStorage.setItem("tempId", view.state.doc.toString()); //转换成json字符串序列
      }
    };

    const delArticleInlocalstorage = function (id: any) {
      localStorage.removeItem(id); //转换成json字符串序列
    };

    (async () => {
      if (articleId) {
        let res = await axios.get("http://127.0.0.1:8000/nihil-note/article/detail?id=" + articleId)
        titleTex.value = res.data.data.title
        articleDes.value = res.data.data.des
        imageUrl.value = res.data.data.imgHref
        isPublish.value = res.data.data.published
        markdownText = res.data.data.markdown;
        _previewWindow.innerHTML = res.data.data.content
      }
      view = new EditorView({
        doc: markdownText,
        extensions: [
          basicSetup,
          markdown({ codeLanguages: languages }),
          ViewPlugin.fromClass(class {
            constructor(view) { }
            update(update) {
              if (update.docChanged)
                TimerUtil.registerDebounce('Db_toMarkdown', 500, function () {
                  let _html = md.render(view.state.doc.toString())
                  let previewDom = document.getElementById("previewWindow")
                  if (previewDom === null) {
                    return
                  }
                  previewDom.innerHTML = _html
                })
            }
          }),
          keymap.of([
            {
              key: "Ctrl-s",
              run() {
                saveArticleInlocalstorage()
                return true
              }
            },
            {
              key: "Shift-Space",
              run({ state, dispatch }) {
                let transaction = state.update(state.replaceSelection("&nbsp;"))
                dispatch(transaction)
                return true;
              },
            },
          ])
        ],
        parent: document.getElementById("edit_parent") || document.body,
      })

      // 如果存在缓存就询问一下是否加载
      if (localStorage.getItem(articleId) || localStorage.getItem("tempId")) {
        ElMessageBox.confirm('找到之前记录，是否重新加载?').then(() => {
          markdownText = localStorage.getItem(articleId) || localStorage.getItem("tempId") || ""
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: markdownText }
          });
          _previewWindow.innerHTML = md.render(markdownText)
        })
          .catch(() => {
            // catch error
          })
      }

      // view.dom.addEventListener('change', async (e) => {
      // });

      // 实现图片复制上传
      async function uploadFile(file: any) {
        var index = Math.random().toString(10).substr(2, 5) + '-' + Math.random().toString(36).substr(2);
        var fileName = index + '.png';
        var formData = new FormData();
        formData.append('name', fileName);
        formData.append('file', file, fileName);

        let res = await axios.post(
          "http://127.0.0.1:8000/upimg/upload",
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        if (res.data.code == "200") {
          console.log(res)
          let file_url = res.data.data['url'];
          let file_name = res.data.data['name'];
          // let img = "\n![" + file_name + "](" + file_url + ")\n";
          let img = "<center>\n" +
            "  <img src=\"" + file_url + "\" style=\"width:50%;\"/>\n" +
            "</center>\n"
          let transaction = view.state.update(view.state.replaceSelection(img))
          view.dispatch(transaction)
        }
      }

      view.dom.addEventListener('paste', function (e) {
        var clipboardData = e.clipboardData as any;
        var items = clipboardData.items;
        for (var i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            console.log(e)
            e.preventDefault();
            uploadFile(items[i].getAsFile())
            break;
          }
        }
      });
    })()
  }
})
</script>

<template>
  <div>
    <!-- 头部信息 -->
    <div>
      <el-row>
        <div style="flex-grow: 1">
          <el-input
            v-model="titleTex"
            maxlength="80"
            placeholder="请输入文章标题"
            show-word-limit
            type="text"
          />
        </div>
        <el-button type="primary" @click="publishHandle" round>发布</el-button>
        <el-button type="info" round>保存</el-button>
      </el-row>
    </div>
    <!-- 工具栏  -->
    <el-row class="">
      <el-button type="primary" :icon="SemiSelect">加粗</el-button>
      <el-button type="primary" :icon="TopRight">斜体</el-button>
      <el-button type="primary">标题</el-button>
    </el-row>
    <!-- 页面主要内容 -->
    <el-row>
      <!-- 编辑区 : (这里会被codemirror填充成编辑器) -->
      <el-col :span="12" id="edit_parent"></el-col>
      <!-- 展示区 -->
      <div
        id="previewWindow"
        ref="previewWindow"
        class="el-col el-col-12 markdown"
      ></div>
    </el-row>
  </div>
  <el-dialog v-model="uploadUiVisitable" title="Warning" width="30%" center>
    <div>文章标题：</div>
    <el-input
      v-model="titleTex"
      maxlength="80"
      placeholder="请输入文章标题"
      show-word-limit
      type="text"
    />
    <div>文章描述:</div>
    <el-input
      v-model="articleDes"
      maxlength="30"
      placeholder="Please input"
      show-word-limit
      type="textarea"
    />
    <div>标签列表:</div>
    <el-select
      v-model="selectedLabelList"
      multiple
      collapse-tags
      collapse-tags-tooltip
      placeholder="Select"
      style="width: 240px"
    >
      <el-option
        v-for="item in labelOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <div>专栏列表:</div>
    <el-select
      v-model="selectedColumn"
      collapse-tags
      collapse-tags-tooltip
      placeholder="Select"
      style="width: 240px"
    >
      <el-option
        v-for="item in columnOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <div>是否公开： <el-switch v-model="isPublish" /></div>
    <div>标题图片</div>
    <el-upload
      class="avatar-uploader"
      action="http://127.0.0.1:8000/upimg/upload"
      :show-file-list="false"
      :on-success="handleAvatarSuccess"
      :before-upload="beforeAvatarUpload"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon">
        <Plus />
      </el-icon>
    </el-upload>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="uploadUiVisitable = false">Cancel</el-button>
        <el-button type="primary" @click="confirmUpdate"> Confirm </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>