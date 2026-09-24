/**
 * OAuth 登录配置
 * ------------------------------------------------------------------
 * APK（HBuilder 5+）走原生 SDK 登录，不需要网站、不需要回调地址、不需要 ICP 备案。
 * 网页端走 Web OAuth（需要网站应用 + 回调地址）。
 *
 * 【APK 原生登录 — 平台注册】
 * 1. QQ 互联：https://connect.qq.com → 创建「移动应用」（不是网站应用）
 *    - 不需要 ICP 备案
 *    - 不需要回调地址
 *    - 需要填写 Android 包名 + 签名（HBuilderX 打包后可获得）
 * 2. 微信开放平台：https://open.weixin.qq.com → 创建「移动应用」
 *    - 不需要 ICP 备案
 *    - 不需要回调地址
 *    - 需要填写 Android 包名 + 签名
 *    - 需要填写应用签名（MD5格式，用微信提供的签名获取工具读取）
 *
 * 【网页端 OAuth — 平台注册（可选，仅网页版需要）】
 * 1. QQ 互联：创建「网站应用」→ 需要 ICP 备案号 + 回调地址
 * 2. 微信开放平台：创建「网站应用」→ 需要授权回调域（目前不强制 ICP 备案）
 *
 * 【密钥配置】
 * AppID 填在下方，AppSecret/APP Key 填在 Cloudflare Worker 环境变量：
 *   QQ_APP_ID / QQ_APP_KEY / WECHAT_APP_ID / WECHAT_APP_SECRET
 *
 * 【APK 封装】
 * HBuilderX → 发行 → 原生App-云打包，manifest.json 已配置 OAuth 模块。
 * 打包时需要勾选 QQ 登录和微信登录的 SDK。
 * ------------------------------------------------------------------
 */
window.OAUTH_CONFIG = {

    // ── QQ 互联 ──────────────────────────────────────────
    qq: {
        appId: '1905654962',
        scope: 'get_user_info',
        authUrl: 'https://graph.qq.com/oauth2.0/authorize',
    },

    // ── 微信开放平台 ──────────────────────────────────────
    wechat: {
        appId: 'wx25fa8563b8b368a7',
        scope: 'snsapi_login',
        authUrl: 'https://open.weixin.qq.com/connect/qrconnect',
    },

    // ── 网页端回调地址（仅网页版需要，APK 原生登录不用）──
    redirectUri: 'https://account.solitudenook.top/oauth-callback.html',

    // ── 后端接口 ──────────────────────────────────────────
    // 网页端：code 换 token
    apiEndpoint: '/auth/oauth',
    // APK 原生：验证 access_token + openid
    apiNativeEndpoint: '/auth/oauth-native',

    stateKey: 'oauth_state',
};
