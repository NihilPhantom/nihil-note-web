import axios from 'axios';
import {instance} from './AxiosCustom';
import config from '../config.json';

const baseURL = config.url_base + '/nihil-note';


export const getCSRFToken = () =>{
    return localStorage.getItem('CSRFToken');
}

export const setCSRFToken = (token)=>{
    localStorage.setItem('CSRFToken', token);
}

// export templatePost =  async (data) => {
//     if(getCSRFToken())
// }

// 获取用户根专栏下的所有文章
export const getColumns = () => axios.get(
    baseURL + "/column/column",
)


// 根据指定的专栏Id，获取专栏下的文章或者子专栏
export const getArticleList = (id) => axios.get(
    baseURL + "/column/articleList?id=" + id
)


// 专栏添加方法
export const addColumn = (param) => instance.post(
    "/column/column",
    param
)

// 添加文章方法
export const addArticle = (param) => instance.post(
    "/article/article", param );


// 根据文件id 获取文件内容 
export const getArticle = (id) => axios.get(
    baseURL + "/article/detail?id=" + id
)


// 删除文章
export const deleteArticle = (id) => instance.delete(
    "/article?id=" + id,
)


// 修改文章  根据文件id
export const updateArticle = (data) => instance.put(
    "/article",
    data
)


export const deleteNodeSafely = (id) => instance.delete(
    "/column/column?id=" + id,
)

// 移动节点：
export const moveFileNode = (reqData) => instance.put(
    "/node/move",
    reqData
)