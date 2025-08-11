(function () {
  const cfg = window.PROFILE_CONFIG || {};

  const root = document.documentElement;
  if (cfg.site?.theme) {
    root.style.setProperty('--primary', cfg.site.theme.primary || '#6c5ce7');
    root.style.setProperty('--accent', cfg.site.theme.accent || '#00d1ff');
    root.style.setProperty('--text', cfg.site.theme.text || '#f6f7fb');
    root.style.setProperty('--muted', cfg.site.theme.muted || '#cfd3e3');
  }
  if (cfg.site?.backgroundImage) {
    root.style.setProperty('--site-bg', `url('${cfg.site.backgroundImage}')`);
  }

  (function setupAnimatedBackground() {
    const ab = cfg.site?.animatedBackground;
    if (!ab?.enabled) return;
    document.body.classList.add('animated-bg');
    const container = document.getElementById('bg-animated');
    if (!container) return;
    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;
    let isSmall = false;
    function resize() {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      isSmall = Math.min(width, height) < 700;
    }
    resize();
    window.addEventListener('resize', resize);

    const primary = getComputedStyle(root).getPropertyValue('--primary').trim() || '#6c5ce7';
    const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#00d1ff';

    const particles = [];
    let linkMaxDist = 110;
    let repelRadius = 130;
    const mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0, down: false };
    let lastInput = performance.now();
    let autoPhase = 0;
    let lastMouseX = mouse.x, lastMouseY = mouse.y;

    const onPointerMove = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      mouse.vx = x - lastMouseX;
      mouse.vy = y - lastMouseY;
      mouse.x = lastMouseX = x;
      mouse.y = lastMouseY = y;
      lastInput = performance.now();
    };

    window.addEventListener('pointermove', (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length) {
        const t = e.touches[0];
        onPointerMove(t.clientX, t.clientY);
      }
    }, { passive: true });
    window.addEventListener('deviceorientation', (e) => {
      const ax = Math.max(-45, Math.min(45, (e.gamma || 0)));
      const ay = Math.max(-45, Math.min(45, (e.beta || 0)));
      const x = (ax + 45) / 90 * width;
      const y = (ay + 45) / 90 * height;
      onPointerMove(x, y);
    });

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    linkMaxDist = isSmall ? 80 : 110;
    repelRadius = isSmall ? 90 : 130;
    const particleCount = isSmall ? 60 : 110;
    const rMin = isSmall ? 1.8 : 1.4;
    const rMax = isSmall ? 3.8 : 3.4;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(rMin, rMax),
        hue: Math.random() < 0.5 ? primary : accent,
        vx: rand(-0.4, 0.4),
        vy: rand(-0.4, 0.4),
      });
    }

    function hexToRgba(hex, alpha) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!m) return `rgba(108,92,231,${alpha})`;
      const r = parseInt(m[1], 16);
      const g = parseInt(m[2], 16);
      const b = parseInt(m[3], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, hexToRgba(primary, 0.13));
      g.addColorStop(1, hexToRgba(accent, 0.13));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = isSmall ? 0.9 : 1.1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < linkMaxDist * linkMaxDist) {
            const alpha = 1 - dist2 / (linkMaxDist * linkMaxDist);
            const base = isSmall ? 0.22 : 0.12;
            ctx.strokeStyle = `rgba(255,255,255,${base * alpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, p.hue);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      const strength = isSmall ? 900 : 1200;

      const now = performance.now();
      if (now - lastInput > 1500) {
        autoPhase += 0.008 * (isSmall ? 1.3 : 1);
        const ax = Math.sin(autoPhase) * 0.35 + 0.5; // 0..1
        const ay = Math.cos(autoPhase * 0.9) * 0.35 + 0.5;
        mouse.x = ax * width;
        mouse.y = ay * height;
        mouse.vx *= 0.9;
        mouse.vy *= 0.9;
      }
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < repelRadius * repelRadius) {
          const dist = Math.sqrt(dist2) || 0.001;
          const force = (strength / dist2) + 0.02 * (mouse.vx + mouse.vy);
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        p.vx = lerp(p.vx, Math.sign(p.vx) * 0.25, 0.002);
        p.vy = lerp(p.vy, Math.sign(p.vy) * 0.25, 0.002);

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }
    }

    function loop() {
      step();
      draw();
      requestAnimationFrame(loop);
    }
    loop();
  })();

  const bannerImage = document.getElementById('bannerImage');
  const avatarImage = document.getElementById('avatarImage');
  const displayName = document.getElementById('displayName');
  const rolesContainer = document.getElementById('roles');
  const socialLinks = document.getElementById('socialLinks');
  const card = document.querySelector('.profile-card');
  const avatarWrap = avatarImage ? avatarImage.closest('.avatar-wrapper') : null;
  const bannerWrap = bannerImage ? bannerImage.parentElement : null;

  if (avatarImage) avatarImage.referrerPolicy = 'no-referrer';
  if (bannerImage) bannerImage.referrerPolicy = 'no-referrer';

  function preload(url) {
    return new Promise((resolve, reject) => {
      if (!url) return reject(new Error('No URL'));
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error('Load failed'));
      img.src = url;
    });
  }

  const discordEnabled = !!(cfg.dynamic && cfg.dynamic.discord && cfg.dynamic.discord.enabled);
  if (cfg.user) {
    displayName.textContent = cfg.user.displayName || 'Your Name';
    avatarImage.alt = `${cfg.user.displayName} avatar`;
    bannerImage.alt = `${cfg.user.displayName} banner`;

    if (!discordEnabled) {
      if (cfg.user.avatar) {
        preload(cfg.user.avatar)
          .then((url) => {
            avatarImage.src = url;
            avatarWrap && avatarWrap.classList.remove('fallback');
          })
          .catch(() => {
            if (avatarWrap) avatarWrap.classList.add('fallback');
          });
      } else if (avatarWrap) {
        avatarWrap.classList.add('fallback');
      }

      if (cfg.user.banner) {
        preload(cfg.user.banner)
          .then((url) => {
            bannerImage.src = url;
            bannerWrap && bannerWrap.classList.remove('no-image');
          })
          .catch(() => {
            if (bannerWrap) bannerWrap.classList.add('no-image');
          });
      } else if (bannerWrap) {
        bannerWrap.classList.add('no-image');
      }
    } else {
      if (avatarWrap) avatarWrap.classList.add('fallback');
      if (bannerWrap) bannerWrap.classList.add('no-image');
    }
  }

  if (avatarImage) {
    avatarImage.addEventListener('error', () => {
      if (avatarWrap) avatarWrap.classList.add('fallback');
      avatarImage.removeAttribute('src');
    });
  }
  if (bannerImage) {
    bannerImage.addEventListener('error', () => {
      if (bannerWrap) bannerWrap.classList.add('no-image');
      bannerImage.removeAttribute('src');
    });
  }

  const ICONS = {
    github: '<i class="fab fa-github"></i>',
    youtube: '<i class="fab fa-youtube"></i>',
    twitter: '<i class="fab fa-x-twitter"></i>',
    discord: '<i class="fab fa-discord"></i>',
    steam: '<i class="fab fa-steam"></i>',
    instagram: '<i class="fab fa-instagram"></i>',
    facebook: '<i class="fab fa-facebook"></i>',
    playstation: '<i class="fab fa-playstation"></i>',
    telegram: '<i class="fab fa-telegram"></i>',
    spotify: '<i class="fab fa-spotify"></i>',
    snapchat: '<i class="fab fa-snapchat"></i>'
  };

  function createSocialLink(item) {
    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    anchor.title = item.name;
    anchor.innerHTML = ICONS[item.icon] || ICONS.github;
    return anchor;
  }

  if (Array.isArray(cfg.socials)) {
    cfg.socials.forEach((s) => {
      const el = createSocialLink(s);
      el.addEventListener('pointerdown', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = el.getBoundingClientRect();
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
      socialLinks.appendChild(el);
    });
  }

  const roles = Array.isArray(cfg.user?.roles) && cfg.user.roles.length ? cfg.user.roles : [];
  const roleIcons = cfg.roles || {};

  function renderRoleBadges() {
    if (!rolesContainer) return;
    rolesContainer.innerHTML = '';
    roles.forEach((role) => {
      const badge = document.createElement('span');
      badge.className = 'role-badge';
      badge.innerHTML = `${roleIcons[role] || ''}<span class="label">${role}</span>`;
      rolesContainer.appendChild(badge);
    });
  }

  renderRoleBadges();

  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let rafId = 0;

  function animateTilt() {
    const easing = 0.1;
    currentTiltX += (targetTiltX - currentTiltX) * easing;
    currentTiltY += (targetTiltY - currentTiltY) * easing;
    document.documentElement.style.setProperty('--tiltX', `${currentTiltX.toFixed(3)}deg`);
    document.documentElement.style.setProperty('--tiltY', `${currentTiltY.toFixed(3)}deg`);
    rafId = requestAnimationFrame(animateTilt);
  }

  function handleTilt(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    targetTiltY = (x - 0.5) * 6;
    targetTiltX = -(y - 0.5) * 6;
  }

  function resetTilt() {
    targetTiltX = 0;
    targetTiltY = 0;
  }

  if (card) {
    animateTilt();
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
    requestAnimationFrame(() => card.classList.add('revealed'));
  }

  const discordCfg = cfg.dynamic?.discord;

  function isAnimated(hash) {
    return typeof hash === 'string' && hash.startsWith('a_');
  }

  function buildAvatarUrl(userId, avatarHash, size) {
    if (!userId || !avatarHash) return null;
    const ext = isAnimated(avatarHash) ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=${size || 256}`;
  }

  function buildBannerUrl(userId, bannerHash, size) {
    if (!userId || !bannerHash) return null;
    const ext = isAnimated(bannerHash) ? 'gif' : 'png';
    return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=${size || 1024}`;
  }

  function buildBannerUrlWithExt(userId, bannerHash, ext, size) {
    if (!userId || !bannerHash || !ext) return null;
    return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=${size || 1024}`;
  }

  function ensureSizeParam(url, desiredSize) {
    try {
      const u = new URL(url);
      u.searchParams.set('size', String(desiredSize));
      return u.toString();
    } catch {
      return url;
    }
  }

  function replaceExtension(url, newExt) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('.');
      if (parts.length > 1) {
        parts[parts.length - 1] = newExt;
        u.pathname = parts.join('.');
        return u.toString();
      }
    } catch {}
    return url;
  }

  function buildProxyUrls(originalUrl) {
    try {
      const encoded = encodeURIComponent(originalUrl);
      const u = new URL(originalUrl);
      return [
        `https://wsrv.nl/?url=${encoded}`,
        `https://images.weserv.nl/?url=${encodeURIComponent(u.host + u.pathname + u.search)}`,
        `https://cdn.statically.io/img/${u.host}${u.pathname}${u.search}`,
      ];
    } catch {
      return [];
    }
  }

  async function tryLoadAny(urls) {
    const expanded = [];
    for (const u of urls) {
      if (!u) continue;
      expanded.push(u, ...buildProxyUrls(u));
    }
    const tried = new Set();
    for (const url of expanded) {
      if (!url || tried.has(url)) continue;
      tried.add(url);
      try {
        await loadImage(url);
        return url;
      } catch {}
    }
    throw new Error('No banner candidates loaded');
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      if (!url) return reject(new Error('No URL'));
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }

  function applyDiscordProfile(profile) {
    if (discordCfg?.overrideDisplayName && profile.displayName) {
      displayName.textContent = profile.displayName;
    }

    const avatarUrl = profile.avatarUrl;
    const bannerUrl = profile.bannerUrl;

    Promise.all([
      avatarUrl ? loadImage(avatarUrl).catch(() => null) : Promise.resolve(null),
      (async () => {
        const candidates = [];
        const desired = (discordCfg?.imageSizes?.banner) || 2048;
        if (bannerUrl) {
          const sized = ensureSizeParam(bannerUrl, desired);
          candidates.push(sized);
          candidates.push(replaceExtension(sized, 'webp'));
          candidates.push(replaceExtension(sized, 'png'));
          candidates.push(replaceExtension(sized, 'jpg'));
          candidates.push(replaceExtension(sized, 'gif'));
        }
        if (profile.bannerHash && profile.userId) {
          const hash = profile.bannerHash;
          const isAnim = isAnimated(hash);
          const exts = isAnim ? ['gif', 'webp', 'png', 'jpg'] : ['webp', 'png', 'jpg'];
          const sizes = [desired, 1024];
          for (const sz of sizes) {
            for (const ext of exts) {
              candidates.push(buildBannerUrlWithExt(profile.userId, hash, ext, sz));
            }
          }
        }
        const unique = Array.from(new Set(candidates.filter(Boolean)));
        try {
          const ok = await tryLoadAny(unique);
          return ok;
        } catch {
          return null;
        }
      })()
    ]).then(([aUrl, bUrl]) => {
      if (aUrl) {
        avatarImage.src = aUrl;
        avatarImage.closest('.avatar-wrapper')?.classList.remove('fallback');
      } else if (!cfg.user?.avatar) {
        avatarImage.closest('.avatar-wrapper')?.classList.add('fallback');
      }
      if (bUrl) {
        bannerImage.src = bUrl;
        bannerImage.onload = () => {
          const naturalW = bannerImage.naturalWidth || 0;
          if (naturalW && naturalW < 1000 && /\/banners\//.test(bUrl)) {
            const url = new URL(bUrl);
            const search = url.searchParams;
            const sizeParam = Number(search.get('size')) || 1024;
            if (sizeParam < 2048) {
              search.set('size', '2048');
              const upgraded = url.toString();
              loadImage(upgraded).then(() => {
                bannerImage.src = upgraded;
              }).catch(() => {});
            }
          }
        };
        bannerImage.parentElement?.classList.remove('no-image');
      } else if (!cfg.user?.banner) {
        bannerImage.parentElement?.classList.add('no-image');
      }
    }).catch(() => {
    });
  }

  async function fetchFromJapi(userId) {
    const url = `https://japi.rest/discord/v1/user/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('JAPI request failed');
    const json = await res.json();
    const data = json?.data || json;
    if (!data) throw new Error('No data from JAPI');

    const display = data.global_name || data.display_name || data.tag || data.username;
    const avatarHash = data.avatar;
    const bannerHash = data.banner;
    const avatarUrl = data.avatarURL || buildAvatarUrl(userId, avatarHash, discordCfg?.imageSizes?.avatar || 256);
    const bannerUrl = data.bannerURL || buildBannerUrl(userId, bannerHash, discordCfg?.imageSizes?.banner || 1024);
    const accent = data.accent_color || data.banner_color || null;
    return { displayName: display, avatarUrl, bannerUrl, bannerHash, userId, accentColor: accent };
  }

  async function fetchFromLanyard(userId) {
    const url = `https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Lanyard request failed');
    const json = await res.json();
    const user = json?.data?.discord_user;
    if (!user) throw new Error('No user from Lanyard');
    const display = user.global_name || user.display_name || user.username;
    const avatarHash = user.avatar;
    const avatarUrl = buildAvatarUrl(userId, avatarHash, discordCfg?.imageSizes?.avatar || 256);
    return { displayName: display, avatarUrl, bannerUrl: null, bannerHash: null, userId };
  }

  async function fetchFromDiscordLookup(userId) {
    const url = `https://discordlookup.mesavirep.xyz/v1/user/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('DiscordLookup request failed');
    const data = await res.json();
    const display = data.global_name || data.username || data.tag;
    const avatarUrl = data.avatar || null;
    const bannerUrl = data.banner || null;
    return { displayName: display, avatarUrl, bannerUrl, bannerHash: null, userId };
  }

  async function refreshDiscord() {
    if (!discordCfg?.enabled || !discordCfg?.userId) return;
    const baseOrder = Array.isArray(discordCfg.sourcePriority) ? discordCfg.sourcePriority : ['japi', 'lanyard'];
    const order = Array.from(new Set([...baseOrder, 'discordlookup']));
    for (const src of order) {
      try {
        let profile;
        if (src === 'japi') profile = await fetchFromJapi(discordCfg.userId);
        else if (src === 'lanyard') profile = await fetchFromLanyard(discordCfg.userId);
        else if (src === 'discordlookup') profile = await fetchFromDiscordLookup(discordCfg.userId);
        if (profile) {
          applyDiscordProfile(profile);
          return;
        }
      } catch (e) {
      }
    }
  }

  refreshDiscord();
  if (discordCfg?.enabled && discordCfg?.refreshMs) {
    const ms = Math.max(15000, Number(discordCfg.refreshMs) || 60000);
    setInterval(refreshDiscord, ms);
  }
})();