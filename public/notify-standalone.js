/**
 * notify-standalone.js
 * ระบบแจ้งเตือน (Popup / Toast) แบบไม่พึ่งไลบรารีภายนอกใดๆ เลย
 * ใช้ pure JavaScript + CSS ที่ฝังมาในไฟล์นี้ทั้งหมด
 *
 * วิธีใช้: โหลดไฟล์นี้ไฟล์เดียวพอ
 *   <script src="notify-standalone.js"></script>
 *
 * แล้วเรียกใช้ได้เลย:
 *   notify('success', 'สำเร็จ', 'บันทึกข้อมูลเรียบร้อยแล้ว');
 *   notifyToast('success', 'บันทึกแล้ว');
 *   confirmAndSubmit({ url: '/api/save', data: {id:1}, onSuccess: (res)=>{} });
 */
(function () {
    // ---------- ฝัง CSS ----------
    const style = document.createElement('style');
    style.textContent = `
    .ntf-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; opacity: 0; transition: opacity .15s ease;
    }
    .ntf-overlay.ntf-show { opacity: 1; }
    .ntf-box {
        background: #fff; border-radius: 12px; padding: 28px 24px;
        width: 90%; max-width: 360px; text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,.25);
        transform: scale(.85); transition: transform .15s ease;
        font-family: 'Segoe UI', Tahoma, sans-serif;
    }
    .ntf-overlay.ntf-show .ntf-box { transform: scale(1); }
    .ntf-icon {
        width: 56px; height: 56px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 14px; font-size: 28px; color: #fff;
    }
    .ntf-icon.success { background: #4caf50; }
    .ntf-icon.error   { background: #f44336; }
    .ntf-icon.warning { background: #ff9800; }
    .ntf-icon.info    { background: #2196f3; }
    .ntf-title { font-size: 19px; font-weight: 700; margin-bottom: 6px; color: #222; }
    .ntf-text  { font-size: 14px; color: #555; margin-bottom: 18px; white-space: pre-wrap; }
    .ntf-btns { display: flex; gap: 10px; justify-content: center; }
    .ntf-btn {
        border: none; border-radius: 6px; padding: 9px 22px;
        font-size: 14px; cursor: pointer; font-weight: 600;
    }
    .ntf-btn-confirm { background: #3085d6; color: #fff; }
    .ntf-btn-cancel  { background: #d33; color: #fff; }
    .ntf-btn:hover { filter: brightness(0.92); }

    .ntf-toast-wrap {
        position: fixed; top: 16px; right: 16px; z-index: 99999;
        display: flex; flex-direction: column; gap: 8px;
    }
    .ntf-toast {
        background: #fff; border-left: 5px solid #4caf50; border-radius: 6px;
        padding: 12px 16px; min-width: 220px; box-shadow: 0 6px 18px rgba(0,0,0,.18);
        font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 14px; color: #222;
        display: flex; align-items: center; gap: 8px;
        opacity: 0; transform: translateX(20px); transition: all .2s ease;
    }
    .ntf-toast.ntf-show { opacity: 1; transform: translateX(0); }
    .ntf-toast.error   { border-left-color: #f44336; }
    .ntf-toast.warning { border-left-color: #ff9800; }
    .ntf-toast.info    { border-left-color: #2196f3; }

    .ntf-spinner {
        width: 40px; height: 40px; border-radius: 50%;
        border: 4px solid rgba(0,0,0,.1); border-top-color: #2196f3;
        margin: 0 auto 16px; animation: ntf-spin .7s linear infinite;
    }
    @keyframes ntf-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    const ICONS = { success: '✓', error: '✕', warning: '!', info: 'i' };

    window.notify = function (type, title, message, onClose) {
        const overlay = document.createElement('div');
        overlay.className = 'ntf-overlay';
        overlay.innerHTML = `
            <div class="ntf-box">
                <div class="ntf-icon ${type}">${ICONS[type] || ICONS.info}</div>
                <div class="ntf-title">${title}</div>
                <div class="ntf-text">${message || ''}</div>
                <div class="ntf-btns">
                    <button class="ntf-btn ntf-btn-confirm" data-close>ตกลง</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('ntf-show'));

        function close() {
            overlay.classList.remove('ntf-show');
            setTimeout(() => {
                overlay.remove();
                if (typeof onClose === 'function') onClose();
            }, 150);
        }
        overlay.querySelector('[data-close]').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    };

    // notifyLoading('กำลังตรวจสอบ...', 'กำลังเชื่อมต่อ Roblox') -> คืน { close() } ให้ปิดเองตอนโหลดเสร็จ
    // ไม่มีปุ่มกด/กดพื้นหลังปิดไม่ได้ เพราะเป็นสถานะ "กำลังรอ" เท่านั้น ต้องปิดผ่านโค้ดเสมอ
    window.notifyLoading = function (title, message) {
        const overlay = document.createElement('div');
        overlay.className = 'ntf-overlay';
        overlay.innerHTML = `
            <div class="ntf-box">
                <div class="ntf-spinner"></div>
                <div class="ntf-title">${title}</div>
                <div class="ntf-text">${message || ''}</div>
            </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('ntf-show'));

        let closed = false;
        function close() {
            if (closed) return;
            closed = true;
            overlay.classList.remove('ntf-show');
            setTimeout(() => overlay.remove(), 150);
        }
        return { close };
    };

    window.notifyToast = function (type, title) {
        let wrap = document.querySelector('.ntf-toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'ntf-toast-wrap';
            document.body.appendChild(wrap);
        }
        const toast = document.createElement('div');
        toast.className = 'ntf-toast ' + type;
        toast.innerHTML = `<span>${ICONS[type] || ICONS.info}</span><span>${title}</span>`;
        wrap.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('ntf-show'));

        setTimeout(() => {
            toast.classList.remove('ntf-show');
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    };

    window.notifyConfirm = function (title, text, onConfirm, confirmLabel) {
        const overlay = document.createElement('div');
        overlay.className = 'ntf-overlay';
        overlay.innerHTML = `
            <div class="ntf-box">
                <div class="ntf-icon warning">!</div>
                <div class="ntf-title">${title}</div>
                <div class="ntf-text">${text || ''}</div>
                <div class="ntf-btns">
                    <button class="ntf-btn ntf-btn-cancel" data-cancel>ยกเลิก</button>
                    <button class="ntf-btn ntf-btn-confirm" data-confirm>${confirmLabel || 'ยืนยัน'}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('ntf-show'));

        function close() {
            overlay.classList.remove('ntf-show');
            setTimeout(() => overlay.remove(), 150);
        }
        overlay.querySelector('[data-cancel]').addEventListener('click', close);
        overlay.querySelector('[data-confirm]').addEventListener('click', () => {
            close();
            if (typeof onConfirm === 'function') onConfirm();
        });
    };

    window.confirmAndSubmit = function (options) {
        const settings = Object.assign({
            method: 'POST',
            confirmTitle: 'ยืนยันการทำรายการ?',
            confirmText: 'คุณต้องการดำเนินการนี้ใช่หรือไม่',
            confirmButtonText: 'ยืนยัน'
        }, options);

        window.notifyConfirm(settings.confirmTitle, settings.confirmText, function () {
            if (settings.btn) {
                settings.btn.disabled = true;
                if (settings.btnLoadingHtml) settings.btn.innerHTML = settings.btnLoadingHtml;
            }

            fetch(settings.url, {
                method: settings.method,
                headers: { 'Content-Type': 'application/json' },
                body: settings.data ? JSON.stringify(settings.data) : undefined
            })
                .then(async (response) => {
                    const json = await response.json().catch(() => ({}));
                    if (!response.ok) throw json;
                    return json;
                })
                .then((res) => {
                    window.notify('success', 'สำเร็จ', res.message, () => {
                        if (typeof settings.onSuccess === 'function') settings.onSuccess(res);
                    });
                })
                .catch((res) => {
                    window.notify('error', 'เกิดข้อผิดพลาด', (res && res.message) || 'ไม่สามารถทำรายการได้', () => {
                        if (typeof settings.onError === 'function') settings.onError(res);
                    });
                })
                .finally(() => {
                    if (settings.btn) {
                        settings.btn.disabled = false;
                        if (settings.btnDefaultHtml) settings.btn.innerHTML = settings.btnDefaultHtml;
                    }
                });
        }, settings.confirmButtonText);
    };
})();
