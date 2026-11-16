/* 網站互動：語言切換、進場動畫、高度計、選單等。 */
(function(){
  var root=document.documentElement;
  // 保險：動畫沒跑完也會在 3 秒後移除開場幕布
  setTimeout(function(){var c=document.querySelector('.curtain');if(c)c.remove()},1600);
  try{localStorage.setItem('seenIntro','1')}catch(e){}
  // 語言切換在 js/i18n.js；這裡只需要在換語言後更新高度計文字
  window.addEventListener('langchange',function(){update()});

  // 捲動淡入
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  // 導覽列與高度計
  var nav=document.getElementById('nav'),alt=document.getElementById('alt'),v=document.getElementById('altv'),p=document.getElementById('altp');
  var darks=[].slice.call(document.querySelectorAll('[data-dark]'));
  var MAX=32000,ticking=false;
  function phase(a){
    var t=window.__i18n?window.__i18n.t:function(){return ''};
    if(a<=0)return t('alt.arrived')||'ARRIVED';
    if(a<6000)return t('alt.approach')||'APPROACH';
    if(a<22000)return t('alt.descent')||'DESCENT';
    return t('alt.cruising')||'CRUISING';
  }
  function update(){
    ticking=false;
    var y=window.scrollY,max=document.documentElement.scrollHeight-window.innerHeight;
    var r=max>0?Math.min(1,Math.max(0,y/max)):0;
    var a=Math.round((1-r)*MAX/100)*100;
    if(r>.995)a=0;
    v.textContent=a.toLocaleString('en-US');
    p.textContent=phase(a);
    nav.classList.toggle('solid',y>window.innerHeight*.6);
    var mid=window.innerHeight/2,onDark=darks.some(function(s){var b=s.getBoundingClientRect();return b.top<mid&&b.bottom>mid});
    alt.classList.toggle('ondark',onDark);
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
  window.addEventListener('resize',update);
  document.querySelectorAll('.lang button').forEach(function(b){b.addEventListener('click',update)});
  update();



  // 列印時展開所有「了解更多」
  (function(){
    var closed=[];
    window.addEventListener('beforeprint',function(){closed=[].filter.call(document.querySelectorAll('details.r-more'),function(d){return !d.open});closed.forEach(function(d){d.open=true})});
    window.addEventListener('afterprint',function(){closed.forEach(function(d){d.open=false});closed=[]});
  })();

  // 手機選單
  (function(){
    var nav=document.getElementById('nav'),btn=document.getElementById('menuBtn');
    if(!btn)return;
    function set(o){nav.classList.toggle('open',o);btn.setAttribute('aria-expanded',o?'true':'false')}
    btn.addEventListener('click',function(){set(!nav.classList.contains('open'))});
    document.querySelectorAll('#navLinks a').forEach(function(a){a.addEventListener('click',function(){set(false)})});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){set(false);btn.focus()}});
    window.addEventListener('resize',function(){if(window.innerWidth>900)set(false)});
  })();

  // ===== 華麗動畫 =====
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.getAttribute('data-motion')==='off';
  var fine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // 名字逐字
  var h1=document.querySelector('.hero h1');
  if(h1){
    var idx=0;
    [].slice.call(h1.childNodes).forEach(function(n){
      if(n.nodeType!==3)return;
      var frag=document.createDocumentFragment();
      n.textContent.split(' ').forEach(function(word,wi){
        if(wi){frag.appendChild(document.createTextNode(' '));idx++;}
        if(!word)return;
        var w=document.createElement('span');w.className='word';w.setAttribute('aria-hidden','true');
        word.split('').forEach(function(c){
          var sp=document.createElement('span');sp.className='ch';
          sp.textContent=c;sp.style.setProperty('--i',idx++);w.appendChild(sp);
        });
        frag.appendChild(w);
      });
      h1.replaceChild(frag,n);
    });
    h1.setAttribute('aria-label','Chia-Hung (Oscar) Lin');
    h1.classList.add('split');
  }
  // 標題遮罩
  document.querySelectorAll('.display').forEach(function(d){
    var w=document.createElement('span');w.className='mask-in';
    while(d.firstChild)w.appendChild(d.firstChild);d.appendChild(w);
  });
  // 經歷航線
  var log=document.querySelector('.log');
  if(log){var r=document.createElement('div');r.className='route';r.setAttribute('aria-hidden','true');
    r.innerHTML='<i></i><svg viewBox="-40 -14 44 28"><path d="M0 0 L-14 -4 L-18 -12 L-21 -12 L-19 -3 L-30 -2 L-34 -7 L-36 -7 L-35 0 L-36 7 L-34 7 L-30 2 L-19 3 L-21 12 L-18 12 L-14 4 Z"/></svg>';
    log.appendChild(r);}
  // 數字跳動
  function countUp(el){
    var node=null;
    for(var k=0;k<el.childNodes.length;k++){var c=el.childNodes[k];if(c.nodeType===3&&/\d/.test(c.textContent)){node=c;break}}
    if(!node)return;
    var m=node.textContent.match(/(\d+(?:\.\d+)?)/);if(!m)return;
    var target=parseFloat(m[1]),dec=(m[1].split('.')[1]||'').length,pre=node.textContent.slice(0,m.index),post=node.textContent.slice(m.index+m[1].length);
    var from=target>=1000?target-30:0,t0=null,D=1600;
    function step(ts){if(!t0)t0=ts;var u=Math.min(1,(ts-t0)/D),e=1-Math.pow(1-u,4);
      node.textContent=pre+(from+(target-from)*e).toFixed(dec)+post;if(u<1)requestAnimationFrame(step)}
    requestAnimationFrame(step);
  }
  if(!reduce){
    var cio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){countUp(e.target);cio.unobserve(e.target)}})},{threshold:.6});
    document.querySelectorAll('.stat .v').forEach(function(el){cio.observe(el)});
  }
  // 深色段落滑鼠光暈
  if(fine&&!reduce){document.querySelectorAll('.dark').forEach(function(d){
    var sp=document.createElement('div');sp.className='spot';d.insertBefore(sp,d.firstChild);
    d.addEventListener('mousemove',function(ev){var b=d.getBoundingClientRect();d.style.setProperty('--mx',(ev.clientX-b.left)+'px');d.style.setProperty('--my',(ev.clientY-b.top)+'px')});
  })}
  // 金色微塵
  function dust(cv){
    var ctx=cv.getContext('2d'),ps=[],w=0,h=0,dpr=Math.min(2,window.devicePixelRatio||1),on=false;
    function size(){w=cv.clientWidth;h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
    size();window.addEventListener('resize',size);
    var n=Math.round(Math.min(46,w/28));
    for(var i=0;i<n;i++)ps.push({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.8,vy:-(.08+Math.random()*.22),vx:(Math.random()-.5)*.12,ph:Math.random()*6.28,sp:.6+Math.random()*1.4});
    function frame(t){
      if(!on)return;
      ctx.clearRect(0,0,w,h);
      for(var i=0;i<ps.length;i++){var p=ps[i];p.x+=p.vx;p.y+=p.vy;if(p.y<-10){p.y=h+10;p.x=Math.random()*w}
        var a=.25+.55*(.5+.5*Math.sin(t/1000*p.sp+p.ph));
        var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);g.addColorStop(0,'rgba(255,240,205,'+a+')');g.addColorStop(1,'rgba(214,178,112,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r*4,0,6.283);ctx.fill()}
      requestAnimationFrame(frame);
    }
    new IntersectionObserver(function(es){var vis=es[0].isIntersecting;if(vis&&!on){on=true;requestAnimationFrame(frame)}else if(!vis){on=false}}).observe(cv);
  }
  if(!reduce)document.querySelectorAll('.dust').forEach(dust);
  // 捲動效果：進度條、雲層景深、開場內容淡出、深色段落展開、經歷航線
  var prog=document.getElementById('progress'),heroIn=document.querySelector('.hero-inner'),
      clouds=[].slice.call(document.querySelectorAll('.cloud')),speeds=[.35,.22,.5,.15],sun=document.querySelector('.sun'),
      darkSecs=[].slice.call(document.querySelectorAll('.dark')),route=document.querySelector('.route');
  function fx(){
    var y=window.scrollY,vh=window.innerHeight,max=document.documentElement.scrollHeight-vh;
    if(prog)prog.style.transform='scaleX('+(max>0?y/max:0)+')';
    if(reduce)return;
    if(y<vh*1.2){
      var k=fine?1:.5;
      clouds.forEach(function(c,i){c.style.translate='0 '+(y*speeds[i]*k)+'px'});
      if(sun)sun.style.translate='0 '+(-y*.15*k)+'px';
      if(heroIn){heroIn.style.transform='translateY('+(y*.25)+'px)';heroIn.style.opacity=Math.max(0,1-y/(vh*.75))}
    }
    darkSecs.forEach(function(d){if(d.getBoundingClientRect().top<vh*.82)d.classList.add('open')});
    if(route){var b=route.parentNode.getBoundingClientRect();var rp=Math.min(1,Math.max(0,(vh*.6-b.top)/b.height));route.style.setProperty('--rp',rp.toFixed(4))}
  }
  var fxTick=false;
  window.addEventListener('scroll',function(){if(!fxTick){fxTick=true;requestAnimationFrame(function(){fxTick=false;fx()})}},{passive:true});
  window.addEventListener('resize',fx);
  fx();
})();
