/*************************************************************************
 * Mike bday!!!!
 *
 * FILE OVERVIEW
 * -------------
 * 1.  Utility shortcuts ($ and $$) for selecting elements.
 * 2.  Scene switching so only one "section" is visible at a time.
 * 3.  Health-bar logic for Mike and the hedgehog.
 * 4.  Sword-fight mini-game (camera shake, hurt flash, HP drain).
 * 5.  Microphone access so the player can blow out the cake candles.
 * 6.  Surprise photo / greeting-card reveal after the candles go out.
 * 7.  Floating hearts and balloons just for decoration.
 * 8.  Cute loading screen after duel (NEW!)
 *************************************************************************/


/* ─────────────────────────────────────────────────────────────
   1.  HELPER SHORTCUTS
   --------------------------------------------------------------------
   $  : returns the first element that matches a CSS selector.
   $$ : returns an array of *all* elements that match a selector.
   These two helpers make the code shorter and easier to read.
   ------------------------------------------------------------------ */
const $  = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];


/* ─────────────────────────────────────────────────────────────
   2.  HEALTH BAR SETUP
   ------------------------------------------------------------------ */
const MAX_HP = 100;            // full health for any character
let mikeHP   = MAX_HP;         // current health for Mike

// Grab the two coloured "fill" divs inside each health bar
const $mikeBar   = $('#mike-health');
const $hedgieBar = $('#hedgie-health');

/* drawHP()
   --------
   Updates the width of each coloured bar so it matches the current
   hit-point values.  Hedgie always stays at 100 percent for this demo.
*/
function drawHP () {
  $mikeBar.style.width   = mikeHP + '%';
  $hedgieBar.style.width = '100%';
}


/* ─────────────────────────────────────────────────────────────
   3.  SCENE SWITCHING
   ------------------------------------------------------------------
   Only one ".scene" section is visible at a time.  This function
   hides every scene, then shows the requested one.  It also:
   • Toggles the moving-stripe background for the fight scene.
   • Resets Mike's health bar each time the fight restarts.
   ------------------------------------------------------------------ */
function show (selector) {
  // Hide all scenes
  $$('.scene').forEach(el => el.classList.add('hidden'));

  // Show the chosen scene
  $(selector).classList.remove('hidden');

  // Extra behaviour that applies only to the fight scene
  const fightScene = $('#scene-fight');
  const enteringFight = selector === '#scene-fight';
  fightScene.classList.toggle('duel-bg-active', enteringFight);

  if (enteringFight) {
    mikeHP = MAX_HP;  // reset health
    drawHP();         // redraw the bars so Mike is full again
  }
}


/* ─────────────────────────────────────────────────────────────
   4.  DUEL MUSIC (fade-in and fade-out helpers)
   ------------------------------------------------------------------ */
const duelAudio = $('#duel-theme');

/* fadePlayDuel()
   --------------
   Starts playing the duel theme quietly, then raises the volume to 1.0
   in small steps so it sounds like a smooth fade-in.
*/
function fadePlayDuel () {
  if (!duelAudio) return;          // no audio element found
  duelAudio.currentTime = 0;       // start from the beginning
  duelAudio.volume = 0;            // start muted
  duelAudio.play();

  let vol = 0;
  const id = setInterval(() => {
    vol += 0.05;
    duelAudio.volume = Math.min(vol, 1);
    if (vol >= 1) clearInterval(id);
  }, 40);
}

/* fadeStopDuel()
   --------------
   Lowers the volume until it reaches zero, then pauses the track.
*/
function fadeStopDuel () {
  if (!duelAudio || duelAudio.paused) return;
  let vol = duelAudio.volume;
  const id = setInterval(() => {
    vol -= 0.05;
    duelAudio.volume = Math.max(vol, 0);
    if (vol <= 0) {
      duelAudio.pause();
      clearInterval(id);
    }
  }, 40);
}


/* ─────────────────────────────────────────────────────────────
   5.  BUTTON CLICK HANDLERS
   ------------------------------------------------------------------ */
// Offer scene buttons
$('#offer-yes').addEventListener('click', enterCake);
$('#offer-no').addEventListener('click', () => show('#scene-sad'));

// Sad scene buttons
$('#sad-fine').addEventListener('click', enterCake);
$('#sad-no').addEventListener('click', () => {
  show('#scene-fight');
  fadePlayDuel();
});


/* ─────────────────────────────────────────────────────────────
   6.  FIGHT BUTTON (the mini-game)
   ------------------------------------------------------------------ */
$('#fight-btn').addEventListener('click', e => {
  const btn   = e.currentTarget;
  const mike  = $('#scene-fight .mike');
  const hedgy = $('#scene-fight .hedgie');

  // Disable the button so it cannot be clicked twice
  btn.disabled = true;
  btn.style = 'text-decoration: none; border: none; background-color: white;';
  btn.textContent = '…duelling';

  // Hedgehog charges left toward mike
  hedgy.style.transition = 'transform .7s ease';
  hedgy.style.transform  = 'translateX(-136%)';

  // mike flashes red after a short delay
  setTimeout(() => mike.classList.add('hurt'), 600);

  // Camera shake effect
  $('#scene-fight').classList.add('shake');
  setTimeout(() => $('#scene-fight').classList.remove('shake'), 450);

  // Drain Mike's health bar smoothly over about 0.6 seconds
  const drain = setInterval(() => {
    if (mikeHP > 0) {
      mikeHP -= 2;      // decrease by 2 points every 25 ms
      drawHP();
    } else {
      clearInterval(drain);  // stop once hit zero
    }
  }, 25);

  // After the attack animation finishes, move on with the story
  setTimeout(() => {
    btn.textContent = 'The hedgehog has won the duel 🤭';
    hedgy.style.transform = '';  // reset back to original position
    setTimeout(showLoadingThenCake, 4000); // switch to loading screen
  }, 1100);
});


/* ─────────────────────────────────────────────────────────────
   6.5.  LOADING SCREEN AFTER DUEL (NEW!)
   ------------------------------------------------------------------
   Brief pause between the duel and cake scene, with floating cakes
   and a cute message: “Getting the cake ready…”
   ------------------------------------------------------------------ */
function showLoadingThenCake () {
  fadeStopDuel();              // stop music
  show('#scene-loading');      // show loading screen
  setTimeout(enterCake, 6000); // after 6s, move to cake scene
}


/* ─────────────────────────────────────────────────────────────
   7.  CAKE SCENE AND MICROPHONE LOGIC
   ------------------------------------------------------------------ */
let micStarted = false;  // make sure we only ask for the mic once

function enterCake () {
  fadeStopDuel();        // stop the fight music
  show('#scene-cake');   // switch scenes
  startMicOnce();        // begin microphone listener
}

/* startMicOnce()
   --------------
   Requests access to the mic, listens for loud "blow" sounds,
   and extinguishes the candle flames when detected.
*/
function startMicOnce () {
  if (micStarted) return;
  micStarted = true;

  const flames   = $$('.candle');
  const cakeMsg  = $('#cake-wrapper .msg');

  // Check if the browser even supports microphone access
  if (!navigator.mediaDevices) {
    cakeMsg.textContent = 'Mic unavailable (HTTPS required)';
    return;
  }

  // Ask the user for permission
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(async stream => {
      // Create an audio context to inspect sound levels
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch {}
      }

      // Wire up analyser: mic -> analyser -> (no output)
      const mic = ctx.createMediaStreamSource(stream);
      const ana = ctx.createAnalyser();
      ana.fftSize = 256;
      mic.connect(ana);

      // check root-mean-square volume every frame
      const data = new Uint8Array(ana.frequencyBinCount);
      let loudFrames = 0;           // how many frames in a row are loud?
      const THRESH = 0.15;          // sound level to count as "blow"
      const NEED   = 4;             // number of loud frames required

      (function loop () {
        ana.getByteTimeDomainData(data);

        // Calculate volume as RMS (root-mean-square)
        let sum = 0;
        data.forEach(v => {
          const n = (v - 128) / 128; // normalize to range -1 … +1
          sum += n * n;
        });
        const rms = Math.sqrt(sum / data.length);

        // Loud enough?
        if (rms > THRESH) {
          if (++loudFrames >= NEED) extinguish(); // succeed
          else requestAnimationFrame(loop);       // keep testing
        } else {
          loudFrames = 0;                         // reset counter
          requestAnimationFrame(loop);
        }
      })();

      // Called when the player finally blows hard enough
      function extinguish () {
        flames.forEach(f => f.classList.add('blown-out'));
        cakeMsg.textContent = '🥳🥳🥳🥳🥳🥳';
        stream.getTracks().forEach(t => t.stop()); // stop mic
        ctx.close();                               // free resources
        setTimeout(revealSurprise, 2500);           // move on
      }
    })
    .catch(err => {
      console.error('Mic error', err);
      cakeMsg.textContent = 'Enable the microphone in your browser bar';
    });
}


/* ─────────────────────────────────────────────────────────────
   8.  SURPRISE SCENE (photos and greeting card)
   ------------------------------------------------------------------ */
function revealSurprise () {
  // Grab DOM nodes again (they were out of scope inside startMicOnce)
  const cakeWrap = $('#cake-wrapper');
  const surprise = $('#surprise');

  cakeWrap.classList.add('hidden');    // hide cake
  surprise.classList.remove('hidden'); // show surprise

  /* 1) Fade each photo downward one by one */
  const pics = [...surprise.querySelectorAll('.memory-photo')];
  pics.forEach((img, i) => {
    img.classList.add('fade-down');
    img.style.animationDelay = `${i * 0.25}s`;
  });

  /* 2) Fade the greeting card upward after the photos */
  const card = surprise.querySelector('.greeting-card');
  card.classList.add('fade-up');
  card.style.animationDelay = `${pics.length * 0.25 + 0.2}s`;

  /* 3) Five seconds later, slide Tayla into view */
  const heroWrap = surprise.querySelector('.hero-wrap');
  setTimeout(() => heroWrap.classList.add('hero-in'), 4000);

  /* 4) Scroll the new content into view just in case */
  surprise.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ─────────────────────────────────────────────────────────────
   9.  FLOATING HEARTS / BALLOONS (pure decoration)
   ------------------------------------------------------------------ */
function spawnHearts (sceneSelector, count, imgSrc) {
  const scene = $(sceneSelector);

  // Wrapper so we can absolutely-position every heart
  const wrapper = document.createElement('div');
  wrapper.className = 'hearts';
  scene.prepend(wrapper);

  // Create the requested number of heart images
  for (let i = 0; i < count; i++) {
    const h = document.createElement('img');
    h.src = imgSrc;
    h.className = 'heart';

    // Randomize size, horizontal position, and animation timing
    const size = Math.random() * 20 + 16;
    h.style.width  = `${size}px`;
    h.style.left   = `${Math.random() * 100}%`;
    h.style.animationDelay    = `${Math.random() * 8}s`;
    h.style.animationDuration = `${8 + Math.random() * 6}s`;

    wrapper.appendChild(h);
  }
}

// Hearts for the various scenes
spawnHearts('#scene-offer', 12, 'img/pixel-heart.png');
spawnHearts('#scene-sad',   18, 'img/pixel-brokenheart.png');

// Balloons and hearts for the cake scene
spawnHearts('#scene-cake', 15, 'img/pixel-heart.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon2.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon3.png');
spawnHearts('#scene-cake', 10, 'img/pixel-balloon4.png');


/* ─────────────────────────────────────────────────────────────
   10.  INITIAL SCENE
   ------------------------------------------------------------------ */
show('#scene-offer');   // start the story on the "offer" scene
