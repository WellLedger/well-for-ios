(function() {
    'use strict';

    const API_BASE = 'https://account.solitudenook.top/api';

    
    let currentUser = null;
    let token = null;
    let allBills = [];
    let currentPage = 'home';
    let searchPreviousPage = 'home';
    let deleteTargetId = null;
    let editingBillId = null;
    let confirmCallback = null;
    let currentType = 'expense';
    let currentCategory = null;
    let amountStr = '0';
    let selectedBelong = '自己';
    let selectedPayment = '微信';
    let noteContent = '';
    let selectedDate = new Date();
    let viewDate = new Date();
    let tempSelectedDate = new Date();
    let closeNoteTimer = null;
    let avatarData = null;
    let cropper = null; 
    let currentPartner = null;
    let matchCode = null;
    let previousPage = 'home';
let pageBackStack = [];
let currentBillId = null;
let currentBill = null;
let currentHomeFilter = 'all';
let selectedMonthDate = new Date();
let tempMonthDate = new Date();
let budgetViewType = 'my';
let budgetViewDate = new Date();
let budgetChartInstance = null;
let billsViewType = 'month'; 
let billsSelectedDate = new Date();
let billsViewDate = new Date();
let billsBelongFilter = 'all';
let billsTypeFilter = 'expense'; 
let weekPickerDate = new Date();
let tempWeekDate = new Date();
let selectedWeekStart = null; 
let settingsFromProfile = false;
let partnerProfileInfo = null;
let searchPage = 1;
let searchHasMore = false;
let searchLoading = false;
let searchResultsCache = [];
const GENDER_OPTIONS = ['男', '女', '保密'];
const GENDER_MAP = { '男': 'male', '女': 'female', '保密': 'secret' };
const GENDER_REVERSE_MAP = { 'male': '男', 'female': '女', 'secret': '保密' };
let genderTempValue = '保密';

const WALLET_TYPES = [
    { key: 'my', label: '我的小荷包', filter: '自己' },
    { key: 'partner', label: '对方的荷包', filter: '对方' },
    { key: 'both', label: '我们的荷包', filter: '共同' },
];
let currentWalletIndex = 2;
function getAvailableWallets() {
    if (currentPartner) {
        
        return WALLET_TYPES;
    } else {
        
        return WALLET_TYPES.filter(w => w.key !== 'partner');
    }
}


function getCurrentWallet() {
    const available = getAvailableWallets();
    return available[currentWalletIndex] || available[0];
}



const WEBVIEW_PAGES = {
    'match': {
        title: '关于匹配的常见问题',
        url: 'https://wellledger.github.io/well-docs/questions/faq-matching.html'
    },
    'export': {
        title: '关于账单导出路径问题',
        url: 'https://wellledger.github.io/well-docs/questions/faq-export.html'
    },
    'pet': {
        title: '关于宠物相关的问题',
        url: 'https://wellledger.github.io/well-docs/questions/faq-pet.html'
    },
    
    'privacy': {
        title: '隐私政策',
        url: 'https://wellledger.github.io/well-docs/privacy-policy.html'
    },
    'terms': {
        title: '用户协议',
        url: 'https://wellledger.github.io/well-docs/user-agreement.html'
    }
};


let webviewState = {
    currentUrl: '',
    currentTitle: '',
    isLoading: false
};


function openWebViewPage(pageKey) {
    
    const isOnAuthPage = pageAuth.style.display === 'flex';
    
    
    pageBackStack.push(isOnAuthPage ? 'auth' : currentPage);
    
    const config = WEBVIEW_PAGES[pageKey];
    if (!config) {
        showToast('页面不存在');
        return;
    }
    
    
    webviewState.currentUrl = config.url;
    webviewState.currentTitle = config.title;
    
    
    const pageEl = document.getElementById('page-webview');
    const titleEl = document.getElementById('webviewTitle');
    const iframe = document.getElementById('webviewIframe');
    const loadingEl = document.getElementById('webviewLoading');
    const errorEl = document.getElementById('webviewError');
    
    
    titleEl.textContent = config.title;
    
    
    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    iframe.style.display = 'none';
    iframe.src = ''; 
    
    
    nav.classList.remove('show');
    
    
    pageEl.style.display = 'flex';
    
    
    if (isOnAuthPage) {
        pageEl.classList.add('active');
        pageAuth.style.display = 'none';
        pageAuth.classList.remove('active');
        mainApp.style.display = 'flex';
        try { refreshStatusBar(); } catch(e) {}
    } else {
        requestAnimationFrame(() => {
            pageEl.classList.add('active');
            try { refreshStatusBar(); } catch(e) {}
        });
    }
    
    currentPage = 'webview';
    
    
    setTimeout(() => {
        loadWebViewContent(config.url);
    }, 350);
}


function loadWebViewContent(url) {
    const iframe = document.getElementById('webviewIframe');
    const loadingEl = document.getElementById('webviewLoading');
    const errorEl = document.getElementById('webviewError');
    
    webviewState.isLoading = true;
    
    
    if (url.endsWith('.html') && !url.startsWith('http')) {
        
        iframe.src = url;
        iframe.style.display = 'block';
        loadingEl.style.display = 'none';
        errorEl.style.display = 'none';
        webviewState.isLoading = false;
        return;
    }
    
    
    iframe.onload = function() {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'none';
        iframe.style.display = 'block';
        webviewState.isLoading = false;
    };
    
    iframe.onerror = function() {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';
        iframe.style.display = 'none';
        webviewState.isLoading = false;
    };
    
    
    const timeoutId = setTimeout(function() {
        if (webviewState.isLoading) {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'flex';
            iframe.style.display = 'none';
            webviewState.isLoading = false;
        }
    }, 15000); 
    
    
    iframe.onload = function() {
        clearTimeout(timeoutId);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'none';
        iframe.style.display = 'block';
        webviewState.isLoading = false;
    };
    
    
    iframe.src = url;
}


function closeWebViewPage() {
    const target = pageBackStack.length > 0 ? pageBackStack.pop() : 'home';
    const pageEl = document.getElementById('page-webview');
    const iframe = document.getElementById('webviewIframe');
    
    
    iframe.src = '';
    webviewState.isLoading = false;
    
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    
    
    if (target === 'auth') {
        mainApp.style.display = 'none';
        pageAuth.style.display = 'flex';
        pageAuth.classList.add('active');
        nav.classList.remove('show');
        currentPage = 'home'; 
        try { refreshStatusBar(); } catch(e) {}
        return;
    }
    
    restoreFromBack(target);
}


function refreshWebView() {
    if (!webviewState.currentUrl) return;
    
    const iframe = document.getElementById('webviewIframe');
    const loadingEl = document.getElementById('webviewLoading');
    const errorEl = document.getElementById('webviewError');
    
    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    iframe.style.display = 'none';
    
    
    setTimeout(() => {
        loadWebViewContent(webviewState.currentUrl);
    }, 300);
}


function initWebViewEvents() {
    
    document.getElementById('webviewBackBtn')?.addEventListener('click', closeWebViewPage);
    
    
    document.getElementById('webviewRefreshBtn')?.addEventListener('click', refreshWebView);
    
    
    document.getElementById('webviewRetryBtn')?.addEventListener('click', refreshWebView);
    
    
    document.querySelectorAll('.feedback-option[data-question]').forEach(option => {
        
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);

        newOption.addEventListener('click', function(e) {
            e.preventDefault();
            const questionId = this.dataset.question;
            if (questionId && WEBVIEW_PAGES[questionId]) {
                openWebViewPage(questionId);
            } else {
                showToast('该问题详情暂未开放');
            }
        });
    });
}




function getDisplayBelong(bill) {
    if (!bill) return '自己';
    if (bill.ledger_type !== 'couple') return bill.belong || '自己';
    const b = bill.belong || '自己';
    if (b === '共同') return '共同';
    const recordedByMe = currentUser && bill.user_id === currentUser.id;
    const recordedByPartner = currentPartner && bill.user_id === currentPartner.id;
    if (b === '自己') {
        
        return recordedByMe ? '自己' : (recordedByPartner ? '对方' : '自己');
    }
    if (b === '对方') {
        
        return recordedByMe ? '对方' : (recordedByPartner ? '自己' : '对方');
    }
    return b;
}


function isHelpBill(bill) {
    if (!bill) return false;
    return bill.belong === '小知' || bill.belong === '对方';
}


function getDisplayBelongName(bill) {
    const disp = getDisplayBelong(bill);
    if (disp === '自己') {
        return (currentUser && (currentUser.nickname || currentUser.uid)) || '自己';
    }
    if (disp === '对方') {
        return (currentPartner && (currentPartner.nickname || currentPartner.uid)) || '对方';
    }
    if (disp === '小知') return '小知';
    if (disp === '共同') return '共同';
    return disp;
}




async function sendVerificationCode(email, type) {
    const data = await apiCall('/auth/send-code', 'POST', { email, type });
    return data;
}


async function registerWithCode(email, code, password, nickname) {
    const data = await apiCall('/auth/register', 'POST', { email, code, password, nickname });
    return data;
}


async function checkEmailExists(email) {
    try {
        const data = await apiCall('/auth/check-email', 'POST', { email });
        return data.exists;
    } catch {
        return false;
    }
}


async function verifyCurrentPassword(password) {
    return await apiCall('/auth/verify-password', 'POST', { password });
}


async function changePassword(currentPassword, newPassword, code) {
    return await apiCall('/auth/change-password', 'POST', { currentPassword, newPassword, code });
}


async function forgotPassword(email, code, newPassword) {
    return await apiCall('/auth/forgot-password', 'POST', { email, code, newPassword });
}


let countdownTimer = null;
let countdownSeconds = 0;

function startCountdown(button, seconds = 60) {
    countdownSeconds = seconds;
    button.disabled = true;
    button.textContent = `${seconds}s 后重发`;
    
    if (countdownTimer) clearInterval(countdownTimer);
    
    countdownTimer = setInterval(() => {
        countdownSeconds--;
        if (countdownSeconds <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            button.disabled = false;
            button.textContent = '获取验证码';
        } else {
            button.textContent = `${countdownSeconds}s 后重发`;
        }
    }, 1000);
}
    
    const monthOverlay = document.getElementById('monthOverlay');
const monthModal = document.getElementById('monthModal');
const monthModalClose = document.getElementById('monthModalClose');
const monthBtnToday = document.getElementById('monthBtnToday');
const monthBtnConfirm = document.getElementById('monthBtnConfirm');
const summaryDateLabel = document.getElementById('summaryDateLabel');
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const paymentOverlay = $('#paymentOverlay');
    const noteOverlay = $('#noteOverlay');
    const pageAuth = $('#auth-page');
    const loginForm = $('#loginForm');
    const registerForm = $('#registerForm');
    const authSwitchLink = $('#authSwitchLink');
    const authSwitchText = $('#authSwitchText');
    const avatarFileInput = $('#avatarFileInput');
const avatarOverlay = $('#avatarOverlay');
const avatarModal = $('#avatarModal');
const avatarCropImage = $('#avatarCropImage');
const avatarBtnCancel = $('#avatarBtnCancel');
const avatarBtnConfirm = $('#avatarBtnConfirm');
const homeAvatarImg = $('#homeAvatarImg');
const homeAvatarIcon = $('#homeAvatarIcon');
const profileAvatarImg = $('#profileAvatarImg');
const profileAvatarIcon = $('#profileAvatarIcon');
const profileAvatarWrapper = $('#profileAvatarWrapper');
    const mainApp = $('#main-app');
    const nav = $('#bottom-nav');
    const navItems = $$('.nav-item');
    const navAddBtn = $('#navAddBtn');
    const addModalOverlay = $('#addModalOverlay');
    const addModalClose = $('#addModalClose');
    const categoryGridWrapper = $('#categoryGridWrapper');
    const slideExpense = $('#categorySlideExpense');
    const slideIncome = $('#categorySlideIncome');
    const modalTypeToggle = $('#modalTypeToggle');
    const amountDisplay = $('#amountDisplay');
    const keyboard = $('#keyboard');
    const belongGroup = $('#belongGroup');

    const noteDisplay = $('#noteDisplay');
    const notePlaceholder = $('#notePlaceholder');
    const noteText = $('#noteText');
    const noteModal = $('#noteModal');
    const noteModalInput = $('#noteModalInput');
    const noteModalConfirm = $('#noteModalConfirm');

    const paymentTrigger = $('#paymentTrigger');
    const paymentTriggerLabel = $('#paymentTriggerLabel');
    const paymentSheet = $('#paymentSheet');
    const paymentSheetClose = $('#paymentSheetClose');
    const paymentSheetOptions = $('#paymentSheetOptions');

    const dateTrigger = $('#dateTrigger');
    const dateTriggerLabel = $('#dateTriggerLabel');
    const dateOverlay = $('#dateOverlay');
    const dateModal = $('#dateModal');
    const dateModalClose = $('#dateModalClose');
    const wheelYear = $('#wheelYear');
    const wheelMonth = $('#wheelMonth');
    const wheelDay = $('#wheelDay');
    const dateBtnToday = $('#dateBtnToday');
    const dateBtnConfirm = $('#dateBtnConfirm');

    const toast = $('#toast');
    const loading = $('#loadingOverlay');
    const deleteModal = $('#deleteModal');

    const settingsOverlay = $('#settingsOverlay');
    const settingsPanel = $('#settingsPanel');
    const settingsBackBtn = $('#settingsBackBtn');
    const settingsTabs = $('#settingsTabs');
    const settingsList = $('#settingsList');
    const settingsAddBtn = $('#settingsAddBtn');
    const catAddOverlay = $('#catAddOverlay');
    const catAddModal = $('#catAddModal');
    const catAddClose = $('#catAddClose');
    const catAddName = $('#catAddName');
    const catAddConfirm = $('#catAddConfirm');
    const catIconGrid = $('#catIconGrid');
    const catEditOverlay = $('#catEditOverlay');
    const catEditModal = $('#catEditModal');
    const catEditClose = $('#catEditClose');
    const catEditName = $('#catEditName');
    const catEditConfirm = $('#catEditConfirm');
    const catEditIconGrid = $('#catEditIconGrid');

    
    const partnerEntry = $('#partnerEntry');
    const partnerStatusText = $('#partnerStatusText');
    const partnerStatusArrow = $('#partnerStatusArrow');

    let settingsCurrentType = 'expense';
    let editingCategoryId = null;
    let editingCategoryType = null;
    let selectedAddIcon = 'fa-tag';
    let selectedEditIcon = 'fa-tag';


const CATEGORY_ICON_MAP = {
    '餐饮': [
        'fa-utensils', 'fa-mug-saucer', 'fa-pizza-slice', 'fa-wine-glass',
        'fa-ice-cream', 'fa-bread-slice', 'fa-cake-candles', 'fa-apple-alt',
        'fa-wine-bottle', 'fa-coffee', 'fa-cookie', 'fa-hamburger',
        'fa-hotdog', 'fa-fish', 'fa-egg', 'fa-cheese',
        'fa-bowl-food', 'fa-kitchen-set', 'fa-spoon',
        'fa-bottle-water', 'fa-whiskey-glass', 'fa-martini-glass-citrus',
        'fa-martini-glass', 'fa-glass-water', 'fa-wheat-awn', 'fa-seedling'
    ],
    '购物': [
        'fa-bag-shopping', 'fa-cart-shopping', 'fa-gift', 'fa-tag',
        'fa-store', 'fa-basket-shopping', 'fa-sack-dollar', 'fa-receipt',
        'fa-credit-card', 'fa-shop', 'fa-cart-plus', 'fa-tags',
        'fa-suitcase', 'fa-cash-register', 'fa-store-alt'
    ],
    '数码': [
        'fa-laptop', 'fa-mobile-screen-button', 'fa-tablet-screen-button',
        'fa-headphones', 'fa-camera', 'fa-tv', 'fa-gamepad', 'fa-microchip',
        'fa-computer', 'fa-keyboard', 'fa-mouse', 'fa-hard-drive', 'fa-memory',
        'fa-server', 'fa-database', 'fa-sd-card', 'fa-sim-card',
        'fa-robot', 'fa-vr-cardboard', 'fa-charging-station'
    ],
    '交通': [
        'fa-car', 'fa-bus', 'fa-train', 'fa-plane', 'fa-bicycle',
        'fa-motorcycle', 'fa-ship', 'fa-taxi', 'fa-rocket', 'fa-helicopter',
        'fa-subway', 'fa-tram', 'fa-truck', 'fa-van-shuttle', 'fa-cable-car',
        'fa-horse', 'fa-ferry', 'fa-person-walking', 'fa-person-running'
    ],
    '生活': [
        'fa-house', 'fa-lightbulb', 'fa-water', 'fa-fire', 'fa-snowflake',
        'fa-fan', 'fa-wifi', 'fa-phone', 'fa-faucet', 'fa-bolt', 'fa-sun',
        'fa-cloud-sun', 'fa-snowplow', 'fa-shield-halved',
        'fa-broom', 'fa-spray-can', 'fa-soap', 'fa-shower',
        'fa-bath', 'fa-toilet', 'fa-sink',
        'fa-key', 'fa-lock', 'fa-door-open', 'fa-window-maximize',
        'fa-plug'
    ],
    '健康': [
        'fa-heart-pulse', 'fa-dumbbell', 'fa-bed-pulse', 'fa-capsules',
        'fa-tooth', 'fa-eye', 'fa-heart-circle-check', 'fa-bone',
        'fa-brain', 'fa-lungs', 'fa-heart', 'fa-stethoscope',
        'fa-syringe', 'fa-pills', 'fa-bandage', 'fa-first-aid',
        'fa-ambulance', 'fa-hospital', 'fa-clinic-medical', 'fa-teeth',
        'fa-teeth-open', 'fa-ear-deaf', 'fa-ear-listen', 'fa-hand-holding-heart',
        'fa-heart-circle-plus', 'fa-heart-circle-exclamation'
    ],
    '娱乐': [
        'fa-film', 'fa-music', 'fa-crown', 'fa-trophy', 'fa-dice',
        'fa-guitar', 'fa-mask', 'fa-umbrella-beach', 'fa-clapperboard',
        'fa-theater-masks', 'fa-dragon', 'fa-robot', 'fa-wand-sparkles',
        'fa-gamepad', 'fa-chess', 'fa-chess-queen', 'fa-chess-king',
        'fa-chess-bishop', 'fa-chess-knight', 'fa-dice-d6', 'fa-dice-d20',
        'fa-drum', 'fa-microphone', 'fa-ticket', 'fa-masks-theater'
    ],
    '宠物': [
        'fa-paw', 'fa-cat', 'fa-dog', 'fa-fish', 'fa-bone', 'fa-seedling',
        'fa-horse', 'fa-crow', 'fa-dove', 'fa-spider', 'fa-bug'
    ],
    '学习': [
        'fa-book', 'fa-graduation-cap', 'fa-pen', 'fa-chalkboard-user',
        'fa-scroll', 'fa-school', 'fa-user-graduate', 'fa-atom',
        'fa-flask', 'fa-microscope', 'fa-book-open',
        'fa-book-reader', 'fa-bookmark', 'fa-pen-fancy',
        'fa-pen-nib', 'fa-feather', 'fa-feather-pointed', 'fa-ruler',
        'fa-ruler-combined', 'fa-compass-drafting', 'fa-globe',
        'fa-globe-asia', 'fa-globe-americas', 'fa-globe-europe',
        'fa-map', 'fa-map-location-dot', 'fa-calculator',
        'fa-puzzle-piece'
    ],
    '财务': [
        'fa-money-bill-wave', 'fa-coins', 'fa-chart-line',
        'fa-piggy-bank', 'fa-sack-dollar', 'fa-hand-holding-dollar',
        'fa-file-invoice-dollar', 'fa-calculator', 'fa-file-invoice',
        'fa-percent', 'fa-scale-balanced',
        'fa-money-bill', 'fa-money-bill-1', 'fa-money-bill-1-wave',
        'fa-bank', 'fa-building-columns', 'fa-credit-card',
        'fa-wallet', 'fa-cash-register',
        'fa-circle-arrow-up', 'fa-circle-arrow-down', 'fa-arrow-trend-up',
        'fa-arrow-trend-down', 'fa-file-lines', 'fa-file-pdf', 'fa-file-excel'
    ],
    '服饰': [
        'fa-shirt', 'fa-shoe-prints', 'fa-hat-cowboy', 'fa-glasses',
        'fa-ring', 'fa-bag-shopping', 'fa-vest', 'fa-socks',
        'fa-crown', 'fa-gem', 'fa-hat-cowboy-side', 'fa-scroll', 'fa-ribbon'
    ],
    '家居': [
        'fa-couch', 'fa-chair', 'fa-bed', 'fa-tools', 'fa-wrench',
        'fa-plug', 'fa-key', 'fa-door-open', 'fa-window-maximize', 'fa-broom',
        'fa-table', 'fa-paint-roller', 'fa-hammer', 'fa-screwdriver',
        'fa-bucket', 'fa-paintbrush', 'fa-palette',
        'fa-clock', 'fa-calendar', 'fa-draw-polygon'
    ],
    '运动': [
        'fa-futbol', 'fa-basketball', 'fa-volleyball', 'fa-running',
        'fa-walking', 'fa-swimmer', 'fa-bicycle', 'fa-medal',
        'fa-skating', 'fa-skiing', 'fa-dumbbell',
        'fa-baseball', 'fa-baseball-bat-ball', 'fa-golf-ball-tee',
        'fa-table-tennis-paddle-ball', 'fa-hockey-puck',
        'fa-football', 'fa-mountain'
    ],
    '美容': [
        'fa-spa', 'fa-paintbrush', 'fa-scissors', 'fa-mask-face',
        'fa-soap', 'fa-shower', 'fa-gem',
        'fa-eye-dropper', 'fa-bath', 'fa-hand-sparkles'
    ],
    '社交': [
        'fa-champagne-glasses', 'fa-gift', 'fa-handshake', 'fa-people-group',
        'fa-star', 'fa-comments', 'fa-user-plus',
        'fa-people-arrows', 'fa-people-carry-box', 'fa-handshake-simple',
        'fa-handshake-angle', 'fa-user-group',
        'fa-user-minus', 'fa-user-check', 'fa-user-xmark',
        'fa-address-book', 'fa-address-card', 'fa-contact-book', 'fa-circle-user'
    ],
    '旅行': [
        'fa-suitcase-rolling', 'fa-passport', 'fa-camera', 'fa-map',
        'fa-compass', 'fa-umbrella-beach', 'fa-ship', 'fa-plane',
        'fa-hiking', 'fa-mountain-sun', 'fa-tent',
        'fa-bag-shopping', 'fa-binoculars',
        'fa-flag', 'fa-flag-usa', 'fa-globe', 'fa-road',
        'fa-satellite', 'fa-satellite-dish', 'fa-fish', 'fa-water',
        'fa-tree', 'fa-mountain'
    ]
};
const CATEGORY_TITLES = ['餐饮', '购物', '数码', '交通', '生活', '健康', '娱乐', '宠物', '学习', '财务', '服饰', '家居', '运动', '美容', '社交', '旅行'];

    
    const DEFAULT_CATEGORIES = {
        expense: [
            { id: 'def_e_0', label: '餐饮', icon: 'fa-utensils', isDefault: true },
            { id: 'def_e_1', label: '购物', icon: 'fa-bag-shopping', isDefault: true },
            { id: 'def_e_2', label: '数码', icon: 'fa-laptop', isDefault: true },
            { id: 'def_e_3', label: '交通', icon: 'fa-car', isDefault: true },
            { id: 'def_e_4', label: '生活', icon: 'fa-house', isDefault: true },
            { id: 'def_e_5', label: '健康', icon: 'fa-heart-pulse', isDefault: true },
            { id: 'def_e_6', label: '娱乐', icon: 'fa-film', isDefault: true },
            { id: 'def_e_7', label: '宠物', icon: 'fa-paw', isDefault: true },
            { id: 'def_e_8', label: '学习', icon: 'fa-book', isDefault: true },
            { id: 'def_e_9', label: '财务', icon: 'fa-money-bill-wave', isDefault: true },
            { id: 'def_e_10', label: '服饰', icon: 'fa-shirt', isDefault: true },
            { id: 'def_e_11', label: '家居', icon: 'fa-couch', isDefault: true },
            { id: 'def_e_12', label: '运动', icon: 'fa-futbol', isDefault: true },
            { id: 'def_e_13', label: '美容', icon: 'fa-spa', isDefault: true },
            { id: 'def_e_14', label: '社交', icon: 'fa-champagne-glasses', isDefault: true },
            { id: 'def_e_15', label: '旅行', icon: 'fa-suitcase-rolling', isDefault: true }
        ],
        income: [
            { id: 'def_i_0', label: '工资', icon: 'fa-money-bill-wave', isDefault: true },
            { id: 'def_i_1', label: '兼职', icon: 'fa-briefcase', isDefault: true },
            { id: 'def_i_2', label: '奖金', icon: 'fa-trophy', isDefault: true },
            { id: 'def_i_3', label: '理财', icon: 'fa-chart-line', isDefault: true },
            { id: 'def_i_4', label: '红包', icon: 'fa-gift', isDefault: true },
            { id: 'def_i_5', label: '报销', icon: 'fa-receipt', isDefault: true },
            { id: 'def_i_6', label: '退款', icon: 'fa-rotate-left', isDefault: true },
            { id: 'def_i_7', label: '其他', icon: 'fa-coins', isDefault: true }
        ]
    };
    
  
function updateBillsSummaryLabels() {
    const nav = document.getElementById('billsSummaryNav');
    if (!nav) return;
    
    const btns = nav.querySelectorAll('.bills-summary-btn');
    const expenseBtn = btns[0];
    const incomeBtn = btns[1];
    
    let label = '';
    switch (billsViewType) {
        case 'week': label = '本周'; break;
        case 'month': label = '本月'; break;
        case 'year': label = '本年'; break;
        default: label = '本月';
    }
    
    if (expenseBtn) expenseBtn.textContent = label + '支出';
    if (incomeBtn) incomeBtn.textContent = label + '收入';
}
 

let tempSelectedYear = new Date().getFullYear();

function renderYearPicker() {
    const wheelYearOnly = document.getElementById('wheelYearOnly');
    if (!wheelYearOnly) return;
    const yearValues = generateWheelItems(YEAR_MIN, YEAR_MAX, false);
    renderWheel(wheelYearOnly, yearValues, tempSelectedYear, (newYear) => {
        tempSelectedYear = parseInt(newYear, 10);
    });
}


function syncYearPickerValue() {
    const wheelYearOnly = document.getElementById('wheelYearOnly');
    if (!wheelYearOnly) return tempSelectedYear;
    const wy = getWheelValue(wheelYearOnly);
    if (wy) {
        tempSelectedYear = parseInt(wy, 10);
    }
    return tempSelectedYear;
}

function openYearPicker() {
    
    if (document.getElementById('weekModal')?.classList.contains('show')) closeWeekPicker();
    if (document.getElementById('monthModal')?.classList.contains('show')) closeMonthPicker();

    
    if (yearPickerContext !== 'annual') {
        tempSelectedYear = billsViewDate.getFullYear();
    }
    renderYearPicker();

    document.getElementById('yearModal').classList.add('show');
    document.getElementById('yearOverlay').classList.add('show');
}

function closeYearPicker() {
    document.getElementById('yearModal').classList.remove('show');
    document.getElementById('yearOverlay').classList.remove('show');
}

function confirmYear() {
    
    syncYearPickerValue();
    if (yearPickerContext === 'annual') {
        
        annualState.year = tempSelectedYear;
        closeYearPicker();
        renderAnnualPage();
        yearPickerContext = 'bills';
        return;
    }
    
    billsViewDate = new Date(tempSelectedYear, 0, 1);
    billsSelectedDate = new Date(tempSelectedYear, 0, 1);
    renderBills();
    closeYearPicker();
}

function goToCurrentYear() {
    const today = new Date();
    tempSelectedYear = today.getFullYear();
    if (yearPickerContext === 'annual') {
        annualState.year = tempSelectedYear;
        closeYearPicker();
        renderAnnualPage();
        yearPickerContext = 'bills';
        return;
    }
    billsViewDate = new Date(tempSelectedYear, 0, 1);
    billsSelectedDate = new Date(tempSelectedYear, 0, 1);
    renderBills();
    closeYearPicker();
}


function initYearPickerEvents() {
    const yearOverlay = document.getElementById('yearOverlay');
    const yearModalClose = document.getElementById('yearModalClose');
    const yearBtnToday = document.getElementById('yearBtnToday');
    const yearBtnConfirm = document.getElementById('yearBtnConfirm');

    if (yearModalClose) {
        yearModalClose.addEventListener('click', closeYearPicker);
    }
    if (yearOverlay) {
        yearOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeYearPicker();
        });
    }
    if (yearBtnToday) {
        yearBtnToday.addEventListener('click', goToCurrentYear);
    }
    if (yearBtnConfirm) {
        yearBtnConfirm.addEventListener('click', confirmYear);
    }

    
    document.addEventListener('click', function(e) {
        if (!document.getElementById('yearModal')?.classList.contains('show')) return;
        const modal = document.getElementById('yearModal');
        
        const triggerId = yearPickerContext === 'annual' ? 'annualDateBtn' : 'billsDateBtn';
        const trigger = document.getElementById(triggerId);
        if (!modal.contains(e.target) && !trigger?.contains(e.target)) {
            closeYearPicker();
        }
    });
}    

function getWeekStartForPicker(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d;
}

function getWeekEndForPicker(date) {
    const start = getWeekStartForPicker(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
}

function renderWeekPicker() {
    const year = weekPickerDate.getFullYear();
    const month = weekPickerDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    const prevMonthDays = new Date(year, month, 0).getDate();

    const titleEl = document.getElementById('weekPickerTitle');
    if (titleEl) titleEl.textContent = year + '年' + (month + 1) + '月';

    
    const selectedStart = tempWeekDate ? getWeekStartForPicker(tempWeekDate) : getWeekStartForPicker(new Date());
    const selectedEnd = getWeekEndForPicker(selectedStart);

    
    const today = new Date();
    const todayStart = getWeekStartForPicker(today);

    let html = '';
    
    
    const totalCells = 35;
    
    
    const startDate = new Date(year, month, 1);
    startDate.setDate(1 - firstDayAdjusted); 
    
    
    for (let i = 0; i < totalCells; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        
        const day = d.getDate();
        const dYear = d.getFullYear();
        const dMonth = d.getMonth();
        const isOtherMonth = (dMonth !== month || dYear !== year);
        const isInSelectedWeek = d >= selectedStart && d <= selectedEnd;
        const isToday = isSameDay(d, today);
        
        let classes = 'week-day-item';
        if (isOtherMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (isInSelectedWeek) {
            classes += ' in-week';
            if (isSameDay(d, selectedStart)) classes += ' first-day';
            if (isSameDay(d, selectedEnd)) classes += ' last-day';
        }
        
        html += `<button class="${classes}" data-year="${dYear}" data-month="${dMonth}" data-day="${day}">${isToday ? '今' : day}</button>`;
    }

    const grid = document.getElementById('weekDaysGrid');
    if (grid) grid.innerHTML = html;

    
    document.querySelectorAll('#weekDaysGrid .week-day-item').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const year = parseInt(this.dataset.year);
            const month = parseInt(this.dataset.month);
            const day = parseInt(this.dataset.day);
            const clickedDate = new Date(year, month, day);
            
            tempWeekDate = new Date(clickedDate);
            
            renderWeekPicker();
        });
    });
}

function openWeekPicker() {
    
    if (document.getElementById('paymentSheet')?.classList.contains('show')) closePaymentSheet();
    if (document.getElementById('noteModal')?.classList.contains('show')) closeNoteModal();
    if (document.getElementById('dateModal')?.classList.contains('show')) closeDatePicker();
    if (document.getElementById('monthModal')?.classList.contains('show')) closeMonthPicker();

    
    if (!tempWeekDate) {
        tempWeekDate = new Date(billsViewDate || new Date());
    }
    
    tempWeekDate = getWeekStartForPicker(tempWeekDate);
    weekPickerDate = new Date(tempWeekDate);
    
    
    
    
    renderWeekPicker();

    const overlay = document.getElementById('weekOverlay');
    const modal = document.getElementById('weekModal');
    if (overlay) overlay.classList.add('show');
    if (modal) modal.classList.add('show');
}

function closeWeekPicker() {
    const overlay = document.getElementById('weekOverlay');
    const modal = document.getElementById('weekModal');
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
}

function confirmWeek() {
    
    const start = getWeekStartForPicker(tempWeekDate);
    billsViewDate = new Date(start);
    billsSelectedDate = new Date(start);
    renderBills();
    closeWeekPicker();
}

function goToCurrentWeek() {
    const today = new Date();
    const start = getWeekStartForPicker(today);
    tempWeekDate = new Date(start);
    weekPickerDate = new Date(start);
    billsViewDate = new Date(start);
    billsSelectedDate = new Date(start);
    renderBills();
    closeWeekPicker();
}


function initWeekPickerEvents() {
    const weekOverlay = document.getElementById('weekOverlay');
    const weekModalClose = document.getElementById('weekModalClose');
    const weekBtnToday = document.getElementById('weekBtnToday');
    const weekBtnConfirm = document.getElementById('weekBtnConfirm');
    const weekPrevMonth = document.getElementById('weekPrevMonth');
    const weekNextMonth = document.getElementById('weekNextMonth');

    
    if (weekModalClose) {
        const newClose = weekModalClose.cloneNode(true);
        weekModalClose.parentNode.replaceChild(newClose, weekModalClose);
        newClose.addEventListener('click', closeWeekPicker);
    }
    
    if (weekOverlay) {
        const newOverlay = weekOverlay.cloneNode(true);
        weekOverlay.parentNode.replaceChild(newOverlay, weekOverlay);
        newOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeWeekPicker();
        });
    }
    
    if (weekBtnToday) {
        const newToday = weekBtnToday.cloneNode(true);
        weekBtnToday.parentNode.replaceChild(newToday, weekBtnToday);
        newToday.addEventListener('click', goToCurrentWeek);
    }
    
    if (weekBtnConfirm) {
        const newConfirm = weekBtnConfirm.cloneNode(true);
        weekBtnConfirm.parentNode.replaceChild(newConfirm, weekBtnConfirm);
        newConfirm.addEventListener('click', confirmWeek);
    }
    
    if (weekPrevMonth) {
        const newPrev = weekPrevMonth.cloneNode(true);
        weekPrevMonth.parentNode.replaceChild(newPrev, weekPrevMonth);
        newPrev.addEventListener('click', function() {
            
            const currentMonth = weekPickerDate.getMonth();
            const currentYear = weekPickerDate.getFullYear();
            
            const firstOfMonth = new Date(currentYear, currentMonth - 1, 1);
            weekPickerDate = getWeekStartForPicker(firstOfMonth);
            
            weekPickerDate = new Date(currentYear, currentMonth - 1, 1);
            renderWeekPicker();
        });
    }
    
    if (weekNextMonth) {
        const newNext = weekNextMonth.cloneNode(true);
        weekNextMonth.parentNode.replaceChild(newNext, weekNextMonth);
        newNext.addEventListener('click', function() {
            
            const currentMonth = weekPickerDate.getMonth();
            const currentYear = weekPickerDate.getFullYear();
            weekPickerDate = new Date(currentYear, currentMonth + 1, 1);
            renderWeekPicker();
        });
    }
}
 
function updateBillsDateLabel() {
    const label = document.getElementById('billsDateLabel');
    if (!label) return;
    
    const year = billsViewDate.getFullYear();
    const month = billsViewDate.getMonth() + 1;
    const day = billsViewDate.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[billsViewDate.getDay()];
    
    if (billsViewType === 'week') {
        
        const start = getWeekStart(billsViewDate);
        const end = getWeekEnd(billsViewDate);
        const startMonth = start.getMonth() + 1;
        const endMonth = end.getMonth() + 1;
        if (startMonth === endMonth) {
            label.textContent = `${start.getFullYear()}年${startMonth}月${start.getDate()}日-${end.getDate()}日`;
        } else {
            label.textContent = `${start.getFullYear()}年${startMonth}月${start.getDate()}日-${endMonth}月${end.getDate()}日`;
        }
    } else if (billsViewType === 'month') {
        label.textContent = `${year}年${month}月`;
    } else if (billsViewType === 'year') {
        label.textContent = `${year}年`;
    }
}

function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d;
}

function getWeekEnd(date) {
    const d = getWeekStart(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}


function getFilteredBillsForBills() {
    let filtered = [...allBills];
    
    
    if (billsTypeFilter === 'expense') {
        filtered = filtered.filter(b => b.type === 'expense');
    } else if (billsTypeFilter === 'income') {
        filtered = filtered.filter(b => b.type === 'income');
    }
    
    
    if (billsBelongFilter !== 'all') {
        filtered = filtered.filter(b => getDisplayBelong(b) === billsBelongFilter);
    }
    
    return filtered;
}


function getBillsForMonth(year, month) {
    const filtered = getFilteredBillsForBills();
    return filtered.filter(b => {
        const d = new Date(b.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}


function getBillsForDay(year, month, day) {
    const filtered = getFilteredBillsForBills();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filtered.filter(b => b.date === dateStr);
}


function updateBillsStats() {
    
    const isExpense = billsTypeFilter === 'expense';
    const typeLabel = isExpense ? '支出' : '收入';
    
    
    const viewDate = billsViewDate;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    
    let allFiltered = [...allBills];
    
    
    if (billsTypeFilter === 'expense') {
        allFiltered = allFiltered.filter(b => b.type === 'expense');
    } else if (billsTypeFilter === 'income') {
        allFiltered = allFiltered.filter(b => b.type === 'income');
    }
    
    
    if (billsBelongFilter !== 'all') {
        allFiltered = allFiltered.filter(b => getDisplayBelong(b) === billsBelongFilter);
    }
    
    
    const totalLabelEl = document.querySelector('.bills-stat-card:first-child .bills-stat-label');
    const totalValueEl = document.getElementById('billsTotalExpense');
    const dailyLabelEl = document.querySelector('.bills-stat-card:last-child .bills-stat-label');
    const dailyValueEl = document.getElementById('billsDailyExpense');
    
    let totalLabel = '';
    let dailyLabel = '';
    let total = 0;
    let daily = 0;
    let activeDays = 0;
    
    
    let filteredBills = [];
    
    switch (billsViewType) {
        case 'week': {
            const start = getWeekStart(viewDate);
            const end = getWeekEnd(viewDate);
            filteredBills = allFiltered.filter(b => {
                const d = new Date(b.date);
                return d >= start && d <= end;
            });
            total = filteredBills.reduce((sum, b) => sum + b.amount, 0);
            
            const dateSet = new Set();
            filteredBills.forEach(b => dateSet.add(b.date));
            activeDays = dateSet.size;
            totalLabel = '周总' + typeLabel;
            dailyLabel = '日均' + typeLabel;
            break;
        }
        case 'month': {
            filteredBills = allFiltered.filter(b => {
                const d = new Date(b.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
            total = filteredBills.reduce((sum, b) => sum + b.amount, 0);
            const dateSet = new Set();
            filteredBills.forEach(b => dateSet.add(b.date));
            activeDays = dateSet.size;
            totalLabel = '月总' + typeLabel;
            dailyLabel = '日均' + typeLabel;
            break;
        }
        case 'year': {
            filteredBills = allFiltered.filter(b => {
                const d = new Date(b.date);
                return d.getFullYear() === year;
            });
            total = filteredBills.reduce((sum, b) => sum + b.amount, 0);
            
            const monthSet = new Set();
            filteredBills.forEach(b => {
                const d = new Date(b.date);
                monthSet.add(d.getFullYear() + '-' + d.getMonth());
            });
            activeDays = monthSet.size;
            totalLabel = '年总' + typeLabel;
            dailyLabel = '月均' + typeLabel;
            break;
        }
        default: {
            filteredBills = allFiltered.filter(b => {
                const d = new Date(b.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
            total = filteredBills.reduce((sum, b) => sum + b.amount, 0);
            const dateSet = new Set();
            filteredBills.forEach(b => dateSet.add(b.date));
            activeDays = dateSet.size;
            totalLabel = '月总' + typeLabel;
            dailyLabel = '日均' + typeLabel;
        }
    }
    
    
    daily = activeDays > 0 ? total / activeDays : 0;
    
    
    if (totalLabelEl) totalLabelEl.textContent = totalLabel;
    if (dailyLabelEl) dailyLabelEl.textContent = dailyLabel;
    
    
    if (totalValueEl) {
        totalValueEl.textContent = `¥${total.toFixed(2)}`;
        totalValueEl.className = 'bills-stat-value ' + (isExpense ? 'expense' : 'income');
    }
    if (dailyValueEl) {
        dailyValueEl.textContent = `¥${daily.toFixed(2)}`;
        dailyValueEl.className = 'bills-stat-value ' + (isExpense ? 'expense' : 'income');
    }
    
    
    updateBillsSummaryLabels();
}
function renderBillItemSimple(b) {
    const cats = getCategoriesByType(b.type);
    const cat = cats.find(c => c.label === b.category);
    const icon = cat ? cat.icon : 'fa-tag';

    const typeClass = b.type === 'income' ? 'income' : 'expense';
    const sign = b.type === 'income' ? '+' : '-';

    const displayText = b.note && b.note.trim() ? b.note.trim() : b.category;

    
    const belongDisplay = getDisplayBelongName(b);
    const isHelp = isHelpBill(b);

    return `
        <div class="bill-item-static" data-id="${b.id}">
            <div class="bill-item-content">
                <div class="bill-left">
                    <div class="bill-icon ${typeClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="bill-info">
                        <div class="bill-category">${escapeHtml(displayText)}</div>
                        <div class="bill-note">
                            <span></span>
                            <span class="belong-tag">${belongDisplay}</span>${isHelp ? '<span class="belong-tag help-tag">帮记</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="bill-amount ${typeClass}">${sign}¥${b.amount.toFixed(2)}</div>
            </div>
        </div>
    `;
}
function renderMonthView() {
    const year = billsViewDate.getFullYear();
    const month = billsViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    
    const container = document.getElementById('calendarDays');
    if (!container) return;
    
    
    const monthBills = getBillsForMonth(year, month);
    
    
    const dayData = {};
    monthBills.forEach(b => {
        const d = new Date(b.date);
        const key = d.getDate();
        if (!dayData[key]) {
            dayData[key] = { expense: 0, income: 0, hasExpense: false, hasIncome: false };
        }
        if (b.type === 'expense') {
            dayData[key].expense += b.amount;
            dayData[key].hasExpense = true;
        } else {
            dayData[key].income += b.amount;
            dayData[key].hasIncome = true;
        }
    });
    
    
    const totalDays = 35;
    let html = '';
    let dayCounter = 0;
    
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevMonthStart = firstDay;
    for (let i = prevMonthStart - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const isToday = (year === today.getFullYear() && month - 1 === today.getMonth() && day === today.getDate());
        
        const isSelected = (year === billsSelectedDate.getFullYear() && 
                           month - 1 === billsSelectedDate.getMonth() && 
                           day === billsSelectedDate.getDate());
        html += `
            <button class="bills-calendar-day other-month ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                    data-year="${year}" data-month="${month - 1}" data-day="${day}">
                <span class="day-number">${isToday ? '今' : day}</span>
            </button>
        `;
        dayCounter++;
    }
    
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
        const isSelected = (year === billsSelectedDate.getFullYear() && 
                           month === billsSelectedDate.getMonth() && 
                           day === billsSelectedDate.getDate());
        const data = dayData[day];
        
        let amountDisplay = '';
        if (data) {
            const parts = [];
            if (data.expense > 0) parts.push(`-${data.expense.toFixed(2)}`);
            if (data.income > 0) parts.push(`+${data.income.toFixed(2)}`);
            amountDisplay = parts.join(' ');
        }
        
        html += `
            <button class="bills-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                    data-year="${year}" data-month="${month}" data-day="${day}"
                    data-expense="${data ? data.expense : 0}" 
                    data-income="${data ? data.income : 0}">
                <span class="day-number">${isToday ? '今' : day}</span>
                ${amountDisplay ? `<span class="day-amount">${amountDisplay}</span>` : ''}
            </button>
        `;
        dayCounter++;
    }
    
    // 下个月补充（补满35天）
    let nextMonthDay = 1;
    while (dayCounter < totalDays) {
        const isToday = (year === today.getFullYear() && month + 1 === today.getMonth() && nextMonthDay === today.getDate());
        // ===== 新增：判断非本月日期是否被选中 =====
        const isSelected = (year === billsSelectedDate.getFullYear() && 
                           month + 1 === billsSelectedDate.getMonth() && 
                           nextMonthDay === billsSelectedDate.getDate());
        html += `
            <button class="bills-calendar-day other-month ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                    data-year="${year}" data-month="${month + 1}" data-day="${nextMonthDay}">
                <span class="day-number">${isToday ? '今' : nextMonthDay}</span>
            </button>
        `;
        nextMonthDay++;
        dayCounter++;
    }
    
    container.innerHTML = html;
    
    // ===== 绑定点击事件 - 支持非本月日期激活 =====
    container.querySelectorAll('.bills-calendar-day').forEach(btn => {
        btn.addEventListener('click', function() {
            const year = parseInt(this.dataset.year);
            const month = parseInt(this.dataset.month);
            const day = parseInt(this.dataset.day);
            
            // 选中日期
            billsSelectedDate = new Date(year, month, day);
            
            // 重新渲染月视图（更新高亮）
            renderMonthView();
            
            // 显示当天的账单（无论是否本月）
            renderDayBills(year, month, day);
        });
    });
    
    // 默认选中当前日期或之前选中的日期
    const defaultDate = billsSelectedDate || new Date();
    const defaultYear = defaultDate.getFullYear();
    const defaultMonth = defaultDate.getMonth();
    const defaultDay = defaultDate.getDate();
    
    // 如果选中的日期在当前月，高亮并显示账单
    if (defaultYear === year && defaultMonth === month) {
        renderDayBills(defaultYear, defaultMonth, defaultDay);
    } else {
        // 否则选中今天
        const todayDate = new Date();
        billsSelectedDate = new Date(todayDate);
        renderDayBills(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    }
}

// ===== 渲染某天的账单列表 =====
function renderDayBills(year, month, day) {
    const container = document.getElementById('calendarBillsList');
    if (!container) return;
    
    const bills = getBillsForDay(year, month, day);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateObj = new Date(year, month, day);
    const weekday = weekdays[dateObj.getDay()];
    
    const total = calcSummary(bills);
    
    // 只保留日期标题，移除统计信息
    const hasBills = bills.length > 0;
    
    let html = `
        <div class="bills-list-card">
            <div class="bills-list-title">
                <span class="home-date-label">${year}年${month+1}月${day}日 周${weekday}</span>
            </div>
    `;
    
    if (!hasBills) {
html += `
    <div class="bills-list-empty">
        <div class="empty-icon"><i class="ri-inbox-line"></i></div>
        <div class="empty-text">当天没有账单记录</div>
    </div>
`;
    } else {
        const sorted = [...bills].sort((a, b) => b.id - a.id);
        html += `<div class="bills-day-list">`;
        sorted.forEach(b => {
            html += renderBillItemSimple(b);
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    bindActionButtons(container);
    
}


// ===== 修改 renderWeekDayBills =====
function renderWeekDayBills(year, month, day) {
    const container = document.getElementById('weekBillsList');
    if (!container) return;
    
    const bills = getBillsForDay(year, month, day);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateObj = new Date(year, month, day);
    const weekday = weekdays[dateObj.getDay()];
    const total = calcSummary(bills);
    
    // 只保留日期标题，移除统计信息
    const hasBills = bills.length > 0;
    
    let html = `
        <div class="bills-list-card">
            <div class="bills-list-title">
                <span class="home-date-label">${year}年${month+1}月${day}日 周${weekday}</span>
            </div>
    `;
    
    if (!hasBills) {
html += `
    <div class="bills-list-empty">
        <div class="empty-icon"><i class="ri-inbox-line"></i></div>
        <div class="empty-text">当天没有账单记录</div>
    </div>
`;
    } else {
        const sorted = [...bills].sort((a, b) => b.id - a.id);
        html += `<div class="bills-day-list">`;
        sorted.forEach(b => {
            html += renderBillItemSimple(b);
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
    bindActionButtons(container);
}

// ===== 渲染周视图 =====
function renderWeekView() {
    const container = document.getElementById('weekGrid');
    if (!container) return;
    
    const start = getWeekStart(billsViewDate);
    const today = new Date();
    
    // 获取这一周的所有账单数据
    const weekData = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dayBills = getBillsForDay(d.getFullYear(), d.getMonth(), d.getDate());
        
        let expense = 0, income = 0;
        dayBills.forEach(b => {
            if (b.type === 'expense') expense += b.amount;
            else income += b.amount;
        });
        
        weekData.push({
            date: d,
            expense: expense,
            income: income,
            hasBills: dayBills.length > 0
        });
    }
    
    // 使用和月视图一样的 bills-calendar-day 类名
    let html = '';
    
    weekData.forEach((item) => {
        const d = item.date;
        const isToday = isSameDay(d, today);
        const isSelected = isSameDay(d, billsSelectedDate);
        const day = d.getDate();
        const month = d.getMonth();
        const year = d.getFullYear();
        
        let amountDisplay = '';
        if (item.hasBills) {
            const parts = [];
            if (item.expense > 0) parts.push(`-${item.expense.toFixed(2)}`);
            if (item.income > 0) parts.push(`+${item.income.toFixed(2)}`);
            amountDisplay = parts.join(' ');
        }
        
        const isOtherMonth = (month !== billsViewDate.getMonth());
        const dayLabel = isToday ? '今' : day;

        // 使用和月视图完全相同的类名和结构
        html += `
            <button class="bills-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isOtherMonth ? 'other-month' : ''}" 
                    data-year="${year}" data-month="${month}" data-day="${day}"
                    data-expense="${item.expense}" 
                    data-income="${item.income}">
                <span class="day-number">${dayLabel}</span>
                ${amountDisplay ? `<span class="day-amount">${amountDisplay}</span>` : ''}
            </button>
        `;
    });
    
    container.innerHTML = html;
    
    
    container.querySelectorAll('.bills-calendar-day').forEach(btn => {
        btn.addEventListener('click', function() {
            const year = parseInt(this.dataset.year);
            const month = parseInt(this.dataset.month);
            const day = parseInt(this.dataset.day);
            billsSelectedDate = new Date(year, month, day);
            renderWeekView();
            renderWeekDayBills(year, month, day);
        });
    });
    
    
    const defaultDate = billsSelectedDate || new Date();
    const startDate = getWeekStart(billsViewDate);
    const endDate = getWeekEnd(billsViewDate);
    if (defaultDate >= startDate && defaultDate <= endDate) {
        renderWeekDayBills(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate());
    } else {
        renderWeekDayBills(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    }
}


function renderMonthBillsList(year, month) {
    const container = document.getElementById('calendarBillsList');
    if (!container) return;
    
    
    const bills = getBillsForMonth(year, month);
    
    if (bills.length === 0) {
        container.innerHTML = `
            <div class="bills-list-card">
                <div class="bills-list-empty">
                    <div class="empty-icon"><i class="ri-inbox-line"></i></div>
                    <div class="empty-text">该月没有账单记录</div>
                </div>
            </div>
        `;
        return;
    }
    
    
    const dateGroups = {};
    bills.forEach(b => {
        if (!dateGroups[b.date]) dateGroups[b.date] = [];
        dateGroups[b.date].push(b);
    });
    
    const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
    
    
    let html = '';
    dates.forEach((date, index) => {
        const dayBills = dateGroups[date];
        let dayIncome = 0, dayExpense = 0;
        dayBills.forEach(b => {
            if (b.type === 'income') dayIncome += b.amount;
            else dayExpense += b.amount;
        });
        
        let summaryHtml = '';
        if (dayIncome > 0) {
            summaryHtml += `<span class="income">¥${dayIncome.toFixed(2)}</span>`;
        }
        if (dayExpense > 0) {
            summaryHtml += `<span class="expense">¥${dayExpense.toFixed(2)}</span>`;
        }
        if (dayIncome === 0 && dayExpense === 0) {
            summaryHtml += `<span class="zero">¥0.00</span>`;
        }
        
        
        html += `
            <div class="bills-list-card" style="margin-bottom:12px;">
                <div class="home-date-card" style="border-radius:0;margin-bottom:0;">
                    <div class="home-date-card-header">
                        <span class="home-date-label">${formatDateDisplay(date)}</span>
                        <span class="home-date-summary">${summaryHtml}</span>
                    </div>
                    <div class="home-date-card-body">
                        ${dayBills.map(b => renderBillItemSimple(b)).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    bindActionButtons(container);
}

function renderYearView() {
    const container = document.getElementById('yearGrid');
    if (!container) return;
    
    const year = billsViewDate.getFullYear();
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    
    if (!billsSelectedDate || billsSelectedDate.getFullYear() !== year) {
        billsSelectedDate = new Date(today);
    }
    
    let html = '';
    for (let m = 0; m < 12; m++) {
        const monthBills = getBillsForMonth(year, m);
        const summary = calcSummary(monthBills);
        const isCurrentMonth = (year === currentYear && m === currentMonth);
        const isSelected = (year === billsSelectedDate.getFullYear() && m === billsSelectedDate.getMonth());
        
        let amountHtml = '';
        if (summary.expense > 0 && summary.income > 0) {
            amountHtml = `<span class="expense">–${summary.expense.toFixed(2)}</span> <span class="income">+${summary.income.toFixed(2)}</span>`;
        } else if (summary.expense > 0) {
            amountHtml = `<span class="expense">–${summary.expense.toFixed(2)}</span>`;
        } else if (summary.income > 0) {
            amountHtml = `<span class="income">+${summary.income.toFixed(2)}</span>`;
        }
        
        html += `
            <button class="year-month-item ${isCurrentMonth ? 'current-month' : ''} ${isSelected ? 'selected' : ''}"
                    data-year="${year}" data-month="${m}">
                <div class="month-name">${isCurrentMonth ? '本月' : monthNames[m]}</div>
                <div class="month-total">${amountHtml}</div>
            </button>
        `;
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('.year-month-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const year = parseInt(this.dataset.year);
            const month = parseInt(this.dataset.month);
            billsSelectedDate = new Date(year, month, 1);
            renderYearView();
            renderMonthBillsList(year, month);
        });
    });
    
    
    const defaultYear = billsSelectedDate.getFullYear();
    const defaultMonth = billsSelectedDate.getMonth();
    if (defaultYear === year) {
        renderMonthBillsList(defaultYear, defaultMonth);
    } else {
        const todayDate = new Date();
        billsSelectedDate = new Date(todayDate);
        renderMonthBillsList(todayDate.getFullYear(), todayDate.getMonth());
    }
}




function initBillsEvents() {
    
    let billsViewSwitching = false;
    document.querySelectorAll('.bills-view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            if (view === billsViewType || billsViewSwitching) return;

            const order = ['week', 'month', 'year'];
            const forward = order.indexOf(view) > order.indexOf(billsViewType);

            
            billsSelectedDate = new Date();
            if (view === 'week') {
                billsViewDate = getWeekStart(new Date());
            } else {
                billsViewDate = new Date();
            }

            billsViewType = view;

            
            document.querySelectorAll('.bills-view-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.view === view);
            });
            updateTabIndicatorById('billsViewNav');

            
            const container = document.querySelector('#page-bills .bills-scroll-container');
            if (container) {
                billsViewSwitching = true;
                const outClass = forward ? 'slide-out-left' : 'slide-out-right';
                const inClass = forward ? 'slide-in-right' : 'slide-in-left';

                container.classList.remove('slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
                void container.offsetWidth; 
                container.classList.add(outClass);

                const onOutEnd = () => {
                    container.removeEventListener('animationend', onOutEnd);
                    renderBills();
                    container.classList.remove(outClass);
                    void container.offsetWidth;
                    container.classList.add(inClass);
                    const onInEnd = () => {
                        container.removeEventListener('animationend', onInEnd);
                        container.classList.remove(inClass);
                        billsViewSwitching = false;
                    };
                    container.addEventListener('animationend', onInEnd);
                };
                container.addEventListener('animationend', onOutEnd);
            } else {
                renderBills();
            }
        });
    });
    
    
    const dateBtn = document.getElementById('billsDateBtn');
    if (dateBtn) {
        
        const newDateBtn = dateBtn.cloneNode(true);
        dateBtn.parentNode.replaceChild(newDateBtn, dateBtn);
        
        newDateBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (billsViewType === 'week') {
                
                tempWeekDate = new Date(billsViewDate);
                openWeekPicker();
                
                
                const weekConfirmBtn = document.getElementById('weekBtnConfirm');
                const weekTodayBtn = document.getElementById('weekBtnToday');
                
                
                const originalWeekConfirm = weekConfirmBtn.onclick;
                const originalWeekToday = weekTodayBtn ? weekTodayBtn.onclick : null;
                
                weekConfirmBtn.onclick = function() {
                    const start = getWeekStart(tempWeekDate);
                    billsViewDate = new Date(start);
                    billsSelectedDate = new Date(start);
                    renderBills();
                    closeWeekPicker();
                    
                    weekConfirmBtn.onclick = originalWeekConfirm;
                    if (weekTodayBtn) weekTodayBtn.onclick = originalWeekToday;
                };
                
                if (weekTodayBtn) {
                    weekTodayBtn.onclick = function() {
                        const today = new Date();
                        tempWeekDate = new Date(today);
                        weekPickerDate = new Date(today);
                        renderWeekPicker();
                        const start = getWeekStart(today);
                        billsViewDate = new Date(start);
                        billsSelectedDate = new Date(start);
                        renderBills();
                        closeWeekPicker();
                        
                        weekTodayBtn.onclick = originalWeekToday;
                        weekConfirmBtn.onclick = originalWeekConfirm;
                    };
                }
                
            } else if (billsViewType === 'month') {
                
                tempMonthDate = new Date(billsViewDate);
                renderMonthPicker();

                
                const monthConfirmBtn = document.getElementById('monthBtnConfirm');
                const monthTodayBtn = document.getElementById('monthBtnToday');

                
                const originalMonthConfirm = monthConfirmBtn.onclick;
                const originalMonthToday = monthTodayBtn ? monthTodayBtn.onclick : null;

                monthConfirmBtn.onclick = function() {
                    syncMonthPickerValue();
                    billsViewDate = new Date(tempMonthDate);
                    billsSelectedDate = new Date(tempMonthDate);
                    renderBills();
                    closeMonthPicker();
                    
                    monthConfirmBtn.onclick = originalMonthConfirm;
                    if (monthTodayBtn) monthTodayBtn.onclick = originalMonthToday;
                };

                if (monthTodayBtn) {
                    monthTodayBtn.onclick = function() {
                        const today = new Date();
                        tempMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        renderMonthPicker();
                        billsViewDate = new Date(tempMonthDate);
                        billsSelectedDate = new Date(tempMonthDate);
                        renderBills();
                        closeMonthPicker();
                        
                        monthTodayBtn.onclick = originalMonthToday;
                        monthConfirmBtn.onclick = originalMonthConfirm;
                    };
                }

                openMonthPicker();
                
            } else if (billsViewType === 'year') {
                
                tempSelectedYear = billsViewDate.getFullYear();
                renderYearPicker();

                
                const yearConfirmBtn = document.getElementById('yearBtnConfirm');
                const yearTodayBtn = document.getElementById('yearBtnToday');

                
                const originalYearConfirm = yearConfirmBtn.onclick;
                const originalYearToday = yearTodayBtn ? yearTodayBtn.onclick : null;

                yearConfirmBtn.onclick = function() {
                    syncYearPickerValue();
                    billsViewDate = new Date(tempSelectedYear, 0, 1);
                    billsSelectedDate = new Date(tempSelectedYear, 0, 1);
                    renderBills();
                    closeYearPicker();
                    
                    yearConfirmBtn.onclick = originalYearConfirm;
                    if (yearTodayBtn) yearTodayBtn.onclick = originalYearToday;
                };

                if (yearTodayBtn) {
                    yearTodayBtn.onclick = function() {
                        const today = new Date();
                        tempSelectedYear = today.getFullYear();
                        billsViewDate = new Date(tempSelectedYear, 0, 1);
                        billsSelectedDate = new Date(tempSelectedYear, 0, 1);
                        renderBills();
                        closeYearPicker();
                        
                        yearTodayBtn.onclick = originalYearToday;
                        yearConfirmBtn.onclick = originalYearConfirm;
                    };
                }

                openYearPicker();
            }
        });
    }
    
    
    document.querySelectorAll('.bills-belong-btn').forEach(btn => {
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const belong = this.dataset.belong;
            if (belong === billsBelongFilter) return;
            billsBelongFilter = belong;
            renderBills();
            animateTabContent(document.querySelector('.bills-view-container .view-panel.active') || document.getElementById('billsViewContainer'));
        });
    });
    
    
    document.querySelectorAll('.bills-summary-btn').forEach(btn => {
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const type = this.dataset.type;
            if (type === billsTypeFilter) return;
            billsTypeFilter = type;
            renderBills();
        });
    });
}

function renderMonthPicker() {
    const y = tempMonthDate.getFullYear();
    const m = tempMonthDate.getMonth() + 1;

    const yearValues = generateWheelItems(YEAR_MIN, YEAR_MAX, false);
    const monthValues = generateWheelItems(1, 12, true);

    const wheelMonthYear = document.getElementById('wheelMonthYear');
    const wheelMonthMonth = document.getElementById('wheelMonthMonth');

    
    renderWheel(wheelMonthYear, yearValues, y, (newYear) => {
        const ny = parseInt(newYear, 10);
        const curM = tempMonthDate.getMonth();
        tempMonthDate = new Date(ny, curM, 1);
    });

    
    renderWheel(wheelMonthMonth, monthValues, String(m).padStart(2, '0'), (newMonth) => {
        const nm = parseInt(newMonth, 10) - 1;
        const curY = tempMonthDate.getFullYear();
        tempMonthDate = new Date(curY, nm, 1);
    });
}


function syncMonthPickerValue() {
    const wheelMonthYear = document.getElementById('wheelMonthYear');
    const wheelMonthMonth = document.getElementById('wheelMonthMonth');
    const wy = getWheelValue(wheelMonthYear);
    const wm = getWheelValue(wheelMonthMonth);
    if (wy && wm) {
        tempMonthDate = new Date(parseInt(wy, 10), parseInt(wm, 10) - 1, 1);
    }
    return tempMonthDate;
}

function openMonthPicker() {
    
    if (paymentSheet.classList.contains('show')) closePaymentSheet();
    if (noteModal.classList.contains('show')) closeNoteModal();
    if (dateModal.classList.contains('show')) closeDatePicker();
    if (settingsOverlay.classList.contains('show')) closeSettings();

    
    if (!tempMonthDate) {
        tempMonthDate = new Date(selectedMonthDate || new Date());
    }
    renderMonthPicker();

    monthModal.classList.add('show');
    monthOverlay.classList.add('show');
}

function closeMonthPicker() {
    monthModal.classList.remove('show');
    monthOverlay.classList.remove('show');
}

function confirmMonth() {
    syncMonthPickerValue();
    selectedMonthDate = new Date(tempMonthDate);
    updateMonthLabel();
    closeMonthPicker();
    
    renderHome();
}

function goToCurrentMonth() {
    const today = new Date();
    tempMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    renderMonthPicker();
    confirmMonth();
}

function updateMonthLabel() {
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth() + 1;
    if (summaryDateLabel) {
        summaryDateLabel.innerHTML = `${year}年${month}月 <i class="ri-arrow-right-s-line"></i>`;
    }
}

    
    function genCatId() {
        return 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    function loadCategories() {
        try {
            const raw = localStorage.getItem('categories_data');
            if (raw) {
                const data = JSON.parse(raw);
                if (!data.expense) data.expense = [];
                if (!data.income) data.income = [];
                return data;
            }
        } catch (e) { console.warn('加载类目数据失败，使用默认', e); }
        localStorage.setItem('categories_data', JSON.stringify(DEFAULT_CATEGORIES));
        return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }

    function saveCategories(data) {
        localStorage.setItem('categories_data', JSON.stringify(data));
        syncCategoriesToBackend();
    }

    
    
    let _categorySyncTimer = null;
    function syncCategoriesToBackend() {
        if (!token) return;
        clearTimeout(_categorySyncTimer);
        _categorySyncTimer = setTimeout(async () => {
            try {
                const data = loadCategories();
                await apiCall('/categories', 'PUT', { categories: data });
            } catch (err) {
                console.warn('同步类目到后端失败', err);
            }
        }, 400);
    }

    async function fetchCategoriesFromBackend() {
        if (!token) return null;
        try {
            const data = await apiCall('/categories', 'GET');
            if (data && data.categories) {
                const cats = data.categories;
                if (!cats.expense) cats.expense = [];
                if (!cats.income) cats.income = [];
                localStorage.setItem('categories_data', JSON.stringify(cats));
                return cats;
            }
        } catch (err) {
            console.warn('获取后端类目失败', err);
        }
        return null;
    }

    
    async function refreshCategoriesFromBackend() {
        const cats = await fetchCategoriesFromBackend();
        if (cats) {
            buildCategorySlides();
            
            if (currentCategory) {
                const list = cats[currentType] || [];
                if (!list.find(c => c.label === currentCategory)) {
                    currentCategory = null;
                    setType(currentType, null, false, true);
                } else {
                    const slide = currentType === 'expense' ? slideExpense : slideIncome;
                    highlightCategory(slide, currentCategory);
                }
            }
        }
        return cats;
    }

    function getCategoriesByType(type) {
        const data = loadCategories();
        return data[type] || [];
    }

    function getCategoriesForType(type) {
        const cats = getCategoriesByType(type);
        return cats.map(c => ({ label: c.label, icon: c.icon }));
    }

    function addCategory(type, label, icon) {
        const data = loadCategories();
        if (!data[type]) data[type] = [];
        const newCat = { id: genCatId(), label: label.trim(), icon: icon || 'fa-tag', isDefault: false };
        data[type].push(newCat);
        saveCategories(data);
        return newCat;
    }

    function deleteCategory(type, id) {
        const data = loadCategories();
        if (!data[type]) return false;
        const idx = data[type].findIndex(c => c.id === id);
        if (idx === -1) return false;
        data[type].splice(idx, 1);
        saveCategories(data);
        return true;
    }

    function editCategory(type, id, label, icon) {
        const data = loadCategories();
        if (!data[type]) return false;
        const cat = data[type].find(c => c.id === id);
        if (!cat) return false;
        cat.label = label.trim();
        if (icon) cat.icon = icon;
        saveCategories(data);
        return true;
    }

    function reorderCategories(type, newOrder) {
        const data = loadCategories();
        if (!data[type]) return;
        const ordered = [];
        newOrder.forEach(id => {
            const found = data[type].find(c => c.id === id);
            if (found) ordered.push(found);
        });
        data[type].forEach(c => {
            if (!ordered.find(o => o.id === c.id)) ordered.push(c);
        });
        data[type] = ordered;
        saveCategories(data);
    }

    
    function showToast(msg, duration = 2000) {
        const textEl = $('#toastMessage');
        if (textEl) textEl.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
    }

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('is-hidden');
    if (loading) loading.classList.remove('is-hidden');
}

var _splashClosed = false;
var _splashPending = false;
function closeAppSplash() {
    if (_splashClosed) return;
    if (window.plus && plus.navigator) {
        try { plus.navigator.closeSplashscreen(); } catch(e) {}
        _splashClosed = true;
    } else {
        _splashPending = true;
    }
}

function hideLoading(animate) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('is-hidden');
    if (loading) loading.classList.add('is-hidden');
    
    const dynamicStyle = document.getElementById('flyAnimationStyle');
    if (dynamicStyle) dynamicStyle.remove();
    hideLoading._running = false;
    closeAppSplash();
}

    function formatDate(d) {
        const dt = new Date(d);
        return dt.getFullYear() + '-' +
            String(dt.getMonth() + 1).padStart(2, '0') + '-' +
            String(dt.getDate()).padStart(2, '0');
    }





function parseBackendTime(str) {
    if (!str) return new Date();
    const s = String(str).trim();
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return new Date(s.replace(' ', 'T') + 'Z');
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
}
function formatBeijingTime(str) {
    const date = parseBackendTime(str);
    const bj = new Date(date.getTime() + (date.getTimezoneOffset() + 480) * 60000);
    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    const nowBj = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
    const hm = pad(bj.getHours()) + ':' + pad(bj.getMinutes());
    const sameYear = bj.getFullYear() === nowBj.getFullYear();
    const sameDay = sameYear && bj.getMonth() === nowBj.getMonth() && bj.getDate() === nowBj.getDate();
    if (sameDay) return '今天 ' + hm;
    if (sameYear) return (bj.getMonth() + 1) + '月' + bj.getDate() + '日 ' + hm;
    return bj.getFullYear() + '年' + (bj.getMonth() + 1) + '月' + bj.getDate() + '日 ' + hm;
}

function formatDateDisplay(d) {
    const dt = new Date(d);
    const today = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    if (isSameDay(dt, today)) {
        return '今天 周' + weekdays[dt.getDay()];
    }
    
    const month = dt.getMonth() + 1;
    const day = dt.getDate();  
    return month + '.' + day + ' 周' + weekdays[dt.getDay()];
}
    function getMonthRange() {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);
        return { start, end, year: y, month: m + 1 };
    }

    function getToday() {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    function getMonthBills(bills) {
        const { start, end } = getMonthRange();
        return bills.filter(b => {
            const d = new Date(b.date);
            return d >= start && d <= end;
        });
    }

    function groupBillsByDate(bills) {
        const groups = {};
        bills.forEach(b => {
            if (!groups[b.date]) groups[b.date] = [];
            groups[b.date].push(b);
        });
        const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        return keys.map(k => ({ date: k, bills: groups[k] }));
    }

    function calcSummary(bills) {
        let income = 0,
            expense = 0;
        bills.forEach(b => {
            if (b.type === 'income') income += b.amount;
            else expense += b.amount;
        });
        return { income, expense, balance: income - expense };
    }

    function calcStats(bills) {
        const incomeByCat = {};
        const expenseByCat = {};
        let totalIncome = 0,
            totalExpense = 0;
        bills.forEach(b => {
            if (b.type === 'income') {
                totalIncome += b.amount;
                incomeByCat[b.category] = (incomeByCat[b.category] || 0) + b.amount;
            } else {
                totalExpense += b.amount;
                expenseByCat[b.category] = (expenseByCat[b.category] || 0) + b.amount;
            }
        });
        return { totalIncome, totalExpense, incomeByCat, expenseByCat };
    }

    
    function formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

function formatDateDisplayCN(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return year + '年' + month + '月' + day + '日';
}
    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function isToday(date) {
        return isSameDay(date, new Date());
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    
    const WHEEL_ITEM_HEIGHT = 44;
    const YEAR_MIN = 1970;
    const YEAR_MAX = 2100;

    
    function generateWheelItems(start, end, pad = false) {
        const items = [];
        for (let i = start; i <= end; i++) {
            items.push(pad ? String(i).padStart(2, '0') : String(i));
        }
        return items;
    }

    
    function renderWheel(wheelEl, values, selectedValue, onChange) {
        const items = values.map(v => {
            const selected = String(v) === String(selectedValue);
            return `<div class="wheel-item ${selected ? 'wheel-selected' : ''}" data-value="${v}">${v}</div>`;
        }).join('');
        wheelEl.innerHTML = items;

        
        const index = values.indexOf(String(selectedValue));
        if (index >= 0) {
            wheelEl.scrollTop = index * WHEEL_ITEM_HEIGHT;
        }

        
        let scrollTimer = null;
        wheelEl.onscroll = function() {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const idx = Math.round(wheelEl.scrollTop / WHEEL_ITEM_HEIGHT);
                const clamped = Math.max(0, Math.min(values.length - 1, idx));
                wheelEl.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
                
                wheelEl.querySelectorAll('.wheel-item').forEach((el, i) => {
                    el.classList.toggle('wheel-selected', i === clamped);
                });
                const newValue = values[clamped];
                onChange?.(newValue);
            }, 120);
        };

        
        wheelEl.querySelectorAll('.wheel-item').forEach((el) => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const v = this.dataset.value;
                const idx = values.indexOf(String(v));
                if (idx >= 0) {
                    wheelEl.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
                }
            });
        });
    }

    
    function getWheelValue(wheelEl) {
        const idx = Math.round(wheelEl.scrollTop / WHEEL_ITEM_HEIGHT);
        const items = wheelEl.querySelectorAll('.wheel-item');
        if (items[idx]) return items[idx].dataset.value;
        return null;
    }

    
    function renderDatePicker() {
        const y = tempSelectedDate.getFullYear();
        const m = tempSelectedDate.getMonth() + 1;
        const d = tempSelectedDate.getDate();

        const yearValues = generateWheelItems(YEAR_MIN, YEAR_MAX, false);
        const monthValues = generateWheelItems(1, 12, true);
        let daysInMonth = getDaysInMonth(y, m - 1);
        let dayValues = generateWheelItems(1, daysInMonth, true);

        
        renderWheel(wheelYear, yearValues, y, (newYear) => {
            const ny = parseInt(newYear, 10);
            const curM = tempSelectedDate.getMonth();
            const curD = tempSelectedDate.getDate();
            daysInMonth = getDaysInMonth(ny, curM);
            if (curD > daysInMonth) {
                tempSelectedDate = new Date(ny, curM, daysInMonth);
                
                dayValues = generateWheelItems(1, daysInMonth, true);
                renderWheel(wheelDay, dayValues, String(daysInMonth).padStart(2, '0'), (nd) => {
                    const dm = parseInt(getWheelValue(wheelMonth), 10) - 1;
                    const dy = parseInt(getWheelValue(wheelYear), 10);
                    tempSelectedDate = new Date(dy, dm, parseInt(nd, 10));
                });
            } else {
                tempSelectedDate = new Date(ny, curM, curD);
            }
        });

        
        renderWheel(wheelMonth, monthValues, String(m).padStart(2, '0'), (newMonth) => {
            const nm = parseInt(newMonth, 10) - 1;
            const curY = tempSelectedDate.getFullYear();
            const curD = tempSelectedDate.getDate();
            daysInMonth = getDaysInMonth(curY, nm);
            if (curD > daysInMonth) {
                tempSelectedDate = new Date(curY, nm, daysInMonth);
                dayValues = generateWheelItems(1, daysInMonth, true);
                renderWheel(wheelDay, dayValues, String(daysInMonth).padStart(2, '0'), (nd) => {
                    const dm = parseInt(getWheelValue(wheelMonth), 10) - 1;
                    const dy = parseInt(getWheelValue(wheelYear), 10);
                    tempSelectedDate = new Date(dy, dm, parseInt(nd, 10));
                });
            } else {
                tempSelectedDate = new Date(curY, nm, curD);
            }
        });

        
        renderWheel(wheelDay, dayValues, String(d).padStart(2, '0'), (newDay) => {
            const dm = parseInt(getWheelValue(wheelMonth), 10) - 1;
            const dy = parseInt(getWheelValue(wheelYear), 10);
            tempSelectedDate = new Date(dy, dm, parseInt(newDay, 10));
        });
    }

    function openDatePicker() {
        if (paymentSheet.classList.contains('show')) closePaymentSheet();
        if (noteModal.classList.contains('show')) closeNoteModal();

        tempSelectedDate = new Date(selectedDate);
        viewDate = new Date(selectedDate);
        renderDatePicker();

        dateModal.classList.add('show');
        dateOverlay.classList.add('show');
    }

    function closeDatePicker() {
    const overlay = document.getElementById('dateOverlay');
    const modal = document.getElementById('dateModal');
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
}

    function confirmDate() {
        
        const wy = getWheelValue(wheelYear);
        const wm = getWheelValue(wheelMonth);
        const wd = getWheelValue(wheelDay);
        if (wy && wm && wd) {
            tempSelectedDate = new Date(parseInt(wy, 10), parseInt(wm, 10) - 1, parseInt(wd, 10));
        }
        
        if (!window.__skipConfirmDateUpdate) {
            selectedDate = new Date(tempSelectedDate);
            updateDateTrigger();
        }
        closeDatePicker();
    }

    function updateDateTrigger() {
        dateTriggerLabel.textContent = formatDateStr(selectedDate);
    }

    function goToToday() {
        const today = new Date();
        tempSelectedDate = new Date(today);
        viewDate = new Date(today);
        renderDatePicker();
    }

    
    async function apiCall(endpoint, method = 'GET', body = null) {
        const url = API_BASE + endpoint;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const resp = await fetch(url, opts);
        const data = await resp.json();
        if (!resp.ok) {
            const err = new Error(data.error || '请求失败');
            
            Object.keys(data).forEach(k => {
                if (k !== 'error' && !err.hasOwnProperty(k)) err[k] = data[k];
            });
            throw err;
        }
        return data;
    }

    
async function fetchPartnerStatus() {
    try {
        const data = await apiCall('/match/status', 'GET');
        currentPartner = data.partner || null;
        updatePartnerUI();
        if (currentPage === 'profile') {
            renderProfile();
        }
        
        updateWalletDisplay();
        
        if (window.PetSystem) {
            window.PetSystem.loadStatus().catch(() => {});
        }
        return currentPartner;
    } catch (err) {
        console.warn('获取绑定状态失败', err);
        currentPartner = null;
        updatePartnerUI();
        
        updateWalletDisplay();
        
        if (window.PetSystem) {
            window.PetSystem.loadStatus().catch(() => {});
        }
        return null;
    }
}
    async function generateMatchCodeApi() {
        try {
            const data = await apiCall('/match/generate', 'POST');
            matchCode = data.code;
            return data;
        } catch (err) {
            throw new Error(err.message || '生成匹配码失败');
        }
    }

async function bindPartnerApi(code) {
    try {
        const data = await apiCall('/match/bind', 'POST', { code });
        
        await fetchPartnerStatus();
        
        localStorage.removeItem('categories_data');
        await refreshCategoriesFromBackend();
        
        await loadAllData();
        updatePartnerUI();
        if (currentPage === 'profile') {
            renderProfile();
        }
        
        renderHome();
        renderBills();
        updateBudgetDisplay();
        updateWalletDisplay();
        if (currentPage === 'stats') {
            enterStatsPage();
        } else if (currentPage === 'budget') {
            updateBudgetPage();
            updateBudgetCircle();
            startBudgetRealtimeSync();
        }

        if (window.PetSystem) {
            window.PetSystem.loadStatus().catch(() => {});
        }
        return data;
    } catch (err) {
        throw new Error(err.message || '绑定失败');
    }
}

async function unbindPartnerApi() {
    try {
        const data = await apiCall('/match/unbind', 'DELETE');
        currentPartner = null;
        stopBudgetRealtimeSync();

        allBills = [];
        budgetCache = { [getBudgetMonthKey(new Date())]: { my: 0, partner: 0, both: 0 } };
        localStorage.removeItem('categories_data');

        await refreshCategoriesFromBackend();
        updatePartnerUI();
        if (currentPage === 'profile') {
            renderProfile();
        }

        renderHome();
        renderBills();
        updateWalletDisplay();
        if (currentPage === 'stats') {
            renderStatsPage();
            updateStatsDateLabel();
        }
        
        if (window.PetSystem) {
            window.PetSystem.loadStatus().catch(() => {});
        }
        return data;
    } catch (err) {
        throw new Error(err.message || '解绑失败');
    }
}
    
    async function login(username, password) {
        const data = await apiCall('/auth/login', 'POST', { username, password });
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        localStorage.removeItem('categories_data');
        return data;
    }

    async function register(username, email, password) {
        const data = await apiCall('/auth/register', 'POST', { username, email, password });
        return data;
    }

    function logout() {
        token = null;
        currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        localStorage.removeItem('categories_data');
        
        budgetCache = { [getBudgetMonthKey(new Date())]: { my: 0, partner: 0, both: 0 } };
        showLoginPage();
    }

function checkAuth() {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
        token = t;
        try { currentUser = JSON.parse(u); } catch (e) { currentUser = null; }
        if (currentUser) {
            if (currentUser.avatar) new Image().src = currentUser.avatar;
            
            showMainApp();
            
            loadAllData(false);
            return true;
        }
    }
    hideLoading();
    showLoginPage();
    return false;
}

    

function restoreFromBack(target) {
    if (!target) target = 'home';
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    nav.classList.add('show');
    currentPage = target;
    if (target !== 'budget' && target !== 'stats') stopBudgetRealtimeSync();
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') { enterStatsPage(); }
    else if (target === 'profile') renderProfile();
    try { refreshStatusBar(); } catch(e) {}
}

function showPage(name) {
    closeAllSwiped();

    if (['home', 'bills', 'stats', 'profile'].includes(name)) {
        pageBackStack = [];
    }

    if (name === 'login' || name === 'register') {
        mainApp.style.display = 'none';
        pageAuth.style.display = 'flex';
        pageAuth.classList.add('active');
        nav.classList.remove('show');
        return;
    }
    
if (name === 'detail') {
        nav.classList.add('show');  
        document.querySelectorAll('#main-app .page').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        const pageEl = document.getElementById('page-detail');
        if (pageEl) {
            pageEl.style.display = 'flex';
            requestAnimationFrame(() => {
                pageEl.classList.add('active');
                try { refreshStatusBar(); } catch(e) {}
            });
        }
        currentPage = 'detail';
        return;
    }
    
    mainApp.style.display = 'flex';
    nav.classList.add('show');
    pageAuth.style.display = 'none';
    pageAuth.classList.remove('active');

    const detailPage = document.getElementById('page-detail');
    if (detailPage) {
        detailPage.classList.remove('active');
        detailPage.style.display = 'none';
    }

    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });

    const pageEl = document.getElementById('page-' + name);
    if (pageEl) {
        pageEl.style.display = '';
        pageEl.classList.add('active');
    }

    
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === name);
        item.style.color = '';
    });

    try { refreshStatusBar(); } catch(e) {}

    currentPage = name;

    if (name !== 'stats') stopBudgetRealtimeSync();

nav.classList.add('show');
    if (name === 'home') {
        const homeNav = document.getElementById('homeBillNav');
        if (homeNav) homeNav.classList.remove('tab-ready');
        updateWalletDisplay();
        renderHome();
    }
    if (name === 'bills') {


        ['billsViewNav', 'billsBelongNav'].forEach(id => {
            const nav = document.getElementById(id);
            if (nav) nav.classList.remove('tab-ready');
        });
        renderBills();
    }
    if (name === 'stats') {
        ['statsTypeNav', 'statsDetailNav', 'statsCategoryNav', 'statsRankNav'].forEach(id => {
            const nav = document.getElementById(id);
            if (nav) nav.classList.remove('tab-ready');
        });

        startBudgetRealtimeSync();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                renderStatsPage();
                updateStatsDateLabel();
                if (token && currentPartner) {
                    loadBudgetData().then(() => {
                        updateBudgetDisplay();
                        if (currentPage === 'stats') {
                            renderStatsPage();
                            updateStatsDateLabel();
                        }
                    });
                }
            });
        });
    }
    if (name === 'profile') renderProfile();

    try { refreshStatusBar(); } catch(e) {}
}

function showLoginPage() {
    pageAuth.style.display = 'flex';
    pageAuth.classList.add('active');
    mainApp.style.display = 'none';
    nav.classList.remove('show');
    nav.classList.remove('nav-ready');

    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    authSwitchText.innerHTML = '还没有账号？<a id="authSwitchLink">立即注册</a>';
    $('#loginError').textContent = '';
    $('#loginError').style.display = 'none';
    $('#loginForm').reset();
    
    resetPwdToggles('#loginForm');
}

function showRegisterPage() {
    pageAuth.style.display = 'flex';
    pageAuth.classList.add('active');
    mainApp.style.display = 'none';
    nav.classList.remove('show');
    nav.classList.remove('nav-ready');

    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authSwitchText.innerHTML = '已有账号？<a id="authSwitchLink">去登录</a>';
    $('#registerError').textContent = '';
    $('#registerError').style.display = 'none';
    $('#registerForm').reset();

    
    const regSendBtn = document.getElementById('regSendCodeBtn');
    if (regSendBtn) {
        regSendBtn.disabled = false;
        regSendBtn.textContent = '获取验证码';
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    
    resetPwdToggles('#registerForm');
}

async function showMainApp() {
    pageAuth.style.display = 'none';
    pageAuth.classList.remove('active');
    mainApp.style.display = 'flex';
    
    
    if (currentUser?.avatar) new Image().src = currentUser.avatar;
    
    showPage('home');
    updateHomeAvatar();
    
    requestAnimationFrame(() => {
        nav.classList.add('nav-ready');
    });
    fetchPartnerStatus().then(() => {
        const available = getAvailableWallets();
        if (currentWalletIndex >= available.length) {
            currentWalletIndex = available.length - 1;
        }
        updateWalletDisplay();
    });
}

    
    const swipeState = new Map();

    function getSwipeState(wrapper) {
        if (!swipeState.has(wrapper)) {
            swipeState.set(wrapper, {
                startX: 0,
                currentX: 0,
                offset: 0,
                isOpen: false,
                maxOffset: 0,
                isDragging: false,
                startY: 0,
            });
        }
        return swipeState.get(wrapper);
    }

    function closeAllSwiped() {
        document.querySelectorAll('.bill-item-wrapper.swiped').forEach(w => {
            w.classList.remove('swiped');
            const content = w.querySelector('.bill-item-content');
            if (content) content.style.transform = '';
            const state = swipeState.get(w);
            if (state) {
                state.isOpen = false;
                state.offset = 0;
            }
        });
    }

    function closeSwiped(wrapper) {
        if (!wrapper) return;
        wrapper.classList.remove('swiped');
        const content = wrapper.querySelector('.bill-item-content');
        if (content) content.style.transform = '';
        const state = swipeState.get(wrapper);
        if (state) {
            state.isOpen = false;
            state.offset = 0;
        }
    }

    
function renderBillItem(b) {
    const cats = getCategoriesByType(b.type);
    const cat = cats.find(c => c.label === b.category);
    const icon = cat ? cat.icon : 'fa-tag';

    const typeClass = b.type === 'income' ? 'income' : 'expense';
    const sign = b.type === 'income' ? '+' : '-';
    const typeLabel = b.type === 'income' ? '收入' : '支出';

    const displayText = b.note && b.note.trim() ? b.note.trim() : b.category;

    
    const belongDisplay = getDisplayBelongName(b);
    const isHelp = isHelpBill(b);

    return `
        <div class="bill-item-wrapper" data-id="${b.id}">
            <div class="bill-item-content">
                <div class="bill-left">
                    <div class="bill-icon ${typeClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="bill-info">
                        <div class="bill-category">${escapeHtml(displayText)}</div>
                        <div class="bill-note">
                            <span></span>
                            <span class="belong-tag">${belongDisplay}</span>${isHelp ? '<span class="belong-tag help-tag">帮记</span>' : ''}
                            <span class="type-tag ${typeClass}">${typeLabel}</span>
                        </div>
                    </div>
                </div>
                <div class="bill-amount ${typeClass}">${sign}¥${b.amount.toFixed(2)}</div>
            </div>
            <div class="bill-item-actions">
                <button class="action-delete" data-id="${b.id}">删除</button>
            </div>
        </div>
    `;
}

    
    let activeWrapper = null;

    function initSwipeEvents() {
        const app = document.getElementById('app');
        app.removeEventListener('touchstart', onTouchStart);
        app.removeEventListener('touchmove', onTouchMove);
        app.removeEventListener('touchend', onTouchEnd);
        app.removeEventListener('touchcancel', onTouchEnd);
        app.addEventListener('touchstart', onTouchStart, { passive: true });
        app.addEventListener('touchmove', onTouchMove, { passive: false });
        app.addEventListener('touchend', onTouchEnd, { passive: true });
        app.addEventListener('touchcancel', onTouchEnd, { passive: true });
        app.removeEventListener('click', onAppClick);
        app.addEventListener('click', onAppClick);
    }

    function onTouchStart(e) {
        if (addModalOverlay.classList.contains('show') || deleteModal.classList.contains('show')) return;
        const target = e.target;
        const wrapper = target.closest('.bill-item-wrapper');
        if (!wrapper) return;
        if (target.closest('.bill-item-actions')) return;
        const content = wrapper.querySelector('.bill-item-content');
        if (!content) return;

        const touch = e.touches[0];
        const state = getSwipeState(wrapper);
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.currentX = touch.clientX;
        state.isDragging = true;
        state.maxOffset = wrapper.querySelector('.bill-item-actions')?.offsetWidth || 150;
        if (state.isOpen) {
            state.offset = -state.maxOffset;
        } else {
            state.offset = 0;
        }
        activeWrapper = wrapper;
        document.querySelectorAll('.bill-item-wrapper.swiped').forEach(w => {
            if (w !== wrapper) closeSwiped(w);
        });
    }

    function onTouchMove(e) {
        if (!activeWrapper) return;
        const state = getSwipeState(activeWrapper);
        if (!state.isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
            e.preventDefault();
            let newOffset = deltaX;
            if (state.isOpen) {
                newOffset = -state.maxOffset + deltaX;
            }
            newOffset = Math.min(0, Math.max(-state.maxOffset, newOffset));
            state.offset = newOffset;
            const content = activeWrapper.querySelector('.bill-item-content');
            if (content) {
                content.style.transform = `translateX(${newOffset}px)`;
                content.style.transition = 'none';
            }
        }
    }

    function onTouchEnd(e) {
        if (!activeWrapper) return;
        const state = getSwipeState(activeWrapper);
        if (!state.isDragging) {
            activeWrapper = null;
            return;
        }
        state.isDragging = false;
        const content = activeWrapper.querySelector('.bill-item-content');
        const threshold = 50;
        const shouldOpen = state.offset < -threshold;
        if (shouldOpen) {
            state.isOpen = true;
            state.offset = -state.maxOffset;
            activeWrapper.classList.add('swiped');
            if (content) {
                content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                content.style.transform = `translateX(${-state.maxOffset}px)`;
            }
        } else {
            state.isOpen = false;
            state.offset = 0;
            activeWrapper.classList.remove('swiped');
            if (content) {
                content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                content.style.transform = 'translateX(0)';
            }
        }
        activeWrapper = null;
    }

    function onAppClick(e) {
        const target = e.target;
        if (!target.closest('.bill-item-wrapper')) {
            closeAllSwiped();
            return;
        }
        const wrapper = target.closest('.bill-item-wrapper');
        if (wrapper && !target.closest('.bill-item-actions')) {
            if (wrapper.classList.contains('swiped')) {
                closeSwiped(wrapper);
                e.stopPropagation();
            }
        }
    }

    


function animateTabContent(el) {
    if (!el) return;
    el.classList.remove('tab-content-anim');
    void el.offsetWidth;
    el.classList.add('tab-content-anim');
}


function updateTabIndicator(navEl, activeBtn) {
    if (!navEl || !activeBtn) return;
    const isVisible = navEl.offsetParent !== null;
    navEl.style.setProperty('--indicator-x', activeBtn.offsetLeft + 'px');
    navEl.style.setProperty('--indicator-w', activeBtn.offsetWidth + 'px');
    
    
    if (isVisible && !navEl.classList.contains('tab-ready')) {
        requestAnimationFrame(function() {
            navEl.classList.add('tab-ready');
        });
    }
}


function updateTabIndicatorById(navId) {
    const nav = document.getElementById(navId);
    if (!nav) return;
    var active = nav.querySelector('.active');
    if (active) updateTabIndicator(nav, active);
}


function updateAllTabIndicators() {
    updateTabIndicatorById('homeBillNav');
    updateTabIndicatorById('billsViewNav');
    updateTabIndicatorById('billsBelongNav');
    updateTabIndicatorById('statsTypeNav');
    updateTabIndicatorById('statsDetailNav');
    updateTabIndicatorById('statsCategoryNav');
    updateTabIndicatorById('statsRankNav');
    updateTabIndicatorById('annualBelongNav');
}

function initHomeBillNav() {
    const nav = document.getElementById('homeBillNav');
    if (!nav) return;
    
    nav.addEventListener('click', function(e) {
        const btn = e.target.closest('.bill-nav-btn');
        if (!btn) return;
        const filter = btn.dataset.filter;
        if (filter === currentHomeFilter) return;
        
        
        nav.querySelectorAll('.bill-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        
        currentHomeFilter = filter;
        renderHome();
        animateTabContent(document.getElementById('homeRecentBills'));
    });
}

function updateWalletDisplay() {
    const available = getAvailableWallets();
    const wallet = available[currentWalletIndex] || available[0];
    const nameEl = document.getElementById('walletName');
    const imgEl = document.getElementById('homeAvatarImg');
    const iconEl = document.getElementById('homeAvatarIcon');
    const prevBtn = document.getElementById('walletPrevBtn');
    const nextBtn = document.getElementById('walletNextBtn');
    const walletDisplay = document.getElementById('walletDisplay');
    
    
    if (prevBtn) {
        prevBtn.style.visibility = available.length > 1 ? 'visible' : 'hidden';
    }
    if (nextBtn) {
        nextBtn.style.visibility = available.length > 1 ? 'visible' : 'hidden';
    }
    
    if (nameEl) nameEl.textContent = wallet.label;
    
    
    if (wallet.key === 'my') {
        if (currentUser && currentUser.avatar) {
            imgEl.src = currentUser.avatar;
            imgEl.style.display = 'block';
            iconEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            iconEl.style.display = 'block';
            iconEl.className = 'ri-user-fill';
        }
    } else if (wallet.key === 'partner') {
        if (currentPartner && currentPartner.avatar) {
            imgEl.src = currentPartner.avatar;
            imgEl.style.display = 'block';
            iconEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            iconEl.style.display = 'block';
            iconEl.className = 'ri-user-fill';
        }
    } else {
        
        imgEl.style.display = 'none';
        iconEl.style.display = 'block';
        iconEl.className = 'ri-wallet-fill';
    }
    
    
    
    const oldBubble = walletDisplay?.querySelector('.invite-bubble');
    if (oldBubble) oldBubble.remove();
    
    
    if (!currentPartner && wallet.key !== 'partner' && walletDisplay) {
        const bubble = document.createElement('div');
        bubble.className = 'invite-bubble';  
        bubble.textContent = '邀请搭子';
        walletDisplay.style.position = 'relative';
        walletDisplay.appendChild(bubble);
        
        
        bubble.addEventListener('click', function(e) {
            e.stopPropagation();
            openMatchPage();
        });
    }
    
    
    if (walletDisplay) {
        walletDisplay.style.cursor = currentPartner ? 'default' : 'pointer';
        
        const newDisplay = walletDisplay.cloneNode(true);
        walletDisplay.parentNode.replaceChild(newDisplay, walletDisplay);
        
        newDisplay.addEventListener('click', function(e) {
            if (!currentPartner) {
                e.stopPropagation();
                openMatchPage();
            }
        });
    }
}

function switchWallet(direction) {
    const available = getAvailableWallets();
    if (available.length <= 1) {
        
        if (!currentPartner) {
            openMatchPage();
        }
        return;
    }
    
    
    if (currentWalletIndex >= available.length) {
        currentWalletIndex = available.length - 1;
    }
    
    const total = available.length;
    const newIndex = (currentWalletIndex + direction + total) % total;
    
    if (newIndex === currentWalletIndex) return;
    
    const card = document.querySelector('.summary-card');
    if (!card) {
        currentWalletIndex = newIndex;
        updateWalletDisplay();
        renderHomeSummaryOnly();
        return;
    }
    
    const isNext = direction === 1;
    
    
    card.classList.remove('slide-left', 'slide-right', 'enter-left', 'enter-right', 'animating');
    void card.offsetHeight;
    
    if (isNext) {
        card.classList.add('slide-left');
    } else {
        card.classList.add('slide-right');
    }
    card.classList.add('animating');
    
    const onExit = function(e) {
        if (e.propertyName !== 'transform') return;
        card.removeEventListener('transitionend', onExit);
        
        currentWalletIndex = newIndex;
        updateWalletDisplay();
        renderHomeSummaryOnly();
        updateBudgetDisplay();
        
        card.classList.remove('slide-left', 'slide-right');
        card.style.transition = 'none';
        void card.offsetHeight;
        card.style.transition = '';
        
        if (isNext) {
            card.classList.add('enter-left');
        } else {
            card.classList.add('enter-right');
        }
        void card.offsetHeight;
        
        card.classList.remove('enter-left', 'enter-right');
        card.classList.remove('animating');
    };
    
    card.addEventListener('transitionend', onExit);
}


function initWalletNavigation() {
    const prevBtn = document.getElementById('walletPrevBtn');
    const nextBtn = document.getElementById('walletNextBtn');
    const searchBox = document.getElementById('searchBox');
    const summaryContainer = document.getElementById('homeSummary');
    
    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', function(e) {
            e.stopPropagation();
            const available = getAvailableWallets();
            if (available.length > 1) {
                switchWallet(-1);
            } else if (!currentPartner) {
                openMatchPage();
            }
        });
    }
    
    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', function(e) {
            e.stopPropagation();
            const available = getAvailableWallets();
            if (available.length > 1) {
                switchWallet(1);
            } else if (!currentPartner) {
                openMatchPage();
            }
        });
    }
    
    
    if (searchBox) {
        
        const newSearchBox = searchBox.cloneNode(true);
        searchBox.parentNode.replaceChild(newSearchBox, searchBox);
        
        newSearchBox.addEventListener('click', function(e) {
            e.stopPropagation();
            openSearchPage();
        });
    }
    
    
    if (summaryContainer) {
        let startX = 0, startY = 0, isHorizontalSwipe = false, startTime = 0;
        const SWIPE_THRESHOLD = 30, MAX_SWIPE_TIME = 500;
        
        summaryContainer.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
            isHorizontalSwipe = false;
        }, { passive: true });
        
        summaryContainer.addEventListener('touchmove', function(e) {
            if (e.touches.length !== 1 || startX === 0) return;
            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                isHorizontalSwipe = true;
                e.preventDefault();
            }
        }, { passive: false });
        
        summaryContainer.addEventListener('touchend', function(e) {
            if (startX === 0 || !isHorizontalSwipe) {
                startX = 0;
                return;
            }
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const elapsed = Date.now() - startTime;
            startX = 0;
            isHorizontalSwipe = false;
            
            if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
            if (Math.abs(deltaX) < Math.abs(deltaY) * 0.8) return;
            if (elapsed > MAX_SWIPE_TIME) return;
            
            const available = getAvailableWallets();
            if (available.length > 1) {
                switchWallet(deltaX < 0 ? 1 : -1);
            } else if (!currentPartner) {
                openMatchPage();
            }
        }, { passive: true });
        
        summaryContainer.addEventListener('touchcancel', function() {
            startX = 0;
            isHorizontalSwipe = false;
        }, { passive: true });
    }
    
    
    updateWalletDisplay();
}

function renderHomeSummaryOnly() {
    const budgetItem = document.getElementById('budgetItem');
    if (budgetItem) {
        const newItem = budgetItem.cloneNode(true);
        budgetItem.parentNode.replaceChild(newItem, budgetItem);
        newItem.addEventListener('click', function() {
            const available = getAvailableWallets();
            const wallet = available[currentWalletIndex] || available[0];
            budgetViewType = wallet.key;
            budgetViewDate = new Date(selectedMonthDate);
            openBudgetPage();
        });
    }
    syncStackHeights();
    if (!currentUser) return;
    updateBudgetDisplay();
    
    if (!selectedMonthDate) {
        selectedMonthDate = new Date();
        updateMonthLabel();
    }
    
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const monthPrefix = year + '-' + String(month + 1).padStart(2, '0');
    const monthBills = allBills.filter(b => b.date && b.date.startsWith(monthPrefix));
    
    const available = getAvailableWallets();
    const wallet = available[currentWalletIndex] || available[0];
    if (!wallet) {
        currentWalletIndex = 0;
        return renderHomeSummaryOnly();
    }
    
    let filteredBills = [...monthBills];
    if (wallet.key === 'my') {
        filteredBills = filteredBills.filter(b => getDisplayBelong(b) === '自己');
    } else if (wallet.key === 'partner') {
        filteredBills = filteredBills.filter(b => getDisplayBelong(b) === '对方');
    } else if (wallet.key === 'both') {
        filteredBills = filteredBills.filter(b => getDisplayBelong(b) === '共同');
    }
    
    const summary = calcSummary(filteredBills);
    const incomeEl = $('#homeIncome');
    const expenseEl = $('#homeExpense');
    const balanceEl = $('#homeBalance');
    
    function formatAmount(amount) {
        const formatted = amount.toFixed(2);
        if (amount < 0) return '-¥' + Math.abs(amount).toFixed(2);
        return '¥' + formatted;
    }
    
    if (incomeEl) incomeEl.textContent = formatAmount(summary.income);
    if (expenseEl) expenseEl.textContent = formatAmount(summary.expense);
    if (balanceEl) balanceEl.textContent = formatAmount(summary.balance);
}

function syncStackHeights() {
    const card = document.querySelector('.summary-card');
    const container = document.querySelector('.summary-cards');
    if (!card || !container) return;
    
    
    const cardHeight = card.offsetHeight;
    
    
    if (cardHeight < 50) {
        requestAnimationFrame(syncStackHeights);
        return;
    }
    
    
    const bg1 = container.querySelector('.stack-bg-1');
    const bg2 = container.querySelector('.stack-bg-2');
    const bg3 = container.querySelector('.stack-bg-3');
    
    if (bg1) {
        
        
        
        const totalHeight = cardHeight + 16;
        container.style.minHeight = totalHeight + 'px';
        
        container.style.height = totalHeight + 'px';
    }
}


function renderHome() {
    if (!currentUser) return;
    
    if (!selectedMonthDate) {
        selectedMonthDate = new Date();
        updateMonthLabel();
    }
    
    renderHomeSummaryOnly();

    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    
    
    const monthPrefix = year + '-' + String(month + 1).padStart(2, '0');
    
    
    const monthBills = allBills.filter(b => {
        return b.date && b.date.startsWith(monthPrefix);
    });
    
    
    let filteredBills = [...monthBills];
    if (currentHomeFilter === '自己') {
        filteredBills = filteredBills.filter(b => getDisplayBelong(b) === '自己');
    } else if (currentHomeFilter === '对方') {
        filteredBills = filteredBills.filter(b => getDisplayBelong(b) === '对方');
    } else if (currentHomeFilter === '共同') {
        filteredBills = filteredBills.filter(b => getDisplayBelong(b) === '共同');
    }

    
    const nav = document.getElementById('homeBillNav');
    if (nav) {
        nav.querySelectorAll('.bill-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentHomeFilter);
        });
        updateTabIndicator(nav, nav.querySelector('.bill-nav-btn.active'));
    }
    
    
    const sectionTitle = document.querySelector('.section-title.with-nav');
    const hasBills = monthBills.length > 0;
    
    if (sectionTitle) {
        if (hasBills) {
            sectionTitle.style.visibility = 'visible';
            sectionTitle.style.height = '';
            sectionTitle.style.opacity = '1';
        } else {
            sectionTitle.style.visibility = 'hidden';
            sectionTitle.style.height = sectionTitle.offsetHeight + 'px';
            sectionTitle.style.opacity = '0';
        }
    }

    const sorted = filteredBills.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const container = $('#homeRecentBills');
    
    if (sorted.length === 0) {
        const hasOtherBills = allBills.some(b => {
            return b.date && !b.date.startsWith(monthPrefix);
        });
        if (hasOtherBills) {
container.innerHTML =
    `<div class="empty-state"><div class="empty-icon"><i class="ri-calendar-2-line"></i></div><div class="empty-text">${year}年${month+1}月没有账单，<span style="color:var(--primary);cursor:pointer;" onclick="goToCurrentMonth()">查看本月</span></div></div>`;
        } else {
container.innerHTML =
    `<div class="empty-state"><div class="empty-icon"><i class="ri-inbox-line"></i></div><div class="empty-text">${year}年${month+1}月还没有账单</div></div>`;
        }
    } else {
        const dateGroups = {};
        sorted.forEach(b => {
            if (!dateGroups[b.date]) dateGroups[b.date] = [];
            dateGroups[b.date].push(b);
        });
        
        const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
        
        let html = '';
        dates.forEach(date => {
            const bills = dateGroups[date];
            let dayIncome = 0, dayExpense = 0;
            bills.forEach(b => {
                if (b.type === 'income') dayIncome += b.amount;
                else dayExpense += b.amount;
            });
            
            let summaryHtml = '';
            if (dayIncome > 0) summaryHtml += `<span class="income">¥${dayIncome.toFixed(2)}</span>`;
            if (dayExpense > 0) summaryHtml += `<span class="expense">¥${dayExpense.toFixed(2)}</span>`;
            if (dayIncome === 0 && dayExpense === 0) summaryHtml += `<span class="zero">¥0.00</span>`;
            
            html += `
                <div class="home-date-card">
                    <div class="home-date-card-header">
                        <span class="home-date-label">${formatDateDisplay(date)}</span>
                        <span class="home-date-summary">${summaryHtml}</span>
                    </div>
                    <div class="home-date-card-body">
                        ${bills.map(b => renderBillItem(b)).join('')}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    bindActionButtons(container);
}

function renderBills() {
    if (!currentUser) return;
    
    
    document.querySelectorAll('.bills-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === billsViewType);
    });
    updateTabIndicatorById('billsViewNav');
    
    
    updateBillsDateLabel();
    
    
    document.querySelectorAll('.bills-belong-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.belong === billsBelongFilter);
    });
    updateTabIndicatorById('billsBelongNav');
    
    
    document.querySelectorAll('.bills-summary-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === billsTypeFilter);
    });
    
    
    updateBillsStats();
    
    
    const viewPanel = document.querySelector(`.view-panel#view${billsViewType.charAt(0).toUpperCase() + billsViewType.slice(1)}`);
    if (viewPanel) {
        viewPanel.style.display = 'block';
        viewPanel.classList.add('active');
    }
    
    
    document.querySelectorAll('.view-panel').forEach(p => {
        if (p.id !== `view${billsViewType.charAt(0).toUpperCase() + billsViewType.slice(1)}`) {
            p.style.display = 'none';
            p.classList.remove('active');
        }
    });
    
    
    const monthList = document.getElementById('calendarBillsList');
    const weekList = document.getElementById('weekBillsList');
    
if (billsViewType === 'week') {
    if (monthList) monthList.style.display = 'none';
    if (weekList) weekList.style.display = 'block';
} else if (billsViewType === 'month') {
    if (monthList) monthList.style.display = 'block';
    if (weekList) weekList.style.display = 'none';
} else {
    
    if (monthList) monthList.style.display = 'block';
    if (weekList) weekList.style.display = 'none';
}
    
    
    if (billsViewType === 'week') {
        renderWeekView();
    } else if (billsViewType === 'month') {
        renderMonthView();
    } else if (billsViewType === 'year') {
        renderYearView();
    }
}

function bindActionButtons(container) {
    
    container.querySelectorAll('.action-delete').forEach(btn => {
        btn.removeEventListener('click', onDeleteClick);
        btn.addEventListener('click', onDeleteClick);
    });
    
    
    container.querySelectorAll('.bill-item-wrapper').forEach(wrapper => {
        wrapper.removeEventListener('click', onWrapperClick);
        wrapper.addEventListener('click', onWrapperClick);
    });
    
    
    container.querySelectorAll('.bill-item-static').forEach(staticItem => {
        staticItem.removeEventListener('click', onStaticItemClick);
        staticItem.addEventListener('click', onStaticItemClick);
    });
}

function onStaticItemClick(e) {
    const staticItem = e.currentTarget;
    const id = parseInt(staticItem.dataset.id);
    if (id && !isNaN(id)) {
        viewBillDetail(id);
    }
}
function onWrapperClick(e) {
    
    if (e.target.closest('.action-delete')) {
        return;
    }
    const wrapper = e.currentTarget;
    if (wrapper.classList.contains('swiped')) {
        closeSwiped(wrapper);
        return;
    }
    const id = parseInt(wrapper.dataset.id);
    if (id && !isNaN(id)) {
        viewBillDetail(id);
    }
}


    function onDeleteClick(e) {
        e.stopPropagation();
        const id = parseInt(this.dataset.id);
        const wrapper = this.closest('.bill-item-wrapper');
        if (wrapper) closeSwiped(wrapper);
        showDeleteModal(id);
    }

    
    function openPaymentSheet() {
        paymentSheet.classList.add('show');
        paymentTrigger.classList.add('active');
        paymentOverlay.classList.add('show');
    }

    function closePaymentSheet() {
        paymentSheet.classList.remove('show');
        paymentTrigger.classList.remove('active');
        paymentOverlay.classList.remove('show');
    }

    function togglePaymentSheet() {
        if (paymentSheet.classList.contains('show')) {
            closePaymentSheet();
        } else {
            openPaymentSheet();
        }
    }

    function setPaymentMethod(payment) {
        selectedPayment = payment;
        const icons = {
            '微信': '<i class="ri-wechat-fill" style="color:#07C160;"></i>',
            '支付宝': '<i class="ri-alipay-fill" style="color:#1677FF;"></i>',
            '现金': '<i class="ri-cash-fill" style="color:#E74C3C;"></i>',
            '银行卡': '<i class="ri-bank-card-fill" style="color:#F39C12;"></i>'
        };
        paymentTriggerLabel.innerHTML = icons[payment] || '';
        paymentSheetOptions.querySelectorAll('.payment-sheet-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.payment === payment);
        });
        closePaymentSheet();
    }

    
    function openNoteModal() {
        if (noteModal.classList.contains('show')) return;
        if (paymentSheet.classList.contains('show')) {
            closePaymentSheet();
        }
        noteModalInput.value = noteContent;
        noteModal.classList.add('show');
        noteOverlay.classList.add('show');
        setTimeout(() => noteModalInput.focus());
    }

    function closeNoteModal() {
        if (closeNoteTimer) {
            clearTimeout(closeNoteTimer);
            closeNoteTimer = null;
        }
        noteModal.classList.remove('show');
        noteOverlay.classList.remove('show');
        noteModalInput.blur();
    }

    function confirmNote() {
        const val = noteModalInput.value.trim();
        noteContent = val;
        updateNoteDisplay();
        closeNoteModal();
    }

    function updateNoteDisplay() {
        if (noteContent) {
            notePlaceholder.style.display = 'none';
            noteText.style.display = 'block';
            noteText.textContent = noteContent;
        } else {
            notePlaceholder.style.display = 'block';
            noteText.style.display = 'none';
            noteText.textContent = '';
        }
    }

    function resetNote() {
        noteContent = '';
        updateNoteDisplay();
        noteModalInput.value = '';
    }

    
function buildCategorySlides() {
    
    if (!slideExpense || !slideIncome) {
        
        const newSlideExpense = document.getElementById('categorySlideExpense');
        const newSlideIncome = document.getElementById('categorySlideIncome');
        if (newSlideExpense && newSlideIncome) {
            
            window.slideExpense = newSlideExpense;
            window.slideIncome = newSlideIncome;
        } else {
            console.warn('分类幻灯片元素不存在');
            return;
        }
    }
    
    const expenseCats = getCategoriesForType('expense');
    let htmlExpense = '';
    expenseCats.forEach(cat => {
        htmlExpense += `
            <div class="cat-item" data-category="${cat.label}">
                <span class="cat-icon"><i class="fas ${cat.icon}"></i></span>
                <span class="cat-label">${cat.label}</span>
            </div>
        `;
    });
    slideExpense.innerHTML = htmlExpense;

    const incomeCats = getCategoriesForType('income');
    let htmlIncome = '';
    incomeCats.forEach(cat => {
        htmlIncome += `
            <div class="cat-item" data-category="${cat.label}">
                <span class="cat-icon"><i class="fas ${cat.icon}"></i></span>
                <span class="cat-label">${cat.label}</span>
            </div>
        `;
    });
    slideIncome.innerHTML = htmlIncome;

    if (!window._categoryListenerAttached) {
        categoryGridWrapper.addEventListener('click', function(e) {
            const item = e.target.closest('.cat-item');
            if (!item) return;
            const slide = item.closest('.category-slide');
            const isExpense = slide === slideExpense;
            const expectedType = isExpense ? 'expense' : 'income';
            if (expectedType !== currentType) return;
            slide.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
        });
        window._categoryListenerAttached = true;
    }
}

function setType(type, category, skipScroll, autoSelect = true, force = false) {
    if (type !== 'expense' && type !== 'income') return;
    
    
    
    if (!force && type === currentType && !category) return;

    currentType = type;

    const toggleButtons = modalTypeToggle.querySelectorAll('button');
    toggleButtons.forEach(btn => {
        btn.classList.remove('active-expense', 'active-income');
        if (btn.dataset.type === type) {
            btn.classList.add(type === 'expense' ? 'active-expense' : 'active-income');
        }
    });

    const slide = type === 'expense' ? slideExpense : slideIncome;
    
    
    
    if (slide.children.length === 0) {
        buildCategorySlides();
    }
    
    
    if (autoSelect && !category) {
        const first = slide.querySelector('.cat-item');
        if (first) {
            slide.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
            first.classList.add('active');
            currentCategory = first.dataset.category;
        }
    } else if (category) {
        highlightCategory(slide, category);
    } else {
        
        
        const cats = getCategoriesByType(type);
        const exists = cats.some(c => c.label === currentCategory);
        if (exists && currentCategory) {
            
            highlightCategory(slide, currentCategory);
        } else {
            
            slide.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
        }
    }

    if (!skipScroll) {
        const scrollContainer = document.getElementById('categoryScroll');
        if (scrollContainer) {
            const targetIndex = type === 'expense' ? 0 : 1;
            const targetScroll = targetIndex * scrollContainer.clientWidth;
            if (Math.abs(scrollContainer.scrollLeft - targetScroll) > 1) {
                scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        }
    }

    updateSliderPosition();
}

function highlightCategory(slide, category) {
    const items = slide.querySelectorAll('.cat-item');
    items.forEach(el => el.classList.remove('active'));

    if (category) {
        let found = false;
        const trimmedCategory = category.trim();
        items.forEach(el => {
            const elCategory = el.dataset.category ? el.dataset.category.trim() : '';
            if (elCategory === trimmedCategory) {
                el.classList.add('active');
                currentCategory = trimmedCategory;
                found = true;
            }
        });
        if (!found) {
            
            const first = slide.querySelector('.cat-item');
            if (first) {
                first.classList.add('active');
                currentCategory = first.dataset.category ? first.dataset.category.trim() : first.dataset.category;
            } else {
                
                buildCategorySlides();
                
                setTimeout(() => {
                    const newItems = slide.querySelectorAll('.cat-item');
                    let retryFound = false;
                    newItems.forEach(el => {
                        const elCategory = el.dataset.category ? el.dataset.category.trim() : '';
                        if (elCategory === trimmedCategory) {
                            newItems.forEach(el2 => el2.classList.remove('active'));
                            el.classList.add('active');
                            currentCategory = trimmedCategory;
                            retryFound = true;
                        }
                    });
                    if (!retryFound) {
                        const firstRetry = slide.querySelector('.cat-item');
                        if (firstRetry) {
                            firstRetry.classList.add('active');
                            currentCategory = firstRetry.dataset.category ? firstRetry.dataset.category.trim() : firstRetry.dataset.category;
                        }
                    }
                }, 50);
            }
        }
    } else {
        
        const first = slide.querySelector('.cat-item');
        if (first) {
            slide.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
            first.classList.add('active');
            currentCategory = first.dataset.category ? first.dataset.category.trim() : first.dataset.category;
        }
    }
}
async function deleteCommentApi(commentId) {
    if (!currentBillId) throw new Error('未指定账单');
    const data = await apiCall(`/bills/${currentBillId}/comments/${commentId}`, 'DELETE');
    return data.comments || [];
}
    function updateSliderPosition() {
        const toggle = document.getElementById('modalTypeToggle');
        const slider = document.getElementById('toggleSlider');
        if (!toggle || !slider) return;

        const buttons = toggle.querySelectorAll('button');
        let activeBtn = null;
        buttons.forEach(btn => {
            if (btn.classList.contains('active-expense') || btn.classList.contains('active-income')) {
                activeBtn = btn;
            }
        });
        if (!activeBtn) return;

        const toggleRect = toggle.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();

        const width = btnRect.width * 0.5;
        const left = btnRect.left - toggleRect.left + (btnRect.width - width) / 2;

        slider.style.left = left + 'px';
        slider.style.width = width + 'px';
    }

function initCategorySwipe() {
    
    
    
    
    const wrapper = document.getElementById('categoryGridWrapper');
    if (!wrapper) return;

    let startX = 0, startY = 0, tracking = false;

    wrapper.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        tracking = true;
    }, { passive: true });

    wrapper.addEventListener('touchend', function(e) {
        if (!tracking) return;
        tracking = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) {
            
            if (currentType !== 'income') setType('income', null, false, false);
        } else {
            
            if (currentType !== 'expense') setType('expense', null, false, false);
        }
    }, { passive: true });
}

    
    function isValidAmount(str) {
        if (str.startsWith('.')) return false;
        const parts = str.split('.');
        if (parts.length > 2) return false;
        const intPart = parts[0];
        const decPart = parts[1] || '';
        const hasDec = parts.length === 2;
        const MAX_INT_NO_DEC = 7;
        const MAX_INT_WITH_DEC = 6;
        const MAX_DEC = 2;
        if (intPart.length === 0) return true;
        const maxInt = hasDec ? MAX_INT_WITH_DEC : MAX_INT_NO_DEC;
        if (intPart.length > maxInt) return false;
        if (decPart.length > MAX_DEC) return false;
        return true;
    }

    function updateAmountDisplay() {
        
        if (amountStr.indexOf('+') !== -1 || amountStr.lastIndexOf('-') > 0) {
            amountDisplay.textContent = amountStr;
            return;
        }
        let displayVal = parseFloat(amountStr);
        if (isNaN(displayVal)) displayVal = 0;
        if (Number.isInteger(displayVal) && amountStr.indexOf('.') === -1) {
            amountDisplay.textContent = String(displayVal);
        } else {
            amountDisplay.textContent = displayVal.toFixed(2);
        }
    }

    
    function evaluateExpression(expr) {
        let s = expr.replace(/[+\-]$/, ''); 
        const m = s.match(/^(-?[\d.]+)\s*([+\-])\s*(-?[\d.]+)$/);
        if (!m) {
            const v = parseFloat(s);
            return isNaN(v) ? 0 : v;
        }
        const left = parseFloat(m[1]);
        const op = m[2];
        const right = parseFloat(m[3]);
        if (isNaN(left) || isNaN(right)) return 0;
        return op === '+' ? left + right : left - right;
    }

    
    function formatNumber(n) {
        if (!isFinite(n)) return '0';
        return String(parseFloat(n.toFixed(2)));
    }

    
    function getCurrentOperand(expr) {
        for (let i = expr.length - 1; i >= 1; i--) {
            if (expr[i] === '+' || expr[i] === '-') {
                return expr.slice(i + 1);
            }
        }
        return expr;
    }

    
    function isComplete(expr) {
        for (let i = 1; i < expr.length; i++) {
            if (expr[i] === '+' || expr[i] === '-') {
                return i < expr.length - 1;
            }
        }
        return false;
    }

    function handleKeyInput(value) {
        if (value === 'clear') {
            amountStr = '0';
            updateAmountDisplay();
            return;
        }
        if (value === 'back') {
            if (amountStr.length <= 1) {
                amountStr = '0';
            } else {
                amountStr = amountStr.slice(0, -1);
                if (amountStr === '-' || amountStr === '.' || amountStr === '') {
                    amountStr = '0';
                }
            }
            updateAmountDisplay();
            return;
        }
        if (value === 'plus' || value === 'minus') {
            const op = value === 'plus' ? '+' : '-';
            const last = amountStr[amountStr.length - 1];
            if (last === '+' || last === '-') {
                
                amountStr = amountStr.slice(0, -1) + op;
            } else if (isComplete(amountStr)) {
                
                amountStr = formatNumber(evaluateExpression(amountStr)) + op;
            } else {
                amountStr = amountStr + op;
            }
            updateAmountDisplay();
            return;
        }
        if (value === '.') {
            const operand = getCurrentOperand(amountStr);
            if (operand.includes('.')) return;
            const newOperand = operand === '' ? '0.' : operand + '.';
            if (!isValidAmount(newOperand)) {
                showToast('金额超出限制（整数最多7位，小数最多2位）');
                return;
            }
            amountStr = amountStr.slice(0, amountStr.length - operand.length) + newOperand;
            updateAmountDisplay();
            return;
        }
        const num = parseInt(value);
        if (!isNaN(num)) {
            const operand = getCurrentOperand(amountStr);
            let newOperand;
            if (operand === '' || operand === '0') newOperand = String(num);
            else newOperand = operand + String(num);
            if (!isValidAmount(newOperand)) {
                showToast('金额超出限制（整数最多7位，小数最多2位）');
                return;
            }
            amountStr = amountStr.slice(0, amountStr.length - operand.length) + newOperand;
            updateAmountDisplay();
        }
    }

    function setupBackspaceLongPress() {
        const backBtn = keyboard.querySelector('.key-back');
        if (!backBtn) return;
        let pressTimer = null;
        let isLongPress = false;

        const startPress = (e) => {
            e.preventDefault();
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                amountStr = '0';
                updateAmountDisplay();
                showToast('已清空金额');
                pressTimer = null;
            }, 400);
        };

        const endPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            if (isLongPress) isLongPress = false;
        };

        backBtn.addEventListener('pointerdown', startPress);
        backBtn.addEventListener('pointerup', endPress);
        backBtn.addEventListener('pointerleave', endPress);

        backBtn.addEventListener('click', (e) => {
            if (isLongPress) {
                e.stopPropagation();
                isLongPress = false;
            }
        });
    }

function initBounceScroll(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    const MAX_OVERSCROLL = 120;  
    const DAMPING = 0.3;         
    const DURATION = 0.55;       
    const REFRESH_THRESHOLD = options.refreshThreshold || 150; 

    const { onRefresh = null, indicatorEl = null } = options;
    let refreshTextEl = null;
    if (indicatorEl) {
        refreshTextEl = indicatorEl.querySelector('.pull-refresh-text');
    }

    elements.forEach(el => {
        let startX = 0,
            startY = 0,
            offsetY = 0,
            isDragging = false;
        let isHorizontal = false;
        let lastDeltaY = 0;
        let isRefreshing = false;
        let usedHeightPull = false;
        let safeTopOffset = 0;

        function setIndicatorState(state) {
            if (!indicatorEl) return;
            indicatorEl.classList.remove('release', 'refreshing');
            if (state === 'release') indicatorEl.classList.add('release');
            if (state === 'refreshing') indicatorEl.classList.add('refreshing');
            if (refreshTextEl) {
                if (state === 'pulling') refreshTextEl.textContent = '下拉刷新';
                else if (state === 'release') refreshTextEl.textContent = '释放立即刷新';
                else if (state === 'refreshing') refreshTextEl.textContent = '正在刷新...';
            }
        }

        function showIndicator() {
            if (!indicatorEl) return;
            indicatorEl.style.opacity = '1';
            indicatorEl.style.paddingTop = safeTopOffset + 'px';
            indicatorEl.style.height = (50 + safeTopOffset) + 'px';
        }

        function hideIndicator() {
            if (!indicatorEl) return;
            indicatorEl.style.opacity = '0';
            indicatorEl.style.paddingTop = '0';
            indicatorEl.style.height = '0';
        }

        function finishRefresh() {
            if (!isRefreshing) return;
            isRefreshing = false;
            setIndicatorState('pulling');
            if (indicatorEl) indicatorEl.style.transition = '';
            hideIndicator();
            setTimeout(() => {
                el.style.willChange = 'auto';
                offsetY = 0;
            }, 350);
        }

        el.addEventListener('touchstart', (e) => {
            if (dragStateSettings && dragStateSettings.dragItem) return;
            if (isRefreshing) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            offsetY = 0;
            isDragging = false;
            isHorizontal = false;
            lastDeltaY = 0;
            usedHeightPull = false;
            
            safeTopOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
            el.style.transition = 'none';
            el.style.willChange = 'transform';
            if (indicatorEl) indicatorEl.style.transition = 'none';
        }, { passive: true });

        el.addEventListener('touchmove', (e) => {
            if (dragStateSettings && dragStateSettings.dragItem) return;
            if (isRefreshing) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            
            if (!isDragging && !isHorizontal) {
                if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    isHorizontal = true;
                    return;
                } else if (Math.abs(deltaY) > 8) {
                    isDragging = true;
                }
            }

            if (isHorizontal) return;

            const scrollTop = el.scrollTop;
            const scrollHeight = el.scrollHeight;
            const clientHeight = el.clientHeight;
            const atTop = scrollTop <= 1;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
            const contentTooShort = scrollHeight <= clientHeight;

            
            if ((atTop && deltaY > 0) || (atBottom && deltaY < 0) || contentTooShort) {
                let dampedOffset = deltaY * DAMPING;
                dampedOffset = Math.max(-MAX_OVERSCROLL, Math.min(MAX_OVERSCROLL, dampedOffset));

                if (contentTooShort) {
                    dampedOffset = deltaY * DAMPING;
                    dampedOffset = Math.max(-MAX_OVERSCROLL, Math.min(MAX_OVERSCROLL, dampedOffset));
                }

                offsetY = dampedOffset;

                
                if (indicatorEl && onRefresh && atTop && deltaY > 0) {
                    usedHeightPull = true;
                    indicatorEl.style.paddingTop = safeTopOffset + 'px';
                    
                    indicatorEl.style.height = (Math.min(90, dampedOffset) + safeTopOffset) + 'px';
                    indicatorEl.style.opacity = Math.min(1, deltaY / 100);
                    if (deltaY >= REFRESH_THRESHOLD) {
                        setIndicatorState('release');
                    } else {
                        setIndicatorState('pulling');
                    }
                } else {
                    
                    el.style.transform = `translateY(${offsetY}px)`;
                }

                lastDeltaY = deltaY;
                e.preventDefault();
            }
        }, { passive: false });

        el.addEventListener('touchend', () => {
            isDragging = false;
            isHorizontal = false;

            
            if (indicatorEl && onRefresh && lastDeltaY > 0 && lastDeltaY >= REFRESH_THRESHOLD) {
                isRefreshing = true;
                setIndicatorState('refreshing');
                if (indicatorEl) indicatorEl.style.transition = '';
                showIndicator();
                try {
                    onRefresh(finishRefresh);
                } catch (err) {
                    finishRefresh();
                }
                return;
            }

            if (offsetY !== 0 || usedHeightPull) {
                if (indicatorEl) indicatorEl.style.transition = '';

                if (usedHeightPull) {
                    
                    hideIndicator();
                } else {
                    
                    el.style.transition = `transform ${DURATION}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                    el.style.transform = 'translateY(0)';
                    hideIndicator();
                }

                setTimeout(() => {
                    el.style.willChange = 'auto';
                }, DURATION * 1000 + 50);

                offsetY = 0;
            } else {
                el.style.willChange = 'auto';
            }
        }, { passive: true });

        el.addEventListener('touchcancel', () => {
            isDragging = false;
            isHorizontal = false;
            if (isRefreshing) return;
            if (offsetY !== 0 || usedHeightPull) {
                if (indicatorEl) indicatorEl.style.transition = '';

                if (usedHeightPull) {
                    hideIndicator();
                } else {
                    el.style.transition = `transform ${DURATION}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                    el.style.transform = 'translateY(0)';
                    hideIndicator();
                }
                setTimeout(() => {
                    el.style.willChange = 'auto';
                }, DURATION * 1000 + 50);
                offsetY = 0;
            } else {
                el.style.willChange = 'auto';
            }
        }, { passive: true });
    });
}

    
    async function saveBill() {
        if (!currentCategory) {
            showToast('请选择分类');
            return;
        }
        const amount = evaluateExpression(amountStr);
        if (!amount || amount <= 0) {
            showToast('请输入有效的金额');
            return;
        }
        const date = formatDateStr(selectedDate);
        if (!date) {
            showToast('请选择日期');
            return;
        }

        const billData = {
            type: currentType,
            category: currentCategory,
            amount: amount,
            date: date,
            note: noteContent || '',
            payment: selectedPayment,
            belong: selectedBelong,
        };

        if (editingBillId !== null) {
            await updateBill(editingBillId, billData);
        } else {
            await addBill(billData);
        }
    }




function updateBelongButtons() {
    if (!belongGroup) return;
    const buttons = belongGroup.querySelectorAll('.belong-btn');
    if (buttons.length < 3) return;
    const selfBtn = buttons[0];
    const otherBtn = buttons[1];
    const sharedBtn = buttons[2];

    if (currentPartner) {
        
        otherBtn.dataset.belong = '对方';
        otherBtn.textContent = '对方';
        otherBtn.style.display = '';
        sharedBtn.dataset.belong = '共同';
        sharedBtn.textContent = '共同';
        sharedBtn.style.display = '';
    } else {
        
        otherBtn.dataset.belong = '小知';
        otherBtn.textContent = '对方';
        otherBtn.style.display = '';
        sharedBtn.dataset.belong = '共同';
        sharedBtn.textContent = '共同';
        sharedBtn.style.display = '';
    }
    
    belongGroup.querySelectorAll('.belong-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.belong === selectedBelong);
    });
}

function resetModal() {
    editingBillId = null;
    amountStr = '0';
    updateAmountDisplay();
    resetNote();
    const today = new Date();
    selectedDate = new Date(today);
    updateDateTrigger();
    
    
    currentCategory = null;
    
    setType('expense', null, false, false, true);
    
    
    selectedBelong = '自己';
    updateBelongButtons();

    
    setPaymentMethod('微信');
    closeNoteModal();
    closeDatePicker();
}

function openAddModal() {
    resetModal();
    closePaymentSheet();

    
    buildCategorySlides();

    
    addModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    
    setType('expense', null, false, false, true);
}

function closeAddModal() {
    if (!addModalOverlay.classList.contains('show')) return;
    
    closePaymentSheet();
    closeNoteModal();
    closeDatePicker();
    
    
    addModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    
    clearTimeout(addModalOverlay._resetTimer);
    
    const fromDetail = addModalOverlay._fromDetail || false;
    
    addModalOverlay._resetTimer = setTimeout(() => {
        if (!addModalOverlay.classList.contains('show')) {
            resetModal();
            document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
            currentCategory = null;
            
            if (fromDetail && currentBill) {
                renderBillDetail(currentBill);
                loadComments(currentBillId);
                
                const detailPage = document.getElementById('page-detail');
                if (detailPage) {
                    detailPage.style.display = 'flex';
                    detailPage.classList.add('active');
                }
                currentPage = 'detail';
                
                
            } else {
                nav.classList.add('show');
            }
            
            editingBillId = null;
            addModalOverlay._fromDetail = false;
        }
    }, 400);
}

function openEditModal(bill) {
    
    buildCategorySlides();
    
    
    const fromDetail = (currentPage === 'detail');
    
    editingBillId = bill.id;
    
    
    
    currentType = bill.type;
    
    
    const toggleButtons = modalTypeToggle.querySelectorAll('button');
    toggleButtons.forEach(btn => {
        btn.classList.remove('active-expense', 'active-income');
        if (btn.dataset.type === bill.type) {
            btn.classList.add(bill.type === 'expense' ? 'active-expense' : 'active-income');
        }
    });
    
    
    const slide = bill.type === 'expense' ? slideExpense : slideIncome;
    
    
    const scrollContainer = document.getElementById('categoryScroll');
    if (scrollContainer) {
        const targetIndex = bill.type === 'expense' ? 0 : 1;
        const targetScroll = targetIndex * scrollContainer.clientWidth;
        scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
    
    
    setTimeout(() => {
        
        highlightCategory(slide, bill.category);
    }, 200);
    
    
    updateSliderPosition();
    
    amountStr = String(bill.amount);
    updateAmountDisplay();
    const billDate = new Date(bill.date);
    selectedDate = new Date(billDate);
    updateDateTrigger();
    noteContent = bill.note || '';
    updateNoteDisplay();
    if (bill.payment) setPaymentMethod(bill.payment);
    else setPaymentMethod('微信');
    
    updateBelongButtons();
    const dispBelong = bill.belong ? getDisplayBelong(bill) : '自己';
    selectedBelong = dispBelong;
    
    const buttonBelong = (!currentPartner && dispBelong === '小知') ? '小知' : dispBelong;
    belongGroup.querySelectorAll('.belong-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.belong === buttonBelong);
    });
    closePaymentSheet();
    closeNoteModal();
    closeDatePicker();
    
    
    if (fromDetail) {
        addModalOverlay._fromDetail = true;
        
    } else {
        addModalOverlay._fromDetail = false;
    }
    
    
    addModalOverlay.classList.remove('show');
    void addModalOverlay.offsetHeight;
    addModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

    
function showDeleteModal(id) {
    deleteTargetId = id;
    document.querySelector('.modal-title').textContent = '确认删除';
    document.querySelector('.modal-desc').textContent = '确定要删除这笔账单吗？';
    document.getElementById('modalConfirm').textContent = '删除';
    deleteModal.classList.add('show');
}

    function hideDeleteModal() {
        deleteModal.classList.remove('show');
        confirmCallback = null;
        deleteTargetId = null;
    }

function showConfirmDialog(title, desc, onConfirm, confirmText = '确定') {
    document.querySelector('.modal-title').textContent = title;
    document.querySelector('.modal-desc').textContent = desc;
    document.getElementById('modalConfirm').textContent = confirmText;
    confirmCallback = onConfirm;
    deleteModal.classList.add('show');
}


    
async function loadAllData(animate) {
    if (!token) return;
    try {
        if (animate) showLoading();
        
        const [categoriesResult, billsResult, budgetResult] = await Promise.allSettled([
            fetchCategoriesFromBackend(),
            apiCall('/bills', 'GET'),
            loadBudgetData()
        ]);
        
        if (billsResult.status === 'fulfilled') {
            allBills = billsResult.value.bills || [];
        } else {
            throw billsResult.reason;
        }
        
        if (!selectedMonthDate) {
            selectedMonthDate = new Date();
            updateMonthLabel();
        }
        renderHome();
        renderBills();
        renderProfile();
        updateBudgetDisplay();
        
        
        if (window.PetSystem) {
            window.PetSystem.loadStatus().catch(() => {});
        }
    } catch (err) {
        showToast('加载数据失败: ' + err.message);
    } finally {
        hideLoading(animate);
    }
}

async function refreshHomeData() {
    if (!token) return;
    try {
        const [billsResult, budgetResult] = await Promise.allSettled([
            apiCall('/bills', 'GET'),
            loadBudgetData()
        ]);
        if (billsResult.status === 'fulfilled') {
            allBills = billsResult.value.bills || [];
        } else {
            throw billsResult.reason;
        }
        if (!selectedMonthDate) {
            selectedMonthDate = new Date();
            updateMonthLabel();
        }
        renderHome();
        renderBills();
        updateBudgetDisplay();
    } catch (err) {
        showToast('刷新失败: ' + err.message);
    }
}


async function addBill(bill) {
    try {
        const data = await apiCall('/bills', 'POST', bill);
        if (data.bills && data.bills.length > 0) {
            allBills = data.bills || [];
        } else {
            const newBill = {
                ...bill,
                id: Date.now() + Math.random(),
                owner_username: currentUser.username,
                user_id: currentUser.id
            };
            allBills = [newBill, ...allBills];
        }
        
        
        if (!selectedMonthDate) {
            selectedMonthDate = new Date();
            updateMonthLabel();
        }
        
        renderHome();
        updateBudgetDisplay();
        renderProfile();
        renderBills();
        
        if (currentPage === 'stats') {
            renderStatsPage();
            updateStatsDateLabel();
        }
        
        closeAddModal();
        
        
        if (window.PetSystem && data.billId) {
            window.PetSystem.addBillScore(data.billId).catch(() => {});
        }
    } catch (err) {
        showToast('保存失败: ' + err.message);
    }
}

async function updateBill(id, bill) {
    try {
        const data = await apiCall('/bills/' + id, 'PUT', bill);
        allBills = data.bills || [];
        
        
        if (!selectedMonthDate) {
            selectedMonthDate = new Date();
            updateMonthLabel();
        }
        
        if (addModalOverlay._fromDetail && currentBillId) {
            const updatedBill = allBills.find(b => b.id === id);
            if (updatedBill) {
                currentBill = updatedBill;
            }
        }
        
        renderHome();
        updateBudgetDisplay();
        renderProfile();
        renderBills();
        
        if (currentPage === 'stats') {
            renderStatsPage();
            updateStatsDateLabel();
        }
        
        closeAddModal();
        showToast('更新成功');
    } catch (err) {
        
        try {
            await apiCall('/bills/' + id, 'DELETE');
            const data = await apiCall('/bills', 'POST', bill);
            allBills = data.bills || [];
            
            
            if (!selectedMonthDate) {
                selectedMonthDate = new Date();
                updateMonthLabel();
            }
            
            if (addModalOverlay._fromDetail && currentBillId) {
                const updatedBill = allBills.find(b => b.id === id);
                if (updatedBill) {
                    currentBill = updatedBill;
                }
            }
            
            renderHome();
            renderProfile();
            renderBills();
            
            if (currentPage === 'stats') {
                renderStatsPage();
                updateStatsDateLabel();
            }
            
            closeAddModal();
            showToast('更新成功');
        } catch (e2) {
            showToast('更新失败: ' + e2.message);
        }
    }
}
async function deleteBill(id) {
    try {
        const data = await apiCall('/bills/' + id, 'DELETE');
        allBills = data.bills || [];
        renderHome();
        updateBudgetDisplay();
        renderProfile();
        
        
        renderBills();
        
        
        if (currentPage === 'stats') {
            renderStatsPage();
            updateStatsDateLabel();
        }
    } catch (err) {
        showToast('删除失败: ' + err.message);
    } finally {
        hideDeleteModal();
    }
}


    
let _profileRefreshing = false;

function renderProfileUI() {
    if (!currentUser) return;

    
    const avatarImg = document.getElementById('profileAvatarImg');
    const avatarIcon = document.getElementById('profileAvatarIcon');

    if (avatarImg && avatarIcon) {
        if (currentUser.avatar && currentUser.avatar !== '') {
            avatarImg.src = currentUser.avatar;
            avatarImg.style.display = 'block';
            avatarIcon.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarIcon.style.display = 'block';
        }
    }

    
    const nameEl = document.getElementById('profileName');
    const displayName = profileInfoState.nickname || currentUser?.nickname || currentUser?.uid || '用户';
    if (nameEl) nameEl.textContent = displayName;

    
    const uidEl = document.getElementById('profileUid');
    if (uidEl) {
        uidEl.textContent = 'UID: ' + (currentUser?.uid || '--------');
    }

    
    updateThemeBadge();
    
    updatePartnerUI();
    rebindPartnerAvatarClick();
    updateHomeAvatar();
    updateBudgetDisplay();
    updateWalletDisplay();

    const securityPage = document.getElementById('page-account-security');
    if (securityPage && securityPage.classList.contains('active')) {
        updateAccountSecurityStatus();
    }
}

function renderProfile() {
    if (!currentUser) return;

    
    renderProfileUI();

    
    if (_profileRefreshing) return;
    _profileRefreshing = true;

    
    Promise.all([
        fetchPartnerStatus(),
        loadProfileInfo()
    ]).then(() => {
        if (currentPage === 'profile') renderProfileUI();
    }).finally(() => {
        _profileRefreshing = false;
    });
}

function updateThemeBadge() {
    const themeItem = document.getElementById('profileThemeColor');
    if (!themeItem) return;
    
    const badge = themeItem.querySelector('.list-badge');
    if (!badge) return;
    
    
    const theme = THEME_PRESETS.find(t => t.id === currentThemeId);
    if (theme) {
        badge.textContent = theme.name;
        
        badge.style.background = theme.primary;
        badge.style.color = '#ffffff';
        badge.style.borderRadius = '12px';
        badge.style.padding = '2px 12px';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '500';
        badge.style.transition = 'all 0.3s ease';
    } else {
        badge.textContent = '默认';
        badge.style.background = '';
        badge.style.color = '';
    }
}
function initCropper() {
    const image = document.getElementById('avatarCropImage');
    if (!image) return;
    
    
    if (!image.complete || image.naturalWidth === 0) {
        
        image.onload = function() {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            cropper = new Cropper(image, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                cropBoxResizable: true,
                cropBoxMovable: true,
                background: true,
                minContainerWidth: 200,
                minContainerHeight: 200,
            });
        };
        return;
    }
    
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        cropBoxResizable: true,
        cropBoxMovable: true,
        background: true,
        minContainerWidth: 200,
        minContainerHeight: 200,
    });
}

function updateHomeAvatar() {
    if (currentUser && currentUser.avatar) {
        homeAvatarImg.src = currentUser.avatar;
        homeAvatarImg.style.display = 'block';
        homeAvatarIcon.style.display = 'none';
    } else {
        homeAvatarImg.style.display = 'none';
        homeAvatarIcon.style.display = 'block';
    }
}

function updatePartnerUI() {
    const wrapper = document.querySelector('.profile-partner-avatar-wrapper');
    const img = document.getElementById('partnerAvatarImg');
    const defaultIcon = document.getElementById('partnerDefaultIcon');
    const addIcon = document.getElementById('partnerAddIcon');
    const inviteBubble = document.getElementById('inviteBubble');
    const partnerStatusText = document.getElementById('partnerStatusText');
    const statusArrow = document.getElementById('partnerStatusArrow');
    
    if (!wrapper) return;
    
    if (currentPartner) {
        wrapper.classList.add('has-partner');
        
        
        if (currentPartner.avatar && currentPartner.avatar !== '') {
            img.src = currentPartner.avatar;
            img.style.display = 'block';
            if (defaultIcon) defaultIcon.style.display = 'none';
            
            img.onerror = function() {
                this.style.display = 'none';
                if (defaultIcon) defaultIcon.style.display = 'block';
            };
        } else {
            img.style.display = 'none';
            if (defaultIcon) defaultIcon.style.display = 'block';
        }
        
        
        if (addIcon) {
            addIcon.style.display = 'none';
        }
        
        if (inviteBubble) {
            inviteBubble.style.display = 'none';
        }
        
        
        const displayName = currentPartner.nickname || currentPartner.uid || '搭子';
        if (partnerStatusText) {
            partnerStatusText.textContent = '已绑定 ' + displayName;
            partnerStatusText.className = 'partner-status bound';
        }
        if (statusArrow) {
            statusArrow.innerHTML = displayName + ' <i class="ri-arrow-right-s-line"></i>';
        }
    } else {
        wrapper.classList.remove('has-partner');
        
        
        img.style.display = 'none';
        
        if (defaultIcon) defaultIcon.style.display = 'none';
        
        if (addIcon) {
            addIcon.style.display = 'flex';
        }
        if (inviteBubble) {
            inviteBubble.style.display = 'block';
            inviteBubble.textContent = '邀请搭子';
        }
        
        
        if (partnerStatusText) {
            partnerStatusText.textContent = '未绑定';
            partnerStatusText.className = 'partner-status';
        }
        if (statusArrow) {
            statusArrow.innerHTML = '去绑定 <i class="ri-arrow-right-s-line"></i>';
        }
    }

    
    updateBelongButtons();
}


function goBackFromDetail() {
    const target = previousPage || 'home';
    const detailPage = document.getElementById('page-detail');
    detailPage.classList.remove('active');
    setTimeout(() => { detailPage.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }

    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });

    
    nav.classList.add('show');
    
    currentPage = target;
    if (target !== 'budget' && target !== 'stats') stopBudgetRealtimeSync();

    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        enterStatsPage();
    } else if (target === 'profile') renderProfile();
}

async function viewBillDetail(id) {
    if (currentPage === 'search') {
        previousPage = 'search';
    } else {
        previousPage = currentPage;
    }

    currentBillId = id;

    
    const pageEl = document.getElementById('page-detail');
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    currentPage = 'detail';


    const bill = allBills.find(b => b.id === id);
    if (!bill) {
        showToast('账单不存在');
        setTimeout(goBackFromDetail, 500);
        return;
    }
    currentBill = bill;
    renderBillDetail(bill);
    
    const commentsList = document.getElementById('commentsList');
    if (commentsList) {
        commentsList.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="ri-chat-3-line"></i></div><div class="empty-text">加载评论中...</div></div>';
    }
    setTimeout(() => {
        if (currentPage === 'detail' && currentBillId === id) {
            loadComments(id);
        }
    }, 380);
}

function getAvatarHtml(user, size = 'default') {
    if (!user) {
        return `<div class="avatar-item"><i class="ri-user-fill"></i></div>`;
    }
    if (user.avatar) {
        return `<div class="avatar-item"><img src="${user.avatar}" alt="${user.username || '用户'}" /></div>`;
    }
    return `<div class="avatar-item"><i class="ri-user-fill"></i></div>`;
}

function renderBillDetail(bill) {
    const avatarsContainer = $('#detailAvatars');
    const ownerLabel = $('#detailOwnerLabel');
    const recordBy = $('#detailRecordBy');

    
    const belong = getDisplayBelong(bill);
    let avatarHtml = '';
    let labelText = '';
    
    function getUserAvatarHtml(user, size = 46) {
        if (!user) {
            return `<div class="avatar-item" style="width:${size}px;height:${size}px;font-size:${size*0.5}px;border:2px solid var(--bg-card);flex-shrink:0;border-radius:50%;overflow:hidden;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;color:var(--primary);"><i class="ri-user-fill"></i></div>`;
        }
        if (user.avatar) {
            return `<div class="avatar-item" style="width:${size}px;height:${size}px;border:2px solid var(--bg-card);flex-shrink:0;border-radius:50%;overflow:hidden;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;"><img src="${user.avatar}" alt="${user.username || '用户'}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
        }
        return `<div class="avatar-item" style="width:${size}px;height:${size}px;font-size:${size*0.5}px;border:2px solid var(--bg-card);flex-shrink:0;border-radius:50%;overflow:hidden;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;color:var(--primary);"><i class="ri-user-fill"></i></div>`;
    }
    
function getDisplayName(user, defaultName) {
    if (!user) return defaultName || '用户';
    return user.nickname || user.uid || defaultName || '用户';
}
    
    const typeLabel = bill.type === 'income' ? '收入' : '支出';
    
    let recordByName = '未知用户';
    if (bill.owner_nickname) {
        if (currentUser && (bill.owner_nickname === currentUser.nickname || bill.owner_nickname === currentUser.uid)) {
            recordByName = getDisplayName(currentUser, '我');
        } else if (currentPartner && (bill.owner_nickname === currentPartner.nickname || bill.owner_nickname === currentPartner.uid)) {
            recordByName = getDisplayName(currentPartner, '对方');
        } else {
            recordByName = bill.owner_nickname;
        }
    } else {
        if (belong === '自己') {
            recordByName = getDisplayName(currentUser, '我');
        } else if (belong === '对方') {
            recordByName = getDisplayName(currentPartner, '对方');
        } else {
            recordByName = getDisplayName(currentUser, '我');
        }
    }
    
    if (belong === '自己') {
        avatarHtml = getUserAvatarHtml(currentUser, 46);
        const myName = getDisplayName(currentUser, '我');
        labelText = `${myName}的${typeLabel}`;
    } else if (belong === '对方') {
        if (currentPartner) {
            avatarHtml = getUserAvatarHtml(currentPartner, 46);
            const partnerName = getDisplayName(currentPartner, '对方');
            labelText = `${partnerName}的${typeLabel}`;
        } else {
            avatarHtml = getUserAvatarHtml(null, 46);
            labelText = `对方的${typeLabel}`;
        }
    } else if (belong === '共同') {
        const avatarSize = 46;
        const overlapOffset = 16;

        if (currentPartner) {
            
            const selfHtml = currentUser ? getUserAvatarHtml(currentUser, avatarSize) : getUserAvatarHtml(null, avatarSize);
            const partnerHtml = getUserAvatarHtml(currentPartner, avatarSize);
            avatarHtml = `
                <div style="display:flex;align-items:center;justify-content:center;height:56px;">
                    <div style="border-radius:50%;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);z-index:2;position:relative;flex-shrink:0;">
                        ${selfHtml}
                    </div>
                    <div style="border-radius:50%;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);z-index:1;position:relative;margin-left:-${overlapOffset}px;flex-shrink:0;">
                        ${partnerHtml}
                    </div>
                </div>
            `;
            labelText = `共同${typeLabel}`;
        } else {
            
            const selfHtml = currentUser ? getUserAvatarHtml(currentUser, avatarSize) : getUserAvatarHtml(null, avatarSize);
            const xiaoZhiHtml = `<div class="avatar-item" style="width:${avatarSize}px;height:${avatarSize}px;font-size:22px;border:2px solid var(--bg-card);flex-shrink:0;border-radius:50%;overflow:hidden;background:#4F9BFA;display:flex;align-items:center;justify-content:center;color:#fff;letter-spacing:-0.5px;">知</div>`;
            avatarHtml = `
                <div style="display:flex;align-items:center;justify-content:center;height:56px;">
                    <div style="border-radius:50%;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);z-index:2;position:relative;flex-shrink:0;">
                        ${xiaoZhiHtml}
                    </div>
                    <div style="border-radius:50%;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);z-index:1;position:relative;margin-left:-${overlapOffset}px;flex-shrink:0;">
                        ${selfHtml}
                    </div>
                </div>
            `;
            labelText = `小知和我的${typeLabel}`;
        }
    } else if (belong === '小知') {
        
        avatarHtml = `<div class="avatar-item" style="width:46px;height:46px;font-size:22px;border:2px solid var(--bg-card);flex-shrink:0;border-radius:50%;overflow:hidden;background:#4F9BFA;display:flex;align-items:center;justify-content:center;color:#fff;letter-spacing:-0.5px;">知</div>`;
        labelText = `小知的${typeLabel}`;
    } else {
        avatarHtml = getUserAvatarHtml(currentUser, 56);
        const myName = getDisplayName(currentUser, '我');
        labelText = `${myName}的${typeLabel}`;
    }
    
    avatarsContainer.innerHTML = avatarHtml;
    ownerLabel.textContent = labelText;
    recordBy.textContent = `来源：${recordByName}的手动记账`;
    
    const cats = getCategoriesByType(bill.type);
    const cat = cats.find(c => c.label === bill.category);
    const iconHtml = cat ? `<i class="fas ${cat.icon || 'fa-tag'}"></i> ` : '';
    $('#detailCategory').innerHTML = iconHtml + (bill.category || '-');
    
    
    const amountVal = bill.amount || 0;
    $('#detailAmount').textContent = '¥' + amountVal.toFixed(2);
    $('#detailAmount').className = 'field-value ' + (bill.type === 'income' ? 'income' : 'expense');
    
    $('#detailPayment').textContent = bill.payment || '-';
$('#detailDate').textContent = bill.date ? formatDateDisplayCN(bill.date) : '-';
    $('#detailNote').textContent = bill.note || '无备注';
}



async function loadComments(billId) {
    try {
        const data = await apiCall('/bills/' + billId + '/comments', 'GET');
        renderComments(data.comments || []);
    } catch (err) {
        console.error('加载评论失败:', err);
$('#commentsList').innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="ri-error-warning-line"></i></div><div class="empty-text">加载评论失败，请重试</div></div>`;
    }
}

function renderComments(comments) {
    const container = $('#commentsList');
    if (!comments || comments.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="ri-chat-3-line"></i></div><div class="empty-text">还没有评论，来说点什么吧</div></div>`;
        return;
    }
    let html = '';
    comments.forEach(c => {
        const isOwn = currentUser && c.user_id === currentUser.id;
        const isPartner = currentPartner && c.user_id === currentPartner.id;
        const canDelete = isOwn || isPartner;
        const displayName = c.nickname || c.uid || '用户';
        const avatarHtml = getAvatarHtml({ username: displayName, avatar: c.avatar });
        const time = formatBeijingTime(c.created_at);
        const actionsHtml = canDelete
            ? `<div class="comment-item-actions"><button class="comment-item-delete" data-id="${c.id}">删除</button></div>`
            : '';
        html += `
            <div class="comment-item-wrapper${canDelete ? ' swipeable' : ''}" data-comment-id="${c.id}">
                <div class="comment-item ${isOwn ? 'own-comment' : ''}">
                    <div class="comment-avatar">${avatarHtml}</div>
                    <div class="comment-body">
                        <div class="comment-username">${escapeHtml(displayName)} <span class="comment-time">${time}</span></div>
                        <div class="comment-content">${escapeHtml(c.content)}</div>
                    </div>
                </div>
                ${actionsHtml}
            </div>
        `;
    });
    container.innerHTML = html;

    if (container.querySelector('.comment-item-wrapper.swipeable')) {
        initCommentSwipeEvents(container);
    }
}


let commentSwipeActive = null;
let commentSwipeState = new Map();

function getCommentSwipeState(wrapper) {
    if (!commentSwipeState.has(wrapper)) {
        commentSwipeState.set(wrapper, {
            startX: 0, startY: 0, offset: 0, isOpen: false,
            maxOffset: 0, isDragging: false, directionDetected: false
        });
    }
    return commentSwipeState.get(wrapper);
}

function closeCommentSwiped(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('swiped');
    const content = wrapper.querySelector('.comment-item');
    if (content) content.style.transform = '';
    const state = commentSwipeState.get(wrapper);
    if (state) { state.isOpen = false; state.offset = 0; }
}

function closeAllCommentSwiped() {
    document.querySelectorAll('.comment-item-wrapper.swiped').forEach(w => closeCommentSwiped(w));
}

function initCommentSwipeEvents(container) {
    container.addEventListener('touchstart', function(e) {
        const wrapper = e.target.closest('.comment-item-wrapper.swipeable');
        if (!wrapper) return;
        if (e.target.closest('.comment-item-actions')) return;
        const content = wrapper.querySelector('.comment-item');
        if (!content) return;

        const touch = e.touches[0];
        const state = getCommentSwipeState(wrapper);
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.isDragging = true;
        state.directionDetected = false;
        state.maxOffset = wrapper.querySelector('.comment-item-actions')?.offsetWidth || 70;
        state.offset = state.isOpen ? -state.maxOffset : 0;
        commentSwipeActive = wrapper;
        document.querySelectorAll('.comment-item-wrapper.swiped').forEach(w => {
            if (w !== wrapper) closeCommentSwiped(w);
        });
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!commentSwipeActive) return;
        const state = commentSwipeState.get(commentSwipeActive);
        if (!state || !state.isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;

        if (!state.directionDetected) {
            if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                state.directionDetected = true;
            } else if (Math.abs(deltaY) > 8) {
                state.isDragging = false;
                return;
            }
        }
        if (!state.isDragging || !state.directionDetected) return;

        e.preventDefault();
        let newOffset = deltaX;
        if (state.isOpen) newOffset = -state.maxOffset + deltaX;
        newOffset = Math.min(0, Math.max(-state.maxOffset, newOffset));
        state.offset = newOffset;
        const content = commentSwipeActive.querySelector('.comment-item');
        if (content) {
            content.style.transform = `translateX(${newOffset}px)`;
            content.style.transition = 'none';
        }
    }, { passive: false });

    container.addEventListener('touchend', function() {
        if (!commentSwipeActive) return;
        const state = commentSwipeState.get(commentSwipeActive);
        if (!state || !state.isDragging) { commentSwipeActive = null; return; }
        state.isDragging = false;
        const content = commentSwipeActive.querySelector('.comment-item');
        const threshold = 30;
        const shouldOpen = state.offset < -threshold;
        if (shouldOpen) {
            state.isOpen = true;
            state.offset = -state.maxOffset;
            commentSwipeActive.classList.add('swiped');
            if (content) {
                content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                content.style.transform = `translateX(${-state.maxOffset}px)`;
            }
        } else {
            state.isOpen = false;
            state.offset = 0;
            commentSwipeActive.classList.remove('swiped');
            if (content) {
                content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                content.style.transform = 'translateX(0)';
            }
        }
        commentSwipeActive = null;
    }, { passive: true });

    
    container.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.comment-item-delete');
        if (deleteBtn) {
            const commentId = parseInt(deleteBtn.dataset.id);
            if (commentId) handleCommentDelete(commentId);
            return;
        }
        const wrapper = e.target.closest('.comment-item-wrapper.swiped');
        if (wrapper) {
            closeCommentSwiped(wrapper);
        }
    });
}
async function handleCommentDelete(commentId) {
    showConfirmDialog(
        '确认删除',
        '确定要删除这条评论吗？',
        async function() {
            try {
                const newComments = await deleteCommentApi(commentId);
                renderComments(newComments);
                showToast('评论已删除');
            } catch (err) {
                showToast('删除失败: ' + err.message);
            } finally {
                hideDeleteModal(); 
            }
        }
    );
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendComment() {
    const input = $('#commentInput');
    const content = input.value.trim();
    if (!content) {
        showToast('请输入评论内容');
        return;
    }
    if (!currentBillId) {
        showToast('请先选择账单');
        return;
    }
    try {
        const sendBtn = $('#commentSendBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = '发送中...';
        const data = await apiCall('/bills/' + currentBillId + '/comments', 'POST', { content });
        renderComments(data.comments || []);
        input.value = '';
        showToast('评论发送成功');
        
        if (window.PetSystem && data.petExp) {
            window.PetSystem.applyCommentExp(data.petExp);
        }
    } catch (err) {
        showToast('评论发送失败: ' + err.message);
    } finally {
        const sendBtn = $('#commentSendBtn');
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';
    }
}



function showDetailMenu() {
    const overlay = document.getElementById('detailMenuOverlay');
    if (!overlay) return;
    overlay.classList.add('show');
}

function hideDetailMenu() {
    const overlay = document.getElementById('detailMenuOverlay');
    if (overlay) overlay.classList.remove('show');
}

function handleDetailMenuEdit() {
    hideDetailMenu();
    if (!currentBill) {
        showToast('账单数据不存在');
        return;
    }
    
    openEditModal(currentBill);
}

function handleDetailMenuDelete() {
    hideDetailMenu();
    if (!currentBill) {
        showToast('账单数据不存在');
        return;
    }
    const id = currentBill.id;
    showConfirmDialog('确认删除', '确定要删除这笔账单吗？', async function() {
        await deleteBill(id);
        
        goBackFromDetail();
    });
}




const UPDATE_CONFIG = {
    githubRepo: 'WellLedger/well-website',
    apkPrefix: 'WELL'
};


let currentAppVersion = '1.0.1';
let currentAppVersionCode = 100000001;


function initAppVersion() {
    try {
        if (window.plus && plus.runtime) {
            const v = plus.runtime.version;
            const vc = plus.runtime.versionCode;
            if (v) currentAppVersion = v;
            if (vc) currentAppVersionCode = parseInt(vc) || currentAppVersionCode;
        }
    } catch (e) {  }
    
    const vEl = document.getElementById('aboutVersion');
    if (vEl) vEl.textContent = '版本 v' + currentAppVersion;
}


const CHANGELOG_CACHE_TTL = 10 * 60 * 1000;
let changelogCache = {
    releases: null,
    fetchedAt: 0,
    fetching: false
};


let changelogScrollLock = false;



function changelogBodyToHtml(text) {
    let html = escapeHtml((text || '').replace(/\r\n/g, '\n'))
        .replace(/^#{1,4}[ \t]*(.+)$/gm, '<strong>$1</strong>')
        .replace(/^[-*][ \t]*(.+)$/gm, '<li>$1</li>');
    if (html.indexOf('<li>') !== -1) {
        html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        
        html = html.replace(/<\/li>\s*\n\s*<li>/g, '</li><li>');
        html = html.replace(/<ul>\s*\n\s*<li>/g, '<ul><li>');
        html = html.replace(/<\/li>\s*\n\s*<\/ul>/g, '</li></ul>');
    }
    
    html = html.replace(/\n+/g, '<br>');
    return html || '暂无更新说明';
}


function formatReleaseDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}


function fetchGithubReleases(callback) {
    if (!UPDATE_CONFIG.githubRepo) {
        callback(new Error('未配置 GitHub 仓库地址'), null);
        return;
    }
    const apiUrl = 'https://api.github.com/repos/' + UPDATE_CONFIG.githubRepo + '/releases?per_page=30';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.timeout = 15000;

    xhr.onload = function() {
        const status = xhr.status;
        if (status >= 200 && status < 300) {
            try {
                const list = JSON.parse(xhr.responseText);
                callback(null, Array.isArray(list) ? list : []);
            } catch (e) {
                callback(new Error('解析更新日志失败'), null);
            }
        } else if (status === 403) {
            callback(new Error('请求过于频繁，请稍后再试'), null);
        } else if (status === 404) {
            callback(new Error('未找到版本信息（404）'), null);
        } else {
            callback(new Error('加载失败（' + status + '）'), null);
        }
    };
    xhr.onerror = function() { callback(new Error('网络连接失败，请检查网络'), null); };
    xhr.ontimeout = function() { callback(new Error('请求超时，请稍后重试'), null); };
    xhr.send();
}


function isChangelogPageActive() {
    const el = document.getElementById('page-changelog');
    return !!(el && el.classList.contains('active') && currentPage === 'changelog');
}


function renderChangelogPage(releases) {
    const toc = document.getElementById('changelogToc');
    const content = document.getElementById('changelogContent');
    if (!toc || !content) return;

    if (!releases || releases.length === 0) {
        toc.innerHTML = '';
        content.innerHTML =
            '<div class="changelog-state">' +
                '<i class="ri-inbox-line changelog-state-icon"></i>' +
                '<div class="changelog-state-text">暂无更新记录</div>' +
            '</div>';
        return;
    }

    let tocHtml = '';
    let secHtml = '';
    for (let i = 0; i < releases.length; i++) {
        const rel = releases[i];
        const version = 'v' + String(rel.tag_name || '').replace(/^v/i, '');
        const name = (rel.name || '').trim();
        const date = formatReleaseDate(rel.published_at);

        
        tocHtml +=
            '<div class="changelog-toc-item' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
                '<span class="changelog-toc-version">' + escapeHtml(version) + '</span>' +
                (date ? '<span class="changelog-toc-date">' + escapeHtml(date.slice(5)) + '</span>' : '') +
            '</div>';

        
        let badges = '';
        if (i === 0) badges += '<span class="changelog-badge latest">最新</span>';
        if (rel.prerelease) badges += '<span class="changelog-badge pre">预发布</span>';

        secHtml +=
            '<div class="changelog-section" id="changelogSec' + i + '">' +
                '<div class="changelog-section-top">' +
                    '<span class="changelog-section-version">' + escapeHtml(version) + '</span>' +
                    badges +
                    '<span class="changelog-section-date">' + escapeHtml(date) + '</span>' +
                '</div>' +
                (name && name.toLowerCase() !== version.toLowerCase()
                    ? '<div class="changelog-section-name">' + escapeHtml(name) + '</div>' : '') +
                '<div class="changelog-section-body">' + changelogBodyToHtml(rel.body) + '</div>' +
            '</div>';
    }
    toc.innerHTML = tocHtml;
    content.innerHTML = secHtml;
    content.scrollTop = 0;
}


function showChangelogLoading() {
    const toc = document.getElementById('changelogToc');
    const content = document.getElementById('changelogContent');
    if (toc) toc.innerHTML = '';
    if (!content) return;
    content.innerHTML =
        '<div class="changelog-state">' +
            '<div class="changelog-spinner"></div>' +
            '<div class="changelog-state-text">正在加载更新日志...</div>' +
        '</div>';
}


function showChangelogError(message) {
    const toc = document.getElementById('changelogToc');
    const content = document.getElementById('changelogContent');
    if (toc) toc.innerHTML = '';
    if (!content) return;
    content.innerHTML =
        '<div class="changelog-state">' +
            '<i class="ri-cloud-off-line changelog-state-icon"></i>' +
            '<div class="changelog-state-text">' + escapeHtml(message || '加载失败') + '</div>' +
            '<button class="changelog-retry-btn" id="changelogRetryBtn">重试</button>' +
        '</div>';
}


function loadChangelog() {
    if (changelogCache.fetching) return;
    changelogCache.fetching = true;
    fetchGithubReleases(function(err, list) {
        changelogCache.fetching = false;
        if (err) {
            
            if (!changelogCache.releases && isChangelogPageActive()) {
                showChangelogError(err.message);
            }
            console.warn('[Changelog] 获取 Releases 失败:', err.message);
            return;
        }
        changelogCache.releases = list;
        changelogCache.fetchedAt = Date.now();
        if (isChangelogPageActive()) {
            renderChangelogPage(list);
        }
    });
}


function openChangelogPage() {
    if (currentPage === 'changelog') return;
    const pageEl = document.getElementById('page-changelog');
    if (!pageEl) return;
    pageBackStack.push(currentPage);
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    currentPage = 'changelog';

    const cacheValid = changelogCache.releases &&
        (Date.now() - changelogCache.fetchedAt) < CHANGELOG_CACHE_TTL;

    if (cacheValid) {
        renderChangelogPage(changelogCache.releases);
        return;
    }
    
    if (changelogCache.releases) {
        renderChangelogPage(changelogCache.releases);
    } else {
        showChangelogLoading();
    }
    loadChangelog();
}


function closeChangelogPage() {
    const pageEl = document.getElementById('page-changelog');
    if (!pageEl) return;
    const target = pageBackStack.length > 0 ? pageBackStack.pop() : 'about';
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    restoreFromBack(target);
}


function updateChangelogActiveIndex(idx) {
    const toc = document.getElementById('changelogToc');
    if (!toc) return;
    const items = toc.querySelectorAll('.changelog-toc-item');
    for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === idx);
    }
    const active = items[idx];
    if (active && active.scrollIntoView) {
        try { active.scrollIntoView({ block: 'nearest' }); } catch (e) {  }
    }
}


function computeChangelogActiveIndex() {
    const content = document.getElementById('changelogContent');
    if (!content) return 0;
    const sections = content.querySelectorAll('.changelog-section');
    const base = content.getBoundingClientRect().top + 56; 
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= base) idx = i;
        else break;
    }
    return idx;
}


function initChangelogPageEvents() {
    
    document.getElementById('aboutLogBtn')?.addEventListener('click', openChangelogPage);

    
    document.getElementById('changelogBackBtn')?.addEventListener('click', closeChangelogPage);

    
    const toc = document.getElementById('changelogToc');
    if (toc) {
        toc.addEventListener('click', function(e) {
            const item = e.target && e.target.closest ? e.target.closest('.changelog-toc-item') : null;
            if (!item) return;
            const idx = parseInt(item.dataset.index, 10);
            const section = document.getElementById('changelogSec' + idx);
            const content = document.getElementById('changelogContent');
            if (!section || !content) return;
            const top = section.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 10;
            changelogScrollLock = true;
            try {
                content.scrollTo({ top: top, behavior: 'smooth' });
            } catch (e2) {
                content.scrollTop = top; 
            }
            updateChangelogActiveIndex(idx);
            
            setTimeout(function() { changelogScrollLock = false; }, 700);
        });
    }

    const content = document.getElementById('changelogContent');
    if (content) {
        
        let ticking = false;
        content.addEventListener('scroll', function() {
            if (ticking || changelogScrollLock) return;
            ticking = true;
            requestAnimationFrame(function() {
                ticking = false;
                if (!isChangelogPageActive()) return;
                updateChangelogActiveIndex(computeChangelogActiveIndex());
            });
        }, { passive: true });

        
        content.addEventListener('click', function(e) {
            const btn = e.target && e.target.closest ? e.target.closest('#changelogRetryBtn') : null;
            if (btn) {
                showChangelogLoading();
                loadChangelog();
            }
        });
    }
}


const TERMS_VERSION_URL = 'https://wellledger.github.io/well-docs/terms-version.json';

let termsUpdateState = {
    remoteVersion: '',
    message: ''
};

function checkTermsVersion(silent) {
    const storedVersion = localStorage.getItem('terms_version') || '';

    const xhr = new XMLHttpRequest();
    xhr.open('GET', TERMS_VERSION_URL + '?t=' + Date.now(), true);
    xhr.timeout = 10000;

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const data = JSON.parse(xhr.responseText);
                const remoteVersion = String(data.version || '1');

                if (silent) {
                    localStorage.setItem('terms_version', remoteVersion);
                } else if (!storedVersion) {
                    localStorage.setItem('terms_version', remoteVersion);
                } else if (remoteVersion !== storedVersion) {
                    termsUpdateState.remoteVersion = remoteVersion;
                    termsUpdateState.message = data.message || '用户协议和隐私政策已更新，请重新阅读并同意';
                    showTermsUpdateModal();
                }
            } catch (e) {
                console.warn('[Terms] 解析版本信息失败:', e);
            }
        }
    };

    xhr.onerror = function() {};
    xhr.ontimeout = function() {};
    xhr.send();
}

function showTermsUpdateModal() {
    const overlay = document.getElementById('termsModalOverlay');
    if (!overlay) return;

    const msgEl = document.getElementById('termsModalMessage');
    if (msgEl) msgEl.textContent = termsUpdateState.message;

    requestAnimationFrame(function() {
        overlay.classList.add('show');
    });
    try { refreshStatusBar(); } catch(e) {}
}

function closeTermsUpdateModal() {
    const overlay = document.getElementById('termsModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    try { refreshStatusBar(); } catch(e) {}
}

function agreeToTermsUpdate() {
    localStorage.setItem('terms_version', termsUpdateState.remoteVersion);
    closeTermsUpdateModal();
}

function initTermsModalEvents() {
    document.getElementById('termsModalLater')?.addEventListener('click', closeTermsUpdateModal);
    document.getElementById('termsModalAgree')?.addEventListener('click', agreeToTermsUpdate);
    document.getElementById('termsModalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeTermsUpdateModal();
    });
}

    
function openSettings() {
    if (paymentSheet.classList.contains('show')) closePaymentSheet();
    if (noteModal.classList.contains('show')) closeNoteModal();
    if (dateModal.classList.contains('show')) closeDatePicker();
    
    settingsCurrentType = currentType || 'expense';
    settingsOverlay.classList.add('show');
    renderSettingsList(settingsCurrentType);
    settingsTabs.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.stype === settingsCurrentType);
    });
    requestAnimationFrame(() => updateSettingsTabSlider());
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    settingsOverlay.classList.remove('show');
    document.body.style.overflow = '';
    closeCatAddModal();
    closeCatEditModal();

    
    if (settingsFromProfile) {
        settingsFromProfile = false;
        
        if (addModalOverlay.classList.contains('show')) {
            addModalOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        resetModal();
        document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
        currentCategory = null;
    }
}

    function renderSettingsList(type) {
        const cats = getCategoriesByType(type);
        if (!cats || cats.length === 0) {
settingsList.innerHTML = `
    <div class="settings-empty">
        <div class="empty-icon"><i class="ri-folder-line"></i></div>
        <div class="empty-text">暂无类目，点击下方添加</div>
    </div>
`;
            return;
        }
        let html = '';
        cats.forEach((cat) => {
            const isDefault = cat.isDefault === true;
            html += `
    <div class="settings-item" data-id="${cat.id}" data-type="${type}">
        <button class="item-delete can-delete" data-id="${cat.id}">
            <i class="ri-forbid-fill"></i>
        </button>
        <div class="item-icon"><i class="fas ${cat.icon || 'fa-tag'}"></i></div>
        <span class="item-name">${cat.label}</span>
        <div class="item-actions">
            <button class="item-edit" data-id="${cat.id}" data-type="${type}">
                <i class="ri-pencil-line"></i>
            </button>
            <button class="item-drag" data-id="${cat.id}">
                <i class="ri-menu-line"></i>
            </button>
        </div>
    </div>
`;
        });
        settingsList.innerHTML = html;

        settingsList.querySelectorAll('.item-delete:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                const type = this.closest('.settings-item').dataset.type;
                handleDeleteCategory(type, id);
            });
        });

        settingsList.querySelectorAll('.item-edit').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                const type = this.dataset.type;
                openEditCategoryModal(type, id);
            });
        });

        initDragSort(settingsList);
        const wrapper = document.getElementById('settingsListWrapper');
        if (wrapper) {
            wrapper.style.overflowY = 'auto';
            void wrapper.offsetHeight;
        }
    }

    
    let dragStateSettings = {
        dragItem: null,
        dragOverItem: null,
        startY: 0,
        offsetY: 0,
        isDragging: false,
        clone: null,
        touchId: null,
        longPressTimer: null,
        isLongPressTriggered: false,
        startX: 0,
        startYPos: 0,
        scrollInterval: null,
        lastTouchY: 0,
    };

    function updateDragTarget(clientY) {
        if (!dragStateSettings.isDragging || !dragStateSettings.dragItem) return;
        const items = settingsList.querySelectorAll('.settings-item');
        let targetItem = null;
        items.forEach(item => {
            if (item === dragStateSettings.dragItem) return;
            const r = item.getBoundingClientRect();
            const threshold = 20;
            if (clientY > r.top - threshold && clientY < r.bottom + threshold) {
                targetItem = item;
            }
        });
        if (targetItem && targetItem !== dragStateSettings.dragOverItem) {
            dragStateSettings.dragOverItem = targetItem;
            const parent = settingsList;
            const allItems = parent.querySelectorAll('.settings-item');
            const dragIndex = Array.from(allItems).indexOf(dragStateSettings.dragItem);
            const targetIndex = Array.from(allItems).indexOf(targetItem);
            if (dragIndex < targetIndex) {
                parent.insertBefore(dragStateSettings.dragItem, targetItem.nextSibling);
            } else {
                parent.insertBefore(dragStateSettings.dragItem, targetItem);
            }
        }
    }

    function initDragSort(container) {
        container.removeEventListener('touchstart', onDragTouchStart);
        container.removeEventListener('touchmove', onDragTouchMove);
        container.removeEventListener('touchend', onDragTouchEnd);
        container.removeEventListener('touchcancel', onDragTouchEnd);
        container.addEventListener('touchstart', onDragTouchStart, { passive: true });
        container.addEventListener('touchmove', onDragTouchMove, { passive: false });
        container.addEventListener('touchend', onDragTouchEnd, { passive: true });
        container.addEventListener('touchcancel', onDragTouchEnd, { passive: true });
    }

    function onDragTouchStart(e) {
        const dragBtn = e.target.closest('.item-drag');
        if (!dragBtn) return;
        const item = dragBtn.closest('.settings-item');
        if (!item) return;

        const touch = e.touches[0];
        dragStateSettings.dragItem = item;
        dragStateSettings.startY = touch.clientY;
        dragStateSettings.startX = touch.clientX;
        dragStateSettings.startYPos = touch.clientY;
        dragStateSettings.isDragging = false;
        dragStateSettings.isLongPressTriggered = false;
        dragStateSettings.touchId = touch.identifier;
        const rect = item.getBoundingClientRect();
        dragStateSettings.offsetY = touch.clientY - rect.top;

        if (dragStateSettings.longPressTimer) {
            clearTimeout(dragStateSettings.longPressTimer);
            dragStateSettings.longPressTimer = null;
        }

        dragStateSettings.longPressTimer = setTimeout(() => {
            if (!dragStateSettings.dragItem) return;
            const touchNow = e.touches[0] || touch;
            const deltaX = touchNow.clientX - dragStateSettings.startX;
            const deltaY = touchNow.clientY - dragStateSettings.startYPos;
            if (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) return;

            dragStateSettings.isLongPressTriggered = true;
            startDragging(dragStateSettings.dragItem, touchNow);
            dragStateSettings.longPressTimer = null;
        }, 400);
    }

function startDragging(item, touch) {
    if (dragStateSettings.isDragging) return;
    dragStateSettings.isDragging = true;

    
    item.style.boxShadow = 'none';
    item.style.zIndex = '150';
    item.style.position = 'relative';
    item.style.transition = 'opacity 0.2s ease, transform 0.2s ease, background 0.2s ease';
    
    item.style.outline = 'none';
    item.style.webkitTapHighlightColor = 'transparent';

    const clone = item.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '200';
    clone.style.width = item.offsetWidth + 'px';
    const rect = item.getBoundingClientRect();
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    
    clone.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    clone.style.border = 'none';
    clone.style.background = '#ffffff';
    clone.style.borderRadius = '0px';
    clone.style.transition = 'none';
    
    clone.style.outline = 'none';
    clone.style.webkitTapHighlightColor = 'transparent';
    document.body.appendChild(clone);
    dragStateSettings.clone = clone;
}

    function onDragTouchMove(e) {
        if (!dragStateSettings.dragItem) return;
        const touch = e.touches[0];
        if (dragStateSettings.touchId !== undefined && touch.identifier !== dragStateSettings.touchId) return;

        if (!dragStateSettings.isLongPressTriggered && !dragStateSettings.isDragging) {
            const deltaX = touch.clientX - dragStateSettings.startX;
            const deltaY = touch.clientY - dragStateSettings.startYPos;
            if (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15) {
                if (dragStateSettings.longPressTimer) {
                    clearTimeout(dragStateSettings.longPressTimer);
                    dragStateSettings.longPressTimer = null;
                }
                if (dragStateSettings.dragItem) {
                    dragStateSettings.dragItem.style.opacity = '';
                    dragStateSettings.dragItem.style.transition = '';
                }
                dragStateSettings.dragItem = null;
                return;
            }
            return;
        }

        if (!dragStateSettings.isDragging || !dragStateSettings.clone) return;

        const rect = dragStateSettings.dragItem.getBoundingClientRect();
        const clientY = touch.clientY;
        dragStateSettings.lastTouchY = clientY;

        dragStateSettings.clone.style.top = (clientY - dragStateSettings.offsetY) + 'px';
        dragStateSettings.clone.style.left = rect.left + 'px';

        const wrapper = document.getElementById('settingsListWrapper');
        if (wrapper) {
            const wrapperRect = wrapper.getBoundingClientRect();
            const threshold = 60;
            const scrollSpeed = 12;

            const nearTop = clientY < wrapperRect.top + threshold;
            const nearBottom = clientY > wrapperRect.bottom - threshold;

            if (nearTop || nearBottom) {
                if (!dragStateSettings.scrollInterval) {
                    const direction = nearTop ? -1 : 1;
                    dragStateSettings.scrollInterval = setInterval(() => {
                        wrapper.scrollBy(0, direction * scrollSpeed);
                        updateDragTarget(dragStateSettings.lastTouchY);
                    }, 16);
                }
            } else {
                if (dragStateSettings.scrollInterval) {
                    clearInterval(dragStateSettings.scrollInterval);
                    dragStateSettings.scrollInterval = null;
                }
            }
        }

        updateDragTarget(clientY);
        e.preventDefault();
    }

    function onDragTouchEnd(e) {
        if (dragStateSettings.longPressTimer) {
            clearTimeout(dragStateSettings.longPressTimer);
            dragStateSettings.longPressTimer = null;
        }

        if (dragStateSettings.scrollInterval) {
            clearInterval(dragStateSettings.scrollInterval);
            dragStateSettings.scrollInterval = null;
        }

        if (dragStateSettings.isDragging) {
            const items = settingsList.querySelectorAll('.settings-item');
            const newOrder = [];
            items.forEach(item => { newOrder.push(item.dataset.id); });
            const type = settingsCurrentType;
            reorderCategories(type, newOrder);

            if (dragStateSettings.clone && dragStateSettings.clone.parentNode) {
                dragStateSettings.clone.parentNode.removeChild(dragStateSettings.clone);
            }
            if (dragStateSettings.dragItem) {
                dragStateSettings.dragItem.style.background = '';
                dragStateSettings.dragItem.style.boxShadow = '';
                dragStateSettings.dragItem.style.transform = '';
                dragStateSettings.dragItem.style.borderRadius = '';
                dragStateSettings.dragItem.style.zIndex = '';
                dragStateSettings.dragItem.style.position = '';
                dragStateSettings.dragItem.style.transition = '';
                dragStateSettings.dragItem.style.opacity = '';
            }

            renderSettingsList(settingsCurrentType);
            buildCategorySlides();

            if (currentCategory) {
                const cats = getCategoriesByType(currentType);
                const exists = cats.some(c => c.label === currentCategory);
                if (exists) {
                    const slide = currentType === 'expense' ? slideExpense : slideIncome;
                    highlightCategory(slide, currentCategory);
                } else {
                    currentCategory = null;
                    setType(currentType);
                }
            } else {
                setType(currentType);
            }
        }

        dragStateSettings.dragItem = null;
        dragStateSettings.dragOverItem = null;
        dragStateSettings.isDragging = false;
        dragStateSettings.clone = null;
        dragStateSettings.touchId = null;
        dragStateSettings.isLongPressTriggered = false;
    }

    function onDragMouseDown(e) {
        const dragBtn = e.target.closest('.item-drag');
        if (!dragBtn) return;
        const item = dragBtn.closest('.settings-item');
        if (!item) return;
        e.preventDefault();
        let startX = e.clientX;
        let startY = e.clientY;
        let moved = false;
        const clone = item.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0.85';
        clone.style.zIndex = '100';
        clone.style.width = item.offsetWidth + 'px';
        clone.style.left = item.getBoundingClientRect().left + 'px';
        clone.style.top = item.getBoundingClientRect().top + 'px';
        clone.style.transform = 'scale(1.02)';
        clone.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        clone.style.borderRadius = 'var(--radius-sm)';
        clone.style.background = 'var(--bg-card)';
        clone.style.border = '2px solid var(--primary)';
        document.body.appendChild(clone);
        item.classList.add('dragging');

        const onMouseMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
            clone.style.top = (ev.clientY - 30) + 'px';
            clone.style.left = (ev.clientX - 30) + 'px';
            const items = settingsList.querySelectorAll('.settings-item');
            let targetItem = null;
            items.forEach(it => {
                if (it === item) return;
                const r = it.getBoundingClientRect();
                if (ev.clientY > r.top && ev.clientY < r.bottom) {
                    targetItem = it;
                }
            });
            if (targetItem && targetItem !== dragStateSettings.dragOverItem) {
                dragStateSettings.dragOverItem = targetItem;
                const parent = settingsList;
                const allItems = parent.querySelectorAll('.settings-item');
                const dragIndex = Array.from(allItems).indexOf(item);
                const targetIndex = Array.from(allItems).indexOf(targetItem);
                if (dragIndex < targetIndex) {
                    parent.insertBefore(item, targetItem.nextSibling);
                } else {
                    parent.insertBefore(item, targetItem);
                }
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (clone.parentNode) clone.parentNode.removeChild(clone);
            item.classList.remove('dragging');

            item.style.background = '';
            item.style.boxShadow = '';
            item.style.transform = '';
            item.style.borderRadius = '';
            item.style.zIndex = '';
            item.style.position = '';
            item.style.transition = '';

            if (moved) {
                const items = settingsList.querySelectorAll('.settings-item');
                const newOrder = [];
                items.forEach(it => { newOrder.push(it.dataset.id); });
                const type = settingsCurrentType;
                reorderCategories(type, newOrder);

                renderSettingsList(settingsCurrentType);
                buildCategorySlides();

                if (currentCategory) {
                    const cats = getCategoriesByType(currentType);
                    const exists = cats.some(c => c.label === currentCategory);
                    if (exists) {
                        const slide = currentType === 'expense' ? slideExpense : slideIncome;
                        highlightCategory(slide, currentCategory);
                    } else {
                        currentCategory = null;
                        setType(currentType);
                    }
                } else {
                    setType(currentType);
                }
            }

            dragStateSettings.dragOverItem = null;
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    
    function handleDeleteCategory(type, id) {
        const cats = getCategoriesByType(type);
        const cat = cats.find(c => c.id === id);
        if (!cat) return;

        showConfirmDialog(
            '确认删除类目',
            `确定要删除类目「${cat.label}」吗？`,
            function() {
                const success = deleteCategory(type, id);
                if (success) {
                    showToast('类目已删除');
                    renderSettingsList(settingsCurrentType);
                    buildCategorySlides();
                    if (currentCategory === cat.label) {
                        currentCategory = null;
                        setType(currentType);
                    } else {
                        const slide = currentType === 'expense' ? slideExpense : slideIncome;
                        highlightCategory(slide, currentCategory);
                    }
                } else {
                    showToast('删除失败');
                }
            }
        );
    }

    
    function renderIconGrid(container, selected) {
        
        let activeCategory = CATEGORY_TITLES[0];
        if (selected) {
            for (const cat of CATEGORY_TITLES) {
                const icons = CATEGORY_ICON_MAP[cat] || [];
                if (icons.includes(selected)) {
                    activeCategory = cat;
                    break;
                }
            }
        }

        let navHtml = '';
        let panelsHtml = '';

        CATEGORY_TITLES.forEach(category => {
            const icons = CATEGORY_ICON_MAP[category] || [];
            if (icons.length === 0) return;

            const isActive = category === activeCategory;
            navHtml += `<button class="cat-icon-nav-item ${isActive ? 'active' : ''}" data-category="${category}">${category}</button>`;

            panelsHtml += `<div class="cat-icon-panel" data-category="${category}" style="display:${isActive ? 'grid' : 'none'}">`;
            icons.forEach(icon => {
                const active = icon === selected ? 'active' : '';
                panelsHtml += `<button class="cat-icon-option ${active}" data-icon="${icon}" data-label="${category}"><i class="fas ${icon}"></i></button>`;
            });
            panelsHtml += `</div>`;
        });

        container.innerHTML = `<div class="cat-icon-picker">
            <div class="cat-icon-nav">${navHtml}</div>
            <div class="cat-icon-content">${panelsHtml}</div>
        </div>`;

        
        container.querySelectorAll('.cat-icon-nav-item').forEach(navBtn => {
            navBtn.addEventListener('click', function() {
                const category = this.dataset.category;
                container.querySelectorAll('.cat-icon-nav-item').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                container.querySelectorAll('.cat-icon-panel').forEach(panel => {
                    if (panel.dataset.category === category) {
                        panel.style.display = 'grid';
                        panel.classList.remove('panel-enter');
                        void panel.offsetWidth;  
                        panel.classList.add('panel-enter');
                    } else {
                        panel.style.display = 'none';
                    }
                });
                
                const content = container.querySelector('.cat-icon-content');
                if (content) content.scrollTop = 0;
            });
        });

        
        container.querySelectorAll('.cat-icon-option').forEach(btn => {
            btn.addEventListener('click', function() {
                container.querySelectorAll('.cat-icon-option').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const icon = this.dataset.icon;
                const label = this.dataset.label;
                if (container === catIconGrid) {
                    selectedAddIcon = icon;
                    if (label && !catAddName.value) {
                        catAddName.value = label;
                    }
                } else if (container === catEditIconGrid) {
                    selectedEditIcon = icon;
                }
            });
        });
    }

    
    function openAddCategoryModal() {
        catAddName.value = '';
        selectedAddIcon = 'fa-tag';
        renderIconGrid(catIconGrid, selectedAddIcon);
        catAddOverlay.classList.add('show');
    }

    function closeCatAddModal() {
        catAddOverlay.classList.remove('show');
    }

    function confirmAddCategory() {
        const name = catAddName.value.trim();
        if (!name) {
            showToast('请输入类目名称');
            return;
        }
        const icon = selectedAddIcon || 'fa-tag';
        const type = settingsCurrentType;
        const newCat = addCategory(type, name, icon);
        showToast('添加成功');
        closeCatAddModal();
        renderSettingsList(settingsCurrentType);
        buildCategorySlides();
        setType(type, newCat.label);
    }

    
    function openEditCategoryModal(type, id) {
        const cats = getCategoriesByType(type);
        const cat = cats.find(c => c.id === id);
        if (!cat) return;
        editingCategoryId = id;
        editingCategoryType = type;
        catEditName.value = cat.label;
        selectedEditIcon = cat.icon || 'fa-tag';
        renderIconGrid(catEditIconGrid, selectedEditIcon);
        catEditOverlay.classList.add('show');
    }

    function closeCatEditModal() {
        catEditOverlay.classList.remove('show');
        editingCategoryId = null;
        editingCategoryType = null;
    }

    function confirmEditCategory() {
        const name = catEditName.value.trim();
        if (!name) {
            showToast('请输入类目名称');
            return;
        }
        if (!editingCategoryId || !editingCategoryType) {
            showToast('数据异常，请重试');
            return;
        }
        const icon = selectedEditIcon || 'fa-tag';
        const success = editCategory(editingCategoryType, editingCategoryId, name, icon);
        if (success) {
            showToast('修改成功');
            closeCatEditModal();
            renderSettingsList(settingsCurrentType);
            buildCategorySlides();
            if (currentCategory) {
                const cats = getCategoriesByType(currentType);
                const found = cats.find(c => c.label === currentCategory);
                if (!found) {
                    currentCategory = null;
                    setType(currentType);
                }
            }
        } else {
            showToast('修改失败');
        }
    }


    

partnerEntry?.addEventListener('click', function() {
    openMatchPage();
});
    
    dateTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!addModalOverlay.classList.contains('show')) return;
        openDatePicker();
    });

    dateModalClose.addEventListener('click', closeDatePicker);
    dateOverlay.addEventListener('click', function(e) {
        if (e.target === this) closeDatePicker();
    });
    dateBtnConfirm.addEventListener('click', confirmDate);
    if (dateBtnToday) dateBtnToday.addEventListener('click', goToToday);

    document.addEventListener('click', function(e) {
        if (!dateModal.classList.contains('show')) return;
        const modal = dateModal;
        const trigger = dateTrigger;
        if (!modal.contains(e.target) && !trigger.contains(e.target)) {
            closeDatePicker();
        }
    });

    
    noteDisplay.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!addModalOverlay.classList.contains('show')) return;
        openNoteModal();
    });

    noteModalConfirm.addEventListener('click', function() {
        if (closeNoteTimer) {
            clearTimeout(closeNoteTimer);
            closeNoteTimer = null;
        }
        confirmNote();
    });

    noteModal.addEventListener('click', function(e) {
        if (e.target === this) closeNoteModal();
    });

    noteModalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmNote();
        }
    });

    
    document.getElementById('authSwitchArea').addEventListener('click', function(e) {
        const link = e.target.closest('#authSwitchLink');
        if (!link) return;
        e.preventDefault();
        if (loginForm.style.display !== 'none') {
            showRegisterPage();
        } else {
            showLoginPage();
        }
    });


$('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const account = $('#loginAccount').value.trim();
    const password = $('#loginPassword').value.trim();

    if (!account || !password) {
        showToast('请输入邮箱/手机号和密码');
        return;
    }

    
    const isPhone = /^\d{11}$/.test(account);

    
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    if (agreeCheckbox && !agreeCheckbox.checked) {
        showToast('请先阅读并同意协议');
        return;
    }

    try {
        showLoading();
        const payload = isPhone
            ? { phone: account, password }
            : { email: account, password };
        const data = await apiCall('/auth/login', 'POST', payload);
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.removeItem('categories_data');
        showMainApp();
        
        await loadAllData(true);
        checkTermsVersion(true);
    } catch (err) {
        showToast(err.message || '登录失败');
        hideLoading();
    }
});


$('#registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#regEmail').value.trim();
    const code = $('#regCode').value.trim();
    const nickname = $('#regNickname').value.trim();
    const password = $('#regPassword').value.trim();
    const password2 = $('#regPassword2').value.trim();

    if (!email || !code) {
        showToast('请输入邮箱和验证码');
        return;
    }

    if (!nickname) {
        showToast('请输入昵称');
        return;
    }

    if (nickname.length > 20) {
        showToast('昵称不能超过20个字');
        return;
    }

    if (!password) {
        showToast('请设置密码');
        return;
    }

    if (password !== password2) {
        showToast('两次密码输入不一致');
        return;
    }

    if (password.length < 4) {
        showToast('密码至少4位');
        return;
    }

    try {
        await registerWithCode(email, code, password, nickname);
        showToast('注册成功，请登录');
        showLoginPage();
        $('#loginAccount').value = email;
        $('#loginPassword').value = '';
    } catch (err) {
        showToast(err.message || '注册失败');
    }
});

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) showPage(page);
        });
    });

    navAddBtn.addEventListener('click', openAddModal);
    addModalClose.addEventListener('click', closeAddModal);
    addModalOverlay.addEventListener('click', (e) => {
        if (e.target === addModalOverlay) {
            if (paymentSheet.classList.contains('show')) {
                closePaymentSheet();
                return;
            }
            if (noteModal.classList.contains('show')) {
                closeNoteModal();
                return;
            }
            if (dateModal.classList.contains('show')) {
                closeDatePicker();
                return;
            }
            if (settingsOverlay.classList.contains('show')) {
                closeSettings();
                return;
            }
            if (catAddOverlay.classList.contains('show')) {
                closeCatAddModal();
                return;
            }
            if (catEditOverlay.classList.contains('show')) {
                closeCatEditModal();
                return;
            }
            closeAddModal();
        }
    });

    
    paymentTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePaymentSheet();
    });

    paymentSheetClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closePaymentSheet();
    });

    paymentSheetOptions.addEventListener('click', (e) => {
        const option = e.target.closest('.payment-sheet-option');
        if (!option) return;
        const payment = option.dataset.payment;
        if (payment) setPaymentMethod(payment);
    });

    document.addEventListener('click', (e) => {
        if (!paymentSheet.classList.contains('show')) return;
        
        if (typeof schedPaymentMode !== 'undefined' && schedPaymentMode) return;
        const sheet = paymentSheet;
        const trigger = paymentTrigger;
        
        const schedPaymentField = document.getElementById('schedPaymentField');
        if (!sheet.contains(e.target) && !trigger.contains(e.target) && !(schedPaymentField && schedPaymentField.contains(e.target))) {
            closePaymentSheet();
        }
    });

    
modalTypeToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !btn.dataset.type) return;
    const type = btn.dataset.type;
    if (type !== currentType) {
        setType(type, null, false, false);
    }
});

    
    belongGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.belong-btn');
        if (!btn) return;
        belongGroup.querySelectorAll('.belong-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBelong = btn.dataset.belong;
    });

    
    keyboard.addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn) return;
        const value = btn.dataset.value;
        if (value) {
            if (value === 'save') {
                saveBill();
                return;
            }
            handleKeyInput(value);
        }
    });

    
    $('#modalCancel').addEventListener('click', hideDeleteModal);
    $('#modalConfirm').addEventListener('click', async () => {
        if (confirmCallback) {
            const cb = confirmCallback;
            confirmCallback = null;
            await cb();
            hideDeleteModal();
        } else if (deleteTargetId !== null) {
            await deleteBill(deleteTargetId);
        } else {
            hideDeleteModal();
        }
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) hideDeleteModal();
    });



    
    document.addEventListener('click', function(e) {
        const settingsBtn = e.target.closest('#modalSettingsBtn');
        if (settingsBtn) {
            e.preventDefault();
            if (addModalOverlay.classList.contains('show')) openSettings();
        }
    });

    settingsBackBtn.addEventListener('click', closeSettings);
    settingsOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            if (catAddOverlay.classList.contains('show')) {
                closeCatAddModal();
                return;
            }
            if (catEditOverlay.classList.contains('show')) {
                closeCatEditModal();
                return;
            }
            closeSettings();
        }
    });

    settingsTabs.addEventListener('click', function(e) {
        const tab = e.target.closest('.settings-tab');
        if (!tab) return;
        const type = tab.dataset.stype;
        if (type === settingsCurrentType) return;
        
        const order = ['expense', 'income'];
        const forward = order.indexOf(type) > order.indexOf(settingsCurrentType);
        switchSettingsType(type, forward);
    });

    
function updateSettingsTabSlider() {
    const tabs = document.getElementById('settingsTabs');
    const slider = document.getElementById('settingsTabSlider');
    if (!tabs || !slider) return;
    const activeTab = tabs.querySelector('.settings-tab.active');
    if (!activeTab) return;
    const tabsRect = tabs.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const width = tabRect.width * 0.12;
    const left = tabRect.left - tabsRect.left + (tabRect.width - width) / 2;
    slider.style.left = left + 'px';
    slider.style.width = width + 'px';
}

    
    let settingsSwitching = false;
    function switchSettingsType(type, forward) {
        if (settingsSwitching || type === settingsCurrentType) return;
        settingsSwitching = true;
        settingsCurrentType = type;
        settingsTabs.querySelectorAll('.settings-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.stype === type);
        });
        updateSettingsTabSlider();

        const list = document.getElementById('settingsList');
        const outClass = forward ? 'slide-out-left' : 'slide-out-right';
        const inClass = forward ? 'slide-in-right' : 'slide-in-left';

        if (list) {
            list.classList.remove('slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
            void list.offsetWidth; 
            list.classList.add(outClass);

            const onOutEnd = () => {
                list.removeEventListener('animationend', onOutEnd);
                renderSettingsList(type);
                list.classList.remove(outClass);
                void list.offsetWidth;
                list.classList.add(inClass);
                const onInEnd = () => {
                    list.removeEventListener('animationend', onInEnd);
                    list.classList.remove(inClass);
                    settingsSwitching = false;
                };
                list.addEventListener('animationend', onInEnd);
            };
            list.addEventListener('animationend', onOutEnd);
        } else {
            renderSettingsList(type);
            settingsSwitching = false;
        }
    }

    
    function initSettingsSwipe() {
        const wrapper = document.getElementById('settingsListWrapper');
        if (!wrapper) return;
        let startX = 0, startY = 0, tracking = false;

        wrapper.addEventListener('touchstart', function(e) {
            if (settingsSwitching) return;
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            tracking = true;
        }, { passive: true });

        wrapper.addEventListener('touchend', function(e) {
            if (!tracking) return;
            tracking = false;
            const t = e.changedTouches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
            const order = ['expense', 'income'];
            const curIdx = order.indexOf(settingsCurrentType);
            let newType;
            if (dx < 0) {
                
                newType = order[curIdx + 1];
            } else {
                
                newType = order[curIdx - 1];
            }
            if (!newType) return;
            switchSettingsType(newType, dx < 0);
        }, { passive: true });
    }
    initSettingsSwipe();

    settingsAddBtn.addEventListener('click', openAddCategoryModal);

    catAddClose.addEventListener('click', closeCatAddModal);
    catAddOverlay.addEventListener('click', function(e) {
        if (e.target === this) closeCatAddModal();
    });
    catAddConfirm.addEventListener('click', confirmAddCategory);
    catAddName.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') confirmAddCategory();
    });

    catEditClose.addEventListener('click', closeCatEditModal);
    catEditOverlay.addEventListener('click', function(e) {
        if (e.target === this) closeCatEditModal();
    });
    catEditConfirm.addEventListener('click', confirmEditCategory);
    catEditName.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') confirmEditCategory();
    });

    
    paymentOverlay.addEventListener('click', function() { closePaymentSheet(); });
    noteOverlay.addEventListener('click', function(e) {
        if (e.target === this) closeNoteModal();
    });
    noteModalInput.addEventListener('blur', function() {
        closeNoteTimer = setTimeout(() => {
            closeNoteTimer = null;
            closeNoteModal();
        }, 200);
    });

    window.addEventListener('resize', function() {
        updateSliderPosition();
        updateSettingsTabSlider();
        updateBudgetBelongSlider();
        updateAllTabIndicators();
    });





avatarFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件');
        avatarFileInput.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过 5MB');
        avatarFileInput.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
        const imageUrl = ev.target.result;
        openAvatarCropModal(imageUrl);
        avatarFileInput.value = ''; 
    };
    reader.readAsDataURL(file);
});

function openAvatarCropModal(imageUrl) {
    avatarOverlay.classList.add('show');
    
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    const img = avatarCropImage;
    img.src = '';
    img.style.display = 'none';
    
    
    img.onload = function() {
        img.style.display = 'block';
        
        if (img.complete && img.naturalWidth > 0) {
            initCropper();
        }
    };
    
    
    img.onerror = function() {
        
        setTimeout(() => {
            img.src = imageUrl;
        }, 100);
    };
    
    
    img.src = imageUrl;
    
    
    if (img.complete && img.naturalWidth > 0) {
        img.style.display = 'block';
        initCropper();
    }
}

function closeAvatarCropModal() {
    avatarOverlay.classList.remove('show');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    avatarCropImage.src = '';
}

avatarBtnCancel.addEventListener('click', closeAvatarCropModal);
avatarOverlay.addEventListener('click', function(e) {
    if (e.target === this) closeAvatarCropModal();
});

avatarBtnConfirm.addEventListener('click', function() {
    if (!cropper) {
        showToast('请先裁剪图片');
        return;
    }
    
    const canvas = cropper.getCroppedCanvas({
        width: 200,
        height: 200,
        imageSmoothingQuality: 'high',
    });
    if (!canvas) {
        showToast('裁剪失败，请重试');
        return;
    }
    
    const avatarBase64 = canvas.toDataURL('image/jpeg', 0.92);
    
    uploadAvatar(avatarBase64);
});

async function uploadAvatar(avatarBase64) {
    try {
        const data = await apiCall('/user/avatar', 'PUT', { avatar: avatarBase64 });
        
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        renderProfile();
        updateHomeAvatar();
        closeAvatarCropModal();
    } catch (err) {
        showToast('头像上传失败: ' + err.message);
    }
}


const BUDGET_CONFIG = {
    my: { label: '我的预算', filter: '自己' },
    partner: { label: '对方预算', filter: '对方' },
    both: { label: '共同预算',filter: '共同' }
};





function parseBudgetMonthKey(key) {
    const [y, m] = String(key).split('-').map(Number);
    return new Date(y, m - 1, 1);
}


function getBudgetMonthKey(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}



function normalizeBudgetData(raw, defaultKey) {
    const key = defaultKey || getBudgetMonthKey(new Date());
    
    if (raw && typeof raw === 'object' && !Array.isArray(raw)
        && (raw.my !== undefined || raw.partner !== undefined || raw.both !== undefined
            || Object.keys(raw).some(k => /^\d{4}-\d{2}$/.test(k)))) {
        
        const result = {};
        Object.keys(raw).forEach(k => {
            if (/^\d{4}-\d{2}$/.test(k) && raw[k] && typeof raw[k] === 'object') {
                result[k] = {
                    my: raw[k].my || 0,
                    partner: raw[k].partner || 0,
                    both: raw[k].both || 0
                };
            }
        });
        if (!result[key] && (raw.my !== undefined || raw.partner !== undefined || raw.both !== undefined)) {
            result[key] = { my: raw.my || 0, partner: raw.partner || 0, both: raw.both || 0 };
        }
        return result;
    }
    
    if (raw && typeof raw === 'object') {
        return { [key]: { my: raw.my || 0, partner: raw.partner || 0, both: raw.both || 0 } };
    }
    return { [key]: { my: 0, partner: 0, both: 0 } };
}


let budgetCache = (function() {
    const key = getBudgetMonthKey(new Date());
    return { [key]: { my: 0, partner: 0, both: 0 } };
})();


function getBudgetData() {
    return budgetCache;
}


function getBudgetForMonth(type, monthKey) {
    const key = monthKey || getBudgetMonthKey(selectedMonthDate);
    const month = budgetCache[key] || { my: 0, partner: 0, both: 0 };
    return month[type] || 0;
}


function getBudgetMonth(monthKey) {
    const key = monthKey || getBudgetMonthKey(selectedMonthDate);
    return budgetCache[key] || { my: 0, partner: 0, both: 0 };
}



async function loadBudgetData() {
    if (!token) return budgetCache;
    try {
        const data = await apiCall('/budgets', 'GET');
        const src = data.budgets || data.budget || data;
        budgetCache = normalizeBudgetData(src);
    } catch (err) {
        
        console.warn('从后端加载预算失败', err);
    }
    return budgetCache;
}



let pendingBudgetSync = false;
let budgetSyncTimer = null;

async function retryBudgetSync() {
    if (!pendingBudgetSync || !token) return;
    try {
        const res = await apiCall('/budgets', 'PUT', { budgets: budgetCache });
        if (res.budgets) {
            budgetCache = normalizeBudgetData(res.budgets);
        }
        pendingBudgetSync = false;
        budgetSyncTimer = null;
        showToast('预算已同步到云端');
    } catch (err) {
        console.warn('预算重试同步失败，将继续重试', err);
        scheduleBudgetRetry();
    }
}

function scheduleBudgetRetry() {
    if (budgetSyncTimer) return;
    budgetSyncTimer = setTimeout(() => {
        budgetSyncTimer = null;
        retryBudgetSync();
    }, 8000);
}


window.addEventListener('online', retryBudgetSync);




async function saveBudgetData(data, monthKey) {
    const key = monthKey || getBudgetMonthKey(selectedMonthDate);
    
    budgetCache[key] = {
        my: data.my || 0,
        partner: data.partner || 0,
        both: data.both || 0
    };

    if (!token) {
        showToast('请先登录后再设置预算');
        return false;
    }
    try {
        
        const res = await apiCall('/budgets', 'PUT', { budgets: budgetCache });
        if (res.budgets) {
            budgetCache = normalizeBudgetData(res.budgets);
        }
        pendingBudgetSync = false;
        if (typeof budgetLastSeen !== 'undefined') budgetLastSeen = snapshotBudgets();
        return true;
    } catch (err) {
        console.error('保存预算到后端失败，将自动重试', err);
        pendingBudgetSync = true;
        showToast('预算保存失败，将自动重试');
        scheduleBudgetRetry();
        return false;
    }
}


function getMonthExpenseByBelong(filter, date) {
    const targetDate = date || new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    let total = 0;
    if (allBills && allBills.length > 0) {
        allBills.forEach(b => {
            const d = new Date(b.date);
            if (d >= monthStart && d <= monthEnd && b.type === 'expense' && getDisplayBelong(b) === filter) {
                total += b.amount;
            }
        });
    }
    return total;
}


function updateBudgetDisplay() {
    const wallet = getCurrentWallet();
    const config = BUDGET_CONFIG[wallet.key];
    if (!config) return;

    const budgetLabel = document.getElementById('budgetLabel');
    const budgetItem = document.getElementById('budgetItem');
    const progressTrack = document.getElementById('budgetProgressTrack');
    const progressFill = document.getElementById('budgetProgressFill');

    budgetItem.dataset.type = wallet.key;

    const limit = getBudgetForMonth(wallet.key, getBudgetMonthKey(selectedMonthDate));
    
    const spent = getMonthExpenseByBelong(config.filter, selectedMonthDate);
    const remaining = limit - spent;

    const nameMap = {
        'my': '我',
        'partner': '对方',
        'both': '我们'
    };

    if (limit > 0) {
        budgetLabel.textContent = `${nameMap[wallet.key] || '我'}的月剩余预算 ${remaining.toFixed(2)} 元`;
        progressTrack.classList.add('visible');
        
        const ratio = limit > 0 ? spent / limit : 0;
        const pct = Math.min(ratio * 100, 100);
        progressFill.style.width = pct + '%';
        
        progressFill.classList.remove('over-budget', 'warning');
        if (spent > limit) {
            progressFill.classList.add('over-budget');
            progressFill.style.background = 'var(--expense)';
        } else if (ratio >= 0.8) {
            progressFill.classList.add('warning');
            progressFill.style.background = 'var(--warning)';
        } else {
            progressFill.style.background = '';
        }
    } else {
        const actionNameMap = {
            'my': '我的',
            'partner': '对方的',
            'both': '我们的'
        };
        budgetLabel.textContent = `去设置${actionNameMap[wallet.key] || '我的'}预算`;
        progressTrack.classList.remove('visible');
        progressFill.style.width = '0%';
        progressFill.classList.remove('over-budget', 'warning');
        progressFill.style.background = '';
    }
}


function openBudgetModal(type) {
    const config = BUDGET_CONFIG[type];
    if (!config) return;

    
    const current = getBudgetForMonth(type, getBudgetMonthKey(budgetViewDate));
    let budgetAmountStr = current > 0 ? String(parseFloat(current.toFixed(2))) : '0';

    const overlay = document.createElement('div');
    overlay.className = 'budget-modal-overlay budget-keyboard-overlay';
    overlay.id = 'budgetModalOverlay';
    overlay.innerHTML = `
        <div class="budget-modal budget-modal-with-keyboard">
            <div class="budget-modal-body">
                <div class="budget-amount-area">
                    <span class="amount-currency budget-amount-currency">¥</span>
                    <span class="amount-display budget-amount-display" id="budgetAmountDisplay">0.00</span>
                </div>

                <div class="keyboard budget-keyboard" id="budgetKeyboard">
                    <!-- 第一行 -->
                    <button class="key-btn" data-value="1">1</button>
                    <button class="key-btn" data-value="2">2</button>
                    <button class="key-btn" data-value="3">3</button>
                    <button class="key-btn key-back" data-value="back"><i class="ri-delete-back-2-line"></i></button>
                    <!-- 第二行 -->
                    <button class="key-btn" data-value="4">4</button>
                    <button class="key-btn" data-value="5">5</button>
                    <button class="key-btn" data-value="6">6</button>
                    <button class="key-btn key-plus budget-key-plus" data-value="plus"><i class="ri-add-line"></i></button>
                    <!-- 第三行 -->
                    <button class="key-btn" data-value="7">7</button>
                    <button class="key-btn" data-value="8">8</button>
                    <button class="key-btn" data-value="9">9</button>
                    <button class="key-btn key-minus budget-key-minus" data-value="minus"><i class="ri-subtract-line"></i></button>
                    <!-- 第四行 -->
                    <button class="key-btn key-clear budget-key-clear" data-value="clear">清空</button>
                    <button class="key-btn" data-value="0">0</button>
                    <button class="key-btn" data-value=".">.</button>
                    <button class="key-btn key-save budget-key-save" data-value="save">保存</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });

    const amountDisplay = overlay.querySelector('#budgetAmountDisplay');
    const budgetKeyboard = overlay.querySelector('#budgetKeyboard');

    
    function getCurrentOperandLocal(expr) {
        for (let i = expr.length - 1; i >= 1; i--) {
            if (expr[i] === '+' || expr[i] === '-') {
                return expr.slice(i + 1);
            }
        }
        return expr;
    }
    function isCompleteLocal(expr) {
        for (let i = 1; i < expr.length; i++) {
            if (expr[i] === '+' || expr[i] === '-') {
                return i < expr.length - 1;
            }
        }
        return false;
    }
    function evaluateExpressionLocal(expr) {
        let s = expr.replace(/[+\-]$/, '');
        const m = s.match(/^(-?[\d.]+)\s*([+\-])\s*(-?[\d.]+)$/);
        if (!m) {
            const v = parseFloat(s);
            return isNaN(v) ? 0 : v;
        }
        const left = parseFloat(m[1]);
        const op = m[2];
        const right = parseFloat(m[3]);
        if (isNaN(left) || isNaN(right)) return 0;
        return op === '+' ? left + right : left - right;
    }
    function formatNumberLocal(n) {
        if (!isFinite(n)) return '0';
        return String(parseFloat(n.toFixed(2)));
    }

    function updateBudgetAmountDisplay() {
        
        if (budgetAmountStr.indexOf('+') !== -1 || budgetAmountStr.lastIndexOf('-') > 0) {
            amountDisplay.textContent = budgetAmountStr;
            return;
        }
        let displayVal = parseFloat(budgetAmountStr);
        if (isNaN(displayVal)) displayVal = 0;
        if (Number.isInteger(displayVal) && budgetAmountStr.indexOf('.') === -1) {
            amountDisplay.textContent = String(displayVal);
        } else {
            amountDisplay.textContent = displayVal.toFixed(2);
        }
    }

    function isValidAmountLocal(str) {
        if (str.startsWith('.')) return false;
        const parts = str.split('.');
        if (parts.length > 2) return false;
        const intPart = parts[0];
        const decPart = parts[1] || '';
        const hasDec = parts.length === 2;
        const MAX_INT_NO_DEC = 7;
        const MAX_INT_WITH_DEC = 6;
        const MAX_DEC = 2;
        if (intPart.length === 0) return true;
        const maxInt = hasDec ? MAX_INT_WITH_DEC : MAX_INT_NO_DEC;
        if (intPart.length > maxInt) return false;
        if (decPart.length > MAX_DEC) return false;
        return true;
    }

    function handleBudgetKeyInput(value) {
        if (value === 'clear') {
            
            doClearAndSaveBudget();
            return;
        }
        if (value === 'back') {
            if (budgetAmountStr.length <= 1) {
                budgetAmountStr = '0';
            } else {
                budgetAmountStr = budgetAmountStr.slice(0, -1);
                if (budgetAmountStr === '-' || budgetAmountStr === '.' || budgetAmountStr === '') {
                    budgetAmountStr = '0';
                }
            }
            updateBudgetAmountDisplay();
            return;
        }
        if (value === 'plus' || value === 'minus') {
            const op = value === 'plus' ? '+' : '-';
            const last = budgetAmountStr[budgetAmountStr.length - 1];
            if (last === '+' || last === '-') {
                
                budgetAmountStr = budgetAmountStr.slice(0, -1) + op;
            } else if (isCompleteLocal(budgetAmountStr)) {
                
                budgetAmountStr = formatNumberLocal(evaluateExpressionLocal(budgetAmountStr)) + op;
            } else {
                budgetAmountStr = budgetAmountStr + op;
            }
            updateBudgetAmountDisplay();
            return;
        }
        if (value === '.') {
            const operand = getCurrentOperandLocal(budgetAmountStr);
            if (operand.includes('.')) return;
            const newOperand = operand === '' ? '0.' : operand + '.';
            if (!isValidAmountLocal(newOperand)) {
                showToast('金额超出限制（整数最多7位，小数最多2位）');
                return;
            }
            budgetAmountStr = budgetAmountStr.slice(0, budgetAmountStr.length - operand.length) + newOperand;
            updateBudgetAmountDisplay();
            return;
        }
        const num = parseInt(value);
        if (!isNaN(num)) {
            const operand = getCurrentOperandLocal(budgetAmountStr);
            let newOperand;
            if (operand === '' || operand === '0') newOperand = String(num);
            else newOperand = operand + String(num);
            if (!isValidAmountLocal(newOperand)) {
                showToast('金额超出限制（整数最多7位，小数最多2位）');
                return;
            }
            budgetAmountStr = budgetAmountStr.slice(0, budgetAmountStr.length - operand.length) + newOperand;
            updateBudgetAmountDisplay();
        }
    }

    
    updateBudgetAmountDisplay();

    
    const closeModal = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    };
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    
    budgetKeyboard.addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn) return;
        const value = btn.dataset.value;
        if (value) {
            if (value === 'save') {
                doSaveBudget();
                return;
            }
            handleBudgetKeyInput(value);
        }
    });

    
    const backBtn = budgetKeyboard.querySelector('.key-back');
    if (backBtn) {
        let pressTimer = null;
        let isLongPress = false;
        const startPress = (e) => {
            e.preventDefault();
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                budgetAmountStr = '0';
                updateBudgetAmountDisplay();
                pressTimer = null;
            }, 400);
        };
        const endPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            if (isLongPress) isLongPress = false;
        };
        backBtn.addEventListener('pointerdown', startPress);
        backBtn.addEventListener('pointerup', endPress);
        backBtn.addEventListener('pointerleave', endPress);
        backBtn.addEventListener('click', (e) => {
            if (isLongPress) {
                e.stopPropagation();
                isLongPress = false;
            }
        });
    }

    
    async function doClearAndSaveBudget() {
        const monthKey = getBudgetMonthKey(budgetViewDate);
        const newBudget = { ...getBudgetMonth(monthKey) };
        newBudget[type] = 0;

        const saveBtn = budgetKeyboard.querySelector('[data-value="save"]');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
        }

        
        updateBudgetDisplay();
        if (currentPage === 'budget') {
            updateBudgetPage();
            updateBudgetCircle();
        }

        
        const budgetSaved = await saveBudgetData(newBudget, monthKey);

        
        updateBudgetDisplay();
        if (currentPage === 'budget') {
            updateBudgetPage();
            updateBudgetCircle();
        }

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '保存';
        }

        
        if (!budgetSaved) {
            showToast('预算未保存到云端，可再次点击保存重试');
            return;
        }
        closeModal();
    }

    
    async function doSaveBudget() {
        
        let value = evaluateExpressionLocal(budgetAmountStr);
        if (isNaN(value) || value < 0) value = 0;
        const monthKey = getBudgetMonthKey(budgetViewDate);
        const newBudget = { ...getBudgetMonth(monthKey) };
        newBudget[type] = value;

        const saveBtns = budgetKeyboard.querySelectorAll('[data-value="save"]');
        saveBtns.forEach(btn => {
            btn.disabled = true;
            btn.textContent = '保存中...';
        });

        
        updateBudgetDisplay();
        if (currentPage === 'budget') {
            updateBudgetPage();
            updateBudgetCircle();
        }

        
        const budgetSaved = await saveBudgetData(newBudget, monthKey);

        
        updateBudgetDisplay();
        if (currentPage === 'budget') {
            updateBudgetPage();
            updateBudgetCircle();
        }

        saveBtns.forEach(btn => {
            btn.disabled = false;
            btn.textContent = '保存';
        });

        
        if (!budgetSaved) {
            showToast('预算未保存到云端，可再次点击保存重试');
            return;
        }
        closeModal();
    }
}


function updateBudgetUsageInModal(type) {
    const config = BUDGET_CONFIG[type];
    if (!config) return;

    
    const total = getMonthExpenseByBelong(config.filter, budgetViewDate);

    const usageEl = document.getElementById('budgetUsageAmount');
    if (usageEl) {
        usageEl.textContent = '¥' + total.toFixed(2);
        const limit = getBudgetForMonth(type, getBudgetMonthKey(budgetViewDate));
        if (limit > 0 && total > limit) {
            usageEl.style.color = 'var(--expense)';
        } else {
            usageEl.style.color = 'var(--text-primary)';
        }
    }
}


function openBudgetPage() {
    
    previousPage = currentPage;


    
    const pageEl = document.getElementById('page-budget');
    if (!pageEl) return;

    
    if (!budgetViewDate) {
        budgetViewDate = new Date(selectedMonthDate);
    }

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'budget';

    
    updateBudgetPage();
    updateBudgetCircle();
    startBudgetRealtimeSync();
    requestAnimationFrame(() => {
        
        setTimeout(() => updateBudgetBelongSlider(), 0);
    });
}


function closeBudgetPage() {
    const target = previousPage || 'home';
    if (target !== 'stats') {
        stopBudgetRealtimeSync();
    }
    const pageEl = document.getElementById('page-budget');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') enterStatsPage();
    else if (target === 'profile') renderProfile();
}

let budgetRealtimeTimer = null;
let budgetRealtimeBusy = false;
let budgetLastSeen = null;

function snapshotBudgets() {
    const snap = {};
    Object.keys(budgetCache).forEach(k => {
        snap[k] = { my: budgetCache[k].my || 0, partner: budgetCache[k].partner || 0, both: budgetCache[k].both || 0 };
    });
    return JSON.stringify(snap);
}

async function budgetRealtimeRefresh() {
    if (currentPage !== 'budget' && currentPage !== 'stats') return;
    if (!token || !currentPartner) return;
    if (budgetRealtimeBusy) return;
    if (document.getElementById('budgetModalOverlay')) return;
    if (document.visibilityState !== 'visible') return;
    budgetRealtimeBusy = true;
    const prev = budgetLastSeen || snapshotBudgets();
    try {
        await loadBudgetData();
        updateBudgetDisplay();
        if (currentPage === 'budget') {
            updateBudgetPage();
            updateBudgetCircle();
        }
        if (currentPage === 'stats') {
            renderStatsDetail(getStatsFilteredBills(), statsState.date, statsState.detailBelong);
        }
        const nowSnap = snapshotBudgets();
        if (nowSnap !== prev) {
            showToast('搭子更新了预算');
        }
        budgetLastSeen = nowSnap;
    } catch (e) {
    } finally {
        budgetRealtimeBusy = false;
    }
}

function enterStatsPage() {
    startBudgetRealtimeSync();
    renderStatsPage();
    updateStatsDateLabel();
    if (token && currentPartner) {
        loadBudgetData().then(() => {
            updateBudgetDisplay();
            if (currentPage === 'stats') {
                renderStatsPage();
                updateStatsDateLabel();
            }
        });
    }
}

function startBudgetRealtimeSync() {
    if (!currentPartner) return;
    budgetLastSeen = snapshotBudgets();
    if (budgetRealtimeTimer) clearInterval(budgetRealtimeTimer);
    budgetRealtimeTimer = setInterval(budgetRealtimeRefresh, 5000);
    document.addEventListener('visibilitychange', budgetRealtimeRefresh);
    window.addEventListener('focus', budgetRealtimeRefresh);
}

function stopBudgetRealtimeSync() {
    if (budgetRealtimeTimer) {
        clearInterval(budgetRealtimeTimer);
        budgetRealtimeTimer = null;
    }
    document.removeEventListener('visibilitychange', budgetRealtimeRefresh);
    window.removeEventListener('focus', budgetRealtimeRefresh);
}

function updateBudgetPage() {
    const config = BUDGET_CONFIG[budgetViewType];
    if (!config) return;
    
    const year = budgetViewDate.getFullYear();
    const month = budgetViewDate.getMonth() + 1;
    
    
    const dateLabel = document.getElementById('budgetDateLabel');
    if (dateLabel) {
        dateLabel.textContent = year + '年' + month + '月';
    }
    
    
    document.querySelectorAll('.budget-belong-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.belong === budgetViewType);
    });
    
    const limit = getBudgetForMonth(budgetViewType, getBudgetMonthKey(budgetViewDate));
    const spent = getMonthExpenseByBelong(config.filter, budgetViewDate);
    const remaining = limit - spent;
    const daysInMonth = new Date(year, budgetViewDate.getMonth() + 1, 0).getDate();
    const daily = daysInMonth > 0 ? limit / daysInMonth : 0;

    const nameMap = { 'my': '我的', 'partner': '对方的', 'both': '我们的' };
    const displayName = nameMap[budgetViewType] || '我的';

    
    const totalAmount = document.getElementById('budgetTotalAmount');
    if (totalAmount) {
        totalAmount.textContent = '¥' + limit.toFixed(2);
    }
    
    
    const titleEl = document.getElementById('budgetCircleTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i class="ri-bill-line"></i> ${displayName}预算`;
    }
    
    
    const remainingEl = document.getElementById('budgetRemaining');
    if (remainingEl) {
        remainingEl.textContent = '¥' + Math.max(remaining, 0).toFixed(2);
    }
    
    const spentEl = document.getElementById('budgetSpent');
    if (spentEl) {
        spentEl.textContent = '¥' + spent.toFixed(2);
    }
    
    const dailyEl = document.getElementById('budgetDaily');
    if (dailyEl) {
        dailyEl.textContent = '¥' + daily.toFixed(2);
    }
    
    
    updateBudgetCircle();
}
function updateBudgetCircle() {
    const config = BUDGET_CONFIG[budgetViewType];
    if (!config) return;
    
    const limit = getBudgetForMonth(budgetViewType, getBudgetMonthKey(budgetViewDate));
    const spent = getMonthExpenseByBelong(config.filter, budgetViewDate);
    
    const circleFill = document.getElementById('budgetCircleFill');
    if (!circleFill) return;
    
    
    const circumference = 157.08;
    const ratio = limit > 0 ? spent / limit : 0;
    const pct = Math.min(ratio, 1);
    const offset = circumference * (1 - pct);
    circleFill.style.strokeDashoffset = offset;
    
    
    if (limit > 0 && spent > limit) {
        circleFill.style.stroke = 'var(--expense)';
    } else if (ratio >= 0.8) {
        circleFill.style.stroke = 'var(--warning)';
    } else {
        circleFill.style.stroke = 'var(--primary)';
    }
    
    const labelEl = document.getElementById('budgetCircleLabel');
    
    if (limit > 0) {
        
        labelEl.innerHTML = `总预算 ¥${limit.toFixed(2)}`;
        labelEl.style.cursor = 'pointer';
        labelEl.onclick = function() {
            openBudgetModal(budgetViewType);
        };
    } else {
        
        const nameMap = { 'my': '我的', 'partner': '对方的', 'both': '我们的' };
        const displayName = nameMap[budgetViewType] || '我的';
        labelEl.innerHTML = `点击设置${displayName}预算`;
        labelEl.style.cursor = 'pointer';
        labelEl.onclick = function() {
            openBudgetModal(budgetViewType);
        };
    }
}


function updateBudgetBelongSlider() {
    const nav = document.getElementById('budgetBelongNav');
    const slider = document.getElementById('budgetBelongSlider');
    if (!nav || !slider) return;
    const activeBtn = nav.querySelector('.budget-belong-btn.active');
    if (!activeBtn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const width = btnRect.width * 0.2;
    const left = btnRect.left - navRect.left + (btnRect.width - width) / 2;
    slider.style.left = left + 'px';
    slider.style.width = width + 'px';
}


let budgetSwitching = false;
function switchBudgetBelong(type, forward) {
    if (budgetSwitching || type === budgetViewType) return;
    budgetSwitching = true;
    budgetViewType = type;
    document.querySelectorAll('.budget-belong-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.belong === type);
    });
    updateBudgetBelongSlider();

    const content = document.querySelector('.budget-main-content');
    const outClass = forward ? 'slide-out-left' : 'slide-out-right';
    const inClass = forward ? 'slide-in-right' : 'slide-in-left';

    if (content) {
        content.classList.remove('slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
        void content.offsetWidth;
        content.classList.add(outClass);

        const onOutEnd = () => {
            content.removeEventListener('animationend', onOutEnd);
            updateBudgetPage();
            updateBudgetCircle();
            content.classList.remove(outClass);
            void content.offsetWidth;
            content.classList.add(inClass);
            const onInEnd = () => {
                content.removeEventListener('animationend', onInEnd);
                content.classList.remove(inClass);
                budgetSwitching = false;
            };
            content.addEventListener('animationend', onInEnd);
        };
        content.addEventListener('animationend', onOutEnd);
    } else {
        updateBudgetPage();
        updateBudgetCircle();
        budgetSwitching = false;
    }
}

function initBudgetSwipe() {
    const content = document.querySelector('.budget-main-content');
    if (!content) return;
    let startX = 0, startY = 0, tracking = false;

    content.addEventListener('touchstart', function(e) {
        if (budgetSwitching) return;
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
    }, { passive: true });

    content.addEventListener('touchend', function(e) {
        if (!tracking) return;
        tracking = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        const order = ['my', 'partner', 'both'];
        const curIdx = order.indexOf(budgetViewType);
        let newType;
        if (dx < 0) {
            newType = order[curIdx + 1];
        } else {
            newType = order[curIdx - 1];
        }
        if (!newType) return;
        switchBudgetBelong(newType, dx < 0);
    }, { passive: true });
}


function initBudgetPage() {
    
    document.getElementById('budgetBackBtn')?.addEventListener('click', closeBudgetPage);
    
    
    document.getElementById('budgetDateBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();

        
        tempMonthDate = new Date(budgetViewDate);
        renderMonthPicker();

        
        const originalConfirm = monthBtnConfirm._originalClick || monthBtnConfirm.onclick;
        const originalToday = monthBtnToday ? (monthBtnToday._originalClick || monthBtnToday.onclick) : null;

        
        monthBtnConfirm.onclick = function() {
            
            syncMonthPickerValue();
            
            budgetViewDate = new Date(tempMonthDate);
            
            updateBudgetPage();
            updateBudgetCircle();
            closeMonthPicker();
            
            monthBtnConfirm.onclick = originalConfirm || confirmMonth;
            if (monthBtnToday) monthBtnToday.onclick = originalToday || goToCurrentMonth;
        };

        
        if (monthBtnToday) {
            monthBtnToday.onclick = function() {
                const today = new Date();
                tempMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
                renderMonthPicker();
                
                if (currentPage === 'budget') {
                    budgetViewDate = new Date(tempMonthDate);
                    updateBudgetPage();
                    updateBudgetCircle();
                    closeMonthPicker();
                } else {
                    confirmMonth();
                }
            };
        }

        
        openMonthPicker();
    });
    
    
    document.getElementById('budgetBelongNav')?.addEventListener('click', function(e) {
        const btn = e.target.closest('.budget-belong-btn');
        if (!btn) return;
        const type = btn.dataset.belong;
        if (type === budgetViewType) return;
        const order = ['my', 'partner', 'both'];
        const forward = order.indexOf(type) > order.indexOf(budgetViewType);
        switchBudgetBelong(type, forward);
    });

    
    initBudgetSwipe();
    
    
    const budgetItem = document.getElementById('budgetItem');
    if (budgetItem) {
        const newItem = budgetItem.cloneNode(true);
        budgetItem.parentNode.replaceChild(newItem, budgetItem);
        newItem.addEventListener('click', function() {
            const wallet = getCurrentWallet();
            budgetViewType = wallet.key;
            budgetViewDate = new Date(selectedMonthDate);
            openBudgetPage();
        });
    }
}


let statsDate = new Date(); 
let statsDatePickerView = 'week'; 
let statsPickerDate = new Date(); 
let statsTempSelectedDate = new Date(); 
let statsTempYear = new Date().getFullYear(); 


function getStatsWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d;
}

function getStatsWeekEnd(date) {
    const start = getStatsWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
}


function renderStatsWeekView() {
    const year = statsPickerDate.getFullYear();
    const month = statsPickerDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    document.getElementById('statsWeekPickerTitle').textContent = year + '年' + (month + 1) + '月';

    const selectedStart = getStatsWeekStart(statsTempSelectedDate);
    const selectedEnd = getStatsWeekEnd(statsTempSelectedDate);
    const today = new Date();

    let html = '';
    const totalCells = 35;
    
    
    const startDate = new Date(year, month, 1);
    startDate.setDate(1 - firstDayAdjusted);
    
    for (let i = 0; i < totalCells; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        
        const day = d.getDate();
        const dYear = d.getFullYear();
        const dMonth = d.getMonth();
        const isOtherMonth = (dMonth !== month || dYear !== year);
        const isInSelectedWeek = d >= selectedStart && d <= selectedEnd;
        const isToday = isSameDay(d, today);
        const isSelected = isSameDay(d, statsTempSelectedDate);
        
        let classes = 'stats-date-day-item';
        if (isOtherMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (isInSelectedWeek) classes += ' in-week';
        if (isSelected) classes += ' selected';
        if (isInSelectedWeek && isSameDay(d, selectedStart)) classes += ' first-day';
        if (isInSelectedWeek && isSameDay(d, selectedEnd)) classes += ' last-day';
        
        html += `<button class="${classes}" data-year="${dYear}" data-month="${dMonth}" data-day="${day}">${isToday ? '今' : day}</button>`;
    }

    document.getElementById('statsWeekDaysGrid').innerHTML = html;

    document.querySelectorAll('#statsWeekDaysGrid .stats-date-day-item').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const year = parseInt(this.dataset.year);
            const month = parseInt(this.dataset.month);
            const day = parseInt(this.dataset.day);
            statsTempSelectedDate = new Date(year, month, day);
            renderStatsWeekView();
        });
    });
}


function renderStatsMonthView() {
    const year = statsTempYear;
    document.getElementById('statsMonthPickerTitle').textContent = year + '年';

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const selectedMonth = statsTempSelectedDate.getMonth();
    const selectedYear = statsTempSelectedDate.getFullYear();

    let html = '';
    for (let i = 0; i < 12; i++) {
        const isCurrentMonth = (year === currentYear && i === currentMonth);
        const isSelected = (year === selectedYear && i === selectedMonth);
        let classes = 'stats-date-month-item';
        if (isCurrentMonth) classes += ' current-month';
        if (isSelected) classes += ' selected';
        html += `<button class="${classes}" data-month="${i}" data-year="${year}">${isCurrentMonth ? '本月' : (i + 1) + '月'}</button>`;
    }
    document.getElementById('statsMonthGrid').innerHTML = html;

document.querySelectorAll('#statsMonthGrid .stats-date-month-item').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const month = parseInt(this.dataset.month);
        const year = parseInt(this.dataset.year);
        statsTempSelectedDate = new Date(year, month, 1);
        renderStatsMonthView();
    });
});
}


function renderStatsYearView() {
    const wheelStatsYear = document.getElementById('wheelStatsYear');
    if (!wheelStatsYear) return;
    const yearValues = generateWheelItems(YEAR_MIN, YEAR_MAX, false);
    const selectedYear = statsTempSelectedDate.getFullYear();
    renderWheel(wheelStatsYear, yearValues, selectedYear, (newYear) => {
        const ny = parseInt(newYear, 10);
        statsTempSelectedDate = new Date(ny, 0, 1);
    });
}


function syncStatsYearWheelValue() {
    const wheelStatsYear = document.getElementById('wheelStatsYear');
    if (!wheelStatsYear) return;
    const wy = getWheelValue(wheelStatsYear);
    if (wy) {
        const ny = parseInt(wy, 10);
        statsTempSelectedDate = new Date(ny, 0, 1);
    }
}


function switchStatsDateView(view, skipScroll) {
    statsState.view = view;
    statsDatePickerView = view;
        updateStatsTodayButtonLabel();
    
    
    document.querySelectorAll('.stats-date-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    
    if (view === 'week') {
        renderStatsWeekView();
    } else if (view === 'month') {
        renderStatsMonthView();
    } else if (view === 'year') {
        renderStatsYearView();
    }

    
    updateStatsDateSliderPosition();

    
    if (!skipScroll) {
        const scrollContainer = document.getElementById('statsDateScroll');
        if (scrollContainer) {
            const viewOrder = ['week', 'month', 'year'];
            const targetIndex = viewOrder.indexOf(view);
            if (targetIndex >= 0) {
                const targetScroll = targetIndex * scrollContainer.clientWidth;
                if (Math.abs(scrollContainer.scrollLeft - targetScroll) > 1) {
                    scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
                }
            }
        }
    }
}


function updateStatsDateSliderPosition() {
    const toggle = document.getElementById('statsDateViewNav');
    const slider = document.getElementById('statsDateToggleSlider');
    if (!toggle || !slider) return;

    const buttons = toggle.querySelectorAll('.stats-date-view-btn');
    let activeBtn = null;
    buttons.forEach(btn => {
        if (btn.classList.contains('active')) {
            activeBtn = btn;
        }
    });
    if (!activeBtn) return;

    const toggleRect = toggle.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    const width = btnRect.width * 0.5;
    const left = btnRect.left - toggleRect.left + (btnRect.width - width) / 2;

    slider.style.left = left + 'px';
    slider.style.width = width + 'px';
}


function initStatsDateSwipe() {
    const scrollContainer = document.getElementById('statsDateScroll');
    if (!scrollContainer) return;

    let rafId = null;
    scrollContainer.addEventListener('scroll', function() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const containerWidth = scrollContainer.clientWidth;
            if (containerWidth === 0) return;
            const scrollLeft = scrollContainer.scrollLeft;
            const index = Math.round(scrollLeft / containerWidth);
            const viewOrder = ['week', 'month', 'year'];
            const newView = viewOrder[index];
            if (newView && newView !== statsDatePickerView) {
                
                document.querySelectorAll('.stats-date-view-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.view === newView);
                });
                statsDatePickerView = newView;
                updateStatsTodayButtonLabel();
                
                if (newView === 'week') {
                    renderStatsWeekView();
                } else if (newView === 'month') {
                    renderStatsMonthView();
                } else if (newView === 'year') {
                    renderStatsYearView();
                }
                updateStatsDateSliderPosition();
            }
            rafId = null;
        });
    });
}


function openStatsDatePicker() {
    
    const currentDate = new Date(statsState.date);
    statsTempSelectedDate = new Date(currentDate);
    statsPickerDate = new Date(currentDate);
    statsTempYear = currentDate.getFullYear();
    statsDatePickerView = statsState.view || 'month';

    
    switchStatsDateView(statsDatePickerView, true);

    
    const scrollContainer = document.getElementById('statsDateScroll');
    if (scrollContainer) {
        const viewOrder = ['week', 'month', 'year'];
        const targetIndex = viewOrder.indexOf(statsDatePickerView);
        if (targetIndex >= 0) {
            const targetScroll = targetIndex * scrollContainer.clientWidth;
            scrollContainer.scrollTo({ left: targetScroll, behavior: 'instant' });
        }
    }

    
    document.getElementById('statsDateOverlay').classList.add('show');
    document.getElementById('statsDateModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}



function closeStatsDatePicker() {
    const overlay = document.getElementById('statsDateOverlay');
    const modal = document.getElementById('statsDateModal');
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
}
function statsDatePrev() {
    if (statsDatePickerView === 'week') {
        
        const newDate = new Date(statsDate);
        newDate.setDate(newDate.getDate() - 7);
        statsDate = newDate;
    } else if (statsDatePickerView === 'month') {
        
        const newDate = new Date(statsDate);
        newDate.setMonth(newDate.getMonth() - 1);
        statsDate = newDate;
    } else if (statsDatePickerView === 'year') {
        
        const newDate = new Date(statsDate);
        newDate.setFullYear(newDate.getFullYear() - 1);
        statsDate = newDate;
    }
    updateStatsDateLabel();
    refreshStatsData();
}
function statsDateNext() {
    if (statsDatePickerView === 'week') {
        
        const newDate = new Date(statsDate);
        newDate.setDate(newDate.getDate() + 7);
        statsDate = newDate;
    } else if (statsDatePickerView === 'month') {
        
        const newDate = new Date(statsDate);
        newDate.setMonth(newDate.getMonth() + 1);
        statsDate = newDate;
    } else if (statsDatePickerView === 'year') {
        
        const newDate = new Date(statsDate);
        newDate.setFullYear(newDate.getFullYear() + 1);
        statsDate = newDate;
    }
    updateStatsDateLabel();
    refreshStatsData();
}

function confirmStatsDate() {
    
    if (statsDatePickerView === 'year') {
        syncStatsYearWheelValue();
    }

    
    statsState.date = new Date(statsTempSelectedDate);
    statsState.view = statsDatePickerView;

    
    closeStatsDatePicker();

    
    updateStatsDateLabel();
    renderStatsPage();
}

function goToStatsToday() {
    const today = new Date();
    const view = statsState.view || 'month';

    
    if (view === 'week') {
        
        const weekStart = getStatsWeekStart(today);
        statsTempSelectedDate = new Date(weekStart);
        statsPickerDate = new Date(weekStart);
    } else if (view === 'month') {
        
        statsTempSelectedDate = new Date(today.getFullYear(), today.getMonth(), 1);
        statsPickerDate = new Date(today);
    } else if (view === 'year') {
        
        statsTempSelectedDate = new Date(today.getFullYear(), 0, 1);
        statsPickerDate = new Date(today);
    }

    
    statsTempYear = statsTempSelectedDate.getFullYear();

    
    if (view === 'week') {
        renderStatsWeekView();
    } else if (view === 'month') {
        renderStatsMonthView();
    } else if (view === 'year') {
        renderStatsYearView();
    }
}
function updateStatsTodayButtonLabel() {
    const todayBtn = document.getElementById('statsDateBtnToday');
    if (!todayBtn) return;
    
    const view = statsState.view || 'month';
    const labels = {
        'week': '本周',
        'month': '本月',
        'year': '今年'
    };
    todayBtn.textContent = labels[view] || '今天';
}


function updateStatsDateLabel() {
    const label = document.getElementById('statsDateLabel');
    if (!label) return;
    
    const date = statsState.date;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const view = statsState.view || 'month';
    
    if (view === 'week') {
        const start = getStatsWeekStart(date);
        const end = getStatsWeekEnd(date);
        const startMonth = start.getMonth() + 1;
        const endMonth = end.getMonth() + 1;
        const startDay = start.getDate();
        const endDay = end.getDate();
        
        if (startMonth === endMonth) {
            label.textContent = `${start.getFullYear()}年${startMonth}月${startDay}日-${endDay}日`;
        } else {
            label.textContent = `${start.getFullYear()}年${startMonth}月${startDay}日-${endMonth}月${endDay}日`;
        }
    } else if (view === 'month') {
        label.textContent = `${year}年${month}月`;
    } else if (view === 'year') {
        label.textContent = `${year}年`;
    }
}


function refreshStatsData() {
    
    if (typeof renderStatsPage === 'function') {
        renderStatsPage();
    } else {
        
        console.log('刷新报表数据，当前日期:', statsDate, '视图:', statsDatePickerView);
        
        if (currentPage === 'stats') {
            
            
            showToast('已更新报表数据');
        }
    }
}


function initStatsDatePickerEvents() {
    
    const dateBtn = document.getElementById('statsDateBtn');
    if (dateBtn) {
        dateBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openStatsDatePicker();
        });
    }

    
    document.getElementById('statsDateModalClose')?.addEventListener('click', closeStatsDatePicker);
    document.getElementById('statsDateOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeStatsDatePicker();
    });

    
    document.querySelectorAll('.stats-date-view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            switchStatsDateView(view);
        });
    });

    
    initStatsDateSwipe();

    
    document.getElementById('statsWeekPrevMonth')?.addEventListener('click', function() {
        statsPickerDate.setMonth(statsPickerDate.getMonth() - 1);
        renderStatsWeekView();
    });
    document.getElementById('statsWeekNextMonth')?.addEventListener('click', function() {
        statsPickerDate.setMonth(statsPickerDate.getMonth() + 1);
        renderStatsWeekView();
    });

    
    document.getElementById('statsMonthPrevYear')?.addEventListener('click', function() {
        statsTempYear--;
        renderStatsMonthView();
    });
    document.getElementById('statsMonthNextYear')?.addEventListener('click', function() {
        statsTempYear++;
        renderStatsMonthView();
    });

    
    document.getElementById('statsDateBtnToday')?.addEventListener('click', goToStatsToday);
    document.getElementById('statsDateBtnConfirm')?.addEventListener('click', confirmStatsDate);

    
    document.addEventListener('click', function(e) {
        if (!document.getElementById('statsDateModal')?.classList.contains('show')) return;
        const modal = document.getElementById('statsDateModal');
        const trigger = document.getElementById('statsDateBtn');
        if (!modal.contains(e.target) && !trigger?.contains(e.target)) {
            closeStatsDatePicker();
        }
    });
}
 


let statsState = {
    type: 'expense',           
    date: new Date(),
    view: 'month',            
    selectedBelongs: ['all', '自己', '对方', '共同'],
    
    detailBelong: 'all',      
    categoryBelong: 'all',    
    rankBelong: 'all'         
};


function getStatsFilteredBills() {
    let filtered = [...allBills];
    
    
    if (statsState.type === 'expense') {
        filtered = filtered.filter(b => b.type === 'expense');
    } else {
        filtered = filtered.filter(b => b.type === 'income');
    }
    
    
    const date = statsState.date;
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (statsState.view === 'week') {
        const start = getStatsWeekStart(date);
        const end = getStatsWeekEnd(date);
        filtered = filtered.filter(b => {
            const d = new Date(b.date);
            return d >= start && d <= end;
        });
    } else if (statsState.view === 'month') {
        filtered = filtered.filter(b => {
            const d = new Date(b.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    } else if (statsState.view === 'year') {
        filtered = filtered.filter(b => {
            const d = new Date(b.date);
            return d.getFullYear() === year;
        });
    }
    
    return filtered;
}


function getStatsTrendData(bills, view, date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    let days = [];
    let labels = [];
    
    if (view === 'week') {
        const start = getStatsWeekStart(date);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
            labels.push((d.getMonth() + 1) + '/' + d.getDate());
        }
    } else if (view === 'month') {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
            labels.push(i);
        }
    } else if (view === 'year') {
        for (let i = 0; i < 12; i++) {
            days.push(new Date(year, i, 1));
            labels.push((i + 1) + '月');
        }
    }
    
    
    const belongMap = {
        'all': '总计',
        '自己': '自己',
        '对方': '对方',
        '共同': '共同'
    };
    
    const result = {};
    const selectedBelongs = statsState.selectedBelongs;
    selectedBelongs.forEach(key => {
        result[key] = {
            label: belongMap[key] || key,
            data: new Array(days.length).fill(0)
        };
    });
    
    bills.forEach(b => {
        const d = new Date(b.date);
        let index = -1;
        if (view === 'week' || view === 'month') {
            index = days.findIndex(day => isSameDay(day, d));
        } else if (view === 'year') {
            index = d.getMonth();
        }
        if (index >= 0) {
            const belongKey = getDisplayBelong(b);
            if (result[belongKey]) {
                result[belongKey].data[index] += b.amount;
            }
            if (result['all']) {
                result['all'].data[index] += b.amount;
            }
        }
    });
    
    return { labels, datasets: result, days };
}


function getStatsCategoryData(bills) {
    const categoryMap = {};
    let total = 0;
    bills.forEach(b => {
        const cat = b.category || '其他';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += b.amount;
        total += b.amount;
    });
    
    const sorted = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total * 100) : 0 }));
    
    return { data: sorted, total };
}


function getStatsRankData(bills) {
    const rankMap = {};
    bills.forEach(b => {
        const key = b.category || '其他';
        if (!rankMap[key]) {
            rankMap[key] = { category: key, total: 0, count: 0 };
        }
        rankMap[key].total += b.amount;
        rankMap[key].count += 1;
    });
    
    return Object.values(rankMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
}  
 

function renderStatsPage() {
    
    if (!statsState.view) {
        statsState.view = 'month';
    }
    
    const bills = getStatsFilteredBills();
    const date = statsState.date;
    const type = statsState.type;
    const view = statsState.view;
    
    
    updateStatsDateLabel();
    updateStatsTodayButtonLabel();
    
    
    document.querySelectorAll('.stats-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    updateTabIndicatorById('statsTypeNav');
    
    
    const typeLabel = type === 'income' ? '收入' : '支出';
    const typeLabelShort = type === 'income' ? '收' : '支';
    
    
    const cards = document.querySelectorAll('#page-stats .stats-card');
    
    
    const title0 = cards[0]?.querySelector('.stats-title');
    if (title0) {
        title0.textContent = `本月${typeLabel}详细`;
    }
    
    
    const title1 = cards[1]?.querySelector('.stats-title');
    if (title1) {
        title1.textContent = `${typeLabel}类目占比`;
    }
    
    
    const title2 = cards[2]?.querySelector('.stats-title');
    if (title2) {
        title2.textContent = `${typeLabel}趋势`;
    }
    
    
    const title3 = cards[3]?.querySelector('.stats-title');
    if (title3) {
        title3.textContent = `${typeLabel}明细排行`;
    }
    
    
    const pieLabel = document.querySelector('.stats-pie-center .total-label');
    if (pieLabel) {
        pieLabel.textContent = `总${typeLabel}`;
    }
    
    
    const gridItems = document.querySelectorAll('#page-stats .stats-grid-2x2 .stats-grid-item');
    const labelTexts = type === 'income' 
        ? ['本月总收入', '今日总收入', '本月日均收入', '本月剩余预算']
        : ['本月总支出', '今日总支出', '本月日均支出', '本月剩余预算'];
    const prefixTexts = type === 'income'
        ? ['收', '日', '收', '预']
        : ['支', '日', '支', '预'];
    
    gridItems.forEach((item, index) => {
        if (index < labelTexts.length) {
            const labelEl = item.querySelector('.item-label');
            if (labelEl) {
                const prefix = labelEl.querySelector('.label-prefix');
                labelEl.innerHTML = '';
                if (prefix) {
                    prefix.textContent = prefixTexts[index];
                    labelEl.appendChild(prefix);
                }
                labelEl.appendChild(document.createTextNode(labelTexts[index]));
            }
        }
    });
    
    
    const monthTotalEl = document.getElementById('statsMonthTotal');
    const todayTotalEl = document.getElementById('statsTodayTotal');
    const dailyAvgEl = document.getElementById('statsDailyAvg');
    const remainingEl = document.getElementById('statsRemaining');
    
    if (monthTotalEl) {
        monthTotalEl.className = 'item-value ' + (type === 'income' ? 'income' : 'expense');
    }
    if (todayTotalEl) {
        todayTotalEl.className = 'item-value ' + (type === 'income' ? 'income' : 'expense');
    }
    if (dailyAvgEl) {
        dailyAvgEl.className = 'item-value ' + (type === 'income' ? 'income' : 'expense');
    }
    if (remainingEl) {
        remainingEl.className = 'item-value primary';
    }
    
    
    renderStatsDetail(bills, date, statsState.detailBelong);
    renderStatsCategory(bills, statsState.categoryBelong);
    renderStatsRank(bills, statsState.rankBelong);
    renderStatsTrend(bills, date, view);
}

function renderStatsDetail(bills, date, belong) {
    
    document.querySelectorAll('#statsDetailNav .stats-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.belong === belong);
    });
    updateTabIndicatorById('statsDetailNav');
    
    
    let filteredBills = bills;
    if (belong !== 'all') {
        filteredBills = bills.filter(b => getDisplayBelong(b) === belong);
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    const isToday = (year === today.getFullYear() && month === today.getMonth() && date.getDate() === today.getDate());
    
    
    const monthBills = filteredBills.filter(b => {
        const d = new Date(b.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
    const monthTotal = monthBills.reduce((sum, b) => sum + b.amount, 0);
    
    
    const todayBills = filteredBills.filter(b => {
        const d = new Date(b.date);
        return isSameDay(d, today);
    });
    const todayTotal = todayBills.reduce((sum, b) => sum + b.amount, 0);
    
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyAvg = daysInMonth > 0 ? monthTotal / daysInMonth : 0;
    
    
    const belongMap = {
        '自己': 'my',
        '对方': 'partner',
        '共同': 'both'
    };
    let budgetLimit;
    if (belong === 'all') {
        
        const mk = getBudgetMonthKey(date);
        budgetLimit = getBudgetForMonth('my', mk) + getBudgetForMonth('partner', mk) + getBudgetForMonth('both', mk);
    } else {
        const budgetKey = belongMap[belong] || 'my';
        budgetLimit = getBudgetForMonth(budgetKey, getBudgetMonthKey(date));
    }
    const remaining = budgetLimit - monthTotal;
    
    
    document.getElementById('statsMonthTotal').textContent = '¥' + monthTotal.toFixed(2);
    document.getElementById('statsTodayTotal').textContent = '¥' + todayTotal.toFixed(2);
    document.getElementById('statsDailyAvg').textContent = '¥' + dailyAvg.toFixed(2);
    document.getElementById('statsRemaining').textContent = '¥' + Math.max(remaining, 0).toFixed(2);
    
    
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthBills = filteredBills.filter(b => {
        const d = new Date(b.date);
        return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
    const prevMonthTotal = prevMonthBills.reduce((sum, b) => sum + b.amount, 0);
    
    const trend = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal * 100) : 0;
    const trendEl = document.getElementById('statsMonthTrend');
    const trendIconEl = document.getElementById('statsMonthTrendIcon');
    if (trendEl) {
        trendEl.textContent = (trend >= 0 ? '+' : '') + trend.toFixed(1) + '%';
        trendEl.className = 'trend-value ' + (trend >= 0 ? 'up' : 'down');
    }
    if (trendIconEl) {
        trendIconEl.className = 'trend-icon ' + (trend >= 0 ? 'up' : 'down');
        trendIconEl.textContent = trend >= 0 ? '↑' : '↓';
    }
    
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayBills = filteredBills.filter(b => {
        const d = new Date(b.date);
        return isSameDay(d, yesterday);
    });
    const yesterdayTotal = yesterdayBills.reduce((sum, b) => sum + b.amount, 0);
    const todayTrend = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100) : 0;
    const todayTrendEl = document.getElementById('statsTodayTrend');
    const todayTrendIconEl = document.getElementById('statsTodayTrendIcon');
    if (todayTrendEl) {
        todayTrendEl.textContent = (todayTrend >= 0 ? '+' : '') + todayTrend.toFixed(1) + '%';
        todayTrendEl.className = 'trend-value ' + (todayTrend >= 0 ? 'up' : 'down');
    }
    if (todayTrendIconEl) {
        todayTrendIconEl.className = 'trend-icon ' + (todayTrend >= 0 ? 'up' : 'down');
        todayTrendIconEl.textContent = todayTrend >= 0 ? '↑' : '↓';
    }
}

function renderStatsCategory(bills, belong) {
    
    document.querySelectorAll('#statsCategoryNav .stats-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.belong === belong);
    });
    updateTabIndicatorById('statsCategoryNav');
    
    
    let filteredBills = bills;
    if (belong !== 'all') {
        filteredBills = bills.filter(b => getDisplayBelong(b) === belong);
    }

    
    const categoryMap = {};
    let total = 0;
    filteredBills.forEach(b => {
        const cat = b.category || '其他';
        if (!categoryMap[cat]) {
            categoryMap[cat] = { amount: 0, count: 0 };
        }
        categoryMap[cat].amount += b.amount;
        categoryMap[cat].count += 1;
        total += b.amount;
    });
    
    
    const data = Object.entries(categoryMap)
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([name, stats]) => ({
            name,
            value: stats.amount,
            count: stats.count,
            percent: total > 0 ? (stats.amount / total * 100) : 0
        }));
    
    const listEl = document.getElementById('statsCategoryList');
    const pieCenter = document.querySelector('.stats-pie-center');
    const emptyText = document.getElementById('statsPieEmptyText');
    
if (data.length === 0 || total === 0) {
    if (pieCenter) {
        pieCenter.style.display = 'none';
    }
    if (emptyText) {
        emptyText.style.display = 'block';
    }
    
    
    if (window._statsPieChart) {
        window._statsPieChart.dispose();
        window._statsPieChart = null;
    }
    
    var pieDom = document.getElementById('statsPieChart');
    if (pieDom) {
        
        pieDom.style.width = '100%';
        pieDom.style.height = '100%';
        
        var graySegments = [
            { value: 20, itemStyle: { color: 'rgba(200,200,200,0.20)' } },
            { value: 15, itemStyle: { color: 'rgba(200,200,200,0.28)' } },
            { value: 18, itemStyle: { color: 'rgba(200,200,200,0.22)' } },
            { value: 22, itemStyle: { color: 'rgba(200,200,200,0.32)' } },
            { value: 12, itemStyle: { color: 'rgba(200,200,200,0.18)' } },
            { value: 13, itemStyle: { color: 'rgba(200,200,200,0.25)' } }
        ];
        
        var emptyOption = {
            tooltip: { show: false },
            series: [{
                type: 'pie',
                radius: ['30%', '55%'],
                center: ['50%', '50%'],
                silent: true,
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: { show: false },
                data: graySegments
            }]
        };
        
        window._statsPieChart = echarts.init(pieDom);
        window._statsPieChart.setOption(emptyOption);
    }
    
    
    listEl.innerHTML = '';
    return;
}
    
    
    if (pieCenter) {
        pieCenter.style.display = 'block';
    }
    if (emptyText) {
        emptyText.style.display = 'none';
    }
    
    
    const pieData = data.map(item => ({ name: item.name, value: item.value }));
    renderStatsPieChart(pieData, total);
    
    
    const allCats = getCategoriesByType(statsState.type);
    const isIncome = statsState.type === 'income';
    const colors = [
        '#5CB8E8', '#F5A0A0', '#7DCFA0', '#FFC93C', '#C9A5D9',
        '#FF9F6E', '#5DD4B8', '#F08080', '#6FB7E8', '#DEB887',
        '#90D8CC', '#E6A0A0', '#7AB8E8', '#C4A86E', '#A0C8A0'
    ];
    
    const DEFAULT_SHOW = 4;
    const hasMore = data.length > DEFAULT_SHOW;
    
    listEl.dataset.totalCount = data.length;
    listEl.dataset.currentShow = DEFAULT_SHOW;
    listEl.dataset.allData = JSON.stringify(data);
    
    function renderCategoryItems(count) {
        const itemsToShow = data.slice(0, count);
        let html = '';
        
        itemsToShow.forEach((item, index) => {
            const color = colors[index % colors.length];
            const cat = allCats.find(c => c.label === item.name);
            const icon = cat ? cat.icon : 'fa-tag';
            const isLast = index === itemsToShow.length - 1;
            const sign = isIncome ? '+' : '-';
            
            html += `
                <div class="stats-category-item clickable" 
                     data-category="${item.name}" 
                     data-type="${statsState.type}"
                     data-belong="${belong}"
                     style="cursor:pointer;">
                    <div class="cat-icon-wrapper" style="color:${color}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="cat-content">
                        <div class="cat-top-row">
                            <span class="cat-name">${item.name}</span>
                            <span class="cat-amount">${sign}¥${item.value.toFixed(2)} <span class="cat-count">(${item.count}笔)</span></span>
                        </div>
                        <div class="cat-bar-row">
                            <div class="cat-bar">
                                <div class="cat-bar-fill" style="width:${Math.min(item.percent, 100)}%;background:${color}"></div>
                            </div>
                        </div>
                    </div>
                </div>
                ${!isLast ? '<div class="stats-category-divider"></div>' : ''}
            `;
        });
        return html;
    }
    
    let html = `<div id="statsCategoryItems">${renderCategoryItems(DEFAULT_SHOW)}</div>`;
    
    if (hasMore) {
        html += `
            <div class="load-more-wrapper" id="statsCategoryLoadMoreWrapper">
                <button class="load-more-btn" id="statsCategoryLoadMoreBtn" data-expanded="false">
                    点击展开
                    <i class="ri-arrow-down-s-line"></i>
                </button>
            </div>
        `;
    }
    
    listEl.innerHTML = html;
    
    const loadMoreBtn = document.getElementById('statsCategoryLoadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.removeEventListener('click', handleCategoryLoadMore);
        loadMoreBtn.addEventListener('click', handleCategoryLoadMore);
    }
}


function hexToRgba(hex, alpha) {
    
    hex = hex.replace('#', '');
    
    
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


function handleCategoryLoadMore(e) {
    const btn = e.currentTarget;
    const isExpanded = btn.dataset.expanded === 'true';
    const itemsContainer = document.getElementById('statsCategoryItems');
    const listEl = document.getElementById('statsCategoryList');
    const allData = JSON.parse(listEl.dataset.allData);
    const totalCount = parseInt(listEl.dataset.totalCount);
    
    const belong = statsState.categoryBelong || 'all';
    
    if (isExpanded) {
        
        itemsContainer.innerHTML = renderCategoryItemsStatic(Math.min(4, totalCount), allData, belong);
        btn.innerHTML = '点击展开 <i class="ri-arrow-down-s-line"></i>';
        btn.dataset.expanded = 'false';
    } else {
        
        itemsContainer.innerHTML = renderCategoryItemsStatic(totalCount, allData, belong);
        btn.innerHTML = '点击收起 <i class="ri-arrow-up-s-line"></i>';
        btn.dataset.expanded = 'true';
    }
}


function renderCategoryItemsStatic(count, data, belong) {  
    const colors = [
        '#5CB8E8', 
        '#F5A0A0', 
        '#7DCFA0', 
        '#FFC93C', 
        '#C9A5D9', 
        '#FF9F6E', 
        '#5DD4B8', 
        '#F08080', 
        '#6FB7E8', 
        '#DEB887', 
        '#90D8CC', 
        '#E6A0A0', 
        '#7AB8E8', 
        '#C4A86E', 
        '#A0C8A0', 
    ];
    const allCats = getCategoriesByType(statsState.type);
    const itemsToShow = data.slice(0, count);
    let html = '';
    
    itemsToShow.forEach((item, index) => {
        const color = colors[index % colors.length];
        const cat = allCats.find(c => c.label === item.name);
        const icon = cat ? cat.icon : 'fa-tag';
        const isLast = index === itemsToShow.length - 1;
        const isIncome = statsState.type === 'income';
        const sign = isIncome ? '+' : '-';
        
        html += `
            <div class="stats-category-item clickable" 
                 data-category="${item.name}" 
                 data-type="${statsState.type}"
                 data-belong="${belong || 'all'}"
                 style="cursor:pointer;">
                <div class="cat-icon-wrapper" style="color:${color}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="cat-content">
                    <div class="cat-top-row">
                        <span class="cat-name">${item.name}</span>
                        <span class="cat-amount">${sign}¥${item.value.toFixed(2)} <span class="cat-count">(${item.count}笔)</span></span>
                    </div>
                    <div class="cat-bar-row">
                        <div class="cat-bar">
                            <div class="cat-bar-fill" style="width:${Math.min(item.percent, 100)}%;background:${color}"></div>
                        </div>
                    </div>
                </div>
            </div>
            ${!isLast ? '<div class="stats-category-divider"></div>' : ''}
        `;
    });
    
    return html;
}

function renderStatsPieChart(data, total) {
    var dom = document.getElementById('statsPieChart');
    if (!dom) return;
    
    
    dom.style.width = '100%';
    dom.style.height = '100%';
    
    
    document.getElementById('statsPieTotal').textContent = '¥' + total.toFixed(2);
    
    var colors = [
        '#5CB8E8',
        '#F5A0A0',
        '#7DCFA0',
        '#FFC93C',
        '#C9A5D9',
        '#FF9F6E',
        '#5DD4B8',
        '#F08080',
        '#6FB7E8',
        '#DEB887',
        '#90D8CC',
        '#E6A0A0',
        '#7AB8E8',
        '#C4A86E',
        '#A0C8A0'
    ];
    
    
    
    
    
    var LEADER_MIN_PERCENT = 5;
    var MAX_LEADER_LABELS = 6;
    var leaderLabelCount = 0;

    var labels = data.slice(0, 10).map(function(d) { return d.name; });
    var values = data.slice(0, 10).map(function(d) { return d.value; });
    var totalVal = values.reduce(function(a, b) { return a + b; }, 0);

    var seriesData = labels.map(function(name, i) {
        var sliceColor = colors[i % colors.length];
        var pct = total > 0 ? (values[i] / total * 100) : 0;
        var showLabel = false;
        if (pct >= LEADER_MIN_PERCENT && leaderLabelCount < MAX_LEADER_LABELS) {
            showLabel = true;
            leaderLabelCount++;
        }
        return {
            name: name,
            value: values[i],
            itemStyle: { color: sliceColor },
            label: { show: showLabel },
            labelLine: {
                show: showLabel,
                lineStyle: { color: sliceColor }
            }
        };
    });
    
    var option = {
        tooltip: {
            show: false
        },
        series: [{
            type: 'pie',
            radius: ['30%', '55%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            silent: true,
            itemStyle: {
                borderRadius: 0,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: true,
                position: 'outside',
                formatter: function(params) {
                    
                    
                    var pct = total > 0 ? (params.value / total * 100) : 0;
                    return params.name + '\n' + pct.toFixed(1) + '%';
                },
                color: '#666',
                fontSize: 12,
                lineHeight: 16,
                distanceToLabelLine: 4
            },
            labelLine: {
                show: true,
                length: 10,
                length2: 8,
                lineStyle: {
                    color: '#bbb',
                    width: 1
                }
            },
            emphasis: {
                disabled: true
            },
            data: seriesData
        }]
    };
    
    if (window._statsPieChart) {
        window._statsPieChart.resize();
        window._statsPieChart.setOption(option, true);
    } else {
        window._statsPieChart = echarts.init(dom);
        window._statsPieChart.setOption(option);
    }
}

function renderStatsTrend(bills, date, view) {
    var dom = document.getElementById('statsTrendChart');
    if (!dom) return;
    
    
    var trendParent = dom.parentElement;
    if (trendParent) {
        dom.style.width = '100%';
        dom.style.height = '100%';
    }
    
    var trendData = getStatsTrendData(bills, view, date);
    var labels = trendData.labels;
    var datasets = trendData.datasets;
    var days = trendData.days;
    
    
    var hasRealData = false;
    if (bills && bills.length > 0) {
        var year = date.getFullYear();
        var month = date.getMonth();
        if (view === 'week') {
            var start = getStatsWeekStart(date);
            var end = getStatsWeekEnd(date);
            hasRealData = bills.some(function(b) {
                var d = new Date(b.date);
                return d >= start && d <= end;
            });
        } else if (view === 'month') {
            hasRealData = bills.some(function(b) {
                var d = new Date(b.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
        } else {
            hasRealData = bills.some(function(b) {
                var d = new Date(b.date);
                return d.getFullYear() === year;
            });
        }
    }
    
    
    var placeholder = document.querySelector('.stats-trend-placeholder');
    var container = dom.parentElement;
    
    if (!placeholder && container) {
        container.style.position = 'relative';
        container.style.height = '280px';
        placeholder = document.createElement('div');
        placeholder.className = 'stats-trend-placeholder';
        placeholder.innerHTML = '<div class="stats-trend-empty"><span>暂无数据</span></div>';
        placeholder.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;pointer-events:none;z-index:3;flex-direction:column;';
        container.appendChild(placeholder);
    }
    
    if (placeholder) {
        if (!hasRealData) {
            placeholder.style.display = 'flex';
        } else {
            placeholder.style.display = 'none';
        }
    }
    
    
    var hasData = labels.length > 0;
    var displayLabels = hasData ? labels : (view === 'week' ? ['一','二','三','四','五','六','日'] : (view === 'month' ? ['1日','15日','30日'] : ['1月','6月','12月']));
    
    var colors = {
        'all': '#5CB8E8',
        '自己': '#7DCFA0',
        '对方': '#F5A0A0',
        '共同': '#C9A5D9'
    };
    var colorNames = {
        'all': '总计',
        '自己': '自己',
        '对方': '对方',
        '共同': '共同'
    };
    
    var selectedBelongs = statsState.selectedBelongs;
    var series = [];
    
    if (hasData) {
        selectedBelongs.forEach(function(key) {
            if (datasets[key]) {
                var c = colors[key] || '#4F9BFA';
                series.push({
                    name: colorNames[key] || key,
                    type: 'line',
                    data: datasets[key].data,
                    lineStyle: { color: c, width: 2.5 },
                    itemStyle: { color: c },
                    symbol: 'none',
                    smooth: 0.3,
                    connectNulls: false,
                    areaStyle: { color: c, opacity: 0.08 }
                });
            }
        });
    }
    
    if (series.length === 0) {
        series.push({
            name: '暂无数据',
            type: 'line',
            data: new Array(displayLabels.length).fill(0),
            lineStyle: { color: 'transparent', width: 0 },
            itemStyle: { color: 'transparent' },
            symbol: 'none',
            smooth: 0.3
        });
    }
    
    
    var allValues = [];
    series.forEach(function(ds) {
        ds.data.forEach(function(v) {
            if (v > 0) allValues.push(v);
        });
    });
    
    var yMin = 0;
    var yMax = 100;
    var stepSize = 50;
    
    if (allValues.length > 0) {
        var maxVal = Math.max.apply(null, allValues);
        if (maxVal > 0) {
            yMax = maxVal;
            stepSize = Math.round(maxVal / 2);
            if (stepSize === 0) stepSize = 50;
        }
    }
    
    
    var xLabelStep = Math.max(0, Math.floor(displayLabels.length / 6) - 1);
    
    var option = {
        tooltip: { show: false },
        grid: {
            top: 20,
            right: 20,
            bottom: 28,
            left: 12,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: displayLabels,
            boundaryGap: false,
            axisLine: {
                lineStyle: { color: 'rgba(0,0,0,0.5)', width: 1.5, type: 'dashed' }
            },
            axisTick: { show: false },
            axisLabel: {
                fontSize: 10,
                color: 'var(--text-fix, #999)',
                interval: xLabelStep
            }
        },
        yAxis: {
            type: 'value',
            min: yMin,
            max: yMax,
            interval: stepSize,
            axisLabel: {
                fontSize: 10,
                color: 'var(--text-fix, #999)',
                formatter: function(value) {
                    if (value >= 10000) {
                        return '¥' + (value / 10000).toFixed(1) + '万';
                    }
                    return '¥' + value;
                }
            },
            splitLine: {
                show: true,
                lineStyle: { color: 'rgba(0,0,0,0.12)', type: 'dashed', width: 1 }
            },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        series: series
    };
    
    if (window._statsTrendChart) {
        window._statsTrendChart.resize();
        window._statsTrendChart.setOption(option, true);
    } else {
        window._statsTrendChart = echarts.init(dom);
        window._statsTrendChart.setOption(option);
    }
}

function renderStatsRank(bills, belong) {
    
    document.querySelectorAll('#statsRankNav .stats-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.belong === belong);
    });
    updateTabIndicatorById('statsRankNav');
    
    let filteredBills = bills;
    if (belong !== 'all') {
        filteredBills = bills.filter(b => getDisplayBelong(b) === belong);
    }

    const sortedBills = [...filteredBills].sort((a, b) => b.amount - a.amount);
    const totalCount = sortedBills.length;
    const listEl = document.getElementById('statsRankList');
    const isIncome = statsState.type === 'income';
    
    if (totalCount === 0) {
        listEl.innerHTML = `
            <div class="stats-empty">
                <div class="empty-text">暂无数据</div>
            </div>
        `;
        return;
    }
    
    const DEFAULT_SHOW = 4;
    const hasMore = totalCount > DEFAULT_SHOW;
    
    listEl.dataset.totalCount = totalCount;
    listEl.dataset.currentShow = DEFAULT_SHOW;
    listEl.dataset.allBills = JSON.stringify(sortedBills.map(b => b.id));
    
function renderBillItems(count) {
    const itemsToShow = sortedBills.slice(0, count);
    let html = '';
    
    itemsToShow.forEach((bill) => {
        const cats = getCategoriesByType(bill.type);
        const cat = cats.find(c => c.label === bill.category);
        const icon = cat ? cat.icon : 'fa-tag';
        
        const typeClass = bill.type === 'income' ? 'income' : 'expense';
        const sign = bill.type === 'income' ? '+' : '-';
        const displayText = bill.note && bill.note.trim() ? bill.note.trim() : bill.category;

        
        const belongDisplay = getDisplayBelongName(bill);
        const isHelp = isHelpBill(bill);

        html += `
            <div class="bill-item-static" data-id="${bill.id}">
                <div class="bill-item-content">
                    <div class="bill-left">
                        <div class="bill-icon ${typeClass}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="bill-info">
                            <div class="bill-category">${escapeHtml(displayText)}</div>
                            <div class="bill-note">
                                <span></span>
                                <span class="belong-tag">${belongDisplay}</span>${isHelp ? '<span class="belong-tag help-tag">帮记</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="bill-amount ${typeClass}">${sign}¥${bill.amount.toFixed(2)}</div>
                </div>
            </div>
        `;
    });
    
    return html;
}
    
    let html = renderBillItems(DEFAULT_SHOW);
    
    if (hasMore) {
        html += `
            <div class="load-more-wrapper" id="statsLoadMoreWrapper">
                <button class="load-more-btn" id="statsLoadMoreBtn">
                    查看更多
                    <i class="ri-arrow-down-s-line"></i>
                </button>
            </div>
        `;
    }
    
    listEl.innerHTML = html;
    
    listEl.querySelectorAll('.bill-item-static').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (id && !isNaN(id)) {
                viewBillDetail(id);
            }
        });
    });
    
    const loadMoreBtn = document.getElementById('statsLoadMoreBtn');
    if (loadMoreBtn) {
loadMoreBtn.addEventListener('click', function() {
    const wrapper = document.getElementById('statsLoadMoreWrapper');
    const listEl = document.getElementById('statsRankList');
    const allBillIds = JSON.parse(listEl.dataset.allBills);
    const allBillsData = allBillIds.map(id => sortedBills.find(b => b.id === id)).filter(Boolean);
    
    if (wrapper) wrapper.remove();
    
    let html = '';
    allBillsData.forEach((bill) => {
        const cats = getCategoriesByType(bill.type);
        const cat = cats.find(c => c.label === bill.category);
        const icon = cat ? cat.icon : 'fa-tag';
        const typeClass = bill.type === 'income' ? 'income' : 'expense';
        const sign = bill.type === 'income' ? '+' : '-';
        const displayText = bill.note && bill.note.trim() ? bill.note.trim() : bill.category;

        
        const belongDisplay = getDisplayBelongName(bill);
        const isHelp = isHelpBill(bill);

        html += `
            <div class="bill-item-static" data-id="${bill.id}">
                <div class="bill-item-content">
                    <div class="bill-left">
                        <div class="bill-icon ${typeClass}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="bill-info">
                            <div class="bill-category">${escapeHtml(displayText)}</div>
                            <div class="bill-note">
                                <span></span>
                                <span class="belong-tag">${belongDisplay}</span>${isHelp ? '<span class="belong-tag help-tag">帮记</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="bill-amount ${typeClass}">${sign}¥${bill.amount.toFixed(2)}</div>
                </div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    
    listEl.querySelectorAll('.bill-item-static').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (id && !isNaN(id)) {
                viewBillDetail(id);
            }
        });
    });
});
    }
}



let annualState = {
    year: new Date().getFullYear(),
    belong: 'all',          
    tempYear: null          
};


function formatAnnualAmount(num) {
    const value = Number(num || 0);
    if (value < 0) return '-¥' + Math.abs(value).toFixed(2);
    return '¥' + value.toFixed(2);
}


function getAnnualFilteredBills() {
    const year = annualState.year;
    const belong = annualState.belong;
    if (!allBills || allBills.length === 0) return [];
    return allBills.filter(b => {
        const d = new Date(b.date);
        if (d.getFullYear() !== year) return false;
        if (belong === 'all') return true;
        const displayBelong = getDisplayBelong(b);
        if (belong === 'my') return displayBelong === '自己';
        if (belong === 'partner') return displayBelong === '对方';
        if (belong === 'both') return displayBelong === '共同';
        return true;
    });
}


function renderAnnualPage() {
    const bills = getAnnualFilteredBills();
    
    const monthlyData = [];
    let totalExpense = 0;
    let totalIncome = 0;
    for (let m = 0; m < 12; m++) {
        monthlyData.push({ month: m, expense: 0, income: 0 });
    }
    bills.forEach(b => {
        const d = new Date(b.date);
        const m = d.getMonth();
        if (b.type === 'expense') {
            monthlyData[m].expense += b.amount;
            totalExpense += b.amount;
        } else if (b.type === 'income') {
            monthlyData[m].income += b.amount;
            totalIncome += b.amount;
        }
    });
    const totalBalance = totalIncome - totalExpense;

    
    const dateLabel = document.getElementById('annualDateLabel');
    if (dateLabel) dateLabel.textContent = annualState.year + '年';

    
    const balanceEl = document.getElementById('annualBalanceAmount');
if (balanceEl) {
    balanceEl.textContent = formatAnnualAmount(totalBalance);
    balanceEl.style.color = 'var(--text-primary)';
}
    const expenseEl = document.getElementById('annualExpenseAmount');
    if (expenseEl) expenseEl.textContent = formatAnnualAmount(totalExpense);
    const incomeEl = document.getElementById('annualIncomeAmount');
    if (incomeEl) incomeEl.textContent = formatAnnualAmount(totalIncome);

    
    const listBody = document.getElementById('annualListBody');
    if (listBody) {
        const hasData = bills.length > 0;
        if (!hasData) {
            listBody.innerHTML = '<div class="annual-list-empty">该年份暂无账单数据</div>';
        } else {
            listBody.innerHTML = monthlyData.map(m => {
                const balance = m.income - m.expense;
                const balanceCls = balance < 0 ? 'balance neg' : 'balance';
                return `
                    <div class="annual-list-row" data-month="${m.month}">
                        <span class="annual-list-col month">${m.month + 1}月</span>
                        <span class="annual-list-col expense">${formatAnnualAmount(m.expense)}</span>
                        <span class="annual-list-col income">${formatAnnualAmount(m.income)}</span>
                        <span class="annual-list-col ${balanceCls}">${formatAnnualAmount(balance)}</span>
                        <i class="ri-arrow-right-s-line annual-list-arrow"></i>
                    </div>
                `;
            }).join('');
        }
    }

    
    updateTabIndicatorById('annualBelongNav');
}


function openAnnualPage() {
    const pageEl = document.getElementById('page-annual');
    if (!pageEl) return;
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    renderAnnualPage();
    
    requestAnimationFrame(() => {
        setTimeout(() => updateTabIndicatorById('annualBelongNav'), 0);
    });
    currentPage = 'annual';
}


function closeAnnualPage() {
    const pageEl = document.getElementById('page-annual');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    currentPage = 'profile';
}



let yearPickerContext = 'bills'; 

function openAnnualYearPicker() {
    yearPickerContext = 'annual';
    
    tempSelectedYear = annualState.year;
    
    const yearConfirmBtn = document.getElementById('yearBtnConfirm');
    const yearTodayBtn = document.getElementById('yearBtnToday');
    if (yearConfirmBtn) yearConfirmBtn.onclick = null;
    if (yearTodayBtn) yearTodayBtn.onclick = null;
    
    openYearPicker();
}


function switchAnnualBelong(belong) {
    if (belong === annualState.belong) return;
    annualState.belong = belong;
    
    document.querySelectorAll('.annual-belong-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.belong === belong);
    });
    updateTabIndicatorById('annualBelongNav');
    renderAnnualPage();
}


function initAnnualPageEvents() {
    
    document.getElementById('annualBackBtn')?.addEventListener('click', closeAnnualPage);
    
    document.getElementById('annualDateBtn')?.addEventListener('click', openAnnualYearPicker);
    
    const nav = document.getElementById('annualBelongNav');
    if (nav) {
        nav.addEventListener('click', function(e) {
            const btn = e.target.closest('.annual-belong-btn');
            if (!btn) return;
            const belong = btn.dataset.belong;
            if (belong === annualState.belong) return;
            switchAnnualBelong(belong);
        });
    }
    
    const listBody = document.getElementById('annualListBody');
    if (listBody) {
        listBody.addEventListener('click', function(e) {
            const row = e.target.closest('.annual-list-row');
            if (!row) return;
            const month = parseInt(row.dataset.month, 10);
            if (isNaN(month)) return;
            
            statsState.date = new Date(annualState.year, month, 1);
            statsState.view = 'month';
            
            const pageEl = document.getElementById('page-annual');
            if (pageEl) {
                pageEl.classList.remove('active');
                pageEl.style.display = 'none';
                pageEl.style.transform = '';
            }
            
            showPage('stats');
        });
    }
}



function initStatsEvents() {
document.getElementById('statsCategoryList')?.addEventListener('click', function(e) {
    const item = e.target.closest('.stats-category-item.clickable');
    if (!item) return;
    const category = item.dataset.category;
    const type = item.dataset.type || 'expense';
    const belong = item.dataset.belong || 'all';  
    if (category) {
        openCategoryDetail(category, type, belong);
    }
});
    
    let statsTypeSwitching = false;
    document.querySelectorAll('.stats-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            if (type === statsState.type || statsTypeSwitching) return;

            const order = ['expense', 'income'];
            const forward = order.indexOf(type) > order.indexOf(statsState.type);

            statsState.type = type;

            
            document.querySelectorAll('.stats-type-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.type === type);
            });
            updateTabIndicatorById('statsTypeNav');

            
            const container = document.querySelector('#page-stats .bills-scroll-container');
            if (container) {
                statsTypeSwitching = true;
                const outClass = forward ? 'slide-out-left' : 'slide-out-right';
                const inClass = forward ? 'slide-in-right' : 'slide-in-left';

                container.classList.remove('slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
                void container.offsetWidth; 
                container.classList.add(outClass);

                const onOutEnd = () => {
                    container.removeEventListener('animationend', onOutEnd);
                    renderStatsPage();
                    container.classList.remove(outClass);
                    void container.offsetWidth;
                    container.classList.add(inClass);
                    const onInEnd = () => {
                        container.removeEventListener('animationend', onInEnd);
                        container.classList.remove(inClass);
                        statsTypeSwitching = false;
                    };
                    container.addEventListener('animationend', onInEnd);
                };
                container.addEventListener('animationend', onOutEnd);
            } else {
                renderStatsPage();
            }
        });
    });
    
    
    document.querySelectorAll('#statsDetailNav .stats-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const belong = this.dataset.belong;
            if (belong === statsState.detailBelong) return;
            statsState.detailBelong = belong;
            renderStatsPage();
            animateTabContent(this.closest('.stats-card').querySelector('.stats-grid-2x2'));
        });
    });
    
    
    document.querySelectorAll('#statsCategoryNav .stats-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const belong = this.dataset.belong;
            if (belong === statsState.categoryBelong) return;
            statsState.categoryBelong = belong;
            
            const bills = getStatsFilteredBills();
            renderStatsCategory(bills, belong);
            
            document.querySelectorAll('#statsCategoryNav .stats-nav-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.belong === belong);
            });
            animateTabContent(document.getElementById('statsCategoryList'));
        });
    });
    
    
    document.querySelectorAll('#statsRankNav .stats-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const belong = this.dataset.belong;
            if (belong === statsState.rankBelong) return;
            statsState.rankBelong = belong;
            
            const bills = getStatsFilteredBills();
            renderStatsRank(bills, belong);
            
            document.querySelectorAll('#statsRankNav .stats-nav-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.belong === belong);
            });
            animateTabContent(document.getElementById('statsRankList'));
        });
    });
    
    
    document.querySelectorAll('#statsTrendCheckbox .stats-trend-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const belong = this.value;
            if (this.checked) {
                if (!statsState.selectedBelongs.includes(belong)) {
                    statsState.selectedBelongs.push(belong);
                }
            } else {
                
                if (statsState.selectedBelongs.length <= 1) {
                    this.checked = true;
                    showToast('至少保留一项');
                    return;
                }
                statsState.selectedBelongs = statsState.selectedBelongs.filter(b => b !== belong);
            }
            
            const bills = getStatsFilteredBills();
            renderStatsTrend(bills, statsState.date, statsState.view);
        });
    });
    
    
    document.getElementById('statsDatePrev')?.addEventListener('click', function() {
        const date = new Date(statsState.date);
        const view = statsState.view;
        if (view === 'week') {
            date.setDate(date.getDate() - 7);
        } else if (view === 'month') {
            date.setMonth(date.getMonth() - 1);
        } else if (view === 'year') {
            date.setFullYear(date.getFullYear() - 1);
        }
        statsState.date = date;
        renderStatsPage();
    });
    
    document.getElementById('statsDateNext')?.addEventListener('click', function() {
        const date = new Date(statsState.date);
        const view = statsState.view;
        if (view === 'week') {
            date.setDate(date.getDate() + 7);
        } else if (view === 'month') {
            date.setMonth(date.getMonth() + 1);
        } else if (view === 'year') {
            date.setFullYear(date.getFullYear() + 1);
        }
        statsState.date = date;
        renderStatsPage();
    });
}


let catDetailState = {
    category: '',
    type: 'expense',
    date: new Date(),
    view: 'month',
    belong: 'all'  
};


function openCategoryDetail(category, type, belong) {
    if (!category) return;
    
    
    previousPage = currentPage;
    
    
    catDetailState.category = category;
    catDetailState.type = type || 'expense';
    
    catDetailState.date = new Date(statsState.date);
    
    catDetailState.view = statsState.view || 'month';
    catDetailState.belong = belong || 'all'; 
    
    const pageEl = document.getElementById('page-category-detail');
    if (!pageEl) return;

    
    document.getElementById('catDetailTitle').textContent = category;

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'category-detail';

    
    renderCategoryDetail();
}


function closeCategoryDetail() {
    
    const target = (previousPage && previousPage !== 'category-detail') ? previousPage : 'stats';
    const pageEl = document.getElementById('page-category-detail');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        renderStatsPage();
        updateStatsDateLabel();
    } else if (target === 'profile') renderProfile();
}


function getCategoryDetailBills() {
    let filtered = [...allBills];
    
    
    filtered = filtered.filter(b => b.type === catDetailState.type);
    
    
    filtered = filtered.filter(b => b.category === catDetailState.category);
    
    
    const date = catDetailState.date;
    const year = date.getFullYear();
    const month = date.getMonth();
    const view = catDetailState.view || 'month';
    if (catDetailState.belong && catDetailState.belong !== 'all') {
        filtered = filtered.filter(b => getDisplayBelong(b) === catDetailState.belong);
    }
    
    if (view === 'week') {
        const start = getStatsWeekStart(date);
        const end = getStatsWeekEnd(date);
        filtered = filtered.filter(b => {
            const d = new Date(b.date);
            return d >= start && d <= end;
        });
    } else if (view === 'month') {
        filtered = filtered.filter(b => {
            const d = new Date(b.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    } else if (view === 'year') {
        filtered = filtered.filter(b => {
            const d = new Date(b.date);
            return d.getFullYear() === year;
        });
    }
    
    return filtered;
}


function renderCategoryDetail() {
    const bills = getCategoryDetailBills();
    
    
    updateCategoryDetailDateLabel();
    
    
    const total = bills.reduce((sum, b) => sum + b.amount, 0);
    const isIncome = catDetailState.type === 'income';
    
    
    const totalLabel = document.querySelector('.cat-detail-summary-item:first-child .cat-detail-summary-label');
    if (totalLabel) {
        totalLabel.textContent = isIncome ? '总收入' : '总支出';
    }
    
    
    const totalValueEl = document.getElementById('catDetailTotal');
    if (totalValueEl) {
        const sign = isIncome ? '' : '-';
        totalValueEl.textContent = sign + '¥' + total.toFixed(2);
        
        totalValueEl.className = 'cat-detail-summary-value ' + (isIncome ? 'income' : 'expense');
    }
    
    document.getElementById('catDetailCount').textContent = bills.length;
    
    
    renderCategoryDetailList(bills);
}


function updateCategoryDetailDateLabel() {
    const label = document.getElementById('catDetailDateLabel');
    if (!label) return;
    
    const date = catDetailState.date;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const view = catDetailState.view || 'month';
    
    if (view === 'week') {
        const start = getStatsWeekStart(date);
        const end = getStatsWeekEnd(date);
        const startMonth = start.getMonth() + 1;
        const endMonth = end.getMonth() + 1;
        const startDay = start.getDate();
        const endDay = end.getDate();
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        
        if (startYear === endYear && startMonth === endMonth) {
            label.textContent = `${startYear}年${startMonth}月${startDay}日-${endDay}日`;
        } else if (startYear === endYear) {
            label.textContent = `${startYear}年${startMonth}月${startDay}日-${endMonth}月${endDay}日`;
        } else {
            label.textContent = `${startYear}年${startMonth}月${startDay}日-${endYear}年${endMonth}月${endDay}日`;
        }
    } else if (view === 'month') {
        label.textContent = `${year}年${month}月`;
    } else if (view === 'year') {
        label.textContent = `${year}年`;
    }
}


function renderCategoryDetailList(bills) {
    const container = document.getElementById('catDetailList');
    const isIncome = catDetailState.type === 'income';
    
    if (bills.length === 0) {
        container.innerHTML = `
            <div class="cat-detail-empty">
        <div class="empty-icon"><i class="ri-inbox-line"></i></div>
                <div class="empty-text">该时间段没有 "${catDetailState.category}" 的记账记录</div>
            </div>
        `;
        return;
    }
    
    
    const dateGroups = {};
    bills.forEach(b => {
        if (!dateGroups[b.date]) dateGroups[b.date] = [];
        dateGroups[b.date].push(b);
    });
    
    const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
    
    let html = '';
    dates.forEach(date => {
        const dayBills = dateGroups[date];
        const dayTotal = dayBills.reduce((sum, b) => sum + b.amount, 0);
        const sign = isIncome ? '' : '-';
        
        html += `
            <div class="cat-detail-date-card">
                <div class="cat-detail-date-card-header">
                    <span class="date-label">${formatDateDisplay(date)}</span>
                    <span class="date-total"><span class="total-prefix">总</span>${sign}¥${dayTotal.toFixed(2)}</span>
                </div>
                <div class="cat-detail-date-card-body">
                    ${dayBills.map(b => renderCategoryDetailBillItem(b)).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    
    container.querySelectorAll('.bill-item-static').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (id && !isNaN(id)) {
                viewBillDetail(id);
            }
        });
    });
}


function renderCategoryDetailBillItem(b) {
    const typeClass = b.type === 'income' ? 'income' : 'expense';
    const sign = b.type === 'income' ? '+' : '-';
    
    const cats = getCategoriesByType(b.type);
    const cat = cats.find(c => c.label === b.category);
    const icon = cat ? cat.icon : 'fa-tag';
    
    const displayText = b.note && b.note.trim() ? b.note.trim() : b.category;

    
    const belongDisplay = getDisplayBelongName(b);
    const isHelp = isHelpBill(b);

    return `
        <div class="bill-item-static" data-id="${b.id}">
            <div class="bill-item-content">
                <div class="bill-left">
                    <div class="bill-icon ${typeClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="bill-info">
                        <div class="bill-category">${escapeHtml(displayText)}</div>
                        <div class="bill-note">
                            <span></span>
                            <span class="belong-tag">${belongDisplay}</span>${isHelp ? '<span class="belong-tag help-tag">帮记</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="bill-amount ${typeClass}">${sign}¥${b.amount.toFixed(2)}</div>
            </div>
        </div>
    `;
}



function initCategoryDetailEvents() {
    
    document.getElementById('catDetailBackBtn')?.addEventListener('click', closeCategoryDetail);
    
    
    document.getElementById('catDetailDatePrev')?.addEventListener('click', function() {
        const date = new Date(catDetailState.date);
        const view = catDetailState.view || 'month';
        if (view === 'week') {
            date.setDate(date.getDate() - 7);
        } else if (view === 'month') {
            date.setMonth(date.getMonth() - 1);
        } else if (view === 'year') {
            date.setFullYear(date.getFullYear() - 1);
        }
        catDetailState.date = date;
        renderCategoryDetail();
    });
    
    
    document.getElementById('catDetailDateNext')?.addEventListener('click', function() {
        const date = new Date(catDetailState.date);
        const view = catDetailState.view || 'month';
        if (view === 'week') {
            date.setDate(date.getDate() + 7);
        } else if (view === 'month') {
            date.setMonth(date.getMonth() + 1);
        } else if (view === 'year') {
            date.setFullYear(date.getFullYear() + 1);
        }
        catDetailState.date = date;
        renderCategoryDetail();
    });
    
    
    document.getElementById('catDetailDateBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        
        
        const currentDate = new Date(catDetailState.date);
        statsTempSelectedDate = new Date(currentDate);
        statsPickerDate = new Date(currentDate);
        statsTempYear = currentDate.getFullYear();
        
        
        const view = catDetailState.view || 'month';
        statsDatePickerView = view;
        
        
        document.querySelectorAll('.stats-date-view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        
        if (view === 'week') {
            renderStatsWeekView();
            
            document.querySelectorAll('#statsWeekDaysGrid .stats-date-day-item').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const year = parseInt(this.dataset.year);
                    const month = parseInt(this.dataset.month);
                    const day = parseInt(this.dataset.day);
                    statsTempSelectedDate = new Date(year, month, day);
                    renderStatsWeekView();
                });
            });
        } else if (view === 'month') {
            renderStatsMonthView();
            document.querySelectorAll('#statsMonthGrid .stats-date-month-item').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const month = parseInt(this.dataset.month);
                    const year = parseInt(this.dataset.year);
                    statsTempSelectedDate = new Date(year, month, 1);
                    renderStatsMonthView();
                });
            });
        } else if (view === 'year') {
            renderStatsYearView();
        }

        
        updateStatsDateSliderPosition();

        
        document.querySelectorAll('.stats-date-view-btn').forEach(btn => {
            btn.removeEventListener('click', handleStatsViewSwitch);
            btn.addEventListener('click', handleStatsViewSwitch);
        });
        
        
        const confirmBtn = document.getElementById('statsDateBtnConfirm');
        const originalConfirm = confirmBtn.onclick;
        confirmBtn.onclick = function() {
            
            const activeView = document.querySelector('.stats-date-view-btn.active');
            const view = activeView ? activeView.dataset.view : 'month';
            if (view === 'year') {
                syncStatsYearWheelValue();
            }
            
            catDetailState.date = new Date(statsTempSelectedDate);
            
            if (activeView) {
                catDetailState.view = activeView.dataset.view;
            }
            renderCategoryDetail();
            closeStatsDatePicker();
            
            confirmBtn.onclick = originalConfirm;
        };

        
        const todayBtn = document.getElementById('statsDateBtnToday');
        if (todayBtn) {
            const originalToday = todayBtn.onclick;
            todayBtn.onclick = function() {
                const today = new Date();
                statsTempSelectedDate = new Date(today);
                statsPickerDate = new Date(today);
                statsTempYear = today.getFullYear();

                const activeView = document.querySelector('.stats-date-view-btn.active');
                const view = activeView ? activeView.dataset.view : 'month';

                if (view === 'week') renderStatsWeekView();
                else if (view === 'month') renderStatsMonthView();
                else if (view === 'year') renderStatsYearView();

                catDetailState.date = new Date(today);
                catDetailState.view = view;
                renderCategoryDetail();
                closeStatsDatePicker();
                
                todayBtn.onclick = originalToday;
            };
        }
        
        
        const closeBtn = document.getElementById('statsDateModalClose');
        const originalClose = closeBtn.onclick;
        closeBtn.onclick = function() {
            closeStatsDatePicker();
            closeBtn.onclick = originalClose;
        };
        
        
        document.getElementById('statsDateOverlay').classList.add('show');
        document.getElementById('statsDateModal').classList.add('show');
        document.body.style.overflow = 'hidden';

        
        const scrollContainer = document.getElementById('statsDateScroll');
        if (scrollContainer) {
            const viewOrder = ['week', 'month', 'year'];
            const targetIndex = viewOrder.indexOf(view);
            if (targetIndex >= 0) {
                const targetScroll = targetIndex * scrollContainer.clientWidth;
                scrollContainer.scrollTo({ left: targetScroll, behavior: 'instant' });
            }
        }
    });
}


function handleStatsViewSwitch(e) {
    const btn = e.currentTarget;
    const view = btn.dataset.view;
    
    
    document.querySelectorAll('.stats-date-view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === view);
    });
    
    
    statsDatePickerView = view;

    
    updateStatsDateSliderPosition();

    
    const scrollContainer = document.getElementById('statsDateScroll');
    if (scrollContainer) {
        const viewOrder = ['week', 'month', 'year'];
        const targetIndex = viewOrder.indexOf(view);
        if (targetIndex >= 0) {
            const targetScroll = targetIndex * scrollContainer.clientWidth;
            if (Math.abs(scrollContainer.scrollLeft - targetScroll) > 1) {
                scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        }
    }
    
    
    if (view === 'week') {
        renderStatsWeekView();
        
        document.querySelectorAll('#statsWeekDaysGrid .stats-date-day-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const year = parseInt(this.dataset.year);
                const month = parseInt(this.dataset.month);
                const day = parseInt(this.dataset.day);
                statsTempSelectedDate = new Date(year, month, day);
                renderStatsWeekView();
            });
        });
    } else if (view === 'month') {
        renderStatsMonthView();
        document.querySelectorAll('#statsMonthGrid .stats-date-month-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const month = parseInt(this.dataset.month);
                const year = parseInt(this.dataset.year);
                statsTempSelectedDate = new Date(year, month, 1);
                renderStatsMonthView();
            });
        });
    } else if (view === 'year') {
        renderStatsYearView();
    }
}

async function fetchPartnerProfile() {
    if (!currentPartner) {
        return null;
    }
    try {
        
        if (partnerProfileInfo) {
            return partnerProfileInfo;
        }
        const data = await apiCall('/user/partner/profile', 'GET');
        partnerProfileInfo = data.profile || currentPartner || null;
        return partnerProfileInfo;
    } catch (err) {
        console.warn('获取搭子信息失败:', err);
        
        partnerProfileInfo = currentPartner || null;
        return partnerProfileInfo;
    }
}


async function openPartnerProfilePage() {
    if (!currentPartner) {
        showToast('请先匹配搭子');
        return;
    }
    
    previousPage = currentPage;
    const pageEl = document.getElementById('page-partner-profile');
    if (!pageEl) return;
    
    try {
        await fetchPartnerProfile();
    } catch (err) {
        partnerProfileInfo = currentPartner;
        console.warn('使用缓存的搭子信息');
    }
    
    updatePartnerProfilePage();

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'partner-profile';
}


function updatePartnerProfilePage() {
    if (!currentPartner) return;
    
    const img = document.getElementById('partnerProfileAvatarImg');
    const icon = document.getElementById('partnerProfileAvatarIcon');
    
    if (currentPartner.avatar) {
        img.src = currentPartner.avatar;
        img.style.display = 'block';
        icon.style.display = 'none';
    } else {
        img.style.display = 'none';
        icon.style.display = 'block';
    }
    
    const info = partnerProfileInfo || currentPartner;
    
    const displayName = info.nickname || info.uid || '搭子';
    const nameEl = document.getElementById('partnerProfileName');
    if (nameEl) nameEl.textContent = displayName;
    
    const uidEl = document.getElementById('partnerProfileUid');
    if (uidEl) {
        uidEl.textContent = 'UID: ' + (info.uid || '--------');
    }
    
    document.getElementById('partnerProfileNicknameValue').textContent = info.nickname || '未设置';
    
    const genderMap = { 'male': '男', 'female': '女', 'secret': '保密' };
    const gender = info.gender ? (genderMap[info.gender] || info.gender) : '未设置';
    document.getElementById('partnerProfileGenderValue').textContent = gender;
    
    document.getElementById('partnerProfileBirthdayValue').textContent = info.birthday || '未设置';
    document.getElementById('partnerProfilePhoneValue').textContent = info.phone || '未绑定';
}


function closePartnerProfilePage() {
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-partner-profile');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        renderStatsPage();
        updateStatsDateLabel();
    } else if (target === 'profile') renderProfile();
}

function rebindPartnerAvatarClick() {
    const wrapper = document.querySelector('.profile-partner-avatar-wrapper');
    if (!wrapper) return;
    
    
    const newWrapper = wrapper.cloneNode(true);
    wrapper.parentNode.replaceChild(newWrapper, wrapper);
    
    newWrapper.addEventListener('click', function(e) {
        e.stopPropagation();
        if (currentPartner) {
            
            previousPage = currentPage;
            openPartnerProfilePage();
        } else {
            
            openMatchPage();
        }
    });
}


function initPartnerProfileEvents() {
    
    const backBtn = document.getElementById('partnerProfileBackBtn');
    if (backBtn) {
        
        const newBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBtn, backBtn);
        newBtn.addEventListener('click', closePartnerProfilePage);
    }
}

let profileInfoState = {
    nickname: '',
    gender: '',
    birthday: '',
    phone: '',
};


async function loadProfileInfo() {
    try {
        const data = await apiCall('/user/profile', 'GET');
        const profile = data.profile || {};
        profileInfoState = {
            nickname: profile.nickname || currentUser?.nickname || '',
            gender: profile.gender || '',
            birthday: profile.birthday || '',
            phone: profile.phone || '',  
        };
        
        if (currentUser) {
            currentUser.nickname = profile.nickname;
            currentUser.gender = profile.gender;
            currentUser.birthday = profile.birthday;
            currentUser.phone = profile.phone;  
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        return profileInfoState;
    } catch (err) {
        console.warn('加载个人信息失败:', err);
        
        try {
            const raw = localStorage.getItem('profile_info');
            if (raw) {
                const data = JSON.parse(raw);
                profileInfoState = { ...profileInfoState, ...data };
            }
        } catch (e) {}
        if (currentUser && !profileInfoState.nickname) {
            profileInfoState.nickname = currentUser.nickname || currentUser.uid || '';
        }
        return profileInfoState;
    }
}


async function saveProfileInfo(data) {
    try {
        const response = await apiCall('/user/profile', 'PUT', data);
        const profile = response.profile || {};
        profileInfoState = {
            nickname: profile.nickname || '',
            gender: profile.gender || '',
            birthday: profile.birthday || '',
            phone: profile.phone || '',
        };
        if (currentUser) {
            currentUser.nickname = profile.nickname;
            currentUser.gender = profile.gender;
            currentUser.birthday = profile.birthday;
            currentUser.phone = profile.phone;
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        localStorage.setItem('profile_info', JSON.stringify(profileInfoState));
        
        updateProfileInfoCard();
        updateProfileInfoUid();
        return profileInfoState;
    } catch (err) {
        console.warn('保存个人信息失败:', err);
        const newData = { ...profileInfoState, ...data };
        profileInfoState = newData;
        localStorage.setItem('profile_info', JSON.stringify(newData));
        updateProfileInfoCard();
        updateProfileInfoUid();
        return newData;
    }
}

async function openProfileInfoPage() {
    const pageEl = document.getElementById('page-profile-info');
    if (!pageEl) return;

    previousPage = currentPage;
    
    updateProfileInfoAvatar();
    updateProfileInfoCard();
    updateProfileInfoUid(); 

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'profile-info';
    
    
    try {
        await loadProfileInfo();
        updateProfileInfoAvatar();
        updateProfileInfoCard();
        updateProfileInfoUid(); 
    } catch (err) {
        console.warn('加载个人信息失败:', err);
    }
}
function updateProfileInfoUid() {
    const uidEl = document.getElementById('profileInfoUid');
    const nameEl = document.getElementById('profileInfoName');
    if (uidEl) {
        uidEl.textContent = 'UID: ' + (currentUser?.uid || '--------');
    }
    if (nameEl) {
        const displayName = profileInfoState.nickname || currentUser?.uid || '用户';
        nameEl.textContent = displayName;
    }
}
function closeProfileInfoPage() {
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-profile-info');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target !== 'budget' && target !== 'stats') stopBudgetRealtimeSync();
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') { enterStatsPage(); }
    else if (target === 'profile') renderProfile();
}


function updateProfileInfoAvatar() {
    const img = document.getElementById('profileInfoAvatarImg');
    const icon = document.getElementById('profileInfoAvatarIcon');
    
    
    if (currentUser && currentUser.avatar) {
        img.src = currentUser.avatar;
        img.style.display = 'block';
        icon.style.display = 'none';
    } else {
        img.style.display = 'none';
        icon.style.display = 'block';
    }
}

function updateProfileInfoCard() {
    
    const nicknameInput = document.getElementById('profileInfoNicknameInput');
    if (nicknameInput) {
        const val = profileInfoState.nickname || '';
        if (document.activeElement !== nicknameInput) {
            nicknameInput.value = val;
        }
        nicknameInput.placeholder = val ? '' : '请输入昵称';
    }
    
    
    const genderEl = document.getElementById('profileInfoGenderValue');
    if (genderEl) {
        const genderMap = { 'male': '男', 'female': '女', 'secret': '保密' };
        const val = profileInfoState.gender ? (genderMap[profileInfoState.gender] || profileInfoState.gender) : '未设置';
        genderEl.textContent = val;
        genderEl.className = 'info-item-value' + (val === '未设置' ? ' empty' : '');
    }
    
    
    const birthdayEl = document.getElementById('profileInfoBirthdayValue');
    if (birthdayEl) {
        const val = profileInfoState.birthday || '未设置';
        birthdayEl.textContent = val;
        birthdayEl.className = 'info-item-value' + (val === '未设置' ? ' empty' : '');
    }
    
    
    const phoneEl = document.getElementById('profileInfoPhoneValue');
    if (phoneEl) {
        const rawPhone = profileInfoState.phone || '';
        let displayPhone = '未绑定';
        if (rawPhone && /^1\d{10}$/.test(rawPhone)) {
            displayPhone = rawPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        } else if (rawPhone) {
            displayPhone = rawPhone; 
        }
        phoneEl.textContent = displayPhone;
        phoneEl.className = 'info-item-value' + (displayPhone === '未绑定' ? ' empty' : '');
    }
    
    
    const nameEl = document.getElementById('profileInfoName');
    if (nameEl) {
        nameEl.textContent = profileInfoState.nickname || currentUser?.uid || '用户';
    }
}


function initProfileInfoAvatarUpload() {
    const wrapper = document.getElementById('profileInfoAvatarWrapper');
    const input = document.getElementById('profileInfoAvatarInput');
    if (!wrapper || !input) return;

    
    wrapper.addEventListener('click', function(e) {
        if (e.target.closest('.profile-info-avatar-label')) return;
        input.click();
    });

    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('请选择图片文件');
            input.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('图片大小不能超过 5MB');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(ev) {
            const imageUrl = ev.target.result;
            
            openAvatarCropModal(imageUrl);
            
            const originalConfirm = avatarBtnConfirm.onclick;
            avatarBtnConfirm.onclick = function() {
                if (!cropper) {
                    showToast('请先裁剪图片');
                    return;
                }
                const canvas = cropper.getCroppedCanvas({
                    width: 200,
                    height: 200,
                    imageSmoothingQuality: 'high',
                });
                if (!canvas) {
                    showToast('裁剪失败，请重试');
                    return;
                }
                const avatarBase64 = canvas.toDataURL('image/jpeg', 0.92);
                uploadProfileInfoAvatar(avatarBase64);
            };
        };
        reader.readAsDataURL(file);
        input.value = '';
    });
}

async function uploadProfileInfoAvatar(avatarBase64) {
    try {
        const data = await apiCall('/user/avatar', 'PUT', { avatar: avatarBase64 });
        
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        
        updateProfileInfoAvatar();
        
        renderProfile();
        updateHomeAvatar();
        
        updateWalletDisplay();
        
        closeAvatarCropModal();
        
        
        avatarBtnConfirm.onclick = function() {
            if (!cropper) {
                showToast('请先裁剪图片');
                return;
            }
            const canvas = cropper.getCroppedCanvas({
                width: 200,
                height: 200,
                imageSmoothingQuality: 'high',
            });
            if (!canvas) {
                showToast('裁剪失败，请重试');
                return;
            }
            const avatarBase64 = canvas.toDataURL('image/jpeg', 0.92);
            uploadAvatar(avatarBase64);
        };
    } catch (err) {
        showToast('头像上传失败: ' + err.message);
    }
}


function openProfileEditModal(field) {
    
    if (field === 'gender') {
        openGenderPicker();
        return;
    }
    
    
    if (field === 'birthday') {
        openBirthdayPicker();
        return;
    }
    
    
    const existingOverlay = document.getElementById('profileEditOverlay');
    if (existingOverlay && existingOverlay.parentNode) {
        existingOverlay.parentNode.removeChild(existingOverlay);
    }
    
    
    const overlay = document.createElement('div');
    overlay.className = 'profile-edit-overlay';
    overlay.id = 'profileEditOverlay';
    
    let title = '';
    let content = '';
    let value = '';
    
    switch(field) {
        case 'nickname':
            title = '修改昵称';
            value = profileInfoState.nickname || '';
            content = `<input type="text" id="profileEditInput" placeholder="请输入昵称" maxlength="20" value="${escapeHtml(value)}" />`;
            break;
        case 'phone':
            title = '绑定手机号';
            value = profileInfoState.phone || '';
            const displayPhone = value ? value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';
            content = `
                <div style="margin-bottom:12px;font-size:13px;color:var(--text-light);">
                    当前绑定：${displayPhone}
                </div>
                <input type="tel" id="profileEditInput" placeholder="请输入新的手机号" maxlength="11" value="" />
                <div style="margin-top:8px;font-size:12px;color:var(--text-light);">
                    <i class="ri-information-line"></i> 输入11位手机号，留空则解绑
                </div>
            `;
            break;
        default:
            return;
    }
    
    overlay.innerHTML = `
        <div class="profile-edit-modal">
            <div class="profile-edit-header">
                <span class="profile-edit-title">${title}</span>
                <button class="profile-edit-close" id="profileEditClose">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <div class="profile-edit-body">
                ${content}
                <button class="profile-edit-save" id="profileEditSave">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    
    const forceCloseModal = function() {
        
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        const residual = document.getElementById('profileEditOverlay');
        if (residual && residual.parentNode) {
            residual.parentNode.removeChild(residual);
        }
    };
    
    
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        const input = document.getElementById('profileEditInput');
        if (input) {
            if (field === 'nickname' || field === 'phone') {
                input.select();
            }
        }
    });
    
    
    const closeBtn = document.getElementById('profileEditClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            forceCloseModal();
        });
    }
    
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            forceCloseModal();
        }
    });
    
    
    const saveBtn = document.getElementById('profileEditSave');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            
            const input = document.getElementById('profileEditInput');
            if (!input) return;
            const newValue = input.value.trim();
            
            
            if (field === 'phone') {
                if (newValue !== '' && !/^1\d{10}$/.test(newValue)) {
                    showToast('请输入正确的11位手机号');
                    input.focus();
                    return;
                }
            }
            
            if (field === 'nickname' && !newValue) {
                showToast('昵称不能为空');
                return;
            }
            
            
            this.disabled = true;
            this.textContent = '保存中...';
            
            try {
                const updates = {};
                updates[field] = newValue;
                
                const response = await apiCall('/user/profile', 'PUT', updates);
                
                if (response.profile) {
                    profileInfoState = {
                        ...profileInfoState,
                        ...response.profile
                    };
                    if (currentUser) {
                        currentUser.nickname = response.profile.nickname;
                        currentUser.gender = response.profile.gender;
                        currentUser.birthday = response.profile.birthday;
                        currentUser.phone = response.profile.phone;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                    localStorage.setItem('profile_info', JSON.stringify(profileInfoState));
                }
                
                updateProfileInfoCard();
                renderProfile();
                updateHomeAvatar();
                updateWalletDisplay();
                renderHome();
                renderBills();
                
                const msg = field === 'phone' ? (newValue ? '手机号绑定成功' : '手机号已解绑') : '修改成功';
                showToast(msg);
                
                
                forceCloseModal();
                
            } catch (err) {
                showToast('保存失败: ' + err.message);
                
                forceCloseModal();
            } finally {
                this.disabled = false;
                this.textContent = '确认';
            }
        });
    }
    
    
    const input = document.getElementById('profileEditInput');
    if (input && field !== 'gender') {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const btn = document.getElementById('profileEditSave');
                if (btn) btn.click();
            }
        });
    }
    
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            forceCloseModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

let birthdayTempDate = new Date();
let birthdaySelectedDate = null;

function openBirthdayPicker() {
    
    const currentBirthday = profileInfoState.birthday || '';
    let initialDate = new Date();
    initialDate.setHours(0, 0, 0, 0);
    
    if (currentBirthday) {
        const parts = currentBirthday.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            if (!isNaN(d.getTime())) {
                initialDate = d;
            }
        }
    }
    
    birthdayTempDate = new Date(initialDate);
    birthdaySelectedDate = new Date(initialDate);
    
    
    tempSelectedDate = new Date(initialDate);
    viewDate = new Date(initialDate);
    
    
    const overlay = document.getElementById('dateOverlay');
    const modal = document.getElementById('dateModal');
    const confirmBtn = document.getElementById('dateBtnConfirm');
    const todayBtn = document.getElementById('dateBtnToday');
    const titleEl = document.querySelector('.date-modal-title');
    
    
    if (!overlay || !modal) {
        console.warn('日期选择器元素不存在');
        showToast('日期选择器加载失败，请重试');
        return;
    }
    
    
    const hasTodayBtn = !!todayBtn;
    
    
    const editOverlay = document.getElementById('profileEditOverlay');
    if (editOverlay) {
        
        
        
        overlay.style.zIndex = '1000';
        modal.style.zIndex = '1001';
    }
    
    
    
    
    
    
    if (todayBtn) todayBtn.textContent = '今天';
    
    
    const originalConfirm = confirmBtn?.onclick;
    const originalToday = todayBtn?.onclick;
    
    
    confirmBtn.onclick = function(e) {
        
        const wy = document.getElementById('wheelYear');
        const wm = document.getElementById('wheelMonth');
        const wd = document.getElementById('wheelDay');
        let selDate;
        if (wy && wm && wd) {
            const yIdx = Math.round(wy.scrollTop / WHEEL_ITEM_HEIGHT);
            const mIdx = Math.round(wm.scrollTop / WHEEL_ITEM_HEIGHT);
            const dIdx = Math.round(wd.scrollTop / WHEEL_ITEM_HEIGHT);
            const yItems = wy.querySelectorAll('.wheel-item');
            const mItems = wm.querySelectorAll('.wheel-item');
            const dItems = wd.querySelectorAll('.wheel-item');
            const yv = yItems[yIdx]?.dataset.value;
            const mv = mItems[mIdx]?.dataset.value;
            const dv = dItems[dIdx]?.dataset.value;
            if (yv && mv && dv) {
                selDate = new Date(parseInt(yv, 10), parseInt(mv, 10) - 1, parseInt(dv, 10));
                tempSelectedDate = new Date(selDate);
            }
        }
        if (!selDate) selDate = new Date(tempSelectedDate);
        const year = selDate.getFullYear();
        const month = String(selDate.getMonth() + 1).padStart(2, '0');
        const day = String(selDate.getDate()).padStart(2, '0');
        const dateStr = year + '-' + month + '-' + day;
        
        window.__skipConfirmDateUpdate = true;
        saveBirthday(dateStr);
        closeDatePicker();
        
        setTimeout(() => {
            window.__skipConfirmDateUpdate = false;
        }, 0);
        
        confirmBtn.onclick = originalConfirm;
        if (todayBtn) todayBtn.onclick = originalToday;
        
        overlay.style.zIndex = '';
        modal.style.zIndex = '';
    };
    
    if (todayBtn) {
        todayBtn.onclick = function() {
            const today = new Date();
            tempSelectedDate = new Date(today);
            viewDate = new Date(today);
            renderDatePicker();
        };
    }
    
    
    renderDatePicker();
    
    
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    });
    
    
    const originalClose = dateModalClose.onclick;
    dateModalClose.onclick = function() {
        overlay.style.zIndex = '';
        modal.style.zIndex = '';
        closeDatePicker();
        if (originalClose) originalClose.call(this);
    };
}

function renderGenderPicker() {
    const wheel = document.getElementById('wheelGender');
    if (!wheel) return;
    
    
    let html = '';
    GENDER_OPTIONS.forEach(g => {
        const selected = g === genderTempValue;
        html += `<div class="wheel-item ${selected ? 'wheel-selected' : ''}" data-value="${g}">${g}</div>`;
    });
    wheel.innerHTML = html;
    
    
    const index = GENDER_OPTIONS.indexOf(genderTempValue);
    if (index >= 0) {
        wheel.scrollTop = index * WHEEL_ITEM_HEIGHT;
    }
    
    
    wheel.onscroll = null;
    
    
    let scrollTimer = null;
    wheel.addEventListener('scroll', function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const idx = Math.round(wheel.scrollTop / WHEEL_ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(GENDER_OPTIONS.length - 1, idx));
            wheel.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
            wheel.querySelectorAll('.wheel-item').forEach((el, i) => {
                el.classList.toggle('wheel-selected', i === clamped);
            });
            genderTempValue = GENDER_OPTIONS[clamped];
            scrollTimer = null;
        }, 120);
    });
    
    
    wheel.querySelectorAll('.wheel-item').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const val = this.dataset.value;
            const idx = GENDER_OPTIONS.indexOf(val);
            if (idx >= 0) {
                wheel.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
            }
        });
    });
}

function openGenderPicker() {
    
    const currentGender = profileInfoState.gender || 'secret';
    genderTempValue = GENDER_REVERSE_MAP[currentGender] || '保密';
    
    renderGenderPicker();
    
    const overlay = document.getElementById('genderOverlay');
    const modal = document.getElementById('genderModal');
    if (overlay) overlay.classList.add('show');
    if (modal) modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeGenderPicker() {
    const overlay = document.getElementById('genderOverlay');
    const modal = document.getElementById('genderModal');
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
}

function confirmGender() {
    
    const genderValue = GENDER_MAP[genderTempValue] || 'secret';
    saveGender(genderValue);
    closeGenderPicker();
}

async function saveGender(gender) {
    try {
        await saveProfileInfo({ gender: gender });
        updateProfileInfoCard();
        renderProfile();
        showToast('性别修改成功');
    } catch (err) {
        showToast('保存失败: ' + err.message);
    }
}

async function saveBirthday(date) {
    try {
        await saveProfileInfo({ birthday: date });
        updateProfileInfoCard();
        renderProfile();
        showToast('生日修改成功');
    } catch (err) {
        showToast('保存失败: ' + err.message);
    }
}

function initProfileInfoEvents() {
    
    document.getElementById('profileInfoBackBtn')?.addEventListener('click', closeProfileInfoPage);
    
    
    initProfileInfoAvatarUpload();
    
    
    const nicknameInput = document.getElementById('profileInfoNicknameInput');
    if (nicknameInput) {
        let nicknameSaving = false;
        let nicknameOldValue = '';

        async function saveNickname() {
            if (nicknameSaving) return;
            const newValue = nicknameInput.value.trim();
            if (!newValue) {
                showToast('昵称不能为空');
                nicknameInput.value = nicknameOldValue;
                return;
            }
            if (newValue === nicknameOldValue) return;

            nicknameSaving = true;
            try {
                const response = await apiCall('/user/profile', 'PUT', { nickname: newValue });
                if (response.profile) {
                    profileInfoState = { ...profileInfoState, ...response.profile };
                    if (currentUser) {
                        currentUser.nickname = response.profile.nickname;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                    localStorage.setItem('profile_info', JSON.stringify(profileInfoState));
                }
                updateProfileInfoCard();
                renderProfile();
                updateHomeAvatar();
                renderHome();
                renderBills();
                showToast('修改成功');
            } catch (err) {
                showToast('保存失败: ' + err.message);
                nicknameInput.value = nicknameOldValue;
            } finally {
                nicknameSaving = false;
            }
        }

        nicknameInput.addEventListener('focus', function() {
            nicknameOldValue = this.value.trim();
        });
        nicknameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
        nicknameInput.addEventListener('blur', saveNickname);
    }

    
    document.getElementById('profileInfoGender')?.addEventListener('click', function() {
        openProfileEditModal('gender');
    });
    
    document.getElementById('profileInfoBirthday')?.addEventListener('click', function() {
        openProfileEditModal('birthday');
    });
    
    document.getElementById('profileInfoPhone')?.addEventListener('click', function() {
        openProfileEditModal('phone');
    });
    
    
    document.getElementById('genderModalClose')?.addEventListener('click', function(e) {
        e.stopPropagation();
        closeGenderPicker();
    });
    
    document.getElementById('genderOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeGenderPicker();
    });
    
    document.getElementById('genderBtnConfirm')?.addEventListener('click', function(e) {
        e.stopPropagation();
        confirmGender();
    });
    
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('genderOverlay');
            if (overlay?.classList.contains('show')) {
                closeGenderPicker();
            }
        }
    });
}
function rebindProfileAvatarClick() {
    const wrapper = document.getElementById('profileAvatarWrapper');
    if (!wrapper) return;
    
    
    const newWrapper = wrapper.cloneNode(true);
    wrapper.parentNode.replaceChild(newWrapper, wrapper);
    
    
    newWrapper.addEventListener('click', function(e) {
        e.stopPropagation();
        
        updateProfileInfoAvatar();
        openProfileInfoPage();
    });
}



function openAccountSecurityPage() {
    
    previousPage = currentPage;
    
    
    
    const pageEl = document.getElementById('page-account-security');
    if (!pageEl) return;
    
    
    updateAccountSecurityStatus();

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'account-security';
}


function closeAccountSecurityPage() {
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-account-security');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target !== 'budget' && target !== 'stats') stopBudgetRealtimeSync();
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') { enterStatsPage(); }
    else if (target === 'profile') renderProfile();
}


function updateAccountSecurityStatus() {
    const statusEl = document.getElementById('accountUnbindStatus');
    const labelEl = document.getElementById('accountUnbindLabel');

    if (!statusEl) return;
    
    if (currentPartner) {
        const displayName = currentPartner.nickname || currentPartner.uid || '搭子';
        statusEl.textContent = '已绑定 ' + displayName;
        statusEl.className = 'security-item-status bound';
        if (labelEl) {
            labelEl.textContent = '解除匹配';
            labelEl.className = 'security-item-label';
        }
    } else {
        statusEl.textContent = '未绑定';
        statusEl.className = 'security-item-status';
        if (labelEl) {
            labelEl.textContent = '匹配搭子记账';
            labelEl.className = 'security-item-label';
        }
    }
}


function openAccountDeletePage() {
    const pageEl = document.getElementById('page-delete-account');
    if (!pageEl) return;
    
    
    const input = document.getElementById('deleteAccountInput');
    if (input) {
        input.value = '';
        input.classList.remove('error');
    }
    
    
    const btn = document.getElementById('deleteAccountConfirmBtn');
    if (btn) {
        btn.disabled = true;
        btn.style.background = '';  
        btn.style.color = '';
        btn.style.border = '';
        btn.textContent = '确认注销账号';
    }
    
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'delete-account';
}


function closeDeleteAccountPage() {
    
    const target = 'account-security';
    const pageEl = document.getElementById('page-delete-account');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    currentPage = target;
}




function openUnbindAccountPage() {
    const pageEl = document.getElementById('page-unbind-account');
    if (!pageEl) return;

    
    const input = document.getElementById('unbindAccountInput');
    if (input) {
        input.value = '';
        input.classList.remove('error');
    }
    
    const btn = document.getElementById('unbindAccountConfirmBtn');
    if (btn) {
        btn.disabled = true;
        btn.style.background = '';
        btn.style.color = '';
        btn.style.border = '';
        btn.textContent = '确认解除匹配';
    }

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'unbind-account';
}


function closeUnbindAccountPage() {
    
    const target = 'account-security';
    const pageEl = document.getElementById('page-unbind-account');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    currentPage = target;
}




function resetPwdToggles(scope) {
    const root = scope ? document.querySelector(scope) : document;
    if (!root) return;
    root.querySelectorAll('.pwd-toggle, .pwd-toggle-cpw').forEach(btn => {
        const targetId = btn.dataset.target;
        if (!targetId) return;
        const inp = document.getElementById(targetId);
        if (inp) inp.type = 'password';
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.remove('ri-eye-line');
            icon.classList.add('ri-eye-close-line');
        }
    });
}


function initPasswordToggles() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.pwd-toggle, .pwd-toggle-cpw');
        if (!btn) return;
        e.preventDefault();
        const targetId = btn.dataset.target;
        if (!targetId) return;
        const inp = document.getElementById(targetId);
        if (!inp) return;
        const icon = btn.querySelector('i');
        if (inp.type === 'password') {
            inp.type = 'text';
            if (icon) { icon.classList.remove('ri-eye-close-line'); icon.classList.add('ri-eye-line'); }
        } else {
            inp.type = 'password';
            if (icon) { icon.classList.remove('ri-eye-line'); icon.classList.add('ri-eye-close-line'); }
        }
    });
}


function initAuthLinks() {
    document.addEventListener('click', function(e) {
        
        const docLink = e.target.closest('[data-page]');
        if (docLink) {
            e.preventDefault();
            e.stopPropagation();
            const pageKey = docLink.dataset.page;
            if (pageKey && WEBVIEW_PAGES[pageKey]) {
                openWebViewPage(pageKey);
            }
            return;
        }
        
        const agreeBox = e.target.closest('.auth-agree');
        if (agreeBox) {
            const targetId = agreeBox.dataset.target;
            if (targetId) {
                const cb = document.getElementById(targetId);
                if (cb) cb.checked = !cb.checked;
            }
            return;
        }
        
        const forgotLink = e.target.closest('#forgotPasswordLink');
        if (forgotLink) {
            e.preventDefault();
            e.stopPropagation();
            openForgotPasswordPage();
            return;
        }
    });
}


let fpCountdownTimer = null;

function fpShowStep(step) {
    ['fpPanel1', 'fpPanel2'].forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.style.display = (idx + 1 === step) ? '' : 'none';
    });
    
    document.querySelectorAll('#page-forgot-password .fp-step').forEach(s => {
        const n = parseInt(s.dataset.step, 10);
        s.classList.remove('active', 'done');
        const numEl = s.querySelector('.fp-step-num');
        if (n < step) {
            s.classList.add('done');
            if (numEl) numEl.textContent = '\u2713';
        } else if (n === step) {
            s.classList.add('active');
            if (numEl) numEl.textContent = String(n);
        } else {
            if (numEl) numEl.textContent = String(n);
        }
    });
    const scroll = document.getElementById('page-forgot-password')?.querySelector('.fp-scroll');
    if (scroll) scroll.scrollTop = 0;
}

function openForgotPasswordPage() {
    pageBackStack.push(currentPage);
    const pageEl = document.getElementById('page-forgot-password');
    if (!pageEl) return;

    ['fpEmail', 'fpCode', 'fpNewPassword', 'fpConfirmPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sendBtn = document.getElementById('fpSendCodeBtn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = '获取验证码';
    }
    if (fpCountdownTimer) {
        clearInterval(fpCountdownTimer);
        fpCountdownTimer = null;
    }
    resetPwdToggles('#page-forgot-password');

    fpShowStep(1);

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    currentPage = 'forgot-password';
}

function closeForgotPasswordPage() {
    const target = pageBackStack.length > 0 ? pageBackStack.pop() : 'account-security';
    const pageEl = document.getElementById('page-forgot-password');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    if (fpCountdownTimer) {
        clearInterval(fpCountdownTimer);
        fpCountdownTimer = null;
    }
    restoreFromBack(target);
}


async function fpSendCode() {
    const email = (document.getElementById('fpEmail')?.value || '').trim();
    if (!email) {
        showToast('请输入注册邮箱');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('请输入有效的邮箱地址');
        return;
    }
    
    try {
        const exists = await checkEmailExists(email);
        if (!exists) {
            showToast('该邮箱尚未注册，请先注册');
            return;
        }
    } catch (err) {
        showToast('检查邮箱失败，请重试');
        return;
    }

    const btn = document.getElementById('fpSendCodeBtn');
    try {
        btn && (btn.disabled = true);
        await sendVerificationCode(email, 'reset');
        showToast('验证码已发送至邮箱');
        
        let secs = 60;
        btn && (btn.textContent = `${secs}s 后重发`);
        if (fpCountdownTimer) clearInterval(fpCountdownTimer);
        fpCountdownTimer = setInterval(() => {
            secs--;
            if (secs <= 0) {
                clearInterval(fpCountdownTimer);
                fpCountdownTimer = null;
                btn && (btn.disabled = false);
                btn && (btn.textContent = '获取验证码');
            } else {
                btn && (btn.textContent = `${secs}s 后重发`);
            }
        }, 1000);
    } catch (err) {
        showToast(err.message || '发送验证码失败');
        btn && (btn.disabled = false);
        btn && (btn.textContent = '获取验证码');
    }
}


function fpNextStep1() {
    const email = (document.getElementById('fpEmail')?.value || '').trim();
    const code = (document.getElementById('fpCode')?.value || '').trim();
    if (!email) { showToast('请输入注册邮箱'); return; }
    if (!code) { showToast('请输入验证码'); return; }
    if (code.length < 6) { showToast('请输入6位验证码'); return; }
    fpShowStep(2);
}


function fpBackStep2() {
    fpShowStep(1);
}


async function fpSubmit() {
    const email = (document.getElementById('fpEmail')?.value || '').trim();
    const code = (document.getElementById('fpCode')?.value || '').trim();
    const newPwd = (document.getElementById('fpNewPassword')?.value || '').trim();
    const confirmPwd = (document.getElementById('fpConfirmPassword')?.value || '').trim();
    const btn = document.getElementById('fpSubmitBtn');

    if (!newPwd) { showToast('请设置新密码'); return; }
    if (newPwd.length < 4) { showToast('新密码至少4位'); return; }
    if (newPwd !== confirmPwd) { showToast('两次密码输入不一致'); return; }

    try {
        btn && (btn.disabled = true);
        await forgotPassword(email, code, newPwd);
        showToast('密码重置成功，请登录');
        
        setTimeout(() => {
            closeForgotPasswordPage();
            
            if (loginForm.style.display !== 'block') showLoginPage();
            const loginAccountInput = document.getElementById('loginAccount');
            if (loginAccountInput) loginAccountInput.value = email;
            const loginPwdInput = document.getElementById('loginPassword');
            if (loginPwdInput) loginPwdInput.value = '';
            
            const agreeCb = document.getElementById('agreeCheckbox');
            if (agreeCb) agreeCb.checked = true;
        }, 800);
    } catch (err) {
        showToast(err.message || '重置失败');
    } finally {
        btn && (btn.disabled = false);
    }
}


function initForgotPasswordEvents() {
    document.getElementById('fpBackBtn')?.addEventListener('click', closeForgotPasswordPage);
    document.getElementById('fpSendCodeBtn')?.addEventListener('click', fpSendCode);
    document.getElementById('fpNext1')?.addEventListener('click', fpNextStep1);
    document.getElementById('fpBack2')?.addEventListener('click', fpBackStep2);
    document.getElementById('fpSubmitBtn')?.addEventListener('click', fpSubmit);
    
    document.getElementById('fpCode')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); fpNextStep1(); }
    });
    document.getElementById('fpConfirmPassword')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); fpSubmit(); }
    });
}




let cpwVerifiedPassword = '';

function maskEmail(email) {
    if (!email || email.indexOf('@') === -1) return email || '';
    const [name, domain] = email.split('@');
    const visible = name.slice(0, Math.min(2, name.length));
    const masked = visible + '****';
    return masked + '@' + domain;
}

function cpwShowStep(step) {
    ['cpwPanel1', 'cpwPanel2', 'cpwPanel3'].forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.style.display = (idx + 1 === step) ? '' : 'none';
    });
    
    document.querySelectorAll('#page-change-password .cpw-step').forEach(s => {
        const n = parseInt(s.dataset.step, 10);
        s.classList.remove('active', 'done');
        const numEl = s.querySelector('.cpw-step-num');
        if (n < step) {
            s.classList.add('done');
            if (numEl) numEl.textContent = '\u2713';
        } else if (n === step) {
            s.classList.add('active');
            if (numEl) numEl.textContent = String(n);
        } else {
            if (numEl) numEl.textContent = String(n);
        }
    });
    
    const scroll = document.getElementById('page-change-password')?.querySelector('.cpw-scroll');
    if (scroll) scroll.scrollTop = 0;
}

function openChangePasswordPage() {
    const pageEl = document.getElementById('page-change-password');
    if (!pageEl) return;

    
    cpwVerifiedPassword = '';
    ['cpwOldPassword', 'cpwNewPassword', 'cpwConfirmPassword', 'cpwCode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sendBtn = document.getElementById('cpwSendCodeBtn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = '获取验证码';
    }
    
    const emailDisplay = document.getElementById('cpwEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = maskEmail(currentUser?.email || '');

    cpwShowStep(1);

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    currentPage = 'change-password';
}

function closeChangePasswordPage() {
    
    const target = 'account-security';
    const pageEl = document.getElementById('page-change-password');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    currentPage = target;
}


async function cpwNextStep1() {
    const input = document.getElementById('cpwOldPassword');
    const btn = document.getElementById('cpwNext1');
    const password = (input?.value || '').trim();
    if (!password) {
        showToast('请输入原密码');
        return;
    }
    try {
        btn && (btn.disabled = true);
        await verifyCurrentPassword(password);
        cpwVerifiedPassword = password;
        cpwShowStep(2);
    } catch (err) {
        showToast(err.message || '原密码错误');
    } finally {
        btn && (btn.disabled = false);
    }
}


function cpwNextStep2() {
    const newPwd = (document.getElementById('cpwNewPassword')?.value || '').trim();
    const confirmPwd = (document.getElementById('cpwConfirmPassword')?.value || '').trim();
    if (!newPwd) {
        showToast('请设置新密码');
        return;
    }
    if (newPwd.length < 4) {
        showToast('新密码至少4位');
        return;
    }
    if (newPwd !== confirmPwd) {
        showToast('两次密码输入不一致');
        return;
    }
    if (newPwd === cpwVerifiedPassword) {
        showToast('新密码不能与原密码相同');
        return;
    }
    cpwShowStep(3);
}


async function cpwSendCode() {
    const email = currentUser?.email;
    if (!email) {
        showToast('无法获取邮箱，请重新登录');
        return;
    }
    const btn = document.getElementById('cpwSendCodeBtn');
    try {
        btn && (btn.disabled = true);
        await sendVerificationCode(email, 'change_password');
        showToast('验证码已发送至邮箱');
        startCountdown(btn, 60);
    } catch (err) {
        showToast(err.message || '发送验证码失败');
        btn && (btn.disabled = false);
    }
}


async function cpwSubmit() {
    const code = (document.getElementById('cpwCode')?.value || '').trim();
    const newPwd = (document.getElementById('cpwNewPassword')?.value || '').trim();
    const btn = document.getElementById('cpwSubmitBtn');
    if (!code) {
        showToast('请输入验证码');
        return;
    }
    if (code.length < 6) {
        showToast('请输入6位验证码');
        return;
    }
    try {
        btn && (btn.disabled = true);
        await changePassword(cpwVerifiedPassword, newPwd, code);
        showToast('密码修改成功');
        cpwVerifiedPassword = '';
        setTimeout(() => closeChangePasswordPage(), 800);
    } catch (err) {
        showToast(err.message || '修改失败');
    } finally {
        btn && (btn.disabled = false);
    }
}


function initChangePasswordEvents() {
    document.getElementById('cpwBackBtn')?.addEventListener('click', closeChangePasswordPage);
    document.getElementById('cpwNext1')?.addEventListener('click', cpwNextStep1);
    document.getElementById('cpwBack2')?.addEventListener('click', () => cpwShowStep(1));
    document.getElementById('cpwNext2')?.addEventListener('click', cpwNextStep2);
    document.getElementById('cpwBack3')?.addEventListener('click', () => cpwShowStep(2));
    document.getElementById('cpwSendCodeBtn')?.addEventListener('click', cpwSendCode);
    document.getElementById('cpwSubmitBtn')?.addEventListener('click', cpwSubmit);
    
    document.getElementById('cpwOldPassword')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); cpwNextStep1(); }
    });
    document.getElementById('cpwConfirmPassword')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); cpwNextStep2(); }
    });
    document.getElementById('cpwCode')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); cpwSubmit(); }
    });
}


async function performUnbind() {
    const input = document.getElementById('unbindAccountInput');
    const btn = document.getElementById('unbindAccountConfirmBtn');
    const requiredText = '我已阅读上文并确认解除匹配';

    const value = input.value.trim();

    if (value !== requiredText) {
        showToast('请输入正确的确认声明');
        input.classList.add('error');
        input.value = '';
        input.focus();
        setTimeout(() => input.classList.remove('error'), 2000);
        return;
    }

    btn.disabled = true;
    btn.textContent = '解绑中...';

    try {
        await unbindPartnerApi();
        showToast('已解除匹配，双方记账数据已清空');
        closeUnbindAccountPage();
        
        updateAccountSecurityStatus();
        renderProfile();
        updateWalletDisplay();
        if (currentPage === 'match') {
            loadMatchPageData();
        }
    } catch (err) {
        showToast('解绑失败: ' + err.message);
        btn.disabled = false;
        btn.textContent = '确认解除匹配';
        btn.style.background = '';
        btn.style.color = '';
        btn.style.border = '';
    }
}


function initUnbindAccountEvents() {
    
    const backBtn = document.getElementById('unbindAccountBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', closeUnbindAccountPage);
    }
    
    const confirmBtn = document.getElementById('unbindAccountConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', performUnbind);
    }
    
    const input = document.getElementById('unbindAccountInput');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performUnbind();
            }
        });
        
        input.addEventListener('input', function() {
            const requiredText = '我已阅读上文并确认解除匹配';
            const currentValue = this.value.trim();
            const btn = document.getElementById('unbindAccountConfirmBtn');
            this.classList.remove('error');
            if (currentValue === requiredText) {
                const theme = THEME_PRESETS.find(t => t.id === currentThemeId) || THEME_PRESETS[0];
                btn.style.background = theme.primary;
                btn.style.color = '#ffffff';
                btn.style.border = 'none';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            } else {
                btn.style.background = '';
                btn.style.color = '';
                btn.style.border = '';
                btn.disabled = true;
            }
        });
    }
}


async function performAccountDeletion() {
    const input = document.getElementById('deleteAccountInput');
    const btn = document.getElementById('deleteAccountConfirmBtn');
    const requiredText = '我已阅读上文并确认注销账号';
    
    const value = input.value.trim();
    
    
    if (value !== requiredText) {
        showToast('请输入正确的确认声明');
        input.classList.add('error');
        input.value = '';
        input.focus();
        
        setTimeout(() => {
            input.classList.remove('error');
        }, 2000);
        return;
    }
    
    
    btn.disabled = true;
    btn.textContent = '注销中...';
    
    
    try {
        await apiCall('/auth/delete', 'DELETE');

        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('categories_data');
        localStorage.removeItem('profile_info');
        localStorage.removeItem('theme_id');

        token = null;
        currentUser = null;
        currentPartner = null;
        allBills = [];
        budgetCache = { [getBudgetMonthKey(new Date())]: { my: 0, partner: 0, both: 0 } };

        showToast('账户已注销');

        
        closeDeleteAccountPage();

        
        setTimeout(() => {
            showLoginPage();
        }, 400);

    } catch (err) {
        
        if (err.needUnbind || /先解除匹配/.test(err.message)) {
            showToast('请先解除匹配后再注销账号');
            
            closeDeleteAccountPage();
            setTimeout(() => {
                openUnbindAccountPage();
            }, 350);
        } else {
            showToast('注销失败: ' + err.message);
        }
        btn.disabled = false;
        btn.textContent = '确认注销账号';
        
        btn.style.background = '';
        btn.style.color = '';
        btn.style.border = '';
    }
}


function initDeleteAccountEvents() {
    
    const backBtn = document.getElementById('deleteAccountBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', closeDeleteAccountPage);
    }
    
    
    const confirmBtn = document.getElementById('deleteAccountConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', performAccountDeletion);
    }
    
    
    const input = document.getElementById('deleteAccountInput');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performAccountDeletion();
            }
        });
        
        
        input.addEventListener('input', function() {
            const requiredText = '我已阅读上文并确认注销账号';
            const currentValue = this.value.trim();
            const btn = document.getElementById('deleteAccountConfirmBtn');
            
            
            this.classList.remove('error');
            
            
            if (currentValue === requiredText) {
                
                const theme = THEME_PRESETS.find(t => t.id === currentThemeId) || THEME_PRESETS[0];
                btn.style.background = theme.primary;
                btn.style.color = '#ffffff';
                btn.style.border = 'none';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            } else {
                
                btn.style.background = '';  
                btn.style.color = '';
                btn.style.border = '';
                btn.disabled = true;  
            }
        });
    }
}

function handleLogout() {
    showConfirmDialog(
        '确认退出',
        '确定要退出登录吗？',
        async function() {
            try {
                
                const securityPage = document.getElementById('page-account-security');
                if (securityPage && securityPage.classList.contains('active')) {
                    securityPage.classList.remove('active');
                    
                    await new Promise(resolve => setTimeout(resolve, 350));
                    securityPage.style.display = 'none';
                    securityPage.style.transform = '';
                }
                
                hideDeleteModal();
                
                logout();
            } catch (err) {
                showToast('退出失败: ' + err.message);
            }
        },
        '退出'
    );
}


function initAccountSecurityEvents() {
    
    document.getElementById('accountSecurityBackBtn')?.addEventListener('click', closeAccountSecurityPage);
    
    
document.getElementById('accountUnbindItem')?.addEventListener('click', function() {
    if (currentPartner) {
        
        openUnbindAccountPage();
    } else {
        
        openMatchPage();
    }
});
    
    
document.getElementById('accountDeleteItem')?.addEventListener('click', function() {
    openAccountDeletePage();
});

    
    document.getElementById('accountChangePasswordItem')?.addEventListener('click', openChangePasswordPage);

    
    document.getElementById('accountLogoutItem')?.addEventListener('click', handleLogout);
}




function rebindAccountManage() {
    const accountItem = document.getElementById('profileAccountManage');
    if (!accountItem) return;
    
    
    const newItem = accountItem.cloneNode(true);
    accountItem.parentNode.replaceChild(newItem, accountItem);
    
    newItem.addEventListener('click', function() {
        openAccountSecurityPage();
    });
}



function openMatchPage() {
    
    previousPage = currentPage;
  
    
    
    const pageEl = document.getElementById('page-match');
    if (!pageEl) return;
    
    
    document.getElementById('matchError').textContent = '';
    document.getElementById('matchSuccess').textContent = '';
    document.getElementById('matchBoundError').textContent = '';
    document.getElementById('matchInput').value = '';
    document.getElementById('matchBound').style.display = 'none';
    document.getElementById('matchUnbound').style.display = 'none';
    document.getElementById('matchLoading').style.display = 'flex';

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'match';

    
    loadMatchPageData();
}


function closeMatchPage() {
    
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-match');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        renderStatsPage();
        updateStatsDateLabel();
    } else if (target === 'profile') renderProfile();
}


async function loadMatchPageData() {
    try {
        await fetchPartnerStatus();
        
        const descEl = document.getElementById('matchDesc');
        
        if (currentPartner) { 
            if (descEl) descEl.style.display = 'none';
            
            document.getElementById('matchBound').style.display = 'block';
            document.getElementById('matchUnbound').style.display = 'none';
            
            const img = document.getElementById('matchPartnerAvatarImg');
            const icon = document.getElementById('matchPartnerAvatarIcon');
            if (currentPartner.avatar) {
                img.src = currentPartner.avatar;
                img.style.display = 'block';
                icon.style.display = 'none';
            } else {
                img.style.display = 'none';
                icon.style.display = 'block';
            }
            const displayName = currentPartner.nickname || currentPartner.uid || '搭子';
            document.getElementById('matchPartnerName').textContent = displayName;
        } else {
            if (descEl) {
                descEl.style.display = 'block';
                descEl.textContent = '生成你的匹配码，或输入对方的匹配码';
            }
            
            document.getElementById('matchUnbound').style.display = 'block';
            document.getElementById('matchBound').style.display = 'none';
            
            const data = await generateMatchCodeApi();
            document.getElementById('matchCodeDisplay').textContent = data.code;
            const copyBtn = document.getElementById('matchCopyBtn');
            copyBtn.textContent = '复制';
            copyBtn.className = 'match-copy-btn';
        }
    } catch (err) {
        document.getElementById('matchError').textContent = err.message || '加载失败，请重试';
        document.getElementById('matchUnbound').style.display = 'block';
        document.getElementById('matchCodeDisplay').textContent = '------';
    } finally {
        document.getElementById('matchLoading').style.display = 'none';
    }
}


function copyMatchCode() {
    const code = document.getElementById('matchCodeDisplay').textContent;
    if (!code || code === '------') {
        showToast('没有可复制的匹配码');
        return;
    }
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('matchCopyBtn');
        btn.textContent = '已复制';
        btn.className = 'match-copy-btn copied';
        showToast('复制匹配码成功'); 
        setTimeout(() => {
            btn.textContent = '复制';
            btn.className = 'match-copy-btn';
        }, 2000);
    }).catch(() => {
        
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('复制匹配码成功');
        } catch (err) {
            showToast('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
    });
}


async function handleBind() {
    const code = document.getElementById('matchInput').value.trim();
    if (!code) {
        document.getElementById('matchError').textContent = '请输入匹配码';
        return;
    }
    if (!/^\d{6}$/.test(code)) {
        document.getElementById('matchError').textContent = '请输入6位数字匹配码';
        return;
    }
    document.getElementById('matchError').textContent = '';
    document.getElementById('matchSuccess').textContent = '';
    const bindBtn = document.getElementById('matchBindBtn');
    bindBtn.disabled = true;
    bindBtn.textContent = '绑定中...';

    try {
        const result = await bindPartnerApi(code);
        await loadMatchPageData();
        showToast('绑定搭子成功');
    } catch (err) {
        document.getElementById('matchError').textContent = err.message;
    } finally {
        bindBtn.disabled = false;
        bindBtn.textContent = '立即匹配';
    }
}


function handleUnbind() {
    openUnbindAccountPage();
}


function initMatchPageEvents() {
    
    document.getElementById('matchBackBtn')?.addEventListener('click', closeMatchPage);
    
    
    document.getElementById('matchCopyBtn')?.addEventListener('click', copyMatchCode);
    
    
    document.getElementById('matchBindBtn')?.addEventListener('click', handleBind);
    
    
    const matchInput = document.getElementById('matchInput');
    if (matchInput) {
        matchInput.addEventListener('input', function() {
            
            const digitsOnly = this.value.replace(/\D/g, '').slice(0, 6);
            if (digitsOnly !== this.value) {
                this.value = digitsOnly;
            }
        });
        
        matchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleBind();
        });
    }
    
    
    document.getElementById('matchUnbindBtn')?.addEventListener('click', handleUnbind);
}



const THEME_PRESETS = [
    { id: 'default', name: '默认蓝', primary: '#4F9BFA', light: '#A5CAF1', bg: '#EEF4FF', shadow: 'rgba(165, 202, 241, 0.22)' },
{ id: 'gray', name: '高级灰', primary: '#78909C', light: '#B0BEC5', bg: '#ECEFF1', shadow: 'rgba(120, 144, 156, 0.22)' },
    { id: 'forest', name: '森林绿', primary: '#43A047', light: '#A5D6A7', bg: '#E8F5E9', shadow: 'rgba(67, 160, 71, 0.22)' },
    { id: 'sunset', name: '日落橙', primary: '#FF7043', light: '#FFAB91', bg: '#FBE9E7', shadow: 'rgba(255, 112, 67, 0.22)' },
    { id: 'lavender', name: '薰衣草', primary: '#7E57C2', light: '#B39DDB', bg: '#EDE7F6', shadow: 'rgba(126, 87, 194, 0.22)' },
    { id: 'rose', name: '玫瑰粉', primary: '#EC407A', light: '#F48FB1', bg: '#FCE4EC', shadow: 'rgba(236, 64, 122, 0.22)' },
    { id: 'teal', name: '蒂芙尼', primary: '#26A69A', light: '#80CBC4', bg: '#E0F2F1', shadow: 'rgba(38, 166, 154, 0.22)' },
    { id: 'amber', name: '琥珀金', primary: '#FFA726', light: '#FFCC80', bg: '#FFF8E1', shadow: 'rgba(255, 167, 38, 0.22)' },
];


let tempThemeId = 'default';
let currentThemeId = 'default';


function loadTheme() {
    try {
        const saved = localStorage.getItem('theme_id');
        if (saved && THEME_PRESETS.some(t => t.id === saved)) {
            currentThemeId = saved;
            tempThemeId = saved;
            
            applyTheme(saved);
            updateThemeBadge();
            return saved;
        }
    } catch (e) {}
    
    currentThemeId = 'default';
    tempThemeId = 'default';
    applyTheme('default');
    setTimeout(() => updateThemeBadge(), 100);
    return 'default';
}


function applyTheme(themeId) {
    const theme = THEME_PRESETS.find(t => t.id === themeId);
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-light', theme.light);
    root.style.setProperty('--primary-bg', theme.bg);
    root.style.setProperty('--primary-shadow', theme.shadow);
    
    
    const navAdd = document.querySelector('.nav-add');
    if (navAdd) {
        navAdd.style.background = `linear-gradient(135deg, ${theme.primary}, ${theme.light})`;
    }
    
    
    
    
    document.querySelectorAll('.budget-progress-fill').forEach(el => {
        if (el.classList.contains('over-budget')) {
            el.style.background = 'var(--expense)';
        } else if (el.classList.contains('warning')) {
            el.style.background = 'var(--warning)';
        } else {
            el.style.background = theme.primary;
        }
    });
    
    
    document.querySelectorAll('.btn-primary, .key-save, .modal-save, .budget-save-btn, .profile-edit-save').forEach(el => {
        if (!el.classList.contains('no-theme')) {
            el.style.background = theme.primary;
        }
    });
    
    
    document.querySelectorAll('.cat-item.active .cat-icon').forEach(el => {
        el.style.background = theme.primary;
    });
    
    
    const slider = document.getElementById('toggleSlider');
    if (slider) {
        slider.style.background = theme.primary;
    }
    
    const statsDateSlider = document.getElementById('statsDateToggleSlider');
    if (statsDateSlider) {
        statsDateSlider.style.background = theme.primary;
    }
    
    
    document.querySelectorAll('.budget-circle-title i').forEach(el => {
        el.style.color = theme.primary;
    });
    
    currentThemeId = themeId;
    localStorage.setItem('theme_id', themeId);
    updateThemeBadge();
}


function renderThemeColors() {
    const grid = document.getElementById('themeColorGrid');
    if (!grid) return;
    
    
    const selectedTheme = THEME_PRESETS.find(t => t.id === tempThemeId) || THEME_PRESETS[0];
    
    
    updateThemePreview(selectedTheme);
    
    let html = '';
    THEME_PRESETS.forEach(theme => {
        const isActive = (tempThemeId === theme.id);
        html += `
            <button class="theme-color-item ${isActive ? 'active' : ''}" data-theme-id="${theme.id}">
                <div class="theme-color-circle" style="background: ${theme.primary};"></div>
                <span class="theme-color-name">${theme.name}</span>
            </button>
        `;
    });
    grid.innerHTML = html;
    
    grid.querySelectorAll('.theme-color-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.themeId;
            if (id) {
                tempThemeId = id;
                
                const theme = THEME_PRESETS.find(t => t.id === id);
                if (theme) {
                    updateThemePreview(theme);
                }
                
                renderThemeColors();
            }
        });
    });
}


function updateThemePreview(theme) {
    if (!theme) return;
    
    const previewPrimary = document.querySelector('.preview-primary');
    const previewLight = document.querySelector('.preview-light');
    const previewBg = document.querySelector('.preview-bg');
    const previewShadow = document.querySelector('.preview-shadow');
    
    if (previewPrimary) {
        previewPrimary.style.background = theme.primary;
    }
    if (previewLight) {
        previewLight.style.background = theme.light;
    }
    if (previewBg) {
        previewBg.style.background = theme.bg;
    }
    if (previewShadow) {
        previewShadow.style.background = theme.shadow;
        
        
        previewShadow.style.background = theme.primary + '40'; 
        previewShadow.style.border = '1px solid ' + theme.primary + '20';
    }
}

function openThemeModal() {
    
    if (paymentSheet?.classList.contains('show')) closePaymentSheet();
    if (noteModal?.classList.contains('show')) closeNoteModal();
    if (dateModal?.classList.contains('show')) closeDatePicker();
    if (settingsOverlay?.classList.contains('show')) closeSettings();
    if (catAddOverlay?.classList.contains('show')) closeCatAddModal();
    if (catEditOverlay?.classList.contains('show')) closeCatEditModal();
    
    
    tempThemeId = currentThemeId;
    renderThemeColors();
    
    
    const theme = THEME_PRESETS.find(t => t.id === tempThemeId);
    if (theme) {
        updateThemePreview(theme);
    }
    
    const overlay = document.getElementById('themeOverlay');
    const modal = document.getElementById('themeModal');
    if (overlay) overlay.classList.add('show');
    if (modal) modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}


function closeThemeModal() {
    const overlay = document.getElementById('themeOverlay');
    const modal = document.getElementById('themeModal');
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    
    
    
    tempThemeId = currentThemeId;
}


function confirmTheme() {
    
    if (tempThemeId === currentThemeId) {
        showToast('已是当前主题');
        closeThemeModal();
        return;
    }
    
    applyTheme(tempThemeId);
    showToast('主题已切换');
    closeThemeModal();
}


function resetTheme() {
    
    if (currentThemeId === 'default') {
        showToast('已是默认主题');
        return;
    }
    
    
    applyTheme('default');
    
    closeThemeModal();
}


function initThemeEvents() {
    
    document.getElementById('profileThemeColor')?.addEventListener('click', function(e) {
        e.stopPropagation();
        openThemeModal();
    });
    
    
    document.getElementById('themeBtnReset')?.addEventListener('click', resetTheme);
    
    
    document.getElementById('themeBtnConfirm')?.addEventListener('click', confirmTheme);
    
    
    document.getElementById('themeOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeThemeModal();
    });
    
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('themeOverlay');
            if (overlay?.classList.contains('show')) {
                closeThemeModal();
            }
        }
    });
    
    
    loadTheme();
}



function openScheduledPage() {
    
    previousPage = currentPage;
    
    
    
    const pageEl = document.getElementById('page-scheduled');
    if (!pageEl) return;

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'scheduled';

    
    renderScheduledList();
}


function closeScheduledPage() {
    
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-scheduled');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        renderStatsPage();
        updateStatsDateLabel();
    } else if (target === 'profile') renderProfile();
}


async function renderScheduledList() {
    const container = document.getElementById('scheduledList');
    const titleEl = document.querySelector('.scheduled-section-title');
    if (!container) return;
    
    
    let tasks = [];
    try {
        const data = await apiCall('/scheduled', 'GET');
        tasks = data.tasks || [];
    } catch (e) {
        console.warn('加载定时任务失败', e);
        tasks = [];
    }
    
    
    if (titleEl) {
        titleEl.style.display = tasks.length > 0 ? 'block' : 'none';
    }
    
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="scheduled-empty">
                <div class="empty-icon"><i class="ri-time-line"></i></div>
                <div class="empty-text">暂无定时记账任务</div>
                <div class="empty-hint">点击右上角「添加」创建</div>
            </div>
        `;
        return;
    }
    
    
    tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    function buildRepeatLabel(t) {
        const cfg = t.repeatConfig;
        if (!cfg) {
            return t.day ? '每月' + t.day + '日' : '每天';
        }
        if (cfg.mode === 'daily') {
            return { daily: '每天', weekday: '工作日', weekend: '周末' }[cfg.daily] || '每天';
        } else if (cfg.mode === 'weekly') {
            const wk = cfg.weekly || [];
            if (wk.length === 0) return '每周';
            const names = ['日','一','二','三','四','五','六'];
            return '每周' + wk.slice().sort((a,b)=>a-b).map(d => names[d]).join('、');
        } else {
            return '每月' + (cfg.monthly || 1) + '日';
        }
    }
    
    function buildEndLabel(t) {
        if (t.endType === 'date' && t.endDate) {
            return formatDateDisplayCN(t.endDate) + '结束';
        }
        return '长期有效';
    }
    
    let html = '';
    tasks.forEach(task => {
        const typeLabel = task.type === 'income' ? '收入' : '支出';
        const typeClass = task.type === 'income' ? 'income' : 'expense';
        const sign = task.type === 'income' ? '+' : '-';
        const iconClass = task.categoryIcon || 'ri-calendar-check-line';
        const repeatLabel = buildRepeatLabel(task);
        const endLabel = buildEndLabel(task);
        const isOwn = task.isOwn !== false;
        const belong = getBelongDisplayLabel(task.belong || '自己', isOwn);
        const payment = task.payment || '微信';

        html += `
            <div class="scheduled-item-wrapper" data-id="${task.id}">
                <div class="scheduled-item">
                    <div class="scheduled-item-left">
                        <div class="scheduled-item-icon ${typeClass}">
                            <i class="${iconClass.startsWith('ri-') ? iconClass : 'fas ' + iconClass}"></i>
                        </div>
                        <div class="scheduled-item-info">
                            <div class="scheduled-item-name">${escapeHtml(task.category || '定时记账')}</div>
                            <div class="scheduled-item-belong">${escapeHtml(belong)}</div>
                        </div>
                    </div>
                    <div class="scheduled-item-right">
                        <div class="scheduled-item-right-col">
                            <span class="scheduled-item-amount ${typeClass}">${sign}¥${Number(task.amount || 0).toFixed(2)}</span>
                            <span class="scheduled-item-repeat">${repeatLabel}</span>
                        </div>
                    </div>
                </div>
                <div class="scheduled-item-actions">
                    <button class="scheduled-item-edit" data-id="${task.id}">编辑</button>
                    <button class="scheduled-item-delete" data-id="${task.id}">删除</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}


const schedState = {
    editingId: null,          
    type: 'expense',          
    category: null,           
    categoryIcon: null,       
    amount: '',               
    belong: '自己',           
    payment: '微信',          
    
    repeatTab: 'daily',       
    repeatDaily: 'daily',     
    repeatWeekly: [],         
    repeatMonthly: 1,         
    
    endType: 'forever',       
    endDate: null,            
    note: ''                  
};


function resetSchedState() {
    schedState.editingId = null;
    schedState.type = 'expense';
    schedState.category = null;
    schedState.categoryIcon = null;
    schedState.amount = '';
    schedState.belong = '自己';
    schedState.payment = '微信';
    schedState.repeatTab = 'daily';
    schedState.repeatDaily = 'daily';
    schedState.repeatWeekly = [];
    schedState.repeatMonthly = 1;
    schedState.endType = 'forever';
    schedState.endDate = null;
    schedState.note = '';
    schedEditingOwnTask = true;
}


async function openScheduledEditPage(editId = null) {
    resetSchedState();
    
    
    if (editId) {
        try {
            const data = await apiCall('/scheduled/' + editId, 'GET');
            const task = data.task;
            if (task) {
                schedState.editingId = String(task.id);
                schedState.type = task.type || 'expense';
                schedState.category = task.category || null;
                schedState.categoryIcon = task.categoryIcon || null;
                schedState.amount = task.amount != null ? String(task.amount) : '';
                schedState.belong = task.belong || '自己';
                schedState.payment = task.payment || '微信';
                schedEditingOwnTask = task.isOwn !== false;
                
                const repeatConfig = task.repeatConfig || { mode: 'daily', daily: 'daily' };
                schedState.repeatTab = repeatConfig.mode || 'daily';
                schedState.repeatDaily = repeatConfig.daily || 'daily';
                schedState.repeatWeekly = repeatConfig.weekly || [];
                schedState.repeatMonthly = repeatConfig.monthly || 1;
                schedState.endType = task.endType || 'forever';
                schedState.endDate = task.endDate || null;
                schedState.note = task.note || '';
            }
        } catch (e) {
            console.warn('加载定时任务失败', e);
            showToast('加载失败，请重试');
            return;
        }
    }
    
    
    const titleEl = document.getElementById('schedEditTitle');
    if (titleEl) {
        if (editId) {
            titleEl.textContent = schedEditingOwnTask ? '编辑定时记账' : '编辑对方的定时记账';
        } else {
            titleEl.textContent = '创建定时记账';
        }
    }
    
    
    refreshSchedEditUI();
    
    
    const pageEl = document.getElementById('page-scheduled-edit');
    if (!pageEl) return;
    pageBackStack.push(currentPage);
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    currentPage = 'scheduled-edit';
}

function closeScheduledEditPage() {
    const target = pageBackStack.length > 0 ? pageBackStack.pop() : 'scheduled';
    const pageEl = document.getElementById('page-scheduled-edit');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    closeAllSchedModals();
    restoreFromBack(target);
}

function closeAllSchedModals() {
    ['schedCategoryOverlay', 'schedBelongOverlay', 'schedRepeatOverlay', 'schedAmountKeyboardOverlay'].forEach(id => {
        document.getElementById(id)?.classList.remove('show');
    });
    ['schedCategorySheet', 'schedBelongSheet', 'schedRepeatSheet', 'schedAmountKeyboardSheet'].forEach(id => {
        document.getElementById(id)?.classList.remove('show');
    });
}


function refreshSchedEditUI() {
    
    const catVal = document.getElementById('schedCategoryValue');
    if (catVal) {
        if (schedState.category) {
            catVal.textContent = schedState.category;
            catVal.classList.remove('placeholder');
        } else {
            catVal.textContent = '请选择类别';
            catVal.classList.add('placeholder');
        }
    }
    
    setSchedAmountDisplay(schedState.amount);
    
    const belongVal = document.getElementById('schedBelongValue');
    if (belongVal) belongVal.textContent = getBelongDisplayLabel(schedState.belong, schedEditingOwnTask);
    
    const payIcons = {
        '微信': '<i class="ri-wechat-fill" style="color:#07C160;"></i> 微信',
        '支付宝': '<i class="ri-alipay-fill" style="color:#1677FF;"></i> 支付宝',
        '现金': '<i class="ri-cash-fill" style="color:#E74C3C;"></i> 现金',
        '银行卡': '<i class="ri-bank-card-fill" style="color:#F39C12;"></i> 银行卡'
    };
    const payVal = document.getElementById('schedPaymentValue');
    if (payVal) payVal.innerHTML = payIcons[schedState.payment] || schedState.payment;
    
    const repeatVal = document.getElementById('schedRepeatValue');
    if (repeatVal) repeatVal.textContent = formatSchedRepeatLabel();
    
    document.querySelectorAll('.sched-checkbox input[name="schedEndType"]').forEach(r => {
        r.checked = r.value === schedState.endType;
    });
    const endDateRow = document.getElementById('schedEndDateRow');
    const endDateVal = document.getElementById('schedEndDateValue');
    if (schedState.endType === 'date' && schedState.endDate) {
        if (endDateRow) endDateRow.style.display = '';
        if (endDateVal) endDateVal.textContent = formatDateDisplayCN(schedState.endDate) + '结束';
    } else if (schedState.endType === 'date') {
        if (endDateRow) endDateRow.style.display = '';
        if (endDateVal) endDateVal.textContent = '请选择结束日期';
    } else {
        if (endDateRow) endDateRow.style.display = 'none';
    }
    
    const noteInput = document.getElementById('schedNoteInput');
    if (noteInput) noteInput.value = schedState.note;
    
    updateSchedSaveBtn();
}


function formatSchedRepeatLabel() {
    if (schedState.repeatTab === 'daily') {
        const map = { daily: '每天', weekday: '工作日', weekend: '周末' };
        return map[schedState.repeatDaily] || '每天';
    } else if (schedState.repeatTab === 'weekly') {
        if (schedState.repeatWeekly.length === 0) return '请选择';
        const weekNames = ['日','一','二','三','四','五','六'];
        return '每周' + schedState.repeatWeekly.sort().map(d => weekNames[d]).join('、');
    } else {
        return '每月' + schedState.repeatMonthly + '日';
    }
}


function updateSchedSaveBtn() {
    const btn = document.getElementById('schedSaveBtn');
    if (!btn) return;
    const hasCategory = !!schedState.category;
    const hasAmount = parseFloat(schedState.amount) > 0;
    const hasRepeat = schedState.repeatTab !== 'weekly' || schedState.repeatWeekly.length > 0;
    const hasEndDate = schedState.endType !== 'date' || !!schedState.endDate;
    const ok = hasCategory && hasAmount && hasRepeat && hasEndDate;
    btn.disabled = !ok;
}


let schedCategoryCurrentType = 'expense';

function openSchedCategorySheet() {
    schedCategoryCurrentType = schedState.type;
    
    updateSchedCategoryToggleUI(true);
    renderSchedCategoryGrid();
    document.getElementById('schedCategoryOverlay').classList.add('show');
    document.getElementById('schedCategorySheet').classList.add('show');
    
    setTimeout(() => updateSchedCategoryToggleUI(false), 20);
}
function closeSchedCategorySheet() {
    document.getElementById('schedCategoryOverlay').classList.remove('show');
    document.getElementById('schedCategorySheet').classList.remove('show');
}
function updateSchedCategoryToggleUI(skipAnim) {
    const toggleEl = document.getElementById('schedCategoryToggle');
    const btns = toggleEl ? toggleEl.querySelectorAll('button') : [];
    btns.forEach(b => {
        b.classList.remove('active-expense', 'active-income');
        if (b.dataset.type === schedCategoryCurrentType) {
            b.classList.add(schedCategoryCurrentType === 'expense' ? 'active-expense' : 'active-income');
        }
    });
    if (!toggleEl) return;
    
    const activeBtn = toggleEl.querySelector(schedCategoryCurrentType === 'expense' ? '.active-expense' : '.active-income');
    if (activeBtn) {
        
        const w = activeBtn.offsetWidth * 0.2;
        const x = activeBtn.offsetLeft + (activeBtn.offsetWidth - w) / 2;
        if (skipAnim) {
            toggleEl.classList.remove('tab-ready');
            toggleEl.style.setProperty('--indicator-x', x + 'px');
            toggleEl.style.setProperty('--indicator-w', w + 'px');
            void toggleEl.offsetWidth;
            if (toggleEl.offsetParent !== null) toggleEl.classList.add('tab-ready');
        } else {
            if (toggleEl.offsetParent !== null) toggleEl.classList.add('tab-ready');
            toggleEl.style.setProperty('--indicator-x', x + 'px');
            toggleEl.style.setProperty('--indicator-w', w + 'px');
        }
    }
}
function renderSchedCategoryGrid() {
    const grid = document.getElementById('schedCategoryGrid');
    if (!grid) return;
    const cats = getCategoriesForType(schedCategoryCurrentType);
    let html = '';
    cats.forEach(cat => {
        const active = (schedState.type === schedCategoryCurrentType && schedState.category === cat.label) ? 'active' : '';
        html += `
            <div class="sched-cat-item ${active}" data-label="${escapeHtml(cat.label)}" data-icon="${escapeHtml(cat.icon)}">
                <span class="sched-cat-icon"><i class="fas ${escapeHtml(cat.icon)}"></i></span>
                <span class="sched-cat-label">${escapeHtml(cat.label)}</span>
            </div>`;
    });
    grid.innerHTML = html;
    grid.querySelectorAll('.sched-cat-item').forEach(item => {
        item.addEventListener('click', () => {
            schedState.type = schedCategoryCurrentType;
            schedState.category = item.dataset.label;
            schedState.categoryIcon = item.dataset.icon;
            closeSchedCategorySheet();
            refreshSchedEditUI();
        });
    });
}



function getSchedBelongOptions() {
    if (currentPartner) {
        return [
            { key: '自己', label: '自己' },
            { key: '对方', label: '对方' },
            { key: '共同', label: '共同' },
        ];
    }
    return [
        { key: '自己', label: '自己' },
        { key: '小知', label: '对方' },
        { key: '共同', label: '共同' },
    ];
}

function convertBelongToViewer(belong, isOwnTask) {
    if (isOwnTask) return belong;
    if (belong === '自己') return '对方';
    if (belong === '对方') return '自己';
    return belong;
}

function convertBelongToOwner(belong, isOwnTask) {
    return convertBelongToViewer(belong, isOwnTask);
}

function getBelongDisplayLabel(belongKey, isOwnTask) {
    const viewerKey = convertBelongToViewer(belongKey, isOwnTask);
    const options = getSchedBelongOptions();
    const found = options.find(o => o.key === viewerKey);
    if (found) return found.label;
    if (viewerKey === '对方' && !currentPartner) return '对方';
    if (viewerKey === '小知' && currentPartner) return '对方';
    return belongKey;
}
let schedBelongTemp = '自己';

let schedEditingOwnTask = true;

function renderSchedBelongWheel(initKey) {
    const wheel = document.getElementById('schedBelongWheel');
    if (!wheel) return;
    const options = getSchedBelongOptions();
    const values = options.map(o => o.key);
    const labels = options.map(o => o.label);
    
    const displayKey = convertBelongToViewer(initKey, schedEditingOwnTask);
    let selectedIdx = values.indexOf(displayKey);
    if (selectedIdx < 0) {
        
        if (displayKey === '对方' && !currentPartner) selectedIdx = values.indexOf('小知');
        if (selectedIdx < 0) selectedIdx = 0;
    }
    wheel.innerHTML = values.map((v, i) =>
        `<div class="wheel-item ${i === selectedIdx ? 'wheel-selected' : ''}" data-value="${v}">${labels[i]}</div>`
    ).join('');
    wheel.scrollTop = selectedIdx * WHEEL_ITEM_HEIGHT;

    let scrollTimer = null;
    wheel.onscroll = function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const idx = Math.round(wheel.scrollTop / WHEEL_ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(values.length - 1, idx));
            wheel.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
            wheel.querySelectorAll('.wheel-item').forEach((el, i) => {
                el.classList.toggle('wheel-selected', i === clamped);
            });
            schedBelongTemp = values[clamped];
        }, 120);
    };
    wheel.querySelectorAll('.wheel-item').forEach((el) => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const v = this.dataset.value;
            const idx = values.indexOf(String(v));
            if (idx >= 0) wheel.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
        });
    });
}

function openSchedBelongSheet() {
    const rawBelong = schedState.belong || '自己';
    
    schedBelongTemp = convertBelongToViewer(rawBelong, schedEditingOwnTask);
    if (!currentPartner && schedBelongTemp === '对方') schedBelongTemp = '小知';
    renderSchedBelongWheel(rawBelong);
    document.getElementById('schedBelongOverlay').classList.add('show');
    document.getElementById('schedBelongSheet').classList.add('show');
    
    setTimeout(() => renderSchedBelongWheel(rawBelong), 50);
}
function closeSchedBelongSheet() {
    document.getElementById('schedBelongOverlay').classList.remove('show');
    document.getElementById('schedBelongSheet').classList.remove('show');
}
function confirmSchedBelong() {
    const wheel = document.getElementById('schedBelongWheel');
    const v = getWheelValue(wheel);
    if (v) schedBelongTemp = v;
    
    schedState.belong = convertBelongToOwner(schedBelongTemp, schedEditingOwnTask);
    closeSchedBelongSheet();
    refreshSchedEditUI();
}


let schedPaymentMode = false;

function lockSchedBodyScroll() {
    const prev = document.body.style.overflow;
    if (prev !== 'hidden') document.body.dataset.schedPrevOverflow = prev || '';
    document.body.style.overflow = 'hidden';
}
function unlockSchedBodyScroll() {
    const prev = document.body.dataset.schedPrevOverflow;
    document.body.style.overflow = prev === undefined ? '' : prev;
}

function openSchedPaymentSheet() {
    const overlay = document.getElementById('schedPaymentOverlay');
    const sheet = document.getElementById('schedPaymentSheet');
    if (!overlay || !sheet) { showToast('支付方式弹窗未找到'); return; }
    schedPaymentMode = true;

    
    sheet.querySelectorAll('.sched-payment-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.payment === schedState.payment);
    });

    lockSchedBodyScroll();
    
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        sheet.classList.add('show');
    });
}
function closeSchedPaymentSheet() {
    schedPaymentMode = false;
    const overlay = document.getElementById('schedPaymentOverlay');
    const sheet = document.getElementById('schedPaymentSheet');
    if (overlay) overlay.classList.remove('show');
    if (sheet) sheet.classList.remove('show');
    
    setTimeout(unlockSchedBodyScroll, 320);
}


(function bindSchedPaymentEvents() {
    const run = () => {
        const body = document.getElementById('schedPaymentBody');
        const closeBtn = document.getElementById('schedPaymentClose');
        const overlay = document.getElementById('schedPaymentOverlay');
        if (!body || !closeBtn || !overlay || body.dataset.schedBound) return;
        body.dataset.schedBound = '1';

        body.addEventListener('click', function(e) {
            const opt = e.target.closest('.sched-payment-option');
            if (!opt) return;
            e.stopPropagation();
            schedState.payment = opt.dataset.payment || '微信';
            closeSchedPaymentSheet();
            refreshSchedEditUI();
        });

        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeSchedPaymentSheet();
        });

        overlay.addEventListener('click', function(e) {
            if (e.target !== overlay) return;
            e.stopPropagation();
            closeSchedPaymentSheet();
        });

        
        const schedPage = document.getElementById('page-scheduled-edit');
        const scrollListener = () => {
            if (schedPaymentMode) closeSchedPaymentSheet();
        };
        
        schedPage?.querySelector('.sched-edit-body')?.addEventListener('scroll', scrollListener, { passive: true });
        window.addEventListener('scroll', scrollListener, { passive: true });
    };
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(run, 50);
})();


let schedRepeatTempTab = 'daily';
let schedRepeatTempDaily = 'daily';     
let schedRepeatTempWeekly = 1;          
let schedRepeatTempMonthly = 1;         

const SCHED_DAILY_OPTIONS = [
    { key: 'daily',   label: '每天' },
    { key: 'weekday', label: '工作日' },
    { key: 'weekend', label: '周末' },
];
const SCHED_WEEKLY_OPTIONS = [
    { key: '1', label: '周一' },
    { key: '2', label: '周二' },
    { key: '3', label: '周三' },
    { key: '4', label: '周四' },
    { key: '5', label: '周五' },
    { key: '6', label: '周六' },
    { key: '0', label: '周日' },
];
const SCHED_MONTHLY_OPTIONS = (() => {
    const arr = [];
    for (let i = 1; i <= 31; i++) arr.push({ key: String(i), label: `${i}` });
    return arr;
})();



function bindWheelEvents(wheelEl, values, labels, onChange) {
    let scrollTimer = null;
    const sync = () => {
        const idx = Math.round(wheelEl.scrollTop / WHEEL_ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(values.length - 1, idx));
        wheelEl.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
        wheelEl.querySelectorAll('.wheel-item').forEach((el, i) => {
            el.classList.toggle('wheel-selected', i === clamped);
        });
        onChange?.(values[clamped]);
    };
    wheelEl.onscroll = function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(sync, 100);
    };
    wheelEl.querySelectorAll('.wheel-item').forEach((el) => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const v = this.dataset.value;
            const idx = values.indexOf(String(v));
            if (idx >= 0) {
                wheelEl.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
            }
        });
    });
}

function renderSchedDailyWheel(initKey) {
    const wheel = document.getElementById('schedDailyWheel');
    if (!wheel) return;
    const values = SCHED_DAILY_OPTIONS.map(o => o.key);
    const labels = SCHED_DAILY_OPTIONS.map(o => o.label);
    const selectedIdx = values.indexOf(initKey);
    
    wheel.innerHTML = values.map((v, i) =>
        `<div class="wheel-item ${v === initKey ? 'wheel-selected' : ''}" data-value="${v}">${labels[i]}</div>`
    ).join('');
    if (selectedIdx >= 0) wheel.scrollTop = selectedIdx * WHEEL_ITEM_HEIGHT;

    
    let scrollTimer = null;
    wheel.onscroll = function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const idx = Math.round(wheel.scrollTop / WHEEL_ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(values.length - 1, idx));
            wheel.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
            wheel.querySelectorAll('.wheel-item').forEach((el, i) => {
                el.classList.toggle('wheel-selected', i === clamped);
            });
            schedRepeatTempDaily = values[clamped];
        }, 120);
    };
    
    wheel.querySelectorAll('.wheel-item').forEach((el) => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const v = this.dataset.value;
            const idx = values.indexOf(String(v));
            if (idx >= 0) wheel.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
        });
    });
}
function renderSchedWeeklyWheel(initDay) {
    const wheel = document.getElementById('schedWeeklyWheel');
    if (!wheel) return;
    const values = SCHED_WEEKLY_OPTIONS.map(o => o.key);
    const labels = SCHED_WEEKLY_OPTIONS.map(o => o.label);
    const initKey = String(initDay);
    const selectedIdx = values.indexOf(initKey);
    wheel.innerHTML = values.map((v, i) =>
        `<div class="wheel-item ${v === initKey ? 'wheel-selected' : ''}" data-value="${v}">${labels[i]}</div>`
    ).join('');
    if (selectedIdx >= 0) wheel.scrollTop = selectedIdx * WHEEL_ITEM_HEIGHT;

    let scrollTimer = null;
    wheel.onscroll = function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const idx = Math.round(wheel.scrollTop / WHEEL_ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(values.length - 1, idx));
            wheel.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
            wheel.querySelectorAll('.wheel-item').forEach((el, i) => {
                el.classList.toggle('wheel-selected', i === clamped);
            });
            schedRepeatTempWeekly = parseInt(values[clamped], 10);
        }, 120);
    };
    wheel.querySelectorAll('.wheel-item').forEach((el) => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const v = this.dataset.value;
            const idx = values.indexOf(String(v));
            if (idx >= 0) wheel.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
        });
    });
}
function renderSchedMonthlyWheel(initDay) {
    const wheel = document.getElementById('schedMonthlyWheel');
    if (!wheel) return;
    const values = SCHED_MONTHLY_OPTIONS.map(o => o.key);
    const labels = SCHED_MONTHLY_OPTIONS.map(o => o.label);
    const initKey = String(initDay);
    const selectedIdx = values.indexOf(initKey);
    wheel.innerHTML = values.map((v, i) =>
        `<div class="wheel-item ${v === initKey ? 'wheel-selected' : ''}" data-value="${v}">${labels[i]}</div>`
    ).join('');
    if (selectedIdx >= 0) wheel.scrollTop = selectedIdx * WHEEL_ITEM_HEIGHT;

    let scrollTimer = null;
    wheel.onscroll = function() {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const idx = Math.round(wheel.scrollTop / WHEEL_ITEM_HEIGHT);
            const clamped = Math.max(0, Math.min(values.length - 1, idx));
            wheel.scrollTop = clamped * WHEEL_ITEM_HEIGHT;
            wheel.querySelectorAll('.wheel-item').forEach((el, i) => {
                el.classList.toggle('wheel-selected', i === clamped);
            });
            schedRepeatTempMonthly = parseInt(values[clamped], 10) || 1;
        }, 120);
    };
    wheel.querySelectorAll('.wheel-item').forEach((el) => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const v = this.dataset.value;
            const idx = values.indexOf(String(v));
            if (idx >= 0) wheel.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: 'smooth' });
        });
    });
}

function updateSchedRepeatIndicator(skipReady) {
    const tabsEl = document.getElementById('schedRepeatTabs');
    if (!tabsEl) return;
    const activeTab = tabsEl.querySelector('.sched-repeat-tab.active');
    if (!activeTab) return;
    
    const w = activeTab.offsetWidth * 0.3;
    tabsEl.style.setProperty('--indicator-x', (activeTab.offsetLeft + (activeTab.offsetWidth - w) / 2) + 'px');
    tabsEl.style.setProperty('--indicator-w', w + 'px');
    
    if (!skipReady && tabsEl.offsetParent !== null) {
        tabsEl.classList.add('tab-ready');
    }
}

function switchSchedRepeatTab(tab) {
    schedRepeatTempTab = tab;
    
    document.querySelectorAll('#schedRepeatTabs .sched-repeat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    updateSchedRepeatIndicator();
    
    document.querySelectorAll('.sched-repeat-wheel').forEach(w => {
        w.classList.toggle('active', w.dataset.pane === tab);
    });
    
    requestAnimationFrame(() => {
        if (tab === 'daily') renderSchedDailyWheel(schedRepeatTempDaily);
        if (tab === 'weekly') renderSchedWeeklyWheel(schedRepeatTempWeekly);
        if (tab === 'monthly') renderSchedMonthlyWheel(schedRepeatTempMonthly);
    });
}

function openSchedRepeatSheet() {
    
    schedRepeatTempTab     = schedState.repeatTab || 'daily';
    schedRepeatTempDaily   = schedState.repeatDaily || 'daily';
    schedRepeatTempWeekly  = Array.isArray(schedState.repeatWeekly) && schedState.repeatWeekly.length
        ? schedState.repeatWeekly[0]
        : (typeof schedState.repeatWeekly === 'number' ? schedState.repeatWeekly : 1);
    schedRepeatTempMonthly = schedState.repeatMonthly || 1;

    
    const tabsEl = document.getElementById('schedRepeatTabs');
    if (tabsEl && !tabsEl.dataset.schedBound) {
        tabsEl.dataset.schedBound = '1';
        tabsEl.querySelectorAll('.sched-repeat-tab').forEach(t => {
            t.addEventListener('click', () => switchSchedRepeatTab(t.dataset.tab));
        });
    }

    
    if (tabsEl) tabsEl.classList.remove('tab-ready');
    
    document.querySelectorAll('#schedRepeatTabs .sched-repeat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === schedRepeatTempTab);
    });
    document.querySelectorAll('.sched-repeat-wheel').forEach(w => {
        w.classList.toggle('active', w.dataset.pane === schedRepeatTempTab);
    });
    updateSchedRepeatIndicator(true); 

    document.getElementById('schedRepeatOverlay').classList.add('show');
    document.getElementById('schedRepeatSheet').classList.add('show');

    
    
    setTimeout(() => {
        if (schedRepeatTempTab === 'daily') renderSchedDailyWheel(schedRepeatTempDaily);
        if (schedRepeatTempTab === 'weekly') renderSchedWeeklyWheel(schedRepeatTempWeekly);
        if (schedRepeatTempTab === 'monthly') renderSchedMonthlyWheel(schedRepeatTempMonthly);
        
        if (tabsEl) void tabsEl.offsetWidth;
        updateSchedRepeatIndicator(false);
    }, 50);
}
function closeSchedRepeatSheet() {
    document.getElementById('schedRepeatOverlay').classList.remove('show');
    document.getElementById('schedRepeatSheet').classList.remove('show');
}
function confirmSchedRepeat() {
    
    if (schedRepeatTempTab === 'daily') {
        const v = getWheelValue(document.getElementById('schedDailyWheel'));
        if (v) schedRepeatTempDaily = v;
    } else if (schedRepeatTempTab === 'weekly') {
        const v = getWheelValue(document.getElementById('schedWeeklyWheel'));
        if (v != null) schedRepeatTempWeekly = parseInt(v, 10);
    } else if (schedRepeatTempTab === 'monthly') {
        const v = getWheelValue(document.getElementById('schedMonthlyWheel'));
        if (v != null) schedRepeatTempMonthly = parseInt(v, 10) || 1;
    }

    schedState.repeatTab = schedRepeatTempTab;
    if (schedRepeatTempTab === 'daily') {
        schedState.repeatDaily = schedRepeatTempDaily;
        schedState.repeatWeekly = [];
        schedState.repeatMonthly = 1;
    } else if (schedRepeatTempTab === 'weekly') {
        schedState.repeatDaily = 'daily';
        schedState.repeatWeekly = [schedRepeatTempWeekly];
        schedState.repeatMonthly = 1;
    } else if (schedRepeatTempTab === 'monthly') {
        schedState.repeatDaily = 'daily';
        schedState.repeatWeekly = [];
        schedState.repeatMonthly = schedRepeatTempMonthly;
    }
    closeSchedRepeatSheet();
    refreshSchedEditUI();
}


function openSchedEndDatePicker() {
    
    const wheelYear = document.getElementById('wheelYear');
    const wheelMonth = document.getElementById('wheelMonth');
    const wheelDay = document.getElementById('wheelDay');
    if (!wheelYear || !wheelMonth || !wheelDay) return;
    
    let initDate;
    if (schedState.endDate) {
        initDate = new Date(schedState.endDate);
    } else {
        initDate = new Date();
        initDate.setMonth(initDate.getMonth() + 1);
    }
    tempSelectedDate = new Date(initDate);
    window.__skipConfirmDateUpdate = true;
    renderDatePicker();
    
    document.getElementById('dateModal').classList.add('show');
    document.getElementById('dateOverlay').classList.add('show');
    
    
    const oldConfirm = document.getElementById('dateBtnConfirm').onclick;
    document.getElementById('dateBtnConfirm').onclick = function() {
        const wy = getWheelValue(wheelYear);
        const wm = getWheelValue(wheelMonth);
        const wd = getWheelValue(wheelDay);
        if (wy && wm && wd) {
            const d = new Date(parseInt(wy,10), parseInt(wm,10)-1, parseInt(wd,10));
            schedState.endDate = formatDateStr(d);
            refreshSchedEditUI();
        }
        closeDatePicker();
        window.__skipConfirmDateUpdate = false;
        
        document.getElementById('dateBtnConfirm').onclick = oldConfirm;
    };
    const oldClose = document.getElementById('dateModalClose').onclick;
    document.getElementById('dateModalClose').onclick = function() {
        closeDatePicker();
        window.__skipConfirmDateUpdate = false;
        document.getElementById('dateModalClose').onclick = oldClose;
    };
}


let schedAmountKeyboardBuffer = '';
let schedAmountKeyboardBound = false;

function formatSchedAmountDisplay(val) {
    
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return num.toFixed(2);
}


function setSchedAmountDisplay(value) {
    const amtEl = document.getElementById('schedAmountInput');
    if (!amtEl) return;
    if (value) {
        amtEl.textContent = '¥' + value;
        amtEl.classList.remove('placeholder');
    } else {
        amtEl.textContent = '请输入金额';
        amtEl.classList.add('placeholder');
    }
}

function updateSchedAmountInputDisplay() {
    setSchedAmountDisplay(schedAmountKeyboardBuffer || '');
}

function handleSchedAmountKey(key) {
    if (key === 'delete') {
        schedAmountKeyboardBuffer = schedAmountKeyboardBuffer.slice(0, -1);
    } else if (key === 'confirm') {
        confirmSchedAmountKeyboard();
        return;
    } else if (key === '.') {
        
        if (schedAmountKeyboardBuffer.indexOf('.') >= 0) return;
        
        if (!schedAmountKeyboardBuffer) {
            schedAmountKeyboardBuffer = '0.';
        } else {
            schedAmountKeyboardBuffer += '.';
        }
    } else {
        
        const firstDot = schedAmountKeyboardBuffer.indexOf('.');
        
        if (firstDot >= 0 && schedAmountKeyboardBuffer.length - firstDot - 1 >= 2) return;
        
        if (firstDot < 0) {
            const intPart = schedAmountKeyboardBuffer;
            if (intPart.length >= 8) return;
            
            if (intPart === '0') {
                schedAmountKeyboardBuffer = key;
            } else {
                schedAmountKeyboardBuffer += key;
            }
        } else {
            schedAmountKeyboardBuffer += key;
        }
    }
    updateSchedAmountInputDisplay();
}

function openSchedAmountKeyboard() {
    
    schedAmountKeyboardBuffer = schedState.amount || '';
    updateSchedAmountInputDisplay();
    document.getElementById('schedAmountKeyboardOverlay').classList.add('show');
    document.getElementById('schedAmountKeyboardSheet').classList.add('show');
    bindSchedAmountKeyboardEvents();
}

function closeSchedAmountKeyboard() {
    document.getElementById('schedAmountKeyboardOverlay').classList.remove('show');
    document.getElementById('schedAmountKeyboardSheet').classList.remove('show');
}

function confirmSchedAmountKeyboard() {
    
    const raw = schedAmountKeyboardBuffer;
    if (raw && parseFloat(raw) > 0) {
        schedState.amount = formatSchedAmountDisplay(raw);
    } else {
        schedState.amount = '';
    }
    
    setSchedAmountDisplay(schedState.amount);
    closeSchedAmountKeyboard();
    updateSchedSaveBtn();
}

function bindSchedAmountKeyboardEvents() {
    if (schedAmountKeyboardBound) return;
    const body = document.getElementById('schedAmountKeyboardBody');
    const closeBtn = document.getElementById('schedAmountKeyboardClose');
    const overlay = document.getElementById('schedAmountKeyboardOverlay');
    if (!body || !closeBtn || !overlay) return;
    schedAmountKeyboardBound = true;

    body.addEventListener('click', function(e) {
        const key = e.target.closest('.sched-key');
        if (!key) return;
        e.stopPropagation();
        handleSchedAmountKey(key.dataset.key);
    });

    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeSchedAmountKeyboard();
    });

    overlay.addEventListener('click', function(e) {
        if (e.target !== overlay) return;
        e.stopPropagation();
        closeSchedAmountKeyboard();
    });
}


async function saveScheduledTask() {
    const amountNum = parseFloat(schedState.amount);
    if (!schedState.category || !(amountNum > 0)) {
        showToast('请填写完整信息');
        return;
    }
    if (schedState.endType === 'date' && !schedState.endDate) {
        showToast('请选择结束日期');
        return;
    }

    const repeatConfig = {
        mode: schedState.repeatTab,
        daily: schedState.repeatDaily,
        weekly: [...schedState.repeatWeekly],
        monthly: schedState.repeatMonthly
    };

    const payload = {
        type: schedState.type,
        category: schedState.category,
        categoryIcon: schedState.categoryIcon,
        amount: amountNum,
        belong: schedState.belong,
        payment: schedState.payment,
        repeatConfig: repeatConfig,
        endType: schedState.endType,
        endDate: schedState.endDate,
        note: schedState.note,
        name: schedState.note || schedState.category,
        day: schedState.repeatTab === 'monthly' ? schedState.repeatMonthly : 1
    };

    try {
        if (schedState.editingId) {
            await apiCall('/scheduled/' + schedState.editingId, 'PUT', payload);
            showToast('已更新定时记账');
        } else {
            await apiCall('/scheduled', 'POST', payload);
            showToast('已创建定时记账');
        }
    } catch (e) {
        showToast(e.message || '保存失败');
        return;
    }

    closeScheduledEditPage();
    
    setTimeout(() => renderScheduledList(), 200);
}


function initScheduledEditEvents() {
    
    document.getElementById('schedEditBackBtn')?.addEventListener('click', closeScheduledEditPage);
    
    
    document.getElementById('schedCategoryField')?.addEventListener('click', openSchedCategorySheet);
    document.getElementById('schedCategoryClose')?.addEventListener('click', closeSchedCategorySheet);
    document.getElementById('schedCategoryOverlay')?.addEventListener('click', closeSchedCategorySheet);
    document.querySelectorAll('#schedCategoryToggle button').forEach(b => {
        b.addEventListener('click', () => {
            schedCategoryCurrentType = b.dataset.type;
            updateSchedCategoryToggleUI();
            renderSchedCategoryGrid();
        });
    });
    
    
    document.getElementById('schedAmountField')?.addEventListener('click', openSchedAmountKeyboard);

    
    document.getElementById('schedBelongField')?.addEventListener('click', openSchedBelongSheet);
    document.getElementById('schedBelongClose')?.addEventListener('click', closeSchedBelongSheet);
    document.getElementById('schedBelongOverlay')?.addEventListener('click', closeSchedBelongSheet);
    document.getElementById('schedBelongConfirm')?.addEventListener('click', confirmSchedBelong);
    
    
    document.getElementById('schedPaymentField')?.addEventListener('click', openSchedPaymentSheet);
    
    
    document.getElementById('schedRepeatField')?.addEventListener('click', openSchedRepeatSheet);
    document.getElementById('schedRepeatClose')?.addEventListener('click', closeSchedRepeatSheet);
    document.getElementById('schedRepeatConfirm')?.addEventListener('click', confirmSchedRepeat);
    document.getElementById('schedRepeatOverlay')?.addEventListener('click', closeSchedRepeatSheet);
    
    
    document.querySelectorAll('input[type="radio"][name="schedEndType"]').forEach(r => {
        r.addEventListener('change', function() {
            if (!this.checked) return;
            schedState.endType = this.value;
            if (this.value === 'date') {
                
                openSchedEndDatePicker();
            }
            refreshSchedEditUI();
        });
    });
    
    document.getElementById('schedEndDateRow')?.addEventListener('click', function() {
        if (schedState.endType === 'date') openSchedEndDatePicker();
    });
    
    
    document.getElementById('schedNoteInput')?.addEventListener('input', function() {
        schedState.note = this.value.trim();
        updateSchedSaveBtn();
    });
    
    
    document.getElementById('schedSaveBtn')?.addEventListener('click', saveScheduledTask);
    
    
    const schedListEl = document.getElementById('scheduledList');
    if (schedListEl) {
        schedListEl.addEventListener('click', function(e) {
            
            const delBtn = e.target.closest('.scheduled-item-delete');
            if (delBtn) {
                e.stopPropagation();
                deleteScheduledTask(delBtn.dataset.id);
                return;
            }
            
            const editBtn = e.target.closest('.scheduled-item-edit');
            if (editBtn) {
                e.stopPropagation();
                closeAllSchedSwiped();
                openScheduledEditPage(editBtn.dataset.id);
                return;
            }
            
            const wrapper = e.target.closest('.scheduled-item-wrapper');
            if (wrapper && wrapper.classList.contains('swiped')) {
                closeSchedSwiped(wrapper);
                return;
            }
            
            const item = e.target.closest('.scheduled-item');
            if (item && wrapper && wrapper.dataset.id) {
                openScheduledEditPage(wrapper.dataset.id);
            }
        });
        initSchedSwipeEvents(schedListEl);
    }
}


let schedSwipeActive = null;
let schedSwipeState = new Map();

function getSchedSwipeState(wrapper) {
    if (!schedSwipeState.has(wrapper)) {
        schedSwipeState.set(wrapper, {
            startX: 0, startY: 0, offset: 0, isOpen: false,
            maxOffset: 0, isDragging: false, directionDetected: false
        });
    }
    return schedSwipeState.get(wrapper);
}

function closeSchedSwiped(wrapper) {
    if (!wrapper) return;
    wrapper.classList.remove('swiped');
    const content = wrapper.querySelector('.scheduled-item');
    if (content) content.style.transform = '';
    const state = schedSwipeState.get(wrapper);
    if (state) { state.isOpen = false; state.offset = 0; }
}

function closeAllSchedSwiped() {
    document.querySelectorAll('.scheduled-item-wrapper.swiped').forEach(w => closeSchedSwiped(w));
}

function initSchedSwipeEvents(container) {
    container.addEventListener('touchstart', function(e) {
        const wrapper = e.target.closest('.scheduled-item-wrapper');
        if (!wrapper) return;
        if (e.target.closest('.scheduled-item-actions')) return;
        const content = wrapper.querySelector('.scheduled-item');
        if (!content) return;

        const touch = e.touches[0];
        const state = getSchedSwipeState(wrapper);
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.isDragging = true;
        state.directionDetected = false;
        state.maxOffset = wrapper.querySelector('.scheduled-item-actions')?.offsetWidth || 80;
        state.offset = state.isOpen ? -state.maxOffset : 0;
        schedSwipeActive = wrapper;
        
        document.querySelectorAll('.scheduled-item-wrapper.swiped').forEach(w => {
            if (w !== wrapper) closeSchedSwiped(w);
        });
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
        if (!schedSwipeActive) return;
        const state = schedSwipeState.get(schedSwipeActive);
        if (!state || !state.isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;

        if (!state.directionDetected) {
            if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                state.directionDetected = true;
            } else if (Math.abs(deltaY) > 8) {
                state.isDragging = false;
                return;
            }
        }
        if (!state.isDragging || !state.directionDetected) return;

        e.preventDefault();
        let newOffset = deltaX;
        if (state.isOpen) newOffset = -state.maxOffset + deltaX;
        newOffset = Math.min(0, Math.max(-state.maxOffset, newOffset));
        state.offset = newOffset;
        const content = schedSwipeActive.querySelector('.scheduled-item');
        if (content) {
            content.style.transform = `translateX(${newOffset}px)`;
            content.style.transition = 'none';
        }
    }, { passive: false });

    container.addEventListener('touchend', function() {
        if (!schedSwipeActive) return;
        const state = schedSwipeState.get(schedSwipeActive);
        if (!state || !state.isDragging) { schedSwipeActive = null; return; }
        state.isDragging = false;
        const content = schedSwipeActive.querySelector('.scheduled-item');
        const threshold = 40;
        const shouldOpen = state.offset < -threshold;
        if (shouldOpen) {
            state.isOpen = true;
            state.offset = -state.maxOffset;
            schedSwipeActive.classList.add('swiped');
            if (content) {
                content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                content.style.transform = `translateX(${-state.maxOffset}px)`;
            }
        } else {
            state.isOpen = false;
            state.offset = 0;
            schedSwipeActive.classList.remove('swiped');
            if (content) {
                content.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                content.style.transform = 'translateX(0)';
            }
        }
        schedSwipeActive = null;
    }, { passive: true });
}

async function deleteScheduledTask(taskId) {
    if (!taskId) return;
    try {
        await apiCall('/scheduled/' + taskId, 'DELETE');
    } catch (e) {
        showToast(e.message || '删除失败');
        return;
    }
    showToast('已删除定时任务');
    renderScheduledList();
}



function initScheduledEvents() {
    
    document.getElementById('scheduledBackBtn')?.addEventListener('click', closeScheduledPage);
    
    
    document.getElementById('scheduledAddBtn')?.addEventListener('click', function() {
        openScheduledEditPage(null);
    });
    
    
    initScheduledEditEvents();
}





const searchState = {
    keyword: '',
    dateFilter: 'all', 
    dateStart: null,
    dateEnd: null,
    type: 'all', 
    belong: 'all', 
    payment: 'all', 
    amountMin: null,
    amountMax: null,
    hasActiveFilters: false,
};


function openSearchPage() {
    
    searchPreviousPage = currentPage;
    
    const pageEl = document.getElementById('page-search');
    if (!pageEl) return;
    
    
    searchState.keyword = '';
    searchState.dateFilter = 'all';
    searchState.dateStart = null;
    searchState.dateEnd = null;
    searchState.type = 'all';
    searchState.belong = 'all';
    searchState.payment = 'all';
    searchState.amountMin = null;
    searchState.amountMax = null;
    searchState.hasActiveFilters = false;
    searchPage = 1;
    searchHasMore = false;
    searchResultsCache = [];
    searchLoading = false;
    
    
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClearBtn').style.display = 'none';
    document.getElementById('searchDateFilterLabel').textContent = '全部时间';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchEmpty').style.display = 'none';
    document.getElementById('searchSummary').style.display = 'none';
    updateSearchSummary({ expense: 0, income: 0, expenseCount: 0, incomeCount: 0 });
    resetFilterOptionsUI();
    
    
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    setTimeout(() => document.getElementById('searchInput').focus(), 350);
    currentPage = 'search';


}


function closeSearchPage() {
    const target = searchPreviousPage || 'home';
    const pageEl = document.getElementById('page-search');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }

    
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });

    currentPage = target;

    
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        renderStatsPage();
        updateStatsDateLabel();
    } else if (target === 'profile') renderProfile();
}



async function performSearch(resetPage = true) {
    const keyword = searchState.keyword.trim();
    const summaryEl = document.getElementById('searchSummary');
    
    if (!keyword) {
        showToast('请输入关键字进行搜索');
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchEmpty').style.display = 'none';
        
        if (summaryEl) summaryEl.style.display = 'none';
        updateSearchSummary({ expense: 0, income: 0, expenseCount: 0, incomeCount: 0 });
        return;
    }
    
    if (resetPage) {
        searchPage = 1;
        searchResultsCache = [];
        document.getElementById('searchResults').innerHTML = '';
        searchHasMore = false;
    }
    
    if (searchLoading) return;
    searchLoading = true;
    
    
    const body = {
        keyword: keyword,
        page: searchPage,
        limit: 30
    };
    
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (searchState.dateFilter === 'today') {
        body.dateStart = formatDate(today);
        body.dateEnd = formatDate(today);
    } else if (searchState.dateFilter === 'week') {
        const start = getWeekStart(today);
        const end = getWeekEnd(today);
        body.dateStart = formatDate(start);
        body.dateEnd = formatDate(end);
    } else if (searchState.dateFilter === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        body.dateStart = formatDate(start);
        body.dateEnd = formatDate(end);
    } else if (searchState.dateFilter === 'custom') {
        if (searchState.dateStart) body.dateStart = searchState.dateStart;
        if (searchState.dateEnd) body.dateEnd = searchState.dateEnd;
    }
    
    
    if (searchState.type !== 'all') body.type = searchState.type;
    if (searchState.belong !== 'all') body.belong = searchState.belong;
    if (searchState.payment !== 'all') body.payment = searchState.payment;
    if (searchState.amountMin !== null) body.amountMin = searchState.amountMin;
    if (searchState.amountMax !== null) body.amountMax = searchState.amountMax;
    
    try {
        
        if (resetPage) {
            document.getElementById('searchResults').innerHTML = `
                <div class="search-loading" style="text-align:center;padding:40px;color:var(--text-light);">
                    <i class="ri-loader-4-line" style="font-size:24px;display:inline-block;animation:spin 1s linear infinite;"></i>
                    <div style="margin-top:8px;">搜索中...</div>
                </div>
            `;
        }
        
        const data = await apiCall('/bills/search', 'POST', body);
        
        
        if (resetPage) {
            searchResultsCache = data.bills || [];
        } else {
            searchResultsCache = [...searchResultsCache, ...(data.bills || [])];
        }
        
        if (resetPage) {
            renderSearchResults(data.bills, data.pagination);
        } else {
            appendSearchResults(data.bills, data.pagination);
        }
        
        searchHasMore = data.pagination && data.pagination.page < data.pagination.totalPages;
        
    } catch (err) {
        showToast('搜索失败: ' + err.message);
        if (resetPage) {
            document.getElementById('searchResults').innerHTML = `
                <div class="search-empty">
                    <div class="empty-icon"><i class="ri-error-warning-line"></i></div>
                    <div class="empty-text">搜索失败</div>
                    <div class="empty-hint">${err.message}</div>
                </div>
            `;
            
            document.getElementById('searchSummary').style.display = 'none';
        }
    } finally {
        searchLoading = false;
        document.getElementById('searchEmpty').style.display = 'none';
    }
}


function loadMoreSearch() {
    if (!searchHasMore || searchLoading) return;
    searchPage++;
    performSearch(false);
}


function renderSearchResults(bills, pagination) {
    const container = document.getElementById('searchResults');
    const emptyEl = document.getElementById('searchEmpty');
    const summaryEl = document.getElementById('searchSummary');
    
    
    let expenseTotal = 0, incomeTotal = 0;
    let expenseCount = 0, incomeCount = 0;
    searchResultsCache.forEach(b => {
        if (b.type === 'expense') {
            expenseTotal += b.amount;
            expenseCount++;
        } else {
            incomeTotal += b.amount;
            incomeCount++;
        }
    });
    
    updateSearchSummary({ expense: expenseTotal, income: incomeTotal, expenseCount, incomeCount });
    
    if (bills.length === 0) {
        container.innerHTML = '';
        emptyEl.style.display = 'flex';
        if (summaryEl) summaryEl.style.display = 'none';
        return;
    }
    
    if (summaryEl) summaryEl.style.display = 'flex';
    emptyEl.style.display = 'none';
    
    
    const sorted = bills.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const dateGroups = {};
    sorted.forEach(b => {
        if (!dateGroups[b.date]) dateGroups[b.date] = [];
        dateGroups[b.date].push(b);
    });
    const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
    
    let html = '';
    dates.forEach(date => {
        const bills = dateGroups[date];
        let dayIncome = 0, dayExpense = 0;
        bills.forEach(b => {
            if (b.type === 'income') dayIncome += b.amount;
            else dayExpense += b.amount;
        });
        
        let summaryHtml = '';
        if (dayIncome > 0) summaryHtml += `<span class="income">¥${dayIncome.toFixed(2)}</span>`;
        if (dayExpense > 0) summaryHtml += `<span class="expense">¥${dayExpense.toFixed(2)}</span>`;
        if (dayIncome === 0 && dayExpense === 0) summaryHtml += `<span class="zero">¥0.00</span>`;
        
        html += `
            <div class="home-date-card">
                <div class="home-date-card-header">
                    <span class="home-date-label">${formatDateDisplay(date)}</span>
                    <span class="home-date-summary">${summaryHtml}</span>
                </div>
                <div class="home-date-card-body">
                    ${bills.map(b => renderSearchBillItem(b)).join('')}
                </div>
            </div>
        `;
    });
    
    
    if (pagination && pagination.page < pagination.totalPages) {
        html += `
            <div class="load-more-wrapper" style="text-align:center;padding:16px 0;">
                <button class="load-more-btn" id="searchLoadMoreBtn" 
                        style="padding:10px 32px;border:1px solid var(--border-color);border-radius:20px;
                               background:var(--bg-card);color:var(--text-primary);font-size:14px;cursor:pointer;touch-action:manipulation;">
                    加载更多 (${pagination.page}/${pagination.totalPages})
                    <i class="ri-arrow-down-s-line"></i>
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    
    container.querySelectorAll('.bill-item-static').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (id && !isNaN(id)) {
                viewBillDetail(id);
            }
        });
    });
    
    
    const loadMoreBtn = document.getElementById('searchLoadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreSearch);
    }
}


function appendSearchResults(bills, pagination) {
    
    const oldBtn = document.getElementById('searchLoadMoreBtn');
    if (oldBtn) {
        const wrapper = oldBtn.closest('.load-more-wrapper');
        if (wrapper) wrapper.remove();
    }
    
    
    const container = document.getElementById('searchResults');
    const summaryEl = document.getElementById('searchSummary');
    
    
    if (bills && bills.length > 0) {
        if (summaryEl) summaryEl.style.display = 'flex';
    }
    
    
    const sorted = bills.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const dateGroups = {};
    sorted.forEach(b => {
        if (!dateGroups[b.date]) dateGroups[b.date] = [];
        dateGroups[b.date].push(b);
    });
    const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
    
    let html = '';
    dates.forEach(date => {
        const bills = dateGroups[date];
        let dayIncome = 0, dayExpense = 0;
        bills.forEach(b => {
            if (b.type === 'income') dayIncome += b.amount;
            else dayExpense += b.amount;
        });
        
        let summaryHtml = '';
        if (dayIncome > 0) summaryHtml += `<span class="income">¥${dayIncome.toFixed(2)}</span>`;
        if (dayExpense > 0) summaryHtml += `<span class="expense">¥${dayExpense.toFixed(2)}</span>`;
        if (dayIncome === 0 && dayExpense === 0) summaryHtml += `<span class="zero">¥0.00</span>`;
        
        html += `
            <div class="home-date-card">
                <div class="home-date-card-header">
                    <span class="home-date-label">${formatDateDisplay(date)}</span>
                    <span class="home-date-summary">${summaryHtml}</span>
                </div>
                <div class="home-date-card-body">
                    ${bills.map(b => renderBillItem(b)).join('')}
                </div>
            </div>
        `;
    });
    
    
    if (pagination && pagination.page < pagination.totalPages) {
        html += `
            <div class="load-more-wrapper" style="text-align:center;padding:16px 0;">
                <button class="load-more-btn" id="searchLoadMoreBtn" 
                        style="padding:10px 32px;border:1px solid var(--border-color);border-radius:20px;
                               background:var(--bg-card);color:var(--text-primary);font-size:14px;cursor:pointer;touch-action:manipulation;">
                    加载更多 (${pagination.page}/${pagination.totalPages})
                    <i class="ri-arrow-down-s-line"></i>
                </button>
            </div>
        `;
    }
    
    container.insertAdjacentHTML('beforeend', html);
    bindActionButtons(container);
    
    
    const loadMoreBtn = document.getElementById('searchLoadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreSearch);
    }
    
    
    let expenseTotal = 0, incomeTotal = 0;
    let expenseCount = 0, incomeCount = 0;
    searchResultsCache.forEach(b => {
        if (b.type === 'expense') {
            expenseTotal += b.amount;
            expenseCount++;
        } else {
            incomeTotal += b.amount;
            incomeCount++;
        }
    });
    updateSearchSummary({ expense: expenseTotal, income: incomeTotal, expenseCount, incomeCount });
}


function updateSearchSummary(data) {
    const expenseTotal = document.getElementById('searchExpenseTotal');
    const incomeTotal = document.getElementById('searchIncomeTotal');
    const expenseCount = document.getElementById('searchExpenseCount');
    const incomeCount = document.getElementById('searchIncomeCount');
    
    if (expenseTotal) expenseTotal.textContent = '¥' + data.expense.toFixed(2);
    if (incomeTotal) incomeTotal.textContent = '¥' + data.income.toFixed(2);
    if (expenseCount) expenseCount.textContent = data.expenseCount;
    if (incomeCount) incomeCount.textContent = data.incomeCount;
}


let searchDateEditingField = null; 


function updateSearchDateRangeDisplay(field) {
    const el = document.getElementById(field === 'start' ? 'searchDateStart' : 'searchDateEnd');
    if (!el) return;
    const val = field === 'start' ? searchState.dateStart : searchState.dateEnd;
    if (val) {
        el.textContent = val;
        el.classList.remove('placeholder');
    } else {
        el.textContent = field === 'start' ? '请选择开始日期' : '请选择结束日期';
        el.classList.add('placeholder');
    }
}


function openSearchRangeDatePicker(field) {
    const overlay = document.getElementById('dateOverlay');
    const modal = document.getElementById('dateModal');
    const confirmBtn = document.getElementById('dateBtnConfirm');
    const todayBtn = document.getElementById('dateBtnToday');
    
    if (!overlay || !modal) {
        showToast('日期选择器加载失败，请重试');
        return;
    }

    searchDateEditingField = field;

    
    const currentVal = field === 'start' ? searchState.dateStart : searchState.dateEnd;
    let initialDate = new Date();
    if (currentVal) {
        const parts = currentVal.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            if (!isNaN(d.getTime())) initialDate = d;
        }
    }
    tempSelectedDate = new Date(initialDate);
    viewDate = new Date(initialDate);

    
    const originalConfirm = confirmBtn.onclick;
    const originalToday = todayBtn ? todayBtn.onclick : null;
    const originalClose = document.getElementById('dateModalClose').onclick;

    function restoreDateCallbacks() {
        confirmBtn.onclick = originalConfirm;
        if (todayBtn) todayBtn.onclick = originalToday;
        const closeBtn = document.getElementById('dateModalClose');
        if (closeBtn) closeBtn.onclick = originalClose;
        searchDateEditingField = null;
    }

    
    confirmBtn.onclick = function() {
        
        const wy = document.getElementById('wheelYear');
        const wm = document.getElementById('wheelMonth');
        const wd = document.getElementById('wheelDay');
        let selDate;
        if (wy && wm && wd) {
            const yIdx = Math.round(wy.scrollTop / WHEEL_ITEM_HEIGHT);
            const mIdx = Math.round(wm.scrollTop / WHEEL_ITEM_HEIGHT);
            const dIdx = Math.round(wd.scrollTop / WHEEL_ITEM_HEIGHT);
            const yItems = wy.querySelectorAll('.wheel-item');
            const mItems = wm.querySelectorAll('.wheel-item');
            const dItems = wd.querySelectorAll('.wheel-item');
            const yv = yItems[yIdx]?.dataset.value;
            const mv = mItems[mIdx]?.dataset.value;
            const dv = dItems[dIdx]?.dataset.value;
            if (yv && mv && dv) {
                selDate = new Date(parseInt(yv, 10), parseInt(mv, 10) - 1, parseInt(dv, 10));
                tempSelectedDate = new Date(selDate);
            }
        }
        if (!selDate) selDate = new Date(tempSelectedDate);
        const dateStr = selDate.getFullYear() + '-' +
            String(selDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(selDate.getDate()).padStart(2, '0');

        
        if (searchDateEditingField === 'start') {
            searchState.dateStart = dateStr;
        } else {
            searchState.dateEnd = dateStr;
        }
        updateSearchDateRangeDisplay(searchDateEditingField);

        
        if (searchState.dateStart && searchState.dateEnd) {
            
            document.querySelectorAll('.search-date-presets .preset-btn').forEach(b => {
                b.classList.remove('active');
            });
            searchState.dateFilter = 'custom';
            
            const customEl = document.getElementById('searchDateCustom');
            if (customEl) {
                customEl.style.background = '';
                customEl.style.borderRadius = '';
                customEl.style.padding = '';
            }
            
            const label = searchState.dateStart + ' ~ ' + searchState.dateEnd;
            document.getElementById('searchDateFilterLabel').textContent = label;
            updateFilterBadge();
        }

        window.__skipConfirmDateUpdate = true;
        closeDatePicker();
        setTimeout(() => {
            window.__skipConfirmDateUpdate = false;
        }, 0);

        restoreDateCallbacks();
    };

    if (todayBtn) {
        todayBtn.onclick = function() {
            const today = new Date();
            tempSelectedDate = new Date(today);
            viewDate = new Date(today);
            renderDatePicker();
        };
    }

    const closeBtn = document.getElementById('dateModalClose');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closeDatePicker();
            restoreDateCallbacks();
        };
    }

    renderDatePicker();
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    });
}


function resetFilterOptionsUI() {
    document.querySelectorAll('#searchMoreModal .filter-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('#searchMoreModal .filter-option[data-value="all"]').forEach(btn => {
        btn.classList.add('active');
    });
    document.getElementById('filterAmountMin').value = '';
    document.getElementById('filterAmountMax').value = '';
    document.querySelectorAll('.search-date-presets .preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === 'all');
    });
    
    document.getElementById('searchDateCustom').style.display = 'flex';
    updateSearchDateRangeDisplay('start');
    updateSearchDateRangeDisplay('end');
    updateFilterBadge();
}


function updateFilterBadge() {
    const badge = document.querySelector('.filter-more-btn .filter-badge');
    if (!badge) return;
    
    let count = 0;
    if (searchState.type !== 'all') count++;
    if (searchState.belong !== 'all') count++;
    if (searchState.payment !== 'all') count++;
    if (searchState.amountMin !== null) count++;
    if (searchState.amountMax !== null) count++;
    if (searchState.dateFilter !== 'all') count++;
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}


function initSearchEvents() {
    
    document.getElementById('searchBox')?.addEventListener('click', function(e) {
        e.stopPropagation();
        openSearchPage();
    });
    
    
    document.getElementById('searchBackBtn')?.addEventListener('click', closeSearchPage);
    
    
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    searchInput?.addEventListener('input', function() {
        searchState.keyword = this.value;
        clearBtn.style.display = this.value.length > 0 ? 'flex' : 'none';
    });
    
    searchInput?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchState.keyword = this.value.trim();
            performSearch(true);
        }
    });
    
    clearBtn?.addEventListener('click', function() {
        searchInput.value = '';
        searchState.keyword = '';
        this.style.display = 'none';
        searchInput.focus();
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchEmpty').style.display = 'none';
        document.getElementById('searchSummary').style.display = 'none';
        updateSearchSummary({ expense: 0, income: 0, expenseCount: 0, incomeCount: 0 });
    });
    
    document.getElementById('searchSubmitBtn')?.addEventListener('click', function() {
        searchState.keyword = document.getElementById('searchInput').value.trim();
        performSearch(true);
    });
    
    
    document.getElementById('searchDateFilterBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        syncDatePresetUI();
        document.getElementById('searchDateOverlay').classList.add('show');
        document.getElementById('searchDateModal').classList.add('show');
    });
    
    
    document.getElementById('searchDateClose')?.addEventListener('click', function() {
        document.getElementById('searchDateOverlay').classList.remove('show');
        document.getElementById('searchDateModal').classList.remove('show');
    });
    document.getElementById('searchDateOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            document.getElementById('searchDateOverlay').classList.remove('show');
            document.getElementById('searchDateModal').classList.remove('show');
        }
    });
    
    
    document.querySelectorAll('.search-date-presets .preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            
            document.querySelectorAll('.search-date-presets .preset-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const preset = this.dataset.preset;
            
            
            
            searchState.dateFilter = preset;
            
            
            if (preset === 'all') {
                searchState.dateStart = null;
                searchState.dateEnd = null;
                
                document.getElementById('searchDateStart').textContent = '请选择开始日期';
                document.getElementById('searchDateStart').classList.add('placeholder');
                document.getElementById('searchDateEnd').textContent = '请选择结束日期';
                document.getElementById('searchDateEnd').classList.add('placeholder');
                
                const customEl = document.getElementById('searchDateCustom');
                if (customEl) {
                    customEl.style.background = '';
                    customEl.style.borderRadius = '';
                    customEl.style.padding = '';
                }
            } else {
                
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let start = null, end = null;
                
                if (preset === 'today') {
                    const dateStr = formatDate(today);
                    start = dateStr;
                    end = dateStr;
                } else if (preset === 'week') {
                    const weekStart = getWeekStart(today);
                    const weekEnd = getWeekEnd(today);
                    start = formatDate(weekStart);
                    end = formatDate(weekEnd);
                } else if (preset === 'month') {
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    start = formatDate(monthStart);
                    end = formatDate(monthEnd);
                }
                
                
                if (start && end) {
                    document.getElementById('searchDateStart').textContent = start;
                    document.getElementById('searchDateStart').classList.remove('placeholder');
                    document.getElementById('searchDateEnd').textContent = end;
                    document.getElementById('searchDateEnd').classList.remove('placeholder');
                    
                    const customEl = document.getElementById('searchDateCustom');
                    if (customEl) {
                        customEl.style.background = '';
                        customEl.style.borderRadius = '';
                        customEl.style.padding = '';
                    }
                }
            }
            
            updateSearchDateFilterLabel();
            updateFilterBadge();
        });
    });
    
    
    document.getElementById('searchDateStart')?.addEventListener('click', function(e) {
        e.stopPropagation();
        
        document.querySelectorAll('.search-date-presets .preset-btn').forEach(b => b.classList.remove('active'));
        
        searchState.dateFilter = 'custom';
        openSearchRangeDatePicker('start');
    });
    
    
    document.getElementById('searchDateEnd')?.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.search-date-presets .preset-btn').forEach(b => b.classList.remove('active'));
        searchState.dateFilter = 'custom';
        openSearchRangeDatePicker('end');
    });
    
    
    document.getElementById('searchDateConfirm')?.addEventListener('click', function() {
        
        const activePreset = document.querySelector('.search-date-presets .preset-btn.active');
        const preset = activePreset ? activePreset.dataset.preset : null;
        
        
        const hasCustomDates = searchState.dateStart && searchState.dateEnd;
        
        
        if (searchState.dateFilter === 'custom' || (hasCustomDates && !preset)) {
            searchState.dateFilter = 'custom';
            const label = searchState.dateStart + ' ~ ' + searchState.dateEnd;
            document.getElementById('searchDateFilterLabel').textContent = label;
        } else if (preset === 'all' || !preset) {
            searchState.dateFilter = 'all';
            document.getElementById('searchDateFilterLabel').textContent = '全部时间';
            searchState.dateStart = null;
            searchState.dateEnd = null;
        } else if (preset) {
            
            searchState.dateFilter = preset;
            const labels = {
                'today': '今天',
                'week': '本周',
                'month': '本月'
            };
            document.getElementById('searchDateFilterLabel').textContent = labels[preset] || '全部时间';
            
            
        }
        
        updateFilterBadge();
        document.getElementById('searchDateOverlay').classList.remove('show');
        document.getElementById('searchDateModal').classList.remove('show');
    });
    
    
    document.getElementById('searchMoreFilterBtn')?.addEventListener('click', function(e) {
        e.stopPropagation();
        syncFilterOptionsUI();
        document.getElementById('searchMoreOverlay').classList.add('show');
        document.getElementById('searchMoreModal').classList.add('show');
    });
    
    
    document.getElementById('searchMoreClose')?.addEventListener('click', function() {
        document.getElementById('searchMoreOverlay').classList.remove('show');
        document.getElementById('searchMoreModal').classList.remove('show');
    });
    document.getElementById('searchMoreOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            document.getElementById('searchMoreOverlay').classList.remove('show');
            document.getElementById('searchMoreModal').classList.remove('show');
        }
    });
    
    
    document.querySelectorAll('#searchMoreModal .filter-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.filter;
            document.querySelectorAll(`#searchMoreModal .filter-option[data-filter="${group}"]`).forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    
    document.getElementById('searchMoreReset')?.addEventListener('click', function() {
        resetFilterOptionsUI();
    });
    
    
    document.getElementById('searchMoreConfirm')?.addEventListener('click', function() {
        const typeBtn = document.querySelector('#searchMoreModal .filter-option[data-filter="type"].active');
        searchState.type = typeBtn ? typeBtn.dataset.value : 'all';
        
        const belongBtn = document.querySelector('#searchMoreModal .filter-option[data-filter="belong"].active');
        searchState.belong = belongBtn ? belongBtn.dataset.value : 'all';
        
        const paymentBtn = document.querySelector('#searchMoreModal .filter-option[data-filter="payment"].active');
        searchState.payment = paymentBtn ? paymentBtn.dataset.value : 'all';
        
        const minVal = document.getElementById('filterAmountMin').value;
        const maxVal = document.getElementById('filterAmountMax').value;
        searchState.amountMin = minVal ? parseFloat(minVal) : null;
        searchState.amountMax = maxVal ? parseFloat(maxVal) : null;
        
        updateFilterBadge();
        document.getElementById('searchMoreOverlay').classList.remove('show');
        document.getElementById('searchMoreModal').classList.remove('show');
    });
    
    
    document.getElementById('filterAmountMin')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('searchMoreConfirm').click();
        }
    });
    document.getElementById('filterAmountMax')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('searchMoreConfirm').click();
        }
    });
}


function syncDatePresetUI() {
    const preset = searchState.dateFilter || 'all';
    
    
    document.querySelectorAll('.search-date-presets .preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === preset);
    });
    
    
    if (preset === 'custom') {
        updateSearchDateRangeDisplay('start');
        updateSearchDateRangeDisplay('end');
        const customEl = document.getElementById('searchDateCustom');
        if (customEl && searchState.dateStart && searchState.dateEnd) {
            customEl.style.display = 'flex';
            customEl.style.background = '';
            customEl.style.borderRadius = '';
            customEl.style.padding = '';
        }
    } else if (preset === 'all') {
        
        document.getElementById('searchDateStart').textContent = '请选择开始日期';
        document.getElementById('searchDateStart').classList.add('placeholder');
        document.getElementById('searchDateEnd').textContent = '请选择结束日期';
        document.getElementById('searchDateEnd').classList.add('placeholder');
        const customEl = document.getElementById('searchDateCustom');
        if (customEl) {
            customEl.style.background = '';
            customEl.style.borderRadius = '';
            customEl.style.padding = '';
        }
    } else {
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start = null, end = null;
        
        if (preset === 'today') {
            const dateStr = formatDate(today);
            start = dateStr;
            end = dateStr;
        } else if (preset === 'week') {
            const weekStart = getWeekStart(today);
            const weekEnd = getWeekEnd(today);
            start = formatDate(weekStart);
            end = formatDate(weekEnd);
        } else if (preset === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            start = formatDate(monthStart);
            end = formatDate(monthEnd);
        }
        
        if (start && end) {
            document.getElementById('searchDateStart').textContent = start;
            document.getElementById('searchDateStart').classList.remove('placeholder');
            document.getElementById('searchDateEnd').textContent = end;
            document.getElementById('searchDateEnd').classList.remove('placeholder');
            const customEl = document.getElementById('searchDateCustom');
            if (customEl) {
                customEl.style.background = '';
                customEl.style.borderRadius = '';
                customEl.style.padding = '';
            }
        }
    }
}


function updateSearchDateFilterLabel() {
    const label = document.getElementById('searchDateFilterLabel');
    if (!label) return;
    
    const preset = searchState.dateFilter;
    if (preset === 'all') {
        label.textContent = '全部时间';
    } else if (preset === 'today') {
        label.textContent = '今天';
    } else if (preset === 'week') {
        label.textContent = '本周';
    } else if (preset === 'month') {
        label.textContent = '本月';
    } else if (preset === 'custom') {
        const start = searchState.dateStart || '';
        const end = searchState.dateEnd || '';
        label.textContent = start + (start && end ? ' ~ ' : '') + end;
    } else {
        label.textContent = '全部时间';
    }
}

function syncFilterOptionsUI() {
    
    document.querySelectorAll('#searchMoreModal .filter-option[data-filter="type"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === searchState.type);
    });
    
    document.querySelectorAll('#searchMoreModal .filter-option[data-filter="belong"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === searchState.belong);
    });
    
    document.querySelectorAll('#searchMoreModal .filter-option[data-filter="payment"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === searchState.payment);
    });
    
    document.getElementById('filterAmountMin').value = searchState.amountMin !== null ? searchState.amountMin : '';
    document.getElementById('filterAmountMax').value = searchState.amountMax !== null ? searchState.amountMax : '';
}

function renderSearchBillItem(b) {
    const cats = getCategoriesByType(b.type);
    const cat = cats.find(c => c.label === b.category);
    const icon = cat ? cat.icon : 'fa-tag';

    const typeClass = b.type === 'income' ? 'income' : 'expense';
    const sign = b.type === 'income' ? '+' : '-';
    const typeLabel = b.type === 'income' ? '收入' : '支出';

    const displayText = b.note && b.note.trim() ? b.note.trim() : b.category;

    
    const belongDisplay = getDisplayBelongName(b);
    const isHelp = isHelpBill(b);

    return `
        <div class="bill-item-static" data-id="${b.id}">
            <div class="bill-item-content">
                <div class="bill-left">
                    <div class="bill-icon ${typeClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="bill-info">
                        <div class="bill-category">${escapeHtml(displayText)}</div>
                        <div class="bill-note">
                            <span></span>
                            <span class="belong-tag">${belongDisplay}</span>${isHelp ? '<span class="belong-tag help-tag">帮记</span>' : ''}
                            <span class="type-tag ${typeClass}">${typeLabel}</span>
                        </div>
                    </div>
                </div>
                <div class="bill-amount ${typeClass}">${sign}¥${b.amount.toFixed(2)}</div>
            </div>
        </div>
    `;
}



function openFeedbackPage() {
    const pageEl = document.getElementById('page-feedback');
    if (!pageEl) return;

    previousPage = currentPage;
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    currentPage = 'feedback';
}


function closeFeedbackPage() {
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-feedback');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target !== 'budget' && target !== 'stats') stopBudgetRealtimeSync();
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') { enterStatsPage(); }
    else if (target === 'profile') renderProfile();
}


function initFeedbackEvents() {
    document.getElementById('feedbackBackBtn')?.addEventListener('click', closeFeedbackPage);
}


function initBugFeedbackEvents() {
    const page = document.getElementById('page-bug-feedback');
    if (!page) return;

    
    document.getElementById('feedbackBugBtn')?.addEventListener('click', openBugFeedbackPage);
    document.getElementById('bugfbBackBtn')?.addEventListener('click', closeBugFeedbackPage);

    
    document.querySelectorAll('.bugfb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.bugfb-tab').forEach(t => t.classList.toggle('active', t === tab));
            document.querySelectorAll('.bugfb-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
            updateBugfbTabSlider();
        });
    });
    
    updateBugfbTabSlider();

    
    const bindCounter = (taId, ctId) => {
        const ta = document.getElementById(taId);
        const ct = document.getElementById(ctId);
        if (ta && ct) ta.addEventListener('input', () => ct.textContent = ta.value.length);
    };
    bindCounter('bugfbDesc', 'bugfbDescCount');
    bindCounter('bugfbSuggest', 'bugfbSuggestCount');

    initBugTypeSheet();
    initBugTimeWheel();
    initBugImagePicker('bugfbImgInput', 'bugfbImgGrid');
    initBugImagePicker('bugfbSuggestImgInput', 'bugfbSuggestImgGrid');


document.getElementById('bugfbSubmitBug')?.addEventListener('click', async function() {
    const typeBtn = document.querySelector('#bugfbTypeOptions .bugfb-type-option.active');
    const type = typeBtn ? typeBtn.dataset.type : null;
    const time = document.getElementById('bugfbTimeValue');
    const desc = document.getElementById('bugfbDesc');
    const btn = this;
    
    if (!type) {
        bugfbToast('请选择Bug类型');
        return;
    }
    if (!desc.value.trim()) {
        bugfbToast('请描述遇到的问题');
        desc.focus();
        return;
    }
    
    
    const images = [];
    document.querySelectorAll('#bugfbImgGrid .bugfb-img-item img').forEach(img => {
        images.push(img.src);
    });
    
    btn.disabled = true;
    btn.textContent = '提交中...';
    
    try {
        const result = await apiCall('/feedback/bug', 'POST', {
            type: type,
            time: time.textContent.includes('请选择') ? null : time.textContent,
            description: desc.value.trim(),
            images: images
        });
        bugfbToast('反馈已提交，感谢您的反馈！');
        
        document.querySelectorAll('#bugfbTypeOptions .bugfb-type-option').forEach(o => o.classList.remove('active'));
        document.getElementById('bugfbTimeValue').textContent = '请选择时间';
        document.getElementById('bugfbTimeValue').classList.add('placeholder');
        desc.value = '';
        document.getElementById('bugfbDescCount').textContent = '0';
        document.getElementById('bugfbImgGrid').innerHTML = `
            <label class="bugfb-img-add" for="bugfbImgInput">
                <i class="ri-add-line"></i>
            </label>
        `;
    } catch (err) {
        bugfbToast('提交失败: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '提交反馈';
    }
});


document.getElementById('bugfbSubmitSuggest')?.addEventListener('click', async function() {
    const content = document.getElementById('bugfbSuggest');
    const btn = this;
    
    if (!content.value.trim()) {
        bugfbToast('请输入你的建议');
        content.focus();
        return;
    }
    
    const images = [];
    document.querySelectorAll('#bugfbSuggestImgGrid .bugfb-img-item img').forEach(img => {
        images.push(img.src);
    });
    
    btn.disabled = true;
    btn.textContent = '提交中...';
    
    try {
        await apiCall('/feedback/suggest', 'POST', {
            content: content.value.trim(),
            images: images
        });
        bugfbToast('建议已提交，感谢您的支持！');
        content.value = '';
        document.getElementById('bugfbSuggestCount').textContent = '0';
        document.getElementById('bugfbSuggestImgGrid').innerHTML = `
            <label class="bugfb-img-add" for="bugfbSuggestImgInput">
                <i class="ri-add-line"></i>
            </label>
        `;
    } catch (err) {
        bugfbToast('提交失败: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '提交建议';
    }
});
}

function openBugFeedbackPage() {
    pageBackStack.push(currentPage);
    const pageEl = document.getElementById('page-bug-feedback');
    if (!pageEl) return;
    pageEl.querySelectorAll('.bugfb-overlay, .bugfb-sheet').forEach(el => el.classList.remove('show'));
    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });
    requestAnimationFrame(() => {
        requestAnimationFrame(updateBugfbTabSlider);
    });
    currentPage = 'bug-feedback';
}

function closeBugFeedbackPage() {
    const target = pageBackStack.length > 0 ? pageBackStack.pop() : 'feedback';
    const pageEl = document.getElementById('page-bug-feedback');
    if (!pageEl) return;
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    restoreFromBack(target);
}



function updateBugfbTabSlider() {
    const nav = document.getElementById('bugfbTabs');
    const slider = document.getElementById('bugfbTabSlider');
    if (!nav || !slider) return;
    const active = nav.querySelector('.bugfb-tab.active');
    if (!active) return;
    const ratio = 0.4; 
    const w = active.offsetWidth * ratio;
    const left = active.offsetLeft + (active.offsetWidth - w) / 2;
    slider.style.left = left + 'px';
    slider.style.width = w + 'px';
}


function initBugTypeSheet() {
    const overlay = document.getElementById('bugfbTypeOverlay');
    const sheet = document.getElementById('bugfbTypeSheet');
    const field = document.getElementById('bugfbTypeField');
    const valueEl = document.getElementById('bugfbTypeValue');
    const closeBtn = document.getElementById('bugfbTypeClose');
    const options = document.querySelectorAll('#bugfbTypeOptions .bugfb-type-option');

    const open = () => { overlay?.classList.add('show'); sheet?.classList.add('show'); };
    const close = () => { overlay?.classList.remove('show'); sheet?.classList.remove('show'); };

    field?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.toggle('active', o === opt));
            if (valueEl) {
                valueEl.textContent = opt.dataset.type;
                valueEl.classList.remove('placeholder');
            }
            setTimeout(close, 180);
        });
    });
}


function initBugTimeWheel() {
    const ITEM_H = 44;
    const overlay = document.getElementById('bugfbTimeOverlay');
    const sheet = document.getElementById('bugfbTimeSheet');
    const field = document.getElementById('bugfbTimeField');
    const valueEl = document.getElementById('bugfbTimeValue');
    const closeBtn = document.getElementById('bugfbTimeClose');
    const confirmBtn = document.getElementById('bugfbTimeConfirm');

    const wY = document.getElementById('bugWheelYear');
    const wM = document.getElementById('bugWheelMonth');
    const wD = document.getElementById('bugWheelDay');
    const wH = document.getElementById('bugWheelHour');
    const wMin = document.getElementById('bugWheelMinute');
    if (!wY) return;

    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    let sel = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate(), h: now.getHours(), min: now.getMinutes() };

    const range = (s, e) => { const a = []; for (let i = s; i <= e; i++) a.push(i); return a; };
    const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

    function fillWheel(el, items, selectedVal, unit) {
        const html = items.map(v => {
            const isSel = Number(v) === Number(selectedVal);
            return `<div class="wheel-item ${isSel ? 'wheel-selected' : ''}" data-value="${v}">${unit ? v + unit : v}</div>`;
        }).join('');
        el.innerHTML = html;
        const idx = items.indexOf(Number(selectedVal));
        if (idx >= 0) el.scrollTop = idx * ITEM_H;
        let timer = null;
        el.onscroll = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                const i = Math.round(el.scrollTop / ITEM_H);
                const clamped = Math.max(0, Math.min(items.length - 1, i));
                el.scrollTop = clamped * ITEM_H;
                el.querySelectorAll('.wheel-item').forEach((node, k) => node.classList.toggle('wheel-selected', k === clamped));
            }, 120);
        };
        el.querySelectorAll('.wheel-item').forEach((node, k) => {
            node.addEventListener('click', e => {
                e.stopPropagation();
                el.scrollTo({ top: k * ITEM_H, behavior: 'smooth' });
            });
        });
    }

    function getVal(el) {
        const idx = Math.round(el.scrollTop / ITEM_H);
        const node = el.querySelectorAll('.wheel-item')[idx];
        return node ? Number(node.dataset.value) : null;
    }

    function renderAll() {
        fillWheel(wY, range(sel.y - 3, sel.y + 3), sel.y, '年');
        fillWheel(wM, range(1, 12), sel.m, '月');
        fillWheel(wD, range(1, daysInMonth(sel.y, sel.m)), sel.d, '日');
        fillWheel(wH, range(0, 23), sel.h, '时');
        fillWheel(wMin, range(0, 59), sel.min, '分');
    }

    const open = () => { renderAll(); overlay?.classList.add('show'); sheet?.classList.add('show'); };
    const close = () => { overlay?.classList.remove('show'); sheet?.classList.remove('show'); };

    field?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    confirmBtn?.addEventListener('click', () => {
        sel.y = getVal(wY) ?? sel.y;
        sel.m = getVal(wM) ?? sel.m;
        sel.d = getVal(wD) ?? sel.d;
        sel.h = getVal(wH) ?? sel.h;
        sel.min = getVal(wMin) ?? sel.min;
        if (valueEl) {
            valueEl.textContent = `${sel.y}年${pad(sel.m)}月${pad(sel.d)}日 ${pad(sel.h)}:${pad(sel.min)}`;
            valueEl.classList.remove('placeholder');
        }
        close();
    });
}


function initBugImagePicker(inputId, gridId) {
    const input = document.getElementById(inputId);
    const grid = document.getElementById(gridId);
    if (!input || !grid) return;
    const images = [];
    const MAX = 9;

    
    const inputIdMap = { 'bugfbImgGrid': 'bugfbImgInput', 'bugfbSuggestImgGrid': 'bugfbSuggestImgInput' };
    const inputIdForGrid = inputIdMap[gridId];

    function render() {
        grid.innerHTML = '';
        images.forEach((src, idx) => {
            const item = document.createElement('div');
            item.className = 'bugfb-img-item';
            item.innerHTML = `<img src="${src}" alt=""><button class="bugfb-img-del" data-idx="${idx}"><i class="ri-close-line"></i></button>`;
            grid.appendChild(item);
        });
        
        if (images.length < MAX && inputIdForGrid) {
            const addLabel = document.createElement('label');
            addLabel.className = 'bugfb-img-add';
            addLabel.setAttribute('for', inputIdForGrid);
            addLabel.innerHTML = '<i class="ri-add-line"></i>';
            grid.appendChild(addLabel);
        }
    }

    input.addEventListener('change', e => {
        const files = Array.from(e.target.files || []);
        
        const seenKeys = new Set();
        files.forEach(f => {
            if (images.length >= MAX) return;
            if (!f.type.startsWith('image/')) return;
            const key = `${f.name}|${f.size}|${f.lastModified}`;
            if (seenKeys.has(key)) return;
            seenKeys.add(key);
            
            const reader = new FileReader();
            reader.onload = ev => {
                if (images.length >= MAX) return;
                const dataUrl = ev.target.result;
                
                if (images.includes(dataUrl)) return;
                images.push(dataUrl);
                render();
            };
            reader.readAsDataURL(f);
        });
        input.value = '';
    });

    grid.addEventListener('click', e => {
        const del = e.target.closest('.bugfb-img-del');
        if (del) {
            e.preventDefault();
            e.stopPropagation();
            const idx = Number(del.dataset.idx);
            images.splice(idx, 1);
            render();
        }
    });
}


function bugfbToast(msg) {
    let t = document.getElementById('bugfbToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'bugfbToast';
        t.className = 'bugfb-toast';
        document.getElementById('page-bug-feedback')?.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}
    

function init() {
  
initWebViewEvents();
  initFeedbackEvents();
  initBugFeedbackEvents();
  showLoading();
  initProfileInfoEvents();
  initDeleteAccountEvents();
  initUnbindAccountEvents();
  initChangePasswordEvents();
  initForgotPasswordEvents();
  initPasswordToggles();
  initAuthLinks();
  
  initChangelogPageEvents();
  
  initTermsModalEvents();
  
  initAppVersion();
  
initSearchEvents();
  
initThemeEvents();
  
initMatchPageEvents();
      
    initAccountSecurityEvents();
    
initScheduledEvents();
    
    rebindAccountManage();
  initProfileInfoEvents();

initPartnerProfileEvents();

rebindPartnerAvatarClick();
rebindProfileAvatarClick();
  initCategoryDetailEvents();
      
    initStatsEvents();
    initStatsDatePickerEvents();
    
statsState.detailBelong = 'all';
statsState.categoryBelong = 'all';
statsState.rankBelong = 'all';


  initWeekPickerEvents();
  initYearPickerEvents(); 
  
initBillsEvents();

renderBills();
    
    initBudgetPage();
    
    initAnnualPageEvents();
    
    document.getElementById('profileYearBill')?.addEventListener('click', openAnnualPage);
    
    
    selectedMonthDate = new Date();
    updateMonthLabel();
    
    
    const today = new Date();
    selectedDate = new Date(today);
    updateDateTrigger();
    
    
    initWalletNavigation();
    
    buildCategorySlides();
    initHomeBillNav();
    setType('expense', null, false, false, true);
    initCategorySwipe();

    
    selectedBelong = '自己';
    updateBelongButtons();
    
    
    amountStr = '0';
    updateAmountDisplay();
    resetNote();
    setPaymentMethod('微信');

    
    initSwipeEvents();
    setupBackspaceLongPress();

    
    requestAnimationFrame(() => {
        updateSliderPosition();
    });
    
    
    initBounceScroll('#page-home', {
        indicatorEl: document.getElementById('homePullRefresh'),
        onRefresh: async (done) => {
            try {
                await refreshHomeData();
            } catch (e) {
                showToast('刷新失败');
            } finally {
                done();
            }
        }
    });
    initBounceScroll('#page-profile');
    initBounceScroll('.category-slide');
    initBounceScroll('.settings-list-wrapper');
    initBounceScroll('.page-main');
    
    
    renderIconGrid(catIconGrid, 'fa-tag');
    renderIconGrid(catEditIconGrid, 'fa-tag');

    
    
    if (summaryDateLabel) {
        summaryDateLabel.addEventListener('click', function(e) {
            e.stopPropagation();
            openMonthPicker();
        });
    }

    
    if (monthModalClose) {
        monthModalClose.addEventListener('click', closeMonthPicker);
    }
    if (monthOverlay) {
        monthOverlay.addEventListener('click', function(e) {
            if (e.target === this) closeMonthPicker();
        });
    }

    
if (monthBtnToday) {
    monthBtnToday.onclick = goToCurrentMonth;
}
    if (monthBtnConfirm) {
        monthBtnConfirm._originalClick = monthBtnConfirm.onclick || confirmMonth;
        monthBtnConfirm.onclick = confirmMonth;
    }



const aboutUsItem = document.getElementById('profileAboutUs');
if (aboutUsItem) {
    aboutUsItem.addEventListener('click', function() {
        pageBackStack.push(currentPage);
        const pageEl = document.getElementById('page-about');
        pageEl.style.display = 'flex';
        requestAnimationFrame(() => {
            pageEl.classList.add('active');
            try { refreshStatusBar(); } catch(e) {}
        });
        currentPage = 'about';
    });
}
document.getElementById('profileFeedback')?.addEventListener('click', function() {
    openFeedbackPage();
});
function closeAboutPage() {
    const target = pageBackStack.length > 0 ? pageBackStack.pop() : 'profile';
    const pageEl = document.getElementById('page-about');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    restoreFromBack(target);
}
document.getElementById('aboutBackBtn').addEventListener('click', closeAboutPage);


    
document.addEventListener('click', function(e) {
    if (!monthModal.classList.contains('show')) return;
    const modal = monthModal;
    
    const triggers = [summaryDateLabel, document.getElementById('budgetDateBtn')];
    const isTrigger = triggers.some(trigger => trigger && trigger.contains(e.target));
    if (!modal.contains(e.target) && !isTrigger) {
        closeMonthPicker();
    }
});

    
    if (!checkAuth()) {
        showLoginPage();
    } else {
        fetchPartnerStatus();
        checkTermsVersion();
    }

    
    if (window.PetSystem) {
        window.PetSystem.init();
    }

    
    
    $('#detailBackBtn').addEventListener('click', goBackFromDetail);

    
    $('#commentSendBtn').addEventListener('click', sendComment);
    $('#commentInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendComment();
        }
    });

    
    $('#detailMenuBtn').addEventListener('click', showDetailMenu);

    document.getElementById('detailMenuOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) hideDetailMenu();
    });
    document.getElementById('detailMenuCancel')?.addEventListener('click', hideDetailMenu);
    document.getElementById('detailMenuEdit')?.addEventListener('click', handleDetailMenuEdit);
    document.getElementById('detailMenuDelete')?.addEventListener('click', handleDetailMenuDelete);
    
    


document.getElementById('profileCategoryManage')?.addEventListener('click', function() {
    
    if (addModalOverlay.classList.contains('show')) {
        
        addModalOverlay.style.transition = 'none';
        addModalOverlay.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            addModalOverlay.style.transition = '';
        }, 50);
    }
    
    
    settingsFromProfile = true;
    
    
    settingsCurrentType = currentType || 'expense';
    
    
    settingsOverlay.classList.add('show');
    renderSettingsList(settingsCurrentType);
    settingsTabs.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.stype === settingsCurrentType);
    });
    requestAnimationFrame(() => updateSettingsTabSlider());
    document.body.style.overflow = 'hidden';
});


document.getElementById('profileBudgetManage')?.addEventListener('click', function() {
    const wallet = getCurrentWallet();
    budgetViewType = wallet.key;
    budgetViewDate = new Date(selectedMonthDate);
    openBudgetPage();
});

const profileScheduled = document.getElementById('profileScheduled');
if (profileScheduled) {
    
    const newEl = profileScheduled.cloneNode(true);
    profileScheduled.parentNode.replaceChild(newEl, profileScheduled);
    
    newEl.addEventListener('click', function() {
        openScheduledPage();
    });
}






const CSV_FIELDS = ['type', 'category', 'amount', 'date', 'note', 'payment', 'belong'];
const CSV_HEADER_CN = {
    type: '类型',
    category: '分类',
    amount: '金额',
    date: '日期',
    note: '备注',
    payment: '支付方式',
    belong: '归属'
};
const TYPE_EN_TO_CN = { income: '收入', expense: '支出' };
const TYPE_CN_TO_EN = { '收入': 'income', '支出': 'expense' };

function csvEscape(val) {
    if (val === null || val === undefined) val = '';
    val = String(val);
    if (/[",\n\r]/.test(val)) {
        val = '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
}

function billsToCSV(bills) {
    const header = CSV_FIELDS.map(f => CSV_HEADER_CN[f] || f).join(',');
    const rows = bills.map(b => CSV_FIELDS.map(f => {
        let val = b[f];
        if (f === 'type' && TYPE_EN_TO_CN[val]) val = TYPE_EN_TO_CN[val];
        return csvEscape(val);
    }).join(','));
    return header + '\r\n' + rows.join('\r\n');
}


function parseCSV(text) {
    text = text.replace(/^[\uFEFF\uFFFE]+/, ''); 
    const rows = [];
    let row = [], field = '', i = 0, inQuotes = false;
    while (i < text.length) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
                inQuotes = false; i++; continue;
            }
            field += ch; i++; continue;
        }
        if (ch === '"') { inQuotes = true; i++; continue; }
        if (ch === ',') { row.push(field); field = ''; i++; continue; }
        if (ch === '\r') { i++; continue; }
        if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
        field += ch; i++;
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
}

function normalizeDate(s) {
    if (!s) return '';
    s = String(s).trim();
    const m = s.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})/);
    if (m) {
        const y = m[1], mo = String(m[2]).padStart(2, '0'), d = String(m[3]).padStart(2, '0');
        return `${y}-${mo}-${d}`;
    }
    return s;
}

function csvToBills(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) return [];

    function normHeader(s) {
        return s.replace(/[\uFEFF\u200B\u200C\u200D\u00A0\u2028\u2029\uFFFD]/g, '').trim();
    }

    const header = rows[0].map(h => normHeader(h));
    var HEADER_MAP = {
        '类型': 'type', 'type': 'type',
        '分类': 'category', 'category': 'category',
        '金额': 'amount', 'amount': 'amount',
        '日期': 'date', 'date': 'date',
        '备注': 'note', 'note': 'note',
        '支付方式': 'payment', 'payment': 'payment',
        '归属': 'belong', 'belong': 'belong',
        'ID': 'id', 'id': 'id',
        '账本类型': 'ledger_type', 'ledger_type': 'ledger_type'
    };
    var idx = {};
    header.forEach(function(h, i) {
        var key = HEADER_MAP[h] || HEADER_MAP[h.toLowerCase()] || h;
        idx[key] = i;
    });
    var required = ['type', 'category', 'amount', 'date'];
    var missing = required.filter(function(r) { return !(r in idx); });
    if (missing.length) throw new Error('CSV 缺少必要列：' + missing.join(', ') + '（检测到表头：' + header.join(' | ') + '）');
    const out = [];
    for (let r = 1; r < rows.length; r++) {
        const cells = rows[r];
        if (cells.length === 1 && cells[0].trim() === '') continue; 
        const get = (name) => (idx[name] != null && cells[idx[name]] != null) ? cells[idx[name]].trim() : '';
        let type = get('type');
        if (TYPE_CN_TO_EN[type]) type = TYPE_CN_TO_EN[type]; 
        const amount = parseFloat(get('amount'));
        const date = normalizeDate(get('date'));
        if ((type !== 'income' && type !== 'expense') || isNaN(amount) || !date) continue;
        out.push({
            type,
            category: get('category') || '其他',
            amount,
            date,
            note: get('note'),
            payment: get('payment') || '微信',
            belong: get('belong') || '自己',
            ledger_type: get('ledger_type') || 'personal'
        });
    }
    return out;
}

function readFileText(file) {
    return new Promise(function(resolve, reject) {
        
        if (typeof TextDecoder === 'undefined') {
            var fr0 = new FileReader();
            fr0.onload = function() { resolve(fr0.result); };
            fr0.onerror = reject;
            fr0.readAsText(file, 'UTF-8');
            return;
        }
        var fr = new FileReader();
        fr.onload = function() {
            var buffer = fr.result;
            var text;
            try {
                text = new TextDecoder('utf-8').decode(buffer);
            } catch(e) { text = ''; }
            
            if (text.indexOf('\uFFFD') !== -1) {
                try {
                    var gbkText = new TextDecoder('gbk').decode(buffer);
                    if (gbkText.indexOf('\uFFFD') === -1) text = gbkText;
                } catch(e2) {}
            }
            resolve(text);
        };
        fr.onerror = reject;
        fr.readAsArrayBuffer(file);
    });
}



async function saveBillsCSV(bills) {
    if (!bills || !bills.length) return false;
    const csv = '﻿' + billsToCSV(bills); 
    const ts = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fname = `well_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`;

    
    if (window.plus && plus.io) {
        try {
            
            if (window.plus.android) {
                const BuildVersionSDK = parseInt(plus.device.sdkVersion || '0');
                if (BuildVersionSDK >= 23) {
                    const Context = plus.android.importClass('android.content.Context');
                    const PermissionChecker = plus.android.importClass('androidx.core.content.PermissionChecker')
                        || plus.android.importClass('android.support.v4.content.PermissionChecker');
                    const main = plus.android.runtimeMainActivity();
                    const checkResult = PermissionChecker.checkSelfPermission(main, 'android.permission.WRITE_EXTERNAL_STORAGE');
                    if (checkResult !== 0) { 
                        
                        await new Promise((resolve, reject) => {
                            plus.android.requestPermissions(
                                ['android.permission.WRITE_EXTERNAL_STORAGE'],
                                (e) => {
                                    if (e.deniedAlways.length > 0 || e.deniedPresent.length > 0) {
                                        reject(new Error('存储权限被拒绝'));
                                    } else {
                                        resolve();
                                    }
                                },
                                (e) => reject(new Error('权限请求失败'))
                            );
                        });
                    }
                }
            }

            
            const fileSystem = await new Promise((resolve, reject) => {
                plus.io.requestFileSystem(
                    plus.io.PUBLIC_DOWNLOADS,
                    (fs) => resolve(fs),
                    (e) => reject(new Error('无法访问下载目录：' + e.message))
                );
            });

            
            const fileEntry = await new Promise((resolve, reject) => {
                fileSystem.root.getFile(
                    fname,
                    { create: true, exclusive: false },
                    (entry) => resolve(entry),
                    (e) => reject(new Error('创建文件失败：' + e.message))
                );
            });

            
            await new Promise((resolve, reject) => {
                fileEntry.createWriter(
                    (writer) => {
                        writer.onwrite = () => resolve();
                        writer.onerror = (e) => reject(new Error('写入文件失败'));
                        writer.write(csv);
                    },
                    (e) => reject(new Error('获取文件写入器失败：' + e.message))
                );
            });

            showToast('已导出到 Downloads/' + fname);
            return true;
        } catch (e) {
            console.warn('5+ 导出失败，退回浏览器方式：', e);
            
        }
    }

    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('已导出 ' + bills.length + ' 条账单');
    return true;
}


async function exportBillsToCSV() {
    try {
        if (!allBills || !allBills.length) { showToast('当前没有可导出的账单'); return; }
        const ok = await saveBillsCSV(allBills);
        if (!ok) showToast('当前没有可导出的账单');
    } catch (e) {
        showToast('导出失败：' + e.message);
    }
}

async function importBillsFromCSV(file) {
    try {
        const text = await readFileText(file);
        const bills = csvToBills(text);
        if (!bills.length) { showToast('CSV 中没有有效账单数据'); return; }

        const total = bills.length;
        let ok = 0, fail = 0;
        var RING_R = 42;
        var CIRCUM = 2 * Math.PI * RING_R;

        var overlay = document.getElementById('importOverlay');
        var modal = document.getElementById('importProgressModal');
        var ringFill = document.getElementById('importRingFill');
        var ringText = document.getElementById('importRingText');
        var progressLabel = document.getElementById('importProgressLabel');

        if (ringFill) {
            ringFill.style.strokeDasharray = CIRCUM;
            ringFill.style.strokeDashoffset = CIRCUM;
        }
        if (ringText) ringText.textContent = '0%';
        if (progressLabel) progressLabel.textContent = '正在导入 0/' + total + ' 条...';
        if (overlay) overlay.classList.add('show');
        if (modal) modal.classList.add('show');
        try { refreshStatusBar(); } catch(e) {}

        for (var i = 0; i < bills.length; i++) {
            try { await apiCall('/bills', 'POST', bills[i]); ok++; }
            catch (e) { fail++; }
            var progress = (i + 1) / total;
            if (ringFill) ringFill.style.strokeDashoffset = CIRCUM * (1 - progress);
            if (ringText) ringText.textContent = Math.round(progress * 100) + '%';
            if (progressLabel) progressLabel.textContent = '正在导入 ' + (i + 1) + '/' + total + ' 条...';
        }

        await loadAllData(); 

        if (overlay) overlay.classList.remove('show');
        if (modal) modal.classList.remove('show');
        try { refreshStatusBar(); } catch(e) {}

        showToast('导入完成：成功 ' + ok + ' 条，失败 ' + fail + ' 条');
    } catch (e) {
        var overlay2 = document.getElementById('importOverlay');
        var modal2 = document.getElementById('importProgressModal');
        if (overlay2) overlay2.classList.remove('show');
        if (modal2) modal2.classList.remove('show');
        try { refreshStatusBar(); } catch(e2) {}
        showToast('导入失败：' + e.message);
    }
}

document.getElementById('profileExport')?.addEventListener('click', openExportBillsPage);
document.getElementById('profileImport')?.addEventListener('click', function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
        if (input.files && input.files[0]) importBillsFromCSV(input.files[0]);
    };
    input.click();
});





function isShown(id) {
    const el = document.getElementById(id);
    return el && el.classList.contains('show');
}



function closeTopOverlay() {
    const els = document.querySelectorAll('[id$="Overlay"].show, .sheet.show');
    let top = null;
    let topZ = -Infinity;
    for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el.id === 'loadingOverlay') continue; 
        const z = parseInt(getComputedStyle(el).zIndex, 10);
        if (z > topZ) { topZ = z; top = el; }
    }
    if (!top) return false;
    
    const fn = top.getAttribute && top.getAttribute('data-back-close');
    if (fn && typeof window[fn] === 'function') { window[fn](); return true; }
    
    
    if (top.id && top.id.endsWith('Overlay')) {
        const base = top.id.slice(0, -'Overlay'.length); 
        const modalEl = document.getElementById(base + 'Modal');
        const sheetEl = document.getElementById(base + 'Sheet');
        if (modalEl || sheetEl) {
            top.classList.remove('show');
            if (modalEl) modalEl.classList.remove('show');
            if (sheetEl) sheetEl.classList.remove('show');
            document.body.style.overflow = '';
            return true;
        }
    }
    
    top.classList.remove('show');
    
    if (top.id === 'budgetModalOverlay' || top.id === 'profileEditOverlay') {
        setTimeout(function () { if (!top.classList.contains('show')) top.remove(); }, 320);
    }
    return true;
}




function parseColor(str) {
    if (!str) return null;
    str = String(str).trim();
    if (str === 'transparent' || str === 'rgba(0, 0, 0, 0)' || str === 'rgba(0,0,0,0)') return null;
    if (str.charAt(0) === '#') {
        let h = str.slice(1);
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        if (h.length !== 6) return null;
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (m) {
        const p = m[1].split(',').map(function (s) { return parseFloat(s); });
        if (p.length >= 3) return [p[0], p[1], p[2]];
    }
    return null;
}
function rgbToHex(c) {
    return '#' + c.map(function (v) {
        const x = Math.max(0, Math.min(255, Math.round(v))).toString(16);
        return x.length === 1 ? '0' + x : x;
    }).join('').toUpperCase();
}

function mixOver(bg, fg, alpha) {
    return [
        fg[0] * alpha + bg[0] * (1 - alpha),
        fg[1] * alpha + bg[1] * (1 - alpha),
        fg[2] * alpha + bg[2] * (1 - alpha)
    ];
}

function relLuminance(c) {
    const a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function pickStyle(c) { return relLuminance(c) > 0.5 ? 'dark' : 'light'; }
function cssVarRGB(name, fallback) {
    const c = parseColor(getComputedStyle(document.documentElement).getPropertyValue(name));
    return c || fallback;
}


const STATUSBAR_MAP = {
    
};


function getActivePage() {
    try {
        if (typeof currentPage !== 'undefined' && currentPage) {
            const el = document.getElementById('page-' + currentPage);
            if (el && getComputedStyle(el).display !== 'none') return el;
        }
    } catch (e) {  }
    const act = document.querySelectorAll('.page.active');
    for (let i = 0; i < act.length; i++) {
        if (getComputedStyle(act[i]).display !== 'none') return act[i];
    }
    return null;
}


function getPageTopColor(page) {
    const bgMain = cssVarRGB('--bg-main', [245, 245, 245]);
    const primary = cssVarRGB('--primary', [79, 155, 250]);

    
    const ph = page.querySelector('.page-header');
    if (ph) {
        try {
            const bs = getComputedStyle(ph, '::before');
            const bc = parseColor(bs.backgroundColor);
            const op = parseFloat(bs.opacity);
            if (bc && !isNaN(op)) return mixOver(bgMain, bc, op);
        } catch (e) {  }
        return mixOver(bgMain, primary, 0.2); 
    }

    
    const headers = page.querySelectorAll('.header-box, .stats-header-box, .search-header, .cat-detail-header, .clear-bills-header, .pet-topbar, .annual-header, .profile-card, [class$="-header"]');
    for (let i = 0; i < headers.length; i++) {
        const c = parseColor(getComputedStyle(headers[i]).backgroundColor);
        if (c) return c;
    }

    
    return bgMain;
}


function setStatusBarSafeTop() {
    try {
        const h = plus.navigator.getStatusbarHeight && plus.navigator.getStatusbarHeight();
        if (h && document.documentElement) {
            document.documentElement.style.setProperty('--safe-top', h + 'px');
        }
    } catch (e) {  }
}

function refreshStatusBar() {
    if (!(window.plus && plus.navigator)) return;
    try {
        
        let top = null, topZ = -Infinity;
        const els = document.querySelectorAll('[id$="Overlay"].show, .sheet.show, .add-modal-overlay.show, .pet-setup-overlay.active');
        for (let i = 0; i < els.length; i++) {
            const el = els[i];
            if (el.id === 'loadingOverlay') continue;
            const z = parseInt(getComputedStyle(el).zIndex, 10);
            if (z > topZ) { topZ = z; top = el; }
        }
        let bg;
        if (top) {
            
            const cfg = STATUSBAR_MAP[top.id];
            if (cfg) {
                plus.navigator.setStatusBarBackground(cfg.bg);
                plus.navigator.setStatusBarStyle(cfg.style);
                setStatusBarSafeTop();
                return;
            }
            
            if (top.classList && top.classList.contains('pet-setup-overlay')) {
                plus.navigator.setStatusBarBackground('#000000');
                plus.navigator.setStatusBarStyle('light');
                setStatusBarSafeTop();
                return;
            }
            bg = cssVarRGB('--bg-main', [245, 245, 245]);
        } else {
            
            
            const petPage = document.getElementById('page-pet');
            let page = null;
            if (petPage && petPage.classList.contains('active') && getComputedStyle(petPage).display !== 'none') {
                page = petPage;
            } else {
                page = getActivePage();
            }
            if (page) {
                if (page.id === 'page-pet') {
                    
                    
                    bg = cssVarRGB('--primary-bg', [238, 244, 255]);
                } else if (
                    page.id === 'page-home' ||
                    page.id === 'page-bills' ||
                    page.id === 'page-stats'
                ) {
                    
                    
                    
                    bg = mixOver(
                        cssVarRGB('--bg-main', [245, 245, 245]),
                        cssVarRGB('--primary', [79, 155, 250]),
                        0.2
                    );
                } else if (page.id === 'page-profile') {
                    
                    bg = cssVarRGB('--bg-main', [245, 245, 245]);
                } else if (page.id === 'page-webview') {
                    
                    bg = cssVarRGB('--bg-main', [245, 245, 245]);
                } else {
                    
                    bg = getPageTopColor(page);
                }
            } else {
                bg = cssVarRGB('--bg-main', [245, 245, 245]);
            }
        }
        const hex = rgbToHex(bg);
        plus.navigator.setStatusBarBackground(hex);
        plus.navigator.setStatusBarStyle(pickStyle(bg));
        setStatusBarSafeTop();
        
        
        if (document.documentElement) {
            document.documentElement.style.setProperty('--app-top-bg', hex);
        }
    } catch (e) {  }
}


let __sbScheduled = false;
function scheduleStatusBarRefresh() {
    if (__sbScheduled) return;
    __sbScheduled = true;
    setTimeout(function () { __sbScheduled = false; try { refreshStatusBar(); } catch(e) {} }, 0);
}
function startStatusBarObserver() {
    if (!('MutationObserver' in window)) return;
    const obs = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
            const t = mutations[i].target;
            if (!t || t.nodeType !== 1) continue;
            if (t.id && t.id.indexOf('Overlay') > -1) { scheduleStatusBarRefresh(); return; }
            if (t.classList && (t.classList.contains('sheet') || t.classList.contains('page') || t.classList.contains('pet-setup-overlay') || t.classList.contains('add-modal-overlay'))) {
                scheduleStatusBarRefresh(); return;
            }
        }
    });
    obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
}



const PAGE_CLOSE_MAP = {
    'detail': goBackFromDetail,
    'budget': closeBudgetPage,
    'account-security': closeAccountSecurityPage,
    'category-detail': closeCategoryDetail,
    'partner-profile': closePartnerProfilePage,
    'profile-info': closeProfileInfoPage,
    'change-password': closeChangePasswordPage,
    'forgot-password': closeForgotPasswordPage,
    'delete-account': closeDeleteAccountPage,
    'unbind-account': closeUnbindAccountPage,
    'match': closeMatchPage,
    'scheduled': closeScheduledPage,
    'scheduled-edit': closeScheduledEditPage,
    'search': closeSearchPage,
    'feedback': closeFeedbackPage,
    'bug-feedback': closeBugFeedbackPage,
    'annual': closeAnnualPage,
    'about': closeAboutPage,
    'changelog': closeChangelogPage,
    'clear-bills': closeClearBillsPage,
    'export-bills': closeExportBillsPage,
    'webview': closeWebViewPage
};

function handleHardwareBack() {
    
    if (isShown('loadingOverlay')) return;

    
    if (isShown('importOverlay')) return;

    
    if (document.querySelector('.bill-item-wrapper.swiped')) {
        if (typeof closeAllSwiped === 'function') closeAllSwiped();
        try { refreshStatusBar(); } catch(e) {}
        return;
    }

    
    if (isShown('deleteModal')) { hideDeleteModal(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('noteModal')) { closeNoteModal(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('paymentSheet')) { closePaymentSheet(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('dateModal')) { closeDatePicker(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('weekModal')) { closeWeekPicker(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('monthModal')) { closeMonthPicker(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('yearModal')) { closeYearPicker(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('catAddOverlay')) { closeCatAddModal(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('catEditOverlay')) { closeCatEditModal(); try { refreshStatusBar(); } catch(e) {} return; }
    if (isShown('settingsOverlay')) { closeSettings(); try { refreshStatusBar(); } catch(e) {} return; }
    if (document.getElementById('addModalOverlay')?.classList.contains('show')) { closeAddModal(); try { refreshStatusBar(); } catch(e) {} return; }
    if (closeTopOverlay()) { try { refreshStatusBar(); } catch(e) {} return; }

    
    if (window.PetSystem && typeof window.PetSystem.handleBack === 'function') {
        if (window.PetSystem.handleBack()) { try { refreshStatusBar(); } catch(e) {} return; }
    }

    
    const petPageEl = document.getElementById('page-pet');
    if (petPageEl && petPageEl.classList.contains('active') && getComputedStyle(petPageEl).display !== 'none') {
        if (window.PetSystem && typeof window.PetSystem.closePage === 'function') {
            window.PetSystem.closePage();
            try { refreshStatusBar(); } catch(e) {}
        }
        return;
    }

    
    const pageClose = PAGE_CLOSE_MAP[currentPage];
    if (typeof pageClose === 'function') { pageClose(); try { refreshStatusBar(); } catch(e) {} return; }

    
    const now = Date.now();
    if (!window.__lastBackExit || now - window.__lastBackExit > 2000) {
        window.__lastBackExit = now;
        showToast('再按一次退出应用');
        return;
    }
    exitApp();
}

function exitApp() {
    try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.exitApp();
        } else if (window.cordova && navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else if (window.Android && window.Android.exitApp) {
            window.Android.exitApp();           
        } else if (window.plus && plus.runtime && plus.runtime.quit) {
            plus.runtime.quit();                
        } else {
            window.close();                     
        }
    } catch (e) {  }
}

function registerBackHandler() {
    window.handleHardwareBack = handleHardwareBack;
    
    
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', function () { handleHardwareBack(); });
    }
    
    
    if (window.cordova) {
        document.addEventListener('backbutton', function (e) { e.preventDefault(); handleHardwareBack(); }, false);
    }
    
    
    document.addEventListener('plusready', function () {
        
        try {
            var webview = plus.webview.currentWebview();
            if (webview) {
                
                webview.setStyle({
                    background: '#F5F5F5',
                    softInputMode: 'adjustPan'
                });
            }
        } catch (e) {
            console.warn('设置 WebView 背景色失败:', e);
        }

        
        if (window.plus && plus.key) {
            plus.key.addEventListener('backbutton', function () { handleHardwareBack(); });
        }

        
        try { refreshStatusBar(); } catch(e) {}
        startStatusBarObserver();

        
        try {
            var currentWebview = plus.webview.currentWebview();
            if (currentWebview) {
                currentWebview.addEventListener('show', refreshStatusBar);
            }
        } catch (e) {  }

        
        try { initAppVersion(); } catch(e) {}

        
        if (_splashPending) { closeAppSplash(); }
    }, false);

    
    if (window.plus && plus.key) {
        plus.key.addEventListener('backbutton', function () { handleHardwareBack(); });
        
        try {
            var webview = plus.webview.currentWebview();
            if (webview) {
                webview.setStyle({
                    background: '#F5F5F5',
                    softInputMode: 'adjustPan'
                });
            }
        } catch (e) {  }
        
        if (_splashPending) { closeAppSplash(); }
    }

    
    try { refreshStatusBar(); } catch(e) {}
    startStatusBarObserver();

    return true;
}

if (!registerBackHandler()) {
    window.addEventListener('load', function () {
        if (!registerBackHandler()) setTimeout(registerBackHandler, 800);
    });
}


document.getElementById('profileClear')?.addEventListener('click', openClearBillsPage);


let clearBillsState = {
    dateStart: '',
    dateEnd: '',
    belong: '所有',
    editingField: null
};


function openClearBillsPage() {
    previousPage = currentPage;

    
    clearBillsState = { dateStart: '', dateEnd: '', belong: '所有', editingField: null };
    const startValEl = document.getElementById('clearBillsStartValue');
    const endValEl = document.getElementById('clearBillsEndValue');
    if (startValEl) {
        startValEl.textContent = '请选择开始时间';
        startValEl.classList.add('placeholder');
    }
    if (endValEl) {
        endValEl.textContent = '请选择结束时间';
        endValEl.classList.add('placeholder');
    }
    document.querySelectorAll('#clearBillsBelongGroup .clear-bills-belong-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.belong === '所有');
    });
    updateClearBillsBtn();

    const pageEl = document.getElementById('page-clear-bills');
    if (!pageEl) return;

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch(e) {}
    });

    currentPage = 'clear-bills';
}


function closeClearBillsPage() {
    
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-clear-bills');
    pageEl.classList.remove('active');
    setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') {
        renderStatsPage();
        updateStatsDateLabel();
    } else if (target === 'profile') renderProfile();
}


function updateClearBillsBtn() {
    const btn = document.getElementById('clearBillsSubmitBtn');
    if (!btn) return;
    const ready = clearBillsState.dateStart && clearBillsState.dateEnd;
    btn.classList.toggle('active', !!ready);
    btn.disabled = !ready;
}


function openClearBillsDatePicker(field) {
    const overlay = document.getElementById('dateOverlay');
    const modal = document.getElementById('dateModal');
    const confirmBtn = document.getElementById('dateBtnConfirm');
    const todayBtn = document.getElementById('dateBtnToday');

    if (!overlay || !modal) {
        showToast('日期选择器加载失败，请重试');
        return;
    }

    clearBillsState.editingField = field;

    
    const currentVal = field === 'start' ? clearBillsState.dateStart : clearBillsState.dateEnd;
    let initialDate = new Date();
    if (currentVal) {
        const parts = currentVal.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            if (!isNaN(d.getTime())) initialDate = d;
        }
    }
    tempSelectedDate = new Date(initialDate);
    viewDate = new Date(initialDate);

    
    const originalConfirm = confirmBtn.onclick;
    const originalToday = todayBtn ? todayBtn.onclick : null;
    const originalClose = document.getElementById('dateModalClose').onclick;

    function restoreDateCallbacks() {
        confirmBtn.onclick = originalConfirm;
        if (todayBtn) todayBtn.onclick = originalToday;
        const closeBtn = document.getElementById('dateModalClose');
        if (closeBtn) closeBtn.onclick = originalClose;
        clearBillsState.editingField = null;
    }

    
    confirmBtn.onclick = function() {
        const wy = document.getElementById('wheelYear');
        const wm = document.getElementById('wheelMonth');
        const wd = document.getElementById('wheelDay');
        let selDate;
        if (wy && wm && wd) {
            const yIdx = Math.round(wy.scrollTop / WHEEL_ITEM_HEIGHT);
            const mIdx = Math.round(wm.scrollTop / WHEEL_ITEM_HEIGHT);
            const dIdx = Math.round(wd.scrollTop / WHEEL_ITEM_HEIGHT);
            const yItems = wy.querySelectorAll('.wheel-item');
            const mItems = wm.querySelectorAll('.wheel-item');
            const dItems = wd.querySelectorAll('.wheel-item');
            const yv = yItems[yIdx]?.dataset.value;
            const mv = mItems[mIdx]?.dataset.value;
            const dv = dItems[dIdx]?.dataset.value;
            if (yv && mv && dv) {
                selDate = new Date(parseInt(yv, 10), parseInt(mv, 10) - 1, parseInt(dv, 10));
                tempSelectedDate = new Date(selDate);
            }
        }
        if (!selDate) selDate = new Date(tempSelectedDate);
        const dateStr = selDate.getFullYear() + '-' +
            String(selDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(selDate.getDate()).padStart(2, '0');

        if (clearBillsState.editingField === 'start') {
            clearBillsState.dateStart = dateStr;
        } else {
            clearBillsState.dateEnd = dateStr;
        }
        updateClearBillsDateDisplay(clearBillsState.editingField);

        window.__skipConfirmDateUpdate = true;
        closeDatePicker();
        setTimeout(() => {
            window.__skipConfirmDateUpdate = false;
        }, 0);

        restoreDateCallbacks();
        updateClearBillsBtn();
    };

    if (todayBtn) {
        todayBtn.onclick = function() {
            const today = new Date();
            tempSelectedDate = new Date(today);
            viewDate = new Date(today);
            renderDatePicker();
        };
    }

    const closeBtn = document.getElementById('dateModalClose');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closeDatePicker();
            restoreDateCallbacks();
        };
    }

    renderDatePicker();
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    });
}


function updateClearBillsDateDisplay(field) {
    const el = document.getElementById(field === 'start' ? 'clearBillsStartValue' : 'clearBillsEndValue');
    if (!el) return;
    const val = field === 'start' ? clearBillsState.dateStart : clearBillsState.dateEnd;
    if (val) {
        el.textContent = val;
        el.classList.remove('placeholder');
    } else {
        el.textContent = field === 'start' ? '请选择开始时间' : '请选择结束时间';
        el.classList.add('placeholder');
    }
}


async function executeClearBills() {
    if (!clearBillsState.dateStart || !clearBillsState.dateEnd) return;

    
    if (clearBillsState.dateStart > clearBillsState.dateEnd) {
        showToast('开始时间不能晚于结束时间');
        return;
    }

    const desc = '清除所选账单数据后，将无法再恢复，请谨慎操作';
    showConfirmDialog('是否确认清除账单数据', desc, async function() {
        const btn = document.getElementById('clearBillsSubmitBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '清除中...';
        }
        try {
            const data = await apiCall('/bills/clear', 'POST', {
                dateStart: clearBillsState.dateStart,
                dateEnd: clearBillsState.dateEnd,
                belong: clearBillsState.belong
            });
            allBills = data.bills || [];
            const count = data.deleted || 0;
            hideDeleteModal();
            showToast(count > 0 ? `已清除 ${count} 笔账单` : '该范围内没有账单');
            
            renderHome();
            updateBudgetDisplay();
            renderBills();
            if (currentPage === 'stats') {
                renderStatsPage();
                updateStatsDateLabel();
            }
            renderProfile();
            
            setTimeout(() => {
                closeClearBillsPage();
            }, 600);
        } catch (err) {
            showToast('清除失败: ' + err.message);
        } finally {
            if (btn) {
                btn.textContent = '开始清除';
                updateClearBillsBtn();
            }
        }
    }, '确认');
}


document.getElementById('clearBillsBackBtn')?.addEventListener('click', closeClearBillsPage);
document.getElementById('clearBillsStartRow')?.addEventListener('click', function() {
    openClearBillsDatePicker('start');
});
document.getElementById('clearBillsEndRow')?.addEventListener('click', function() {
    openClearBillsDatePicker('end');
});
document.getElementById('clearBillsBelongGroup')?.addEventListener('click', function(e) {
    const btn = e.target.closest('.clear-bills-belong-btn');
    if (!btn) return;
    document.querySelectorAll('#clearBillsBelongGroup .clear-bills-belong-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clearBillsState.belong = btn.dataset.belong;
    updateClearBillsBtn();
});
document.getElementById('clearBillsSubmitBtn')?.addEventListener('click', function() {
    if (this.disabled) return;
    executeClearBills();
});


let exportBillsState = {
    dateStart: '',
    dateEnd: ''
};


function addMonthsSafe(date, delta) {
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + delta);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
}

function formatDateYMD(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}


function openExportBillsPage() {
    previousPage = currentPage;

    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = addMonthsSafe(today, -1);
    exportBillsState.dateStart = formatDateYMD(start);
    exportBillsState.dateEnd = formatDateYMD(today);
    updateExportBillsDateDisplay('start');
    updateExportBillsDateDisplay('end');
    updateExportBillsBtn();

    const pageEl = document.getElementById('page-export-bills');
    if (!pageEl) return;

    pageEl.style.display = 'flex';
    requestAnimationFrame(() => {
        pageEl.classList.add('active');
        try { refreshStatusBar(); } catch (e) {}
    });

    currentPage = 'export-bills';
}


function closeExportBillsPage() {
    const target = previousPage || 'profile';
    const pageEl = document.getElementById('page-export-bills');
    if (pageEl) {
        pageEl.classList.remove('active');
        setTimeout(() => { pageEl.style.display = 'none'; }, 350);
    }
    document.querySelectorAll('#main-app .page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    const targetEl = document.getElementById('page-' + target);
    if (targetEl) {
        targetEl.style.display = '';
        targetEl.classList.add('active');
    }
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === target);
        item.style.color = '';
    });
    currentPage = target;
    if (target !== 'budget' && target !== 'stats') stopBudgetRealtimeSync();
    if (target === 'home') renderHome();
    else if (target === 'bills') renderBills();
    else if (target === 'stats') { enterStatsPage(); }
    else if (target === 'profile') renderProfile();
}


function updateExportBillsBtn() {
    const btn = document.getElementById('exportBillsSubmitBtn');
    if (!btn) return;
    const ready = exportBillsState.dateStart && exportBillsState.dateEnd;
    btn.classList.toggle('active', !!ready);
    btn.disabled = !ready;
}


function openExportBillsDatePicker(field) {
    const overlay = document.getElementById('dateOverlay');
    const modal = document.getElementById('dateModal');
    const confirmBtn = document.getElementById('dateBtnConfirm');
    const todayBtn = document.getElementById('dateBtnToday');

    if (!overlay || !modal) {
        showToast('日期选择器加载失败，请重试');
        return;
    }

    
    const currentVal = field === 'start' ? exportBillsState.dateStart : exportBillsState.dateEnd;
    let initialDate = new Date();
    if (currentVal) {
        const parts = currentVal.split('-');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            if (!isNaN(d.getTime())) initialDate = d;
        }
    }
    tempSelectedDate = new Date(initialDate);
    viewDate = new Date(initialDate);

    
    const originalConfirm = confirmBtn.onclick;
    const originalToday = todayBtn ? todayBtn.onclick : null;
    const originalClose = document.getElementById('dateModalClose').onclick;

    function restoreDateCallbacks() {
        confirmBtn.onclick = originalConfirm;
        if (todayBtn) todayBtn.onclick = originalToday;
        const closeBtn = document.getElementById('dateModalClose');
        if (closeBtn) closeBtn.onclick = originalClose;
    }

    
    confirmBtn.onclick = function () {
        const wy = document.getElementById('wheelYear');
        const wm = document.getElementById('wheelMonth');
        const wd = document.getElementById('wheelDay');
        let selDate;
        if (wy && wm && wd) {
            const yIdx = Math.round(wy.scrollTop / WHEEL_ITEM_HEIGHT);
            const mIdx = Math.round(wm.scrollTop / WHEEL_ITEM_HEIGHT);
            const dIdx = Math.round(wd.scrollTop / WHEEL_ITEM_HEIGHT);
            const yItems = wy.querySelectorAll('.wheel-item');
            const mItems = wm.querySelectorAll('.wheel-item');
            const dItems = wd.querySelectorAll('.wheel-item');
            const yv = yItems[yIdx]?.dataset.value;
            const mv = mItems[mIdx]?.dataset.value;
            const dv = dItems[dIdx]?.dataset.value;
            if (yv && mv && dv) {
                selDate = new Date(parseInt(yv, 10), parseInt(mv, 10) - 1, parseInt(dv, 10));
                tempSelectedDate = new Date(selDate);
            }
        }
        if (!selDate) selDate = new Date(tempSelectedDate);
        const dateStr = selDate.getFullYear() + '-' +
            String(selDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(selDate.getDate()).padStart(2, '0');

        if (field === 'start') exportBillsState.dateStart = dateStr;
        else exportBillsState.dateEnd = dateStr;
        updateExportBillsDateDisplay(field);

        window.__skipConfirmDateUpdate = true;
        closeDatePicker();
        setTimeout(() => { window.__skipConfirmDateUpdate = false; }, 0);

        restoreDateCallbacks();
        updateExportBillsBtn();
    };

    if (todayBtn) {
        todayBtn.onclick = function () {
            const today = new Date();
            tempSelectedDate = new Date(today);
            viewDate = new Date(today);
            renderDatePicker();
        };
    }

    const closeBtn = document.getElementById('dateModalClose');
    if (closeBtn) {
        closeBtn.onclick = function () {
            closeDatePicker();
            restoreDateCallbacks();
        };
    }

    renderDatePicker();
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
    });
}


function updateExportBillsDateDisplay(field) {
    const el = document.getElementById(field === 'start' ? 'exportBillsStartValue' : 'exportBillsEndValue');
    if (!el) return;
    const val = field === 'start' ? exportBillsState.dateStart : exportBillsState.dateEnd;
    if (val) {
        var parts = val.split('-');
        el.textContent = parseInt(parts[0]) + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
        el.classList.remove('placeholder');
    } else {
        el.textContent = field === 'start' ? '请选择开始时间' : '请选择结束时间';
        el.classList.add('placeholder');
    }
}


async function executeExportBills() {
    if (!exportBillsState.dateStart || !exportBillsState.dateEnd) return;
    if (exportBillsState.dateStart > exportBillsState.dateEnd) {
        showToast('开始时间不能晚于结束时间');
        return;
    }
    if (!allBills || !allBills.length) {
        showToast('当前没有可导出的账单');
        return;
    }
    const start = exportBillsState.dateStart;
    const end = exportBillsState.dateEnd;
    const filtered = allBills.filter(b => b.date && b.date >= start && b.date <= end);
    if (!filtered.length) {
        showToast('所选时间范围内没有账单');
        return;
    }
    const btn = document.getElementById('exportBillsSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = '导出中...'; }
    try {
        const ok = await saveBillsCSV(filtered);
        if (!ok) showToast('所选时间范围内没有账单');
    } catch (e) {
        showToast('导出失败：' + e.message);
    } finally {
        if (btn) { btn.textContent = '导出账单'; updateExportBillsBtn(); }
    }
}


document.getElementById('exportBillsBackBtn')?.addEventListener('click', closeExportBillsPage);
document.getElementById('exportBillsStartRow')?.addEventListener('click', function () {
    openExportBillsDatePicker('start');
});
document.getElementById('exportBillsEndRow')?.addEventListener('click', function () {
    openExportBillsDatePicker('end');
});
document.getElementById('exportBillsSubmitBtn')?.addEventListener('click', function () {
    if (this.disabled) return;
    executeExportBills();
});


const regEmailInput = document.getElementById('regEmail');
if (regEmailInput) {
    let emailCheckTimer = null;
    regEmailInput.addEventListener('input', function() {
        clearTimeout(emailCheckTimer);
        const email = this.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length < 5) {
            const errorEl = document.getElementById('registerError');
            errorEl.textContent = '';
            errorEl.style.display = 'none';
            return;
        }
        
        emailCheckTimer = setTimeout(async () => {
            try {
                const exists = await checkEmailExists(email);
                const errorEl = document.getElementById('registerError');
                if (exists) {
                    errorEl.textContent = '该邮箱已被注册,请直接登录';
                    errorEl.style.display = 'block';
                    errorEl.style.color = 'var(--expense)';
                } else {
                    errorEl.textContent = '该邮箱可用';
                    errorEl.style.display = 'block';
                    errorEl.style.color = 'var(--income)';
                }
            } catch (err) {
                
            }
        }, 500);
    });
}

const regSendBtn = document.getElementById('regSendCodeBtn');
if (regSendBtn) {
    regSendBtn.addEventListener('click', async function() {
        const email = $('#regEmail').value.trim();
        if (!email) {
            showToast('请输入邮箱地址');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('请输入有效的邮箱地址');
            return;
        }
        
        
        try {
            const exists = await checkEmailExists(email);
            if (exists) {
                showToast('该邮箱已被注册，请直接登录');
                return;
            }
        } catch (err) {
            showToast('检查邮箱失败，请重试');
            return;
        }
        
        try {
            await sendVerificationCode(email, 'register');
            showToast('验证码已发送到您的邮箱');
            startCountdown(this, 60);
        } catch (err) {
            showToast(err.message || '发送失败，请重试');
        }
    });
}

let emailCheckTimer = null;
$('#regEmail')?.addEventListener('input', function() {
    clearTimeout(emailCheckTimer);
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return;
    }
    
    emailCheckTimer = setTimeout(async () => {
        try {
            const exists = await checkEmailExists(email);
            const errorEl = document.getElementById('registerError');
            if (exists) {
                errorEl.textContent = '该邮箱已被注册，请直接登录';
                errorEl.style.display = 'block';
                errorEl.style.color = 'var(--expense)';
            } else {
                errorEl.textContent = '该邮箱可用';
                errorEl.style.display = 'block';
                errorEl.style.color = 'var(--income)';
            }
        } catch (err) {
            
        }
    }, 500);
});
}

    init();

    window.__app = { allBills, currentUser, token, loadAllData, closeAllSwiped };

})();