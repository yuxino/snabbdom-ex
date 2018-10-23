/* global module, document, Node */
import {Module} from './modules/module';
import {Hooks} from './hooks';
import vnode, {VNode, VNodeData, Key} from './vnode';
import * as is from './is';
import htmlDomApi, {DOMAPI} from './htmldomapi';

function isUndef(s: any): boolean { return s === undefined; }
function isDef(s: any): boolean { return s !== undefined; }

type VNodeQueue = Array<VNode>;

const emptyNode = vnode('', {}, [], undefined, undefined);

// 判断 key 和 sel 是否一致
function sameVnode(vnode1: VNode, vnode2: VNode): boolean {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

// 如果 sel 不为空 视为有效的 vnode
function isVnode(vnode: any): vnode is VNode {
  return vnode.sel !== undefined;
}

type KeyToIndexMap = {[key: string]: number};

type ArraysOf<T> = {
  [K in keyof T]: (T[K])[];
}

type ModuleHooks = ArraysOf<Module>;

function createKeyToOldIdx(children: Array<VNode>, beginIdx: number, endIdx: number): KeyToIndexMap {
  let i: number, map: KeyToIndexMap = {}, key: Key | undefined, ch;
  for (i = beginIdx; i <= endIdx; ++i) {
    ch = children[i];
    if (ch != null) {
      key = ch.key;
      if (key !== undefined) map[key] = i;
    }
  }
  return map;
}

const hooks: (keyof Module)[] = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

// VNode -> { sel, data, children, text, elm, key }
export {h} from './h';

export {thunk} from './thunk';

export function init(modules: Array<Partial<Module>>, domApi?: DOMAPI) {
  let i: number, j: number, cbs = ({} as ModuleHooks);

  const api: DOMAPI = domApi !== undefined ? domApi : htmlDomApi;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      const hook = modules[j][hooks[i]];
      if (hook !== undefined) {
        (cbs[hooks[i]] as Array<any>).push(hook);
      }
    }
  }

  // 创建空VNode节点 标签名会带上`id` 和 `classname`
  function emptyNodeAt(elm: Element) {
    const id = elm.id ? '#' + elm.id : '';
    const c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
    return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
  }

  // 通过父级删除子元素
  function createRmCb (childElm: Node, listeners: number) {
    return function rmCb() {
      if (--listeners === 0) {
        const parent = api.parentNode(childElm);
        api.removeChild(parent, childElm);
      }
    };
  }

  // 创建DOM元素
  function createElm(vnode: VNode, insertedVnodeQueue: VNodeQueue): Node {
    let i: any, data = vnode.data;

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
    let children = vnode.children, sel = vnode.sel;

    // 如果选择器是以 ! 开头的
    if (sel === '!') {
      // 检查 text 如果没定义的话 先把 text 变成空的
      if (isUndef(vnode.text)) {
        vnode.text = '';
      }
      // 创建注释元素
      vnode.elm = api.createComment(vnode.text as string);
    }

    // 如果已经定义了选择器
    else if (isDef(sel)) {
      // Parse selector
      const hashIdx = sel.indexOf('#');
      const dotIdx = sel.indexOf('.', hashIdx);

      const hash = hashIdx > 0 ? hashIdx : sel.length;
      const dot = dotIdx > 0 ? dotIdx : sel.length;

      // 取最短 就是标签名 <-
      const tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;

      // 创建元素
      const elm = vnode.elm = isDef(data) && isDef(i = (data as VNodeData).ns) ? api.createElementNS(i, tag)
                                                                               : api.createElement(tag);

      // 书写顺序是 # 然后 . 所以先取# 再取 .
      if (hash < dot) elm.setAttribute('id', sel.slice(hash + 1, dot));
      // 把 每个. 替换成空格
      if (dotIdx > 0) elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));

      // 触发 create 勾子
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);

      // 创建 子元素
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          const ch = children[i];
          if (ch != null) {
            // 添加到真正的DOM里
            api.appendChild(elm, createElm(ch as VNode, insertedVnodeQueue));
          }
        }
      }

      // 如果是 string 或者 number 直接创建文本节点
      else if (is.primitive(vnode.text)) {
        api.appendChild(elm, api.createTextNode(vnode.text));
      }

      i = (vnode.data as VNodeData).hook; // Reuse variable

      // 确认是否有 create 或者 insert 勾子 有的话
      // 往 insertedVnodeQueue 里面丢 到时候还要统一触发钩子呀 ~
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }

    }
    // 如果没有选择器 创建文本节点 -> 非 h 创建的元素
    else {
      vnode.elm = api.createTextNode(vnode.text as string);
    }
    // 返回节点
    return vnode.elm;
  }

  function addVnodes(parentElm: Node,
                     before: Node | null,
                     vnodes: Array<VNode>,
                     startIdx: number,
                     endIdx: number,
                     insertedVnodeQueue: VNodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx];
      if (ch != null) {
        api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
      }
    }
  }

  // 调用destroy 钩子的时候也需要触发 子组件的 destroy 钩子
  function invokeDestroyHook(vnode: VNode) {
    let i: any, j: number, data = vnode.data;
    if (data !== undefined) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
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

  function removeVnodes(parentElm: Node,
                        vnodes: Array<VNode>,
                        startIdx: number,
                        endIdx: number): void {
    for (; startIdx <= endIdx; ++startIdx) {
      let i: any, listeners: number, rm: () => void, ch = vnodes[startIdx];
      if (ch != null) {
        // 普通的元素都有 selector
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm as Node, listeners);

          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            rm();
          }

        }
        // 没有的会被认为是文本节点
        else { // Text node
          api.removeChild(parentElm, ch.elm as Node);
        }
      }
    }
  }

  // 更新子元素
  function updateChildren(parentElm: Node,
                          oldCh: Array<VNode>,
                          newCh: Array<VNode>,
                          insertedVnodeQueue: VNodeQueue) {

    // 开始
    let oldStartIdx = 0;
    let newStartIdx = 0;

    // 结束
    let oldEndIdx = oldCh.length - 1;
    let newEndIdx = newCh.length - 1;

    // 旧的子元素首尾元素
    let oldStartVnode = oldCh[0];
    let oldEndVnode = oldCh[oldEndIdx];

    // 新的子元素首尾元素
    let newStartVnode = newCh[0];
    let newEndVnode = newCh[newEndIdx];

    let oldKeyToIdx: any;
    let idxInOld: number;

    // 需要被移动的元素
    let elmToMove: VNode;
    let before: any;

    // 对比两个列表
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVnode == null) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
      } else if (oldEndVnode == null) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (newStartVnode == null) {
        newStartVnode = newCh[++newStartIdx];
      } else if (newEndVnode == null) {
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
        api.insertBefore(parentElm, oldStartVnode.elm as Node, api.nextSibling(oldEndVnode.elm as Node));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm as Node, oldStartVnode.elm as Node);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        }
        idxInOld = oldKeyToIdx[newStartVnode.key as string];
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm as Node);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          if (elmToMove.sel !== newStartVnode.sel) {
            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm as Node);
          } else {
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined as any;
            api.insertBefore(parentElm, (elmToMove.elm as Node), oldStartVnode.elm as Node);
          }
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
      if (oldStartIdx > oldEndIdx) {
        before = newCh[newEndIdx+1] == null ? null : newCh[newEndIdx+1].elm;
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
      }
    }
  }

  // patch (更新) 节点
  function patchVnode(oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
    let i: any, hook: any;

    // 判断是否包含了 prepatch 勾子 如果有调用这个钩子
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }

    // 从旧VNode获取element元素 并且添加到新的VNode.elm属性里
    // 因为逻辑上来说 旧的VNode 一般是真实存在的Dom 元素 肯定是有 element属性的
    const elm = vnode.elm = (oldVnode.elm as Node);

    // 获取 新旧VNode的 children
    let oldCh = oldVnode.children;
    let ch = vnode.children;

    // 如果新旧节点一致 停止操作
    if (oldVnode === vnode) return;

    // 如果 vnode 定义了 data
    if (vnode.data !== undefined) {

      // 触发 update hook -> update hook 来自module
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);

      // 这里的 update hook 是 用户自己编写的 update hook 了。 非 module
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }

    // 如果新的VNode没有定义 text
    if (isUndef(vnode.text)) {
      // 判断 `旧节点子元素` 和 `新节点子元素` 是否存在
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh as Array<VNode>, ch as Array<VNode>, insertedVnodeQueue);
      }
      else if (isDef(ch)) {
        // 判断是否定义了 `子元素`
        // 有的话需要添加 VNode 节点
        // 判断`旧节点`是否存在 `text` 存在需要清空文本
        if (isDef(oldVnode.text)) api.setTextContent(elm, '');
        addVnodes(
            elm,
            null,
            ch as Array<VNode>,
            0,
            (ch as Array<VNode>).length - 1,
            insertedVnodeQueue)
        ;
      }

      // 判断是否定义了 `旧节点子元素` 有的话 需要移除
      else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh as Array<VNode>, 0, (oldCh as Array<VNode>).length - 1);
      }

      else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '');
      }
    }

    // text 不一致 需要更新 text
    else if (oldVnode.text !== vnode.text) {
      api.setTextContent(elm, vnode.text as string);
    }

    // 如果有 postpatch 钩子需要触发一次
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }

  // 渲染 VNode 传入 oldVNode 和一个新的VNode , 返回VNode
  return function patch(oldVnode: VNode | Element, vnode: VNode): VNode {
    let i: number, elm: Node, parent: Node;

    // 已插入到DOM的VNode列表  -> 这个东西主要是拿来收集需要触发 insert 钩子的
    const insertedVnodeQueue: VNodeQueue = [];

    // pre hook
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();

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
      elm = oldVnode.elm as Node;
      parent = api.parentNode(elm);

      createElm(vnode, insertedVnodeQueue);

      // 如果父节点存在 (话说什么时候会不存在啊。。) 把旧的结点移除掉 ... 然后加入新的节点
      if (parent !== null) {
        api.insertBefore(parent, vnode.elm as Node, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }

    // an element has been inserted into the DOM
    // 已经插入到DOM里面的VNode
    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      (((insertedVnodeQueue[i].data as VNodeData).hook as Hooks).insert as any)(insertedVnodeQueue[i]);
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}
