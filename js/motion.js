/* 階段 6：動態效果開關（滑鼠飛機雲已依使用者要求於 11/16 取消）。
   開關把 html[data-motion] 設成 on/off，記在 localStorage 的 motion；系統開了「減少動態效果」時預設為 off。 */
(function(){
  var root=document.documentElement, KEY='motion';
  var sysReduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  function saved(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function state(){var s=saved();return s==='on'||s==='off'?s:(sysReduce.matches?'off':'on')}
  function apply(){root.setAttribute('data-motion',state());try{window.dispatchEvent(new Event('motionchange'))}catch(e){}}
  apply();
  window.__motion={get on(){return root.getAttribute('data-motion')!=='off'}};

  function label(btn){
    var t=window.__i18n&&window.__i18n.t, on=state()==='on';
    var text=(t&&t(on?'nav.motionOn':'nav.motionOff'))||(on?'動態效果：開':'動態效果：關');
    btn.setAttribute('aria-label',text); btn.setAttribute('aria-pressed',on?'true':'false');
    var tip=btn.querySelector('.tip'); if(tip)tip.textContent=text;
  }
  function init(){
    var btn=document.getElementById('motionBtn');
    if(btn){
      label(btn); var timer=0;
      btn.addEventListener('click',function(){
        var next=state()==='on'?'off':'on';
        try{localStorage.setItem(KEY,next)}catch(e){}
        apply(); label(btn);
        btn.classList.add('show'); clearTimeout(timer); timer=setTimeout(function(){btn.classList.remove('show')},1600);
      });
      window.addEventListener('langchange',function(){label(btn)});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
