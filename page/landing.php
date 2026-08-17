<?php
// Landing Page - แสดงเมื่อเข้า http://localhost/ โดยตรง (ไม่สามารถเลื่อนได้)
?>

<!-- Landing Hero Section - Full Screen No Scroll -->
<section class="landing-hero">
    <div class="landing-particles"></div>
    <div class="landing-content">
        <div class="landing-logo">
            <img src="<?= htmlspecialchars($config['logo'] ?? '') ?>" alt="Logo" class="landing-logo-img">
        </div>
        <h1 class="landing-title"><?= htmlspecialchars($config['name'] ?? 'SHOP') ?></h1>

        <!-- Tagline Bar -->
        <div class="landing-tagline-bar">
            <span><?= htmlspecialchars($config['des'] ?? 'ยินดีให้บริการ') ?></span>
        </div>

        <!-- Action Buttons -->
        <div class="landing-buttons">
            <?php if (!isset($_SESSION['id'])): ?>
                <a href="?page=login" class="landing-btn landing-btn-primary">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>เข้าสู่ระบบเลย</span>
                </a>
            <?php else: ?>
                <a href="?page=home" class="landing-btn landing-btn-primary">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>เข้าสู่ระบบเลย</span>
                </a>
            <?php endif; ?>
            <a href="?page=home" class="landing-btn landing-btn-primary">
                <i class="fa-solid fa-store"></i>
                <span>เยี่ยมชมสินค้า</span>
            </a>
        </div>
    </div>
</section>

<style>
    /* Disable Scroll on Landing */
    html,
    body {
        overflow: hidden !important;
        height: 100vh !important;
    }

    /* Landing Page Styles */
    .landing-hero {
        background: linear-gradient(180deg, #0a0a15 0%, #1a0a25 50%, #0a0a15 100%);
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        overflow: hidden;
        z-index: 9999;
    }

    .landing-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
            radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.2), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.15), transparent),
            radial-gradient(2px 2px at 50px 160px, rgba(255, 255, 255, 0.2), transparent),
            radial-gradient(2px 2px at 90px 40px, rgba(255, 255, 255, 0.15), transparent),
            radial-gradient(2px 2px at 130px 80px, rgba(255, 255, 255, 0.2), transparent),
            radial-gradient(2px 2px at 160px 120px, rgba(255, 255, 255, 0.15), transparent),
            radial-gradient(3px 3px at 200px 200px, rgba(200, 150, 255, 0.3), transparent),
            radial-gradient(2px 2px at 250px 100px, rgba(200, 150, 255, 0.2), transparent);
        background-size: 300px 300px;
        animation: landing-sparkle 5s linear infinite;
    }

    @keyframes landing-sparkle {
        from {
            transform: translateY(0);
        }

        to {
            transform: translateY(-300px);
        }
    }

    .landing-content {
        text-align: center;
        z-index: 2;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
    }

    .landing-logo-img {
        max-width: 220px;
        height: auto;
        filter: drop-shadow(0 10px 40px rgba(200, 100, 255, 0.4));
        animation: landing-float 3s ease-in-out infinite;
    }

    @keyframes landing-float {

        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(-12px);
        }
    }

    .landing-title {
        font-size: 2.8rem;
        font-weight: 800;
        color: #fff !important;
        margin: 30px 0 20px;
        text-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
    }

    .landing-tagline-bar {
        background: linear-gradient(135deg, var(--xez-primary) 0%, var(--xez-secondary) 100%);
        padding: 12px 60px;
        border-radius: 50px;
        margin-bottom: 30px;
        box-shadow: 0 10px 40px rgba(var(--xez-primary-rgb), 0.4);
    }

    .landing-tagline-bar span {
        color: #fff;
        font-size: 0.95rem;
        font-weight: 500;
    }

    .landing-buttons {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .landing-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 25px 45px;
        border-radius: 18px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
        min-width: 150px;
    }

    .landing-btn i {
        font-size: 2rem;
        margin-bottom: 12px;
    }

    .landing-btn span {
        font-size: 0.95rem;
    }

    .landing-btn-primary {
        background: var(--xez-primary);
        color: #000 !important;
        box-shadow: 0 8px 30px rgba(var(--xez-primary-rgb), 0.4);
    }

    .landing-btn-primary:hover {
        background: var(--xez-secondary);
        transform: translateY(-5px);
        box-shadow: 0 15px 50px rgba(var(--xez-primary-rgb), 0.6);
        color: #000 !important;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .landing-title {
            font-size: 2rem;
        }

        .landing-logo-img {
            max-width: 160px;
        }

        .landing-tagline-bar {
            padding: 10px 30px;
        }

        .landing-btn {
            padding: 20px 35px;
            min-width: 130px;
        }

        .landing-btn i {
            font-size: 1.6rem;
        }
    }
</style>