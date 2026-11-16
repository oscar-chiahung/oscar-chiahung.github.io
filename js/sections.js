/* 階段 5 各區的互動（規格見 ../設計交接_給Opus.md）。 */
(function(){
  var root=document.documentElement;

  // ---------- 5-2 Notedly：捲到哪一條重點，就顯示對應的 App 畫面 ----------
  var stage=document.querySelector('.proj-stage');
  if(stage){
    var shot=stage.querySelector('.proj-shot'), imgs=[].slice.call(shot.querySelectorAll('img')), items=[].slice.call(stage.querySelectorAll('.proj-list li'));
    var LOCALES=['zh-Hant','zh-Hans','en','ja','ko'];
    function setSrc(){
      var loc=root.getAttribute('data-locale')||'zh-Hant'; if(LOCALES.indexOf(loc)<0)loc='zh-Hant';
      imgs.forEach(function(im){var u='assets/notedly/'+loc+'/'+im.getAttribute('data-shot')+'.webp'; if(im.getAttribute('src')!==u)im.setAttribute('src',u)});
    }
    function show(name){
      imgs.forEach(function(im){im.classList.toggle('on',im.getAttribute('data-shot')===name)});
      items.forEach(function(li){li.classList.toggle('active',li.getAttribute('data-shot')===name)});
    }
    setSrc(); window.addEventListener('langchange',setSrc);
    if('IntersectionObserver' in window){
      stage.classList.add('live'); show(items[0].getAttribute('data-shot'));
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting)show(e.target.getAttribute('data-shot'))});
      },{rootMargin:'-45% 0px -45% 0px',threshold:0});
      items.forEach(function(li){io.observe(li)});
    }
  }

  // ---------- 5-3 機上娛樂：頻道切換 ----------
  var ife=document.querySelector('.ife');
  if(ife){
    var tabs=[].slice.call(ife.querySelectorAll('[role="tab"]')), screen=ife.querySelector('.ife-screen');
    function pick(tab,focus){
      tabs.forEach(function(t){
        var sel=t===tab, panel=document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected',sel?'true':'false'); t.tabIndex=sel?0:-1;
        if(sel){panel.hidden=false; void panel.offsetWidth; panel.classList.add('on')}
        else{panel.classList.remove('on'); panel.hidden=true}
      });
      screen.classList.remove('scan'); void screen.offsetWidth; screen.classList.add('scan');
      if(focus)tab.focus();
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){pick(t,false)});
      t.addEventListener('keydown',function(e){
        var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        if(e.key==='Home'){e.preventDefault();pick(tabs[0],true)}
        else if(e.key==='End'){e.preventDefault();pick(tabs[tabs.length-1],true)}
        else if(d){e.preventDefault();pick(tabs[(i+d+tabs.length)%tabs.length],true)}
      });
    });
  }

  // ---------- 5-4 檢查表、5-5 儀表：捲到時打勾／畫弧（只一次） ----------
  var once=function(el,cls,th){
    if(!el)return;
    if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){el.classList.add(cls);return}
    var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){el.classList.add(cls);o.disconnect()}})},{threshold:th});
    o.observe(el);
  };
  once(document.getElementById('checklist'),'done',.6);
  once(document.getElementById('gauges'),'in',.5);

  // ---------- 5-6 條紋小圖：點一下或滑鼠移上去互換方向 ----------
  var st=document.querySelector('.art-stripes');
  if(st){
    st.addEventListener('click',function(){st.classList.toggle('swap')});
    st.addEventListener('mouseenter',function(){st.classList.add('swap')});
    st.addEventListener('mouseleave',function(){st.classList.remove('swap')});
  }

  // ---------- 5-9 導覽列：標示目前所在區塊 ----------
  var links=[].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  if(links.length&&'IntersectionObserver' in window){
    var map={}; links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
    var sectionOf={interests:'research',faq:'research'};   // 沒有導覽項目的區塊，歸到前一個
    var nio=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        var id=sectionOf[e.target.id]||e.target.id;
        links.forEach(function(a){if(a===map[id])a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
      });
    },{rootMargin:'-40% 0px -55% 0px'});
    document.querySelectorAll('main section[id]').forEach(function(sec){if(sec.id!=='top')nio.observe(sec)});
  }

  // ---------- 高度計說明跟著語言換 ----------
  var alt=document.getElementById('alt');
  function altHint(){if(alt&&window.__i18n){var t=window.__i18n.t('alt.hint');if(t)alt.setAttribute('title',t)}}
  window.addEventListener('langchange',altHint);
})();
