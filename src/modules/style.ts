import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

export type VNodeStyle = Record<string, string> & {
  delayed?: Record<string, string>
  remove?: Record<string, string>
}

var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;

var nextFrame = function(fn: any) { raf(function() { raf(fn); }); };

var reflowForced = false;

function setNextFrame(obj: any, prop: string, val: any): void {
  nextFrame(function() { obj[prop] = val; });
}

// 更新样式
function updateStyle(oldVnode: VNode, vnode: VNode): void {
  var cur: any,
      name: string,
      elm = vnode.elm,
      oldStyle = (oldVnode.data as VNodeData).style,
      style = (vnode.data as VNodeData).style;

  // 没有样式或者样式一致不做操作
  if (!oldStyle && !style) return;
  if (oldStyle === style) return;

  oldStyle = oldStyle || {} as VNodeStyle;
  style = style || {} as VNodeStyle;

  var oldHasDel = 'delayed' in oldStyle;

  // 旧样式 如果在新样式中不存在
  // 1. 如果样式名开头是 -- (CSS变量) 直接清除属性
  // 2. 否则清空样式
  for (name in oldStyle) {
    if (!style[name]) {
      if (name[0] === '-' && name[1] === '-') {
        (elm as any).style.removeProperty(name);
      } else {
        (elm as any).style[name] = '';
      }
    }
  }
  // remove 样式会在 vnode被销毁的时候执行
  for (name in style) {
    cur = style[name];
    if (name === 'delayed' && style.delayed) {
      for (let name2 in style.delayed) {
        cur = style.delayed[name2];
        if (!oldHasDel || cur !== (oldStyle.delayed as any)[name2]) {
          setNextFrame((elm as any).style, name2, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      if (name[0] === '-' && name[1] === '-') {
        (elm as any).style.setProperty(name, cur);
      } else {
        (elm as any).style[name] = cur;
      }
    }
  }
}

// 销毁匀速的时候执行这个钩子 并且往元素上面添加 css 属性
function applyDestroyStyle(vnode: VNode): void {
  var style: any, name: string, elm = vnode.elm, s = (vnode.data as VNodeData).style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    (elm as any).style[name] = style[name];
  }
}

// 移除样式
function applyRemoveStyle(vnode: VNode, rm: () => void): void {
  var s = (vnode.data as VNodeData).style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  // 强制回流 ?? 不知道是干嘛的 ??
  if(!reflowForced) {
    getComputedStyle(document.body).transform;
    reflowForced = true;
  }
  var name: string,
      elm = vnode.elm,
      i = 0,
      compStyle: CSSStyleDeclaration,
      style = s.remove,
      amount = 0,
      applied: Array<string> = [];

  // 收集已添加的样式
  for (name in style) {
    applied.push(name);
    (elm as any).style[name] = style[name];
  }
  // 获取样式属性
  compStyle = getComputedStyle(elm as Element);

  // 获取所有的 transition-property -> 可能是 width, height ... 等等属性 反正都收集起来
  var props = (compStyle as any)['transition-property'].split(', ');

  // 获取会触发过度的属性
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }

  // 直到所有的过渡动画都做完了 移除元素
  (elm as Element).addEventListener('transitionend', function (ev: TransitionEvent) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

function forceReflow() {
  reflowForced = false;
}

export const styleModule = {
  pre: forceReflow,
  create: updateStyle,
  update: updateStyle,
  destroy: applyDestroyStyle,
  remove: applyRemoveStyle
} as Module;
export default styleModule;
