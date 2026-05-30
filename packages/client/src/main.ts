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
      <div class="comment-panel" marku-comment-list="test-article" marku-comment-page="1" marku-comment-page-size="5">
        <div class="comment-summary">
          <p>评论总数：<strong marku-comment-total>加载中...</strong></p>
          <p>当前页：<strong marku-comment-page>1</strong> / <strong marku-comment-page-count>1</strong></p>
        </div>

        <div class="comment-list" marku-comment-body></div>
        <p class="comment-empty" marku-comment-empty hidden>当前页没有评论</p>

        <div class="comment-pagination">
          <button type="button" marku-comment-prev>上一页</button>
          <button type="button" marku-comment-next>下一页</button>
        </div>

        <template marku-comment-template="parent">
          <article class="comment-card">
            <div class="comment-card-head">
              <div class="comment-avatar" marku-comment-avatar>
                <img class="comment-avatar-image" marku-comment-avatar-image hidden />
                <span class="comment-avatar-fallback" marku-comment-avatar-fallback></span>
              </div>
              <div class="comment-meta">
                <strong class="comment-name" marku-comment-username></strong>
                <div class="comment-submeta">
                  <span marku-comment-time></span>
                  <span marku-comment-email></span>
                </div>
              </div>
            </div>
            <p class="comment-content" marku-comment-content></p>
            <button class="comment-reply-button" type="button" marku-comment-reply>回复</button>
            <div marku-comment-reply-container></div>
          </article>
        </template>

        <template marku-comment-template="child">
          <article class="comment-card comment-card-child">
            <div class="comment-card-head">
              <div class="comment-avatar" marku-comment-avatar>
                <img class="comment-avatar-image" marku-comment-avatar-image hidden />
                <span class="comment-avatar-fallback" marku-comment-avatar-fallback></span>
              </div>
              <div class="comment-meta">
                <strong class="comment-name" marku-comment-username></strong>
                <div class="comment-submeta">
                  <span marku-comment-time></span>
                  <span marku-comment-email></span>
                </div>
              </div>
            </div>
            <p class="comment-content" marku-comment-content></p>
            <button class="comment-reply-button" type="button" marku-comment-reply>回复</button>
            <div marku-comment-reply-container></div>
          </article>
        </template>
      </div>
    </section>

    <section class="section">
      <h2>事件日志</h2>
      <div id="event-log" style="white-space:pre-wrap;"></div>
    </section>
  </div>
`

const marku = new Marku({
  siteId: 'test-site',
  apiBaseUrl: 'http://localhost:12123'
})

marku.init()

console.log('Marku 初始化完成:', marku.isInitialized && marku.isInitialized())
