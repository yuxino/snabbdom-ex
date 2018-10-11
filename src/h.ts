import {vnode, VNode, VNodeData} from './vnode';
export type VNodes = Array<VNode>;
export type VNodeChildElement = VNode | string | number | undefined | null;
export type ArrayOrElement<T> = T | T[];
export type VNodeChildren = ArrayOrElement<VNodeChildElement>
import * as is from './is';

// 给SVG标签添加NameSpace 否则显示会不正常。
// foreignObject 能让 svg 和 xhtml 混合使用 ..
function addNS(data: any, children: VNodes | undefined, sel: string | undefined): void {
  data.ns = 'http://www.w3.org/2000/svg';
  if (sel !== 'foreignObject' && children !== undefined) {
    for (let i = 0; i < children.length; ++i) {
      let childData = children[i].data;
      if (childData !== undefined) {
        addNS(childData, (children[i] as VNode).children as VNodes, children[i].sel);
      }
    }
  }
}

export function h(sel: string): VNode;
export function h(sel: string, data: VNodeData): VNode;
export function h(sel: string, children: VNodeChildren): VNode;
export function h(sel: string, data: VNodeData, children: VNodeChildren): VNode;


// vnode -> { sel, data, children, text, elm, key }
export function h(sel: any, b?: any, c?: any): VNode {
  var data: VNodeData = {}, children: any, text: any, i: number;
  // 处理 data , children ..
  if (c !== undefined) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
    else if (c && c.sel) { children = [c]; }
  }
  else if (b !== undefined) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else if (b && b.sel) { children = [b]; }
    else { data = b; }
  }
  // ♻️ 循环创建子节点
  // isPrimitive -> 判断是否为string或者number类型
  if (children !== undefined) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) {
        children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
      }
    }
  }
  // 如果是SVG的话 .. 加上NameSpace
  if (
    sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
    (sel.length === 3 || sel[3] === '.' || sel[3] === '#')
  ) {
    addNS(data, children, sel);
  }
  return vnode(sel, data, children, text, undefined);
};

export default h;
