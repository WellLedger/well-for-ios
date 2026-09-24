/*
 * 猫咪建模渲染器
 * ------------------------------------------------------------
 * 建模本体已拆分到 js/pets/<key>.js（一个模型一个文件，便于维护），
 * 加载时各自注册到 window.PET_MODEL_REGISTRY（见 js/pets/registry.js）。
 * 这里只负责：按 variant 取建模 -> 拼装成 <svg> 字符串。
 *
 * 用法不变：window.CatSVG(svgClass, variant)
 *   svgClass: 外层 svg 的 class（pet-cat-svg / pet-cat-avatar-svg / ...）
 *   variant:  建模 key，缺省回退到 'default'
 *
 * 建模内部结构约定（动画钩子，样式见 css/pet.css）：
 *   g.cat-tail / g.cat-body / g.cat-head / g.cat-body-front
 *   cat-ear-left|right, cat-eye-left|right(cat-eye-open/closed/blink),
 *   cat-muzzle, cat-nose, cat-mouth-open
 */
(function () {
    'use strict';

    function modelOf(variant) {
        var reg = window.PET_MODEL_REGISTRY;
        if (!reg) return null;
        return reg.get(variant) || reg.get('default');
    }

    window.CatSVG = function (svgClass, variant) {
        var model = modelOf(variant);
        var body = model ? model.body : '';
        if (!body) {
            console.warn('[CatSVG] 未找到建模，请检查 js/pets/ 下的模型文件：', variant);
        }
        return '<svg class="' + (svgClass || 'pet-cat-svg') + '" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" fill="none">' +
            body +
            '</svg>';
    };

    // 当前已注册的建模清单（供 pet.js / 调试用）
    window.CatSVG.variants = function () {
        return window.PET_MODEL_REGISTRY ? window.PET_MODEL_REGISTRY.keys() : [];
    };
})();
