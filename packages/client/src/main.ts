import './style.css'
import Marku from './marku'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('未找到 #app 元素')

app.innerHTML = `
  <div>
    <h1>Marku 测试页面（精简版）</h1>

    <section class="section">
      <h2>计数器</h2>
      <p>页面访问量: <span marku-get-count="page-view">加载中...</span></p>
      <p>文章阅读量: <span marku-get-count="article-read">加载中...</span></p>
      <div>
        <button marku-set-count="page-view" marku-inc="1">增加 页面访问量</button>
        <button marku-set-count="article-read" marku-inc="2">增加 文章阅读量 (+2)</button>
      </div>
    </section>

    <section class="section">
      <h2>评论提交</h2>
      <form marku-comment-form="test-article" id="comment-form">
        <div>
          <label>昵称: <input type="text" marku-comment-username placeholder="昵称" required></label>
        </div>
        <div>
          <label>邮箱: <input type="email" marku-comment-email placeholder="邮箱" required></label>
        </div>
        <div>
          <label>网址: <input type="url" marku-comment-url placeholder="网址(可选)"></label>
        </div>
        <div>
          <label>评论: <textarea marku-comment-content placeholder="请输入评论" required></textarea></label>
        </div>
        <div>
          <button type="button" marku-comment-submit>提交评论</button>
          <button type="reset">重置</button>
        </div>
      </form>
    </section>

    <section class="section">
      <h2>评论列表</h2>
      <div id="comment-list" marku-comment-list="test-article">
        <template marku-comment-template="parent">
          <div class="comment-parent">
            <div><strong marku-comment-username></strong></div>
            <p marku-comment-content></p>
            <div marku-comment-reply-container></div>
          </div>
        </template>
        <template marku-comment-template="child">
          <div class="comment-child">
            <div><strong marku-comment-username></strong></div>
            <p marku-comment-content></p>
          </div>
        </template>
      </div>
    </section>

    <section class="section">
      <h2>事件日志</h2>
      <div id="event-log" style="white-space:pre-wrap;"></div>
    </section>
  </div>
`

function logEvent(level: 'info' | 'success' | 'error', message: string, payload?: any) {
  const el = document.getElementById('event-log')!
  const time = new Date().toLocaleTimeString()
  const text = `${time} [${level.toUpperCase()}] ${message}${payload ? ' ' + JSON.stringify(payload) : ''}\n`
  el.innerText += text
}

const marku = new Marku({
  siteId: 'test-site',
  apiBaseUrl: 'http://localhost:12123'
})

marku.init()
logEvent('info', 'Marku 初始化完成', { initialized: marku.isInitialized && marku.isInitialized() })

document.addEventListener('marku:comment-success', (e: any) => {
  logEvent('success', '评论提交成功', e.detail)
})

document.addEventListener('marku:comment-error', (e: any) => {
  logEvent('error', '评论提交失败', e.detail)
})

console.log('Marku 初始化完成:', marku.isInitialized && marku.isInitialized())
