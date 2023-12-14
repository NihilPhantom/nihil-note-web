import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'element-plus/dist/index.css'

import { ElButton, ElRow, ElInput, ElCol, ElUpload, ElOption, ElSelect, ElDialog, 
  ElIcon, ElSwitch, ElTabs, ElTabPane, ElTree, ElPopover, ElColorPicker } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'


import './assets/main.css'

const app = createApp(App)

// 引入 element 组件 
app.component(ElButton.name, ElButton)
app.component(ElRow.name, ElRow)
app.component(ElInput.name, ElInput)
app.component(ElCol.name, ElCol)
app.component(ElUpload.name, ElUpload)
app.component(ElOption.name, ElOption)
app.component(ElSelect.name, ElSelect)
app.component(ElDialog.name, ElDialog)
app.component(ElIcon.name, ElIcon)
app.component(ElSwitch.name, ElSwitch)
app.component(ElTabs.name, ElTabs)
app.component(ElTabPane.name, ElTabPane)
app.component(ElTree.name, ElTree)
app.component(ElPopover.name, ElPopover)
app.component(ElColorPicker.name, ElColorPicker)


// 引入所有 element-plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)

app.mount('#app')
