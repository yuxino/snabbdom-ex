// write sth in here use es6 syntax
import * as snabbdom from "src/snabbdom";

import classModule from "src/Modules/class"; // makes it easy to toggle classes
import propsModule from "src/Modules/props"; // for setting properties on DOM elements
import styleModule from "src/Modules/style"; // handles styling on elements with support for animations
import listenersModule from "src/Modules/eventlisteners"; // attaches event listeners
import dataSetModule from 'src/Modules/dataset'

var patch = snabbdom.init([
  // Init patch function with chosen Module
  classModule,
  propsModule,
  styleModule,
  listenersModule,
  dataSetModule
]);
var h = snabbdom.h;

var container = document.getElementById("container");

var vnode = h(
  "div#container",
  {
    on: { click: () => console.log("on click") },
    class: { a: true },
    dataset: {action: 'reset'}
  },
  [
    h("span", { style: { fontWeight: "bold", transition: 'opacity 1s' , remove: { opacity: '0'} } }, "This is bold"),
    " and this is just normal text",
    h("a", { props: { href: "/foo" } }, "I'll take you places!")
  ]
);

// var vnode = <div key="">123</div>

// Patch into empty DOM element – this modifies the DOM as a side effect
patch(container, vnode);

// var newVnode = h(
//   "div#container",
//   { on: { click: () => console.log("oh my god") } },
//   [
//     " and this is still just normal text",
//     h("a", { props: { href: "/bar" } }, "I'll take you places!")
//   ]
// );

// // Second `patch` invocation
// patch(vnode, newVnode); // Snabbdom efficiently updates the old view to the new state
