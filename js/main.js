/* ── Therapeutica · main.js ── */

(function () {
  'use strict';

  /* ── Sticky nav ── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Hamburger / mobile menu ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── Fade-up on scroll ── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
            // Reset any stagger transition-delay after fade-in so hover is instant
            entry.target.addEventListener('transitionend', () => {
              entry.target.style.transitionDelay = '0s';
            }, { once: true });
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ── Contact form ── */
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  if (form && submitBtn) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      if (!name.value.trim() || !email.value.trim()) {
        [name, email].forEach(f => { if (!f.value.trim()) f.classList.add('error'); });
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Slanje...';
      setTimeout(() => {
        submitBtn.textContent = 'Poruka poslata ✓';
        submitBtn.classList.add('sent');
        form.reset();
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Pošalji poruku';
          submitBtn.classList.remove('sent');
        }, 4000);
      }, 900);
    });
    form.querySelectorAll('input, textarea').forEach(f => {
      f.addEventListener('input', () => f.classList.remove('error'));
    });
  }

  /* ── Typewriter scroll effect ── */
  function initTypewriter() {
    const section = document.querySelector('.citat');
    const textEl = document.getElementById('typewriterText');
    if (!section || !textEl) return;

    // Parse innerHTML preserving <br> as newlines
    const raw = textEl.innerHTML;
    const parts = raw.split(/<br\s*\/?>/gi);
    let charSpans = [];
    let rebuiltHtml = '';

    parts.forEach((part, pi) => {
      // Decode HTML entities and trim
      const div = document.createElement('div');
      div.innerHTML = part;
      const text = div.textContent || '';
      text.split('').forEach(ch => {
        const escaped = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
        rebuiltHtml += `<span class="char">${escaped}</span>`;
        charSpans.push(ch);
      });
      if (pi < parts.length - 1) rebuiltHtml += '<br>';
    });

    textEl.innerHTML = rebuiltHtml;
    const spans = textEl.querySelectorAll('.char');
    const total = spans.length;
    let lastVisible = -1;

    function update() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Type in: as section top scrolls from 85%vh to 30%vh
      const enterStart = vh * 0.85;
      const enterEnd   = vh * 0.20;
      let progress = (enterStart - rect.top) / (enterStart - enterEnd);
      progress = Math.max(0, Math.min(1, progress));

      const showCount = Math.round(progress * total);
      if (showCount === lastVisible) return;

      // Batch DOM updates
      if (showCount > lastVisible) {
        for (let i = lastVisible; i < showCount; i++) {
          spans[i] && spans[i].classList.add('visible');
        }
      } else {
        for (let i = showCount; i < lastVisible; i++) {
          spans[i] && spans[i].classList.remove('visible');
        }
      }
      lastVisible = showCount;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── WebGL Shader — Programi section background ── */
  function initProgramiShader() {
    const canvas = document.getElementById('programiCanvas');
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() { gl_Position = aVertexPosition; }
    `;

    // Fragment shader: dark green background + gold plasma lines
    const fsSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;

      const float overallSpeed = 0.12;
      const float gridSmoothWidth = 0.015;
      const float axisWidth = 0.05;
      const float majorLineWidth = 0.025;
      const float minorLineWidth = 0.0125;
      const float majorLineFrequency = 5.0;
      const float minorLineFrequency = 1.0;
      const float scale = 5.0;
      const vec4 lineColor = vec4(0.78, 0.62, 0.21, 1.0);
      const float minLineWidth = 0.01;
      const float maxLineWidth = 0.2;
      const float lineSpeed = 1.0 * overallSpeed;
      const float lineAmplitude = 0.55;
      const float lineFrequency = 0.2;
      const float warpSpeed = 0.2 * overallSpeed;
      const float warpFrequency = 0.5;
      const float warpAmplitude = 0.55;
      const float offsetFrequency = 0.5;
      const float offsetSpeed = 1.33 * overallSpeed;
      const float minOffsetSpread = 0.25;
      const float maxOffsetSpread = 0.9;
      const int linesPerGroup = 10;

      #define drawCircle(pos,radius,coord) smoothstep(radius+gridSmoothWidth,radius,length(coord-(pos)))
      #define drawSmoothLine(pos,hw,t) smoothstep(hw,0.0,abs(pos-(t)))
      #define drawCrispLine(pos,hw,t) smoothstep(hw+gridSmoothWidth,hw,abs(pos-(t)))
      #define drawPeriodicLine(freq,w,t) drawCrispLine(freq/2.0,w,abs(mod(t,freq)-(freq)/2.0))

      float random(float t){return(cos(t)+cos(t*1.3+1.3)+cos(t*1.4+1.4))/3.0;}
      float getPlasmaY(float x,float hf,float off){
        return random(x*lineFrequency+iTime*lineSpeed)*hf*lineAmplitude+off;
      }

      void main(){
        vec2 fragCoord=gl_FragCoord.xy;
        vec2 uv=fragCoord/iResolution.xy;
        vec2 space=(fragCoord-iResolution.xy/2.0)/iResolution.x*2.0*scale;

        float horizontalFade=1.0-(cos(uv.x*6.28)*0.5+0.5);
        float verticalFade=1.0-(cos(uv.y*6.28)*0.5+0.5);

        space.y+=random(space.x*warpFrequency+iTime*warpSpeed)*warpAmplitude*(0.5+horizontalFade);
        space.x+=random(space.y*warpFrequency+iTime*warpSpeed+2.0)*warpAmplitude*horizontalFade;

        vec4 lines=vec4(0.0);
        vec4 bgColor1=vec4(0.035,0.094,0.059,1.0);
        vec4 bgColor2=vec4(0.055,0.130,0.080,1.0);

        for(int l=0;l<linesPerGroup;l++){
          float norm=float(l)/float(linesPerGroup);
          float offsetTime=iTime*offsetSpeed;
          float offsetPos=float(l)+space.x*offsetFrequency;
          float rand=random(offsetPos+offsetTime)*0.5+0.5;
          float hw=mix(minLineWidth,maxLineWidth,rand*horizontalFade)/2.0;
          float off=random(offsetPos+offsetTime*(1.0+norm))*mix(minOffsetSpread,maxOffsetSpread,horizontalFade);
          float lp=getPlasmaY(space.x,horizontalFade,off);
          float line=drawSmoothLine(lp,hw,space.y)/2.0+drawCrispLine(lp,hw*0.15,space.y);
          float cx=mod(float(l)+iTime*lineSpeed,25.0)-12.0;
          vec2 cp=vec2(cx,getPlasmaY(cx,horizontalFade,off));
          float circle=drawCircle(cp,0.01,space)*4.0;
          line=line+circle;
          lines+=line*lineColor*rand;
        }

        vec4 fragColor=mix(bgColor1,bgColor2,uv.x);
        fragColor*=verticalFade;
        fragColor.a=1.0;
        fragColor+=lines*0.28;
        fragColor.a=1.0;
        gl_FragColor=fragColor;
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Shader error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) { canvas.style.display = 'none'; return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Program error:', gl.getProgramInfoLog(prog));
      canvas.style.display = 'none';
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'aVertexPosition');
    const resLoc = gl.getUniformLocation(prog, 'iResolution');
    const timeLoc = gl.getUniformLocation(prog, 'iTime');
    const section = canvas.closest('.programi');

    function resize() {
      const w = section ? section.offsetWidth : window.innerWidth;
      const h = section ? section.offsetHeight : window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    window.addEventListener('resize', resize);
    resize();

    // All setup succeeded — show canvas
    canvas.style.display = 'block';

    const t0 = Date.now();
    function render() {
      requestAnimationFrame(render);
      const t = (Date.now() - t0) / 1000;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(posLoc);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    render();
  }

  /* ── Word cycle (Hero H1) ── */
  function initWordCycle() {
    const items = Array.from(document.querySelectorAll('.word-cycle__item'));
    const container = document.querySelector('.word-cycle');
    if (!items.length || !container) return;

    let current = 0;

    // Measure max width to prevent layout jump
    let maxW = 0;
    items.forEach(el => {
      el.style.position = 'relative';
      el.style.display = 'inline-block';
      el.style.opacity = '1';
      if (el.offsetWidth > maxW) maxW = el.offsetWidth;
      el.style.position = '';
      el.style.display = '';
      el.style.opacity = '';
    });
    container.style.width = maxW + 'px';

    // Activate first word — after one frame so transition fires consistently
    requestAnimationFrame(() => {
      requestAnimationFrame(() => items[0].classList.add('wc-active'));
    });

    setInterval(() => {
      const prev = current;
      current = (current + 1) % items.length;

      items[prev].classList.remove('wc-active');
      items[prev].classList.add('wc-past');
      // One frame delay ensures outgoing transition starts before incoming
      requestAnimationFrame(() => items[current].classList.add('wc-active'));

      setTimeout(() => items[prev].classList.remove('wc-past'), 500);
    }, 2400);
  }

  /* ── Kontakt form hover → heading color swap ── */
  function initKontaktHover() {
    const kontaktForm = document.querySelector('.kontakt__form');
    const heading = document.querySelector('.kontakt__heading');
    if (!kontaktForm || !heading) return;
    kontaktForm.addEventListener('mouseenter', () => heading.classList.add('form-hover'));
    kontaktForm.addEventListener('mouseleave', () => heading.classList.remove('form-hover'));
  }

  /* ── Orbital benefits animation ── */
  function initOrbitalBenefits() {
    const wrap = document.getElementById('orbWrap');
    if (!wrap) return;

    const RADIUS = 200;
    const SPEED  = 0.007; // rad per frame at 60 fps
    let angle      = 0;
    let autoRotate = true;
    let activeIdx  = null;
    let lastTs     = null;

    const nodes     = Array.from(wrap.querySelectorAll('.orb-node'));
    const panelHint = document.querySelector('.orb-panel__hint');
    const panelInfo = document.getElementById('orbPanelInfo');
    const panelTitle = document.getElementById('orbPanelTitle');
    const panelDesc  = document.getElementById('orbPanelDesc');

    function getPos(i, total, rot) {
      // first node starts at 12 o'clock (−π/2)
      const a = (i / total) * Math.PI * 2 - Math.PI / 2 + rot;
      const x = Math.cos(a) * RADIUS;
      const y = Math.sin(a) * RADIUS;
      const depth = (Math.sin(a + Math.PI / 2) + 1) / 2; // 0=back 1=front
      return { x, y, depth };
    }

    function updatePositions() {
      const total = nodes.length;
      nodes.forEach((node, i) => {
        const { x, y, depth } = getPos(i, total, angle);
        const scale   = 0.8 + 0.2 * depth;
        const opacity = activeIdx === null
          ? 0.45 + 0.55 * depth
          : (i === activeIdx ? 1 : 0.18 + 0.22 * depth);
        const z = i === activeIdx ? 100 : Math.round(20 + 70 * depth);
        node.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
        node.style.opacity   = opacity;
        node.style.zIndex    = z;
      });
    }

    function raf(ts) {
      if (lastTs !== null && autoRotate) {
        const dt = Math.min(ts - lastTs, 50);
        angle = (angle + SPEED * (dt / 16.67)) % (Math.PI * 2);
      }
      lastTs = ts;
      updatePositions();
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    function activate(i) {
      nodes.forEach(n => n.classList.remove('is-active'));
      nodes[i].classList.add('is-active');
      activeIdx  = i;
      autoRotate = false;
      if (panelHint) panelHint.style.display = 'none';
      if (panelInfo) {
        panelTitle.textContent = nodes[i].dataset.title;
        panelDesc.textContent  = nodes[i].dataset.desc;
        panelInfo.style.display = 'flex';
      }
      updatePositions();
    }

    function deactivate() {
      nodes.forEach(n => n.classList.remove('is-active'));
      activeIdx  = null;
      autoRotate = true;
      if (panelHint) panelHint.style.display = '';
      if (panelInfo) panelInfo.style.display = 'none';
      updatePositions();
    }

    nodes.forEach((node, i) => {
      node.addEventListener('click', e => {
        e.stopPropagation();
        activeIdx === i ? deactivate() : activate(i);
      });
    });

    wrap.addEventListener('click', e => {
      if (!e.target.closest('.orb-node') && !e.target.closest('.orb-center')) {
        deactivate();
      }
    });
  }

  /* ── Features strip marquee (mobile right-to-left) ── */
  function initFeaturesMarquee() {
    const strip = document.querySelector('.features-strip');
    const inner = document.querySelector('.features-strip__inner');
    if (!strip || !inner) return;
    let activated = false;

    function check() {
      if (window.innerWidth <= 768 && !activated) {
        inner.innerHTML = inner.innerHTML + inner.innerHTML;
        strip.classList.add('marquee-active');
        inner.classList.add('marquee-active');
        activated = true;
      }
    }
    check();
    window.addEventListener('resize', check, { passive: true });
  }

  /* ── Init ── */
  initTypewriter();
  initProgramiShader();
  initWordCycle();
  initKontaktHover();
  initOrbitalBenefits();
  initFeaturesMarquee();

})();
