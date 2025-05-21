import { showNotification } from './notifications.js';
import { SUBJECTS } from './constants.js';

const form    = document.getElementById('session-form');
const subjSel = document.getElementById('subject-select');
const other   = document.getElementById('other-subject');
const incBtn  = document.getElementById('increase-goal');
const decBtn  = document.getElementById('decrease-goal');
const goalInp = document.getElementById('goal-input');
let [h,m] = [0,0];

// نمایش فیلد Other
subjSel.addEventListener('change', ()=> {
  other.classList.toggle('hidden', subjSel.value!=='Other');
});

// کنترل +/−
function updateInput() {
  goalInp.value = `${h}:${m.toString().padStart(2,'0')}`;
}
incBtn.addEventListener('click', ()=>{
  m+=15; if(m>=60){ h++; m-=60; }
  updateInput();
});
decBtn.addEventListener('click', ()=>{
  if(h*60+m >= 15) {
    m-=15; if(m<0){ h--; m+=60; }
    updateInput();
  }
});

// Submit شروع
form.addEventListener('submit', async e=>{
  e.preventDefault();
  const subject = subjSel.value==='Other'? other.value: subjSel.value;
  const tg = h*60 + m;
  // POST به /api/sessions
  const res = await fetch('/api/sessions', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ subject, timeGoal: tg })
  });
  const data = await res.json();
  // بستن مودال و استارت کرنومتر...
  startTimer(data.sessionId, data.startTime, tg, SUBJECTS.find(s=>s.name===subject).color);
});
