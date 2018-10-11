"use strict";
exports.__esModule = true;
var vnode_1 = require("./vnode");
var is = require("./is");
// 给SVG标签添加NameSpace 否则显示会不正常。
// foreignObject 能让 svg 和 xhtml 混合使用 ..
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
// vnode -> { sel, data, children, text, elm, key }
function h(sel, b, c) {
    var data = {}, children, text, i;
    // 处理 data , children ..
    if (c !== undefined) {
        data = b;
        if (is.array(c)) {
            children = c;
        }
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    // ♻️ 循环创建子节点
    // isPrimitive -> 判断是否为string或者number类型
    if (children !== undefined) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i])) {
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
    }
    // 如果是SVG的话 .. 加上NameSpace
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
exports["default"] = h;
//# sourceMappingURL=h.js.map