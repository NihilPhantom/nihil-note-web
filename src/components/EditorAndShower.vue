<script lang="ts">
/**
 * EditorAndShower 
 * √ 接口1：修改文本的回调
 * × 接口2：是否已经修改
 * 接口3：获取 Html 文本
 * √ 接口4：获取 MarkDown 原文本
 * √ 接口5：初始化 MarkDown 方法
 * 接口6：获取 CodeMiror 对象方法
 * √ 接口7：保存方法，返回{content,mdData} 
 */
import { defineComponent, ref, watch, reactive } from "vue";
import hljs, { type HighlightOptions } from "highlight.js"; // https://highlightjs.org/
import MarkdownIt from "markdown-it";

import { basicSetup, EditorView } from "codemirror";
import {EditorSelection} from "@codemirror/state";

import mk from "@iktakahiro/markdown-it-katex";
import axios from "axios";
import { mermaid, drawQueue } from "../utils/markdown-it-mermaid";

import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { ViewPlugin, keymap } from "@codemirror/view";

import TimerUtil from "../utils/time_util.js";
import { uuid } from "../utils/random_util.js";
import config from "../config.json";
// import {defaultKeymap} from "@codemirror/commands"

// 初始化 markdown
let md = MarkdownIt({
  html: true,
  highlight: function (str: string | HighlightOptions, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(lang, str, true).value +
          "</code></pre>"
        );
      } catch (__) { }
    }
    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
    );
  },
});

md.use(mk);
md.use(mermaid);

console.log("debugger：EditorAndShower 被调用了")

export default defineComponent({
  props: {
    content: {
      type: String,
      required: true,
    },
    mdData: {
      type: String,
      required: false,
    },
    showMode: {
      type: String,
      required: false,
    },
  },

  emits: ["update-content", "save", "change-markdown"],

  setup(props, { emit }) {
    console.log("debugger：EditorAndShower setup 被调用了")

    const myContent = ref(props.content);

    const view = ref<EditorView>();
    const divEditParent = ref(null);
    const divPreviewWindow = ref(null);

    let initMdData = "";

    // 颜色选择

    const selectColor = ref('rgba(255, 69, 0, 0.68)')
    const predefineColors = ref([
      '#ff4500',
      '#ff8c00',
      '#ffd700',
      '#90ee90',
      '#00ced1',
      '#1e90ff',
      '#c71585',
      'rgb(255, 120, 0)',
      'hsv(51, 100, 98)',
      'hsl(181, 100%, 37%)',
    ])

    // https://blog.csdn.net/ZYS10000/article/details/124535467
    watch(() => props.mdData, function (newVal, oldVal) {
      console.log("EditorAndShower：检测到props.mdData 发生改变：", newVal)
      initMdData = newVal || "";
    }, {
      immediate: true,
    })

    // function updateContent() {
    //   myContent.value = "Content updated in Child!";
    //   emit("update-content", myContent.value);
    // }

    let saveArticle = () => {
      if (props.mdData == view.value?.state.doc.toString()) {
        console.log("EditorAndShower：由于文本内容没有发生改变，所以没有触发提交事件")
        return;
      }
      myContent.value = md.render(view.value?.state.doc.toString())
      Promise.all(drawQueue).then(() => {
        emit("save", {
          content: divPreviewWindow.value.innerHTML,
          mdData: view.value?.state.doc.toString()
        });
      })
    }

    const onChangeColor = (value:string)=>{
      console.log(value)
      view.value?.dispatch(view.value?.state.changeByRange((range) => ({
        changes: [{from: range.from, insert: `<font color="${value}">`}, {from: range.to, insert: "</font>"}],
        range: EditorSelection.range(range.from, range.to + 29)
      })))
    }

    // 菜单栏按钮点击事件：点击保存按钮触发事件
    const onClickSaveToolButton = ()=> {
      saveArticle();
    }

    return {
      myContent,
      saveArticle,
      divEditParent,    // 用来获取dom元素
      divPreviewWindow, // 用来绑定dom 元素
      initMdData,
      selectColor,
      predefineColors,
      onChangeColor,
      onClickSaveToolButton,
      view,
    };
  },

  mounted() {
    const that = this
    let debounceId = uuid()
    // 初始化 CodeMirror 
    this.view = new EditorView({
      doc: this.initMdData,
      extensions: [
        basicSetup,
        markdown({ codeLanguages: languages }),
        ViewPlugin.fromClass(
          class {
            constructor(view) { }
            update(update) {
              if (update.docChanged)
                TimerUtil.registerDebounce("Db_toMarkdown" + debounceId, 500, function () {
                  let _md = that.view.state.doc.toString();
                  let previewDom = that.divPreviewWindow as any
                  console.log("debugger：previewDom", previewDom)
                  console.log("_md", _md)
                  if (previewDom === null) {
                    return;
                  }
                  that.myContent = md.render(_md);
                  that.$emit("change-markdown", _md);
                });
            }
          }
        ),
        keymap.of([
          {
            key: "Ctrl-s",
            run() {
              console.log("EditorAndShower：Ctrl-s 文档保存功能触发")
              that.saveArticle()
              return true;
            },
          },
          {
            key: "Shift-Space",
            run({ state, dispatch }) {
              let transaction = state.update(state.replaceSelection("&nbsp;"))
              dispatch(transaction)
              return true;
            },
          },
        ]),
      ],
      parent: this.divEditParent || document.createElement("div"),
    });

    // 实现图片复制上传，图片上传
    async function uploadFile(file: any) {
      var index = Math.random().toString(10).substr(2, 5) + '-' + Math.random().toString(36).substr(2);
      var fileName = index + '.png';
      var formData = new FormData();
      formData.append('name', fileName);
      formData.append('file', file, fileName);
      formData.append('path', "markdown/");
      let res = await axios.post(
        "/nihil-order-file-server/node/file/fs",
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return res.data
    }

    // 监听 CodeMirror 粘贴事件，绑定图片上传
    this.view.dom.addEventListener('paste', async function (e) {
      var clipboardData = e.clipboardData as any;
      var items = clipboardData.items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          console.log(e)
          e.preventDefault();
          let res = await uploadFile(items[i].getAsFile())
          if (res.code == "200") {
            console.log("EditorAndShower：图像上传成功")
            let file_url = '/nihil-order-file-server/node/file/' + res.data;
            // let file_name = res.data['name'];
            // let img = "\n![" + file_name + "](" + file_url + ")\n";
            let img = "<center>\n" +
              "  <img src=\"" + file_url + "\" style=\"width:50%;\"/>\n" +
              "</center>\n"
            const view = that.view.__v_raw
            let transaction = view.state.update(view.state.replaceSelection(img))
            view.dispatch(transaction)
          }
          break;
        }
      }
    });
  }
});
</script>

<template>
  <!-- 页面主要内容 -->
    <!-- 工具栏  -->
  <el-row class="toolBar"
    :class="{
       hidden: showMode == 'html',
    }"
  >
    <!-- <el-button type="primary" :icon="SemiSelect">加粗</el-button>
    <el-button type="primary" :icon="TopRight">斜体</el-button>
    <el-button type="primary">标题</el-button> -->
    <el-color-picker v-model="selectColor" :predefine="predefineColors" @change="onChangeColor"/>
    <svg t="1690356800549" class="icon" viewBox="0 0 1024 1024" 
      version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7504" 
      width="32" height="32" v-on:click="onClickSaveToolButton">
        <path d="M292.571429 121.904762v243.809524h438.857142V145.578667l170.666667 175.225904V828.952381a73.142857 73.142857 0 0 1-73.142857 73.142857h-97.52381V536.380952H292.571429v365.714286H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142857V195.047619a73.142857 73.142857 0 0 1 73.142857-73.142857h97.52381z m365.714285 512v268.190476H365.714286V633.904762h292.571428z m-48.761904 48.761905h-195.04762v73.142857h195.04762v-73.142857z m48.761904-560.761905v170.666667H365.714286V121.904762h292.571428z" p-id="7505">
        </path>
      </svg>
  </el-row>
  <el-row>
    <!-- 编辑区 : (这里会被codemirror填充成编辑器) -->
    <el-col
      :span="showMode == 'all' ? 12 : 24"
      :class="{
        hidden: showMode == 'html',
      }"
      :style="{marginTop:'32px'}"
    >
      <!-- 文本框 -->
      <div ref="divEditParent"></div>
    </el-col>
    <!-- 展示区 -->
    <div
      ref="divPreviewWindow"
      :class="{
        'el-col markdown': true,
        'el-col-12': showMode == 'all',
        'el-col-24': showMode != 'all',
        hidden: showMode == 'markdown',
      }"
      class="el-col markdown"
      v-html="myContent"
    ></div>
  </el-row>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}

.hidden {
  display: none;
}

.toolBar{
  position: fixed;
  z-index: 1;
}

</style>
