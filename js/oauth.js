/**
 * OAuth 登录前端逻辑
 * ------------------------------------------------------------------
 * 支持两种模式：
 *   1. APK 原生登录（plus.oauth）— 拉起 QQ/微信 App 授权，无需网站、无需回调地址
 *   2. 网页端 OAuth（弹窗 + postMessage）— 浏览器环境使用
 *
 * 依赖：
 *   - window.OAUTH_CONFIG  (来自 oauth-config.js)
 *   - window.API_BASE      (来自 app.js)
 *
 * 用法（app.js 里初始化时调用）：
 *   OAuthLogin.init({
 *     onSuccess: (token, user) => { ... 进入主应用 ... },
 *     onError:   (msg) => { ... 显示错误 ... },
 *   });
 *   // 绑定按钮
 *   document.querySelector('.social-wechat').addEventListener('click', () => OAuthLogin.start('wechat'));
 *   document.querySelector('.social-qq').addEventListener('click', () => OAuthLogin.start('qq'));
 * ------------------------------------------------------------------
 */
(function () {
    'use strict';

    var cfg = window.OAUTH_CONFIG;
    if (!cfg) {
        console.error('[OAuth] 缺少 OAUTH_CONFIG，请先引入 oauth-config.js');
        return;
    }

    var handlers = {
        onSuccess: null,
        onError: null,
    };

    var pending = false;

    // ── 工具函数 ──────────────────────────────────────────

    function isAPK() {
        return !!(window.plus && plus.oauth);
    }

    function generateState() {
        var s = '';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 16; i++) {
            s += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return s;
    }

    function saveState(state) {
        try { sessionStorage.setItem(cfg.stateKey, state); } catch (e) { cfg._savedState = state; }
    }
    function loadState() {
        try { return sessionStorage.getItem(cfg.stateKey); } catch (e) { return cfg._savedState || null; }
    }
    function clearState() {
        try { sessionStorage.removeItem(cfg.stateKey); } catch (e) { cfg._savedState = null; }
    }

    // ==================================================================
    // APK 原生 OAuth（plus.oauth）
    // 直接拉起 QQ/微信客户端授权，拿到 access_token + openid，
    // 发给后端验证并签发本系统 session。
    // 不需要回调地址、不需要网站、不需要 ICP 备案。
    // ==================================================================

    function startNativeOAuth(provider) {
        plus.oauth.getServices(function (services) {
            // HBuilder 5+ 中 QQ 的 service.id 为 'qq'，微信为 'weixin'
            var serviceId = (provider === 'wechat') ? 'weixin' : 'qq';
            var svc = null;
            for (var i = 0; i < services.length; i++) {
                if (services[i].id === serviceId) {
                    svc = services[i];
                    break;
                }
            }

            if (!svc) {
                pending = false;
                var missingApp = (provider === 'wechat') ? '微信' : 'QQ';
                if (handlers.onError) handlers.onError('未安装' + missingApp + '客户端，无法使用' + missingApp + '登录');
                return;
            }

            // 已登录过则先退出，确保每次都能重新授权
            if (svc.authResult) {
                svc.logout(function () {
                    doNativeLogin(svc, provider);
                }, function () {
                    doNativeLogin(svc, provider);
                });
            } else {
                doNativeLogin(svc, provider);
            }
        }, function (err) {
            pending = false;
            if (handlers.onError) handlers.onError('获取登录服务失败');
        });
    }

    function doNativeLogin(svc, provider) {
        svc.login(function (e) {
            // 授权成功，e.target.authResult 包含 access_token / openid / unionid 等
            var authResult = (e.target && e.target.authResult) || e.target || {};
            var accessToken = authResult.access_token || '';
            var openid = authResult.openid || '';
            var unionid = authResult.unionid || '';
            // plus.oauth 的 getUserInfo 会拉取昵称和头像
            var nickname = '';
            var avatar = '';

            if (typeof svc.getUserInfo === 'function') {
                svc.getUserInfo(function () {
                    var userInfo = svc.userInfo || {};
                    nickname = userInfo.nickname || userInfo.nickName || '';
                    avatar = userInfo.headimgurl || userInfo.figureurl || userInfo.figureurl_qq_2 || userInfo.avatar || '';

                    sendNativeTokenToBackend(provider, accessToken, openid, unionid, nickname, avatar);
                }, function () {
                    // getUserInfo 失败也能继续，后端会尝试获取
                    sendNativeTokenToBackend(provider, accessToken, openid, unionid, '', '');
                });
            } else {
                sendNativeTokenToBackend(provider, accessToken, openid, unionid, '', '');
            }
        }, function (err) {
            pending = false;
            // code: -2 用户取消，-6 未安装客户端
            if (err && err.code === -2) {
                // 用户取消，不报错
                return;
            }
            if (handlers.onError) handlers.onError('授权失败：' + (err && err.message ? err.message : '请重试'));
        });
    }

    function sendNativeTokenToBackend(provider, accessToken, openid, unionid, nickname, avatar) {
        var apiBase = window.API_BASE || '';
        var endpoint = apiBase + (cfg.apiNativeEndpoint || '/auth/oauth-native');

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: provider,
                access_token: accessToken,
                openid: openid,
                unionid: unionid || null,
                nickname: nickname || null,
                avatar: avatar || null,
            }),
        })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            pending = false;
            if (data.error) {
                if (handlers.onError) handlers.onError(data.error);
                return;
            }
            if (!data.token || !data.user) {
                if (handlers.onError) handlers.onError('登录失败，请重试');
                return;
            }
            if (handlers.onSuccess) handlers.onSuccess(data.token, data.user);
        })
        .catch(function () {
            pending = false;
            if (handlers.onError) handlers.onError('网络错误，请重试');
        });
    }

    // ==================================================================
    // 网页端 OAuth（弹窗 + postMessage）
    // ==================================================================

    function buildAuthUrl(provider, state) {
        var p = cfg[provider];
        if (!p || !p.appId) return null;
        var redirectUri = encodeURIComponent(cfg.redirectUri);

        if (provider === 'qq') {
            return p.authUrl +
                '?client_id=' + p.appId +
                '&redirect_uri=' + redirectUri +
                '&response_type=code' +
                '&scope=' + p.scope +
                '&state=' + state;
        }
        if (provider === 'wechat') {
            return p.authUrl +
                '?appid=' + p.appId +
                '&redirect_uri=' + redirectUri +
                '&response_type=code' +
                '&scope=' + p.scope +
                '&state=' + state +
                '#wechat_redirect';
        }
        return null;
    }

    function exchangeCodeForToken(provider, code, state) {
        if (pending) return;
        pending = true;

        var savedState = loadState();
        if (savedState && state && savedState !== state) {
            pending = false;
            if (handlers.onError) handlers.onError('登录状态校验失败，请重试');
            return;
        }
        clearState();

        var apiBase = window.API_BASE || '';
        var endpoint = apiBase + cfg.apiEndpoint;

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: provider,
                code: code,
                redirect_uri: cfg.redirectUri,
            }),
        })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            pending = false;
            if (data.error) {
                if (handlers.onError) handlers.onError(data.error);
                return;
            }
            if (!data.token || !data.user) {
                if (handlers.onError) handlers.onError('登录失败，请重试');
                return;
            }
            if (handlers.onSuccess) handlers.onSuccess(data.token, data.user);
        })
        .catch(function () {
            pending = false;
            if (handlers.onError) handlers.onError('网络错误，请重试');
        });
    }

    function startWebPopup(provider, state) {
        var authUrl = buildAuthUrl(provider, state);
        if (!authUrl) {
            if (handlers.onError) handlers.onError(
                provider === 'qq' ? 'QQ AppID 未配置' : '微信 AppID 未配置'
            );
            return;
        }

        var w = 500, h = 600;
        var left = (window.screen.width - w) / 2;
        var top = (window.screen.height - h) / 2;
        var popup = window.open(authUrl, 'oauth_login',
            'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top +
            ',menubar=no,toolbar=no,location=no,status=no,scrollbars=yes');

        if (!popup) {
            if (handlers.onError) handlers.onError('弹窗被浏览器拦截，请允许弹窗后重试');
            return;
        }

        function messageHandler(e) {
            if (!e.data || e.data.type !== 'oauth-callback') return;
            if (e.data.provider !== provider) return;

            window.removeEventListener('message', messageHandler);
            try { popup.close(); } catch (e) {}

            if (e.data.error) {
                if (handlers.onError) handlers.onError(e.data.error);
                return;
            }
            if (e.data.code) {
                exchangeCodeForToken(provider, e.data.code, e.data.state);
            }
        }
        window.addEventListener('message', messageHandler);

        var checkTimer = setInterval(function () {
            if (popup.closed) {
                clearInterval(checkTimer);
                window.removeEventListener('message', messageHandler);
                pending = false;
            }
        }, 500);
    }

    // ── 公开 API ──────────────────────────────────────────

    var OAuthLogin = {

        init: function (opts) {
            if (opts.onSuccess) handlers.onSuccess = opts.onSuccess;
            if (opts.onError) handlers.onError = opts.onError;
        },

        clearAuth: function () {
            if (!isAPK()) return;
            try {
                plus.oauth.getServices(function (services) {
                    for (var i = 0; i < services.length; i++) {
                        var svc = services[i];
                        if (svc.authResult) {
                            try { svc.logout(function(){}, function(){}); } catch(e) {}
                        }
                    }
                }, function(){});
            } catch(e) {}
        },

        start: function (provider) {
            if (pending) return;

            // APK 环境 → 原生 OAuth（拉起 QQ/微信 App）
            if (isAPK()) {
                pending = true;
                startNativeOAuth(provider);
                return;
            }

            // 浏览器环境 → Web OAuth（弹窗）
            if (!cfg[provider] || !cfg[provider].appId) {
                if (handlers.onError) handlers.onError(
                    provider === 'qq'
                        ? '请先在 js/oauth-config.js 中配置 QQ AppID'
                        : '请先在 js/oauth-config.js 中配置微信 AppID'
                );
                return;
            }

            pending = true;
            var state = generateState();
            saveState(state);
            startWebPopup(provider, state);
        },

        // 供 callback 页面直接调用（网页端用）
        handleCode: function (provider, code, state) {
            exchangeCodeForToken(provider, code, state);
        },
    };

    window.OAuthLogin = OAuthLogin;
})();
