/* =====================================================
   Amazon Clone - script.js

   1. Product data (array of objects) -> boxes rendered by JS
   2. Live products from fakestoreapi.com (fetch)
   3. Hero banner slider
   4. Search (suggestions + filter)
   5. Cart (price, line totals, subtotal, localStorage)
   6. Panels: cart drawer, "All" side menu, sign-in modal
   7. Sign-in / create account form validation
   8. Pincode popover, back to top, toast
   ===================================================== */

/* ---------- Small helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const store = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    remove(key) {
        try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
};

const formatPrice = n => '\u20B9' + Number(n).toLocaleString('en-IN');
const cssUrl      = src => 'url(' + JSON.stringify(src) + ')';
const titleCase   = s => s.charAt(0).toUpperCase() + s.slice(1);

let toastTimer;
function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}


/* =====================================================
   1. PRODUCT DATA
   Every box on the page is created from an object like these.
   (prices, ratings and review counts are sample values)
   ===================================================== */
const DEALS = [
    {
        id: 'deal-1',
        title: 'Up to 75% off | Deals on headphones',
        name: 'Wireless Bluetooth Neckband Earphones',
        category: 'Electronics',
        price: 799, rating: 4.3, count: 12450,
        image: 'box-1.jpg',
        keywords: ['headphones', 'earphones', 'audio']
    },
    {
        id: 'deal-2',
        title: 'Appliances for your home | Up to 55% off',
        name: 'Split Air Conditioner',
        category: 'Home appliances',
        price: 32990, rating: 4.2, count: 8120,
        image: 'box-2.jpg',
        keywords: ['appliances', 'air conditioner', 'ac']
    },
    {
        id: 'deal-3',
        title: 'Revamp your home in style',
        name: 'Crystal Wall Lamp',
        category: 'Home decor',
        price: 1499, rating: 4.1, count: 2310,
        image: 'box-3.jpg',
        keywords: ['decor', 'lamp', 'lighting', 'furniture']
    },
    {
        id: 'deal-4',
        title: 'Starting \u20B949 | Deals on home essentials',
        name: 'Chrome Rain Shower Head',
        category: 'Home essentials',
        price: 299, rating: 4.0, count: 5876,
        image: 'box-4.jpg',
        keywords: ['essentials', 'bathroom', 'shower']
    },
    {
        id: 'deal-5',
        title: 'Starting \u20B9199 | Amazon Brands & more',
        name: 'Printed Eyelet Curtains (Set of 2)',
        category: 'Amazon brands',
        price: 599, rating: 4.4, count: 18900,
        image: 'box-5.jpg',
        keywords: ['amazon brands', 'curtains']
    },
    {
        id: 'deal-6',
        title: 'Automotive essentials | Up to 60% off',
        name: 'Car Wash Pressure Washer',
        category: 'Automotive',
        price: 3499, rating: 4.4, count: 3405,
        image: 'box-6.jpg',
        keywords: ['car accessories', 'car wash', 'cleaning']
    },
    {
        id: 'deal-7',
        title: 'Bulk order discounts + 10% Guaranteed',
        name: 'Tablet with Adjustable Stand',
        category: 'Bulk orders',
        price: 34900, rating: 4.6, count: 1560,
        image: 'box-7.jpg',
        keywords: ['bulk order', 'business', 'tablet']
    },
    {
        id: 'deal-8',
        title: 'Up to 50% off | Toys | Amazon',
        name: 'Remote Control Monster Truck',
        category: 'Toys',
        price: 899, rating: 4.2, count: 6740,
        image: 'box-8.jpg',
        keywords: ['toys', 'kids toys', 'remote control']
    }
];

const API_URL    = 'https://fakestoreapi.com/products';
const USD_TO_INR = 85;          // the API prices are in dollars -> fixed demo rate to show rupees

const catalog = new Map();      // id -> product (each product also gets its .el card)

function stars(rating) {
    const full = Math.round(rating);
    return '\u2605'.repeat(full) + '\u2606'.repeat(5 - full);
}

// Build one product box. textContent is used (not innerHTML) because API data is untrusted.
function createCard(p) {
    const box = document.createElement('article');
    box.className = 'box';
    box.dataset.id = p.id;

    const content = document.createElement('div');
    content.className = 'box-content';

    const heading = document.createElement('h2');
    heading.textContent = p.title;
    heading.title = p.title;

    const img = document.createElement('div');
    img.className = 'box-img' + (p.contain ? ' contain' : '');
    img.setAttribute('role', 'img');
    img.setAttribute('aria-label', p.name || p.title);
    img.style.backgroundImage = cssUrl(p.image);

    content.append(heading, img);

    if (p.rating > 0) {
        const rating = document.createElement('div');
        rating.className = 'rating';
        rating.setAttribute('role', 'img');
        rating.setAttribute('aria-label', 'Rated ' + p.rating.toFixed(1) + ' out of 5');
        const starsEl = document.createElement('b');
        starsEl.textContent = stars(p.rating);
        const text = ' ' + p.rating.toFixed(1) + (p.count ? ' (' + p.count.toLocaleString('en-IN') + ')' : '');
        rating.append(starsEl, text);
        content.appendChild(rating);
    }

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = formatPrice(p.price);

    const footer = document.createElement('div');
    footer.className = 'box-footer';
    const more = document.createElement('p');
    more.textContent = 'see more';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-cart-btn';
    add.textContent = 'Add to Cart';
    footer.append(more, add);

    content.append(price, footer);
    box.appendChild(content);
    return box;
}

function renderProducts(list, container) {
    // forget what this container showed before (needed when "Retry" loads again)
    $$('.box', container).forEach(b => catalog.delete(b.dataset.id));

    const cards = list.map(p => {
        p.keywords = [...new Set([p.category.toLowerCase(), ...(p.keywords || [])])];
        p.el = createCard(p);
        catalog.set(p.id, p);
        return p.el;
    });
    container.replaceChildren(...cards);
}


/* =====================================================
   2. LIVE PRODUCTS (fetch from fakestoreapi.com)
   ===================================================== */
function toProduct(item) {
    // skip anything that doesn't look right instead of crashing the page
    if (!item || typeof item.title !== 'string' || typeof item.price !== 'number') return null;
    if (typeof item.image !== 'string' || !item.image.startsWith('https://')) return null;

    return {
        id: 'api-' + item.id,
        title: item.title,
        category: String(item.category || 'other'),
        price: Math.round(item.price * USD_TO_INR),
        rating: item.rating && typeof item.rating.rate === 'number' ? item.rating.rate : 0,
        count: item.rating && typeof item.rating.count === 'number' ? item.rating.count : 0,
        image: item.image,
        contain: true,                  // these are product cut-outs: show the whole picture
        keywords: []
    };
}

async function loadLiveProducts() {
    const grid   = $('#products-grid');
    const status = $('#products-status');
    const retry  = $('#products-retry');

    retry.hidden = true;
    status.textContent = 'Loading live products...';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);   // give up after 8 seconds

    try {
        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) throw new Error('Server returned ' + res.status);

        const data = await res.json();
        const list = (Array.isArray(data) ? data : []).map(toProduct).filter(Boolean);
        if (list.length === 0) throw new Error('No products in the response');

        renderProducts(list, grid);
        status.textContent = list.length + ' products from fakestoreapi.com';
    } catch (err) {
        console.warn('Live products failed:', err);
        status.textContent = "Couldn't load live products. Check your internet connection.";
        retry.hidden = false;
    } finally {
        clearTimeout(timer);
    }

    renderMenuCategories();
    search.refresh();      // keep the current search filter applied to the new boxes
}


/* =====================================================
   3. HERO SLIDER
   ===================================================== */
function initSlider() {
    const hero   = $('#hero');
    const slides = $$('.slide', hero);
    const dotsEl = $('#hero-dots');
    let current = 0;
    let hovering = false;

    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
    });
    const dots = $$('.dot', dotsEl);

    function goTo(n) {
        current = (n + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('active', i === current));
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    $('#hero-next').addEventListener('click', () => goTo(current + 1));
    $('#hero-prev').addEventListener('click', () => goTo(current - 1));

    hero.addEventListener('mouseenter', () => (hovering = true));
    hero.addEventListener('mouseleave', () => (hovering = false));
    setInterval(() => { if (!hovering) goTo(current + 1); }, 4000);

    goTo(0);
}


/* =====================================================
   4. SEARCH (suggestions + filter)
   ===================================================== */
let search = { run() {}, set() {}, refresh() {} };   // filled in by initSearch()

function initSearch() {
    const input   = $('#search-input');
    const btn     = $('#search-btn');
    const list    = $('#suggestions');
    const message = $('#no-results');
    const sections = [$('#deals'), $('#trending')];
    let activeIndex = -1;
    let currentQuery = '';
    let currentCategory = null;      // set when a side-menu category is chosen (exact match)

    function closeSuggestions() {
        list.hidden = true;
        activeIndex = -1;
    }

    // every keyword / product name that can be suggested (built from whatever is on the page)
    function suggestionPool() {
        const pool = new Set();
        catalog.forEach(p => {
            p.keywords.forEach(k => pool.add(k));
            if (p.name) pool.add(p.name.toLowerCase());
        });
        return [...pool];
    }

    function showSuggestions() {
        const q = input.value.trim().toLowerCase();
        const matches = q
            ? suggestionPool().filter(s => s.includes(q))
                  .sort((a, b) => a.startsWith(q) === b.startsWith(q) ? 0 : a.startsWith(q) ? -1 : 1)
                  .slice(0, 6)
            : [];

        list.innerHTML = '';
        if (matches.length === 0) return closeSuggestions();

        matches.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            li.addEventListener('mousedown', e => {      // mousedown fires before the input blurs
                e.preventDefault();
                input.value = text;
                runSearch(text);
            });
            list.appendChild(li);
        });
        activeIndex = -1;
        list.hidden = false;
    }

    function applyFilter(q, category) {
        const active = !!(q || category);
        let visible = 0;
        catalog.forEach(p => {
            // a menu category must match exactly ("men's clothing" must not match "women's clothing")
            const hit = category
                ? p.category.toLowerCase() === category
                : !q
                    || p.title.toLowerCase().includes(q)
                    || (p.name || '').toLowerCase().includes(q)
                    || p.keywords.some(k => k.includes(q));
            p.el.hidden = !hit;
            if (hit) visible++;
        });

        // hide a whole section when none of its boxes match
        sections.forEach(s => {
            s.hidden = active && !$$('.box', s).some(b => !b.hidden);
        });

        message.hidden = !active || visible > 0;
        if (active && visible === 0) {
            message.textContent = 'No results for "' + input.value.trim() + '". Try headphones, toys or electronics.';
        }
    }

    function runSearch(query, scroll = true, category = null) {
        currentQuery = query.trim().toLowerCase();
        currentCategory = category;
        applyFilter(currentQuery, currentCategory);
        closeSuggestions();
        if ((currentQuery || currentCategory) && scroll) {
            const target = !message.hidden ? message : sections.find(s => !s.hidden);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function moveActive(step) {
        const items = $$('li', list);
        if (items.length === 0) return;
        activeIndex = (activeIndex + step + items.length) % items.length;
        items.forEach((li, i) => li.classList.toggle('active', i === activeIndex));
        input.value = items[activeIndex].textContent;
    }

    input.addEventListener('input', () => {
        showSuggestions();
        if (input.value.trim() === '') runSearch('');
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown')    { e.preventDefault(); moveActive(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
        else if (e.key === 'Enter')   { runSearch(input.value); }
        else if (e.key === 'Escape')  { closeSuggestions(); }
    });

    btn.addEventListener('click', () => runSearch(input.value));

    document.addEventListener('click', e => {
        if (!e.target.closest('.nav-search')) closeSuggestions();
    });

    search = {
        run: runSearch,
        set(value, category = null) { input.value = value; runSearch(value, true, category); },
        refresh() { applyFilter(currentQuery, currentCategory); }
    };
}


/* =====================================================
   5. CART
   ===================================================== */
const CART_KEY = 'amazon_clone_cart_v2';
let cart = store.get(CART_KEY, []);

function saveCart() {
    store.set(CART_KEY, cart);
    renderCart();
}

function addToCart(product) {
    const found = cart.find(item => item.id === product.id);
    if (found) {
        found.qty += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.name || product.title,
            img: product.image,
            contain: !!product.contain,
            price: product.price,
            qty: 1
        });
    }
    saveCart();
}

function changeQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += change;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
}

function renderCart() {
    const itemsEl  = $('#cart-items');
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

    $('#cart-count').textContent = totalQty;
    $('#cart-total').textContent = totalQty;
    $('#cart-subtotal').textContent = formatPrice(subtotal);
    itemsEl.innerHTML = '';

    if (cart.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'cart-empty';
        empty.textContent = 'Your Amazon Cart is empty.';
        itemsEl.appendChild(empty);
        return;
    }

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';

        const thumb = document.createElement('div');
        thumb.className = 'cart-thumb' + (item.contain ? ' contain' : '');
        thumb.style.backgroundImage = cssUrl(item.img);

        const info = document.createElement('div');
        info.className = 'cart-info';

        const title = document.createElement('h4');
        title.textContent = item.title;

        const price = document.createElement('div');
        price.className = 'cart-price';
        price.textContent = formatPrice(item.price * item.qty)
            + (item.qty > 1 ? '  (' + formatPrice(item.price) + ' each)' : '');

        const qtyRow = document.createElement('div');
        qtyRow.className = 'qty-row';

        const minus = document.createElement('button');
        minus.textContent = '-';
        minus.setAttribute('aria-label', 'Decrease quantity');
        minus.addEventListener('click', () => changeQty(item.id, -1));

        const qty = document.createElement('b');
        qty.textContent = item.qty;

        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.setAttribute('aria-label', 'Increase quantity');
        plus.addEventListener('click', () => changeQty(item.id, 1));

        const remove = document.createElement('button');
        remove.className = 'remove';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => removeItem(item.id));

        qtyRow.append(minus, qty, plus, remove);
        info.append(title, price, qtyRow);
        row.append(thumb, info);
        itemsEl.appendChild(row);
    });
}

function initCart() {
    // one listener for every "Add to Cart" button (boxes are created by JS, also later by the API)
    document.addEventListener('click', e => {
        const button = e.target.closest('.add-cart-btn');
        if (!button) return;
        const product = catalog.get(button.closest('.box').dataset.id);
        if (!product) return;

        addToCart(product);
        showToast('Added to cart');
        button.textContent = 'Added \u2713';
        setTimeout(() => (button.textContent = 'Add to Cart'), 1000);
    });

    $('#cart-clear').addEventListener('click', () => {
        cart = [];
        saveCart();
    });

    renderCart();
}


/* =====================================================
   6. PANELS: cart drawer, side menu, sign-in modal
   Only one is open at a time, they share the dark overlay.
   ===================================================== */
const PANELS = { cart: '#cart-drawer', menu: '#side-menu', signin: '#signin-modal' };
let lastFocus = null;

function openPanel(name) {
    closePanels(false);
    lastFocus = document.activeElement;
    $(PANELS[name]).classList.add('open');
    $('#overlay').hidden = false;
    if (name === 'signin') setTimeout(focusAuthField, 50);
}

function closePanels(restoreFocus = true) {
    Object.values(PANELS).forEach(sel => $(sel).classList.remove('open'));
    $('#overlay').hidden = true;
    if (restoreFocus && lastFocus && lastFocus.focus) lastFocus.focus();
}

function initPanels() {
    $('#overlay').addEventListener('click', () => closePanels());
    $('#cart-close').addEventListener('click', () => closePanels());
    $('#menu-close').addEventListener('click', () => closePanels());
    $('#signin-close').addEventListener('click', () => closePanels());

    $('#nav-cart').addEventListener('click', () => openPanel('cart'));
    $('#menu-btn').addEventListener('click', () => openPanel('menu'));
    $('#nav-signin').addEventListener('click', () => openPanel(user ? 'menu' : 'signin'));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closePanels();

        // keyboard support for div-based buttons (role="button")
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) {
            e.preventDefault();
            e.target.click();
        }
    });
}


/* ---------- "All" side menu ---------- */
function renderMenuCategories() {
    const list = $('#menu-categories');
    const categories = new Map();           // lower-case key -> label
    catalog.forEach(p => {
        const key = p.category.toLowerCase();
        if (!categories.has(key)) categories.set(key, titleCase(p.category));
    });

    const items = [['', 'All products'], ...categories].map(([query, label]) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.query = query;
        b.textContent = label;
        li.appendChild(b);
        return li;
    });
    list.replaceChildren(...items);
}

function initMenu() {
    renderMenuCategories();

    $('#menu-categories').addEventListener('click', e => {
        const b = e.target.closest('button[data-query]');
        if (!b) return;
        closePanels(false);
        search.set(b.dataset.query ? b.textContent : '', b.dataset.query || null);
        if (!b.dataset.query) $('#deals').scrollIntoView({ behavior: 'smooth' });
    });

    $('#menu-cart').addEventListener('click', () => openPanel('cart'));
    $('#menu-signin').addEventListener('click', () => openPanel('signin'));
    $('#menu-signout').addEventListener('click', () => {
        user = null;
        store.remove(USER_KEY);
        renderUser();
        closePanels(false);
        showToast('You have been signed out');
    });
}


/* =====================================================
   7. SIGN IN / CREATE ACCOUNT (form validation)
   Front-end demo only: nothing is sent anywhere and the
   password is never stored - only the name and email.
   ===================================================== */
const USER_KEY = 'amazon_clone_user';
let user = store.get(USER_KEY, null);
let authMode = 'signin';                       // 'signin' or 'register'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function renderUser() {
    const hello = user ? 'Hello, ' + user.name : 'Hello, sign in';
    $('#hello-text').textContent = hello;
    $('#side-hello').textContent = hello;
    $('#menu-signin').hidden = !!user;
    $('#menu-signout').hidden = !user;
}

function focusAuthField() {
    const first = $('#name-group').hidden ? $('#email-input') : $('#name-input');
    first.focus();
}

function initAuth() {
    const form   = $('#signin-form');
    const inputs = { name: $('#name-input'), email: $('#email-input'), password: $('#password-input') };

    // each rule returns an error message, or '' when the value is fine
    const rules = {
        name(v) {
            return v.trim().length < 2 ? 'Enter your name (at least 2 characters)' : '';
        },
        email(v) {
            if (!v.trim()) return 'Enter your email';
            return EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email, like name@example.com';
        },
        password(v) {
            if (!v) return 'Enter your password';
            if (authMode === 'signin') return v.length < 6 ? 'Password must be at least 6 characters' : '';
            if (v.length < 8) return 'Use at least 8 characters';
            return /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : 'Include at least one letter and one number';
        }
    };

    function setError(field, message) {
        $('#' + field + '-error').textContent = message;
        inputs[field].setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateField(field) {
        const message = rules[field](inputs[field].value);
        setError(field, message);
        return message === '';
    }

    function clearErrors() {
        Object.keys(inputs).forEach(f => setError(f, ''));
    }

    function setMode(mode) {
        authMode = mode;
        const signin = mode === 'signin';
        $('#auth-title').textContent = signin ? 'Sign in' : 'Create account';
        $('#auth-submit').textContent = signin ? 'Sign in' : 'Create account';
        $('#auth-toggle').textContent = signin ? 'New to Amazon? Create your account' : 'Already a customer? Sign in';
        $('#name-group').hidden = signin;
        $('#password-hint').hidden = signin;
        inputs.password.autocomplete = signin ? 'current-password' : 'new-password';
        clearErrors();
        focusAuthField();
    }

    // check a field when the user leaves it, and again while typing once it shows an error
    Object.keys(inputs).forEach(field => {
        inputs[field].addEventListener('blur', () => {
            if (inputs[field].value !== '') validateField(field);
        });
        inputs[field].addEventListener('input', () => {
            if (inputs[field].getAttribute('aria-invalid') === 'true') validateField(field);
        });
    });

    $('#show-pass').addEventListener('change', e => {
        inputs.password.type = e.target.checked ? 'text' : 'password';
    });

    $('#auth-toggle').addEventListener('click', () => setMode(authMode === 'signin' ? 'register' : 'signin'));

    form.addEventListener('submit', e => {
        e.preventDefault();

        const fields = authMode === 'register' ? ['name', 'email', 'password'] : ['email', 'password'];
        let firstInvalid = null;
        fields.forEach(f => {
            if (!validateField(f) && !firstInvalid) firstInvalid = inputs[f];
        });
        if (firstInvalid) { firstInvalid.focus(); return; }

        const email = inputs.email.value.trim();
        const rawName = authMode === 'register'
            ? inputs.name.value.trim().split(/\s+/)[0]
            : email.split('@')[0].split(/[._-]/)[0];

        user = { name: titleCase(rawName), email };
        store.set(USER_KEY, user);
        renderUser();

        form.reset();
        inputs.password.type = 'password';
        clearErrors();
        setMode('signin');
        closePanels(false);
        showToast('Welcome, ' + user.name + '!');
    });

    renderUser();
}


/* =====================================================
   8. PINCODE, BACK TO TOP
   ===================================================== */
function initPincode() {
    const wrap  = $('#nav-address');
    const pop   = $('#pin-popover');
    const text  = $('#deliver-text');
    const input = $('#pin-input');
    const error = $('#pin-error');
    const PIN_KEY = 'amazon_clone_pin';

    const saved = store.get(PIN_KEY, null);
    if (saved) text.textContent = saved;

    wrap.addEventListener('click', e => {
        if (e.target.closest('#pin-popover')) return;
        pop.hidden = !pop.hidden;
        if (!pop.hidden) input.focus();
    });

    function applyPin() {
        const pin = input.value.trim();
        if (!/^\d{6}$/.test(pin)) {
            error.textContent = 'Please enter a valid 6-digit pincode';
            return;
        }
        error.textContent = '';
        const label = 'India ' + pin;
        text.textContent = label;
        store.set(PIN_KEY, label);
        pop.hidden = true;
        showToast('Delivery location updated');
    }

    $('#pin-apply').addEventListener('click', applyPin);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') applyPin(); });

    document.addEventListener('click', e => {
        if (!wrap.contains(e.target)) pop.hidden = true;
    });
}

function initBackToTop() {
    const floating = $('#to-top');
    const goTop = e => {
        if (e) e.preventDefault();           // footer bar is an <a href="#top">
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    floating.addEventListener('click', goTop);
    $('.foot-panel1').addEventListener('click', goTop);

    window.addEventListener('scroll', () => {
        floating.classList.toggle('show', window.scrollY > 400);
    });
}


/* ---------- Placeholder links (href="#") should not jump to the top ---------- */
document.addEventListener('click', e => {
    const link = e.target.closest('a[href="#"]');
    if (link) e.preventDefault();
});


/* ---------- Start everything ---------- */
renderProducts(DEALS, $('#deals'));       // boxes appear instantly from the local array
initSlider();
initSearch();
initCart();
initPanels();
initMenu();
initAuth();
initPincode();
initBackToTop();
loadLiveProducts();                       // then the live products arrive from the API
$('#products-retry').addEventListener('click', loadLiveProducts);
