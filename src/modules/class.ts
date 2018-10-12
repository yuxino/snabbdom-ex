import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

export type Classes = Record<string, boolean>

function updateClass(oldVnode: VNode, vnode: VNode): void {
  var cur: any,
      name: string,
      elm: Element = vnode.elm as Element,
      oldClass = (oldVnode.data as VNodeData).class,
      klass = (vnode.data as VNodeData).class;

  console.log(oldClass, klass)

    // oldClass && klass 不存在 不做操作
  // oldClass 额 klass 一致 不做操作
  if (!oldClass && !klass) return;
  if (oldClass === klass) return;

  oldClass = oldClass || {};
  klass = klass || {};

    // 移除klass里不存在的旧的class
  for (name in oldClass) {
    if (!klass[name]) {
      elm.classList.remove(name);
    }
  }

  // true,false 负责 增加和隐藏新的class
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      (elm.classList as any)[cur ? 'add' : 'remove'](name);
    }
  }
}

export const classModule = {create: updateClass, update: updateClass} as Module;
export default classModule;
