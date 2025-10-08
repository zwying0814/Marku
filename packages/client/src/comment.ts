import config from "./config";
import { fetchComments, submitComment, type CommentData } from "./fetch";
import { findElementsWithAttribute, getBrowserUA, getUserIPInfo } from "./util";


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
            };
            const success = await submitComment(commentData);
            if (success) {
                // 提交成功，设置加载状态为成功
                submitButton.classList.remove('marku-comment-loading');
                submitButton.classList.add('marku-comment-success');
                // 清空内容
                contentInput.value = '';
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

    // 2. 遍历评论数据，根据是否有parentId判断是父级评论还是子级评论

    // 3. 渲染评论到评论列表元素中，元素包含对应的
}