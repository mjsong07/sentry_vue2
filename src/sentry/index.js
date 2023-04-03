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