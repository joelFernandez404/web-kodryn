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
    // MODULE: MANIFESTO CURSOR LIGHT
    // A soft light follows the cursor across the manifesto section. It eases
    // toward the pointer (lerp) so it trails like a lamp instead of snapping;
    // the rAF loop only runs while the light is still catching up. Under
    // prefers-reduced-motion it jumps straight to the pointer. Pointer
    // devices only.
    // ==========================================================================
    const manifestoSection = document.querySelector('.manifesto-section');
    const manifestoGlow = manifestoSection && manifestoSection.querySelector('.manifesto-glow');
    if (manifestoGlow && window.matchMedia('(hover: hover)').matches) {
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
        const target = { x: 0, y: 0 };
        const pos = { x: 0, y: 0 };
        let rafId = 0;

        const place = () => {
            manifestoGlow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        };

        const follow = () => {
            pos.x += (target.x - pos.x) * 0.12;
            pos.y += (target.y - pos.y) * 0.12;
            place();
            const settled = Math.abs(target.x - pos.x) < 0.5 && Math.abs(target.y - pos.y) < 0.5;
            rafId = settled ? 0 : requestAnimationFrame(follow);
        };

        const aim = (e, snap) => {
            const r = manifestoSection.getBoundingClientRect();
            target.x = e.clientX - r.left;
            target.y = e.clientY - r.top;
            if (snap || calm.matches) {
                pos.x = target.x;
                pos.y = target.y;
                place();
            } else if (!rafId) {
                rafId = requestAnimationFrame(follow);
            }
        };

        manifestoSection.addEventListener('pointerenter', (e) => {
            aim(e, true); // appear right under the cursor, then trail it
            manifestoSection.classList.add('is-lit');
        });
        manifestoSection.addEventListener('pointermove', (e) => aim(e, false));
        manifestoSection.addEventListener('pointerleave', () => manifestoSection.classList.remove('is-lit'));
    }

    // ==========================================================================
    // MODULE: FLIP CARDS (services)
    // Each card flips to show its details. Hover flips it through CSS on
    // pointer devices; a click or tap anywhere on the card (or Enter on its
    // arrow button) toggles .is-flipped, pinning it turned. Only the visible
    // face is exposed to assistive tech and the keyboard.
    // ==========================================================================
    const canHover = window.matchMedia('(hover: hover)');
    document.querySelectorAll('.service-item').forEach((card) => {
        const front = card.querySelector('.service-front');
        const back = card.querySelector('.service-back');
        const openBtn = front.querySelector('.service-toggle');
        const backBtn = back.querySelector('.service-toggle');

        function setFlipped(flipped, moveFocus) {
            card.classList.toggle('is-flipped', flipped);
            openBtn.setAttribute('aria-expanded', flipped ? 'true' : 'false');
            front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
            back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
            front.inert = flipped;
            back.inert = !flipped;
            if (moveFocus) (flipped ? backBtn : openBtn).focus({ preventScroll: true });
        }

        card.addEventListener('click', (e) => {
            const viaKeyboard = e.detail === 0; // Enter/Space on a button fires a detail-0 click
            // A click pins the card on its back (it stays turned after the
            // pointer leaves); the next click turns it to the front. When that
            // happens under the pointer, mute the hover until it leaves so the
            // card really shows its front. Touch screens can leave a sticky
            // :hover after a tap, so only real pointer devices count it.
            const flip = !card.classList.contains('is-flipped');
            const hovered = canHover.matches && card.matches(':hover');
            card.classList.toggle('hover-off', !flip && hovered);
            setFlipped(flip, viaKeyboard);
        });

        card.addEventListener('mouseleave', () => card.classList.remove('hover-off'));

        setFlipped(false, false);
    });

    // ==========================================================================
    // MODULE: PROJECT FINDER
    // The Productos section is a macOS-Finder-style explorer. PROJECTS is the
    // single source of content: add a project here and it shows up in its
    // folder, in Recientes, in search and in Quick Look. Views: 'root'
    // (folders), 'recent' (every project) and 'folder:<id>', with back /
    // forward history like a real Finder. Clicking a project opens the Quick
    // Look <dialog>, which grows out of the clicked thumbnail.
    // Screenshots: `${image}.jpg` (desktop) and `${image}-movil.jpg` (mobile)
    // next to index.html; while missing, a CSS mock of the site (.mock--<id>
    // themes in styles.css) shows instead.
    // Videos (`video: true`): Quick Look plays `${image}.mp4`, the thumbnail
    // shows `${image}.jpg` and plays a muted preview on hover (both live in
    // /videos, compressed for web); while missing, a mock player with the
    // client's white logo (.vmock--<id>) shows instead.
    // `status: 'dev'` adds the "En desarrollo" badge. `device: 'mobile'`
    // opens Quick Look on the phone view (apps).
    // `url`: the live site; empty sends the visitor to the contact form.
    // ==========================================================================
    const finder = document.getElementById('finder');
    if (finder) {
        const PROJECTS = [
            {
                id: 'leal',
                name: 'Leal Consultores',
                folder: 'webs',
                kind: 'Página web',
                industry: 'Consultoría empresarial',
                file: 'leal-consultores',
                image: 'proyecto-leal',
                url: '',
                mock: { logo: 'Leal', eyebrow: 'Consultoría empresarial', title: 'Decisiones claras para crecer.', cta: 'Agenda una consulta', band: 'Hablemos de tu empresa' },
                title: 'Web corporativa para Leal Consultores',
                desc: 'Un sitio que presenta los servicios de la firma con claridad y convierte cada visita en una consulta.',
                list: ['Diseño web a medida y responsive', 'SEO técnico y on-page', 'Formulario de contacto conectado a correo y WhatsApp']
            },
            {
                id: 'glow',
                name: 'Glow by SE',
                folder: 'ecommerce',
                kind: 'E-commerce',
                industry: 'Belleza y cuidado personal',
                file: 'glow-by-se',
                image: 'proyecto-glow',
                url: '',
                mock: { logo: 'Glow', eyebrow: 'Skincare & beauty', title: 'Tu piel, tu glow.', cta: 'Comprar ahora', band: 'Envíos a todo el país' },
                title: 'Tienda online para Glow by SE',
                desc: 'Catálogo, carrito y pagos en línea para una marca de belleza, lista para vender desde el primer día.',
                list: ['Catálogo de productos con variantes', 'Checkout y pasarela de pagos', 'Gestión de pedidos e inventario']
            },
            {
                id: 'caserita',
                name: 'Caserita LATAM',
                folder: 'webs',
                kind: 'Página web',
                industry: 'Startup · 3 países de LATAM',
                file: 'caserita-latam',
                image: 'proyecto-caserita',
                url: '',
                mock: { logo: 'Caserita', eyebrow: 'Startup LATAM', title: 'Tu tienda de barrio, conectada.', cta: 'Conoce Caserita', band: 'Presentes en 3 países' },
                title: 'Web para Caserita LATAM',
                desc: 'El sitio de una startup que opera en 3 países de América Latina: una sola web que presenta la propuesta con claridad en cada mercado.',
                list: ['Diseño web a medida y responsive', 'Mensaje pensado para 3 mercados de LATAM', 'SEO técnico y formularios conectados']
            },
            {
                id: 'lachacra',
                name: 'La Chacra App',
                folder: 'apps',
                kind: 'App · MVP',
                industry: 'Microempresa de alimentos',
                status: 'dev',
                device: 'mobile',
                file: 'la-chacra-app',
                image: 'proyecto-lachacra',
                url: '',
                mock: { logo: 'La Chacra', eyebrow: 'Tu negocio, en una app', title: 'Toda la operación en un solo lugar.', cta: 'Nuevo pedido', band: 'Pedidos · Inventario · Ventas' },
                title: 'App de gestión para La Chacra de la Abuela',
                desc: 'Una app para la microempresa La Chacra de la Abuela que resuelve y centraliza toda su operación en un solo lugar.',
                list: ['Toda la operación centralizada en una sola app', 'Diseñada para el día a día del negocio', 'MVP en desarrollo con entregas por etapas']
            },
            {
                id: 'primesport',
                name: 'Prime Sport',
                folder: 'apps',
                kind: 'Sistema · MVP',
                industry: 'Escuelas de fútbol · Ecuador',
                status: 'dev',
                file: 'prime-sport',
                image: 'proyecto-primesport',
                url: '',
                mock: { logo: 'Prime Sport', eyebrow: 'Escuelas de fútbol', title: 'Toda tu academia en un solo panel.', cta: 'Ver jugadores', band: 'Datos centralizados' },
                title: 'Prime Sport: datos centralizados para escuelas de fútbol',
                desc: 'Un sistema que centraliza los datos de las escuelas de fútbol en Ecuador, para que directivos y entrenadores trabajen sobre una sola fuente de información.',
                list: ['Datos de jugadores y equipos en un solo lugar', 'Panel para directivos y entrenadores', 'MVP en desarrollo para escuelas en Ecuador']
            },
            {
                id: 'kopiloto',
                name: 'Kopiloto',
                folder: 'ia',
                kind: 'Automatización IA',
                industry: 'Ecosistema emprendedor',
                file: 'kopiloto-matching',
                image: 'proyecto-kopiloto',
                url: '',
                mock: { logo: 'Kopiloto', eyebrow: 'Matching con IA', title: 'El fondo ideal para tu startup.', cta: 'Ver coincidencias', band: '98% de afinidad' },
                title: 'Matching de fondos para Kopiloto',
                desc: 'Un flujo automático que cruza el perfil de cada emprendimiento con los fondos y convocatorias disponibles, y sugiere los más afines.',
                list: ['Carga automática de perfiles y convocatorias', 'Motor de matching con IA', 'Reportes para el equipo de Kopiloto']
            },
            {
                id: 'fudinow',
                name: 'Fudinow',
                folder: 'videos',
                kind: 'Video de lanzamiento IA',
                industry: 'Startup',
                video: true,
                file: 'fudinow-lanzamiento',
                image: 'videos/fudinow',
                url: '',
                mock: { logoImg: 'clientes/fudinow.svg', eyebrow: 'Lanzamiento de producto' },
                title: 'Lanzamiento de Fudinow con IA',
                desc: 'Video de lanzamiento y motion graphics creados con IA para presentar el producto de Fudinow.',
                list: ['Guion y narrativa del lanzamiento', 'Motion graphics generados con IA', 'Versiones para redes y web']
            },
            {
                id: 'jvr',
                name: 'JVR Connect',
                folder: 'videos',
                kind: 'Video de lanzamiento IA',
                industry: 'Startup',
                video: true,
                file: 'jvr-connect-lanzamiento',
                image: 'videos/jvr',
                url: '',
                mock: { logoImg: 'clientes/jvr.svg', logo: 'JVR Connect', eyebrow: 'Lanzamiento de la startup' },
                title: 'Lanzamiento de JVR Connect con IA',
                desc: 'Video de lanzamiento y motion graphics creados con IA para presentar la startup JVR Connect.',
                list: ['Guion y narrativa del lanzamiento', 'Motion graphics generados con IA', 'Versiones para redes y web']
            },
            {
                id: 'daxuz',
                name: 'Daxuz',
                folder: 'videos',
                kind: 'Video de lanzamiento IA',
                industry: 'Startup',
                video: true,
                file: 'daxuz-lanzamiento',
                image: 'videos/daxuz',
                url: '',
                mock: { logoImg: 'clientes/daxuz.png', eyebrow: 'Lanzamiento de producto' },
                title: 'Lanzamiento de Daxuz con IA',
                desc: 'Video de lanzamiento y motion graphics creados con IA para presentar el producto de Daxuz.',
                list: ['Guion y narrativa del lanzamiento', 'Motion graphics generados con IA', 'Versiones para redes y web']
            }
        ];
        const FOLDERS = [
            { id: 'webs', name: 'Webs' },
            { id: 'ecommerce', name: 'E-commerce' },
            { id: 'apps', name: 'Apps & MVPs' },
            { id: 'ia', name: 'Automatizaciones IA' },
            { id: 'videos', name: 'Lanzamientos IA' }
        ];
        const VIEW_NAMES = { root: 'Proyectos', recent: 'Recientes' };

        const content = document.getElementById('finder-content');
        const titleEl = document.getElementById('finder-title');
        const pathEl = document.getElementById('finder-path');
        const countEl = document.getElementById('finder-count');
        const backBtn = document.getElementById('finder-back');
        const fwdBtn = document.getElementById('finder-forward');
        const search = document.getElementById('finder-search');
        const sideItems = finder.querySelectorAll('.finder-side-item[data-view]');
        const modeBtns = finder.querySelectorAll('[data-mode]');
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

        const state = { view: 'root', mode: 'grid', query: '' };
        const past = [];
        const future = [];
        const missing = new Set(); // screenshot files that 404'd, so re-renders skip them

        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const plural = (n) => `${n} ${n === 1 ? 'ítem' : 'ítems'}`;
        const folderName = (id) => (FOLDERS.find((f) => f.id === id) || {}).name || '';
        const viewName = (view) => VIEW_NAMES[view] || folderName(view.replace('folder:', ''));
        const ICON_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>';
        const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>';
        const badgeHTML = (p) => (p.status === 'dev' ? '<span class="fi-badge">En desarrollo</span>' : '');

        // Screenshots / videos that failed to load are removed and
        // remembered; the mock underneath stays visible.
        const onImgError = (e) => {
            if (!['IMG', 'VIDEO'].includes(e.target.tagName) || !e.target.closest('.shot')) return;
            missing.add(e.target.getAttribute('src'));
            e.target.remove();
        };

        // Mock video player: the client's white logo over a branded
        // backdrop, with a play button and a progress bar.
        function vmockHTML(p) {
            const m = p.mock;
            return `<span class="vmock vmock--${p.id}">
                <i class="vmock-grid"></i>
                <span class="vmock-center">
                    <img class="vmock-logo" src="${m.logoImg}" alt="">
                    ${m.logo ? `<b class="vmock-name">${esc(m.logo)}</b>` : ''}
                    <i class="vmock-tag">${esc(m.eyebrow)}</i>
                </span>
                <span class="vmock-play">${ICON_PLAY}</span>
                <span class="vmock-bar"><i></i></span>
            </span>`;
        }

        function mockHTML(p, mobile) {
            if (p.video) return vmockHTML(p);
            const m = p.mock;
            return `<span class="mock mock--${p.id}${mobile ? ' mock--mobile' : ''}">
                <span class="mock-nav"><b class="mock-logo">${esc(m.logo)}</b><span class="mock-links"><i></i><i></i><i></i></span><i class="mock-pill"></i></span>
                <span class="mock-hero">
                    <span><i class="mock-eyebrow">${esc(m.eyebrow)}</i><b class="mock-title">${esc(m.title)}</b><span class="mock-lines"><i></i><i></i><i></i></span><b class="mock-btn">${esc(m.cta)}</b></span>
                    <i class="mock-art"></i>
                </span>
                <span class="mock-cards"><i></i><i></i><i></i></span>
                <b class="mock-band">${esc(m.band)}</b>
                <span class="mock-cards mock-cards--alt"><i></i><i></i></span>
                <i class="mock-foot"></i>
            </span>`;
        }

        // variant: 'thumb' | 'desktop' | 'mobile' | 'video'
        function shotHTML(p, variant) {
            if (variant === 'video') {
                const src = `${p.image}.mp4`;
                const video = missing.has(src) ? '' : `<video src="${src}" poster="${p.image}.jpg" autoplay muted loop playsinline controls preload="auto"></video>`;
                return `<span class="shot shot--video">${vmockHTML(p)}${video}</span>`;
            }
            const src = `${p.image}${variant === 'mobile' ? '-movil' : ''}.jpg`;
            const img = missing.has(src) ? '' : `<img src="${src}" alt="" decoding="async"${variant === 'thumb' ? ' loading="lazy"' : ''}>`;
            const preview = p.video && variant === 'thumb' && !missing.has(`${p.image}.mp4`)
                ? `<video class="shot-preview" src="${p.image}.mp4" muted loop playsinline preload="none"></video>`
                : '';
            return `<span class="shot shot--${variant}">${mockHTML(p, variant === 'mobile')}${img}${preview}</span>`;
        }

        function folderHTML(folderId) {
            const first = PROJECTS.find((p) => p.folder === folderId);
            return `<span class="folder${first ? '' : ' folder--empty'}" aria-hidden="true">
                <span class="folder-back"></span>
                <span class="folder-paper">${first ? shotHTML(first, 'thumb') : ''}</span>
                <span class="folder-front"></span>
            </span>`;
        }

        function itemsFor() {
            const q = state.query.toLowerCase();
            if (q) {
                return PROJECTS
                    .filter((p) => [p.name, p.kind, p.industry, folderName(p.folder)].join(' ').toLowerCase().includes(q))
                    .map((p) => ({ type: 'project', p }));
            }
            if (state.view === 'root') return [...FOLDERS.map((f) => ({ type: 'folder', f })), { type: 'new' }];
            if (state.view === 'recent') return [...PROJECTS.map((p) => ({ type: 'project', p })), { type: 'new' }];
            const id = state.view.replace('folder:', '');
            return PROJECTS.filter((p) => p.folder === id).map((p) => ({ type: 'project', p }));
        }

        function gridItem(item) {
            if (item.type === 'folder') {
                const n = PROJECTS.filter((p) => p.folder === item.f.id).length;
                return `<button class="fi fi--folder" type="button" data-open="folder:${item.f.id}">
                    <span class="fi-media">${folderHTML(item.f.id)}</span>
                    <span class="fi-name">${esc(item.f.name)}</span><span class="fi-sub">${plural(n)}</span>
                </button>`;
            }
            if (item.type === 'new') {
                return `<a class="fi fi--new" href="#contact">
                    <span class="fi-media"><span class="fi-thumb fi-thumb--new">${ICON_PLUS}</span></span>
                    <span class="fi-name">Tu proyecto</span><span class="fi-sub">Hablemos →</span>
                </a>`;
            }
            const p = item.p;
            return `<button class="fi fi--project" type="button" data-project="${p.id}" aria-label="Abrir ${esc(p.name)}">
                <span class="fi-media"><span class="fi-thumb">${shotHTML(p, 'thumb')}${badgeHTML(p)}</span></span>
                <span class="fi-name">${esc(p.name)}</span><span class="fi-sub">${esc(p.kind)}</span>
            </button>`;
        }

        function listItem(item) {
            if (item.type === 'folder') {
                const n = PROJECTS.filter((p) => p.folder === item.f.id).length;
                return `<button class="fr" type="button" data-open="folder:${item.f.id}">
                    <span class="fr-name"><span class="fr-icon fr-icon--plain">${folderHTML(item.f.id)}</span><span>${esc(item.f.name)}</span></span>
                    <span class="fr-cell">Carpeta</span><span class="fr-cell">${plural(n)}</span>
                </button>`;
            }
            if (item.type === 'new') {
                return `<a class="fr" href="#contact">
                    <span class="fr-name"><span class="fr-icon fr-icon--new">${ICON_PLUS}</span><span>Tu proyecto</span></span>
                    <span class="fr-cell">Hablemos →</span><span class="fr-cell"></span>
                </a>`;
            }
            const p = item.p;
            return `<button class="fr" type="button" data-project="${p.id}" aria-label="Abrir ${esc(p.name)}">
                <span class="fr-name"><span class="fr-icon">${shotHTML(p, 'thumb')}</span><span>${esc(p.name)}</span>${badgeHTML(p)}</span>
                <span class="fr-cell">${esc(p.kind)}</span><span class="fr-cell">${esc(p.industry)}</span>
            </button>`;
        }

        function render() {
            const items = itemsFor();
            const isList = state.mode === 'list';
            content.classList.toggle('is-list', isList);

            let html = items.map((item, i) => `<li style="--i:${i}">${isList ? listItem(item) : gridItem(item)}</li>`).join('');
            if (isList && items.length) {
                html = `<li class="fr-head" aria-hidden="true"><span>Nombre</span><span>Tipo</span><span>Detalle</span></li>${html}`;
            }
            if (!items.length) {
                html = `<li class="finder-empty">No hay proyectos que coincidan con “${esc(state.query)}”.</li>`;
            }
            content.innerHTML = html;

            // Title, sidebar selection, history buttons
            titleEl.textContent = state.query ? `Buscar: “${state.query}”` : viewName(state.view);
            sideItems.forEach((el) => {
                const active = !state.query && el.dataset.view === state.view;
                el.classList.toggle('is-active', active);
                if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
            });
            backBtn.disabled = !past.length;
            fwdBtn.disabled = !future.length;

            // Breadcrumb: kodryn.dev > Proyectos > <folder>
            const crumbs = [{ label: 'kodryn.dev' }];
            if (state.query) {
                crumbs.push({ label: 'Búsqueda' });
            } else if (state.view === 'recent') {
                crumbs.push({ label: 'Recientes' });
            } else {
                crumbs.push({ label: 'Proyectos', view: state.view === 'root' ? null : 'root' });
                if (state.view !== 'root') crumbs.push({ label: viewName(state.view) });
            }
            pathEl.innerHTML = crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                const cls = `finder-crumb${c.view ? ' is-link' : ''}`;
                const crumb = c.view
                    ? `<button type="button" class="${cls}" data-open="${c.view}">${esc(c.label)}</button>`
                    : `<span class="${cls}"${last ? ' aria-current="page"' : ''}>${esc(c.label)}</span>`;
                return i ? `<span class="finder-sep" aria-hidden="true">›</span>${crumb}` : crumb;
            }).join('');

            countEl.textContent = plural(items.filter((item) => item.type !== 'new').length);
        }

        function go(view) {
            if (view === state.view && !state.query) return;
            past.push(state.view);
            future.length = 0;
            state.view = view;
            state.query = '';
            search.value = '';
            render();
        }

        function step(from, to) {
            if (!from.length) return;
            to.push(state.view);
            state.view = from.pop();
            state.query = '';
            search.value = '';
            render();
        }

        sideItems.forEach((el) => el.addEventListener('click', () => go(el.dataset.view)));
        backBtn.addEventListener('click', () => step(past, future));
        fwdBtn.addEventListener('click', () => step(future, past));

        modeBtns.forEach((btn) => btn.addEventListener('click', () => {
            if (state.mode === btn.dataset.mode) return;
            state.mode = btn.dataset.mode;
            modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            render();
        }));

        search.addEventListener('input', () => {
            state.query = search.value.trim();
            render();
        });

        // Folders / crumbs navigate, projects open Quick Look.
        finder.addEventListener('click', (e) => {
            const opener = e.target.closest('[data-open]');
            if (opener) return go(opener.dataset.open);
            const projectBtn = e.target.closest('[data-project]');
            if (projectBtn) openQuickLook(PROJECTS.find((p) => p.id === projectBtn.dataset.project), projectBtn);
        });

        finder.addEventListener('error', onImgError, true);

        // Video thumbnails play a muted preview while hovered (pointer
        // devices, motion allowed); the poster shows again on leave.
        if (canHover.matches && !calm.matches) {
            finder.addEventListener('mouseover', (e) => {
                const tile = e.target.closest('.fi');
                const preview = tile && tile.querySelector('.shot-preview');
                if (preview && preview.paused) preview.play().catch(() => {});
            });
            finder.addEventListener('mouseout', (e) => {
                const tile = e.target.closest('.fi');
                if (!tile || tile.contains(e.relatedTarget)) return;
                const preview = tile.querySelector('.shot-preview');
                if (preview) preview.pause();
            });
        }

        // ---- Quick Look ---------------------------------------------------
        const ql = document.getElementById('quicklook');
        const qlWindow = ql.querySelector('.ql-window');
        const qlFrame = document.getElementById('ql-frame');
        const qlFile = document.getElementById('ql-file');
        const qlInfoBtn = document.getElementById('ql-info-toggle');
        const qlOpenIcon = document.getElementById('ql-open-icon');
        const qlCta = document.getElementById('ql-cta');
        const deviceBtns = ql.querySelectorAll('[data-device]');
        const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
        let qlProject = null;
        let qlOrigin = null;
        let qlDevice = 'desktop';
        let closing = false;

        ql.addEventListener('error', onImgError, true);

        function fillFrame() {
            const p = qlProject;
            qlFile.textContent = p.video ? `${p.file}.mp4` : `${p.file}-${qlDevice === 'mobile' ? 'movil' : 'escritorio'}.png`;
            qlFrame.innerHTML = shotHTML(p, p.video ? 'video' : qlDevice);
            ql.classList.toggle('is-video', Boolean(p.video));
            ql.classList.toggle('is-mobile', !p.video && qlDevice === 'mobile');
            deviceBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.device === qlDevice)));
            ql.querySelector('.ql-stage').scrollTop = 0;
        }

        // Where the window flies from / back to: the clicked thumbnail.
        function originTransform() {
            const from = qlOrigin && qlOrigin.isConnected && (qlOrigin.querySelector('.fi-thumb, .fr-icon') || qlOrigin);
            if (!from) return 'translateY(24px) scale(0.92)';
            const a = from.getBoundingClientRect();
            const b = qlWindow.getBoundingClientRect();
            const dx = (a.left + a.width / 2) - (b.left + b.width / 2);
            const dy = (a.top + a.height / 2) - (b.top + b.height / 2);
            return `translate(${dx}px, ${dy}px) scale(${Math.max(a.width / b.width, 0.06)})`;
        }

        function openQuickLook(p, origin) {
            if (!p) return;
            qlProject = p;
            qlOrigin = origin;
            qlDevice = p.device || 'desktop';
            fillFrame();

            document.getElementById('ql-kicker').innerHTML = `${esc(p.kind)}${p.status === 'dev' ? ' <span class="fi-badge fi-badge--inline">En desarrollo</span>' : ''}`;
            document.getElementById('ql-name').textContent = p.name;
            document.getElementById('ql-industry').textContent = p.industry;
            document.getElementById('ql-desc').textContent = p.desc;
            document.getElementById('ql-list').innerHTML = p.list.map((li) => `<li>${esc(li)}</li>`).join('');
            const href = p.url || '#contact';
            const external = Boolean(p.url);
            [qlCta, qlOpenIcon].forEach((a) => {
                a.href = href;
                if (external) { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); }
            });
            document.getElementById('ql-cta-label').textContent = external ? 'Ver sitio' : 'Quiero algo así';
            qlOpenIcon.setAttribute('aria-label', external ? `Abrir ${p.name} en una pestaña nueva` : 'Ir al formulario de contacto');

            document.documentElement.classList.add('ql-lock');
            ql.showModal();
            closing = false;

            if (calm.matches) {
                ql.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
                return;
            }
            ql.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
            qlWindow.animate(
                [{ transform: originTransform(), opacity: 0.2, borderRadius: '6px' }, { transform: 'none', opacity: 1, borderRadius: '20px' }],
                { duration: 620, easing: EASE }
            );
        }

        function closeQuickLook() {
            if (!ql.open || closing) return Promise.resolve();
            closing = true;
            const done = () => {
                qlFrame.querySelectorAll('video').forEach((v) => v.pause());
                ql.close();
                document.documentElement.classList.remove('ql-lock');
                closing = false;
                if (qlOrigin && qlOrigin.isConnected) qlOrigin.focus({ preventScroll: true });
            };
            if (calm.matches) { done(); return Promise.resolve(); }
            const fade = ql.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
            qlWindow.animate(
                [{ transform: 'none', opacity: 1 }, { transform: originTransform(), opacity: 0 }],
                { duration: 420, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' }
            );
            return fade.finished.then(() => {
                done();
                fade.cancel();
                qlWindow.getAnimations().forEach((a) => a.cancel());
            });
        }

        // Esc animates out instead of snapping shut; so does a click on the
        // backdrop or the red light.
        ql.addEventListener('cancel', (e) => { e.preventDefault(); closeQuickLook(); });
        ql.addEventListener('click', (e) => {
            if (e.target === ql || e.target.closest('[data-ql-close]')) closeQuickLook();
        });

        deviceBtns.forEach((btn) => btn.addEventListener('click', () => {
            if (qlDevice === btn.dataset.device) return;
            qlDevice = btn.dataset.device;
            fillFrame();
            if (!calm.matches) {
                qlFrame.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE });
            }
        }));

        qlInfoBtn.addEventListener('click', () => {
            const hidden = ql.classList.toggle('is-noinfo');
            qlInfoBtn.setAttribute('aria-pressed', String(!hidden));
            qlInfoBtn.setAttribute('aria-label', hidden ? 'Mostrar información' : 'Ocultar información');
        });

        // In-page links (no live URL yet) close the window, then scroll.
        [qlCta, qlOpenIcon].forEach((a) => a.addEventListener('click', (e) => {
            if (a.getAttribute('href') !== '#contact') return;
            e.preventDefault();
            closeQuickLook().then(() => document.getElementById('contact').scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth' }));
        }));

        // First render waits until the window scrolls into view so the
        // cascade is actually seen.
        render();
        const finderObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                render();
                finderObserver.disconnect();
            }
        }, { threshold: 0.25 });
        finderObserver.observe(finder);
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

    // Typing in a flagged field clears its error state.
    contactForm.addEventListener('input', (e) => e.target.removeAttribute('aria-invalid'));

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const fields = ['form-name', 'form-email', 'form-company', 'form-project'].map((id) => document.getElementById(id));
        const [name, email, company, project] = fields.map((field) => field.value.trim());

        // Inline validation: flag empty fields (and a malformed email) with
        // aria-invalid, which the CSS turns into a red underline.
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        fields.forEach((field) => {
            const invalid = !field.value.trim() || (field.id === 'form-email' && !emailValid);
            field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
        });

        if (!name || !email || !company || !project || !emailValid) {
            formStatus.className = 'form-status error';
            formStatus.textContent = !emailValid && email
                ? 'Revisa tu correo, parece que tiene un error.'
                : 'Completa todos los campos para generar el mensaje de WhatsApp.';
            formStatus.style.display = 'block';
            fields.find((field) => field.getAttribute('aria-invalid') === 'true').focus();
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