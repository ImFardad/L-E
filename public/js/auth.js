// public/js/auth.js
let isCodeSent = false;

const formSign = document.getElementById('signup-form');
const btnSend  = document.getElementById('send-code-btn');
const errSign  = document.getElementById('signup-error');
const verSect  = document.getElementById('verify-section');
const btnVer   = document.getElementById('verify-btn');
const errVer   = document.getElementById('verify-error');

btnSend.addEventListener('click', async () => {
  errSign.textContent = '';
  const fd = new FormData(formSign);

  // مرحلهٔ اول: Send Code
  if (!isCodeSent) {
    if (fd.get('password') !== fd.get('confirmPassword')) {
      return errSign.textContent = 'Passwords do not match';
    }
    // درخواست Send Code
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        firstName: fd.get('firstName'),
        lastName:  fd.get('lastName'),
        phone:     fd.get('phone'),
        email:     fd.get('email'),
        password:  fd.get('password')
      })
    });
    const data = await res.json();
    if (data.status === 'code-sent') {
      isCodeSent = true;
      // غیرفعال + خاکستری کردن فیلدها (به جز کد)
      formSign.querySelectorAll('input').forEach(i => {
        if (i.id !== 'code') {
          i.disabled = true;
          i.style.backgroundColor = '#33415588';
        }
      });
      verSect.classList.remove('hidden');
      btnSend.textContent = 'Resend Code';
    } else {
      errSign.textContent = data.error || 'Signup failed';
    }
    return;
  }

  // مرحلهٔ Resend Code
  const phone = formSign.phone.value;
  const res2 = await fetch('/api/signup', {
    method: 'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ phone })
  });
  const data2 = await res2.json();
  if (data2.status === 'code-sent') {
    errSign.textContent = 'A new code has been sent.';
  } else {
    errSign.textContent = data2.error || 'Resend failed';
  }
});

btnVer.addEventListener('click', async () => {
  errVer.textContent = '';
  const code = document.getElementById('code').value.trim();
  if (!code) return errVer.textContent = 'Enter verification code';

  const res = await fetch('/api/verify', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  if (data.status === 'verified') {
    window.location.href = '/';
  } else {
    errVer.textContent = data.error || 'Verification failed';
  }
});

// LOGIN
const formLog  = document.getElementById('login-form');
const btnLog   = document.getElementById('login-btn');
const errLog   = document.getElementById('login-error');

if (btnLog) {
  btnLog.addEventListener('click', async () => {
    errLog.textContent = '';
    const fd = new FormData(formLog);
    const res = await fetch('/api/login', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({
        phone: fd.get('phone'),
        password: fd.get('password')
      })
    });
    const data = await res.json();
    if (data.status === 'ok') {
      window.location.href = '/';
    } else {
      errLog.textContent = data.error || 'Login failed';
    }
  });
}
