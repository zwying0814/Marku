import config from "./config";
import { fetchComments, submitComment, type CommentData } from "./fetch";
import { findElementsWithAttribute, getBrowserUA, getUserIPInfo } from "./util";

type ReplyTarget = {
    parentId: number;
    username: string;
    commentId: number;
    replyContainer: HTMLElement;
};

const COMMENT_REPLY_EVENT = 'marku:comment-reply-target';
const COMMENT_REFRESH_EVENT = 'marku:comment-success';

const formAnchorMap = new WeakMap<Element, Comment>();
const commentFormRegistry = new Map<string, Set<HTMLFormElement>>();
let commentReplyBridgeBound = false;
type CommentListState = {
    key: string;
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
    listElement: Element;
    bodyElement: HTMLElement;
    parentTemplate: HTMLTemplateElement;
    childTemplate: HTMLTemplateElement;
    totalElement: HTMLElement | null;
    pageElement: HTMLElement | null;
    pageCountElement: HTMLElement | null;
    prevButton: HTMLButtonElement | null;
    nextButton: HTMLButtonElement | null;
    emptyElement: HTMLElement | null;
    loading: boolean;
};

const commentListStateMap = new WeakMap<Element, CommentListState>();
const commentListRegistry = new Map<string, Set<CommentListState>>();
let commentListRefreshBridgeBound = false;

const getCommentKey = (element: Element | null) => element?.getAttribute('marku-comment-form') || element?.getAttribute('marku-comment-list') || '';

const ensureFormAnchor = (form: Element) => {
    let anchor = formAnchorMap.get(form);
    if (!anchor) {
        anchor = document.createComment('marku-comment-form-anchor');
        form.parentNode?.insertBefore(anchor, form);
        formAnchorMap.set(form, anchor);
    }
    return anchor;
};

const moveFormToOriginalLocation = (form: Element) => {
    const anchor = ensureFormAnchor(form);
    anchor.parentNode?.insertBefore(form, anchor.nextSibling);
    form.classList.remove('marku-comment-reply-form');
};

const moveFormToReplyContainer = (form: Element, replyContainer: HTMLElement) => {
    replyContainer.prepend(form);
    form.classList.add('marku-comment-reply-form');
};

const parsePositiveInt = (value: string, fallback: number) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
};

const getCommentListBody = (listElement: Element) => {
    return (listElement.querySelector('[marku-comment-body]') as HTMLElement | null) || (listElement as HTMLElement);
};

const getCommentListTemplates = (listElement: Element) => {
    const parentTemplate = listElement.querySelector('template[marku-comment-template="parent"]') as HTMLTemplateElement | null;
    const childTemplate = listElement.querySelector('template[marku-comment-template="child"]') as HTMLTemplateElement | null;

    if (!parentTemplate || !childTemplate) {
        return null;
    }

    return { parentTemplate, childTemplate };
};

const getCommentListState = (listElement: Element) => {
    const existingState = commentListStateMap.get(listElement);
    if (existingState) {
        return existingState;
    }

    const templates = getCommentListTemplates(listElement);
    if (!templates) {
        return null;
    }

    const state: CommentListState = {
        key: getCommentKey(listElement),
        page: parsePositiveInt(listElement.getAttribute('marku-comment-page') || '', 1),
        pageSize: Math.min(parsePositiveInt(listElement.getAttribute('marku-comment-page-size') || '', 10), 100),
        total: 0,
        pageCount: 1,
        listElement,
        bodyElement: getCommentListBody(listElement),
        parentTemplate: templates.parentTemplate,
        childTemplate: templates.childTemplate,
        totalElement: listElement.querySelector('[marku-comment-total]') as HTMLElement | null,
        pageElement: listElement.querySelector('[marku-comment-page]') as HTMLElement | null,
        pageCountElement: listElement.querySelector('[marku-comment-page-count]') as HTMLElement | null,
        prevButton: listElement.querySelector('[marku-comment-prev]') as HTMLButtonElement | null,
        nextButton: listElement.querySelector('[marku-comment-next]') as HTMLButtonElement | null,
        emptyElement: listElement.querySelector('[marku-comment-empty]') as HTMLElement | null,
        loading: false,
    };

    commentListStateMap.set(listElement, state);
    if (!commentListRegistry.has(state.key)) {
        commentListRegistry.set(state.key, new Set());
    }
    commentListRegistry.get(state.key)!.add(state);

    return state;
};

const ensureCommentListRefreshBridge = () => {
    if (commentListRefreshBridgeBound) {
        return;
    }

    commentListRefreshBridgeBound = true;
    document.addEventListener(COMMENT_REFRESH_EVENT, ((event: Event) => {
        const customEvent = event as CustomEvent<{ mark?: string }>;
        const key = customEvent.detail?.mark;
        if (!key) {
            return;
        }

        const states = commentListRegistry.get(key);
        if (!states) {
            return;
        }

        states.forEach(state => {
            void loadCommentListPage(state, state.page);
        });
    }) as EventListener);
};

const updateCommentListSummary = (state: CommentListState) => {
    if (state.totalElement) {
        state.totalElement.textContent = String(state.total);
    }
    if (state.pageElement) {
        state.pageElement.textContent = String(state.page);
    }
    if (state.pageCountElement) {
        state.pageCountElement.textContent = String(state.pageCount || 1);
    }
    if (state.prevButton) {
        state.prevButton.disabled = state.page <= 1 || state.loading;
    }
    if (state.nextButton) {
        state.nextButton.disabled = state.page >= state.pageCount || state.loading;
    }
};

const clearCommentListBody = (state: CommentListState) => {
    Array.from(state.bodyElement.children).forEach(child => {
        if (child.tagName !== 'TEMPLATE') {
            child.remove();
        }
    });
};

const renderCommentListIntoState = (state: CommentListState, comments: CommentData[]) => {
    clearCommentListBody(state);

    if (!comments || comments.length === 0) {
        if (state.emptyElement) {
            state.emptyElement.hidden = false;
        } else {
            const emptyNode = document.createElement('p');
            emptyNode.className = 'comment-empty';
            emptyNode.textContent = '当前页没有评论';
            state.bodyElement.appendChild(emptyNode);
        }
        return;
    }

    if (state.emptyElement) {
        state.emptyElement.hidden = true;
    }

    const parentComments = comments.filter(comment => !comment.parent || Number(comment.parent) === 0);
    const childCommentsByParent = new Map<string | number, CommentData[]>();

    comments.forEach(comment => {
        if (comment.parent && Number(comment.parent) !== 0) {
            if (!childCommentsByParent.has(comment.parent)) {
                childCommentsByParent.set(comment.parent, []);
            }
            childCommentsByParent.get(comment.parent)!.push(comment);
        }
    });

    const listKey = state.key;
    parentComments.forEach(parentComment => {
        renderCommentNode(state.bodyElement, state.parentTemplate, state.childTemplate, parentComment, childCommentsByParent, listKey);
    });
};

const loadCommentListPage = async (state: CommentListState, page = state.page) => {
    if (state.loading) {
        return;
    }

    state.loading = true;
    updateCommentListSummary(state);

    const result = await fetchComments(state.key, page, state.pageSize);
    if (result.code !== 200) {
        clearCommentListBody(state);
        const errorNode = document.createElement('p');
        errorNode.className = 'comment-empty';
        errorNode.textContent = `加载评论失败：${result.msg || '未知错误'}`;
        state.bodyElement.appendChild(errorNode);
        state.total = 0;
        state.page = 1;
        state.pageCount = 1;
        state.loading = false;
        updateCommentListSummary(state);
        return;
    }

    state.page = result.page || page;
    state.pageSize = result.pageSize || state.pageSize;
    state.total = result.total || 0;
    state.pageCount = result.pageCount || 1;
    renderCommentListIntoState(state, result.data || []);
    state.loading = false;
    updateCommentListSummary(state);
};

const createCommentElement = (
    parentTemplate: HTMLTemplateElement,
    childTemplate: HTMLTemplateElement,
    comment: CommentData,
    listKey: string,
    childCommentsByParent: Map<string | number, CommentData[]>,
    isChild = false,
) => {
    const template = isChild ? childTemplate : parentTemplate;
    const node = template.content.cloneNode(true) as DocumentFragment;
    const commentElement = node.firstElementChild as HTMLElement;

    fillCommentData(commentElement, comment);

    const replyButton = commentElement.querySelector('[marku-comment-reply]');
    if (replyButton && comment.id) {
        replyButton.addEventListener('click', () => {
            const replyContainer = commentElement.querySelector('[marku-comment-reply-container]') as HTMLElement | null;
            if (!replyContainer) {
                return;
            }
            document.dispatchEvent(new CustomEvent(COMMENT_REPLY_EVENT, {
                detail: {
                    key: listKey,
                    parentId: Number(comment.id),
                    commentId: Number(comment.id),
                    username: comment.username || '',
                    replyContainer,
                }
            }));
        });
    }

    const replyContainer = commentElement.querySelector('[marku-comment-reply-container]');
    const children = childCommentsByParent.get(comment.id || 0) || [];
    if (children.length > 0 && replyContainer) {
        children.forEach(childComment => {
            const childNode = createCommentElement(parentTemplate, childTemplate, childComment, listKey, childCommentsByParent, true);
            replyContainer.appendChild(childNode);
        });
    }

    if (isChild) {
        commentElement.classList.add('marku-comment-child-node');
    }

    return commentElement;
};

const getFormReplyState = (form: Element) => {
    let parentInput = form.querySelector('[marku-comment-parent]') as HTMLInputElement | null;
    if (!parentInput) {
        parentInput = document.createElement('input');
        parentInput.type = 'hidden';
        parentInput.setAttribute('marku-comment-parent', '');
        parentInput.value = '0';
        form.appendChild(parentInput);
    }

    const replyInfo = form.querySelector('[marku-comment-reply-target]') as HTMLElement | null;
    const replyCancelButton = form.querySelector('[marku-comment-reply-cancel]') as HTMLButtonElement | null;

    return {
        parentInput,
        replyInfo,
        replyCancelButton,
    };
};

const setReplyTarget = (form: Element, target: ReplyTarget | null) => {
    const { parentInput, replyInfo, replyCancelButton } = getFormReplyState(form);

    parentInput.value = target ? String(target.parentId) : '0';

    if (replyInfo) {
        if (target) {
            replyInfo.textContent = `正在回复 @${target.username}`;
            replyInfo.hidden = false;
        } else {
            replyInfo.textContent = '';
            replyInfo.hidden = true;
        }
    }

    if (replyCancelButton) {
        replyCancelButton.hidden = !target;
    }

    if (!target) {
        moveFormToOriginalLocation(form);
    } else {
        moveFormToReplyContainer(form, target.replyContainer);
    }
};

const ensureCommentReplyBridge = () => {
    if (commentReplyBridgeBound) {
        return;
    }

    commentReplyBridgeBound = true;
    document.addEventListener(COMMENT_REPLY_EVENT, ((event: Event) => {
        const customEvent = event as CustomEvent<ReplyTarget & { key: string }>;
        const key = customEvent.detail?.key;
        if (!key) {
            return;
        }

        const forms = commentFormRegistry.get(key);
        if (!forms || forms.size === 0) {
            return;
        }

        Array.from(forms).forEach(form => {
            if (!form.isConnected) {
                forms.delete(form);
                return;
            }

            setReplyTarget(form, customEvent.detail);
        });
    }) as EventListener);
};


export const processCommentSubmit = async () => {
    // 查找页面全部表单元素
    const commentForms = findElementsWithAttribute('marku-comment-form');
    if (commentForms.length === 0) {
        console.log('Marku Comment: No elements with marku-comment-form attribute found');
        return;
    }
    console.log(`Marku Comment: Found ${commentForms.length} comment form elements`);
    // 收集所有key和对应的元素
    const keyElementMap = new Map<string, Element[]>();
    const keys: string[] = [];
    Array.from(commentForms).forEach(element => {
        const key = element.getAttribute('marku-comment-form');
        if (!key) {
            console.warn('Marku Comment: Element has empty marku-comment-form attribute', element);
            return;
        }
        if (!keyElementMap.has(key)) {
            keyElementMap.set(key, []);
            keys.push(key);
        }
        keyElementMap.get(key)!.push(element);
    });
    // 遍历每个表单元素
    ensureCommentReplyBridge();
    commentForms.forEach(form => {
        const formKey = getCommentKey(form);
        const { parentInput, replyCancelButton } = getFormReplyState(form);
        ensureFormAnchor(form);

        if (!commentFormRegistry.has(formKey)) {
            commentFormRegistry.set(formKey, new Set());
        }
        commentFormRegistry.get(formKey)!.add(form as HTMLFormElement);

        setReplyTarget(form, null);

        if (replyCancelButton) {
            replyCancelButton.addEventListener('click', () => {
                setReplyTarget(form, null);
            });
        }

        // 找到提交表单的按钮子元素
        const submitButton = form.querySelector('[marku-comment-submit]');
        if (!submitButton) {
            console.warn('Marku Comment: Form element has no submit button', form);
            return;
        }
        // 为提交按钮添加点击事件监听器
        submitButton.addEventListener('click', async (e) => {
            e.preventDefault();
            // 添加加载类
            submitButton.classList.add('marku-comment-loading');
            // 查找输入信息
            const nicknameInput = form.querySelector('[marku-comment-username]') as HTMLInputElement;
            const emailInput = form.querySelector('[marku-comment-email]') as HTMLInputElement;
            const urlInput = form.querySelector('[marku-comment-url]') as HTMLInputElement;
            const contentInput = form.querySelector('[marku-comment-content]') as HTMLTextAreaElement;
            const parentValue = parentInput.value.trim();

            // 检查是否有任何输入为空
            if (!nicknameInput.value.trim() || !emailInput.value.trim() || !contentInput.value.trim()) {
                console.warn('Marku Comment: Form element has empty input', form);
                return;
            }

            // 获取用户IP信息
            const ipInfo = await getUserIPInfo();
            // 获取浏览器UA信息
            const browserUA = getBrowserUA();

            // 构造评论接口所需数据
            const commentData: CommentData = {
                username: nicknameInput.value.trim(),
                email: emailInput.value.trim(),
                url: urlInput.value.trim(),
                content: contentInput.value.trim(),
                mark: form.getAttribute('marku-comment-form')!,
                siteId: config.siteId!,
                ip: ipInfo.data.ip,
                location: ipInfo.data.location.slice(0, 3).join('/'),
                ua: browserUA,
                parent: parentValue === '' ? 0 : Number(parentValue),
            };
            const result = await submitComment(commentData);
            if (result) {
                // 提交成功，设置加载状态为成功
                submitButton.classList.remove('marku-comment-loading');
                submitButton.classList.add('marku-comment-success');
                // 清空内容
                contentInput.value = '';
                setReplyTarget(form, null);
                // 触发成功事件
                document.dispatchEvent(new CustomEvent('marku:comment-success', {
                    detail: {
                        mark: commentData.mark,
                        success: true,
                        data: commentData
                    }
                }));
            } else {
                // 提交失败，设置加载状态为错误
                submitButton.classList.remove('marku-comment-loading');
                submitButton.classList.add('marku-comment-error');
                // 触发失败事件
                document.dispatchEvent(new CustomEvent('marku:comment-error', {
                    detail: {
                        mark: commentData.mark,
                        success: false,
                        data: commentData
                    }
                }));
            }
        });
    });
}

export const processCommentList = async () => {
    // 查找所有带有marku-comment-list属性的元素
    const commentListElements = findElementsWithAttribute('marku-comment-list');
    if (commentListElements.length === 0) {
        console.log('Marku Comment: No elements with marku-comment-list attribute found');
        return;
    }
    console.log(`Marku Comment: Found ${commentListElements.length} comment list elements`);
    ensureCommentListRefreshBridge();

    for (const listElement of commentListElements) {
        const state = getCommentListState(listElement);
        if (!state) {
            console.warn('Marku Comment: Comment list is missing required templates', listElement);
            continue;
        }

        const prevButton = state.prevButton;
        const nextButton = state.nextButton;

        if (prevButton && !prevButton.dataset.markuBound) {
            prevButton.dataset.markuBound = 'true';
            prevButton.addEventListener('click', () => {
                if (state.page > 1) {
                    void loadCommentListPage(state, state.page - 1);
                }
            });
        }

        if (nextButton && !nextButton.dataset.markuBound) {
            nextButton.dataset.markuBound = 'true';
            nextButton.addEventListener('click', () => {
                if (state.page < state.pageCount) {
                    void loadCommentListPage(state, state.page + 1);
                }
            });
        }

        void loadCommentListPage(state, state.page);
    }
}

const renderCommentNode = (
    listElement: Element,
    parentTemplate: HTMLTemplateElement,
    childTemplate: HTMLTemplateElement,
    comment: CommentData,
    childCommentsByParent: Map<string | number, CommentData[]>,
    listKey: string,
    isChild = false,
) => {
    const commentElement = createCommentElement(parentTemplate, childTemplate, comment, listKey, childCommentsByParent, isChild);

    listElement.appendChild(commentElement);
}

// 填充评论数据到 DOM 元素
const fillCommentData = (element: Element, comment: CommentData) => {
    if (comment.id !== undefined && comment.id !== null) {
        element.setAttribute('data-marku-comment-id', String(comment.id));
    }

    if (comment.username) {
        element.setAttribute('data-marku-comment-username', comment.username);
    }

    const avatarSrc = (comment.avatar || comment.user?.avatar || '').trim();
    const displayName = (comment.username || '匿名用户').trim();
    const avatarFallback = displayName.charAt(0).toUpperCase() || 'U';
    const avatarImageEl = element.querySelector('[marku-comment-avatar-image]') as HTMLImageElement | null;
    const avatarFallbackEl = element.querySelector('[marku-comment-avatar-fallback]') as HTMLElement | null;
    if (avatarImageEl || avatarFallbackEl) {
        if (avatarSrc) {
            if (avatarImageEl) {
                avatarImageEl.src = avatarSrc;
                avatarImageEl.hidden = false;
            }
            if (avatarFallbackEl) {
                avatarFallbackEl.hidden = true;
                avatarFallbackEl.textContent = avatarFallback;
            }
        } else {
            if (avatarImageEl) {
                avatarImageEl.removeAttribute('src');
                avatarImageEl.hidden = true;
            }
            if (avatarFallbackEl) {
                avatarFallbackEl.hidden = false;
                avatarFallbackEl.textContent = avatarFallback;
            }
        }
    }

    // 用户名
    const usernameEl = element.querySelector('[marku-comment-username]');
    if (usernameEl) {
        usernameEl.textContent = comment.username || '';
    }

    const emailEl = element.querySelector('[marku-comment-email]');
    if (emailEl) {
        emailEl.textContent = comment.user?.email || comment.email || '';
    }

    const urlEl = element.querySelector('[marku-comment-url]');
    if (urlEl) {
        urlEl.textContent = comment.user?.url || comment.url || '';
    }

    // 评论内容
    const contentEl = element.querySelector('[marku-comment-content]');
    if (contentEl) {
        contentEl.textContent = comment.content || '';
    }

    // 时间（如果有 created_at 字段）
    const timeEl = element.querySelector('[marku-comment-time]');
    if (timeEl && comment.created_at) {
        const date = new Date(comment.created_at);
        timeEl.textContent = date.toLocaleString('zh-CN');
    }
}