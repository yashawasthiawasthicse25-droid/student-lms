// Version 1 & 3: Contact Form Handling & Interactive FAQ
document.addEventListener('DOMContentLoaded', () => {
  loadContactSupportEmail();

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
});

async function loadContactSupportEmail() {
  const supportLink = document.getElementById('contact-support-email');
  if (!supportLink) return;

  try {
    const { email } = await API.getContactConfig();
    supportLink.textContent = email;
    supportLink.href = `https://mail.google.com/mail/?${new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: email
    })}`;
  } catch (err) {
    console.error('Failed to load support email address:', err.message);
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  const statusMsg = document.getElementById('contact-status-msg');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (!name || !email || !subject || !message) {
    showToast('Please fill out all fields.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Transmitting Message...';

  try {
    const res = await API.submitContact({ name, email, subject, message });
    statusMsg.style.display = 'block';
    statusMsg.className = `quiz-feedback ${res.emailSent ? 'success' : 'info'}`;
    statusMsg.textContent = res.message;

    if (res.emailDraftUrl) {
      const draftLink = document.createElement('a');
      draftLink.href = res.emailDraftUrl;
      draftLink.className = 'btn btn-outline';
      draftLink.textContent = 'Open Gmail draft';
      draftLink.target = '_blank';
      draftLink.rel = 'noopener noreferrer';
      draftLink.style.display = 'inline-flex';
      draftLink.style.marginTop = '0.75rem';
      statusMsg.appendChild(document.createElement('br'));
      statusMsg.appendChild(draftLink);
      showToast('Your message is saved. Open the Gmail draft to send it.', 'info');
      return;
    }

    document.getElementById('contact-form').reset();
    showToast('Your message has been sent successfully!', 'success');
  } catch (err) {
    statusMsg.style.display = 'block';
    statusMsg.className = 'quiz-feedback error';
    statusMsg.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
}
