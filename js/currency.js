/* ===========================================================
 * 全局当前币种 —— 与 uni-app 工程 common/currency.js 对齐
 * -----------------------------------------------------------
 * 全站记账相关页面统一从这里取币种符号，切换币种后自动通知
 * 所有已注册页面刷新（onChange 订阅 + 页面重渲染）。
 *
 * 用法：
 *   1) JS 里拼接金额：moneySym() + amount.toFixed(2)
 *   2) 模板字符串里： `${moneySym()}${amount.toFixed(2)}`
 *   3) 读取完整币种对象：CurrencyAPI.get()  → { code, name, symbol, flag }
 *   4) 切换币种：CurrencyAPI.set('USD')
 *
 * 持久化键：currency_code（localStorage）
 * 默认值：CNY（人民币 ¥）
 * 国旗图标：img/currency/*.svg
 * =========================================================== */
(function (global) {
    'use strict';

    var CURRENCIES = [
        { code: 'CNY', name: '人民币',         symbol: '¥',   flag: 'img/currency/cn.svg' },
        { code: 'USD', name: '美元',           symbol: '$',   flag: 'img/currency/us.svg' },
        { code: 'GBP', name: '英镑',           symbol: '£',   flag: 'img/currency/gb.svg' },
        { code: 'EUR', name: '欧元',           symbol: '€',   flag: 'img/currency/eu.svg' },
        { code: 'HKD', name: '港币',           symbol: '$',   flag: 'img/currency/hk.svg' },
        { code: 'TWD', name: '台币',           symbol: '$',   flag: 'img/currency/cn.svg' },
        { code: 'KRW', name: '韩元',           symbol: '₩',   flag: 'img/currency/kr.svg' },
        { code: 'CAD', name: '加拿大元',       symbol: 'C$',  flag: 'img/currency/ca.svg' },
        { code: 'RUB', name: '卢布',           symbol: '₽',   flag: 'img/currency/ru.svg' },
        { code: 'CHF', name: '瑞士法郎',       symbol: 'CHF', flag: 'img/currency/ch.svg' },
        { code: 'MOP', name: '澳门元',         symbol: '$',   flag: 'img/currency/mo.svg' },
        { code: 'THB', name: '泰国铢',         symbol: '฿',   flag: 'img/currency/th.svg' },
        { code: 'SGD', name: '新加坡元',       symbol: '$',   flag: 'img/currency/sg.svg' },
        { code: 'JPY', name: '日元',           symbol: '¥',   flag: 'img/currency/jp.svg' },
        { code: 'AUD', name: '澳大利亚元',     symbol: 'A$',  flag: 'img/currency/au.svg' },
        { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM',  flag: 'img/currency/my.svg' },
        { code: 'NZD', name: '新西兰元',       symbol: 'NZ$', flag: 'img/currency/nz.svg' },
        { code: 'PHP', name: '菲律宾比索',     symbol: '₱',   flag: 'img/currency/ph.svg' },
        { code: 'VND', name: '越南盾',         symbol: '₫',   flag: 'img/currency/vn.svg' }
    ];

    var DEFAULT_CURRENCY = 'CNY';
    var STORAGE_KEY = 'currency_code';
    var listeners = [];

    function find(code) {
        for (var i = 0; i < CURRENCIES.length; i++) {
            if (CURRENCIES[i].code === code) return CURRENCIES[i];
        }
        return null;
    }

    function readSaved() {
        try {
            return global.localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    var current = find(readSaved()) || find(DEFAULT_CURRENCY);

    function emit(prev) {
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](current, prev);
            } catch (e) {
                console.warn('[currency] 监听器执行失败', e);
            }
        }
    }

    var CurrencyAPI = {
        list: CURRENCIES,

        /** 当前币种对象 { code, name, symbol, flag } */
        get: function () {
            return current;
        },

        /** 当前币种代码，如 CNY */
        code: function () {
            return current.code;
        },

        /** 当前币种符号，如 ¥ */
        symbol: function () {
            return current.symbol;
        },

        /** 按代码取币种对象 */
        find: find,

        /**
         * 切换币种：持久化 + 通知所有订阅者刷新
         * @param {string} code
         * @returns {boolean} 是否切换成功
         */
        set: function (code) {
            var next = find(code);
            if (!next || next.code === current.code) return false;
            var prev = current;
            current = next;
            try {
                global.localStorage.setItem(STORAGE_KEY, code);
            } catch (e) {}
            emit(prev);
            return true;
        },

        /**
         * 订阅币种变化
         * @param {Function} fn (next, prev) => void
         */
        onChange: function (fn) {
            if (typeof fn === 'function') listeners.push(fn);
        },

        /**
         * 格式化金额（不带正负号）
         * @param {number} value
         * @param {number} [digits=2]
         */
        format: function (value, digits) {
            var d = typeof digits === 'number' ? digits : 2;
            var n = Number(value) || 0;
            return current.symbol + n.toFixed(d);
        }
    };

    global.CurrencyAPI = CurrencyAPI;

    /** 快捷方法：返回当前币种符号 */
    global.moneySym = function () {
        return current.symbol;
    };
})(window);
