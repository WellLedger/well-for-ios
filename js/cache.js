/* ============================================================
 * WBCache —— 统一本地缓存层
 * ------------------------------------------------------------
 * 全局约定（app.js / pet.js 共用）：
 *   1. 缓存优先：初始化时先用缓存把界面画出来，接口返回后再用服务端数据覆盖；
 *   2. 写后即缓存：任何一次写操作成功后（或本地已改、等待补传时）同步刷新缓存，
 *      让「内存状态 = 界面 = 缓存」三者始终一致；
 *   3. 按账号隔离：key 里带 uid，换账号登录不会读到上一个人的数据；
 *   4. 过期即弃：超过 TTL 的缓存直接丢弃，避免显示过时数据；
 *   5. 失败静默：localStorage 写满 / 被禁用时只跳过缓存，绝不影响主流程。
 * ============================================================ */
(function (global) {
    'use strict';

    var NS = 'wb_cache_v1';
    var VERSION = 1;
    var DAY = 24 * 60 * 60 * 1000;
    var MAX_BYTES = 900 * 1024;   // 单条上限，超过则不写，避免撑爆 localStorage 配额

    // 各资源的存活时间：变化越快的资源 TTL 越短
    var TTL = {
        bills: 7 * DAY,
        budgets: 7 * DAY,
        scheduled: 7 * DAY,
        partner: 7 * DAY,
        partnerProfile: 7 * DAY,
        pet: 7 * DAY,
        categories: 30 * DAY,
        profile: 30 * DAY
    };

    // 老版本散落在 localStorage 里的裸 key，首次读取时迁移，避免用户已存数据丢失
    var LEGACY = {
        categories: 'categories_data',
        profile: 'profile_info',
        partner: 'partner_cache_v1'
    };

    var _uid;
    var _uidReady = false;
    var _legacyChecked = {};

    function resolveUid() {
        try {
            var raw = global.localStorage.getItem('user');
            if (!raw) return null;
            var u = JSON.parse(raw);
            if (!u) return null;
            var id = u.uid != null ? u.uid : u.id;
            return id != null && id !== '' ? String(id) : null;
        } catch (e) {
            return null;
        }
    }

    function getUid() {
        if (!_uidReady) {
            _uid = resolveUid();
            _uidReady = true;
        }
        return _uid;
    }

    /* 登录 / 退出 / 切换账号后调用，重新解析当前账号 */
    function refreshUid() {
        var next = resolveUid();
        if (next !== _uid) _legacyChecked = {};
        _uid = next;
        _uidReady = true;
        return _uid;
    }

    function setUid(v) {
        _uid = v !== null && v !== undefined && v !== '' ? String(v) : null;
        _uidReady = true;
        return _uid;
    }

    function keyOf(name) {
        return NS + ':' + name + ':' + (getUid() || 'anon');
    }

    function ttlOf(name) {
        return TTL[name] || 7 * DAY;
    }

    function legacyKeyOf(name) {
        return LEGACY[name] || null;
    }

    /* 读取老 key 并迁移到当前账号名下；迁移后立刻删掉老 key，
       否则下一个账号登录时会把上一个人的数据迁到自己名下 */
    function migrateLegacy(name) {
        var lk = legacyKeyOf(name);
        if (!lk || !getUid()) return null;
        var raw = null;
        try { raw = global.localStorage.getItem(lk); } catch (e) { return null; }
        if (!raw) return null;
        try { global.localStorage.removeItem(lk); } catch (e) {}
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    /* 读取完整条目：{ v, uid, ts, dirty, data }；不存在 / 版本不符 / 过期都返回 null */
    function readEntry(name) {
        var entry = null;
        try {
            var raw = global.localStorage.getItem(keyOf(name));
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && parsed.v === VERSION && parsed.data !== undefined) {
                    entry = parsed;
                } else {
                    return null;
                }
            }
        } catch (e) {
            entry = null;
        }

        if (!entry && !_legacyChecked[name]) {
            _legacyChecked[name] = true;
            var legacy = migrateLegacy(name);
            if (legacy !== null && legacy !== undefined) {
                entry = { v: VERSION, uid: getUid(), ts: Date.now(), dirty: false, data: legacy };
                try { global.localStorage.setItem(keyOf(name), JSON.stringify(entry)); } catch (e) {}
            }
        }

        if (!entry) return null;
        if (entry.ts && Date.now() - entry.ts > ttlOf(name)) {
            remove(name);
            return null;
        }
        return entry;
    }

    function read(name) {
        var entry = readEntry(name);
        return entry ? entry.data : null;
    }

    /* 写入缓存。opts.dirty = true 表示「本地已改但还没成功同步到后端」 */
    function write(name, data, opts) {
        opts = opts || {};
        try {
            var entry = {
                v: VERSION,
                uid: getUid(),
                ts: Date.now(),
                dirty: !!opts.dirty,
                data: data
            };
            var raw = JSON.stringify(entry);
            if (raw.length > MAX_BYTES) {
                console.warn('[WBCache] ' + name + ' 体积超过单条上限，跳过缓存');
                return false;
            }
            global.localStorage.setItem(keyOf(name), raw);
            return true;
        } catch (e) {
            return false;
        }
    }

    function remove(name) {
        try { global.localStorage.removeItem(keyOf(name)); } catch (e) {}
    }

    function markDirty(name, data) {
        var entry = readEntry(name);
        var payload = data !== undefined ? data : (entry ? entry.data : null);
        if (payload === null || payload === undefined) return false;
        return write(name, payload, { dirty: true });
    }

    function isDirty(name) {
        var entry = readEntry(name);
        return !!(entry && entry.dirty);
    }

    /* 清掉不属于 keepUid 的缓存：换账号登录 / 退出登录时调用，避免串数据。
       注意 key 的格式是 NS:资源名:uid，uid 在**结尾**，所以用后缀比对。 */
    function purgeOthers(keepUid) {
        var suffix = ':' + (keepUid || getUid() || 'anon');
        try {
            var doomed = [];
            for (var i = 0; i < global.localStorage.length; i++) {
                var k = global.localStorage.key(i);
                if (!k || k.indexOf(NS + ':') !== 0) continue;
                if (k.length < suffix.length || k.slice(-suffix.length) !== suffix) doomed.push(k);
            }
            for (var j = 0; j < doomed.length; j++) global.localStorage.removeItem(doomed[j]);
        } catch (e) {}
    }

    /* 全部清空（注销账号时使用） */
    function clearAll() {
        try {
            var doomed = [];
            for (var i = 0; i < global.localStorage.length; i++) {
                var k = global.localStorage.key(i);
                if (k && k.indexOf(NS + ':') === 0) doomed.push(k);
            }
            for (var j = 0; j < doomed.length; j++) global.localStorage.removeItem(doomed[j]);
        } catch (e) {}
    }

    global.WBCache = {
        names: Object.keys(TTL),
        getUid: getUid,
        refreshUid: refreshUid,
        setUid: setUid,
        read: read,
        readEntry: readEntry,
        write: write,
        remove: remove,
        markDirty: markDirty,
        isDirty: isDirty,
        purgeOthers: purgeOthers,
        clearAll: clearAll
    };
})(window);
