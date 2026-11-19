    /* ===== EDIT HERE ===== */
    const CONFIG = {
      // Local trailer video, shown inside the TV screen.
      trailerVideo: "Final_trailer.mov",
      // Where applications are sent if the shared database isn't available (Instagram DM).
      instagram: "https://www.instagram.com/chams_el_mic/",
      // Shared Drive folder where each candidate creates their own folder.
      driveFolder: "https://drive.google.com/drive/folders/1q2_h8qsWK98lzIp7lBUk5NIuYo87Y4Lu?usp=sharing",
      // Paste your Google Apps Script Web App URL here to save applications in a Google Sheet (works once hosted on Vercel/Netlify).
      sheetUrl: ""
    };
    /* ===================== */
    const $ = s => document.querySelector(s);
    (function trailer() {
      const sc = $('#screen'), m = $('#mute'), note = $('#tnote');
      const v = document.createElement('video');
      v.src = CONFIG.trailerVideo; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true; v.controls = true;
      sc.appendChild(v); m.hidden = false;
      m.onclick = () => { v.muted = !v.muted; if (!v.muted) v.play(); m.textContent = v.muted ? '🔊 Sound on' : '🔇 Mute' };
      v.play().catch(() => { });
      note.textContent = 'Tap "Sound on" to hear it.';
    })();
    document.querySelectorAll('.chips').forEach(c => c.addEventListener('click', e => {
      if (e.target.tagName !== 'BUTTON') return; const t = document.getElementById(c.dataset.for);
      t.value = (t.value ? t.value + ' / ' : '') + e.target.textContent; t.focus()
    }));
    $('#f').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, err = $('#err'); err.textContent = '';
      const d = Object.fromEntries(new FormData(f));
      if (!d.name || !d.name.trim()) { err.textContent = 'Add your full name.'; f.name.focus(); return }
      if (!d.phone || d.phone.replace(/\D/g, '').length < 8) { err.textContent = 'Add a phone number we can reach (8 digits minimum).'; f.phone.focus(); return }
      if (!d.oath) { err.textContent = 'Take the oath first. Pick one of the two answers.'; return }
      d.weapon = [...f.querySelectorAll('[name=weapon]:checked')].map(x => x.value);
      d.submittedAt = new Date().toISOString();
      const text = `Chams El MIC application\nName: ${d.name}\nPhone: ${d.phone}\nFacebook: ${d.facebook || '-'}\nInstagram: ${d.instagram || '-'}\nISSATSO genre: ${d.q_genre || '-'}\nUnread groups: ${d.q_groups || '-'}\nLate excuse: ${d.q_excuse || '-'}\nMental state: ${d.q_mind || '-'}\nSuperpower: ${d.q_power || '-'}\nSecret weapon: ${d.weapon.join(', ') || '-'}\nOath: ${d.oath}\nDrive: ${d.drive || '-'}`;
      const btn = $('#go'); btn.disabled = true; btn.textContent = 'Sending…';
      let saved = false;
      if (CONFIG.sheetUrl) { try { await fetch(CONFIG.sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(d) }); saved = true } catch (x) { } }
      try {
        if (!saved && window.claude) {
          const db = await Promise.race([claude.use('db'), new Promise(r => setTimeout(() => r(null), 8000))]);
          if (db) { await db.collection('registrations').doc('r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)).set(d); saved = true }
        }
      } catch (x) { saved = false }
      const ok = $('#ok');
      ok.innerHTML = saved
        ? '<h3>You\'re on the call sheet!</h3><p>Application received. The curator will contact you on the number you gave. Wallah, no drama.</p>'
        : '<h3>One last step</h3><p>Our inbox is offline in this view, so send your application by Instagram DM. Copy it, then open our page and paste it.</p><pre id="txt"></pre><p><button type="button" class="b y" id="cp">Copy my application</button> <a class="b o dark-button" href="' + CONFIG.instagram + '" target="_blank" rel="noopener">Open @chams_el_mic</a></p>';
      if (!saved) { $('#txt').textContent = text; $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(text); $('#cp').textContent = 'Copied!' } catch (_) { const r = document.createRange(); r.selectNodeContents($('#txt')); getSelection().removeAllRanges(); getSelection().addRange(r); $('#cp').textContent = 'Selected, press copy' } } }
      $('#formbody').classList.add('form-hidden'); ok.classList.add('is-visible'); ok.focus();
    });
  