<template lang="pug">
#discovery-view
  //- Error
  section(v-if='error')
    .body-inner
      h1 探索发现加载失败
    ErrorPage(:description='error' title='出大问题')

  //- Loading
  section(v-if='loadingDiscovery && !discoveryList.length')
    .body-inner
      h1 探索发现加载中……
    .loading
      Placeholder

  //- Result
  section(v-if='!error')
    .body-inner
      h1 探索发现
      .align-center
        NButton(
          :loading='loadingDiscovery'
          @click='refreshDiscovery'
          round
          secondary
          size='large'
          style='margin-bottom: 2rem'
        )
          template(#default) {{ loadingDiscovery ? '加载中' : '换一批' }}
          template(#icon): NIcon: IFasRandom
    
    NSpin(:show='loadingDiscovery && discoveryList.length')
      ArtworkLargeList(:artwork-list='discoveryList' v-if='discoveryList.length')
    
    //- 无限滚动加载更多
    ShowMore(
      :loading='loadingMore',
      :method='loadMoreDiscovery',
      :text='loadingMore ? "加载中..." : "加载更多"'
      v-if='hasMore && discoveryList.length && !error'
    )
    
    .no-more(v-if='!loadingDiscovery && !loadingMore && !discoveryList.length && !error')
      NCard(style='padding: 15vh 0'): NEmpty(description='暂无内容，请稍后再试')
    
    .no-more(v-if='!hasMore && discoveryList.length && !loadingMore')
      NCard(style='padding: 2rem 0'): NEmpty(description='没有更多内容了')
</template>

<script lang="ts" setup>
import ArtworkLargeList from '@/components/ArtworksList/ArtworkLargeList.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Placeholder from '@/components/Placeholder.vue'
import ShowMore from '@/components/ShowMore.vue'
import { NButton, NIcon, NCard, NEmpty, NSpin } from 'naive-ui'
import IFasRandom from '~icons/fa-solid/random'

import { getCache, setCache } from './siteCache'
import { isArtwork } from '@/utils'
import { ajax } from '@/utils/ajax'
import type { ArtworkInfo, ArtworkInfoOrAd } from '@/types'
import { setTitle } from '@/utils/setTitle'
import { effect } from 'vue'

const discoveryList = ref<ArtworkInfo[]>([])
const loadingDiscovery = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const error = ref('')
const currentOffset = ref(0)

// 刷新探索发现内容（替换当前内容）
async function refreshDiscovery(): Promise<void> {
  currentOffset.value = 0
  hasMore.value = true
  discoveryList.value = []
  await setDiscoveryNoCache()
}

// 加载更多内容（追加到现有内容）
async function loadMoreDiscovery(): Promise<void> {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  try {
    const response = await ajax.get(
      '/ajax/illust/discovery',
      { params: new URLSearchParams({ 
        mode: 'all', 
        max: '8',
        offset: currentOffset.value.toString()
      }) }
    )
    
    console.info('loadMoreDiscovery response:', response)
    
    // 检查 API 是否返回错误
    if (response.data?.error) {
      throw new Error(response.data.message || 'API 请求失败')
    }
    
    // 处理 Pixiv API 的标准响应格式
    const data = response.data?.body || response.data
    console.info('loadMoreDiscovery data:', data)
    
    // 检查数据结构
    if (!data || !data.illusts || !Array.isArray(data.illusts)) {
      console.warn('API 返回的数据格式:', data)
      hasMore.value = false
      return
    }
    
    const illusts = data.illusts.filter((item): item is ArtworkInfo =>
      isArtwork(item)
    )
    
    // 如果返回的数据少于请求的数量，说明没有更多了
    if (illusts.length < 8) {
      hasMore.value = false
    }
    
    // 追加新数据到现有列表
    discoveryList.value.push(...illusts)
    currentOffset.value += illusts.length
    
    // 更新缓存
    setCache('discovery.discoveryList', discoveryList.value)
  } catch (err) {
    console.error('加载更多探索发现失败', err)
    hasMore.value = false
  } finally {
    loadingMore.value = false
  }
}

async function setDiscoveryNoCache(): Promise<void> {
  if (loadingDiscovery.value) return
  try {
    loadingDiscovery.value = true
    const response = await ajax.get(
      '/ajax/illust/discovery',
      { params: new URLSearchParams({ mode: 'all', max: '8' }) }
    )
    console.info('setDiscoveryNoCache response:', response)
    
    // 检查 API 是否返回错误
    if (response.data?.error) {
      throw new Error(response.data.message || 'API 请求失败')
    }
    
    // 处理 Pixiv API 的标准响应格式
    const data = response.data?.body || response.data
    console.info('setDiscoveryNoCache data:', data)
    
    // 检查数据结构
    if (!data || !data.illusts || !Array.isArray(data.illusts)) {
      console.warn('API 返回的数据格式:', data)
      // 如果没有数据，设置为空数组而不是抛出错误
      discoveryList.value = []
      hasMore.value = false
      return
    }
    
    const illusts = data.illusts.filter((item): item is ArtworkInfo =>
      isArtwork(item)
    )
    discoveryList.value = illusts
    currentOffset.value = illusts.length
    
    // 如果返回的数据少于请求的数量，说明没有更多了
    if (illusts.length < 8) {
      hasMore.value = false
    }
    
    setCache('discovery.discoveryList', illusts)
  } catch (err) {
    console.error('获取探索发现失败', err)
    // 设置为空数组，避免页面崩溃
    discoveryList.value = []
    hasMore.value = false
  } finally {
    loadingDiscovery.value = false
  }
}

async function setDiscoveryFromCache(): Promise<void> {
  const cache = getCache('discovery.discoveryList')
  if (cache) {
    discoveryList.value = cache
    currentOffset.value = cache.length
    loadingDiscovery.value = false
  } else {
    await setDiscoveryNoCache()
  }
}

effect(() => setTitle('探索发现'))

onMounted(async () => {
  setDiscoveryFromCache()
})
</script>

<style lang="sass" scoped>
.loading
  text-align: center

.no-more
  text-align: center
  padding: 1rem
  opacity: 0.75
</style>