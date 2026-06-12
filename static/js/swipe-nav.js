document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL DESIGN SETTINGS MANAGER ---
    // Fallback if not defined
    let settings = { liquid_glass: true, swipe_nav: true };
    const metaTag = document.getElementById('design-settings-meta');
    if (metaTag) {
        try { settings = JSON.parse(metaTag.content); } catch (e) {}
    }
    window.GLOBAL_DESIGN_SETTINGS = settings;

    // 1. Swipe Nav Setting
    window.isSwipeNavDisabled = settings.swipe_nav === false;

    // 2. Design Settings Applier
    window.applyDesignSettings = function(settings) {
        let styleTag = document.getElementById('global-design-settings-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'global-design-settings-style';
            document.head.appendChild(styleTag);
        }
        
        let css = '';
        
        // Liquid Glass
        if (settings.liquid_glass === false) {
            css += `
                body { background-image: none !important; }
                .login-card, .form-card, .result-card, .token-card, .admin-card, .mobile-bottom-nav, .sortable-drag, .sortable-drag-inner, .link-card, .completed-section-header, .eksikler-section-header {
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    background: rgb(22, 17, 13) !important;
                }
                .nav-item.active, .nav-item:hover {
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    border-color: transparent !important;
                }
                .nav-item.active i {
                    text-shadow: none !important;
                }
            `;
        }
        
        // Glassmorphism (Buzlu Cam)
        if (settings.glassmorphism === false) {
            css += `
                .login-card, .form-card, .result-card, .token-card, .admin-card, .mobile-bottom-nav, .sortable-drag, .sortable-drag-inner, .link-card, .completed-section-header, .eksikler-section-header, .settings-section, .audit-section, .user-detail-card, .post-link-item, .modal-content, .custom-modal, .validation-toast, .alert, .completed-section-header, .eksikler-section-header {
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }
            `;
        }
        
        // Ambient Glow (Arka Plan Işıkları)
        if (settings.ambient_glow === false) {
            css += `
                body::before {
                    display: none !important;
                }
            `;
        }
        
        // Animations (Görsel Animasyonlar)
        if (settings.animations === false) {
            css += `
                *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                }
                .token-status.active::before {
                    animation: none !important;
                }
            `;
        }
        
        // OLED Dark Mode (OLED Saf Siyah Modu)
        if (settings.oled_mode === true) {
            css += `
                :root {
                    --background: #000000 !important;
                }
                body {
                    background-color: #000000 !important;
                    background-image: none !important;
                }
                body::before {
                    display: none !important;
                }
                .login-card, .form-card, .result-card, .token-card, .admin-card, .mobile-bottom-nav, .sortable-drag, .sortable-drag-inner, .link-card, .completed-section-header, .eksikler-section-header, .settings-section, .audit-section, .user-detail-card, .post-link-item, .modal-content, .custom-modal, .validation-toast, .completed-section-header, .eksikler-section-header, .list-group {
                    background: #000000 !important;
                    background-color: #000000 !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                }
            `;
        }
        
        styleTag.innerHTML = css;
    };
    
    window.applyDesignSettings(settings);
    // --- END GLOBAL SETTINGS ---

    const pages = ['/', '/token_al', '/admin'];
    
    // Determine current index based on pathname
    let currentIndex = 0;
    const path = window.location.pathname;
    if (path.includes('/token_al')) currentIndex = 1;
    else if (path.includes('/admin')) currentIndex = 2;
    else currentIndex = 0;

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let isSwiping = false;

    // CRITICAL: Prevent browser from canceling pointer events on mobile
    // and prevent text selection during drag on desktop
    document.body.style.touchAction = 'pan-y';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    document.addEventListener('pointerdown', (e) => {
        if (window.isSwipeNavDisabled) return; // Abort if disabled globally

        // Ignore buttons, links, inputs, and specifically the drag handles. 
        // We DO NOT ignore the entire card so the user has room to swipe.
        if (e.target.closest('.drag-handle') || e.target.closest('.drag-handle-inner') || e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
            return;
        }

        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        isSwiping = false;
        
        // Remove transitions so the page follows the finger instantly
        document.body.style.transition = 'none';
        document.body.style.overflowX = 'hidden'; 
    });

    document.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // If horizontal movement is detected and it's larger than vertical movement
        if (!isSwiping && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isSwiping = true;
        }

        if (isSwiping) {
            // User requested: Swipe RIGHT (deltaX > 0) goes to NEXT page. 
            // So if we are on the LAST page, resist swiping right.
            let dragAmount = deltaX;
            if (currentIndex === pages.length - 1 && deltaX > 0) dragAmount = deltaX * 0.15; 
            
            // Swipe LEFT (deltaX < 0) goes to PREV page.
            // So if we are on the FIRST page, resist swiping left.
            if (currentIndex === 0 && deltaX < 0) dragAmount = deltaX * 0.15; 

            // Move the body horizontally to follow the mouse/finger
            document.body.style.transform = `translateX(${dragAmount}px)`;
        }
    });

    function finishDrag(e) {
        if (!isDragging) return;
        isDragging = false;

        if (isSwiping) {
            const deltaX = e.clientX - startX;
            const threshold = Math.min(window.innerWidth * 0.2, 75); // Navigate if dragged 20% of screen or 75px
            
            // Re-enable smooth transition for the snap/slide animation
            document.body.style.transition = 'transform 0.4s cubic-bezier(0.2, 1, 0.1, 1), opacity 0.4s ease-out';

            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0) {
                    // Swiped RIGHT (deltaX > 0) -> Go to NEXT page
                    if (currentIndex < pages.length - 1) {
                        document.body.style.transform = 'translateX(100vw)';
                        document.body.style.opacity = '0';
                        setTimeout(() => window.location.href = pages[currentIndex + 1], 350);
                    } else {
                        // Cannot go forward, snap back
                        document.body.style.transform = 'translateX(0)';
                    }
                } else {
                    // Swiped LEFT (deltaX < 0) -> Go to PREV page
                    if (currentIndex > 0) {
                        document.body.style.transform = 'translateX(-100vw)';
                        document.body.style.opacity = '0';
                        setTimeout(() => window.location.href = pages[currentIndex - 1], 350);
                    } else {
                        // Cannot go backward, snap back
                        document.body.style.transform = 'translateX(0)';
                    }
                }
            } else {
                // Did not swipe far enough, snap back to center
                document.body.style.transform = 'translateX(0)';
            }
        }
        isSwiping = false;
        document.body.style.overflowX = ''; 
    }

    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
});
