// باز/بسته کردن سایدبار و اورلی
const menuToggle = document.getElementById('menu-toggle');
const sidebar    = document.querySelector('.sidebar');
const overlay    = document.getElementById('overlay');

menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});
overlay.addEventListener('click', () => {
  menuToggle.classList.remove('active');
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
});
let timerInt;
function startTimer(sessionId, startTime, tg, color){
  clearInterval(timerInt);
  const start = new Date(startTime);
  const elap = document.getElementById('elapsed');
  const rem  = document.getElementById('remaining');
  rem.classList.toggle('hidden', tg===0);
  timerInt = setInterval(()=>{
    const now = new Date();
    const diff = now - start;
    const hh = String(Math.floor(diff/3600000)).padStart(2,'0');
    const mm = String(Math.floor(diff%3600000/60000)).padStart(2,'0');
    const ss = String(Math.floor(diff%60000/1000)).padStart(2,'0');
    elap.textContent = `${hh}:${mm}:${ss}`;
    if(tg>0){
      const left = tg*60000 - diff;
      if(left>0){
        const lm = String(Math.floor(left/60000)).padStart(2,'0');
        const ls = String(Math.floor(left%60000/1000)).padStart(2,'0');
        rem.textContent = `${lm}:${ls}`;
      } else {
        rem.textContent = 'Time Goal Reached';
        rem.style.color = SUBJECTS.find(s=>s.color===color).color;
      }
    }
  }, 500);
  // تبدیل دکمه
  const btn = document.getElementById('study-btn');
  btn.innerHTML = `<i class="fas fa-stop"></i>`;
  btn.onclick = ()=> stopSession(sessionId);
  btn.style.backgroundImage = 'linear-gradient(to right, var(--accent-3), var(--accent-4))';
}

async function stopSession(sessionId){
  clearInterval(timerInt);
  await fetch(`/api/sessions/${sessionId}/stop`, { method:'PATCH' });
  location.reload(); // رفرش استات‌ها
}
