// Force scroll to top on reload and clear hash to always start at Home
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
}

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // SHARED: HERO ENTRANCE TIMING
    // Single source of truth for "how long the star-cluster burst takes to
    // unfold". The title, CTAs, and mockup all wait for this before they
    // reveal, so the page reads as one sequenced entrance rather than
    // everything appearing at once. Exposed as a CSS variable so the
    // title/CTA/mockup delays in styles.css always stay in sync with the
    // JS-driven star animation below — change it in one place only.
    // ==========================================================================
    const HERO_ENTRANCE_DELAY_MS = 1800;
    document.documentElement.style.setProperty('--hero-entrance-delay', `${HERO_ENTRANCE_DELAY_MS}ms`);

    // The navbar and the hero mockup are hidden by default in CSS and only
    // reveal once <html> gets this class. We add it here, on a timer, so
    // the very first thing visitors see is just the star-cluster burst —
    // no nav, no buttons, no mockup — until it finishes unfolding.
    window.setTimeout(() => {
        document.documentElement.classList.add('hero-entrance-ready');
    }, HERO_ENTRANCE_DELAY_MS);

    // ==========================================================================
    // MODULE: HERO TITLE WORD-BY-WORD REVEAL (TYPING EFFECT)
    // ==========================================================================
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        function wrapWords(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent;
                if (!textContent.trim()) return;

                const fragment = document.createDocumentFragment();
                const tokens = textContent.split(/(\s+)/);

                tokens.forEach(token => {
                    if (token.trim()) {
                        const span = document.createElement('span');
                        span.className = 'word';
                        span.textContent = token;
                        fragment.appendChild(span);
                    } else {
                        fragment.appendChild(document.createTextNode(token));
                    }
                });

                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const children = Array.from(node.childNodes);
                children.forEach(wrapWords);
            }
        }

        wrapWords(heroTitle);

        // Stagger the reveal of words — starts only after the star burst
        // has finished unfolding (see HERO_ENTRANCE_DELAY_MS above)
        const words = heroTitle.querySelectorAll('.word');
        words.forEach((word, index) => {
            setTimeout(() => {
                word.classList.add('revealed');
            }, HERO_ENTRANCE_DELAY_MS + 150 + index * 60); // 60ms stagger per word
        });
    }

    // ==========================================================================
    // MODULE: ABOUT LEAD TEXT SCATTER-ASSEMBLE
    // Each letter of the About section's lead paragraph starts flung out to
    // a random offset/rotation and flies into place to assemble the
    // sentence, once the section actually scrolls into view.
    // ==========================================================================
    const aboutLead = document.querySelector('.about-results-lead');
    if (aboutLead) {
        function wrapLetters(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (!text.trim()) return;

                const fragment = document.createDocumentFragment();
                Array.from(text).forEach(ch => {
                    if (ch.trim()) {
                        const span = document.createElement('span');
                        span.className = 'scatter-letter';
                        span.textContent = ch;
                        span.style.setProperty('--lx', `${(Math.random() * 240 - 120).toFixed(0)}px`);
                        span.style.setProperty('--ly', `${(Math.random() * 200 - 100).toFixed(0)}px`);
                        span.style.setProperty('--lr', `${(Math.random() * 70 - 35).toFixed(0)}deg`);
                        fragment.appendChild(span);
                    } else {
                        fragment.appendChild(document.createTextNode(ch));
                    }
                });
                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(wrapLetters);
            }
        }

        wrapLetters(aboutLead);
        const leadLetters = aboutLead.querySelectorAll('.scatter-letter');

        const aboutLeadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    leadLetters.forEach((letter, index) => {
                        setTimeout(() => {
                            letter.classList.add('revealed');
                        }, index * 28);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3, rootMargin: '0px 0px -60px 0px' });

        aboutLeadObserver.observe(aboutLead);
    }

    // ==========================================================================
    // MODULE: MOBILE MENU
    // ==========================================================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        mobileMenuBtn.classList.toggle('active');

        // Simple animation for the menu button spans
        const spans = mobileMenuBtn.querySelectorAll('span');
        if (navMenu.classList.contains('open')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                mobileMenuBtn.classList.remove('active');
                const spans = mobileMenuBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    });

    // ==========================================================================
    // MODULE: FLOATING NAV HOVER PILL
    // ==========================================================================
    const hoverBg = document.getElementById('nav-hover-bg');
    const menuLinks = document.querySelectorAll('.nav-menu .nav-link');
    const navMenuContainer = document.getElementById('nav-menu');

    menuLinks.forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            const left = e.target.offsetLeft;
            const top = e.target.offsetTop;
            const width = e.target.offsetWidth;
            const height = e.target.offsetHeight;

            hoverBg.style.left = `${left}px`;
            hoverBg.style.top = `${top}px`;
            hoverBg.style.width = `${width}px`;
            hoverBg.style.height = `${height}px`;
            hoverBg.style.opacity = '1';
        });
    });

    navMenuContainer.addEventListener('mouseleave', () => {
        hoverBg.style.opacity = '0';
    });


    // ==========================================================================
    // MODULE: SCROLL REVEAL EFFECT
    // Fades sections in as they're scrolled into view — fires only when the
    // user actually scrolls to an element, never on initial page load.
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal-on-scroll');

    const revealOnScrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters view
    });

    revealElements.forEach(el => revealOnScrollObserver.observe(el));


    // ==========================================================================
    // MODULE: CONTACT FORM -> WHATSAPP
    // Builds the "Hola Kodryn..." message from the form fields and sends the
    // visitor to WhatsApp (wa.me) with it pre-filled, instead of posting
    // anywhere — there's no backend, WhatsApp IS the submission.
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const WHATSAPP_NUMBER = '593981045802'; // +593 98 104 5802, digits only for wa.me

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('form-name').value.trim();
        const email = document.getElementById('form-email').value.trim();
        const company = document.getElementById('form-company').value.trim();
        const project = document.getElementById('form-project').value.trim();

        if (!name || !email || !company || !project) {
            formStatus.className = 'form-status error';
            formStatus.textContent = 'Completá todos los campos para generar el mensaje de WhatsApp.';
            formStatus.style.display = 'block';
            return;
        }

        const message = `Hola Kodryn, mi nombre es ${name}, mi correo es ${email}, mi startup se llama ${company} y quiero ${project}`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

        formStatus.className = 'form-status success';
        formStatus.textContent = 'Te llevamos a WhatsApp con tu mensaje ya redactado...';
        formStatus.style.display = 'block';

        window.open(whatsappUrl, '_blank', 'noopener');

        contactForm.reset();
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 6000);
    });



    // ==========================================================================
    // MODULE: HERO STARFIELD BACKGROUND
    // Stars are born clustered tightly together near the center — like a
    // small sphere / a "seed world" — then unfold outward into their
    // scattered resting positions. Once fully deployed, each star drifts
    // freely and continuously. Only visible in dark mode (handled in CSS).
    // Motion here is intentionally kept even for prefers-reduced-motion
    // since it's a subtle, non-parallax ambient effect (unlike the hero
    // flip animation, which does respect it).
    // ==========================================================================
    const starsCanvas = document.getElementById('hero-stars');
    if (starsCanvas) {
        const ctx = starsCanvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const DEPLOY_DURATION = HERO_ENTRANCE_DELAY_MS; // unfold finishes exactly when the title/CTAs/mockup start revealing

        let stars = [];
        let width = 0;
        let height = 0;
        let deployStartTime = null;

        function resizeStarsCanvas() {
            const rect = starsCanvas.parentElement.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            starsCanvas.width = width * dpr;
            starsCanvas.height = height * dpr;
            starsCanvas.style.width = `${width}px`;
            starsCanvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function createStars() {
            // Sparse, deep-space density rather than a dense noisy field
            const density = 0.00012;
            const count = Math.min(Math.round(width * height * density), 160);
            const centerX = width / 2;
            const centerY = height / 2;
            // Tight little "seed ball" radius that the field unfolds from
            const clusterRadius = Math.min(width, height) * 0.035;

            stars = Array.from({ length: count }, () => {
                const headingAngle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.8 + 0.5; // free-roam drift, px/frame
                const clusterAngle = Math.random() * Math.PI * 2;
                const clusterDist = Math.random() * clusterRadius;

                return {
                    startX: centerX + Math.cos(clusterAngle) * clusterDist,
                    startY: centerY + Math.sin(clusterAngle) * clusterDist,
                    targetX: Math.random() * width,
                    targetY: Math.random() * height,
                    x: centerX,
                    y: centerY,
                    radius: Math.random() * 1.2 + 0.3,
                    baseAlpha: Math.random() * 0.5 + 0.3,
                    twinkleSpeed: Math.random() * 0.6 + 0.2,
                    twinklePhase: Math.random() * Math.PI * 2,
                    driftX: Math.cos(headingAngle) * speed,
                    driftY: Math.sin(headingAngle) * speed
                };
            });

            deployStartTime = null; // re-armed: next frame starts the unfold
        }

        function drawStars(time) {
            if (deployStartTime === null) deployStartTime = time;
            const elapsed = time - deployStartTime;
            const deployT = Math.min(elapsed / DEPLOY_DURATION, 1);
            const eased = easeOutCubic(deployT);
            const stillDeploying = deployT < 1;

            // Near-black (matches --text-main) in light theme, white in dark
            // theme, so the burst reads clearly against either hero
            // background. Checked per frame so toggling the theme mid-scroll
            // updates it live.
            const dotColor = document.body.classList.contains('dark-mode')
                ? '255, 255, 255'
                : '15, 23, 42';

            ctx.clearRect(0, 0, width, height);
            stars.forEach(star => {
                if (stillDeploying) {
                    // Unfolding phase: interpolate from the clustered "seed
                    // ball" out toward its free-roam resting position
                    star.x = star.startX + (star.targetX - star.startX) * eased;
                    star.y = star.startY + (star.targetY - star.startY) * eased;
                } else {
                    // Fully deployed: drift freely and continuously
                    star.x += star.driftX;
                    star.y += star.driftY;

                    // Wrap around edges so the field feels continuous
                    if (star.x < -2) star.x = width + 2;
                    if (star.x > width + 2) star.x = -2;
                    if (star.y < -2) star.y = height + 2;
                    if (star.y > height + 2) star.y = -2;
                }

                const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase);
                // Stars brighten in as they unfold from the cluster, rather
                // than popping in at full brightness
                const revealAlpha = stillDeploying ? eased : 1;
                const alpha = star.baseAlpha * (0.6 + 0.4 * twinkle) * revealAlpha;

                ctx.beginPath();
                ctx.fillStyle = `rgba(${dotColor}, ${alpha})`;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function animateStars(time) {
            drawStars(time);
            requestAnimationFrame(animateStars);
        }

        resizeStarsCanvas();
        createStars();
        requestAnimationFrame(animateStars);

        window.addEventListener('resize', () => {
            resizeStarsCanvas();
            createStars();
        });
    }

    // ==========================================================================
    // MODULE: HERO MOCKUP CYCLER
    // Rotates the mac-window mockup through 3 panels (CRM / website / code)
    // every 2s. The code panel additionally types itself out character by
    // character each time it becomes active.
    // ==========================================================================
    const macWindow = document.getElementById('mac-window');
    if (macWindow) {
        const panels = Array.from(macWindow.querySelectorAll('.mac-panel'));
        const titleEl = document.getElementById('mac-window-title');
        const codeEl = document.querySelector('#code-typed code');
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const PANEL_INTERVAL_MS = 2000;

        // Tokenized so each character can be colored like a real editor
        // (keyword / function / comment) while still being typed one at a time.
        const CODE_TOKENS = [
            { t: 'const', c: 'kw' }, { t: ' leads = ', c: '' }, { t: 'await', c: 'kw' }, { t: ' ai.', c: '' },
            { t: 'qualify', c: 'fn' }, { t: '(data);\n', c: '' },
            { t: 'await', c: 'kw' }, { t: ' crm.', c: '' }, { t: 'sync', c: 'fn' }, { t: '(leads);\n\n', c: '' },
            { t: '// 12 automatizaciones activas', c: 'cm' }
        ];
        const CODE_CHARS = CODE_TOKENS.flatMap(tok => tok.t.split('').map(ch => ({ ch, cls: tok.c })));

        let cycleIndex = 0;
        let cycleTimer = null;
        let typeTimer = null;

        function escapeHtml(ch) {
            if (ch === '&') return '&amp;';
            if (ch === '<') return '&lt;';
            if (ch === '>') return '&gt;';
            return ch;
        }

        function typeCode() {
            if (!codeEl) return;
            clearInterval(typeTimer);
            codeEl.innerHTML = '';
            if (prefersReducedMotion) {
                codeEl.innerHTML = CODE_CHARS.map(c => c.cls
                    ? `<span class="tok-${c.cls}">${escapeHtml(c.ch)}</span>`
                    : escapeHtml(c.ch)
                ).join('');
                return;
            }
            let i = 0;
            typeTimer = setInterval(() => {
                i++;
                codeEl.innerHTML = CODE_CHARS.slice(0, i).map(c => c.cls
                    ? `<span class="tok-${c.cls}">${escapeHtml(c.ch)}</span>`
                    : escapeHtml(c.ch)
                ).join('');
                if (i >= CODE_CHARS.length) clearInterval(typeTimer);
            }, 28);
        }

        function showPanel(index) {
            const next = panels[index];
            if (!next) return;
            const current = panels.find(p => p !== next && p.classList.contains('is-active'));

            // Outgoing panel: play the exit animation, then actually hide it
            // once it finishes (kept .is-active meanwhile so it stays
            // rendered/visible while animating out).
            if (current) {
                current.classList.remove('panel-exit');
                void current.offsetWidth; // force reflow so the animation restarts
                current.classList.add('panel-exit');
                current.addEventListener('animationend', function onExitEnd(e) {
                    if (e.target !== current) return;
                    current.classList.remove('is-active', 'panel-exit');
                    current.removeEventListener('animationend', onExitEnd);
                });
            }

            // Incoming panel: mark active immediately, then (re)play the
            // enter animation, restarted via reflow so it fires every cycle.
            next.classList.add('is-active');
            next.classList.remove('panel-enter');
            void next.offsetWidth;
            next.classList.add('panel-enter');
            next.addEventListener('animationend', function onEnterEnd(e) {
                if (e.target !== next) return;
                next.classList.remove('panel-enter');
                next.removeEventListener('animationend', onEnterEnd);
            });

            if (titleEl) titleEl.textContent = next.dataset.title || '';
            if (next.classList.contains('mac-panel--code')) {
                typeCode();
            } else {
                clearInterval(typeTimer);
            }
        }

        showPanel(0);

        // Panel cycling always runs — it's a content change, not decorative
        // motion. Only the crossfade transition (CSS) and the character-by-
        // character typing (above) back off for prefers-reduced-motion.
        if (panels.length > 1) {
            cycleTimer = setInterval(() => {
                cycleIndex = (cycleIndex + 1) % panels.length;
                showPanel(cycleIndex);
            }, PANEL_INTERVAL_MS);
        }
    }



    // ==========================================================================
    // MODULE: FLOATING WHATSAPP BUTTON VISIBILITY
    // Hidden while the Home/hero section is on screen, shown from Servicios
    // onward (in both scroll directions).
    // ==========================================================================
    const whatsappFloat = document.getElementById('whatsapp-float');
    const heroSectionEl = document.getElementById('hero');

    if (whatsappFloat && heroSectionEl) {
        const whatsappVisibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                whatsappFloat.classList.toggle('is-visible', !entry.isIntersecting);
            });
        }, { threshold: 0.2 });

        whatsappVisibilityObserver.observe(heroSectionEl);
    }
});