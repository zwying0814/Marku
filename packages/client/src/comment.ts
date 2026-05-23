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

const formAnchorMap = new WeakMap<Element, Comment>();

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

const getListElementByKey = (key: string) => {
    const escapedKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return document.querySelector(`[marku-comment-list="${escapedKey}"]`) as Element | null;
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

const renderSubmittedComment = (
    form: Element,
    commentData: CommentData,
    commentId: number,
) => {
    const listKey = getCommentKey(form);
    const listElement = getListElementByKey(listKey);
    if (!listElement) {
        return;
    }

    const parentTemplate = listElement.querySelector('template[marku-comment-template="parent"]') as HTMLTemplateElement | null;
    const childTemplate = listElement.querySelector('template[marku-comment-template="child"]') as HTMLTemplateElement | null;
    if (!parentTemplate || !childTemplate) {
        return;
    }

    const submittedComment: CommentData = {
        ...commentData,
        id: commentId,
        created_at: new Date().toISOString(),
    };

    const parentInput = form.querySelector('[marku-comment-parent]') as HTMLInputElement | null;
    const isReply = Boolean(parentInput && Number(parentInput.value || 0) > 0);
    const commentElement = createCommentElement(
        parentTemplate,
        childTemplate,
        submittedComment,
        listKey,
        new Map(),
        isReply,
    );

    if (isReply && form.parentElement?.hasAttribute('marku-comment-reply-container')) {
        const replyContainer = form.parentElement as HTMLElement;
        replyContainer.insertBefore(commentElement, form);
        return;
    }

    const firstRenderedChild = Array.from(listElement.children).find(child => child.tagName !== 'TEMPLATE');
    if (firstRenderedChild) {
        listElement.insertBefore(commentElement, firstRenderedChild);
    } else {
        listElement.appendChild(commentElement);
    }
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
    commentForms.forEach(form => {
        const formKey = getCommentKey(form);
        const { parentInput, replyCancelButton } = getFormReplyState(form);
        ensureFormAnchor(form);

        setReplyTarget(form, null);

        document.addEventListener(COMMENT_REPLY_EVENT, ((event: Event) => {
            const customEvent = event as CustomEvent<ReplyTarget & { key: string }>;
            if (!customEvent.detail || customEvent.detail.key !== formKey) {
                return;
            }
            setReplyTarget(form, customEvent.detail);
        }) as EventListener);

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
                renderSubmittedComment(form, commentData, Number(result.data?.id || 0));
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
    // 收集所有key和对应的元素
    const keyElementMap = new Map<string, Element[]>();
    const keys: string[] = [];
    commentListElements.forEach(element => {
        const key = element.getAttribute('marku-comment-list');
        if (!key) {
            console.warn('Marku Comment: Element has empty marku-comment-list attribute', element);
            return;
        }
        if (!keyElementMap.has(key)) {
            keyElementMap.set(key, []);
            keys.push(key);
        }
        keyElementMap.get(key)!.push(element);
    });

    // 遍历每个列表元素
    commentListElements.forEach(async listElement => {
        const key = listElement.getAttribute('marku-comment-list');
        if (!key) {
            console.warn('Marku Comment: Element has empty marku-comment-list attribute', listElement);
            return;
        }
        const commentData = await fetchComments(key);
        if (commentData.code === 200) {
            // 渲染评论列表
            renderCommentList(listElement, commentData.data || []);
        } else {
            console.error('Marku Comment: Failed to fetch comments', commentData);
        }
    });

}


const renderCommentList = (listElement: Element, comments: CommentData[])=>{
    // 1. 找到页面中评论列表元素下的template模板，模板分为父级评论模板和子级评论模板
    const parentTemplate = listElement.querySelector('template[marku-comment-template="parent"]') as HTMLTemplateElement;
    if (!parentTemplate) {
        console.warn('Marku Comment: No parent template element found in comment list element', listElement);
        return;
    }
    const childTemplate = listElement.querySelector('template[marku-comment-template="child"]') as HTMLTemplateElement;
    if (!childTemplate) {
        console.warn('Marku Comment: No child template element found in comment list element', listElement);
        return;
    }

    // 清空之前的评论内容（除了模板本身）
    Array.from(listElement.children).forEach(child => {
        if (child.tagName !== 'TEMPLATE') {
            child.remove();
        }
    });

    if (!comments || comments.length === 0) {
        console.log('Marku Comment: No comments to render');
        return;
    }

    console.log(`Marku Comment: Rendering ${comments.length} comments`);

    // 2. 分离父评论和子评论
    const parentComments = comments.filter(c => !c.parent || Number(c.parent) === 0);
    const childCommentsByParent = new Map<string | number, CommentData[]>();
    
    comments.forEach(c => {
        if (c.parent && Number(c.parent) !== 0) {
            if (!childCommentsByParent.has(c.parent)) {
                childCommentsByParent.set(c.parent, []);
            }
            childCommentsByParent.get(c.parent)!.push(c);
        }
    });

    const listKey = getCommentKey(listElement);

    // 3. 渲染父评论和子评论
    parentComments.forEach(parentComment => {
        renderCommentNode(listElement, parentTemplate, childTemplate, parentComment, childCommentsByParent, listKey);
    });
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

    // 用户名
    const usernameEl = element.querySelector('[marku-comment-username]');
    if (usernameEl) {
        usernameEl.textContent = comment.username || '';
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