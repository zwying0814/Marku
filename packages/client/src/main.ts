import './style.css'
import Marku from './marku'

// 创建测试页面
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Marku 测试页面</h1>
    
    <!-- 计数器测试 -->
    <div class="section">
      <h2>计数器功能测试</h2>
      <p>页面访问量: <span marku-get-count="page-view">加载中...</span></p>
      <p>文章阅读量: <span marku-get-count="article-read">加载中...</span></p>
      <button marku-set-count="page-view" marku-inc="1">增加页面访问量</button>
      <button marku-set-count="article-read" marku-inc="2">增加文章阅读量(+2)</button>
    </div>

    <!-- 评论功能测试 -->
    <div class="section">
      <h2>评论功能测试</h2>
      <form marku-comment-form="test-article">
        <div>
          <label>昵称:</label>
          <input type="text" marku-comment-username placeholder="请输入昵称" required>
        </div>
        <div>
          <label>邮箱:</label>
          <input type="email" marku-comment-email placeholder="请输入邮箱" required>
        </div>
        <div>
          <label>网址:</label>
          <input type="url" marku-comment-url placeholder="请输入网址(可选)">
        </div>
        <div>
          <label>评论内容:</label>
          <textarea marku-comment-content placeholder="请输入评论内容" required></textarea>
        </div>
        <button type="button" marku-comment-submit>提交评论</button>
      </form>
    </div>

    <div class="section">
      <h2>事件监听测试</h2>
      <div id="event-log"></div>
    </div>

    <div class="section">
      <h2>评论列表测试</h2>
      <div id="comment-list" marku-comment-list="test-article">
        <!-- 评论列表将在这里动态渲染，用户创建两个template，一个用于父级评论，一个用于子级评论 -->
        <template marku-comment-template="parent">
          <div class="comment-parent">
            <p marku-comment-content></p>
            <div marku-comment-reply-container></div>
          </div>
        </template>
        <template marku-comment-template="child">
          <div class="comment-child">
            <p marku-comment-content></p>
          </div>
        </template>
      </div>
    </div>
  </div>
`

// 初始化 Marku
const marku = new Marku({
  siteId: 'test-site',
  apiBaseUrl: 'http://localhost:12123'
})

marku.init()

// 监听评论事件
document.addEventListener('marku:comment-success', (e: any) => {
  const log = document.getElementById('event-log')!
  log.innerHTML += `<p style="color: green;">评论提交成功: ${JSON.stringify(e.detail)}</p>`
})

document.addEventListener('marku:comment-error', (e: any) => {
  const log = document.getElementById('event-log')!
  log.innerHTML += `<p style="color: red;">评论提交失败: ${JSON.stringify(e.detail)}</p>`
})

console.log('Marku 初始化完成:', marku.isInitialized())
