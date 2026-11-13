import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';

export function useReducedMotion(){
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);
 return reduced;
}

// Only animate newly encountered content. Transform-free fades on Paper preserve its drag geometry.
export function ReadingMotion({project}:{project:number|null}){
 const reduced=useReducedMotion();
 useEffect(()=>{
  if(project===null||reduced)return;
  const root=document.querySelector('.project-view');if(!root)return;
  const seen=new WeakSet<Element>();const animations=new Set<Animation>();
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   const el=entry.target;observer.unobserve(el);
   const paper=el.classList.contains('paper');
   const animation=el.animate(paper?[{opacity:.35},{opacity:1}]:[{opacity:.2,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:650,easing:'cubic-bezier(.22,.7,.25,1)'});
   animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));
  }),{threshold:.01});
  const scan=()=>root.querySelectorAll('.dossier-heading,.dossier-copy>*,.clipped-photo,.paper,.physical-book,.dossier-film,.castaway-cv,.motion-study').forEach(el=>{if(!seen.has(el)){seen.add(el);observer.observe(el)}});
  scan();const mutation=new MutationObserver(scan);mutation.observe(root,{childList:true,subtree:true});
  return()=>{observer.disconnect();mutation.disconnect();animations.forEach(a=>a.cancel())};
 },[project,reduced]);
 return null;
}

let activeTransition:{skipTransition:()=>void;finished:Promise<void>}|undefined;
function clearTransitionCovers(){
 document.querySelectorAll('[data-transition-cover]').forEach(el=>{(el as HTMLElement).style.removeProperty('view-transition-name');el.removeAttribute('data-transition-cover')});
}
function markCover(el:Element|null|undefined){
 if(el){(el as HTMLElement).style.setProperty('view-transition-name','archive-cover');el.setAttribute('data-transition-cover','')}
}
function coverTransition(source:Element|null|undefined,target:()=>Element|null,update:()=>void,done?:()=>void){
 activeTransition?.skipTransition();
 clearTransitionCovers();
 const doc=document as Document & {startViewTransition?:(update:()=>void)=>{skipTransition:()=>void;finished:Promise<void>}};
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!doc.startViewTransition){flushSync(update);done?.();return}
 markCover(source);
 const transition=doc.startViewTransition(()=>{
  flushSync(update);
  markCover(target());
 });
 activeTransition=transition;
 transition.finished.catch(()=>{}).finally(()=>{if(activeTransition!==transition)return;activeTransition=undefined;clearTransitionCovers();done?.()});
}
export function openWithMotion(index:number,cover:string,update:()=>void){
 const source=document.querySelector<SVGElement>(`[data-file-number="${94+index}"] image`)||Array.from(document.querySelectorAll<HTMLImageElement>('.research-sidebar img')).find(img=>img.getAttribute('src')===cover);
 coverTransition(source,()=>document.querySelector('.dossier-intro figure img'),update);
}
export function returnWithMotion(index:number,update:()=>void,settled:()=>void){
 const visible=(el:Element)=>{const r=el.getBoundingClientRect();return r.width>0&&r.bottom>30&&r.top<innerHeight};
 const source=Array.from(document.querySelectorAll('.dossier-intro figure img,.paper img,.book-page img')).find(visible);
 coverTransition(source,()=>document.querySelector(`[data-file-number="${94+index}"] .archive-return-cover`),update,()=>{
  const target=document.querySelector(`[data-file-number="${94+index}"] .archive-return-cover`);
  if(!target||window.matchMedia('(prefers-reduced-motion: reduce)').matches){settled();return}
  target.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 18px'}],{duration:280,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{}).finally(settled);
 });
}

// Event-driven parallax uses a separate layer from the folder and drag transforms.
export function MaterialMotion({project}:{project:number|null}){
 const reduced=useReducedMotion();
 useEffect(()=>{
  if(reduced||!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const surface=project===null?document.querySelector<HTMLElement>('.archive-surface'):null;
  let frame=0,lastX=0,lastY=0,curled:HTMLElement|null=null;
  const clearCurl=()=>{curled?.removeAttribute('data-curl');curled=null};
  const reset=()=>{cancelAnimationFrame(frame);frame=0;surface?.style.setProperty('--drift-x','0px');surface?.style.setProperty('--drift-y','0px');clearCurl()};
  const draw=()=>{
   frame=0;
   if(surface){const r=surface.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(lastX-r.left)/r.width*2-1));const y=Math.max(-1,Math.min(1,(lastY-r.top)/r.height*2-1));surface.style.setProperty('--drift-x',`${x*5}px`);surface.style.setProperty('--drift-y',`${y*5}px`)}
  };
  const move=(event:globalThis.PointerEvent)=>{
   if(event.pointerType!=='mouse'||event.buttons){clearCurl();return}
   const target=event.target as Element;
   if(surface){if(surface.contains(target)){lastX=event.clientX;lastY=event.clientY;if(!frame)frame=requestAnimationFrame(draw)}else reset();return}
   const paper=target.closest<HTMLElement>('.book-page,.direct-paper');
   if(!paper||paper.hasAttribute('data-handling')||paper.closest('.turning-leaf')){clearCurl();return}
   const r=paper.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;
   const edge=Math.min(64,r.width*.2,r.height*.2);
   const horizontal=x<edge?'w':x>r.width-edge?'e':'';
   const vertical=y<edge?'n':y>r.height-edge?'s':'';
   const innerSpine=paper.classList.contains('left')&&horizontal==='e'||paper.classList.contains('right')&&horizontal==='w';
   if(!horizontal||!vertical||innerSpine){clearCurl();return}
   if(curled!==paper)clearCurl();curled=paper;paper.dataset.curl=vertical+horizontal;
  };
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerdown',clearCurl,{passive:true});document.addEventListener('pointerleave',reset);window.addEventListener('blur',reset);
  return()=>{reset();document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',clearCurl);document.removeEventListener('pointerleave',reset);window.removeEventListener('blur',reset)};
 },[project,reduced]);
 return null;
}

const lightFrames=[
 {src:'/rippleglow/state-01.jpg',label:'紫色 · 局部光场'},
 {src:'/rippleglow/state-03.jpg',label:'蓝色 · 线条流动'},
 {src:'/rippleglow/state-05.jpg',label:'绿色 · 涡旋'},
 {src:'/rippleglow/state-07.jpg',label:'绿色 · 上缘'},
 {src:'/rippleglow/state-09.jpg',label:'黄色 · 左上区域'},
];
const moonLabels=['伸展','初始弯曲','局部卷曲','紧凑卷曲','释放','向前转移','再次伸展'];
export function ProjectStudy({kind}:{kind:'moon'|'light'}){
 const reduced=useReducedMotion();const host=useRef<HTMLElement>(null);
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[visible,setVisible]=useState(false),[foreground,setForeground]=useState(()=>typeof document==='undefined'||!document.hidden);
 const moon=kind==='moon',count=moon?moonLabels.length:lightFrames.length;
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.15});if(host.current)observer.observe(host.current);const update=()=>setForeground(!document.hidden);document.addEventListener('visibilitychange',update);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update)}},[]);
 useEffect(()=>{if(reduced||paused||!visible||!foreground)return;const timer=window.setInterval(()=>setIndex(i=>(i+1)%count),moon?2400:5000);return()=>clearInterval(timer)},[reduced,paused,visible,foreground,moon,count]);
 const select=(i:number)=>{setPaused(true);setIndex(i)};
 return <section ref={host} className={`motion-study ${moon?'moon-study':'light-study'}`} aria-label={moon?'月链七步变形演示':'RippleGlow 光色实拍演示'}>
  <div className="motion-study-heading"><span>{moon?'形态的循环 / MOTION SEQUENCE':'光的变化 / A FIELD OF LIGHT'}</span>{!reduced&&<button onClick={()=>setPaused(v=>!v)} aria-pressed={paused}>{paused?'播放动态':'暂停动态'}</button>}</div>
  <div className="motion-study-stage">
   {moon?moonLabels.map((label,i)=><svg key={label} className={index===i?'study-frame is-current':'study-frame'} viewBox={`${15+i*145} 540 155 145`} role="img" aria-label={label} aria-hidden={index!==i}><defs><clipPath id={`moon-step-${i}`}><rect x={15+i*145} y="540" width="155" height="145"/></clipPath></defs><image href="/moonlink/image-30.jpg" width="1055" height="1491" clipPath={`url(#moon-step-${i})`}/></svg>):lightFrames.map((frame,i)=><img key={frame.src} className={index===i?'study-frame is-current':'study-frame'} src={frame.src} alt={frame.label} aria-hidden={index!==i} loading="lazy" decoding="async"/>)}
  </div>
  <div className="motion-study-controls" aria-label="选择展示步骤">{Array.from({length:count},(_,i)=><button key={i} aria-label={moon?`第 ${i+1} 步：${moonLabels[i]}`:lightFrames[i].label} aria-pressed={index===i} onClick={()=>select(i)}>{String(i+1).padStart(2,'0')}</button>)}<span>{moon?moonLabels[index]:lightFrames[index].label}</span></div>
  <p className="motion-study-note">{moon?'来自小册子的七步结构图 · 设计动作示意':'实拍照片交替展示 · 光色记录'}</p>
 </section>;
}
