/*************************************************************************
 *  Birthday Hedgehog – main.js  (rev E)
 *
 *  • scene switching, fight mini-game, microphone candle blow-out
 *  • duel music fade in/out
 *  • surprise card now laid out by Bootstrap grid
 *************************************************************************/

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function show(sel){
  $$('.scene').forEach(el=>el.classList.add('hidden'));
  $(sel).classList.remove('hidden');
}

/* --------------------------------------------------  duel music */
const duelAudio = $('#duel-theme');

function fadePlayDuel(){
  if(!duelAudio) return;
  duelAudio.currentTime = 0;
  duelAudio.volume = 0;
  duelAudio.play();
  let v = 0;
  const id = setInterval(()=>{ v+=.05; duelAudio.volume=Math.min(v,1);
                               if(v>=1) clearInterval(id); },40);
}
function fadeStopDuel(){
  if(!duelAudio||duelAudio.paused) return;
  let v = duelAudio.volume;
  const id = setInterval(()=>{ v-=.05; duelAudio.volume=Math.max(v,0);
                               if(v<=0){ duelAudio.pause(); clearInterval(id);} },40);
}

/* --------------------------------------------------  buttons */
$('#offer-yes').addEventListener('click', enterCake);
$('#offer-no' ).addEventListener('click',()=>show('#scene-sad'));

$('#sad-fine').addEventListener('click', enterCake);
$('#sad-no'  ).addEventListener('click',()=>{
  show('#scene-fight');
  fadePlayDuel();
});

/* --------------------------------------------------  fight */
$('#fight-btn').addEventListener('click',e=>{
  const btn=e.currentTarget,
        hero=$('#scene-fight .hero'),
        hedgy=$('#scene-fight .hedgie');
  btn.disabled=true; btn.textContent='…duelling';

  hedgy.style.transition='transform .6s ease';
  hedgy.style.transform='translateX(-135%)';
  setTimeout(()=>hero.classList.add('hurt'),600);

  setTimeout(()=>{
    btn.textContent='The hedgehog won sorry! 🤭';
    hedgy.style.transform='';
    setTimeout(enterCake, 2500);
  },1100);
});

/* --------------------------------------------------  cake + mic */
let micStarted=false;
function enterCake(){
  fadeStopDuel();
  show('#scene-cake');
  startMicOnce();
}
function startMicOnce(){
  if(micStarted) return;
  micStarted=true;

  const flames   = $$('.candle'),
        cakeMsg  = $('#cake-wrapper .msg'),
        cakeWrap = $('#cake-wrapper'),
        surprise = $('#surprise');

  if(!navigator.mediaDevices){
    cakeMsg.textContent='🎤 Mic unavailable (HTTPS needed)';
    return;
  }

  navigator.mediaDevices.getUserMedia({audio:true})
    .then(async stream=>{
      const ctx=new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended'){ try{await ctx.resume();}catch{} }

      const mic=ctx.createMediaStreamSource(stream),
            ana=ctx.createAnalyser();
      ana.fftSize=256; mic.connect(ana);

      const data=new Uint8Array(ana.frequencyBinCount);
      let loud=0;
      const THRESH=.15, NEED=4;

      (function loop(){
        ana.getByteTimeDomainData(data);
        let sum=0; data.forEach(v=>{ const n=(v-128)/128; sum+=n*n; });
        const rms=Math.sqrt(sum/data.length);

        if(rms>THRESH){ if(++loud>=NEED) extinguish(); else requestAnimationFrame(loop);}
        else{ loud=0; requestAnimationFrame(loop);}
      })();

      function extinguish(){
        flames.forEach(f=>f.classList.add('blown-out'));
        cakeMsg.textContent='🎉 Candles out!';
        stream.getTracks().forEach(t=>t.stop()); ctx.close();

        setTimeout(()=>{
          cakeWrap.classList.add('hidden');     // hide cake
          surprise.classList.remove('hidden');  // show Bootstrap grid
          surprise.scrollIntoView({behavior:'smooth',block:'start'});
        },600);
      }
    })
    .catch(err=>{
      console.error('mic error',err);
      cakeMsg.textContent='🎤 Enable mic in browser bar ↑';
    });
}

/* --------------------------------------------------  hearts (unchanged) */
function spawnHearts(sceneSel,n,src){
  const scene=$(sceneSel),
        wrap=document.createElement('div');
  wrap.className='hearts'; scene.prepend(wrap);

  for(let i=0;i<n;i++){
    const h=document.createElement('img');
    h.src=src; h.className='heart';
    const size=Math.random()*20+16;
    h.style.width=`${size}px`;
    h.style.left =`${Math.random()*100}%`;
    h.style.animationDelay   =`${Math.random()*8}s`;
    h.style.animationDuration=`${8+Math.random()*6}s`;
    wrap.appendChild(h);
  }
}
spawnHearts('#scene-offer',12,'img/pixel-heart.png');
spawnHearts('#scene-sad',  18,'img/pixel-brokenheart.png');
spawnHearts('#scene-cake', 15,'img/pixel-heart.png');
spawnHearts('#scene-cake', 10,'img/pixel-balloon.png');
spawnHearts('#scene-cake', 10,'img/pixel-balloon2.png');
spawnHearts('#scene-cake', 10,'img/pixel-balloon3.png');
spawnHearts('#scene-cake', 10,'img/pixel-balloon4.png');

/* --------------------------------------------------  boot */
show('#scene-offer');
