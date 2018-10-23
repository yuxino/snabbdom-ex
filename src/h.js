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
// VNode -> { sel, data, children, text, elm, key }
function h(sel, b, c) {
    var data = {}, children, text, i;
    // 如果有 children 第三个参数当作 children , 第二个参数当作dat
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
    // 如果没有第三个参数 第二个参数会被当作children处理
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
    // ♻️ 循环创建子节点 这里只处理`文本`或者`数字`节点。因为非这两种都是通过`h`创建的。
    if (children !== undefined) {
        for (i = 0; i < children.length; ++i) {
            // 如果 children 是 `文本` 或者 `数字` 会获得一个除了 text 全是 undefined 的 VNode节点
            if (is.primitive(children[i])) {
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
    }
    // 如果是SVG的话 需要加上NameSpace
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    // 返回 vnode 节点
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
exports["default"] = h;
//# sourceMappingURL=h.js.map