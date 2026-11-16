/* 五種語言切換。
   頁面裡有 data-i18n="key" 的元素，文字取自 i18n/<語言>.json；HTML 預設內容就是繁中，所以繁中不需要下載檔案。
   其他屬性：data-i18n-aria（aria-label）、data-i18n-alt（圖片說明）。
   決定語言的順序：網址 ?lang= → 上次的選擇（localStorage 的 lang）→ 瀏覽器語言 → 繁中。
   <html> 會設定：lang（zh-Hant、zh-Hans、en、ja、ko）、data-locale（同上）、data-lang（英文為 en，中日韓為 zh，沿用既有樣式）。
   切換後發出 langchange 事件，讓高度計、外觀按鈕等跟著換字。 */
(function(){
  var root=document.documentElement, KEY='lang';
  var VER='20261116b';   // 語言檔版本：改了 i18n/*.json 就改這個數字，避免訪客讀到快取的舊檔
  var LANGS=['zh-Hant','zh-Hans','en','ja','ko'];
  var FONTS={   // 各語言標題用的思源宋體（繁中已在頁面載入）
    'zh-Hans':'Noto+Serif+SC:wght@400;500',
    'ja':'Noto+Serif+JP:wght@400;500',
    'ko':'Noto+Serif+KR:wght@400;500'
  };
  var cache={}, base={}, current='zh-Hant', loadedFonts={};

  function els(){return document.querySelectorAll('[data-i18n],[data-i18n-aria],[data-i18n-alt]')}
  // 記下頁面原本的繁中內容
  function snapshot(){
    var d={};
    els().forEach(function(el){
      var k=el.getAttribute('data-i18n'); if(k&&!(k in d))d[k]=el.innerHTML.trim();
      var a=el.getAttribute('data-i18n-aria'); if(a&&!(a in d))d[a]=el.getAttribute('aria-label')||'';
      var t=el.getAttribute('data-i18n-alt'); if(t&&!(t in d))d[t]=el.getAttribute('alt')||'';
    });
    return d;
  }
  function normalize(v){
    if(!v)return null;
    v=String(v).toLowerCase();
    if(v==='zh'||v==='zh-tw'||v==='zh-hk'||v==='zh-mo'||v.indexOf('zh-hant')===0)return 'zh-Hant';
    if(v==='zh-cn'||v==='zh-sg'||v.indexOf('zh-hans')===0)return 'zh-Hans';
    if(v.indexOf('zh')===0)return 'zh-Hant';
    if(v.indexOf('en')===0)return 'en';
    if(v.indexOf('ja')===0)return 'ja';
    if(v.indexOf('ko')===0)return 'ko';
    return null;
  }
  function pick(){
    var q=null; try{q=new URLSearchParams(location.search).get('lang')}catch(e){}
    var fromUrl=normalize(q); if(fromUrl)return fromUrl;
    var s=null; try{s=localStorage.getItem(KEY)}catch(e){}
    var fromSaved=normalize(s); if(fromSaved)return fromSaved;
    var list=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||''];
    for(var i=0;i<list.length;i++){var n=normalize(list[i]);if(n)return n}
    return 'zh-Hant';
  }
  function font(lang){
    if(!FONTS[lang]||loadedFonts[lang])return;
    var l=document.createElement('link'); l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family='+FONTS[lang]+'&display=swap';
    document.head.appendChild(l); loadedFonts[lang]=true;
  }
  function load(lang){
    if(lang==='zh-Hant')return Promise.resolve(base);
    if(cache[lang])return Promise.resolve(cache[lang]);
    return fetch('i18n/'+lang+'.json?v='+VER).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(d){cache[lang]=d;return d});
  }
  function t(key){
    var d=current==='zh-Hant'?base:(cache[current]||base);
    return (key in d)?d[key]:(base[key]||'');
  }
  function apply(lang,d){
    els().forEach(function(el){
      var k=el.getAttribute('data-i18n');
      if(k){
        var v=(k in d)?d[k]:base[k];
        if(v===''){el.hidden=true}else{el.hidden=false; if(v!=null&&el.innerHTML!==v)el.innerHTML=v}
      }
      var a=el.getAttribute('data-i18n-aria'); if(a&&d[a])el.setAttribute('aria-label',d[a]);
      var al=el.getAttribute('data-i18n-alt'); if(al&&d[al])el.setAttribute('alt',d[al]);
    });
    // 「了解更多」展開後的「收合」字樣
    var close=(d['more.close']!=null)?d['more.close']:'（收合）';
    document.querySelectorAll('.r-more summary [data-i18n]').forEach(function(s){s.setAttribute('data-close',close)});
    if(d['meta.title'])document.title=d['meta.title'].replace(/<[^>]+>/g,'');
    var md=document.querySelector('meta[name="description"]'); if(md&&d['meta.description'])md.setAttribute('content',d['meta.description']);
    current=lang;
    root.setAttribute('lang',lang); root.setAttribute('data-locale',lang); root.setAttribute('data-lang',lang==='en'?'en':'zh');
    var sel=document.getElementById('langSelect'); if(sel&&sel.value!==lang)sel.value=lang;
    try{window.dispatchEvent(new CustomEvent('langchange',{detail:{lang:lang}}))}catch(e){}
  }
  function set(lang,remember){
    lang=normalize(lang)||'zh-Hant';
    font(lang);
    if(remember){try{localStorage.setItem(KEY,lang)}catch(e){}}
    return load(lang).then(function(d){apply(lang,d)}).catch(function(){apply('zh-Hant',base)});
  }
  function init(){
    base=snapshot(); base['more.close']='（收合）';
    var sel=document.getElementById('langSelect');
    if(sel)sel.addEventListener('change',function(){set(sel.value,true)});
    var first=pick();
    // 舊版只記 zh／en：轉成新的代碼
    try{var s=localStorage.getItem(KEY); if(s==='zh'||s==='en')localStorage.setItem(KEY,normalize(s))}catch(e){}
    if(first==='zh-Hant')apply('zh-Hant',base); else set(first,false);
    // 不在頁面上的字（高度計、外觀按鈕等）：補讀繁中檔，只補缺的，不覆蓋頁面內容
    fetch('i18n/zh-Hant.json?v='+VER).then(function(r){return r.ok?r.json():{}}).then(function(d){
      for(var k in d)if(!(k in base))base[k]=d[k];
      if(current==='zh-Hant')try{window.dispatchEvent(new CustomEvent('langchange',{detail:{lang:current}}))}catch(e){}
    }).catch(function(){});
  }
  window.__i18n={set:function(l){return set(l,true)},t:t,get lang(){return current},langs:LANGS};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
