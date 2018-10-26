// write sth in here use es6 syntax
import * as snabbdom from "src/snabbdom";

import classModule from "src/Modules/class"; // makes it easy to toggle classes
import propsModule from "src/Modules/props"; // for setting properties on DOM elements
import styleModule from "src/Modules/style"; // handles styling on elements with support for animations
import listenersModule from "src/Modules/eventlisteners"; // attaches event listeners

var patch = snabbdom.init([
  // Init patch function with chosen Module
  classModule,
  propsModule,
  styleModule,
  listenersModule,
]);
var h = snabbdom.h;

var container = document.getElementById("container");

var vnode = h(
  "div#container",
  [
    h("h2", "This is bold"),
    " and this is just normal text"
  ]
);

vnode = patch(container, vnode);

var newVnode = h("div#container", [
    h("div", "This is bold"),
    " and this is just normal text",
    h("h2", "I'll take you places!")
])

patch(vnode, newVnode);
