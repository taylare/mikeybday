/*************************************************************************
 *  BIRTHDAY HEDGEHOG  –  main.js
 *  © 2025   Tayla’s personal birthday surprise
 *
 *  What this file does (high-level):
 *  ▸ show()      = simple scene switcher (add/remove .hidden)
 *  ▸ Button logic = offer → sad → fight decisions
 *  ▸ enterCake()  = loads cake scene & starts microphone listener
 *  ▸ startMicOnce = listens for a “blow” sound to extinguish candles
 *  ▸ Fight mini-game: hedgehog dashes, hero flashes red, then user loses
 *************************************************************************/

/* ---------------------------------------------------------------
   1.  Tiny DOM helpers & scene switcher
   --------------------------------------------------------------- */
const $  = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

/** hide EVERYTHING then reveal the requested scene */
function show(sceneSelector) {
  $$('.scene').forEach(s => s.classList.add('hidden'));
  $(sceneSelector).classList.remove('hidden');
}

/* ---------------------------------------------------------------
   2.  Offer / Sad – button navigation
   --------------------------------------------------------------- */
$('#offer-yes').addEventListener('click', enterCake);
$('#offer-no' ).addEventListener('click', () => show('#scene-sad'));

$('#sad-fine').addEventListener('click', enterCake);
$('#sad-no'  ).addEventListener('click', () => show('#scene-fight'));

/* ---------------------------------------------------------------
   3.  Fight mini-game
   --------------------------------------------------------------- */
$('#fight-btn').addEventListener('click', e => {
  const btn   = e.currentTarget;
  const hero  = document.querySelector('#scene-fight .hero');
  const hedgy = document.querySelector('#scene-fight .hedgie');

  btn.disabled    = true;
  btn.textContent = '…duelling';

  /* Hedgehog dashes left */
  hedgy.style.transition = 'transform 0.6s ease';
  hedgy.style.transform  = 'translateX(-120%)';

  /* 0.6 s later hero flashes red */
  setTimeout(() => hero.classList.add('hurt'), 600);

  /* Finish duel, reset sprites, move on to cake */
  setTimeout(() => {
    btn.textContent = 'You lost! 😝';
    hedgy.style.transform = '';      // snap back right
    setTimeout(enterCake, 1500);
  }, 1100);                          // 0.6 dash + 0.5 pause
});

/* ---------------------------------------------------------------
   4.  Cake scene – start microphone once
   --------------------------------------------------------------- */
function enterCake() {
  show('#scene-cake');
  startMicOnce();
}

let micStarted = false;   // guard so we don’t re-init the mic
function startMicOnce() {
  if (micStarted) return;
  micStarted = true;

  /* Fast DOM lookups */
  const flames   = $$('.candle');                 // five candle divs
  const cakeMsg  = $('#cake-wrapper .msg');       // status <p>
  const surprise = $('#surprise');                // hidden goodies
  const cakeWrap = $('#cake-wrapper');            // cake + prompt

  /** Browser blocked audio? Give a fallback */
  if (!navigator.mediaDevices) {
    cakeMsg.textContent = '🎤 Mic unavailable (HTTPS needed)';
    return;
  }

  /* 1. Get mic stream (audio only) */
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      /* 2. Pipe mic → analyser → read RMS loudness */
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const mic = ctx.createMediaStreamSource(stream);
      const ana = ctx.createAnalyser();
      ana.fftSize = 256;
      mic.connect(ana);

      const data = new Uint8Array(ana.frequencyBinCount);

      /* 3. Loop until loud “blow” detected */
      (function listen() {
        ana.getByteTimeDomainData(data);

        /* Root-mean-square of waveform ≈ loudness (0-1) */
        let sum = 0;
        data.forEach(v => {
          const n = (v - 128) / 128; 
          sum += n * n;
        });
        const rms = Math.sqrt(sum / data.length);

        if (rms > 0.25) {             // ✨ Threshold tweak here
          /* 4. SUCCESS - extinguish flames & reveal surprise */
          flames.forEach(c => c.classList.add('blown-out'));
          cakeMsg.textContent = '🎉 Candles out!';

          /* Stop mic to save battery / privacy */
          stream.getTracks().forEach(t => t.stop());
          ctx.close();

          /* Hide cake, then show gallery */
          setTimeout(() => {
            cakeWrap.classList.add('hidden');
            surprise.classList.remove('hidden');
          }, 1000);
        } else {
          requestAnimationFrame(listen);  // keep listening
        }
      })();
    })
    .catch(err => {
      console.error('Mic error', err);
      cakeMsg.textContent = '🎤 Enable mic in browser bar ↑';
    });
}


/* ---------------------------------------------------------------
   FLOATING HEARTS / ANY SPRITE  ❤️💔✨
   sceneSel  – CSS selector for the scene section
   count     – how many sprites to spawn
   imgSrc    – path to the PNG/GIF you want to float
   --------------------------------------------------------------- */
function spawnHearts(sceneSel, count, imgSrc) {
  const scene     = document.querySelector(sceneSel);
  const container = document.createElement('div');
  container.className = 'hearts';
  scene.prepend(container);          // puts hearts behind content

  for (let i = 0; i < count; i++) {
    const h   = document.createElement('img');
    h.src     = imgSrc;              // 🖼 any sprite you like
    h.className = 'heart';

    /* Random size, position, speed, delay for natural feel */
    const size = Math.random() * 20 + 16;          // 16–36 px
    h.style.width            = `${size}px`;
    h.style.left             = `${Math.random() * 100}%`;
    h.style.animationDelay    = `${Math.random() * 8}s`;
    h.style.animationDuration = `${8 + Math.random() * 6}s`;

    container.appendChild(h);
  }
}

// 12 normal hearts in the OFFER scene
spawnHearts('#scene-offer', 12, 'img/pixel-heart.png');

// 18 BROKEN hearts in the SAD scene
spawnHearts('#scene-sad', 18, 'img/pixel-brokenheart.png');

// 15 hearts in the CAKE scene
spawnHearts('#scene-cake', 15, 'img/pixel-heart.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon2.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon3.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon4.png');



/* ---------------------------------------------------------------
   5.  Boot sequence  – start directly at OFFER scene
   --------------------------------------------------------------- */
show('#scene-offer');
