const UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const path = require('path')
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const cdn = [
    "https://cdn.bootcss.com/vue/2.5.21/vue.min.js",
    "https://cdn.bootcss.com/vue-router/3.0.2/vue-router.min.js",
    'https://cdn.bootcss.com/vuex/3.0.1/vuex.min.js',
    "https://cdn.bootcss.com/element-ui/2.4.11/index.js",
    'https://cdn.bootcss.com/axios/0.18.0/axios.min.js',
    'https://cdn.bootcss.com/js-cookie/2.2.0/js.cookie.min.js',
]
const externals = {
    'vue': 'Vue',
    'vue-router': 'VueRouter',
    'vuex': 'Vuex',
    'element-ui': 'ELEMENT',
    'axios': 'axios',
    'js-cookie': 'Cookies',
}

function resolve(dir) {
    return path.join(__dirname, dir)
}


module.exports = {
    baseUrl: '',
    assetsDir: './static',
    chainWebpack: config => {
        /**
         * 删除懒加载模块的 prefetch preload，降低带宽压力(使用在移动端)
         */
        // config.plugins
        //     .delete('prefetch')
        //     .delete('preload')
        config.resolve.alias
            .set('@', resolve('src/'))
            .set('util', resolve('src/util'))
            .set('mixins', resolve('src/mixins'))
        const svgRule = config.module.rule('svg')
        svgRule.uses.clear()
        config.module
            .rule('svg')
            .test(/\.svg$/)
            .include
            .add(resolve('src/icons')) //处理svg目录
            .end()
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .options({
                symbolId: 'icon-[name]'
            })
        // 修改images loader 添加svg处理
        const imagesRule = config.module.rule('images')
        imagesRule
            .exclude
            .add(resolve('src/icons'))
        config.module
            .rule('images')
            .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
        if (IS_PRODUCTION) {
            config
                .plugin('analyzer')
                .use(BundleAnalyzerPlugin)
                .end()
                .plugin('html')
                .tap(args => {
                    args[0].cdn = cdn;
                    return args;
                })
                .end()
                //gzip需要nginx进行配合否则无法使用
                .plugin('compression')
                .use(CompressionWebpackPlugin)
                .tap(() => [{
                        test: /\.js$|\.html$|\.css/, //匹配文件名
                        threshold: 10240, //超过10k进行压缩
                        deleteOriginalAssets: false //是否删除源文件
                    }]
                )
            config
                .externals(externals)
            config.optimization
                .minimizer([
                    new UglifyjsWebpackPlugin({
                        uglifyOptions: {
                            compress: {
                                warnings: false,
                                drop_console: true,
                                drop_debugger: true,
                                pure_funcs: ['console.log']
                            }
                        }
                    })
                ])
        }
    },
    css: {
        loaderOptions: {
            // 给 sass-loader 传递选项
            sass: {
                // @/ 是 src/ 的别名
                // 所以这里假设你有 `src/variables.scss` 这个文件
                data: `@import "@/style/index.scss";`
            }
        }
    },
    devServer: {
        host: '0.0.0.0',
        overlay: false,
        port: 8070,
        open: true
    }
}
