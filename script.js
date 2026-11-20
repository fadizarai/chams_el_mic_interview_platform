    /* ===== EDIT HERE ===== */
    const CONFIG = {
      // Local trailer video, shown inside the TV screen.
      trailerVideo: "Final_trailer.mov",
      // Where applications are sent if the shared database isn't available (Instagram DM).
      instagram: "https://www.instagram.com/chams_el_mic/",
      // Shared Drive folder where each candidate creates their own folder.
      driveFolder: "https://drive.google.com/drive/folders/1q2_h8qsWK98lzIp7lBUk5NIuYo87Y4Lu?usp=sharing",
      // Paste your Google Apps Script Web App URL here to save applications in a Google Sheet (works once hosted on Vercel/Netlify).
      sheetUrl: "https://script.google.com/macros/s/AKfycbx5yiHi2I_Htoz74GWhrT_oeaZKGgJyoJlfVpo3q4lJfPnJ2lVjHHlJKEGa8SGi_Hez/exec"
    };
    /* ===================== */

    const $ = s => document.querySelector(s);

    // ── Trailer ───────────────────────────────────────────────────────────────
    (function trailer() {
      const sc = $('#screen'), m = $('#mute'), note = $('#tnote');
      const v = document.createElement('video');
      v.src = CONFIG.trailerVideo; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true; v.controls = true;
      sc.appendChild(v); m.hidden = false;
      m.onclick = () => { v.muted = !v.muted; if (!v.muted) v.play(); m.textContent = v.muted ? '🔊 Sound on' : '🔇 Mute' };
      v.play().catch(() => { });
      note.textContent = 'Tap "Sound on" to hear it.';
    })();

    // ── Chip buttons ──────────────────────────────────────────────────────────
    document.querySelectorAll('.chips').forEach(c => c.addEventListener('click', e => {
      if (e.target.tagName !== 'BUTTON') return;
      const t = document.getElementById(c.dataset.for);
      t.value = (t.value ? t.value + ' / ' : '') + e.target.textContent; t.focus();
    }));

    // ── Shared validation helper ───────────────────────────────────────────────
    function validateForm(d, f, err) {
      if (!d.name || !d.name.trim()) { err.textContent = 'Add your full name.'; f.name.focus(); return false; }
      if (!d.phone || d.phone.replace(/\D/g, '').length < 8) { err.textContent = 'Add a phone number we can reach (8 digits minimum).'; f.phone.focus(); return false; }
      if (!d.facebook || !d.facebook.trim()) { err.textContent = 'Add your Facebook profile link.'; f.facebook.focus(); return false; }
      if (!d.instagram || !d.instagram.trim()) { err.textContent = 'Add your Instagram profile link.'; f.instagram.focus(); return false; }
      if (!d.oath) { err.textContent = 'Take the oath first. Pick one of the two answers.'; return false; }
      return true;
    }

    // ── Form submit ───────────────────────────────────────────────────────────
    $('#f').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target, err = $('#err');
      err.textContent = '';
      const d = Object.fromEntries(new FormData(f));
      if (!validateForm(d, f, err)) return;
      d.weapon = [...f.querySelectorAll('[name=weapon]:checked')].map(x => x.value);
      d.submittedAt = new Date().toISOString();
      const text = `Chams El MIC application\nName: ${d.name}\nPhone: ${d.phone}\nFacebook: ${d.facebook || '-'}\nInstagram: ${d.instagram || '-'}\nISSATSO genre: ${d.q_genre || '-'}\nUnread groups: ${d.q_groups || '-'}\nLate excuse: ${d.q_excuse || '-'}\nMental state: ${d.q_mind || '-'}\nSuperpower: ${d.q_power || '-'}\nSecret weapon: ${d.weapon.join(', ') || '-'}\nOath: ${d.oath}\nDrive: ${d.drive || '-'}`;
      const btn = $('#go'); btn.disabled = true; btn.textContent = 'Sending…';
      let saved = false;
      if (CONFIG.sheetUrl) { try { await fetch(CONFIG.sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(d) }); saved = true } catch (x) { } }
      try {
        if (!saved && window.claude) {
          const db = await Promise.race([claude.use('db'), new Promise(r => setTimeout(() => r(null), 8000))]);
          if (db) { await db.collection('registrations').doc('r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)).set(d); saved = true; }
        }
      } catch (x) { saved = false; }
      const ok = $('#ok');
      ok.innerHTML = saved
        ? '<h3>You\'re on the call sheet!</h3><p>Application received. The curator will contact you on the number you gave. Wallah, no drama.</p>'
        : '<h3>One last step</h3><p>Our inbox is offline in this view, so send your application by Instagram DM. Copy it, then open our page and paste it.</p><pre id="txt"></pre><p><button type="button" class="b y" id="cp">Copy my application</button> <a class="b o dark-button" href="' + CONFIG.instagram + '" target="_blank" rel="noopener">Open @chams_el_mic</a></p>';
      if (!saved) {
        $('#txt').textContent = text;
        $('#cp').onclick = async () => {
          try { await navigator.clipboard.writeText(text); $('#cp').textContent = 'Copied!'; }
          catch (_) { const r = document.createRange(); r.selectNodeContents($('#txt')); getSelection().removeAllRanges(); getSelection().addRange(r); $('#cp').textContent = 'Selected, press copy'; }
        };
      }
      $('#formbody').classList.add('form-hidden'); ok.classList.add('is-visible'); ok.focus();
    });

    // ── PDF Download ──────────────────────────────────────────────────────────
    $('#dlpdf').addEventListener('click', () => {
      const f = document.getElementById('f');
      const err = $('#err');
      err.textContent = '';
      const d = Object.fromEntries(new FormData(f));
      if (!validateForm(d, f, err)) return;
      d.weapon = [...f.querySelectorAll('[name=weapon]:checked')].map(x => x.value);

      const rows = [
        ['Full name',     d.name || '—'],
        ['Phone',         d.phone || '—'],
        ['Facebook',      d.facebook || '—'],
        ['Instagram',     d.instagram || '—'],
        ['ISSATSO genre', d.q_genre || '—'],
        ['Unread groups', d.q_groups || '—'],
        ['Late excuse',   d.q_excuse || '—'],
        ['Mental state',  d.q_mind || '—'],
        ['Superpower',    d.q_power || '—'],
        ['Secret weapon', d.weapon.join(', ') || '—'],
        ['Oath',          d.oath || '—'],
        ['Drive folder',  d.drive || '—'],
      ];

      const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      const tableRows = rows.map(([label, val]) => `<tr><th>${label}</th><td>${esc(val)}</td></tr>`).join('');
      const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
        <title>Chams El MIC Application — ${esc(d.name)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0 }
          body { font: 400 14px/1.6 Cairo, sans-serif; color: #14202a; padding: 36px 44px }
          .header { border-bottom: 4px solid #ffe100; padding-bottom: 16px; margin-bottom: 24px }
          .header h1 { font-size: 26px; font-weight: 800 }
          .header p { font-size: 13px; color: #44566a; margin-top: 4px }
          .badge { background: #ff2a14; color: #fff; font-size: 10px; font-weight: 800;
                   padding: 2px 8px; border-radius: 99px; letter-spacing: .05em; margin-left: 8px; vertical-align: middle }
          table { width: 100%; border-collapse: collapse; margin-top: 4px }
          th { text-align: left; font-weight: 800; font-size: 12px; color: #44566a;
               text-transform: uppercase; letter-spacing: .04em; padding: 10px 12px;
               background: #f5f0e8; border-bottom: 1px solid #ddd; width: 160px; vertical-align: top }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; word-break: break-word }
          tr:last-child th, tr:last-child td { border-bottom: none }
          .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px }
          @media print { body { padding: 20px 28px } }
        </style>
      </head><body>
        <div class="header">
          <h1>شمس El MIC <span class="badge">Application</span></h1>
          <p>Generated on ${date}</p>
        </div>
        <table>${tableRows}</table>
        <div class="footer">شمس El MIC — Microsoft Club ISSATSo</div>
        <script>window.addEventListener('load', () => { window.print(); });<\/script>
      </body></html>`;

      const win = window.open('', '_blank');
      if (!win) { err.textContent = 'Pop-up blocked — please allow pop-ups for this page and try again.'; return; }
      win.document.write(html);
      win.document.close();
    });

    // ── Idea Corner Submission ────────────────────────────────────────────────
    const ideaForm = $('#ideaForm');
    if (ideaForm) {
      ideaForm.addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target, err = $('#ideaErr');
        err.textContent = '';
        const d = Object.fromEntries(new FormData(f));

        if (!d.idea_title || !d.idea_title.trim()) {
          err.textContent = 'Please enter an idea title or pitch.';
          f.idea_title.focus();
          return;
        }
        if (!d.idea_details || !d.idea_details.trim()) {
          err.textContent = 'Please explain your idea in a few sentences.';
          f.idea_details.focus();
          return;
        }

        const btn = $('#submitIdeaBtn');
        btn.disabled = true;
        btn.textContent = 'Pitching idea…';

        const payload = {
          type: 'idea',
          submittedAt: new Date().toISOString(),
          title: d.idea_title.trim(),
          category: d.idea_category || 'ISSATSO Campus Life',
          details: d.idea_details.trim(),
          author: (d.idea_author && d.idea_author.trim()) ? d.idea_author.trim() : 'Anonymous',
          contact: (d.idea_contact && d.idea_contact.trim()) ? d.idea_contact.trim() : 'None',
          credit: d.idea_credit_on_screen ? 'Yes' : 'No'
        };

        if (CONFIG.sheetUrl) {
          try {
            await fetch(CONFIG.sheetUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify(payload)
            });
          } catch (x) { }
        }

        $('#ideabody').classList.add('form-hidden');
        const ideaOk = $('#ideaOk');
        ideaOk.classList.add('is-visible');
        ideaOk.focus();
      });

      const anotherBtn = $('#anotherIdeaBtn');
      if (anotherBtn) {
        anotherBtn.addEventListener('click', () => {
          ideaForm.reset();
          $('#ideabody').classList.remove('form-hidden');
          $('#ideaOk').classList.remove('is-visible');
          const btn = $('#submitIdeaBtn');
          btn.disabled = false;
          btn.textContent = '🚀 Pitch this idea';
          $('#ideaErr').textContent = '';
        });
      }
    }
