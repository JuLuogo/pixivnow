<template lang="pug">
#notification-view.body-inner
  h1.align-center 关于网站新建立的通知（2024年4月26日）
  Card
    p 各位，早上好中午好晚上好：
    p 欢迎来到我们新建立的 PixivNow 网站！本站由 pixivperoe 创建和维护，致力于为大家提供更好的 Pixiv 浏览体验。
    p 请注意：本网站内容仅供个人学习和研究使用，<strong>严禁传播</strong>。我们尊重原创作者的版权，请大家合理使用本站服务。
    p 如果您在使用过程中遇到任何问题，欢迎通过下方联系方式与我们取得联系。
    p 感谢您对我们网站的支持和理解！

    div(style='text-align: right')
      strong pixivperoe
      br
      time 2024年4月26日

  Card(title='赞助我们')
    .align-center
      iframe(
        frameborder='0'
        height='200'
        scrolling='no'
        src='https://afdian.com/leaflet?slug=peroe'
        width='640'
      )

  Card(title='联系我们')
    ul
      li QQ群：858701548
</template>

<script setup lang="ts">
import {} from 'vue'

const fromTime = new Date()
const toTime = new Date('2024-09-30T23:59:59Z')
const duration = toTime.getTime() - fromTime.getTime()
</script>

<style scoped lang="sass"></style>
