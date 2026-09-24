// ============================================================
// 宠物建模注册表
// 每个建模一个独立文件（js/pets/<key>.js），加载时调用 register 注册到这里；
// js/cat-svg.js 只负责从注册表取建模并拼装 <svg>。
// 新增建模：在 pets/ 放好 SVG 后照抄任意一个模型文件，再加一个 <script> 即可。
// ============================================================
(function () {
    'use strict';
    var models = {};
    var order = [];
    window.PET_MODEL_REGISTRY = {
        register: function (model) {
            if (!model || !model.key || !model.body) return;
            if (models[model.key]) return; // 同 key 重复注册时保留先到的
            models[model.key] = model;
            order.push(model.key);
        },
        get: function (key) { return models[key] || null; },
        keys: function () { return order.slice(); }
    };
})();
