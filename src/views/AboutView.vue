<template>
  <el-card shadow="never" class="aui-card--fill"> 
  <h1>rrweb录屏与回放</h1>
    <div class="rrweb-create">
      <el-button @click="crateWeb">开始录制</el-button>
      <el-button @click="saveWeb">保存录制</el-button>
      <el-button @click="getInfo">回放录屏</el-button>
    </div>
    <div id="replaycontent" style="width: 1000px;height: 500px;background-color: #cccccc"></div>
  </el-card>
</template>
<script>
import { record } from 'rrweb'
import 'rrweb-player/dist/style.css'
import rrwebPlayer from 'rrweb-player' 
import axios from 'axios'
export default {
  name: 'Rrweb',
  components: {},
  data () {
    return {
      events: []
    }
  },
  props: {},
  watch: {},
  methods: {
    // 开始录屏
    crateWeb () {
      let _this = this
      window.events = []
      record({
        emit (event) {
          // 用任意方式存储 event
          window.events.push(event)
        }
      })
    },
    // 保存录屏
    saveWeb () {
      console.log(window.events)
      // this.axios.post('/record/create/setCreate', {
      //   events: this.events
      // }).then(({ data: res }) => {
      //   this.crateWeb()
      // }).catch(() => {
      //   this.crateWeb()
      // })
    },
    // 回放录屏
    getInfo () {
      // this.$http.get('/record/create/getInfo', {
      //   params: {
      //     id: 18
      //   }
      // }).then(({ data: res }) => {
        let events = window.events //JSON.parse(res.data.events)
        // eslint-disable-next-line no-new,new-cap
        new rrwebPlayer({
          target: document.getElementById('replaycontent'),
          data: {
            events
          }
        })
      // }).catch(() => {
      //   this.crateWeb()
      // })
    }
  },
  computed: {},
  created () {
  },
  mounted () {

  }
}
</script>
<style lang="scss" scoped>
</style>
 

