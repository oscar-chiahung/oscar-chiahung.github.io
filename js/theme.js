/* 深淺色與天空。這支程式放在 <head>、樣式之前載入，先決定外觀再畫畫面，避免閃一下。
   模式：auto（依日出日落，預設）、light、dark；手動選擇記在 localStorage 的 theme。
   自動模式不要求定位權限：用瀏覽器的時區推估大概的經緯度，再用 NOAA 的簡化公式算日出日落（誤差約 20 分鐘內）。
   結果寫在 <html>：data-theme = light|dark，data-sky = day|dusk|night。 */
(function(){
  var root=document.documentElement, KEY='theme';
  // 常見時區的代表座標 [緯度, 經度]
  var TZ={'Asia/Taipei':[23.7,120.5],'Asia/Tokyo':[35.7,139.7],'Asia/Seoul':[37.6,127],'Asia/Shanghai':[31.2,121.5],
    'Asia/Hong_Kong':[22.3,114.2],'Asia/Macau':[22.2,113.5],'Asia/Singapore':[1.35,103.8],'Asia/Kuala_Lumpur':[3.1,101.7],
    'Asia/Bangkok':[13.8,100.5],'Asia/Ho_Chi_Minh':[10.8,106.7],'Asia/Manila':[14.6,121],'Asia/Jakarta':[-6.2,106.8],
    'Asia/Kolkata':[22,79],'Asia/Dubai':[25.2,55.3],'Europe/London':[51.5,-0.1],'Europe/Paris':[48.9,2.4],
    'Europe/Berlin':[52.5,13.4],'Europe/Madrid':[40.4,-3.7],'Europe/Rome':[41.9,12.5],'Europe/Amsterdam':[52.4,4.9],
    'America/New_York':[40.7,-74],'America/Chicago':[41.9,-87.6],'America/Denver':[39.7,-105],'America/Los_Angeles':[34,-118.2],
    'America/Toronto':[43.7,-79.4],'America/Vancouver':[49.3,-123.1],'America/Sao_Paulo':[-23.5,-46.6],
    'Australia/Sydney':[-33.9,151.2],'Australia/Melbourne':[-37.8,145],'Pacific/Auckland':[-36.8,174.8]};

  function place(now){
    var tz=''; try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
    if(TZ[tz])return TZ[tz];
    var south=/^(Australia|Antarctica)|Auckland|Sao_Paulo|Buenos_Aires|Santiago|Johannesburg|Lima/.test(tz);
    return [south?-30:35, -now.getTimezoneOffset()/4];     // 經度：每小時 15 度
  }
  // 回傳 {day:是否白天, sinceRise:日出後幾分鐘, toSet:離日落幾分鐘}
  function sun(now){
    var p=place(now), lat=p[0]*Math.PI/180, lon=p[1];
    var start=new Date(now.getFullYear(),0,0), N=Math.floor((now-start)/864e5);
    var g=2*Math.PI/365*(N-1);
    var eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
    var dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
    var c=Math.cos(90.833*Math.PI/180)/(Math.cos(lat)*Math.cos(dec))-Math.tan(lat)*Math.tan(dec);
    if(c>1)return {day:false,sinceRise:999,toSet:999};       // 永夜
    if(c<-1)return {day:true,sinceRise:999,toSet:999};       // 永晝
    var ha=Math.acos(c)*180/Math.PI;
    var rise=720-4*(lon+ha)-eq, set=720-4*(lon-ha)-eq;       // UTC 分鐘
    var t=now.getUTCHours()*60+now.getUTCMinutes();
    var m=function(x){return ((x%1440)+1440)%1440};
    var since=m(t-rise), len=m(set-rise);
    return {day:since<len, sinceRise:since, toSet:len-since};
  }
  function saved(){try{var v=localStorage.getItem(KEY);return v==='light'||v==='dark'?v:'auto'}catch(e){return 'auto'}}
  function resolve(mode){
    if(mode==='light')return {theme:'light',sky:'day'};
    if(mode==='dark')return {theme:'dark',sky:'night'};
    var s=sun(new Date());
    if(!s.day)return {theme:'dark',sky:'night'};
    return {theme:'light',sky:(s.sinceRise<40||s.toSet<50)?'dusk':'day'};
  }
  var mode=saved(), current=null;
  function apply(animate){
    var r=resolve(mode);
    if(current&&current.theme===r.theme&&current.sky===r.sky)return;
    if(animate&&current){root.classList.add('theme-anim');setTimeout(function(){root.classList.remove('theme-anim')},700)}
    root.setAttribute('data-theme',r.theme);root.setAttribute('data-sky',r.sky);
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',r.theme==='dark'?'#161B18':'#FAF6EF');
    current=r;
    try{window.dispatchEvent(new Event('themechange'))}catch(e){}
  }
  apply(false);

  // ---------- 以下等頁面載入後才執行：按鈕、定時檢查、列印 ----------
  var KEYS={auto:'nav.themeAuto',light:'nav.themeLight',dark:'nav.themeDark'};
  var FALLBACK={auto:'外觀：自動（依日出日落）',light:'外觀：淺色',dark:'外觀：深色'};
  function paint(btn){
    var t=window.__i18n&&window.__i18n.t, name=t?t('nav.theme'):'', val=t?t(KEYS[mode]):'';
    var text=(name&&val)?(name+(/[\u3040-\u9fff]/.test(name)?'：':': ')+val):FALLBACK[mode];
    btn.setAttribute('data-mode',mode);btn.setAttribute('aria-label',text);
    var tip=btn.querySelector('.tip');if(tip)tip.textContent=text;
  }
  function setMode(m){
    mode=m;
    try{if(m==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,m)}catch(e){}
    apply(true);
  }
  function init(){
    var btn=document.getElementById('themeBtn');
    if(btn){
      paint(btn);
      var timer=0;
      btn.addEventListener('click',function(){
        // 自動 → 和現在相反的那一種 → 另一種 → 回到自動
        var auto=resolve('auto').theme, opp=auto==='dark'?'light':'dark';
        setMode(mode==='auto'?opp:(mode===opp?auto:'auto'));
        paint(btn);btn.classList.add('show');clearTimeout(timer);
        timer=setTimeout(function(){btn.classList.remove('show')},1800);
      });
      window.addEventListener('langchange',function(){paint(btn)});
    }
    setInterval(function(){apply(true)},60000);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)apply(true)});
    // 列印一律用淺色
    var before=null;
    window.addEventListener('beforeprint',function(){before=current;root.setAttribute('data-theme','light');root.setAttribute('data-sky','day')});
    window.addEventListener('afterprint',function(){if(before){root.setAttribute('data-theme',before.theme);root.setAttribute('data-sky',before.sky)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.__theme={get mode(){return mode},set:setMode,resolve:resolve,sun:sun};
})();
