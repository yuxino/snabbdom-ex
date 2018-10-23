"use strict";
exports.__esModule = true;
var vnode_1 = require("./vnode");
var is = require("./is");
var htmldomapi_1 = require("./htmldomapi");
function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }
var emptyNode = vnode_1["default"]('', {}, [], undefined, undefined);
// 判断 key 和 sel 是否一致
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
// 如果 sel 不为空 视为有效的 vnode
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i, map = {}, key, ch;
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i];
        if (ch != null) {
            key = ch.key;
            if (key !== undefined)
                map[key] = i;
        }
    }
    return map;
}
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
// VNode -> { sel, data, children, text, elm, key }
var h_1 = require("./h");
exports.h = h_1.h;
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
function init(modules, domApi) {
    var i, j, cbs = {};
    var api = domApi !== undefined ? domApi : htmldomapi_1["default"];
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    // 创建空VNode节点 标签名会带上`id` 和 `classname`
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode_1["default"](api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    // 通过父级删除子元素
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
            }
        };
    }
    // 创建DOM元素
    function createElm(vnode, insertedVnodeQueue) {
        var i, data = vnode.data;
        // 先判断有没有 data
        if (isDef(data)) {
            // 检查 data 里面有没有 init hook 有的话触发
            if (isDef(i = data.hook) && isDef(i = i.init)) {
                i(vnode);
                // 这里可能会对 data 做一些其他的处理 所以更新一下
                data = vnode.data;
            }
        }
        // 寻找子节点和选择器
        var children = vnode.children, sel = vnode.sel;
        // 如果选择器是以 ! 开头的
        if (sel === '!') {
            // 检查 text 如果没定义的话 先把 text 变成空的
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            // 创建注释元素
            vnode.elm = api.createComment(vnode.text);
        }
        // 如果已经定义了选择器
        else if (isDef(sel)) {
            // Parse selector
            var hashIdx = sel.indexOf('#');
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            // 取最短 就是标签名 <-
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            // 创建元素
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                : api.createElement(tag);
            // 书写顺序是 # 然后 . 所以先取# 再取 .
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            // 把 每个. 替换成空格
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            // 触发 create 勾子
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            // 创建 子元素
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        // 添加到真正的DOM里
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            // 如果是 string 或者 number 直接创建文本节点
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            i = vnode.data.hook; // Reuse variable
            // 确认是否有 create 或者 insert 勾子 有的话
            // 往 insertedVnodeQueue 里面丢 到时候还要统一触发钩子呀 ~
            if (isDef(i)) {
                if (i.create)
                    i.create(emptyNode, vnode);
                if (i.insert)
                    insertedVnodeQueue.push(vnode);
            }
        }
        // 如果没有选择器 创建文本节点 -> 非 h 创建的元素
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        // 返回节点
        return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    // 调用destroy 钩子的时候也需要触发 子组件的 destroy 钩子
    function invokeDestroyHook(vnode) {
        var i, j, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.destroy))
                i(vnode);
            for (i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
            if (vnode.children !== undefined) {
                for (j = 0; j < vnode.children.length; ++j) {
                    i = vnode.children[j];
                    if (i != null && typeof i !== "string") {
                        invokeDestroyHook(i);
                    }
                }
            }
        }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
            if (ch != null) {
                // 普通的元素都有 selector
                if (isDef(ch.sel)) {
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                        cbs.remove[i_1](ch, rm);
                    if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                        i_1(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                // 没有的会被认为是文本节点
                else { // Text node
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }
    // 更新子元素
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        // 开始
        var oldStartIdx = 0;
        var newStartIdx = 0;
        // 结束
        var oldEndIdx = oldCh.length - 1;
        var newEndIdx = newCh.length - 1;
        // 旧的子元素首尾元素
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        // 新的子元素首尾元素
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        // 需要被移动的元素
        var elmToMove;
        var before;
        // 对比两个列表
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
            else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx];
            }
            // 首节点一致 指针都后移 更新这两个VNode元素
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                oldStartVnode = oldCh[++oldStartIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            // 尾节点一致 指针都前移 更新这两个VNode元素
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                oldEndVnode = oldCh[--oldEndIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            // 如果旧的开始节点和新的结束节点一致 -> vnode 右移
            else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldCh[--oldEndIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                idxInOld = oldKeyToIdx[newStartVnode.key];
                if (isUndef(idxInOld)) { // New element
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        oldCh[idxInOld] = undefined;
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            if (oldStartIdx > oldEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            else {
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }
    // patch (更新) 节点
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var i, hook;
        // 判断是否包含了 prepatch 勾子 如果有调用这个钩子
        if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
            i(oldVnode, vnode);
        }
        // 从旧VNode获取element元素 并且添加到新的VNode.elm属性里
        // 因为逻辑上来说 旧的VNode 一般是真实存在的Dom 元素 肯定是有 element属性的
        var elm = vnode.elm = oldVnode.elm;
        // 获取 新旧VNode的 children
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        // 如果新旧节点一致 停止操作
        if (oldVnode === vnode)
            return;
        // 如果 vnode 定义了 data
        if (vnode.data !== undefined) {
            // 触发 update hook -> update hook 来自module
            for (i = 0; i < cbs.update.length; ++i)
                cbs.update[i](oldVnode, vnode);
            // 这里的 update hook 是 用户自己编写的 update hook 了。 非 module
            i = vnode.data.hook;
            if (isDef(i) && isDef(i = i.update))
                i(oldVnode, vnode);
        }
        // 如果新的VNode没有定义 text
        if (isUndef(vnode.text)) {
            // 判断 `旧节点子元素` 和 `新节点子元素` 是否存在
            if (isDef(oldCh) && isDef(ch)) {
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            else if (isDef(ch)) {
                // 判断是否定义了 `子元素`
                // 有的话需要添加 VNode 节点
                // 判断`旧节点`是否存在 `text` 存在需要清空文本
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            // 判断是否定义了 `旧节点子元素` 有的话 需要移除
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        // text 不一致 需要更新 text
        else if (oldVnode.text !== vnode.text) {
            api.setTextContent(elm, vnode.text);
        }
        // 如果有 postpatch 钩子需要触发一次
        if (isDef(hook) && isDef(i = hook.postpatch)) {
            i(oldVnode, vnode);
        }
    }
    // 渲染 VNode 传入 oldVNode 和一个新的VNode , 返回VNode
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        // 已插入到DOM的VNode列表  -> 这个东西主要是拿来收集需要触发 insert 钩子的
        var insertedVnodeQueue = [];
        // pre hook
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        // 如果不是VNode 创建一个空的节点
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        // 判断节点是否一致 通过判断 sel 是否一样 一样就 patchVnode
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        // 如果 selector 不一致 找到旧VNode 的 element
        else {
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            // 如果父节点存在 (话说什么时候会不存在啊。。) 把旧的结点移除掉 ... 然后加入新的节点
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        // an element has been inserted into the DOM
        // 已经插入到DOM里面的VNode
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        return vnode;
    };
}
exports.init = init;
//# sourceMappingURL=snabbdom.js.map