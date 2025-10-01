document.addEventListener('DOMContentLoaded',()=>{
  const yearEl=document.getElementById('year');
  if(yearEl){yearEl.textContent=new Date().getFullYear();}

  // Progressive enhancement: clone ticker track to create seamless loop
  const track=document.querySelector('.ticker-track');
  if(track){
    const clone=track.cloneNode(true);
    track.parentElement.appendChild(clone);
  }

  // Subscribe mock
  window.subscribe=function(){
    alert('Thanks for joining Clantical\'s inner circle!');
  };

  // UGC widgets: likes, comments, ratings (localStorage)
  const storageKey=(id)=>`clantical-ugc-${id}`;
  function loadState(id){
    try{return JSON.parse(localStorage.getItem(storageKey(id))||'{}')}catch{return{}}
  }
  function saveState(id,state){
    localStorage.setItem(storageKey(id),JSON.stringify(state));
  }
  function initUgc(container){
    const id=container.getAttribute('data-ugc-id');
    if(!id) return;
    const state=loadState(id);
    const likeBtn=container.querySelector('[data-like]')||container.parentElement.querySelector('[data-like]');
    const likeCountEl=container.querySelector('[data-like-count]')||container.parentElement.querySelector('[data-like-count]');
    const commentInput=container.querySelector('[data-comment-input]')||container.parentElement.querySelector('[data-comment-input]');
    const commentAdd=container.querySelector('[data-comment-add]')||container.parentElement.querySelector('[data-comment-add]');
    const commentList=container.querySelector('[data-comment-list]')||container.parentElement.querySelector('[data-comment-list]');
    const ratingEl=container.querySelector('[data-rating]')||container.parentElement.querySelector('[data-rating]');

    // Likes
    const likes=Number(state.likes||0);
    const liked=Boolean(state.liked||false);
    if(likeCountEl) likeCountEl.textContent=likes;
    function setLikedUI(on){
      if(!likeBtn) return; 
      likeBtn.disabled=on; likeBtn.classList.toggle('btn-outline-light',!on); likeBtn.classList.toggle('btn-success',on);
      const i=likeBtn.querySelector('i');
      if(i){ i.classList.toggle('bi-heart',!on); i.classList.toggle('bi-heart-fill',on); i.classList.toggle('text-danger',on); }
    }
    setLikedUI(liked);
    likeBtn?.addEventListener('click',()=>{
      const s=loadState(id); if(s.liked) return; // allow only once
      s.liked=true; s.likes=Number(s.likes||0)+1; saveState(id,s);
      if(likeCountEl) likeCountEl.textContent=s.likes;
      setLikedUI(true);
    });

    // Comments
    const comments=Array.isArray(state.comments)?state.comments:[];
    function renderComments(){
      if(!commentList) return; commentList.innerHTML='';
      comments.forEach((c,i)=>{
        const li=document.createElement('li');
        li.className='d-flex justify-content-between align-items-start gap-2';
        li.innerHTML=`<span>${c}</span><button class="btn btn-link btn-sm text-danger p-0">Remove</button>`;
        li.querySelector('button').addEventListener('click',()=>{comments.splice(i,1); saveState(id,{...state,likes:Number(state.likes||0),comments,stars:state.stars}); renderComments();});
        commentList.appendChild(li);
      });
    }
    renderComments();
    commentAdd?.addEventListener('click',()=>{
      const v=(commentInput?.value||'').trim(); if(!v) return;
      comments.push(v); saveState(id,{...state,likes:Number(state.likes||0),comments,stars:state.stars});
      commentInput.value=''; renderComments();
    });

    // Rating
    function setStars(n){
      if(!ratingEl) return; Array.from(ratingEl.querySelectorAll('[data-star]')).forEach((iEl)=>{
        const val=Number(iEl.getAttribute('data-star')); iEl.classList.toggle('active',val<=n);
        iEl.classList.toggle('bi-star-fill',val<=n); iEl.classList.toggle('bi-star',val>n);
      });
    }
    const stars=Number(state.stars||0); setStars(stars);
    ratingEl?.querySelectorAll('[data-star]').forEach((iEl)=>{
      iEl.addEventListener('click',()=>{
        const n=Number(iEl.getAttribute('data-star'));
        saveState(id,{...state,likes:Number(state.likes||0),comments,stars:n}); setStars(n);
      });
    });
  }

  document.querySelectorAll('[data-ugc-id]').forEach(initUgc);

  // Upcoming shows in-card overlay
  document.querySelectorAll('.show-card').forEach(card=>{
    const openBtn=card.querySelector('[data-show-open]');
    const overlay=card.querySelector('.card-overlay');
    const closeBtn=card.querySelector('[data-show-close]');
    function show(){overlay?.classList.add('show'); overlay?.removeAttribute('hidden');}
    function hide(){overlay?.classList.remove('show'); overlay?.setAttribute('hidden','');}
    openBtn?.addEventListener('click', (e)=>{e.preventDefault(); e.stopPropagation(); show();});
    closeBtn?.addEventListener('click', (e)=>{e.preventDefault(); e.stopPropagation(); hide();});
    document.addEventListener('click',(e)=>{ if(!card.contains(e.target)){ hide(); } });
  });

  // Improve ticker: duplicate tracks across all breakpoints
  document.querySelectorAll('.ticker-track').forEach(track=>{
    if(track.dataset.cloned) return;
    const clone=track.cloneNode(true);
    track.parentElement.appendChild(clone);
    track.dataset.cloned='1';
  });

  // Persist background video positions across pages
  function resumeVideo(selector, key){
    const v=document.querySelector(selector);
    if(!v) return;
    const saved=Number(sessionStorage.getItem(key)||0);
    if(!isNaN(saved) && saved>0){
      v.currentTime=Math.min(saved, (v.duration||saved));
    }
    const onTime=()=>{
      try{ sessionStorage.setItem(key, String(v.currentTime||0)); }catch{}
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', ()=>{ try{ sessionStorage.removeItem(key);}catch{} });
    // ensure play attempt
    v.play?.().catch(()=>{});
  }
  resumeVideo('.hero-video', 'heroVideoTime');
  resumeVideo('.page-bg-video', 'pageBgVideoTime');

  // Register service worker if available
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }

  // Theme toggle with icon + persistence
  const root=document.documentElement;
  const savedTheme=localStorage.getItem('clantical-theme');
  if(savedTheme==='light'){root.classList.add('theme-light');root.classList.remove('theme-dark');}
  const themeBtn=document.querySelector('[data-theme-toggle]');
  function updateThemeIcon(){
    if(!themeBtn) return;
    const i=themeBtn.querySelector('i');
    const light=root.classList.contains('theme-light');
    if(i){i.className=light?'bi bi-sun':'bi bi-moon';}
    themeBtn.setAttribute('aria-label',light?'Switch to dark':'Switch to light');
  }
  updateThemeIcon();
  themeBtn?.addEventListener('click',()=>{
    const isLight=root.classList.toggle('theme-light');
    if(isLight){root.classList.remove('theme-dark');localStorage.setItem('clantical-theme','light');}
    else {root.classList.add('theme-dark');localStorage.setItem('clantical-theme','dark');}
    updateThemeIcon();
  });

  // Ensure like buttons have an icon even before initUgc wires them
  document.querySelectorAll('[data-like]').forEach(btn=>{
    if(!btn.querySelector('i')){
      const i=document.createElement('i'); i.className='bi bi-heart me-1'; btn.insertBefore(i,btn.firstChild);
    }
  });
});


