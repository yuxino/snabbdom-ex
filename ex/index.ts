type Props = Record<string, any>;
type On = {
  [N in keyof HTMLElementEventMap]?: (ev: HTMLElementEventMap[N]) => void
} & {
  [event: string]: EventListener;
};

type Key = string | number;

interface VNode {
  sel: string | undefined;
  data: VNodeData | undefined;
  children: Array<VNode | string> | undefined;
  elm: Node | undefined;
  text: string | undefined;
  key: Key | undefined;
}

export interface VNodeData {
  props?: Props;
  on?: On;
}

import { isDef, isUndef, startsWith, isDomElement } from "./utils";

function render(vnode: VNode, container: Node | string) {
  if (isUndef(container)) {
    throw new Error(
      "snab: container should'nt be empty, you can pass a selector or a dom element"
    );
  } else if (typeof container === "string") {
    if (startsWith(container, "#")) {
      const dom: HTMLElement = document.querySelector(container);
      dom.appendChild(vnode.elm);
    } else {
      throw new Error("snab: pls use id selector");
    }
  } else if (isDomElement(container)) {
    container.appendChild(vnode.elm);
  }
}

// two type vnode here :
// 1. vnode based on text element
// 2. vnode based on dom element
function createVnode(type, data, ...children): VNode {
  if (isUndef(data) && isUndef(children)) {
  }
}

function craeteElement(type, data, ...children) {}

function craeteTextElement(type, data, ...children) {}

render(createVnode("vvv", {}, 123), "#xxx");
