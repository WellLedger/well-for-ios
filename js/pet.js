(function() {
    'use strict';

    const API_BASE = 'https://account.solitudenook.top/api';

    
    const WHEEL_ITEM_HEIGHT = 44;

    
    let petState = {
        hasPet: false,
        pet: null,
        adopter: null,
        reason: null,
        coupleId: null,
        myDailyStats: { bill_count: 0, feed_count: 0, comment_count: 0, sign_done: false },
        signStatus: null
    };

    let petRecords = [];
    let selectedGender = 'secret';
    let tempBirthday = null; 

    
    const PET_VARIANTS = ['default', 'orange', 'cowcat', 'tabby', 'blue', 'ice', 'milk'];
    const PET_VARIANT_NAMES = {
        'default': '灰白英短',
        'orange': '橘猫',
        'cowcat': '奶牛猫',
        'tabby': '三花猫',
        'blue': '银渐层',
        'ice': '冰雪英短',
        'milk': '牛奶绒绒'
    };
    const PET_VARIANT_ACCENT = {
        'default': '#A6A6A6', 'orange': '#EAAC73', 'cowcat': '#000000', 'tabby': '#666666',
        'blue': '#626F78', 'ice': '#848A9E', 'milk': '#E9AC76'
    };
    const PET_SKIN_COST = 200; 

    
    const petEntryCard = document.getElementById('petEntryCard');
    const petName = document.getElementById('petName');
    const petLevel = document.getElementById('petLevel');
    const petHungerFill = document.getElementById('petHungerFill');
    const petMoodFill = document.getElementById('petMoodFill');

    
    const petTopbar = document.getElementById('petTopbar');
    const petTopbarScore = document.getElementById('petTopbarScore');
    const petTopbarLevel = document.getElementById('petTopbarLevel');
    const petMenuBtn = document.getElementById('petMenuBtn');

    
    async function petApi(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const options = { method, headers };
        if (data) options.body = JSON.stringify(data);

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || '请求失败');
        return result;
    }

    
    async function loadPetStatus() {
        try {
            const data = await petApi('/pet/status');
            petState.hasPet = data.hasPet;
            petState.reason = data.reason || null;
            petState.coupleId = data.couple_id || null;
            if (data.hasPet) {
                petState.pet = data.pet;
                
                if (petState.pet) {
                    if (!petState.pet.variant) petState.pet.variant = 'default';
                    if (!Array.isArray(petState.pet.unlocked_variants) || petState.pet.unlocked_variants.length === 0) {
                        petState.pet.unlocked_variants = [petState.pet.variant || 'default'];
                    }
                    // 与本地缓存取并集，确保“已确认解锁但后端未落库”的形象刷新后不丢
                    const cached = loadUnlockedCache();
                    if (cached.length) {
                        const set = {};
                        petState.pet.unlocked_variants.concat(cached).forEach(function (v) { set[v] = 1; });
                        petState.pet.unlocked_variants = Object.keys(set);
                    }
                    cacheUnlockedVariants();
                }
                petState.adopter = data.adopter;
                petState.myDailyStats = data.myDailyStats || { bill_count: 0, feed_count: 0, comment_count: 0, sign_done: false };
                petState.signStatus = data.signStatus || null;
                
                if (data.pet && data.pet.variant) {
                    localStorage.setItem('petCatVariant', data.pet.variant);
                }
                updateEntryCard();
                checkAutoFeed();
                showFloatingPet();
            } else if (data.reason === 'not_adopted') {
                petState.pet = null;
                petState.adopter = null;
                petState.myDailyStats = { bill_count: 0, feed_count: 0, comment_count: 0, sign_done: false };
                petState.signStatus = null;
                updateEntryCard();
            } else {
                resetEntryCard();
            }
            return data;
        } catch (error) {
            console.error('加载宠物状态失败:', error);
            resetEntryCard();
            return null;
        }
    }

    
    function updateEntryCard() {
        if (!petEntryCard) return;

        if (petState.reason === 'not_matched' || (!petState.hasPet && !petState.reason)) {
            resetEntryCard();
            return;
        }

        petEntryCard.classList.remove('hidden');
        petEntryCard.classList.add('clickable');

        const statsEl = document.getElementById('petStats');
        const welcomeEl = document.getElementById('petEntryWelcome');

        if (petState.hasPet && petState.pet) {
            petName.textContent = petState.pet.name || '未命名';
            petLevel.textContent = `Lv.${petState.pet.level}`;
            petLevel.style.display = '';
            if (statsEl) statsEl.style.display = '';
            if (welcomeEl) welcomeEl.style.display = 'none';
            updateEntryStats();
            
            injectEntryCardCat();
        } else {
            petName.textContent = '点击领养我们的宠物';
            petLevel.style.display = 'none';
            if (statsEl) statsEl.style.display = 'none';
            if (welcomeEl) welcomeEl.style.display = '';
            
            injectEntryCardCat();
        }
    }

    function updateEntryStats() {
        if (!petState.pet) return;
        const hunger = Math.round(petState.pet.hunger || 0);
        const mood = Math.round(petState.pet.mood || 0);
        if (petHungerFill) petHungerFill.style.width = `${hunger}%`;
        if (petMoodFill) petMoodFill.style.width = `${mood}%`;
    }

    
    function updateStatusBars() {
        if (!petState.pet) return;
        const hunger = Math.round(petState.pet.hunger || 0);
        const mood = Math.round(petState.pet.mood || 0);
        const hungerFill = document.querySelector('.pet-status-fill.hunger');
        const moodFill = document.querySelector('.pet-status-fill.mood');
        if (hungerFill) hungerFill.style.width = `${hunger}%`;
        if (moodFill) moodFill.style.width = `${mood}%`;
    }

    function resetEntryCard() {
        if (petEntryCard) {
            petEntryCard.classList.add('hidden');
            petEntryCard.classList.remove('clickable');
        }
        petState.hasPet = false;
        petState.pet = null;
        petState.adopter = null;
        petState.reason = null;
        petState.myDailyStats = { bill_count: 0, feed_count: 0, comment_count: 0, sign_done: false };
        petState.signStatus = null;
    }

    
    function updateTopbar() {
        if (!petTopbar) return;
        const hasPet = petState.hasPet && petState.pet;
        if (hasPet) {
            petTopbar.classList.remove('no-pet');
            const pts = petState.pet.points != null ? petState.pet.points : (petState.pet.total_score || 0);
            if (petTopbarScore) petTopbarScore.innerHTML = `<img src="img/integration.svg" alt="" class="pet-topbar-icon"> ${pts}`;
            const lvText = document.getElementById('petTopbarLevelText');
            if (lvText) lvText.innerHTML = `Lv.${petState.pet.level || 0}`;
            
            const lp = getLevelProgress();
            const fill = document.getElementById('petTopbarLevelFill');
            if (fill) fill.style.width = `${lp.maxed ? 100 : lp.progress}%`;
        } else {
            petTopbar.classList.add('no-pet');
        }
    }

    
    function showPetInfoPopup() {
        const pet = petState.pet;
        if (!pet) return;

        const genderMap = {
            male: '公',
            female: '母',
            secret: '未知'
        };
        const genderText = pet.gender ? (genderMap[pet.gender] || '未设置') : '未设置';
        const birthdayText = pet.birthday || '未设置';
        const adopterText = petState.adopter ? (petState.adopter.nickname || petState.adopter.username || '我') : '我';
        const needSetup = !pet.birthday || !pet.gender;

        const overlay = document.createElement('div');
        overlay.className = 'pet-info-popup-overlay active';
        overlay.innerHTML = `
            <div class="pet-info-popup">
                <div class="pet-info-popup-header">
                    <div class="pet-info-popup-title"><i class="ri-footprint-fill"></i> ${escapeHtml(pet.name)}</div>
                    <button class="pet-info-popup-close" id="petInfoPopupClose"><i class="ri-close-line"></i></button>
                </div>
                <div class="pet-info-popup-list">
                    <div class="pet-info-row">
                        <div class="pet-info-row-label"><i class="ri-cake-2-line"></i> 生日</div>
                        <div class="pet-info-row-value ${pet.birthday ? '' : 'highlight'}">${escapeHtml(birthdayText)}</div>
                    </div>
                    <div class="pet-info-row">
                        <div class="pet-info-row-label"><i class="ri-genderless-line"></i> 性别</div>
                        <div class="pet-info-row-value ${pet.gender ? '' : 'highlight'}">${escapeHtml(genderText)}</div>
                    </div>
                    <div class="pet-info-row">
                        <div class="pet-info-row-label"><i class="ri-user-line"></i> 领养人</div>
                        <div class="pet-info-row-value">${escapeHtml(adopterText)}</div>
                    </div>
                </div>
                <div class="pet-info-popup-actions">
                    <button class="pet-info-popup-btn close" id="petInfoPopupCloseBtn">关闭</button>
                    ${needSetup ? `<button class="pet-info-popup-btn setup" id="petInfoPopupSetupBtn"><i class="ri-edit-line"></i> 完善信息</button>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closePopup = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        };

        overlay.querySelector('#petInfoPopupClose').onclick = closePopup;
        overlay.querySelector('#petInfoPopupCloseBtn').onclick = closePopup;
        const setupBtn = overlay.querySelector('#petInfoPopupSetupBtn');
        if (setupBtn) setupBtn.onclick = () => {
            closePopup();
            setTimeout(() => showPetInfoSetup(), 200);
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePopup();
        });
    }

    
    function showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    }

    
    function showGameTip(message, type = 'info') {
        const old = document.querySelector('.pet-game-tip');
        if (old) old.remove();
        const tip = document.createElement('div');
        tip.className = `pet-game-tip ${type}`;
        tip.textContent = message;
        document.body.appendChild(tip);
        setTimeout(() => { if (tip.parentNode) tip.remove(); }, 2200);
    }

    function showScorePopup(score) {
        const popup = document.createElement('div');
        popup.className = 'pet-score-popup';
        popup.innerHTML = `<div class="pet-score-popup-content">+${score} 经验</div>`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    
    
    
    
    function parseRecordTime(str) {
        if (!str) return new Date();
        const s = String(str).trim();
        if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
            return new Date(s.replace(' ', 'T') + 'Z');
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? new Date() : d;
    }

    function formatTime(date) {
        
        const bj = new Date(date.getTime() + (date.getTimezoneOffset() + 480) * 60000);
        const now = new Date();
        const nowBj = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
        const pad = n => String(n).padStart(2, '0');
        const hm = `${pad(bj.getHours())}:${pad(bj.getMinutes())}`;
        const sameDay = bj.getFullYear() === nowBj.getFullYear() && bj.getMonth() === nowBj.getMonth() && bj.getDate() === nowBj.getDate();
        const sameYear = bj.getFullYear() === nowBj.getFullYear();
        if (sameDay) return `今天 ${hm}`;
        if (sameYear) return `${bj.getMonth() + 1}月${bj.getDate()}日 ${hm}`;
        return `${bj.getFullYear()}年${bj.getMonth() + 1}月${bj.getDate()}日 ${hm}`;
    }

    
    function getBeijingDateStr() {
        const now = new Date();
        const bj = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
        const pad = n => String(n).padStart(2, '0');
        return `${bj.getFullYear()}-${pad(bj.getMonth() + 1)}-${pad(bj.getDate())}`;
    }

    
    function openPetPage() {
        const pagePet = document.getElementById('page-pet');
        if (!pagePet) return;

        hideFloatingPet();
        pagePet.style.transform = 'translateX(100%)';
        pagePet.style.display = 'block';
        
        const scrollEl = document.getElementById('petScroll');
        if (scrollEl) scrollEl.scrollTop = 0;
        void pagePet.offsetHeight;

        requestAnimationFrame(() => {
            pagePet.classList.add('active');
            pagePet.style.transform = '';
            
            if (typeof refreshStatusBar === 'function') refreshStatusBar();
        });

        renderPetPage();

        // 进入游戏界面时实时拉取最新数据，避免展示旧缓存
        loadPetStatus().then(() => {
            if (pagePet.classList.contains('active')) renderPetPage();
            if (typeof refreshStatusBar === 'function') refreshStatusBar();
        }).catch(() => {});
    }

    function closePetPage() {
        const pagePet = document.getElementById('page-pet');
        if (!pagePet) return;

        pagePet.classList.remove('active');

        if (typeof refreshStatusBar === 'function') refreshStatusBar();
        setTimeout(() => {
            pagePet.style.display = 'none';
            pagePet.style.transform = '';
            showFloatingPet();
        }, 350);
    }

    
    function renderPetPage() {
        const scrollEl = document.getElementById('petScroll');
        if (!scrollEl) return;

        const backBtn = document.getElementById('petBackBtn');
        if (backBtn) backBtn.onclick = closePetPage;

        updateTopbar();

        if (petState.reason === 'not_matched') {
            renderUnmatchedPage(scrollEl);
            return;
        }

        if (!petState.hasPet || !petState.pet) {
            renderNotAdoptedPage(scrollEl);
            return;
        }

        renderAdoptedPage(scrollEl);
    }

    function renderUnmatchedPage(container) {
        container.innerHTML = `
            <div class="pet-empty-state">
                <div class="pet-empty-icon"><i class="ri-footprint-fill"></i></div>
                <div class="pet-empty-title">暂无宠物</div>
                <div class="pet-empty-desc">匹配成功后即可领养专属宠物，一起记录美好生活吧！</div>
            </div>
        `;
    }

    function renderNotAdoptedPage(container) {
        container.innerHTML = `
            <div class="pet-empty-state">
                <div class="pet-empty-icon"><img src="img/adopt.svg" alt="等待领养" class="pet-empty-icon-img"></div>
                <div class="pet-empty-title">等待领养</div>
                <div class="pet-empty-desc">任意一方领养，即可获得可爱的宠物伙伴</div>
                <button class="pet-adopt-btn" id="adoptBtn">领养宠物</button>
            </div>
        `;
        const btn = document.getElementById('adoptBtn');
        if (btn) btn.onclick = showAdoptModal;
    }

    
    
    
    function getCatVariant() {
        if (petState.pet && petState.pet.variant && PET_VARIANTS.indexOf(petState.pet.variant) >= 0) {
            return petState.pet.variant;
        }
        return localStorage.getItem('petCatVariant') || 'default';
    }

    function getUnlockedVariants() {
        if (petState.pet && Array.isArray(petState.pet.unlocked_variants) && petState.pet.unlocked_variants.length > 0) {
            return petState.pet.unlocked_variants.filter(v => PET_VARIANTS.indexOf(v) >= 0);
        }
        const def = getCatVariant();
        return [def];
    }

    // 已解锁形象清单的本地缓存：后端若未落库（或 worker 未重新部署），
    // 刷新后仍可取并集保留已确认解锁的形象，避免“解锁后刷新又变回锁定”。
    function cacheUnlockedVariants() {
        try {
            if (petState.pet && Array.isArray(petState.pet.unlocked_variants)) {
                const list = petState.pet.unlocked_variants.filter(v => PET_VARIANTS.indexOf(v) >= 0);
                localStorage.setItem('petUnlockedVariants', JSON.stringify(list));
            }
        } catch (e) { /* ignore */ }
    }
    function loadUnlockedCache() {
        try {
            const raw = localStorage.getItem('petUnlockedVariants');
            if (!raw) return [];
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return [];
            return arr.filter(v => PET_VARIANTS.indexOf(v) >= 0);
        } catch (e) { return []; }
    }

    function getCatAccent(variant) {
        return PET_VARIANT_ACCENT[variant] || '#F3A16E';
    }

    function buildCatSVG() {
        const variant = getCatVariant();
        const catBody = (window.CatSVG && typeof window.CatSVG === 'function')
            ? window.CatSVG('pet-cat-svg', variant)
            : '';
        return `
            <div class="pet-slime" id="petBall" data-variant="${variant}" style="--cat-accent:${getCatAccent(variant)}">
                ${catBody}
            </div>
        `;
    }

    
    function calcLevelProgress(exp) {
        exp = Math.max(0, Math.floor(exp || 0));
        const level = exp >= 2900 ? 20 : (exp < 900 ? Math.floor(exp / 100) + 1 : Math.floor((exp - 900) / 200) + 10);
        if (level >= 20) return { level: 20, exp, progress: 100, toNext: 0, maxed: true };
        let levelStart, levelEnd;
        if (level < 10) { levelStart = (level - 1) * 100; levelEnd = level * 100; }
        else { levelStart = 900 + (level - 10) * 200; levelEnd = levelStart + 200; }
        return {
            level,
            exp,
            progress: Math.min(100, Math.round((exp - levelStart) / (levelEnd - levelStart) * 100)),
            toNext: levelEnd - exp,
            maxed: false
        };
    }

    function getLevelProgress() {
        const pet = petState.pet || {};
        if (pet.level_progress && typeof pet.level_progress.progress === 'number') return pet.level_progress;
        return calcLevelProgress(pet.exp != null ? pet.exp : pet.total_score);
    }

    function renderAdoptedPage(container) {
        const pet = petState.pet;
        const hunger = Math.round(pet.hunger || 0);
        const mood = Math.round(pet.mood || 0);
        const feedCount = petState.myDailyStats.feed_count || 0;
        const feedVouchers = pet.feed_vouchers || 0;
        const signDone = !!(petState.myDailyStats.sign_done);
        
        const feedAvailable = feedCount < 3 || feedVouchers > 0;

        container.innerHTML = `
            <div class="pet-showcase">
                <div class="pet-cat-stage">
                    <!-- 猫咪右上角：签到 + 任务 + 商城 + 活动记录按钮 -->
                    <div class="pet-cat-corner-actions">
                        <button class="pet-corner-btn sign ${signDone ? 'done' : ''}" id="signBtn" aria-label="签到">
                            <span class="pet-task-dot" id="signDot" style="display:none;"></span>
                            <img src="img/signin.svg" alt="签到">
                        </button>
                        <button class="pet-corner-btn task" id="taskBtn" aria-label="任务">
                            <span class="pet-task-dot" id="taskDot" style="display:none;"></span>
                            <img src="img/task.svg" alt="任务">
                        </button>
                        <button class="pet-corner-btn shop" id="shopBtn" aria-label="商城">
                            <img src="img/shop.svg" alt="商城">
                        </button>
                        <button class="pet-corner-btn records" id="recordsBtn" aria-label="活动记录">
                            <img src="img/recently.svg" alt="活动记录">
                        </button>
                        <button class="pet-corner-btn info" id="petInfoBtn" aria-label="宠物信息">
                            <img src="img/info.svg" alt="宠物信息">
                        </button>
                    </div>

                    <div class="pet-cat-container" id="petCatContainer">
                        <div class="pet-lawn"></div>
                        ${buildCatSVG()}
                        <div class="pet-slime-shadow"></div>
                    </div>

                <div class="pet-status-cards">
                    <div class="pet-status-card">
                        <div class="pet-status-icon hunger"><img src="img/catfood.svg" alt="饥饿值"></div>
                        <div class="pet-status-bar">
                            <div class="pet-status-fill hunger" style="width:${hunger}%"></div>
                        </div>
                    </div>
                    <div class="pet-status-card">
                        <div class="pet-status-icon mood"><img src="img/mood.svg" alt="心情值"></div>
                        <div class="pet-status-bar">
                            <div class="pet-status-fill mood" style="width:${mood}%"></div>
                        </div>
                    </div>
                </div>
                </div>

                <!-- 背包按钮（投喂按钮上方） -->
                <button class="pet-feed-fab pet-bag-fab" id="bagBtn" aria-label="背包">
                    <img src="img/bag.svg" alt="背包">
                </button>
                <!-- 投喂按钮（右下角单独按钮） -->
                <button class="pet-feed-fab ${feedAvailable ? '' : 'done'}" id="feedBtn" aria-label="投喂">
                    <img src="img/can.svg" alt="投喂">
                    <span class="pet-feed-fab-badge" id="feedBadge">${Math.max(0, 3 - feedCount) + feedVouchers}</span>
                </button>
            </div>
        `;

        bindPetBallEvents();
        bindActionButtons();
        
        showEntryInteraction();
        
        refreshTaskDot();
        
        maybeShowSignModal();
    }

    
    
    function showEntryInteraction() {
        const ball = document.querySelector('.pet-slime');
        if (!ball) return;
        const mood = petState.pet ? (petState.pet.mood || 0) : 0;
        const hunger = petState.pet ? (petState.pet.hunger || 0) : 0;

        
        const now = new Date();
        const h = (now.getUTCHours() + 8) % 24;

        let lines;
        if (hunger < 30) {
            lines = ['好饿呀...', '肚子饿饿的，可以投喂我吗？', '想吃东西了~', '饿得没力气了...'];
        } else if (mood < 30) {
            lines = ['快来摸摸我嘛', '有点孤单呢...', '陪陪我好吗？', '今天想被多抱抱'];
        } else if (h >= 22 || h < 5) {
            
            lines = [
                '夜深了，早点休息哦~',
                '这么晚还不睡呀？熬夜可不好！',
                '夜深人静，快去睡觉吧，明天再记账也不迟~',
                '晚安前，记得把今天的账记完哦~'
            ];
        } else if (h >= 19) {
            
            lines = [
                '晚上好呀~ 今天的账记了吗？',
                '晚上好！睡前看看今天的账单吧~',
                '一天辛苦啦，抱抱~',
                '晚上好呀，别忘了记账哦！'
            ];
        } else if (h >= 14) {
            
            lines = [
                '下午好~ 今天别忘了记账呀！',
                '下午好，想我了吗？',
                '下午好呀，今天也要加油！',
                '时间过得真快，别忘了记账哦！'
            ];
        } else if (h >= 12) {
            
            lines = [
                '中午好呀，记得吃饭哦！',
                '午安~ 吃饱了才有精神记账！',
                '中午啦，休息一下再继续吧~'
            ];
        } else if (h >= 9) {
            
            lines = [
                '上午好~ 今天过得怎么样？',
                '上午好呀，我在等你呢！',
                '嗨，你来啦~ 一起加油吧！',
                '上午好，别忘了今天记账哦！'
            ];
        } else {
            
            lines = [
                '早上好呀~ 新的一天元气满满！',
                '早安~ 记得吃早餐哦！',
                '早呀早呀，今天也要好好记账！'
            ];
        }

        const text = lines[Math.floor(Math.random() * lines.length)];
        const container = ball.closest('.pet-cat-container');
        if (!container) return;

        const old = container.querySelector('.pet-speech');
        if (old) old.remove();

        const speech = document.createElement('div');
        speech.className = 'pet-speech entry';
        speech.textContent = text;
        container.appendChild(speech);
        setTimeout(() => { if (speech.parentNode) speech.remove(); }, 3200);
    }

    
    let petActionMenuOpen = false;
    function bindPetBallEvents() {
        const ball = document.getElementById('petBall');
        if (!ball) return;

        ball.addEventListener('click', (e) => {
            e.stopPropagation();
            
            ball.classList.remove('happy');
            void ball.offsetWidth;
            ball.classList.add('happy');
            setTimeout(() => ball.classList.remove('happy'), 2000);
            
            togglePetActionMenu();
        });
    }

    function togglePetActionMenu() {
        if (petActionMenuOpen) {
            hidePetActionMenu();
        } else {
            showPetActionMenu();
        }
    }

    function showPetActionMenu() {
        const container = document.querySelector('.pet-cat-container');
        if (!container || !petState.pet) return;

        
        hidePetActionMenu();

        const pet = petState.pet;
        const points = pet.points != null ? pet.points : (pet.total_score || 0);
        const dewormVouchers = pet.deworm_vouchers || 0;
        const batheVouchers = pet.bathe_vouchers || 0;
        const examineVouchers = pet.examine_vouchers || 0;

        const actions = [
            { key: 'play', label: '玩耍', icon: 'img/play.svg', cost: '5积分', available: points >= 5, count: null },
            { key: 'bathe', label: '洗澡', icon: 'img/shower.svg', cost: '洗澡券', available: batheVouchers > 0, count: batheVouchers },
            { key: 'deworm', label: '驱虫', icon: 'img/deworm.svg', cost: '驱虫券', available: dewormVouchers > 0, count: dewormVouchers },
            { key: 'examine', label: '体检', icon: 'img/examine.svg', cost: '体检券', available: examineVouchers > 0, count: examineVouchers }
        ];

        const menu = document.createElement('div');
        menu.className = 'pet-action-menu';
        menu.id = 'petActionMenu';
        menu.innerHTML = actions.map((a, i) => `
            <button class="pet-action-item ${a.available ? '' : 'disabled'} item-${i + 1}" data-action="${a.key}" ${a.available ? '' : 'disabled'} title="${a.label}">
                <div class="pet-action-icon-wrap">
                    <img src="${a.icon}" alt="${a.label}" class="pet-action-icon">
                </div>
                <div class="pet-action-text">
                    <div class="pet-action-label">${a.label}</div>
                </div>
            </button>
        `).join('');

        container.appendChild(menu);
        petActionMenuOpen = true;

        
        menu.querySelectorAll('.pet-action-item').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const action = btn.dataset.action;
                hidePetActionMenu();
                handlePetAction(action);
            });
        });

        
        setTimeout(() => {
            document.addEventListener('click', onActionMenuOutsideClick);
        }, 0);
    }

    function hidePetActionMenu() {
        const menu = document.getElementById('petActionMenu');
        if (menu) menu.remove();
        petActionMenuOpen = false;
        document.removeEventListener('click', onActionMenuOutsideClick);
    }

    function onActionMenuOutsideClick(e) {
        const menu = document.getElementById('petActionMenu');
        const ball = document.getElementById('petBall');
        if (menu && !menu.contains(e.target) && (!ball || !ball.contains(e.target))) {
            hidePetActionMenu();
        }
    }

    
    async function handlePetAction(action) {
        if (!petState.pet) return;
        const actionMap = {
            play: { endpoint: '/pet/play', label: '玩耍', responses: ['玩得真开心呀~', '一起玩最棒了！', '陪我玩好幸福~'] },
            bathe: { endpoint: '/pet/bathe', label: '洗澡', responses: ['洗干净了香香哒~', '香喷喷的啦！', '舒服的泡泡浴~'] },
            deworm: { endpoint: '/pet/deworm', label: '驱虫', responses: ['驱虫完啦，舒服多了~', '没有小虫子啦！', '清清爽爽的感觉~'] },
            examine: { endpoint: '/pet/examine', label: '体检', responses: ['体检完毕，我很健康哦~', '身体棒棒哒！', '检查完成，一切正常~'] }
        };
        const config = actionMap[action];
        if (!config) return;

        try {
            const result = await petApi(config.endpoint, 'POST');
            showScorePopup(result.score || 0);

            
            if (result.mood != null) petState.pet.mood = result.mood;
            if (result.points != null) petState.pet.points = result.points;
            if (result.deworm_vouchers != null) petState.pet.deworm_vouchers = result.deworm_vouchers;
            if (result.bathe_vouchers != null) petState.pet.bathe_vouchers = result.bathe_vouchers;
            if (result.examine_vouchers != null) petState.pet.examine_vouchers = result.examine_vouchers;
            applyExpResult(result);

            
            updateStatusBars();
            updateTopbar();
            loadPetRecords();
            if (taskModalOpen) refreshActiveTab();
            refreshTaskDot();

            
            const ball = document.querySelector('.pet-slime');
            if (ball) {
                const container = ball.closest('.pet-cat-container');
                if (container) {
                    
                    const oldSpeech = container.querySelector('.pet-speech');
                    if (oldSpeech) oldSpeech.remove();
                    
                    const text = config.responses[Math.floor(Math.random() * config.responses.length)];
                    const speech = document.createElement('div');
                    speech.className = 'pet-speech';
                    speech.textContent = text;
                    container.appendChild(speech);
                    setTimeout(() => { if (speech.parentNode) speech.remove(); }, 2000);

                    
                    const effect = document.createElement('div');
                    effect.className = 'pet-action-effect';
                    let effectHtml = '';
                    let effectAnim = 'feedFloat 0.8s ease-out forwards';
                    if (action === 'play') {
                        
                        effectHtml = '<img src="img/football.svg" alt="足球" style="width:36px;height:36px;display:block;">';
                        effectAnim = 'ballRollIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards';
                    } else if (action === 'bathe') {
                        effectHtml = '<i class="ri-drop-line" style="color:#4FC3F7;font-size:28px;"></i>';
                    } else if (action === 'deworm') {
                        effectHtml = '<i class="ri-shield-check-line" style="color:#66BB6A;font-size:28px;"></i>';
                    } else if (action === 'examine') {
                        effectHtml = '<i class="ri-stethoscope-line" style="color:#FF7043;font-size:28px;"></i>';
                    }
                    effect.innerHTML = effectHtml;
                    if (action === 'play') {

                        effect.style.cssText = 'position:absolute;left:50%;top:60%;z-index:100;pointer-events:none;animation:' + effectAnim + ';';
                        container.appendChild(effect);
                        setTimeout(() => effect.remove(), 10900);
                    } else {
                        effect.style.cssText = 'position:absolute;left:50%;top:20%;transform:translateX(-50%);z-index:100;pointer-events:none;animation:' + effectAnim + ';';
                        container.appendChild(effect);
                        setTimeout(() => effect.remove(), 800);
                    }
                }
            }
        } catch (error) {
            showGameTip(error.message, 'warn');
        }
    }

    function bindActionButtons() {
        const feedBtn = document.getElementById('feedBtn');
        if (feedBtn) feedBtn.addEventListener('click', handleFeed);

        const taskBtn = document.getElementById('taskBtn');
        if (taskBtn) taskBtn.addEventListener('click', showTaskModal);

        const shopBtn = document.getElementById('shopBtn');
        if (shopBtn) shopBtn.addEventListener('click', showShopModal);

        const bagBtn = document.getElementById('bagBtn');
        if (bagBtn) bagBtn.addEventListener('click', showBagModal);

        const recordsBtn = document.getElementById('recordsBtn');
        if (recordsBtn) recordsBtn.addEventListener('click', showRecordsModal);

        const infoBtn = document.getElementById('petInfoBtn');
        if (infoBtn) infoBtn.addEventListener('click', showPetInfoPopup);

        const signBtn = document.getElementById('signBtn');
        if (signBtn) signBtn.addEventListener('click', () => {
            
            showSignModal();
        });
    }

    
    function showPetConfirm(title, desc) {
        return new Promise(resolve => {
            
            let overlay = document.getElementById('petConfirmOverlay');
            if (overlay) overlay.remove();
            overlay = document.createElement('div');
            overlay.id = 'petConfirmOverlay';
            overlay.className = 'pet-confirm-overlay';
            overlay.innerHTML = `
                <div class="pet-confirm-modal">
                    <div class="pet-confirm-title">${title}</div>
                    <div class="pet-confirm-desc">${desc}</div>
                    <div class="pet-confirm-actions">
                        <button class="pet-confirm-btn cancel">取消</button>
                        <button class="pet-confirm-btn confirm">确认兑换</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => overlay.classList.add('active'));
            
            const cleanup = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 200);
            };
            overlay.querySelector('.pet-confirm-btn.cancel').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            overlay.querySelector('.pet-confirm-btn.confirm').addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            overlay.addEventListener('click', e => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    
    let shopModalOpen = false;
    let shopCurrentTab = 'skin';
    function showShopModal() {
        const old = document.querySelector('.pet-shop-overlay');
        if (old) old.remove();
        const overlay = document.createElement('div');
        overlay.className = 'pet-shop-overlay active';
        overlay.innerHTML = `
            <div class="pet-shop-modal">
                <div class="pet-shop-header">
                    <div>
                        <div class="pet-shop-title"><i class="ri-store-2-line"></i> 商城</div>
                        <div class="pet-shop-summary">用积分兑换形象和券</div>
                    </div>
                    <button class="pet-shop-close" id="shopClose"><i class="ri-close-line"></i></button>
                </div>
                <div class="pet-shop-tabs">
                    <button class="pet-shop-tab active" data-tab="skin"><i class="ri-t-shirt-line"></i> 形象兑换</button>
                    <button class="pet-shop-tab" data-tab="voucher"><i class="ri-ticket-line"></i> 券兑换</button>
                </div>
                <div class="pet-shop-body" id="shopBody">
                    <div class="pet-task-loading">加载中...</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        shopModalOpen = true;
        shopCurrentTab = 'skin';

        overlay.querySelector('#shopClose').onclick = closeShopModal;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeShopModal(); });

        overlay.querySelectorAll('.pet-shop-tab').forEach(tab => {
            tab.onclick = () => switchShopTab(tab.dataset.tab);
        });

        loadShopTab();
    }

    function closeShopModal() {
        const overlay = document.querySelector('.pet-shop-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 250);
        }
        shopModalOpen = false;
    }

    function switchShopTab(tab) {
        if (tab === shopCurrentTab) return;
        shopCurrentTab = tab;
        document.querySelectorAll('.pet-shop-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        loadShopTab();
    }

    function loadShopTab() {
        const body = document.querySelector('.pet-shop-body');
        if (!body) return;
        if (shopCurrentTab === 'skin') {
            
            body.id = '';
            body.innerHTML = `
                <div class="pet-cat-skin-header pet-shop-skin-header">
                    <span>选择形象</span>
                    <div class="pet-cat-skin-points">
                        <img src="img/integration.svg" alt="积分" class="pet-cat-skin-points-icon">
                        <span id="catSkinPointsVal">0</span>
                    </div>
                </div>
                <div class="pet-cat-skin-grid" id="catSkinGrid">
                    ${PET_VARIANTS.map(v => `
                        <button class="pet-cat-skin-card ${getCatVariant() === v ? 'active' : ''}" data-variant="${v}">
                            <div class="pet-cat-skin-preview" id="skinPreview${v.charAt(0).toUpperCase() + v.slice(1)}"></div>
                            <span class="pet-cat-skin-name">${PET_VARIANT_NAMES[v]}</span>
                        </button>
                    `).join('')}
                </div>
            `;
            renderSkinPreviews();
            bindShopSkinEvents();
            refreshSkinCardStates();
        } else {
            // 券兑换：保持 id=taskBody 让 loadExchangePage/renderExchangePage/handleExchange 能找到
            currentTaskTab = 'exchange';
            body.id = 'taskBody';
            body.innerHTML = '<div class="pet-task-loading">加载中...</div>';
            loadExchangePage();
        }
    }

    // 商城内形象兑换的事件绑定（复用原 bindCatSkinEvents 的逻辑但动态绑定）
    function bindShopSkinEvents() {
        const grid = document.getElementById('catSkinGrid');
        const overlay = document.querySelector('.pet-shop-overlay');
        if (!grid || !overlay) return;

        // 卡片点击：已解锁则切换形象；锁定卡片不响应整卡点击（由卡片内嵌兑换按钮处理）
        grid.querySelectorAll('.pet-cat-skin-card').forEach(function (card) {
            card.addEventListener('click', async function (e) {
                if (e.target.closest('.pet-cat-skin-exchange-btn')) return;
                const variant = card.dataset.variant;
                if (!variant) return;
                const unlocked = getUnlockedVariants();
                const currentVariant = getCatVariant();
                if (unlocked.indexOf(variant) < 0) return;
                if (variant === currentVariant) {
                    refreshSkinCardStates();
                    closeShopModal();
                    return;
                }
                try {
                    await switchCatVariantWithBackend(variant);
                    refreshSkinCardStates();
                    closeShopModal();
                } catch (err) {
                    showGameTip(err.message || '切换失败', 'warn');
                }
            });
        });

        // 兑换按钮点击（事件委托）
        grid.addEventListener('click', async function (e) {
            const btn = e.target.closest('.pet-cat-skin-exchange-btn');
            if (!btn) return;
            e.stopPropagation();
            const card = btn.closest('.pet-cat-skin-card');
            if (!card) return;
            const variant = card.dataset.variant;
            if (!variant) return;
            const unlocked = getUnlockedVariants();
            if (unlocked.indexOf(variant) >= 0) { refreshSkinCardStates(); return; }
            const curPoints = petState.pet && petState.pet.points != null ? petState.pet.points : (petState.pet && petState.pet.total_score ? petState.pet.total_score : 0);
            if (curPoints < PET_SKIN_COST) {
                showGameTip('积分不足，兑换需要' + PET_SKIN_COST + '积分', 'warn');
                return;
            }
            const variantName = PET_VARIANT_NAMES[variant] || variant;
            const confirmMsg = '确定消耗 ' + PET_SKIN_COST + ' 积分兑换「' + variantName + '」形象吗？';
            const ok = await showPetConfirm('兑换确认', confirmMsg);
            if (!ok) return;
            try {
                const res = await petApi('/pet/skin/exchange', 'POST', { variant });
                showGameTip(res.alreadyUnlocked ? '该形象已解锁' : '兑换成功，已解锁新形象！');
                if (petState.pet) {
                    petState.pet.unlocked_variants = res.unlocked_variants || unlocked.concat([variant]);
                    petState.pet.points = res.points != null ? res.points : (Math.max(0, curPoints - PET_SKIN_COST));
                }
                updateTopbar();
                updateEntryCard();
                refreshSkinCardStates();
                cacheUnlockedVariants();
                try { await switchCatVariantWithBackend(variant); } catch (e) { console.warn('切换形象失败', e); }
                closeShopModal();
            } catch (err) {
                if (err && err.message && err.message.indexOf('已解锁') >= 0) {
                    const ul = getUnlockedVariants();
                    if (petState.pet && ul.indexOf(variant) < 0) {
                        petState.pet.unlocked_variants = ul.concat([variant]);
                    }
                    updateTopbar();
                    updateEntryCard();
                    refreshSkinCardStates();
                    cacheUnlockedVariants();
                    showGameTip('该形象已解锁', 'info');
                    return;
                }
                showGameTip(err.message || '兑换失败', 'warn');
            }
        });
    }

    // ===== 背包弹窗 =====
    let bagModalOpen = false;
    let bagCurrentTab = 'skin';
    function showBagModal() {
        const old = document.querySelector('.pet-bag-overlay');
        if (old) old.remove();
        const overlay = document.createElement('div');
        overlay.className = 'pet-bag-overlay active';
        overlay.innerHTML = `
            <div class="pet-bag-modal">
                <div class="pet-bag-header">
                    <div>
                        <div class="pet-bag-title"><i class="ri-bag-line"></i> 背包</div>
                    </div>
                    <button class="pet-bag-close" id="bagClose"><i class="ri-close-line"></i></button>
                </div>
                <div class="pet-bag-tabs">
                    <button class="pet-bag-tab active" data-tab="skin"><i class="ri-t-shirt-line"></i> 形象</button>
                    <button class="pet-bag-tab" data-tab="item"><i class="ri-gift-line"></i> 道具</button>
                </div>
                <div class="pet-bag-body" id="bagBody">
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        bagModalOpen = true;
        bagCurrentTab = 'skin';

        overlay.querySelector('#bagClose').onclick = closeBagModal;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBagModal(); });

        overlay.querySelectorAll('.pet-bag-tab').forEach(tab => {
            tab.onclick = () => switchBagTab(tab.dataset.tab);
        });

        loadBagTab();
    }

    function closeBagModal() {
        const overlay = document.querySelector('.pet-bag-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 250);
        }
        bagModalOpen = false;
    }

    function switchBagTab(tab) {
        if (tab === bagCurrentTab) return;
        bagCurrentTab = tab;
        document.querySelectorAll('.pet-bag-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        loadBagTab();
    }

    function loadBagTab() {
        const body = document.getElementById('bagBody');
        if (!body) return;
        if (bagCurrentTab === 'skin') {
            // 形象 tab：显示已解锁的形象，点击可切换
            const unlocked = getUnlockedVariants();
            const currentVariant = getCatVariant();
            body.innerHTML = `
                <div class="pet-bag-skin-grid">
                    ${PET_VARIANTS.map(v => {
                        const isUnlocked = unlocked.indexOf(v) >= 0;
                        const isActive = v === currentVariant;
                        return `
                            <div class="pet-bag-skin-card ${isActive ? 'active' : ''} ${isUnlocked ? '' : 'locked'}" data-variant="${v}">
                                <div class="pet-bag-skin-preview" id="bagSkinPreview_${v}"></div>
                                <span class="pet-bag-skin-name">${PET_VARIANT_NAMES[v]}</span>
                                ${isActive ? '<span class="pet-bag-skin-tag">当前</span>' : ''}
                                ${!isUnlocked ? '<span class="pet-bag-skin-lock"><i class="ri-lock-line"></i></span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            // 渲染预览
            if (window.CatSVG) {
                PET_VARIANTS.forEach(v => {
                    const el = document.getElementById('bagSkinPreview_' + v);
                    if (el) el.innerHTML = window.CatSVG('pet-cat-skin-svg', v);
                });
            }
            // 绑定切换事件
            body.querySelectorAll('.pet-bag-skin-card:not(.locked)').forEach(card => {
                card.addEventListener('click', async function () {
                    const variant = card.dataset.variant;
                    if (variant === getCatVariant()) return;
                    try {
                        await switchCatVariantWithBackend(variant);
                        showGameTip('已切换为' + (PET_VARIANT_NAMES[variant] || '新形象') + '~');
                        closeBagModal();
                    } catch (err) {
                        showGameTip(err.message || '切换失败', 'warn');
                    }
                });
            });
        } else {
            // 道具 tab：显示券数量
            const pet = petState.pet || {};
            const items = [
                { name: '喂食券', icon: '<img src="img/can.svg" alt="喂食券">', count: pet.feed_vouchers || 0, desc: '用于投喂宠物' },
                { name: '驱虫券', icon: '<img src="img/deworm.svg" alt="驱虫券">', count: pet.deworm_vouchers || 0, desc: '用于给宠物驱虫' },
                { name: '洗澡券', icon: '<img src="img/shower.svg" alt="洗澡券">', count: pet.bathe_vouchers || 0, desc: '用于给宠物洗澡' },
                { name: '体检券', icon: '<img src="img/examine.svg" alt="体检券">', count: pet.examine_vouchers || 0, desc: '用于给宠物体检' }
            ];
            body.innerHTML = `
                <div class="pet-bag-item-list">
                    ${items.map(it => `
                        <div class="pet-bag-item">
                            <div class="pet-bag-item-icon">${it.icon}</div>
                            <div class="pet-bag-item-info">
                                <div class="pet-bag-item-name">${it.name}</div>
                                <div class="pet-bag-item-desc">${it.desc}</div>
                            </div>
                            <div class="pet-bag-item-count">x${it.count}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // ===== 猫咪形象更换 =====
    function bindCatSkinEvents() {
        var changeBtn = document.getElementById('catChangeBtn');
        var overlay = document.getElementById('catSkinOverlay');
        var closeBtn = document.getElementById('catSkinClose');
        var grid = document.getElementById('catSkinGrid');
        var header = overlay ? overlay.querySelector('.pet-cat-skin-header') : null;
        if (!changeBtn || !overlay) return;

        
        renderSkinPreviews();

        
        if (header && !header.querySelector('.pet-cat-skin-points')) {
            const pointsEl = document.createElement('div');
            pointsEl.className = 'pet-cat-skin-points';
            pointsEl.innerHTML = `<img src="img/integration.svg" alt="积分" class="pet-cat-skin-points-icon"><span id="catSkinPointsVal">0</span>`;
            header.insertBefore(pointsEl, header.firstChild.nextSibling);
        }

        
        changeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            refreshSkinCardStates();
            overlay.classList.add('active');
        });

        
        if (closeBtn) closeBtn.addEventListener('click', function () {
            overlay.classList.remove('active');
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.classList.remove('active');
        });

        
        if (grid) grid.querySelectorAll('.pet-cat-skin-card').forEach(function (card) {
            card.addEventListener('click', async function (e) {
                
                if (e.target.closest('.pet-cat-skin-exchange-btn')) return;
                const variant = card.dataset.variant;
                if (!variant) return;
                const unlocked = getUnlockedVariants();
                const currentVariant = getCatVariant();
                if (unlocked.indexOf(variant) < 0) return; 

                
                if (variant === currentVariant) {
                    overlay.classList.remove('active');
                    return;
                }
                try {
                    await switchCatVariantWithBackend(variant);
                    refreshSkinCardStates();
                    overlay.classList.remove('active');
                } catch (err) {
                    showGameTip(err.message || '切换失败', 'warn');
                }
            });
        });

        
        if (grid) grid.addEventListener('click', async function (e) {
            const btn = e.target.closest('.pet-cat-skin-exchange-btn');
            if (!btn) return;
            e.stopPropagation();
            const card = btn.closest('.pet-cat-skin-card');
            if (!card) return;
            const variant = card.dataset.variant;
            if (!variant) return;
            const unlocked = getUnlockedVariants();
            if (unlocked.indexOf(variant) >= 0) { refreshSkinCardStates(); return; }
            const curPoints = petState.pet && petState.pet.points != null ? petState.pet.points : (petState.pet && petState.pet.total_score ? petState.pet.total_score : 0);
            if (curPoints < PET_SKIN_COST) {
                showGameTip(`积分不足，兑换需要${PET_SKIN_COST}积分`, 'warn');
                return;
            }
            
            const variantName = PET_VARIANT_NAMES[variant] || variant;
            const confirmMsg = `确定消耗 ${PET_SKIN_COST} 积分兑换「${variantName}」形象吗？`;
            const ok = await showPetConfirm('兑换确认', confirmMsg);
            if (!ok) return;
            try {
                const res = await petApi('/pet/skin/exchange', 'POST', { variant });
                showGameTip(res.alreadyUnlocked ? '该形象已解锁' : '兑换成功，已解锁新形象！');
                if (petState.pet) {
                    petState.pet.unlocked_variants = res.unlocked_variants || unlocked.concat([variant]);
                    petState.pet.points = res.points != null ? res.points : (Math.max(0, curPoints - PET_SKIN_COST));
                }
                updateTopbar();
                updateEntryCard();
                refreshSkinCardStates();
                try { await switchCatVariantWithBackend(variant); } catch (e) { console.warn('切换形象失败', e); }
                overlay.classList.remove('active');
            } catch (err) {
                if (err && err.message && err.message.indexOf('已解锁') >= 0) {
                    const ul = getUnlockedVariants();
                    if (petState.pet && ul.indexOf(variant) < 0) {
                        petState.pet.unlocked_variants = ul.concat([variant]);
                    }
                    updateTopbar();
                    updateEntryCard();
                    refreshSkinCardStates();
                    cacheUnlockedVariants();
                    showGameTip('该形象已解锁', 'info');
                    return;
                }
                showGameTip(err.message || '兑换失败', 'warn');
            }
        });
    }

    
    function refreshSkinCardStates() {
        var grid = document.getElementById('catSkinGrid');
        var pointsVal = document.getElementById('catSkinPointsVal');
        if (!grid) return;
        const unlocked = getUnlockedVariants();
        const currentVariant = getCatVariant();
        const curPoints = petState.pet && petState.pet.points != null ? petState.pet.points : (petState.pet && petState.pet.total_score ? petState.pet.total_score : 0);
        if (pointsVal) pointsVal.textContent = Math.floor(curPoints);

        const enough = curPoints >= PET_SKIN_COST;

        grid.querySelectorAll('.pet-cat-skin-card').forEach(function (card) {
            const v = card.dataset.variant;
            const isLocked = unlocked.indexOf(v) < 0;
            const isActive = v === currentVariant;
            card.classList.toggle('active', isActive);
            card.classList.toggle('locked', isLocked);

            
            let checkEl = card.querySelector('.pet-cat-skin-check');
            if (isActive) {
                if (!checkEl) {
                    checkEl = document.createElement('span');
                    checkEl.className = 'pet-cat-skin-check';
                    checkEl.innerHTML = '<i class="ri-check-fill"></i>';
                    card.appendChild(checkEl);
                }
            } else {
                if (checkEl) checkEl.remove();
            }

            
            let lockMask = card.querySelector('.pet-cat-skin-lock');
            let costBadge = card.querySelector('.pet-cat-skin-cost');
            let exchangeBtn = card.querySelector('.pet-cat-skin-exchange-btn');
            if (isLocked) {
                if (!lockMask) {
                    lockMask = document.createElement('div');
                    lockMask.className = 'pet-cat-skin-lock';
                    lockMask.innerHTML = `<i class="ri-lock-line"></i>`;
                    card.appendChild(lockMask);
                }
                
                if (costBadge) costBadge.remove();
                if (!exchangeBtn) {
                    exchangeBtn = document.createElement('button');
                    exchangeBtn.className = 'pet-cat-skin-exchange-btn';
                    card.appendChild(exchangeBtn);
                }
                if (enough) {
                    exchangeBtn.classList.remove('insufficient');
                    exchangeBtn.innerHTML = `<img src="img/integration.svg" alt="" class="pet-cat-skin-exchange-icon">${PET_SKIN_COST} 积分兑换`;
                } else {
                    exchangeBtn.classList.add('insufficient');
                    exchangeBtn.innerHTML = `<img src="img/integration.svg" alt="" class="pet-cat-skin-exchange-icon">积分不足`;
                }
            } else {
                if (lockMask) lockMask.remove();
                if (costBadge) costBadge.remove();
                if (exchangeBtn) exchangeBtn.remove();
            }
        });
        updateActiveSkinCard(currentVariant);
    }

    function renderSkinPreviews() {
        if (!window.CatSVG) return;
        PET_VARIANTS.forEach(function (variant) {
            var id = 'skinPreview' + variant.charAt(0).toUpperCase() + variant.slice(1);
            var el = document.getElementById(id);
            if (el) el.innerHTML = window.CatSVG('pet-cat-skin-svg', variant);
        });
    }

    function updateActiveSkinCard(variant) {
        document.querySelectorAll('.pet-cat-skin-card').forEach(function (card) {
            card.classList.toggle('active', card.dataset.variant === variant);
        });
    }

    
    async function switchCatVariantWithBackend(variant) {
        // 乐观更新：先切换本地与界面，确保点击即生效；避免后端不可用时整段失败、切换毫无反应
        if (petState.pet) petState.pet.variant = variant;
        localStorage.setItem('petCatVariant', variant);
        updateActiveSkinCard(variant);
        switchCatVariant(variant);
        try {
            const res = await petApi('/pet/skin/switch', 'POST', { variant });
            if (petState.pet && res && res.unlocked_variants) petState.pet.unlocked_variants = res.unlocked_variants;
            return res;
        } catch (e) {
            console.warn('切换形象后端同步失败，已保留本地切换', e);
            return null;
        }
    }

    
    function switchCatVariant(variant) {
        if (!window.CatSVG) return;
        var accent = getCatAccent(variant);

        
        var ball = document.querySelector('.pet-slime');
        if (ball) {
            ball.setAttribute('data-variant', variant);
            ball.style.setProperty('--cat-accent', accent);
            var oldSvg = ball.querySelector('.pet-cat-svg');
            if (oldSvg) {
                var tmp = document.createElement('div');
                tmp.innerHTML = window.CatSVG('pet-cat-svg', variant);
                var newSvg = tmp.firstElementChild;
                if (newSvg) oldSvg.replaceWith(newSvg);
            }
        }

        
        var avatar = document.querySelector('.pet-avatar-slime');
        if (avatar) {
            avatar.setAttribute('data-variant', variant);
            avatar.style.setProperty('--cat-accent', accent);
            var oldA = avatar.querySelector('.pet-cat-avatar-svg');
            if (oldA) {
                var tmp2 = document.createElement('div');
                tmp2.innerHTML = window.CatSVG('pet-cat-avatar-svg', variant);
                var newA = tmp2.firstElementChild;
                if (newA) oldA.replaceWith(newA);
            }
        }

        // 桌面悬浮宠物同步切换形象
        updateFloatingPetVariant();
    }

    
    function showAdoptModal() {
        const modal = document.createElement('div');
        modal.className = 'pet-setup-overlay active';

        modal.innerHTML = `
            <div class="pet-setup-modal">
                <div class="pet-setup-title">领养宠物</div>
                <div class="pet-setup-desc">你要领养以下形象的宠物</div>
                <div class="pet-setup-preview">
                    <div class="pet-setup-preview-cat" id="adoptPreviewCat"></div>
                    <div class="pet-setup-preview-name">灰白英短</div>
                </div>
                <div class="pet-setup-form">
                    <div class="pet-setup-field">
                        <label class="pet-setup-label">宠物名字</label>
                        <input type="text" class="pet-setup-input" id="adoptNameInput" placeholder="输入宠物名字" maxlength="20" />
                    </div>
                    <div class="pet-setup-actions">
                        <button class="pet-setup-btn cancel" id="adoptCancel">取消</button>
                        <button class="pet-setup-btn confirm" id="adoptConfirm">确认领养</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (typeof refreshStatusBar === 'function') refreshStatusBar();

        
        var previewEl = modal.querySelector('#adoptPreviewCat');
        if (previewEl && window.CatSVG) {
            previewEl.innerHTML = window.CatSVG('pet-adopt-preview-svg', 'default');
        }

        modal.querySelector('#adoptCancel').onclick = () => { modal.remove(); if (typeof refreshStatusBar === 'function') refreshStatusBar(); };
        modal.querySelector('#adoptConfirm').onclick = async () => {
            const name = modal.querySelector('#adoptNameInput').value.trim();
            if (!name) { showGameTip('请输入宠物名字', 'warn'); return; }
            const selectedVariant = 'default';
            try {
                const res = await petApi('/pet/adopt', 'POST', { name, variant: selectedVariant });
                localStorage.setItem('petCatVariant', selectedVariant);
                if (res && res.unlocked_variants && petState.pet) {
                    petState.pet.variant = selectedVariant;
                    petState.pet.unlocked_variants = res.unlocked_variants;
                }
                showGameTip('领养成功！');
                modal.remove();
                if (typeof refreshStatusBar === 'function') refreshStatusBar();
                await loadPetStatus();
                
                const pagePet = document.getElementById('page-pet');
                if (pagePet) {
                    pagePet.style.display = 'block';
                    pagePet.classList.add('active');
                    pagePet.style.transform = '';
                }
                const scrollEl = document.getElementById('petScroll');
                if (scrollEl) scrollEl.scrollTop = 0;
                renderPetPage();
                
                setTimeout(() => showPetInfoSetup(), 400);
            } catch (error) {
                showGameTip(error.message, 'warn');
            }
        };
    }

    
    function showPetInfoSetup() {
        const pet = petState.pet;
        if (!pet) return;

        const hasBirthday = !!pet.birthday;
        const hasGender = !!pet.gender;
        tempBirthday = pet.birthday || null;
        selectedGender = pet.gender || 'secret';

        const birthdayDisplay = pet.birthday || '请选择生日';

        const modal = document.createElement('div');
        modal.className = 'pet-setup-overlay active';
        modal.id = 'petInfoSetupOverlay';
        modal.innerHTML = `
            <div class="pet-setup-modal">
                <div class="pet-setup-title">完善宠物信息</div>
                <div class="pet-setup-desc">填写后不可修改，请认真填写</div>
                <div class="pet-setup-form">
                    <div class="pet-setup-field">
                        <label class="pet-setup-label">生日</label>
                        <div class="pet-birthday-trigger" id="petBirthdayTrigger">
                            <span class="${pet.birthday ? '' : 'placeholder'}">${birthdayDisplay}</span>
                            <span class="arrow"><i class="ri-arrow-right-s-line"></i></span>
                        </div>
                    </div>
                    <div class="pet-setup-field">
                        <label class="pet-setup-label">性别</label>
                        <div class="pet-setup-gender-options">
                            <button class="pet-setup-gender-btn ${pet.gender === 'male' ? 'active' : ''}" data-gender="male" ${hasGender ? 'disabled' : ''}><i class="ri-men-line"></i> 公</button>
                            <button class="pet-setup-gender-btn ${pet.gender === 'female' ? 'active' : ''}" data-gender="female" ${hasGender ? 'disabled' : ''}><i class="ri-women-line"></i> 母</button>
                            <button class="pet-setup-gender-btn ${pet.gender === 'secret' || (!pet.gender && selectedGender === 'secret') ? 'active' : ''}" data-gender="secret" ${hasGender ? 'disabled' : ''}><i class="ri-question-mark"></i> 未知</button>
                        </div>
                    </div>
                    <div class="pet-setup-actions">
                        <button class="pet-setup-btn cancel" id="infoCancel">稍后</button>
                        <button class="pet-setup-btn confirm" id="infoConfirm">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (typeof refreshStatusBar === 'function') refreshStatusBar();

        
        const birthdayTrigger = modal.querySelector('#petBirthdayTrigger');
        if (birthdayTrigger && !hasBirthday) {
            birthdayTrigger.addEventListener('click', showBirthdayPicker);
        }

        
        modal.querySelectorAll('.pet-setup-gender-btn').forEach(btn => {
            btn.onclick = () => {
                if (hasGender) return;
                modal.querySelectorAll('.pet-setup-gender-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedGender = btn.dataset.gender;
            };
        });

        modal.querySelector('#infoCancel').onclick = () => { modal.remove(); if (typeof refreshStatusBar === 'function') refreshStatusBar(); };
        modal.querySelector('#infoConfirm').onclick = async () => {
            const payload = {};
            if (!hasBirthday && tempBirthday) payload.birthday = tempBirthday;
            if (!hasGender && selectedGender) payload.gender = selectedGender;

            if (Object.keys(payload).length === 0) { modal.remove(); if (typeof refreshStatusBar === 'function') refreshStatusBar(); return; }

            try {
                await petApi('/pet/info', 'POST', payload);
                showGameTip('保存成功');
                modal.remove();
                if (typeof refreshStatusBar === 'function') refreshStatusBar();
                await loadPetStatus();
                renderPetPage();
            } catch (error) {
                showGameTip(error.message, 'warn');
            }
        };
    }

    
    function showBirthdayPicker() {
        
        let initYear = 2024, initMonth = 1, initDay = 1;
        if (tempBirthday) {
            const parts = tempBirthday.split('-');
            if (parts.length === 3) {
                initYear = parseInt(parts[0]);
                initMonth = parseInt(parts[1]);
                initDay = parseInt(parts[2]);
            }
        }

        const overlay = document.createElement('div');
        overlay.className = 'pet-birthday-picker-overlay active';
        overlay.innerHTML = `
            <div class="pet-birthday-picker-modal">
                <div class="pet-birthday-picker-header">
                    <button class="pet-birthday-picker-btn cancel" id="birthdayCancel">取消</button>
                    <span class="pet-birthday-picker-title">选择生日</span>
                    <button class="pet-birthday-picker-btn confirm" id="birthdayConfirm">确认</button>
                </div>
                <div class="wheel-picker-container">
                    <div class="wheel-picker-mask-top"></div>
                    <div class="wheel-picker-mask-bottom"></div>
                    <div class="wheel-picker-highlight"></div>
                    <div class="wheel-picker" data-type="year" id="petWheelYear"></div>
                    <div class="wheel-picker" data-type="month" id="petWheelMonth"></div>
                    <div class="wheel-picker" data-type="day" id="petWheelDay"></div>
                    <div class="wheel-picker-label">
                        <span>年</span><span>月</span><span>日</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        
        const wheelYear = overlay.querySelector('#petWheelYear');
        const wheelMonth = overlay.querySelector('#petWheelMonth');
        const wheelDay = overlay.querySelector('#petWheelDay');

        const yearValues = generateWheelItems(1970, 2100, false);
        const monthValues = generateWheelItems(1, 12, true);

        function getDaysInMonth(y, m) {
            return new Date(y, m, 0).getDate();
        }

        function renderDayWheel(y, m, selectedDay) {
            const days = getDaysInMonth(y, m);
            const dayValues = generateWheelItems(1, days, true);
            if (typeof renderWheel === 'function') {
                renderWheel(wheelDay, dayValues, String(selectedDay).padStart(2, '0'), () => {});
            } else {
                renderWheelFallback(wheelDay, dayValues, String(selectedDay).padStart(2, '0'));
            }
        }

        
        if (typeof renderWheel === 'function') {
            renderWheel(wheelYear, yearValues, String(initYear), (newYear) => {
                const mo = parseInt(getWheelValue(wheelMonth)) || 1;
                const maxDay = getDaysInMonth(parseInt(newYear), mo);
                const currentDay = parseInt(getWheelValue(wheelDay)) || 1;
                renderDayWheel(parseInt(newYear), mo, Math.min(currentDay, maxDay));
            });

            renderWheel(wheelMonth, monthValues, String(initMonth).padStart(2, '0'), (newMonth) => {
                const yr = parseInt(getWheelValue(wheelYear)) || 2024;
                const maxDay = getDaysInMonth(yr, parseInt(newMonth));
                const currentDay = parseInt(getWheelValue(wheelDay)) || 1;
                renderDayWheel(yr, parseInt(newMonth), Math.min(currentDay, maxDay));
            });

            renderDayWheel(initYear, initMonth, initDay);
        } else {
            
            renderWheelFallback(wheelYear, yearValues, String(initYear));
            renderWheelFallback(wheelMonth, monthValues, String(initMonth).padStart(2, '0'));
            renderDayWheel(initYear, initMonth, initDay);
        }

        
        overlay.querySelector('#birthdayCancel').onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        };

        
        overlay.querySelector('#birthdayConfirm').onclick = () => {
            let y, m, d;
            if (typeof getWheelValue === 'function') {
                y = getWheelValue(wheelYear);
                m = getWheelValue(wheelMonth);
                d = getWheelValue(wheelDay);
            } else {
                y = getWheelValueFallback(wheelYear);
                m = getWheelValueFallback(wheelMonth);
                d = getWheelValueFallback(wheelDay);
            }

            if (y && m && d) {
                tempBirthday = `${y}-${m}-${d}`;
                
                const trigger = document.getElementById('petBirthdayTrigger');
                if (trigger) {
                    const span = trigger.querySelector('span:first-child');
                    span.textContent = tempBirthday;
                    span.classList.remove('placeholder');
                }
            }

            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        };

        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 200);
            }
        });
    }

    
    function renderWheelFallback(wheelEl, values, selectedValue) {
        wheelEl.innerHTML = '';
        values.forEach(val => {
            const item = document.createElement('div');
            item.className = 'wheel-item';
            item.dataset.value = val;
            item.textContent = val;
            if (val === selectedValue) item.classList.add('wheel-selected');
            wheelEl.appendChild(item);
        });

        
        const idx = values.indexOf(selectedValue);
        if (idx >= 0) {
            wheelEl.scrollTop = idx * WHEEL_ITEM_HEIGHT;
        }

        
        let scrollTimer = null;
        wheelEl.onscroll = () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const snapIdx = Math.round(wheelEl.scrollTop / WHEEL_ITEM_HEIGHT);
                wheelEl.scrollTop = snapIdx * WHEEL_ITEM_HEIGHT;
                wheelEl.querySelectorAll('.wheel-item').forEach((item, i) => {
                    item.classList.toggle('wheel-selected', i === snapIdx);
                });
            }, 120);
        };
    }

    function getWheelValueFallback(wheelEl) {
        const idx = Math.round(wheelEl.scrollTop / WHEEL_ITEM_HEIGHT);
        const items = wheelEl.querySelectorAll('.wheel-item');
        if (items[idx]) return items[idx].dataset.value;
        return null;
    }

    function generateWheelItems(start, end, pad = false) {
        const items = [];
        for (let i = start; i <= end; i++) {
            items.push(pad ? String(i).padStart(2, '0') : String(i));
        }
        return items;
    }

    
    function applyExpResult(result) {
        if (!petState.pet || result.total_score == null) return;
        const prevLevel = petState.pet.level || 1;
        petState.pet.total_score = result.total_score;
        petState.pet.exp = result.exp != null ? result.exp : result.total_score;
        petState.pet.level = result.level;
        petState.pet.level_progress = calcLevelProgress(petState.pet.exp);
        if (result.points != null) petState.pet.points = result.points;
        if (result.feed_vouchers != null) petState.pet.feed_vouchers = result.feed_vouchers;
        if (result.deworm_vouchers != null) petState.pet.deworm_vouchers = result.deworm_vouchers;
        if (result.bathe_vouchers != null) petState.pet.bathe_vouchers = result.bathe_vouchers;
        if (result.examine_vouchers != null) petState.pet.examine_vouchers = result.examine_vouchers;
        if (result.leveled_up && result.level > prevLevel) {
            showLevelUp(result.level);
        }
        updateTopbar();
    }

    function showLevelUp(level) {
        const popup = document.createElement('div');
        popup.className = 'pet-levelup';
        popup.innerHTML = `<div class="pet-levelup-content"><div class="pet-levelup-title"><i class="ri-sparkling-line"></i> 升级啦！</div><div class="pet-levelup-level">Lv.${level}</div></div>`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }

    
    let taskModalOpen = false;
    function refreshTaskModalIfOpen() {
        if (taskModalOpen) {
            refreshActiveTab();
        }
        
        refreshTaskDot();
    }

    
    async function handleSign() {
        if (!petState.pet) return;
        if (petState.myDailyStats.sign_done) {
            showGameTip('今日已签到', 'warn');
            return;
        }

        try {
            const result = await petApi('/pet/sign', 'POST');
            showScorePopup(result.score);
            applyExpResult(result);
            petState.myDailyStats.sign_done = 1;
            if (petState.signStatus) petState.signStatus.today_signed = true;

            const signBtn = document.getElementById('signBtn');
            if (signBtn) signBtn.classList.add('done');
            
            const dismissKey = 'signModalDismissed_' + getBeijingDateStr();
            localStorage.removeItem(dismissKey);
            updateSignDot(false);
            loadPetRecords();
            
            markSignDoneInTaskList();
            if (taskModalOpen) refreshActiveTab();
            refreshTaskDot();
            
            refreshSignModalIfOpen(true);
            
            if (result.voucher_reward) showGameTip(result.voucher_reward, 'info');
            if (result.cycle_bonus) showGameTip(`本周期连签7天 +${result.cycle_bonus}积分`, 'info');
        } catch (error) {
            showGameTip(error.message, 'warn');
        }
    }

    
    let signModalOpen = false;
    let signModalData = null;

    
    function maybeShowSignModal() {
        if (!petState.pet) return;
        const todaySigned = petState.myDailyStats && petState.myDailyStats.sign_done;
        if (todaySigned) return;
        
        const dismissKey = 'signModalDismissed_' + getBeijingDateStr();
        if (localStorage.getItem(dismissKey)) {
            
            updateSignDot(true);
            return;
        }
        
        showSignModal();
    }

    async function showSignModal() {
        if (signModalOpen) return;
        signModalOpen = true;

        const overlay = document.createElement('div');
        overlay.className = 'pet-sign-overlay active';
        overlay.id = 'petSignOverlay';
        overlay.innerHTML = `
            <div class="pet-sign-modal">
                <div class="pet-sign-header">
                    <div class="pet-sign-title-wrap">
                        <div class="pet-sign-title">每 日 签 到</div>
                        <div class="pet-sign-subtitle">签到满7天 +30积分</div>
                    </div>
                    <button class="pet-sign-close" id="petSignClose" aria-label="关闭"><i class="ri-close-line"></i></button>
                </div>
                <div class="pet-sign-body">
                    <div class="pet-sign-loading">加载中...</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => {
            signModalOpen = false;
            signModalData = null;
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 250);
            
            if (!petState.myDailyStats || !petState.myDailyStats.sign_done) {
                const dismissKey = 'signModalDismissed_' + getBeijingDateStr();
                localStorage.setItem(dismissKey, '1');
                updateSignDot(true);
            }
        };
        overlay.querySelector('#petSignClose').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        
        try {
            const data = await petApi('/pet/sign-status');
            signModalData = data;
            renderSignModalBody(overlay, data, close);
        } catch (error) {
            const body = overlay.querySelector('.pet-sign-body');
            if (body) body.innerHTML = `<div class="pet-sign-loading">${escapeHtml(error.message || '加载失败')}</div>`;
        }
    }

    function renderSignModalBody(overlay, data, close) {
        const body = overlay.querySelector('.pet-sign-body');
        if (!body) return;

        const signedSet = new Set(data.signed_days || []);
        const todayDay = data.day_in_cycle;
        const missed = data.missed_dates || [];
        const missedByDay = {};
        missed.forEach(m => { missedByDay[m.day_in_cycle] = m.date; });
        const rewards = data.rewards || [];
        const rewardByDay = {};
        rewards.forEach(r => { rewardByDay[r.day] = r; });

        
        const signedCount = data.signed_count || 0;

        
        const daysHtml = [];
        for (let d = 1; d <= 7; d++) {
            const isSigned = signedSet.has(d);
            const isToday = d === todayDay;
            const isPast = d < todayDay;
            const isFuture = d > todayDay;
            const reward = rewardByDay[d];
            const missedDate = missedByDay[d];
            const isVoucherDay = !!reward;

            let cls = 'pet-sign-card' + (isVoucherDay ? ' card-voucher' : '');
            let iconHtml = '';
            let stateHtml = '';
            let checkBadge = '';

            if (isSigned) {
                cls += ' signed';
                checkBadge = `<div class="pet-sign-check"><i class="ri-check-fill"></i></div>`;
                stateHtml = `<div class="pet-sign-card-state done">已领取</div>`;
            } else if (isToday) {
                cls += ' today';
                stateHtml = `<button class="pet-sign-card-btn primary" data-action="sign">立即签到</button>`;
            } else if (isPast && missedDate) {
                cls += ' missed';
                const cost = data.free_makeup_used ? '3积分' : '免费';
                const costCls = data.free_makeup_used ? 'paid' : 'free';
                stateHtml = `<button class="pet-sign-card-btn makeup ${costCls}" data-action="makeup" data-date="${missedDate}">补签 · ${cost}</button>`;
            } else if (isFuture) {
                cls += ' future';
                stateHtml = `<div class="pet-sign-card-state future-label">未开启</div>`;
            }

            
            if (isVoucherDay) {
                const voucherCls = 'pet-sign-voucher' + (isSigned ? ' voucher-signed' : '') + (isToday ? ' voucher-today' : '');
                iconHtml = `
                    <div class="pet-sign-voucher-wrap">
                        <div class="${voucherCls}" title="${reward.name}">
                            <img src="${reward.icon}" alt="${reward.name}" class="pet-sign-voucher-icon">
                        </div>
                        ${checkBadge}
                    </div>
                `;
            } else {
                const coinCls = 'pet-sign-coin' + (isSigned ? ' coin-signed' : '') + (isToday ? ' coin-today' : '');
                iconHtml = `
                    <div class="pet-sign-coin-wrap">
                        <img src="img/integration.svg" alt="积分" class="${coinCls}">
                        ${checkBadge}
                    </div>
                `;
            }

            
            let bonusHtml = '';
            if (d === 7) {
                bonusHtml = `<div class="pet-sign-bonus-tag">+30积分</div>`;
            }

            daysHtml.push(`
                <div class="${cls}">
                    <div class="pet-sign-card-top">
                        <div class="pet-sign-day-label">第${d}天</div>
                        ${bonusHtml}
                    </div>
                    ${iconHtml}
                    <div class="pet-sign-card-action">${stateHtml}</div>
                </div>
            `);
        }

        
        const bonusText = data.bonus_30_claimed
            ? `<span class="pet-sign-summary-done"><i class="ri-checkbox-circle-fill"></i> 本周期30积分奖励已领取</span>`
            : (signedCount >= 7 ? `<span class="pet-sign-summary-ready"><i class="ri-sparkling-fill"></i> 已满7天，可领取30积分</span>` : `<span class="pet-sign-summary-progress">本周期已签 <b>${signedCount}</b>/7 天</span>`);

        const freeRemain = data.free_makeup_used ? 0 : 1;
        const makeupHint = freeRemain > 0
            ? `本周期剩余 ${freeRemain} 次免费补签`
            : `免费补签已用完，后续每次补签消耗 3 积分`;

        body.innerHTML = `
            <div class="pet-sign-grid">
                ${daysHtml.join('')}
            </div>
            <div class="pet-sign-summary">
                ${bonusText}
            </div>
        `;

        // 自动将“今天”卡片滚动到可视区域中心，作为左右滑动切换的起点
        try {
            const grid = body.querySelector('.pet-sign-grid');
            const todayCard = body.querySelector('.pet-sign-card.today');
            if (grid && todayCard) {
                requestAnimationFrame(() => {
                    const gridRect = grid.getBoundingClientRect();
                    const cardRect = todayCard.getBoundingClientRect();
                    const left = grid.scrollLeft + (cardRect.left - gridRect.left) - (gridRect.width - cardRect.width) / 2;
                    grid.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
                });
            }
        } catch (e) {}

        
        body.querySelectorAll('.pet-sign-card-btn[data-action="sign"]').forEach(btn => {
            btn.onclick = async () => {
                btn.disabled = true;
                btn.textContent = '签到中...';
                try {
                    await handleSign();
                } catch (e) {
                    btn.disabled = false;
                    btn.textContent = '立即签到';
                }
            };
        });
        body.querySelectorAll('.pet-sign-card-btn[data-action="makeup"]').forEach(btn => {
            btn.onclick = async () => {
                const date = btn.dataset.date;
                btn.disabled = true;
                const old = btn.textContent;
                btn.textContent = '补签中...';
                try {
                    await handleSignMakeup(date);
                } catch (e) {
                    btn.disabled = false;
                    btn.textContent = old;
                }
            };
        });
        showGameTip(makeupHint);
    }

    async function handleSignMakeup(date) {
        try {
            const result = await petApi('/pet/sign-makeup', 'POST', { date });
            showScorePopup(result.score);
            applyExpResult(result);
            loadPetRecords();
            if (result.voucher_reward) showGameTip(result.voucher_reward, 'info');
            if (result.cycle_bonus) showGameTip(`本周期连签7天 +${result.cycle_bonus}积分`, 'info');
            if (result.cost_points > 0) showGameTip(`补签消耗 ${result.cost_points} 积分`, 'info');
            
            refreshSignModalIfOpen(true);
        } catch (error) {
            showGameTip(error.message, 'warn');
            throw error;
        }
    }

    async function refreshSignModalIfOpen(forceReload) {
        if (!signModalOpen) return;
        const overlay = document.getElementById('petSignOverlay');
        if (!overlay) return;

        if (forceReload) {
            try {
                const data = await petApi('/pet/sign-status');
                signModalData = data;
                const close = () => {
                    signModalOpen = false;
                    signModalData = null;
                    overlay.classList.remove('active');
                    setTimeout(() => overlay.remove(), 250);
                    
                    if (!petState.myDailyStats || !petState.myDailyStats.sign_done) {
                        const dismissKey = 'signModalDismissed_' + getBeijingDateStr();
                        localStorage.setItem(dismissKey, '1');
                        updateSignDot(true);
                    }
                };
                renderSignModalBody(overlay, data, close);
            } catch (e) {  }
            return;
        }

        if (signModalData) {
            if (petState.myDailyStats.sign_done && !signModalData.signed_days.includes(signModalData.day_in_cycle)) {
                signModalData.signed_days.push(signModalData.day_in_cycle);
                signModalData.signed_count = signModalData.signed_days.length;
            }
            const close = () => {
                signModalOpen = false;
                signModalData = null;
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 250);
                
                if (!petState.myDailyStats || !petState.myDailyStats.sign_done) {
                    const dismissKey = 'signModalDismissed_' + getBeijingDateStr();
                    localStorage.setItem(dismissKey, '1');
                    updateSignDot(true);
                }
            };
            renderSignModalBody(overlay, signModalData, close);
        }
    }

    
    async function handleFeed() {
        if (!petState.pet) return;
        const feedCount = petState.myDailyStats.feed_count || 0;
        const feedVouchers = petState.pet.feed_vouchers || 0;
        if (feedCount >= 3 && feedVouchers <= 0) {
            showGameTip('今日免费投喂已用完，可在商城兑换喂食券', 'warn');
            return;
        }

        try {
            const result = await petApi('/pet/feed', 'POST');
            
            showScorePopup(result.score);

            petState.pet.hunger = result.hunger;
            petState.pet.mood = result.mood;
            if (result.feed_vouchers != null) petState.pet.feed_vouchers = result.feed_vouchers;
            applyExpResult(result);
            petState.myDailyStats.feed_count = feedCount + 1;

            const ball = document.querySelector('.pet-slime');
            if (ball) {
                showFeedEffect(ball);
            }

            
            updateStatusBars();
            updateFeedBadge();
            
            loadPetRecords();
            if (taskModalOpen) refreshActiveTab();
            refreshTaskDot();
        } catch (error) {
            showGameTip(error.message, 'warn');
        }
    }

    
    function updateFeedBadge() {
        const feedBtn = document.getElementById('feedBtn');
        const badge = document.getElementById('feedBadge');
        const feedCount = petState.myDailyStats.feed_count || 0;
        const feedVouchers = petState.pet ? (petState.pet.feed_vouchers || 0) : 0;
        const available = feedCount < 3 || feedVouchers > 0;
        if (feedBtn) feedBtn.classList.toggle('done', !available);
        if (badge) badge.textContent = `${Math.max(0, 3 - feedCount) + feedVouchers}`;
    }

    
    let currentTaskData = null;
    let currentTaskTab = 'task';

    function showTaskModal() {
        const old = document.querySelector('.pet-task-overlay');
        if (old) old.remove();
        const overlay = document.createElement('div');
        overlay.className = 'pet-task-overlay active';
        overlay.innerHTML = `
            <div class="pet-task-modal">
                <div class="pet-task-header">
                    <div>
                        <div class="pet-task-title"><i class="ri-clipboard-line"></i> 任务中心</div>
                        <div class="pet-task-summary" id="taskSummary">做任务赚经验，升级你的宠物</div>
                    </div>
                    <button class="pet-task-close" id="taskClose"><i class="ri-close-line"></i></button>
                </div>
                <div class="pet-task-body" id="taskBody">
                    <div class="pet-task-loading">加载中...</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        taskModalOpen = true;
        currentTaskTab = 'task';

        overlay.querySelector('#taskClose').onclick = closeTaskModal;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTaskModal(); });

        loadTaskList();
    }

    function switchTaskTab(tab) {
        if (tab === currentTaskTab) return;
        currentTaskTab = tab;
        document.querySelectorAll('.pet-task-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        const summary = document.getElementById('taskSummary');
        if (tab === 'task') {
            if (summary) summary.textContent = '做任务赚经验，升级你的宠物';
            loadTaskList();
        }
    }

    function closeTaskModal() {
        const overlay = document.querySelector('.pet-task-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 250);
        }
        taskModalOpen = false;
    }

    async function loadTaskList() {
        const body = document.getElementById('taskBody');
        if (!body) return;
        
        if (currentTaskTab !== 'task') return;
        if (body.querySelector('.pet-task-loading')) {
            body.innerHTML = '<div class="pet-task-loading">加载中...</div>';
        }
        try {
            const data = await petApi('/pet/tasks');
            currentTaskData = data;
            if (petState.pet) {
                petState.pet.exp = data.exp;
                petState.pet.total_score = data.exp;
                petState.pet.level = data.level;
                petState.pet.level_progress = data.level_progress;
                if (data.points != null) petState.pet.points = data.points;
            }
            
            syncTaskStatusWithLocal();
            updateTopbar();
        } catch (e) {
            body.innerHTML = `<div class="pet-task-loading">加载失败：${escapeHtml(e.message)}</div>`;
        }
    }

    
    function refreshActiveTab() {
        if (!taskModalOpen) return;
        loadTaskList();
    }

    
    let voucherData = null;
    async function loadExchangePage() {
        if (!shopModalOpen && shopCurrentTab !== 'voucher') return;
        const body = document.getElementById('taskBody');
        if (!body) return;
        if (currentTaskTab !== 'exchange') return;
        body.innerHTML = '<div class="pet-task-loading">加载中...</div>';
        try {
            voucherData = await petApi('/pet/vouchers');
            if (petState.pet) {
                petState.pet.points = voucherData.points;
                petState.pet.feed_vouchers = voucherData.feed_vouchers;
                petState.pet.deworm_vouchers = voucherData.deworm_vouchers;
                petState.pet.bathe_vouchers = voucherData.bathe_vouchers;
                petState.pet.examine_vouchers = voucherData.examine_vouchers;
            }
            renderExchangePage();
            updateTopbar();
        } catch (e) {
            body.innerHTML = `<div class="pet-task-loading">加载失败：${escapeHtml(e.message)}</div>`;
        }
    }

    function renderExchangePage() {
        const body = document.getElementById('taskBody');
        if (!body || !voucherData) return;
        const v = voucherData;
        const d = v.daily || {};
        const lim = v.limits || { feed: 3, deworm: 1, bathe: 1, examine: 1 };
        const cost = v.costs || { feed: 20, deworm: 50, bathe: 50, examine: 50 };

        const items = [
            {
                type: 'feed', name: '喂食券', icon: '<img src="img/can.svg" alt="喂食券">',
                desc: '兑换后可额外投喂宠物一次', voucherCount: v.feed_vouchers,
                today: d.feed_exchanged || 0, limit: lim.feed, cost: cost.feed
            },
            {
                type: 'deworm', name: '驱虫券', icon: '<img src="img/deworm.svg" alt="驱虫券">',
                desc: '凭券给宠物驱虫，+25经验 +20心情', voucherCount: v.deworm_vouchers,
                today: d.deworm_exchanged || 0, limit: lim.deworm, cost: cost.deworm
            },
            {
                type: 'bathe', name: '洗澡券', icon: '<img src="img/shower.svg" alt="洗澡券">',
                desc: '凭券给宠物洗澡，+25经验 +20心情', voucherCount: v.bathe_vouchers,
                today: d.bathe_exchanged || 0, limit: lim.bathe, cost: cost.bathe
            },
            {
                type: 'examine', name: '体检券', icon: '<img src="img/examine.svg" alt="体检券">',
                desc: '凭券给宠物体检，+25经验 +20心情', voucherCount: v.examine_vouchers,
                today: d.examine_exchanged || 0, limit: lim.examine, cost: cost.examine
            }
        ];

        body.innerHTML = `
            <div class="pet-exchange-points">
                <i class="ri-star-fill"></i> 可用积分：<span>${v.points}</span>
            </div>
            <div class="pet-task-section-title">券兑换（每日限量）</div>
            <div class="pet-task-list">
                ${items.map(it => {
                    const remaining = Math.max(0, it.limit - it.today);
                    const canExchange = remaining > 0 && v.points >= it.cost;
                    let btn;
                    if (remaining <= 0) btn = `<button class="pet-task-btn done" disabled>今日已兑完</button>`;
                    else btn = `<button class="pet-task-btn claim" data-exchange="${it.type}" ${canExchange ? '' : 'disabled'}>${canExchange ? '兑换' : '积分不足'}</button>`;
                    return `
                        <div class="pet-task-item pet-exchange-item">
                            <div class="pet-task-icon pet-exchange-icon">${it.icon}</div>
                            <div class="pet-task-info">
                                <div class="pet-task-name">${it.name} <span class="pet-exchange-stock">余 ${it.voucherCount} 张</span></div>
                                <div class="pet-task-desc">${it.desc}</div>
                                <div class="pet-task-progress">今日 ${it.today}/${it.limit} · ${it.cost}积分/张</div>
                            </div>
                            <div class="pet-task-reward">
                                <div class="pet-task-exp"><i class="ri-coin-line"></i> ${it.cost}</div>
                                ${btn}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        body.querySelectorAll('[data-exchange]').forEach(btn => {
            btn.onclick = () => handleExchange(btn.dataset.exchange);
        });
    }

    async function handleExchange(type) {
        if (!voucherData) return;
        try {
            const result = await petApi('/pet/exchange', 'POST', { type });
            showGameTip('兑换成功', 'info');
            // 更新本地积分与券余额
            if (petState.pet) {
                petState.pet.points = result.points;
                if (type === 'feed') petState.pet.feed_vouchers = result.feed_vouchers;
                if (type === 'deworm') petState.pet.deworm_vouchers = result.deworm_vouchers;
                if (type === 'bathe') petState.pet.bathe_vouchers = result.bathe_vouchers;
                if (type === 'examine') petState.pet.examine_vouchers = result.examine_vouchers;
            }
            updateTopbar();
            updateFeedBadge();
            await loadExchangePage();
            loadPetRecords();
        } catch (error) {
            showGameTip(error.message, 'warn');
        }
    }

    // 用前端已知状态修正任务列表（签到/投喂/触摸等已完成的任务强制标记为已完成）
    function syncTaskStatusWithLocal() {
        if (!currentTaskData || !currentTaskData.daily) return;
        const d = currentTaskData.daily;
        // 签到：前端已确认签到成功，直接覆盖（不检查后端返回值）
        if (petState.myDailyStats.sign_done && d.sign) {
            d.sign.done = true;
            d.sign.count = 1;
        }
        // 投喂：前端已知次数
        if (d.feed && petState.myDailyStats.feed_count != null) {
            d.feed.count = petState.myDailyStats.feed_count;
            d.feed.done = petState.myDailyStats.feed_count >= 3;
        }
        renderTaskList(currentTaskData);
        updateTaskDot(currentTaskData);
    }

    // 签到成功后立即更新任务列表中的签到项为"已完成"（不等后端刷新）
    function markSignDoneInTaskList() {
        if (currentTaskData && currentTaskData.daily && currentTaskData.daily.sign) {
            currentTaskData.daily.sign.done = true;
            currentTaskData.daily.sign.count = 1;
            renderTaskList(currentTaskData);
            updateTaskDot(currentTaskData);
        }
    }

    function themeChangedLocally() {
        return (localStorage.getItem('theme_id') || 'default') !== 'default';
    }

    function renderDailyItem(icon, key, label, desc, t) {
        // 签到任务可直接在弹窗内点击完成，其余任务跳转去完成
        const isInline = (key === 'sign');
        const btn = t.done
            ? `<button class="pet-task-btn done">已完成</button>`
            : isInline
                ? `<button class="pet-task-btn claim" data-inline="${key}">签到</button>`
                : `<button class="pet-task-btn go" data-go="${key}">去完成</button>`;
        return `
            <div class="pet-task-item">
                <div class="pet-task-icon ${key}">${icon}</div>
                <div class="pet-task-info">
                    <div class="pet-task-name">${label}</div>
                    <div class="pet-task-desc">${desc}</div>
                    <div class="pet-task-progress">${t.count}/${t.max} · 每次+${t.expPer}经验</div>
                </div>
                <div class="pet-task-reward">
                    <div class="pet-task-exp">+${t.totalExp}</div>
                    ${btn}
                </div>
            </div>
        `;
    }

    function renderTaskList(data) {
        const body = document.getElementById('taskBody');
        if (!body) return;
        const d = data.daily || {};
        const dailyHtml = `
            <div class="pet-task-section-title">每日任务（每日刷新）</div>
            <div class="pet-task-list">
                ${renderDailyItem('<i class="ri-calendar-check-line"></i>', 'sign', '每日签到', '每日签到领经验', d.sign || {count:0,max:1,expPer:2,totalExp:2,done:false})}
                ${renderDailyItem('<i class="ri-restaurant-line"></i>', 'feed', '投喂宠物', '点击投喂按钮喂食宠物', d.feed || {count:0,max:3,expPer:2,totalExp:6,done:false})}
                ${renderDailyItem('<i class="ri-wallet-line"></i>', 'bill', '记一笔账', '新增一笔账单记录', d.bill || {count:0,max:3,expPer:2,totalExp:6,done:false})}
                ${renderDailyItem('<i class="ri-chat-3-line"></i>', 'comment', '评论账单', '在账单详情发表评论', d.comment || {count:0,max:3,expPer:2,totalExp:6,done:false})}
            </div>
        `;

        const iconMap = { avatar: '<i class="ri-image-line"></i>', profile: '<i class="ri-user-line"></i>', theme: '<i class="ri-palette-line"></i>' };
        const achHtml = `
            <div class="pet-task-section-title">成就任务（仅一次）</div>
            <div class="pet-task-list">
                ${(data.achievements || []).map(a => {
                    const canClaim = a.canClaim && (a.type !== 'theme' || themeChangedLocally());
                    let btn;
                    if (a.done) btn = `<button class="pet-task-btn done">已领取</button>`;
                    else if (canClaim) btn = `<button class="pet-task-btn claim" data-claim="${a.type}">领取</button>`;
                    else btn = `<button class="pet-task-btn go" data-go="ach-${a.type}">去完成</button>`;
                    return `
                        <div class="pet-task-item">
                            <div class="pet-task-icon ${a.type}">${iconMap[a.type] || '<i class="ri-star-line"></i>'}</div>
                            <div class="pet-task-info">
                                <div class="pet-task-name">${a.title}</div>
                                <div class="pet-task-desc">${a.desc}</div>
                            </div>
                            <div class="pet-task-reward">
                                <div class="pet-task-exp">+${a.exp}</div>
                                ${btn}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        body.innerHTML = dailyHtml + achHtml;

        body.querySelectorAll('[data-claim]').forEach(btn => {
            btn.onclick = () => claimTask(btn.dataset.claim);
        });
        body.querySelectorAll('[data-go]').forEach(btn => {
            btn.onclick = () => handleTaskGo(btn.dataset.go);
        });
        body.querySelectorAll('[data-inline]').forEach(btn => {
            btn.onclick = () => handleInlineTask(btn.dataset.inline);
        });

        const summary = document.getElementById('taskSummary');
        if (summary) {
            const lp = data.level_progress || {};
            summary.textContent = lp.maxed
                ? `已满级 Lv.20 · 经验 ${data.exp}`
                : `Lv.${data.level} · 经验 ${data.exp} · 距下级 ${lp.toNext}`;
        }

        updateTaskDot(data);
    }

    function updateTaskDot(data) {
        const dot = document.getElementById('taskDot');
        if (!dot) return;
        const hasClaimable = (data.achievements || []).some(a => a.canClaim && (a.type !== 'theme' || themeChangedLocally()) && !a.done);
        const hasDailyTodo = Object.values(data.daily || {}).some(t => !t.done);
        dot.style.display = (hasClaimable || hasDailyTodo) ? '' : 'none';
    }

    
    function updateSignDot(show) {
        const dot = document.getElementById('signDot');
        if (!dot) return;
        const todaySigned = petState.myDailyStats && petState.myDailyStats.sign_done;
        dot.style.display = (!todaySigned && show) ? '' : 'none';
    }

    async function refreshTaskDot() {
        try {
            const data = await petApi('/pet/tasks');
            currentTaskData = data;
            if (petState.pet) {
                petState.pet.exp = data.exp;
                petState.pet.total_score = data.exp;
                petState.pet.level = data.level;
                petState.pet.level_progress = data.level_progress;
            }
            updateTaskDot(data);
            updateTopbar();
        } catch (e) {  }
    }

    
    async function handleInlineTask(key) {
        if (key === 'sign') {
            if (petState.myDailyStats.sign_done) {
                showGameTip('今日已签到', 'warn');
                
                markSignDoneInTaskList();
                return;
            }
            try {
                const result = await petApi('/pet/sign', 'POST');
                showScorePopup(result.score);
                applyExpResult(result);
                petState.myDailyStats.sign_done = 1;
                if (petState.signStatus) petState.signStatus.today_signed = true;
                const signBtn = document.getElementById('signBtn');
                if (signBtn) signBtn.classList.add('done');
                
                const dismissKey = 'signModalDismissed_' + getBeijingDateStr();
                localStorage.removeItem(dismissKey);
                updateSignDot(false);
                loadPetRecords();
                markSignDoneInTaskList();
                await loadTaskList(); 
                
                refreshSignModalIfOpen(true);
                if (result.voucher_reward) showGameTip(result.voucher_reward, 'info');
                if (result.cycle_bonus) showGameTip(`本周期连签7天 +${result.cycle_bonus}积分`, 'info');
            } catch (error) {
                showGameTip(error.message, 'warn');
            }
        }
    }

    function handleTaskGo(key) {
        closeTaskModal();
        if (key === 'sign') { showGameTip('点击签到按钮即可'); return; }
        if (key === 'feed') { showGameTip('点击下方投喂按钮即可'); return; }
        if (key === 'bill') { showGameTip('去记一笔账单吧'); closePetPage(); if (typeof showPage === 'function') showPage('home'); return; }
        if (key === 'comment') { showGameTip('打开一笔账单发表评论'); closePetPage(); if (typeof showPage === 'function') showPage('home'); return; }
        if (typeof key === 'string' && key.startsWith('ach-')) {
            closePetPage();
            if (typeof showPage === 'function') showPage('profile');
        }
    }

    async function claimTask(taskType) {
        try {
            const result = await petApi('/pet/task/claim', 'POST', { task_type: taskType });
            
            showScorePopup(result.score);
            applyExpResult(result);
            
            await loadTaskList();
            loadPetRecords();
        } catch (e) {
            showGameTip(e.message, 'warn');
        }
    }

    
    async function loadPetRecords() {
        try {
            const data = await petApi('/pet/records');
            
            const raw = data.records || [];
            petRecords = (Array.isArray(raw) ? raw : (raw.results || [])).slice(0, 5);
            renderRecords();
        } catch (error) {
            console.error('加载记录失败:', error);
            const container = document.getElementById('petRecordsList');
            if (container) {
                container.innerHTML = `
                    <div class="pet-records-empty">
                        <div class="pet-records-empty-icon"><i class="ri-alert-line"></i></div>
                        <div class="pet-records-empty-text">记录加载失败，请稍后重试</div>
                    </div>
                `;
            }
        }
    }

    
    function showRecordsModal() {
        const old = document.querySelector('.pet-records-overlay');
        if (old) old.remove();
        const overlay = document.createElement('div');
        overlay.className = 'pet-records-overlay active';
        overlay.innerHTML = `
            <div class="pet-task-modal pet-records-modal">
                <div class="pet-task-header">
                    <div>
                        <div class="pet-task-title"><i class="ri-history-line"></i> 活动记录</div>
                        <div class="pet-task-summary">看看你们一起照顾宠物的时光</div>
                    </div>
                    <button class="pet-task-close" id="recordsClose"><i class="ri-close-line"></i></button>
                </div>
                <div class="pet-task-body pet-records-body">
                    <div class="pet-records-list" id="petRecordsList">
                        <div class="pet-records-empty">
                            <div class="pet-records-empty-icon"><i class="ri-file-list-3-line"></i></div>
                            <div class="pet-records-empty-text">加载中...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 250);
        };
        overlay.querySelector('#recordsClose').onclick = close;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        loadPetRecords();
    }

    function renderRecords() {
        const container = document.getElementById('petRecordsList');
        if (!container) return;

        if (petRecords.length === 0) {
            container.innerHTML = `
                <div class="pet-records-empty">
                    <div class="pet-records-empty-icon"><i class="ri-file-list-3-line"></i></div>
                    <div class="pet-records-empty-text">暂无记录</div>
                </div>
            `;
            return;
        }

        const actionMap = {
            adopt: { text: '领养了宠物' },
            sign: { text: '每日签到' },
            feed: { text: '投喂了宠物' },
            touch: { text: '抚摸了宠物' },
            play: { text: '和宠物玩耍' },
            bathe: { text: '给宠物洗澡' },
            deworm: { text: '给宠物驱虫' },
            examine: { text: '给宠物体检' },
            exchange: { text: '兑换了券' },
            bill: { text: '记账奖励' },
            comment: { text: '评论奖励' },
            avatar: { text: '更换头像奖励' },
            profile: { text: '完善信息奖励' },
            theme: { text: '更换主题奖励' }
        };

        container.innerHTML = petRecords.map(record => {
            const action = actionMap[record.action] || { text: record.description || record.action };
            const score = record.score || 0;
            const date = parseRecordTime(record.created_at);
            const timeStr = formatTime(date);
            
            const descText = record.description ? escapeHtml(record.description) : action.text;
            const userName = record.nickname ? escapeHtml(record.nickname) : '宠物主人';

            return `
                <div class="pet-record-item">
                    <div class="pet-record-info">
                        <div class="pet-record-head"><span class="pet-record-user">${userName}</span><span class="pet-record-time">${timeStr}</span></div>
                        <div class="pet-record-desc">${descText}</div>
                    </div>
                    ${score > 0 ? `<div class="pet-record-score">+${score}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // ===== 特效 =====
    function showFeedEffect(ballElement) {
        const container = ballElement.closest('.pet-cat-container');
        if (!container) return;

        const icon = document.createElement('div');
        icon.className = 'pet-feed-icon';
        icon.innerHTML = '<i class="ri-restaurant-line" style="color:#FF7043;"></i>';
        icon.style.position = 'absolute';
        icon.style.left = '50%';
        icon.style.top = '20%';
        icon.style.transform = 'translateX(-50%)';
        icon.style.zIndex = '100';
        icon.style.pointerEvents = 'none';
        icon.style.animation = 'feedFloat 0.8s ease-out forwards';

        const effect = document.createElement('div');
        effect.className = 'pet-feed-effect';
        effect.style.position = 'absolute';
        effect.style.left = '0';
        effect.style.top = '0';
        effect.style.width = '100%';
        effect.style.height = '100%';
        effect.style.pointerEvents = 'none';
        effect.appendChild(icon);
        container.appendChild(effect);
        setTimeout(() => effect.remove(), 800);
    }

    // ===== 宠物设置 =====
    function getPetSettings() {
        try {
            return JSON.parse(localStorage.getItem('petSettings')) || { autoFeed: false, floatingPet: false };
        } catch (e) {
            return { autoFeed: false, floatingPet: false };
        }
    }

    function savePetSettings(settings) {
        localStorage.setItem('petSettings', JSON.stringify(settings));
    }

    function showPetSettings() {
        const existing = document.querySelector('.pet-settings-overlay');
        if (existing) existing.remove();

        const settings = getPetSettings();
        const overlay = document.createElement('div');
        overlay.className = 'pet-settings-overlay';
        overlay.innerHTML = `
            <div class="pet-settings-modal">
                <div class="pet-settings-title">宠物设置</div>
                <div class="pet-settings-item">
                    <div class="pet-settings-item-info">
                        <div class="pet-settings-item-label">自动喂食</div>
                        <div class="pet-settings-item-desc">饥饿值低于30%时自动投喂（需有可用次数）</div>
                    </div>
                    <button class="pet-settings-toggle ${settings.autoFeed ? 'on' : ''}" id="autoFeedToggle" aria-label="自动喂食开关"></button>
                </div>
                <div class="pet-settings-item">
                    <div class="pet-settings-item-info">
                        <div class="pet-settings-item-label">桌面陪伴</div>
                        <div class="pet-settings-item-desc">开启后宠物在记账页面陪伴你</div>
                    </div>
                    <button class="pet-settings-toggle ${settings.floatingPet ? 'on' : ''}" id="floatingPetToggle" aria-label="桌面陪伴开关"></button>
                </div>
                <button class="pet-settings-close-btn" id="petSettingsClose">完成</button>
            </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        const autoFeedToggle = overlay.querySelector('#autoFeedToggle');
        const floatingPetToggle = overlay.querySelector('#floatingPetToggle');

        autoFeedToggle.addEventListener('click', () => {
            settings.autoFeed = !settings.autoFeed;
            autoFeedToggle.classList.toggle('on', settings.autoFeed);
            savePetSettings(settings);
            if (settings.autoFeed) checkAutoFeed();
        });

        floatingPetToggle.addEventListener('click', () => {
            settings.floatingPet = !settings.floatingPet;
            floatingPetToggle.classList.toggle('on', settings.floatingPet);
            savePetSettings(settings);
            if (settings.floatingPet) {
                showFloatingPet();
            } else {
                hideFloatingPet();
            }
        });

        overlay.querySelector('#petSettingsClose').addEventListener('click', closePetSettings);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePetSettings();
        });
    }

    function closePetSettings() {
        const overlay = document.querySelector('.pet-settings-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 200);
    }

    function checkAutoFeed() {
        if (!petState.hasPet || !petState.pet) return;
        const settings = getPetSettings();
        if (!settings.autoFeed) return;
        const hunger = petState.pet.hunger || 0;
        const feedCount = petState.myDailyStats.feed_count || 0;
        const feedVouchers = petState.pet.feed_vouchers || 0;
        if (hunger < 30 && (feedCount < 3 || feedVouchers > 0)) {
            handleFeed();
        }
    }

    // ===== 悬浮宠物 =====
    let floatingPetEl = null;
    let floatingPetBubbleTimer = null;
    let floatingPetPos = { x: null, y: null };
    let floatingFacingFlipped = true; // 桌面宠物朝向：true=镜像（朝左）/ false=原始（朝右）；由所在屏幕半区决定，非点击切换
    let dragState = { active: false, dragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false, longPressFired: false, longPressTimer: null };
    const FLOATING_PET_MESSAGES = ['喵~', '陪你记账~', '加油！', '想吃东西...', '主人好~', '呼噜噜~'];

    function saveFloatingPos() {
        try {
            localStorage.setItem('petFloatingPos', JSON.stringify(floatingPetPos));
        } catch (e) {}
    }

    function loadFloatingPos() {
        try {
            const saved = JSON.parse(localStorage.getItem('petFloatingPos'));
            if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
                floatingPetPos = saved;
                return true;
            }
        } catch (e) {}
        return false;
    }

    function applyFloatingPos() {
        if (!floatingPetEl) return;
        if (floatingPetPos.x !== null && floatingPetPos.y !== null) {
            floatingPetEl.style.left = floatingPetPos.x + 'px';
            floatingPetEl.style.top = floatingPetPos.y + 'px';
            floatingPetEl.style.right = 'auto';
            floatingPetEl.style.bottom = 'auto';
        } else {
            const bounds = { left: (window.innerWidth - Math.min(window.innerWidth, 480)) / 2, right: (window.innerWidth - Math.min(window.innerWidth, 480)) / 2 + Math.min(window.innerWidth, 480) };
            const pw = floatingPetEl.offsetWidth || 88;
            const ph = floatingPetEl.offsetHeight || 88;
            floatingPetEl.style.left = (bounds.right - pw - 16) + 'px';
            floatingPetEl.style.top = (window.innerHeight - 80 - ph) + 'px';
            floatingPetEl.style.right = 'auto';
            floatingPetEl.style.bottom = 'auto';
        }
        updateFloatingFacing();
    }

    // 根据宠物中心点落在屏幕左/右半区（观者视角），决定朝向：
    // 右半区 → 镜像翻转；左半区 → 原始方向（“右侧保持、左侧换方向”，按观者左右）。
    // 翻转作用在内层 .pet-floating-inner 上，点击时的开心表情也会同步翻转。
    function updateFloatingFacing() {
        if (!floatingPetEl) return;
        const inner = floatingPetEl.querySelector('.pet-floating-inner');
        if (!inner) return;
        const rect = floatingPetEl.getBoundingClientRect();
        // 元素尚未布局（如创建瞬间仍为 display:none）时 rect 为 0，跳过以免误判朝向
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const centerX = rect.left + rect.width / 2;
        const isLeft = centerX < window.innerWidth / 2;
        floatingFacingFlipped = !isLeft; // 右半区翻转，左半区不翻转
        inner.classList.toggle('flipped', floatingFacingFlipped);
    }

    function createFloatingPet() {
        if (floatingPetEl && document.body.contains(floatingPetEl)) return;
        if (!petState.hasPet || !petState.pet) return;
        if (!window.CatSVG) return;

        floatingPetEl = document.createElement('div');
        floatingPetEl.className = 'pet-floating';
        floatingPetEl.id = 'petFloating';
        const variant = getCatVariant();
        floatingPetEl.innerHTML = `
            <div class="pet-floating-inner${floatingFacingFlipped ? ' flipped' : ''}">
                ${window.CatSVG('pet-cat-avatar-svg', variant)}
            </div>
            <div class="pet-floating-bubble" id="petFloatingBubble"></div>
        `;
        document.body.appendChild(floatingPetEl);

        loadFloatingPos();
        applyFloatingPos();

        bindFloatingDrag();
    }

    function bindFloatingDrag() {
        if (!floatingPetEl) return;

        function getAppBounds() {
            const maxW = Math.min(window.innerWidth, 480);
            const left = (window.innerWidth - maxW) / 2;
            return { left: left, right: left + maxW, top: 0, bottom: window.innerHeight, width: maxW };
        }

        function onStart(e) {
            // 仅响应鼠标左键，避免右键/中键误触发
            if (e.button !== undefined && e.button !== 0) return;
            const touch = e.touches ? e.touches[0] : e;
            dragState.active = true;
            dragState.dragging = false;
            dragState.moved = false;
            dragState.startX = touch.clientX;
            dragState.startY = touch.clientY;
        }

        function onMove(e) {
            if (!dragState.active) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - dragState.startX;
            const dy = touch.clientY - dragState.startY;
            // 移动超过阈值（8px）才判定为拖动，容忍手指/鼠标轻微抖动，避免吞掉点击
            if (!dragState.moved && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                dragState.moved = true;
            }
            if (dragState.moved && !dragState.dragging) {
                dragState.dragging = true;
                floatingPetEl.classList.add('dragging');
            }
            if (!dragState.dragging) return;
            if (e.cancelable) e.preventDefault();
            const bounds = getAppBounds();
            const w = floatingPetEl.offsetWidth;
            const h = floatingPetEl.offsetHeight;
            let nx = touch.clientX - w / 2;
            let ny = touch.clientY - h / 2;
            nx = Math.max(bounds.left, Math.min(bounds.right - w, nx));
            ny = Math.max(bounds.top, Math.min(bounds.bottom - h, ny));
            floatingPetEl.style.left = nx + 'px';
            floatingPetEl.style.top = ny + 'px';
            floatingPetEl.style.right = 'auto';
            floatingPetEl.style.bottom = 'auto';
            updateFloatingFacing();
        }

        function onEnd() {
            if (!dragState.active) return;
            dragState.active = false;
            floatingPetEl.classList.remove('dragging');
            if (dragState.moved) {
                // 真实拖动：保存位置，不触发交互
                dragState.dragging = false;
                const rect = floatingPetEl.getBoundingClientRect();
                floatingPetPos = { x: rect.left, y: rect.top };
                saveFloatingPos();
                updateFloatingFacing();
            } else {
                // 未发生拖动 = 一次点击：触发开心表情 + 说话（与游戏页内一致）
                dragState.dragging = false;
                triggerFloatingPetInteraction();
            }
        }

        // 触摸：事件锁定在元素上；touchmove 需可取消以阻止页面滚动
        floatingPetEl.addEventListener('touchstart', onStart, { passive: true });
        floatingPetEl.addEventListener('touchmove', onMove, { passive: false });
        floatingPetEl.addEventListener('touchend', onEnd);
        floatingPetEl.addEventListener('touchcancel', onEnd);
        // 鼠标：move/up 绑在 document，移出元素也不丢失
        floatingPetEl.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
    }

    function triggerFloatingPetInteraction() {
        if (!floatingPetEl) return;
        // 开心表情 + 说话（happy 在 petFloatingSpeak 内统一处理；朝向由 .flipped 决定，不在此切换方向）
        showFloatingBubble();
    }

    // 让桌面宠物做出“开心表情”（眯眼/张嘴/摇尾），不改变朝向
    function triggerFloatingHappy() {
        if (!floatingPetEl) return;
        const inner = floatingPetEl.querySelector('.pet-floating-inner');
        if (!inner) return;
        inner.classList.remove('happy');
        void inner.offsetWidth;
        inner.classList.add('happy');
        setTimeout(() => inner.classList.remove('happy'), 2000);
    }

    // 让桌面宠物“说话”：传入 message 则显示指定文字，否则随机闲聊。
    // 仅当桌面宠物已开启且当前可见时生效，返回 true 表示已由宠物气泡接管该提示。
    // 同时触发开心表情（记账 toast / 点击互动均走这里）。
    function petFloatingSpeak(message, duration) {
        if (!floatingPetEl || !floatingPetEl.classList.contains('show')) return false;
        const bubble = floatingPetEl.querySelector('#petFloatingBubble');
        if (!bubble) return false;
        if (floatingPetBubbleTimer) clearTimeout(floatingPetBubbleTimer);
        const text = (message && String(message).trim())
            ? message
            : FLOATING_PET_MESSAGES[Math.floor(Math.random() * FLOATING_PET_MESSAGES.length)];
        bubble.textContent = text;
        bubble.classList.add('show');
        floatingPetBubbleTimer = setTimeout(() => bubble.classList.remove('show'), duration || 2500);
        triggerFloatingHappy();
        return true;
    }
    window.petFloatingSpeak = petFloatingSpeak;

    // 登录 / 进入主页时的宠物欢迎语（带开心表情）
    // 若桌面宠物此刻尚未加载可见，则登记“待播”，轮询等待其出现后再说，
    // 避免登录/进 app 时宠物没加载完导致欢迎语丢失。
    let pendingWelcomeTimer = null;
    let pendingWelcomeIsLogin = false;

    function clearPendingWelcome() {
        if (pendingWelcomeTimer) {
            clearInterval(pendingWelcomeTimer);
            pendingWelcomeTimer = null;
        }
    }

    function petFloatingWelcome(isLogin) {
        if (floatingPetEl && floatingPetEl.classList.contains('show')) {
            clearPendingWelcome();
            triggerFloatingHappy();
            let name = '';
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                name = u.nickname || u.username || '';
            } catch (e) {}
            const msg = isLogin
                ? (name ? ('欢迎回来，' + name + '~') : '欢迎回来~')
                : '回到主页啦~';
            petFloatingSpeak(msg, 3500);
            return true;
        }
        // 宠物尚未可见：登记待播，待其显示后再触发（最多等待约 6s，未开启则自动放弃）
        pendingWelcomeIsLogin = !!isLogin;
        if (!pendingWelcomeTimer) {
            let tries = 0;
            pendingWelcomeTimer = setInterval(() => {
                tries++;
                if (floatingPetEl && floatingPetEl.classList.contains('show')) {
                    const login = pendingWelcomeIsLogin;
                    clearInterval(pendingWelcomeTimer);
                    pendingWelcomeTimer = null;
                    petFloatingWelcome(login);
                } else if (tries > 30) {
                    clearInterval(pendingWelcomeTimer);
                    pendingWelcomeTimer = null;
                }
            }, 200);
        }
        return false;
    }
    window.petFloatingWelcome = petFloatingWelcome;

    // 点击桌面宠物时的随机闲聊气泡（无 message 时随机）
    function showFloatingBubble() {
        petFloatingSpeak();
    }

    function showFloatingPet() {
        const settings = getPetSettings();
        if (!settings.floatingPet) return;
        if (!petState.hasPet || !petState.pet) return;
        // 进入宠物游戏页（#page-pet）时不显示桌面宠物，避免叠在游戏上
        const pagePet = document.getElementById('page-pet');
        if (pagePet && pagePet.classList.contains('active')) return;
        if (!floatingPetEl || !document.body.contains(floatingPetEl)) createFloatingPet();
        if (floatingPetEl) {
            floatingPetEl.classList.add('show');
            // 显示后再按真实位置重算朝向：create 时元素为 display:none，
            // getBoundingClientRect 为 0 会误判，导致刷新后朝向错乱。
            requestAnimationFrame(() => updateFloatingFacing());
        }
    }

    function hideFloatingPet() {
        if (floatingPetEl) floatingPetEl.classList.remove('show');
        clearPendingWelcome();
    }

    function removeFloatingPet() {
        if (floatingPetEl) {
            floatingPetEl.remove();
            floatingPetEl = null;
        }
    }

    function updateFloatingPetVariant() {
        if (!floatingPetEl) return;
        const variant = getCatVariant();
        const inner = floatingPetEl.querySelector('.pet-floating-inner');
        if (inner && window.CatSVG) {
            inner.setAttribute('data-variant', variant);
            inner.style.setProperty('--cat-accent', getCatAccent(variant));
            inner.innerHTML = window.CatSVG('pet-cat-avatar-svg', variant);
        }
    }

    // ===== 初始化 =====
    function injectEntryCardCat() {
        const slime = document.getElementById('petAvatarSlime') || document.querySelector('.pet-avatar-slime');
        if (!slime) return;
        // 未领养：显示 adopt.svg 占位图
        if (!petState.hasPet || !petState.pet) {
            slime.removeAttribute('data-catInjected');
            slime.removeAttribute('data-variant');
            slime.innerHTML = `<img src="img/adopt.svg" alt="等待领养" style="width:100%;height:100%;object-fit:contain;">`;
            return;
        }
        if (slime.dataset.catInjected) return;
        if (!(window.CatSVG && typeof window.CatSVG === 'function')) return;
        var variant = getCatVariant();
        slime.setAttribute('data-variant', variant);
        slime.style.setProperty('--cat-accent', getCatAccent(variant));
        slime.innerHTML = `
            ${window.CatSVG('pet-cat-avatar-svg', variant)}
            <div class="pet-avatar-eyes">
                <div class="pet-avatar-eye left"></div>
                <div class="pet-avatar-eye right"></div>
            </div>
        `;
        slime.dataset.catInjected = '1';
    }

    function initPet() {
        injectEntryCardCat();

        const backBtn = document.getElementById('petBackBtn');
        if (backBtn) backBtn.onclick = closePetPage;

        const settingsBtn = document.getElementById('petSettingsBtn');
        if (settingsBtn) settingsBtn.onclick = showPetSettings;

        if (petEntryCard) {
            petEntryCard.addEventListener('click', () => {
                if (petEntryCard.classList.contains('hidden')) return;
                openPetPage();
            });
        }
    }

    // 系统返回键：逐层关闭游戏内弹窗/覆盖层（返回 true 表示已处理）
    function handlePetBack() {
        // 0) 宠物设置
        var settingsOverlay = document.querySelector('.pet-settings-overlay.active');
        if (settingsOverlay) {
            closePetSettings();
            return true;
        }
        // 1) 生日选择器
        var birthdayPicker = document.querySelector('.pet-birthday-picker-overlay.active');
        if (birthdayPicker) {
            birthdayPicker.classList.remove('active');
            setTimeout(function () { if (birthdayPicker.parentNode) birthdayPicker.remove(); }, 200);
            return true;
        }
        
        var setupOverlay = document.querySelector('.pet-setup-overlay.active');
        if (setupOverlay) {
            setupOverlay.remove();
            if (typeof refreshStatusBar === 'function') refreshStatusBar();
            return true;
        }
        
        var infoPopup = document.querySelector('.pet-info-popup-overlay.active');
        if (infoPopup) {
            infoPopup.classList.remove('active');
            setTimeout(function () { if (infoPopup.parentNode) infoPopup.remove(); }, 200);
            return true;
        }
        
        var confirmOverlay = document.getElementById('petConfirmOverlay');
        if (confirmOverlay && confirmOverlay.classList.contains('active')) {
            var cancelBtn = confirmOverlay.querySelector('.pet-confirm-btn.cancel');
            if (cancelBtn) cancelBtn.click();
            else { confirmOverlay.classList.remove('active'); setTimeout(function () { confirmOverlay.remove(); }, 200); }
            return true;
        }
        
        var catSkinOverlay = document.getElementById('catSkinOverlay');
        if (catSkinOverlay && catSkinOverlay.classList.contains('active')) {
            catSkinOverlay.classList.remove('active');
            return true;
        }
        
        var signOverlay = document.querySelector('.pet-sign-overlay.active');
        if (signOverlay) {
            var signCloseBtn = document.getElementById('petSignClose');
            if (signCloseBtn) signCloseBtn.click();
            else { signOverlay.classList.remove('active'); setTimeout(function () { signOverlay.remove(); }, 250); }
            return true;
        }
        
        var recordsOverlay = document.querySelector('.pet-records-overlay.active');
        if (recordsOverlay) {
            var recordsCloseBtn = document.getElementById('recordsClose');
            if (recordsCloseBtn) recordsCloseBtn.click();
            else { recordsOverlay.classList.remove('active'); setTimeout(function () { recordsOverlay.remove(); }, 250); }
            return true;
        }
        
        if (document.querySelector('.pet-task-overlay.active')) {
            closeTaskModal();
            return true;
        }
        
        if (document.querySelector('.pet-shop-overlay.active')) {
            closeShopModal();
            return true;
        }
        
        if (document.querySelector('.pet-bag-overlay.active')) {
            closeBagModal();
            return true;
        }
        return false;
    }

    
    window.PetSystem = {
        init: initPet,
        loadStatus: loadPetStatus,
        renderPage: renderPetPage,
        openPage: openPetPage,
        closePage: closePetPage,
        handleBack: handlePetBack,
        showFloating: showFloatingPet,
        hideFloating: hideFloatingPet,
        removeFloating: removeFloatingPet,
        updateFloatingVariant: updateFloatingPetVariant,
        getState: () => petState,
        async addBillScore(billId) {
            try {
                const result = await petApi('/pet/bill-score', 'POST', { billId });
                if (result.score) {
                    showGameTip(`记账奖励 +${result.score}积分`);
                    showScorePopup(result.score);
                }
                applyExpResult(result);
                refreshTaskModalIfOpen();
                return result;
            } catch (error) {
                console.error('记账积分失败:', error);
                return null;
            }
        },
        
        applyCommentExp(petExp) {
            if (!petExp || !petExp.score) return;
            showGameTip(`评论奖励 +${petExp.score}经验`);
            showScorePopup(petExp.score);
            applyExpResult(petExp);
            if (petState.myDailyStats) {
                petState.myDailyStats.comment_count = (petState.myDailyStats.comment_count || 0) + 1;
            }
            refreshTaskModalIfOpen();
        }
    };
})();
