import axios from 'axios';
import config from '../config.json';

const baseURL = config.url_base + '/nihil-note';


// 创建实例时设置配置的默认值
const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true, // 设置携带 cookie
});


const reSetCSRFToken = () => {
  axios.get(baseURL + "/csrf").then((res)=>{
    console.log(res);
    localStorage.setItem("CSRFToken", res.data.token);
  })
}

// 添加请求拦截器
instance.interceptors.request.use(function (config) {
  // 从 cookie 中获取 CSRF 令牌
  const csrfToken = localStorage.getItem("CSRFToken")

  // 将 CSRF 令牌添加到请求头中
  config.headers['X-CSRF-TOKEN'] = csrfToken;

  return config;
});

// 添加响应拦截器
instance.interceptors.response.use(
  // 对响应数据进行处理
  response => {
    // 判断是否为成功的响应
    if (response.status === 200) {
      // 返回经过处理的响应数据
      return response;
    }

    // 处理错误的响应
    return Promise.reject(new Error('响应错误'));
  },
  // 对响应错误进行处理
  error => {
    // 对于请求错误或响应错误，应该给出友好的提示信息
    if (error.message.includes('timeout')) {
      return Promise.reject(new Error('请求超时'));
    }
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          return Promise.reject(new Error('登陆过期，请重新登陆'));
        case 403:
          reSetCSRFToken();
          return Promise.reject(new Error('登录超时，请重试'));
        case 404:
          return Promise.reject(new Error('请求接口不存在'));
        default:
          return Promise.reject(new Error('服务器错误'));
      }
    } else {
      return Promise.reject(new Error('网络错误'));
    }
  }
);


export {instance, reSetCSRFToken};