<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <input /><br/><br/>
    <button @click="aaa">(aaa):调用一个不存在的方法zzz</button><br/>
    <button @click="bbb">(bbb):console调用一个不存在的方法tError</button><br/>
    <button @click="ccc">(ccc):Sentry.captureException抛出异常</button><br/>
    <button @click="ddd">(ddd):throw new Error</button> 
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'
import * as Sentry from '@sentry/vue'
 
export default {
  name: 'HomeView',
  components: {
    HelloWorld
  },
  created () {
  },
  mounted(){

  },
  methods : {
    aaa(){
      console.log("aaaa")
      zzz() //调用一个不存在的方法
    },
    bbb(){  
     console.log("bbbb")
     console.tError("bbbbbbbb");  //console_error
    },
    ccc(){ 
      console.log("ccc")
      Sentry.captureException('ccccccc')
    }, 
    async ddd(){ 
      throw new Error("ddddddd");   //new Error 
    },
  } 
}
</script>

