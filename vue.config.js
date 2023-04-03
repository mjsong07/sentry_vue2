// vue.config.js
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
 