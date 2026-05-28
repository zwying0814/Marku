import './style.css'
import Marku from './marku'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('未找到 #app 元素')

app.innerHTML = `
  <div>
    <h1>Marku 测试页面</h1>

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
        <input type="hidden" marku-comment-parent value="0" />
                <div
                    className="mb-3 hidden rounded-xl bg-accent/20 px-3 py-2 text-xs text-muted-foreground"
                    marku-comment-reply-target
                ></div>
                <div className="min-w-0">
                    <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                            type="text"
                            marku-comment-username
                            placeholder="昵称"
                            required
                            className="h-10 rounded-xl bg-card/90 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                        />
                        <input
                            type="email"
                            marku-comment-email
                            placeholder="邮箱"
                            required
                            className="h-10 rounded-xl bg-card/90 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                        />
                        <input
                            type="url"
                            marku-comment-url
                            placeholder="网址 (可选)"
                            className="h-10 rounded-xl bg-card/90 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 sm:col-span-2"
                        />
                    </div>
                    <textarea
                        rows={4}
                        marku-comment-content
                        placeholder="写下你的想法..."
                        required
                        className="min-h-28 w-full resize-none rounded-2xl bg-card/90 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70"
                    ></textarea>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-muted-foreground">
                            支持 Markdown、@ 回复和表情。
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                marku-comment-reply-cancel
                                hidden
                                className="inline-flex items-center justify-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                取消回复
                            </button>
                            <button
                                type="button"
                                marku-comment-submit
                                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                            >
                                发送评论
                            </button>
                        </div>
                    </div>
                </div>
      </form>
    </section>

    <section class="section">
      <h2>评论列表</h2>
      <div id="comment-list" marku-comment-list="test-article">
        <template marku-comment-template="parent">
          <div class="comment-parent">
            <div class="comment-head">
              <strong marku-comment-username></strong>
              <button type="button" class="comment-reply-button" marku-comment-reply>回复</button>
            </div>
            <p marku-comment-content></p>
            <div marku-comment-reply-container></div>
          </div>
        </template>
        <template marku-comment-template="child">
          <div class="comment-child">
            <div class="comment-head">
              <strong marku-comment-username></strong>
              <button type="button" class="comment-reply-button" marku-comment-reply>回复</button>
            </div>
            <p marku-comment-content></p>
            <div marku-comment-reply-container></div>
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
