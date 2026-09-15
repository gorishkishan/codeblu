document.getElementById('year').textContent = new Date().getFullYear();

// scroll reveal
if ('IntersectionObserver' in window) {
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:.15});
  revealEls.forEach(el=>io.observe(el));
} else {
  // no IntersectionObserver support: just show reveal content immediately
  document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('in'));
}

// close mobile nav on link click
document.querySelectorAll('.main-nav a').forEach(a=>{
  a.addEventListener('click', ()=>{
    const t = document.getElementById('nav-toggle');
    if(t) t.checked = false;
  });
});

// mobile dropdown toggle (What We Do / Resources)
document.querySelectorAll('.dd-toggle').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopPropagation();
    const li = btn.closest('.has-drop');
    const isOpen = li.classList.contains('open');
    document.querySelectorAll('.has-drop.open').forEach(el=>{
      el.classList.remove('open');
      const b = el.querySelector('.dd-toggle');
      if(b) b.setAttribute('aria-expanded','false');
    });
    if(!isOpen){
      li.classList.add('open');
      btn.setAttribute('aria-expanded','true');
    }
  });
});

// pre-select "Making a donation" on contact form when arriving from Donate CTA
(function(){
  const params = new URLSearchParams(location.search);
  if(params.get('intent') === 'donate'){
    const sel = document.getElementById('c-subject');
    if(sel){
      for(const opt of sel.options){
        if(opt.textContent.trim() === 'Making a donation'){ sel.value = opt.value || opt.textContent; break; }
      }
    }
  }
})();

// specialist teams interactive switcher
(function(){
  const tabs = document.querySelectorAll('.team-tab');
  const panels = document.querySelectorAll('.team-panel');
  if(!tabs.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      const idx = tab.getAttribute('data-team');
      tabs.forEach(t=>{t.classList.remove('active'); t.setAttribute('aria-selected','false');});
      panels.forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      const panel = document.querySelector(`.team-panel[data-panel="${idx}"]`);
      if(panel) panel.classList.add('active');
      tab.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
    });
  });
})();

// team section — category filter (Core Team / Mentors / Patrons / Support)
(function(){
  const filterBtns = document.querySelectorAll('.team-filter-btn');
  const panels = document.querySelectorAll('.team-panels .team-grid');
  if(!filterBtns.length || !panels.length) return;

  filterBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cat = btn.getAttribute('data-cat');

      filterBtns.forEach(b=>{
        b.classList.remove('active');
        b.setAttribute('aria-selected','false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');

      panels.forEach(panel=>{
        if(panel.getAttribute('data-cat-panel') === cat){
          panel.hidden = false;
          // cards inside a panel that was hidden on load never got a chance
          // to cross the IntersectionObserver threshold — reveal them now
          panel.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('in'));
        } else {
          panel.hidden = true;
        }
      });
    });
  });
})();

function highlightServiceCard(hash){
  const id = (hash || location.hash).replace('#','');
  const validIds = ['wellness-workshops','hobby-workshops','getaways','career-coaching'];
  if(!validIds.includes(id)) return;
  const card = document.getElementById(id);
  if(!card) return;
  document.querySelectorAll('.service-card.card-highlight').forEach(c=>c.classList.remove('card-highlight'));
  // restart animation even if same card is clicked again
  void card.offsetWidth;
  card.classList.add('card-highlight');
  setTimeout(()=>card.classList.remove('card-highlight'), 1900);
}

window.addEventListener('hashchange', ()=>highlightServiceCard());
window.addEventListener('DOMContentLoaded', ()=>{ if(location.hash) highlightServiceCard(); });

// =========================================================
// Membership application form
// =========================================================
(function(){
  const form = document.getElementById('membership-application-form');
  if(!form) return;

  // show/hide the "areas of interest" box under the volunteer question
  const volYes = document.getElementById('m-volunteer-yes');
  const volNo = document.getElementById('m-volunteer-no');
  const volWrap = document.getElementById('m-volunteer-detail-wrap');
  function syncVolunteer(){
    if(volYes && volYes.checked){ volWrap.classList.add('is-visible'); }
    else { volWrap.classList.remove('is-visible'); }
  }
  if(volYes && volNo){
    volYes.addEventListener('change', syncVolunteer);
    volNo.addEventListener('change', syncVolunteer);
  }

  // show/hide the "please specify" box under "How did you hear" -> Other
  const heardOther = document.getElementById('m-heard-other-radio');
  const heardOtherWrap = document.getElementById('m-heard-other-wrap');
  const heardRadios = form.querySelectorAll('input[name="Heard About CodeBlu"]');
  function syncHeard(){
    if(heardOther && heardOther.checked){ heardOtherWrap.classList.add('is-visible'); }
    else { heardOtherWrap.classList.remove('is-visible'); }
  }
  heardRadios.forEach(r => r.addEventListener('change', syncHeard));

  // collect checked checkboxes with the same name into a single readable value
  function collectCheckboxGroup(name){
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`))
      .map(el => el.value)
      .join(', ');
  }

  const statusBox = document.getElementById('m-form-status');
  const submitBtn = document.getElementById('m-submit-btn');

  function showStatus(kind, message){
    statusBox.textContent = message;
    statusBox.classList.remove('success','error');
    statusBox.classList.add(kind, 'is-visible');
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();

    // basic honeypot spam check
    const honeypot = form.querySelector('input[name="botcheck"]');
    if(honeypot && honeypot.value){ return; }

    // native validation (required fields) before sending
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    const accessKey = form.querySelector('input[name="access_key"]').value;
    if(!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY'){
      showStatus('error', 'This form is not fully set up yet — a Web3Forms access key is needed. Please contact the site admin.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    statusBox.classList.remove('is-visible','success','error');

    const formData = new FormData(form);
    // replace the raw multi-checkbox entries with one combined, readable field
    formData.delete('Areas of Interest');
    formData.append('Areas of Interest', collectCheckboxGroup('Areas of Interest') || 'None selected');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      const result = await response.json();

      if(result.success){
        showStatus('success', "Thank you! Your membership application has been submitted. Our team will review it and get back to you soon.");
        form.reset();
        volWrap.classList.remove('is-visible');
        heardOtherWrap.classList.remove('is-visible');
      } else {
        showStatus('error', 'Something went wrong while submitting your application. Please try again or email us directly at codebluwellness@gmail.com.');
      }
    } catch(err){
      showStatus('error', 'We could not reach the server. Please check your connection and try again, or email us directly at codebluwellness@gmail.com.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Application';
    }
  });
})();
