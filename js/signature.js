/* 簽名手寫動畫。
   assets/signature_map.png 記錄每個墨跡像素「何時被寫到」（R、G = 16 位元時間，B = 墨跡濃度），
   由 _source/sig_v2/ 的腳本依簽名圖片與手排筆順產生。這裡只負責照時間把墨跡顯示出來。
   捲到時寫一次；點一下或按 Enter 重寫；「減少動態效果」時直接顯示完成的簽名；載入失敗則保留原本的圖片。 */
(function(){
  var wrap=document.getElementById('sig');
  if(!wrap||!wrap.getContext&&!document.createElement('canvas').getContext)return;
  var canvas=wrap.querySelector('canvas'), ctx=canvas.getContext('2d');
  var DURATION=3000;          // 書寫全長（毫秒），與時間圖的 3 秒一致
  var SOFT=0.012;             // 筆尖的柔邊（佔全長的比例）
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var idx=null, time=null, alpha=null, img=null, out=null, raf=0, playing=false, done=false;

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
      var u=(T-time[k])/SOFT;
      d[idx[k]*4+3]=u<=0?0:(u>=1?alpha[k]:alpha[k]*u);
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

  var map=new Image();
  map.onload=function(){
    var w=map.naturalWidth,h=map.naturalHeight,off=document.createElement('canvas');
    off.width=w;off.height=h;
    var o=off.getContext('2d',{willReadFrequently:true}); o.drawImage(map,0,0);
    var src;
    try{src=o.getImageData(0,0,w,h).data}catch(e){return}   // 讀不到像素就保留原圖
    var n=0,i;
    for(i=0;i<w*h;i++)if(src[i*4+2])n++;
    if(!n)return;
    idx=new Uint32Array(n);time=new Float32Array(n);alpha=new Uint8Array(n);
    for(i=0,n=0;i<w*h;i++){var a=src[i*4+2];if(a){idx[n]=i;time[n]=(src[i*4]*256+src[i*4+1])/65535;alpha[n]=a;n++}}
    canvas.width=w;canvas.height=h;out=ctx.createImageData(w,h);
    paintColor(); render(0);
    wrap.classList.add('ready');
    if(reduce.matches){finish();return}
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){io.disconnect();play()}});
    },{threshold:.6});
    io.observe(wrap);
  };
  map.src='assets/signature_map.png';

  wrap.addEventListener('click',function(){play()});
  // 之後的深淺色切換：顏色跟著 CSS 的文字色走
  window.addEventListener('themechange',recolor);
  if(window.matchMedia){var mq=window.matchMedia('(prefers-color-scheme: dark)');if(mq.addEventListener)mq.addEventListener('change',recolor)}
  window.__signature={play:play,recolor:recolor};
})();
