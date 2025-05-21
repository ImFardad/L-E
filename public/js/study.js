// public/js/study.js
import { showNotification } from './notifications.js';
import { SUBJECTS } from './constants.js';

// عناصر مودال
const studyBtn    = document.getElementById('study-btn');
const studyModal  = document.getElementById('study-modal');
const closeBtn    = document.getElementById('close-modal');
const overlay     = document.getElementById('overlay');

// فرم و ورودی‌ها
const form        = document.getElementById('session-form');
const subjSel     = document.getElementById('subject-select');
const other       = document.getElementById('other-subject');
const hourInput   = document.getElementById('hour-input');
const minuteInput = document.getElementById('minute-input');
const incBtn      = document.getElementById('increase-goal');
const decBtn      = document.getElementById('decrease-goal');

let h = 0, m = 0;

// —— باز و بسته کردن مودال ——
function openModal() {
  document.body.classList.add('modal-open');
  overlay.classList.add('open');
  studyModal.classList.add('open');
}

function hideModal() {
  studyModal.classList.remove('open');
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
}

studyBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', hideModal);
overlay.addEventListener('click', hideModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideModal();
});

// —— “Other” field logic ——
subjSel.addEventListener('change', () => {
  other.classList.toggle('hidden', subjSel.value !== 'Other');
});

// —— مقداردهی اولیه ورودی‌ها ——
hourInput.value   = 0;
minuteInput.value = 0;

// —— +/– دقیقه ——
incBtn.addEventListener('click', () => {
  m = (m + 15) % 60;
  minuteInput.value = m;
});
decBtn.addEventListener('click', () => {
  m = (m - 15 + 60) % 60;
  minuteInput.value = m;
});

// همگام‌سازی تغییرات دستی
hourInput.addEventListener('input', () => {
  h = parseInt(hourInput.value, 10) || 0;
});
minuteInput.addEventListener('input', () => {
  m = Math.min(59, Math.max(0, parseInt(minuteInput.value, 10) || 0));
  minuteInput.value = m;
});

// —— ارسال فرم و شروع سشن ——
form.addEventListener('submit', async e => {
  e.preventDefault();
  const subject = subjSel.value === 'Other' ? other.value : subjSel.value;
  const timeGoal = h * 60 + m;
  if (timeGoal <= 0) {
    showNotification('Please set a valid time goal.');
    return;
  }

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, timeGoal })
    });
    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Failed to start session');
      return;
    }

    hideModal();
    // ریست فرم
    subjSel.value     = SUBJECTS[0].name;
    other.classList.add('hidden');
    h = 0; m = 0;
    hourInput.value   = 0;
    minuteInput.value = 0;

    // فرض: تابع startTimer تعریف‌شده
    startTimer(
      data.sessionId,
      data.startTime,
      timeGoal,
      SUBJECTS.find(s => s.name === subject)?.color
    );

  } catch (err) {
    console.error('Error starting session:', err);
    showNotification('Network error. Please try again.');
  }
});
