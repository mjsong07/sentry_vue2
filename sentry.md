# 1.提前准备
安装docker
https://juejin.cn/post/6933138818811822093

安装docker-compose
https://juejin.cn/post/6938209044238860296


# 2.安装
## 1.2 git+sh + docker-compose 安装
```sh
# 安装服务器 centOS7
# 注意这里要拉取指定版本，最新版本可能有bug 提示 Error in install/bootstrap-snuba.sh:3
git clone https://github.com/getsentry/self-hosted.git --branch 23.1.1
cd self-hosted
# 安装 
bash install.sh 
# 输入 邮箱和密码

# 修改启动配置
ls -a # 显示所有文件
vi .env # 

SENTRY_BIND=9001 # 把 9000 改为 9001 防止端口冲突
#启动服务
docker-compose up -d 
# 访问网页
http:127.0.0.1:9001 
# 输入 账号+密码 登录
```

## 1.2 docker安装（不推荐版本太低）

```sh
# 
# 1、拉取镜像
docker pull sentry       ###目前最新版本 只有9.1.2
docker pull redis
docker pull postgres

# 2、启动服务

docker run -d --name sentry-redis --restart=always redis   ###保证了，异常自动拉起
docker run -d --name sentry-postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_USER=sentry --restart=always postgres
 

# 3、生成sentry秘钥

docker run --rm sentry config generate-secret-key
xxxxx  ###打印出secret-keys


# 4、数据库及账户初始化

# 注意：过程中需要你创建用户和密码
docker run -it --rm -e SENTRY_SECRET_KEY='xxxxx' --link sentry-postgres:postgres --link sentry-redis:redis sentry upgrade

# 5、启动sentry的web服务

docker run -d -p 9001:9000 --name my-sentry -e SENTRY_SECRET_KEY='xxxxx' --link sentry-redis:redis --link sentry-postgres:postgres --restart=always sentry


# 6、启动sentry-cron/work服务

docker run -d --name sentry-cron -e SENTRY_SECRET_KEY='xxxx' --link sentry-postgres:postgres --link sentry-redis:redis sentry run cron

docker run -d --name sentry-worker-1 -e SENTRY_SECRET_KEY='xxxxx' --link sentry-postgres:postgres --link sentry-redis:redis sentry run worker

7、登录测试效果
http://xx.xx.xx.xx:9001/
```

# 2.vue 实例 手工上传sourcemap
```sh
# 安装插件
npm i -g @sentry/cli 
# 生成token
http://xx.xx.xx.xx:9001/
点击头像左下角，选择API，生成token，勾选project:write权限

# 登录
sentry-cli --url http://xx.xx.xx.xx:9001/ login

# 编辑生成的C:\Users\用户名\.sentryclirc
# 添加 
[defaults]
url=http://xx.xx.xx.xx:9001
org=sentry
project=vue  #注意这里生效是所有项目，这里指定project可能是用在默认项目

# 创建release
sentry-cli releases -o sentry -p vue new staging@1.0.2

# 上传sourcemap  
sentry-cli releases -o 组织名 -p 项目名 files 版本号 upload-sourcemaps 打包后js的目录 --url-prefix 线上js访问地址

sentry-cli releases -o sentry -p vue files 0.0.3 upload-sourcemaps ./dist/js --url-prefix ~/js
# 删除版本 目前测试不生效 意见网页版删除
sentry-cli releases -o sentry -p vue files staging@1.0.2 delete --all

```

# 3.vue webpack上传sourcemap
vue代码集成
```js
//安装依赖包
npm install @sentry/webpack-plugin 
//vue.config.js  
const SentryPlugin = require("@sentry/webpack-plugin");

console.log("当前版本",`${process.env.VUE_APP_ENV}@${process.env.VUE_APP_DEPLOY_VERSION}`)
const PUBLIC_PATH = '/'

module.exports = {
  productionSourceMap: true,  // 生产环境开启sourceMap
  configureWebpack: {
    devtool: 'source-map', // 开发环境开启
    plugins: [
      new SentryPlugin({
        // sentry-cli configuration
        authToken: process.env.SENTRY_AUTH_TOKEN,
        url: process.env.SENTRY_HOST,
        urlPrefix: `~${PUBLIC_PATH}`,
        org: process.env.VUE_APP_SENTRY_ORG,
        configFile: 'sentry.properties',
        project: process.env.VUE_APP_DEPLOY_PROJECT_NAME,
        release: `${process.env.VUE_APP_ENV}@${process.env.VUE_APP_DEPLOY_VERSION}`,
        // webpack specific configuration
        include: "./dist",
        ignore: ["node_modules"],
        errorHandler (err){
         console.error('\n\n@sentry/webpack-plugin upload sourceMap error', err, '\n\n');
        },
      }),
    ],
  }, 
};

// 打包时候移除map
//package.json
"scripts": {
    "build": "vue-cli-service build && rm -fr ./dist/js/*.map"
}
```

# 4.vue 代码集成
src\sentry\index.js
```js
import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'
import SentryRRWeb from '@sentry/rrweb';
// import * as Sentry from "@sentry/browser";
// import {
//   CaptureConsoleIntegration
// } from '@sentry/integrations'

const MySentry = {
  install: (app, opts) => {
    const { router, tracingOrigins = ['localhost', process.env.VUE_APP_SENTRY_TRACING_ORIGIN, /^\//] } = opts
    console.log(`[Sentry init release]${process.env.VUE_APP_ENV}@${process.env.VUE_APP_DEPLOY_VERSION}`)

    Sentry.init({
      app,
      // 项目监控api address
      dsn: `${process.env.VUE_APP_SENTRY_DSN}`,
      // 发布
      release: `${process.env.VUE_APP_ENV}@${process.env.VUE_APP_DEPLOY_VERSION}`,
      // 环境, 可自定义支持多环境
      environment: process.env.NODE_ENV,
      // is optional and is true if it is not provided. If you set it to false, Sentry will suppress sending all Vue components' props for logging.
      attachProps: true,
      // is optional and is false if it is not provided. If you set it to true, Sentry will call Vue's original logError function as well.
      logErrors: true,
      // 打开或关闭调试模式。如果启用了调试，则在发送事件出错时，SDK将尝试打印出有用的调试信息 
      debug: true,
      // 初始范围数据设置, 通常可用于设置应用、用户的初始数据
      // initialScope: {
      //   tags: { tag: process.env.VUE_APP_DEPLOY_VERSION }
      //   // userName: { id: 42, email: 'xxx@xxx.com' }
      // },
      // ---性能追踪---
      // 错误异常采样率
      tracesSampleRate: 1.0,
      // 跟踪子组件，并查看有关渲染过程的更多详细信息
      trackComponents: true,
      // hook 默认为 ['mounted']
      hooks: ['created', 'mounted'],
      // 集成配置
      integrations: [
        // Vue Router 路由集成
        // 跟踪程序加载期间的性能
        new Integrations.BrowserTracing({
          routingInstrumentation: Sentry.vueRouterInstrumentation(router),
          tracingOrigins
        }),
        // new SentryRRWeb(),
        new SentryRRWeb({
          checkoutEveryNms: 10 * 1000, // 每10秒重新制作快照
          checkoutEveryNth: 200, // 每 200 个 event 重新制作快照
          maskAllInputs: false, // 将所有输入内容记录为 *
        }),
        new Sentry.Replay({
          // Additional SDK configuration goes in here, for example:
          maskAllText: true,
          blockAllMedia: true,
        }),
        
        // 控制台日志捕获
        // new CaptureConsoleIntegration(
        //   {
        //     // array of methods that should be captured
        //     // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
        //     levels: ['warn', 'error']
        //   }
        // )
      ]
    })  
      // Sentry.setTag("rrweb.active",   "yes" );
  }
}

export default MySentry



//src\main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import MySentry from '@/sentry'

Vue.use(MySentry, { router })
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')


//.env
NODE_ENV = 'development'
VUE_APP_ENV = 'development'
VUE_APP_ENV_NAME = '测试环境'

# sentry
SENTRY_HOST=http://xx.xx.xx.xx:9001/
SENTRY_AUTH_TOKEN=4a59bf13f25948cd8eccca6242dca848d33d1b71d0654e69bee566c57061e1f7
VUE_APP_SENTRY_ORG=sentry
VUE_APP_DEPLOY_PROJECT_NAME=vue
VUE_APP_SENTRY_DSN=http://148bb5b83f284e0b98a284fc169bb712@xx.xx.xx.xx:9001/2
# 这里填写业务网址 
VUE_APP_SENTRY_TRACING_ORIGIN=http://xx.xx.xx.xx/
# 默认是开发环境的版本号
VUE_APP_DEPLOY_VERSION=0.2


//.env.production
NODE_ENV = 'production'
VUE_APP_ENV = 'production'
VUE_APP_ENV_NAME = '正式环境' 

# sentry
#这里覆盖正式环境版本号
VUE_APP_DEPLOY_VERSION=1.0


```
## 测试
npm run build 



# 5. gitlab集成(在gitlab查看消息sentry错误)
1. 在sentry ，在个人设置界面的侧边栏中选择“Auth Tokens”,然后选择“Create New Token”。
2. 极狐GitLab，打开需要监控的项目，在项目的设置页面中找到“监控”选项卡，然后展开“错误跟踪”选项，url :  http://xx.xx.xx.xx:9001/   令牌： 上面创建的token


# 6. Sentry 发布仓库关联(在sentry直接创建gitlab的issue)
1. Sentry -> 设置 -> 集成 -> gitlab -> add安装
2. 根据提示现在gitlab上设置  点击头像 -> perferences  -> applications 
3. 输入
```sh
Name: Sentry
Redirect URI: http://171.35.40.150:9001/extensions/gitlab/setup/
Scopes: api
```

4. 在 sentry输入上面git生成的 GitLab应用ID 和 GitLab应用秘钥 
```sh
GitLab地址 http://171.35.40.150:9001
GitLab组路径 可忽略
包含子组 [勾选]
验证SSL [取消勾选]
GitLab应用ID : 用步骤3生成的id
GitLab应用秘钥:  用步骤3生成的秘钥
```
 