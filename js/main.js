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

  /* ── Tubelight nav ── */
  function initTubelightNav() {
    var ul = document.querySelector('.nav__links');
    if (!ul) return;
    var links = Array.from(ul.querySelectorAll('a'));

    // Inject lamp
    var lamp = document.createElement('span');
    lamp.className = 'nav-lamp';
    lamp.innerHTML =
      '<span class="nav-lamp__bar"></span>' +
      '<span class="nav-lamp__g1"></span>' +
      '<span class="nav-lamp__g2"></span>' +
      '<span class="nav-lamp__g3"></span>' +
      '<span class="nav-lamp__cone"></span>';
    ul.appendChild(lamp);

    // Determine active link from current page
    var page = location.pathname.split('/').pop() || 'index.html';
    var activeLink = null;
    links.forEach(function(a) {
      var href = (a.getAttribute('href') || '').split('#')[0].split('/').pop() || 'index.html';
      if (href === page || (page === '' && href === 'index.html') || (page === 'index.html' && href === '')) {
        a.classList.add('nav-active');
        activeLink = a;
      }
    });
    if (!activeLink) { links[0].classList.add('nav-active'); activeLink = links[0]; }

    function moveLamp(el) {
      var ulRect = ul.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      lamp.style.left = (elRect.left - ulRect.left + elRect.width / 2) + 'px';
    }

    links.forEach(function(a) {
      a.addEventListener('mouseenter', function() { moveLamp(a); });
      a.addEventListener('mouseleave', function() { moveLamp(activeLink); });
      a.addEventListener('click', function() {
        links.forEach(function(l) { l.classList.remove('nav-active'); });
        a.classList.add('nav-active');
        activeLink = a;
      });
    });

    // Reposition after scroll state change (layout shifts with pill padding)
    window.addEventListener('scroll', function() {
      requestAnimationFrame(function() { moveLamp(activeLink); });
    }, { passive: true });
    window.addEventListener('resize', function() { moveLamp(activeLink); });

    // Initial position (also after 100ms to catch CSS transition settle)
    moveLamp(activeLink);
    setTimeout(function() { moveLamp(activeLink); }, 120);
  }
  initTubelightNav();

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

  /* ── Typewriter scroll effect — runs on every .citat__text (not --static) ── */
  function initTypewriter() {
    const textEls = document.querySelectorAll('.citat__text:not(.citat__text--static)');
    if (!textEls.length) return;

    textEls.forEach(function(textEl) {
      const section = textEl.closest('.citat');
      if (!section) return;

      const raw = textEl.innerHTML;
      const parts = raw.split(/<br\s*\/?>/gi);
      let rebuiltHtml = '';

      parts.forEach(function(part, pi) {
        const div = document.createElement('div');
        div.innerHTML = part;
        const text = div.textContent || '';
        text.split('').forEach(function(ch) {
          const escaped = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
          rebuiltHtml += '<span class="char">' + escaped + '</span>';
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
        const enterStart = vh * 0.85;
        const enterEnd   = vh * 0.20;
        let progress = (enterStart - rect.top) / (enterStart - enterEnd);
        progress = Math.max(0, Math.min(1, progress));

        const showCount = Math.round(progress * total);
        if (showCount === lastVisible) return;

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
    });
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

  /* ── Kontakt card 3D tilt ── */
  function initKontaktTilt() {
    const card = document.getElementById('kontaktCard');
    if (!card) return;
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      tx = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 6;
      ty = -((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 6;
      if (!raf) raf = requestAnimationFrame(tiltLoop);
    });
    card.addEventListener('mouseleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tiltLoop);
    });
    function tiltLoop() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      card.style.transform = `perspective(1400px) rotateX(${cy}deg) rotateY(${cx}deg)`;
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        raf = requestAnimationFrame(tiltLoop);
      } else {
        raf = null;
      }
    }
  }

  /* ── SideRays WebGL background ── */
  function initSideRays(container, opts) {
    if (!container) return;
    var o = Object.assign({
      speed: 2.0, rayColor1: '#c9a04c', rayColor2: '#1a5c38',
      intensity: 1.6, spread: 2.0, origin: 'top-right',
      tilt: 0, saturation: 1.4, blend: 0.7, falloff: 1.8, opacity: 0.85
    }, opts);

    var canvas = document.createElement('canvas');
    canvas.className = 'sr-canvas';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.insertBefore(canvas, container.firstChild);

    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    function hexRgb(h) {
      var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
      return m ? [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255] : [1,1,1];
    }
    function originFlip(origin) {
      if (origin === 'top-left')    return [1, 0];
      if (origin === 'bottom-right') return [0, 1];
      if (origin === 'bottom-left') return [1, 1];
      return [0, 0];
    }

    var vert = 'attribute vec2 position;\nvoid main(){gl_Position=vec4(position,0.0,1.0);}';
    var frag = [
      'precision highp float;',
      'uniform float iTime,iSpeed,iIntensity,iSpread,iFlipX,iFlipY,iTilt,iSaturation,iBlend,iFalloff,iOpacity;',
      'uniform vec2 iResolution;',
      'uniform vec3 iRayColor1,iRayColor2;',
      'float rs(vec2 src,vec2 dir,vec2 c,float a,float b,float sp){',
      '  vec2 d=c-src;float ca=dot(normalize(d),dir);',
      '  return clamp((0.45+0.15*sin(ca*a+iTime*sp))+(0.3+0.2*cos(-ca*b+iTime*sp)),0.0,1.0)',
      '   *clamp((iResolution.x-length(d))/iResolution.x,0.5,1.0);}',
      'void main(){',
      '  vec2 fc=gl_FragCoord.xy;',
      '  if(iFlipX>0.5)fc.x=iResolution.x-fc.x;',
      '  if(iFlipY>0.5)fc.y=iResolution.y-fc.y;',
      '  vec2 coord=vec2(fc.x,iResolution.y-fc.y);',
      '  vec2 rp=vec2(iResolution.x*1.1,-0.5*iResolution.y);',
      '  float tr=iTilt*3.14159/180.0,cs=cos(tr),sn=sin(tr);',
      '  vec2 rel=coord-rp;',
      '  vec2 tc=vec2(rel.x*cs-rel.y*sn,rel.x*sn+rel.y*cs)+rp;',
      '  float hs=iSpread*0.275;',
      '  vec2 d1=normalize(vec2(cos(0.785398+hs),sin(0.785398+hs)));',
      '  vec2 d2=normalize(vec2(cos(0.785398-hs),sin(0.785398-hs)));',
      '  vec4 r1=vec4(iRayColor1,1.0)*rs(rp,d1,tc,36.2214,21.11349,iSpeed);',
      '  vec4 r2=vec4(iRayColor2,1.0)*rs(rp,d2,tc,22.3991,18.0234,iSpeed*0.2);',
      '  vec4 col=r1*(1.0-iBlend)*0.9+r2*iBlend*0.9;',
      '  float dist=length(fc.xy-vec2(rp.x,iResolution.y-rp.y))/iResolution.y;',
      '  float bri=iIntensity*0.4/pow(max(dist,0.001),iFalloff);',
      '  col.rgb*=bri;',
      '  float g=dot(col.rgb,vec3(0.299,0.587,0.114));',
      '  col.rgb=mix(vec3(g),col.rgb,iSaturation);',
      '  col.a=max(col.r,max(col.g,col.b))*iOpacity;',
      '  gl_FragColor=col;}'
    ].join('\n');

    function mkShader(t, src) {
      var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    var pl = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pl);
    gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['iTime','iResolution','iSpeed','iRayColor1','iRayColor2','iIntensity','iSpread',
     'iFlipX','iFlipY','iTilt','iSaturation','iBlend','iFalloff','iOpacity'].forEach(function(n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    var c1 = hexRgb(o.rayColor1), c2 = hexRgb(o.rayColor2), fl = originFlip(o.origin);
    gl.uniform1f(U.iSpeed, o.speed);
    gl.uniform3f(U.iRayColor1, c1[0], c1[1], c1[2]);
    gl.uniform3f(U.iRayColor2, c2[0], c2[1], c2[2]);
    gl.uniform1f(U.iIntensity, o.intensity);
    gl.uniform1f(U.iSpread, o.spread);
    gl.uniform1f(U.iFlipX, fl[0]);
    gl.uniform1f(U.iFlipY, fl[1]);
    gl.uniform1f(U.iTilt, o.tilt);
    gl.uniform1f(U.iSaturation, o.saturation);
    gl.uniform1f(U.iBlend, o.blend);
    gl.uniform1f(U.iFalloff, o.falloff);
    gl.uniform1f(U.iOpacity, o.opacity);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = container.clientWidth, h = container.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.iResolution, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var animId = null;
    function loop(t) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.iTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animId = requestAnimationFrame(loop);
    }

    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { if (!animId) animId = requestAnimationFrame(loop); }
      else { if (animId) { cancelAnimationFrame(animId); animId = null; } }
    }, { threshold: 0.05 });
    obs.observe(container);
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

  /* ── ProceduralGroundBackground for .prog-hero ── */
  function initProgHeroGL() {
    var section = document.querySelector('.prog-hero:not(.prog-hero--aurora)');
    if (!section) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'prog-hero__gl';
    section.insertBefore(canvas, section.firstChild);

    var gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      'precision highp float;',
      'uniform float u_time;',
      'uniform vec2 u_res;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){',
      '  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);',
      '  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}',
      'void main(){',
      '  vec2 uv=(gl_FragCoord.xy*2.-u_res)/min(u_res.x,u_res.y);',
      '  float depth=1./(uv.y+1.15);',
      '  vec2 guv=vec2(uv.x*depth,depth+u_time*0.12);',
      '  float n=noise(guv*3.5);',
      '  float rip=sin(guv.y*18.+n*8.+u_time*0.5);',
      '  float line=smoothstep(0.03,0.,abs(rip));',
      '  vec3 base=vec3(0.09,0.22,0.13);',   /* brighter forest green */
      '  vec3 acc=vec3(0.65,0.50,0.22);',    /* warm gold-green */
      '  vec3 neon=vec3(0.93,0.78,0.40);',   /* bright gold */
      '  vec3 col=mix(base,acc,n*0.75);',
      '  col+=line*neon*depth*0.6;',
      '  float fade=smoothstep(0.1,-1.,uv.y);',
      '  col*=(1.-length(uv)*0.22)*(1.-fade);',
      '  gl_FragColor=vec4(col,1.);',
      '}'
    ].join('\n');

    function mkShader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uRes  = gl.getUniformLocation(prog, 'u_res');
    var raf = null, visible = false;

    function resize() {
      var w = section.offsetWidth, h = section.offsetHeight;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function loop(t) {
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (visible) raf = requestAnimationFrame(loop);
    }

    var io = new IntersectionObserver(function(entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 });
    io.observe(section);
  }

  /* ── Aurora hero — star particles ── */
  function initAuroraHero() {
    var section = document.querySelector('.prog-hero--aurora');
    if (!section) return;
    var aurora = section.querySelector('.aurora');
    if (!aurora) return;
    for (var i = 0; i < 65; i++) {
      var star = document.createElement('div');
      star.className = 'aurora__star';
      star.style.cssText =
        'left:' + (Math.random() * 100).toFixed(1) + '%;' +
        'top:' + (Math.random() * 100).toFixed(1) + '%;' +
        '--dur:' + (Math.random() * 3 + 2).toFixed(2) + 's;' +
        '--delay:-' + (Math.random() * 5).toFixed(2) + 's;' +
        '--peak:' + (Math.random() * 0.65 + 0.15).toFixed(2) + ';';
      aurora.appendChild(star);
    }
  }

  /* ── "Odaberite vaš tempo" cards — dot pattern (MagicUI DotPattern port) ── */
  function initTempoDotPattern() {
    var section = null;
    document.querySelectorAll('.prog-section').forEach(function(s) {
      var h = s.querySelector('h2');
      if (h && h.textContent.indexOf('tempo') !== -1) section = s;
    });
    if (!section) return;

    var cards = Array.from(section.querySelectorAll('.card'));
    if (!cards.length) return;

    cards.forEach(function(card) {
      card.classList.add('card--tempo');
      card.insertBefore(buildTempoDots(), card.firstChild);
    });
  }

  function buildTempoDots() {
    var ns = 'http://www.w3.org/2000/svg';
    var uid = 'tdp' + (Math.random() * 1e6 | 0);
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'tempo-dots');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    var defs = document.createElementNS(ns, 'defs');
    var pat  = document.createElementNS(ns, 'pattern');
    pat.setAttribute('id', uid);
    pat.setAttribute('x', '0');  pat.setAttribute('y', '0');
    pat.setAttribute('width', '16'); pat.setAttribute('height', '16');
    pat.setAttribute('patternUnits', 'userSpaceOnUse');

    var dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', '1'); dot.setAttribute('cy', '1'); dot.setAttribute('r', '1');
    dot.setAttribute('fill', 'rgba(201,160,54,0.65)');

    pat.appendChild(dot); defs.appendChild(pat); svg.appendChild(defs);

    var rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', '100%'); rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'url(#' + uid + ')');
    svg.appendChild(rect);

    return svg;
  }

  /* ── Order modal (knjiga "Naruči" buttons) ── */
  function initOrderModal() {
    var modal = document.getElementById('orderModal');
    if (!modal) return;

    var card    = document.getElementById('orderCard');
    var overlay = document.getElementById('orderOverlay');
    var closeBtn= document.getElementById('orderClose');
    var form    = document.getElementById('orderForm');
    var bodyEl  = document.getElementById('orderBody');
    var successEl = document.getElementById('orderSuccess');
    var submitBtn = document.getElementById('orderSubmit');
    var formatOpts = Array.from(modal.querySelectorAll('.order-format__opt'));
    var selectedFmt = 'digital';

    function openModal(fmt) {
      selectedFmt = fmt || 'digital';
      form.reset();
      bodyEl.hidden = false;
      successEl.hidden = true;
      submitBtn.querySelector('.order-submit__text').hidden = false;
      submitBtn.querySelector('.order-submit__loading').hidden = true;
      submitBtn.disabled = false;
      setFormat(selectedFmt);
      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(function() {
        var first = form.querySelector('input');
        if (first) first.focus();
      }, 420);
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function setFormat(fmt) {
      selectedFmt = fmt;
      formatOpts.forEach(function(opt) {
        opt.classList.toggle('order-format__opt--active', opt.getAttribute('data-fmt') === fmt);
      });
    }

    // Trigger: any element with [data-order]
    document.addEventListener('click', function(e) {
      var trigger = e.target.closest('[data-order]');
      if (!trigger) return;
      e.preventDefault();
      openModal(trigger.getAttribute('data-order'));
    });

    // Close
    if (overlay) overlay.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    // Format toggle
    formatOpts.forEach(function(opt) {
      opt.addEventListener('click', function() { setFormat(opt.getAttribute('data-fmt')); });
    });

    // Submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitBtn.querySelector('.order-submit__text').hidden = true;
      submitBtn.querySelector('.order-submit__loading').hidden = false;
      submitBtn.disabled = true;
      setTimeout(function() {
        bodyEl.hidden = true;
        successEl.hidden = false;
        setTimeout(closeModal, 3800);
      }, 1600);
    });

    // 3D tilt on desktop
    if (card && window.innerWidth > 768) {
      card.addEventListener('mousemove', function(e) {
        var r = card.getBoundingClientRect();
        var xP = (e.clientX - r.left) / r.width;
        var yP = (e.clientY - r.top)  / r.height;
        card.style.setProperty('--om-gx', (xP * 100).toFixed(1) + '%');
        card.style.setProperty('--om-gy', (yP * 100).toFixed(1) + '%');
        card.style.setProperty('--om-tilt-x', ((yP - 0.5) * -6).toFixed(2) + 'deg');
        card.style.setProperty('--om-tilt-y', ((xP - 0.5) *  7).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', function() {
        card.style.setProperty('--om-tilt-x', '0deg');
        card.style.setProperty('--om-tilt-y', '0deg');
      });
    }
  }

  /* ── Ebook section: cover 3D tilt + phase cards ── */
  function initEbookInteractivity() {
    // Cover 3D tilt
    var coverWrap = document.getElementById('ebookCoverWrap');
    if (coverWrap) {
      coverWrap.addEventListener('mouseenter', function() {
        coverWrap.classList.add('is-hovered');
      });
      coverWrap.addEventListener('mouseleave', function() {
        coverWrap.classList.remove('is-hovered');
        coverWrap.style.setProperty('--ec-tilt-x', '0deg');
        coverWrap.style.setProperty('--ec-tilt-y', '-6deg');
      });
      coverWrap.addEventListener('mousemove', function(e) {
        var r = coverWrap.getBoundingClientRect();
        var xPct = (e.clientX - r.left) / r.width;
        var yPct = (e.clientY - r.top) / r.height;
        coverWrap.style.setProperty('--ec-tilt-x', ((yPct - 0.5) * -12).toFixed(2) + 'deg');
        coverWrap.style.setProperty('--ec-tilt-y', (((xPct - 0.5) * 14) - 6).toFixed(2) + 'deg');
      });
    }

    // Phase cards
    var cards = Array.from(document.querySelectorAll('.ebook-phase-card'));
    if (!cards.length) return;
    cards.forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        card.classList.add('is-hovered');
      });
      card.addEventListener('mouseleave', function() {
        card.classList.remove('is-hovered');
        card.style.setProperty('--ep-tilt-x', '0deg');
        card.style.setProperty('--ep-tilt-y', '0deg');
      });
      card.addEventListener('mousemove', function(e) {
        var r = card.getBoundingClientRect();
        var xPct = (e.clientX - r.left) / r.width;
        var yPct = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ep-gx', (xPct * 100).toFixed(1) + '%');
        card.style.setProperty('--ep-gy', (yPct * 100).toFixed(1) + '%');
        card.style.setProperty('--ep-tilt-x', ((yPct - 0.5) * -8).toFixed(2) + 'deg');
        card.style.setProperty('--ep-tilt-y', ((xPct - 0.5) * 9).toFixed(2) + 'deg');
      });
    });
  }

  /* ── "Pet faza dubinskog reseta" phases — enhanced cards ── */
  function initPhasesCards() {
    var phases = Array.from(document.querySelectorAll('.prog-phase'));
    if (!phases.length) return;

    phases.forEach(function(phase) {
      phase.classList.add('prog-phase--enhanced');

      var arrow = phase.querySelector('.prog-phase__arrow');
      var wm = document.createElement('div');
      wm.className = 'prog-phase__watermark';
      wm.setAttribute('aria-hidden', 'true');
      wm.textContent = arrow ? arrow.textContent : '';
      phase.appendChild(wm);

      phase.addEventListener('mouseenter', function() {
        phase.classList.add('is-hovered');
      });
      phase.addEventListener('mouseleave', function() {
        phase.classList.remove('is-hovered');
        phase.style.setProperty('--ph-tilt-x', '0deg');
        phase.style.setProperty('--ph-tilt-y', '0deg');
      });
      phase.addEventListener('mousemove', function(e) {
        var r = phase.getBoundingClientRect();
        var xPct = (e.clientX - r.left) / r.width;
        var yPct = (e.clientY - r.top)  / r.height;
        phase.style.setProperty('--ph-x', (xPct * 100).toFixed(1) + '%');
        phase.style.setProperty('--ph-y', (yPct * 100).toFixed(1) + '%');
        phase.style.setProperty('--ph-tilt-x', ((yPct - 0.5) * -8).toFixed(2) + 'deg');
        phase.style.setProperty('--ph-tilt-y', ((xPct - 0.5) *  9).toFixed(2) + 'deg');
      });
    });
  }

  /* ── MagicBento-style effects for .whom-card (spotlight, border glow, particles, ripple, tilt) ── */
  function initWhomCards() {
    var grid = document.querySelector('.whom-grid');
    if (!grid || window.innerWidth <= 768) return;

    var cards = Array.from(grid.querySelectorAll('.whom-card'));
    if (!cards.length) return;

    // Global spotlight
    var spotlight = document.createElement('div');
    spotlight.className = 'whom-spotlight';
    document.body.appendChild(spotlight);

    var GLOW_COLOR = '201,160,54';
    var RADIUS = 260;
    var PROXIMITY = RADIUS * 0.5;
    var FADE_DIST = RADIUS * 0.75;

    function overGrid(e) {
      var r = grid.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }

    function cardDist(e, card) {
      var r = card.getBoundingClientRect();
      var d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) -
              Math.max(r.width, r.height) / 2;
      return Math.max(0, d);
    }

    document.addEventListener('mousemove', function(e) {
      if (!overGrid(e)) {
        spotlight.style.opacity = '0';
        cards.forEach(function(c) { c.style.setProperty('--glow-intensity', '0'); });
        return;
      }
      // Move spotlight
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top  = e.clientY + 'px';

      var minDist = Infinity;
      cards.forEach(function(card) {
        var r = card.getBoundingClientRect();
        var relX = ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%';
        var relY = ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%';
        var dist = cardDist(e, card);
        var intensity = dist <= PROXIMITY ? 1 : (dist <= FADE_DIST ? (FADE_DIST - dist) / (FADE_DIST - PROXIMITY) : 0);
        card.style.setProperty('--glow-x', relX);
        card.style.setProperty('--glow-y', relY);
        card.style.setProperty('--glow-intensity', intensity.toFixed(3));
        minDist = Math.min(minDist, dist);
      });

      var sp = minDist <= PROXIMITY ? 0.85 :
               minDist <= FADE_DIST ? ((FADE_DIST - minDist) / (FADE_DIST - PROXIMITY)) * 0.85 : 0;
      spotlight.style.opacity = sp;
    });

    document.addEventListener('mouseleave', function() {
      spotlight.style.opacity = '0';
      cards.forEach(function(c) { c.style.setProperty('--glow-intensity', '0'); });
    });

    // Per-card: tilt + particles + ripple
    cards.forEach(function(card) {
      var isHovered = false;
      var particles = [];
      var timeouts = [];

      function spawnParticles() {
        var r = card.getBoundingClientRect();
        for (var i = 0; i < 10; i++) {
          (function(idx) {
            var tid = setTimeout(function() {
              if (!isHovered) return;
              var p = document.createElement('div');
              p.className = 'whom-particle';
              var px = Math.random() * r.width;
              var py = Math.random() * r.height;
              p.style.cssText = 'left:' + px + 'px;top:' + py + 'px;opacity:0;transform:scale(0);' +
                'transition:opacity 0.28s ease,transform 0.28s cubic-bezier(0.34,1.56,0.64,1);';
              card.appendChild(p);
              particles.push(p);
              requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                  p.style.opacity = '1'; p.style.transform = 'scale(1)';
                  setTimeout(function() {
                    var dx = (Math.random() - 0.5) * 90;
                    var dy = (Math.random() - 0.5) * 90;
                    var rot = Math.random() * 360;
                    var dur = 1.4 + Math.random() * 1.4;
                    p.style.transition = 'transform ' + dur + 's ease-in-out,opacity ' + dur + 's ease-in-out';
                    p.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg) scale(0.5)';
                    p.style.opacity = '0.35';
                    setTimeout(function() { p.style.opacity = '0'; }, dur * 700);
                  }, 280);
                });
              });
            }, idx * 90);
            timeouts.push(tid);
          })(i);
        }
      }

      function clearParticles() {
        timeouts.forEach(clearTimeout); timeouts = [];
        particles.forEach(function(p) {
          p.style.transition = 'opacity 0.25s ease,transform 0.25s ease';
          p.style.opacity = '0'; p.style.transform = 'scale(0)';
          setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 250);
        });
        particles = [];
      }

      card.addEventListener('mouseenter', function() {
        isHovered = true;
        spawnParticles();
      });

      card.addEventListener('mousemove', function(e) {
        var r = card.getBoundingClientRect();
        var cx = r.width / 2, cy = r.height / 2;
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var rotX = ((y - cy) / cy) * -7;
        var rotY = ((x - cx) / cx) * 7;
        card.style.setProperty('--tilt-x', rotX.toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', rotY.toFixed(2) + 'deg');
      });

      card.addEventListener('mouseleave', function() {
        isHovered = false;
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        clearParticles();
      });

      card.addEventListener('click', function(e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var maxD = Math.max(Math.hypot(x,y), Math.hypot(x-r.width,y), Math.hypot(x,y-r.height), Math.hypot(x-r.width,y-r.height));
        var rip = document.createElement('div');
        rip.className = 'whom-ripple';
        var s = maxD * 2;
        rip.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (x-maxD) + 'px;top:' + (y-maxD) + 'px;';
        card.appendChild(rip);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            rip.style.transform = 'scale(1)';
            rip.style.opacity = '0';
            setTimeout(function() { if (rip.parentNode) rip.parentNode.removeChild(rip); }, 750);
          });
        });
      });
    });

    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768) spotlight.style.opacity = '0';
    });
  }

  /* ── Animated grid for prog-includes (MagicUI AnimatedGridPattern) ── */
  function initAnimatedGrid() {
    document.querySelectorAll('.prog-includes').forEach(function(box) {
      if (box.querySelector('.prog-grid-anim')) return;
      box.insertBefore(buildAnimatedGrid(), box.firstChild);
    });
  }

  function buildAnimatedGrid() {
    var cellW = 40, cellH = 40, cols = 32, rows = 18;
    var numSquares = 28, maxOp = 0.13;
    var ns = 'http://www.w3.org/2000/svg';

    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'prog-grid-anim');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 ' + (cols * cellW) + ' ' + (rows * cellH));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    var g = document.createElementNS(ns, 'g');

    for (var r = 0; r <= rows; r++) {
      var hl = document.createElementNS(ns, 'line');
      hl.setAttribute('x1', '0'); hl.setAttribute('y1', r * cellH);
      hl.setAttribute('x2', cols * cellW); hl.setAttribute('y2', r * cellH);
      hl.setAttribute('stroke', 'rgba(201,160,54,0.07)'); hl.setAttribute('stroke-width', '0.5');
      g.appendChild(hl);
    }
    for (var c = 0; c <= cols; c++) {
      var vl = document.createElementNS(ns, 'line');
      vl.setAttribute('x1', c * cellW); vl.setAttribute('y1', '0');
      vl.setAttribute('x2', c * cellW); vl.setAttribute('y2', rows * cellH);
      vl.setAttribute('stroke', 'rgba(201,160,54,0.07)'); vl.setAttribute('stroke-width', '0.5');
      g.appendChild(vl);
    }

    for (var i = 0; i < numSquares; i++) {
      (function(idx) {
        var rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('fill', 'rgba(201,160,54,0.95)');
        rect.style.opacity = '0';
        g.appendChild(rect);
        setTimeout(function() {
          cycleGridSquare(rect, cols, rows, cellW, cellH, maxOp);
        }, idx * 350 + Math.random() * 400);
      })(i);
    }

    svg.appendChild(g);
    return svg;
  }

  function cycleGridSquare(rect, cols, rows, cellW, cellH, maxOp) {
    var col = Math.floor(Math.random() * cols);
    var row = Math.floor(Math.random() * rows);
    rect.setAttribute('x', col * cellW + 0.5);
    rect.setAttribute('y', row * cellH + 0.5);
    rect.setAttribute('width', cellW - 1);
    rect.setAttribute('height', cellH - 1);

    var op      = (0.35 + Math.random() * 0.65) * maxOp;
    var fadeIn  = 500 + Math.random() * 700;
    var hold    = 900 + Math.random() * 1800;
    var fadeOut = 600 + Math.random() * 800;
    var pause   = 400 + Math.random() * 1400;

    rect.style.transition = 'opacity ' + (fadeIn / 1000).toFixed(2) + 's ease';
    rect.style.opacity = op;

    setTimeout(function() {
      rect.style.transition = 'opacity ' + (fadeOut / 1000).toFixed(2) + 's ease';
      rect.style.opacity = '0';
      setTimeout(function() {
        cycleGridSquare(rect, cols, rows, cellW, cellH, maxOp);
      }, fadeOut + pause);
    }, fadeIn + hold);
  }

  /* ── Glow buttons (cursor-tracking) ── */
  function initGlowButtons() {
    document.querySelectorAll('.btn--glow').forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        btn.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ── Init ── */
  initWhomCards();
  initAnimatedGrid();
  initTempoDotPattern();
  initPhasesCards();
  initEbookInteractivity();
  initOrderModal();
  initGlowButtons();
  initTypewriter();
  initProgramiShader();
  initWordCycle();
  initKontaktHover();
  initKontaktTilt();
  initOrbitalBenefits();
  initFeaturesMarquee();
  initProgHeroGL();
  initAuroraHero();
  initSideRays(document.querySelector('.testimonials'), { origin: 'top-right', rayColor1: '#c9a04c', rayColor2: '#1a5c38', intensity: 3.5, falloff: 1.3, opacity: 1.0, spread: 2.8 });
  initSideRays(document.querySelector('.kontakt'), { origin: 'top-left', rayColor1: '#c9a04c', rayColor2: '#1a5c38', intensity: 3.2, blend: 0.55, falloff: 1.4, opacity: 1.0 });

})();
