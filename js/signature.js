/* 簽名手寫動畫。
   assets/signature_map.png 記錄每個墨跡像素「何時被寫到」（R、G = 16 位元時間，B = 墨跡濃度）；
   assets/signature_map2.png 是交叉處的第二段：R、G = 補滿的時間，B = 第一次出現時的濃度（筆緣先掃到一部分，等另一筆寫到才補滿）。
   兩張圖由 _source/sig_v4/build.py 依簽名圖片與手排筆順產生。這裡只負責照時間把墨跡顯示出來；第二張讀不到就只用第一張。
   捲到時寫一次；點一下或按 Enter 重寫；「減少動態效果」時直接顯示完成的簽名；載入失敗則保留原本的圖片。 */
(function(){
  var wrap=document.getElementById('sig');
  if(!wrap||!wrap.getContext&&!document.createElement('canvas').getContext)return;
  var canvas=wrap.querySelector('canvas'), ctx=canvas.getContext('2d');
  var DURATION=3000;          // 書寫全長（毫秒），與時間圖的 3 秒一致
  var SOFT=0.012;             // 筆尖的柔邊（佔全長的比例）
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var idx=null, time=null, alpha=null, time2=null, alpha1=null, img=null, out=null, raf=0, playing=false, done=false;

  function inkColor(){
    var m=getComputedStyle(wrap).color.match(/[\d.]+/g)||[43,33,26];
    return [+m[0],+m[1],+m[2]];
  }
  function paintColor(){
    var c=inkColor(), d=out.data;
    for(var k=0;k<idx.length;k++){var p=idx[k]*4;d[p]=c[0];d[p+1]=c[1];d[p+2]=c[2]}
  }
  function render(T){           // T：0～1+SOFT
    var d=out.data;
    for(var k=0;k<idx.length;k++){
      var u=(T-time[k])/SOFT, a1=alpha1[k], v;
      u=u<=0?0:(u>=1?1:u);
      if(a1===alpha[k])v=alpha[k]*u;
      else{var w=(T-time2[k])/SOFT; w=w<=0?0:(w>=1?1:w); v=a1*u+(alpha[k]-a1)*w}
      d[idx[k]*4+3]=v;
    }
    ctx.putImageData(out,0,0);
  }
  function finish(){playing=false;done=true;render(1+SOFT);wrap.classList.add('written')}
  function play(){
    if(!idx||playing)return;
    cancelAnimationFrame(raf); paintColor();
    if(reduce.matches||document.documentElement.getAttribute('data-motion')==='off'){finish();return}
    playing=true; wrap.classList.remove('written'); render(0);
    var t0=null;
    raf=requestAnimationFrame(function step(ts){
      if(t0===null)t0=ts;
      var p=(ts-t0)/DURATION;
      if(p>=1){finish();return}
      render(p*(1+SOFT)); raf=requestAnimationFrame(step);
    });
  }
  function recolor(){if(!idx)return; paintColor(); if(!playing)render(done?1+SOFT:0)}

  function pixels(im){
    var off=document.createElement('canvas'); off.width=im.naturalWidth; off.height=im.naturalHeight;
    var o=off.getContext('2d',{willReadFrequently:true}); o.drawImage(im,0,0);
    try{return o.getImageData(0,0,off.width,off.height).data}catch(e){return null}
  }
  var map=new Image(), map2=new Image(), pending=2;
  map.onload=map.onerror=map2.onload=map2.onerror=function(e){
    if(e&&e.type==='load')this._ok=true;
    if(--pending)return;
    if(!map._ok)return;                                          // 第一張讀不到就保留原圖
    var w=map.naturalWidth,h=map.naturalHeight;
    var src=pixels(map); if(!src)return;
    var src2=map2._ok&&map2.naturalWidth===w&&map2.naturalHeight===h?pixels(map2):null;
    var n=0,i;
    for(i=0;i<w*h;i++)if(src[i*4+2])n++;
    if(!n)return;
    idx=new Uint32Array(n);time=new Float32Array(n);alpha=new Uint8Array(n);time2=new Float32Array(n);alpha1=new Uint8Array(n);
    for(i=0,n=0;i<w*h;i++){var a=src[i*4+2];if(a){var p=i*4;idx[n]=i;time[n]=(src[p]*256+src[p+1])/65535;alpha[n]=a;
      if(src2){time2[n]=(src2[p]*256+src2[p+1])/65535;alpha1[n]=Math.min(a,src2[p+2])}else{time2[n]=time[n];alpha1[n]=a}
      n++}}
    canvas.width=w;canvas.height=h;out=ctx.createImageData(w,h);
    paintColor(); render(0);
    wrap.classList.add('ready');
    if(reduce.matches){finish();return}
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){io.disconnect();play()}});
    },{threshold:.6});
    io.observe(wrap);
  };
  map.src='assets/signature_map.png?v=20261116b'; map2.src='assets/signature_map2.png?v=20261116b';

  wrap.addEventListener('click',function(){play()});
  // 之後的深淺色切換：顏色跟著 CSS 的文字色走
  window.addEventListener('themechange',recolor);
  if(window.matchMedia){var mq=window.matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',recolor)}
  window.__signature={play:play,recolor:recolor};
})();
