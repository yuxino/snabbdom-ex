"use strict";
exports.__esModule = true;
function updateClass(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldClass = oldVnode.data["class"], klass = vnode.data["class"];
    // oldClass && klass 不存在 不做操作
    // oldClass 额 klass 一致 不做操作
    if (!oldClass && !klass)
        return;
    if (oldClass === klass)
        return;
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
            elm.classList[cur ? 'add' : 'remove'](name);
        }
    }
}
exports.classModule = { create: updateClass, update: updateClass };
exports["default"] = exports.classModule;
//# sourceMappingURL=class.js.map