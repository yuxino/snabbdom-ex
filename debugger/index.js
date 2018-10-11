// write sth in here use es6 syntax
import * as snabbdom from 'src/snabbdom'


import classModules from 'src/modules/class' // makes it easy to toggle classes
import propsModules from 'src/modules/props' // for setting properties on DOM elements
import styleModules from 'src/modules/style'  // handles styling on elements with support for animations
import listenersModules from 'src/modules/eventlisteners' // attaches event listeners

var patch = snabbdom.init([ // Init patch function with chosen modules
  classModules,
  propsModules,
  styleModules,
  listenersModules
]);
var h = snabbdom.h

var container = document.getElementById('container');

var vnode = h('div#container', {on: {click: () => console.log('on click')}}, [
  h('span', {style: {fontWeight: 'bold'}}, 'This is bold'),
  ' and this is just normal text',
  h('a', {props: {href: '/foo'}}, 'I\'ll take you places!')
]);

// Patch into empty DOM element – this modifies the DOM as a side effect
patch(container, vnode);


// var newVnode = h('div#container', {on: {click: () => console.log('oh my god')}}, [
//   h('span', {style: {fontWeight: 'normal', fontStyle: 'italic'}}, 'This is now italic type'),
//   ' and this is still just normal text',
//   h('a', {props: {href: '/bar'}}, 'I\'ll take you places!')
// ]);
// // Second `patch` invocation
// patch(vnode, newVnode); // Snabbdom efficiently updates the old view to the new state
