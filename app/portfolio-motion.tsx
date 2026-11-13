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
export function openWithMotion(index:number,cover:string,update:()=>void){
 activeTransition?.skipTransition();
 const doc=document as Document & {startViewTransition?:(update:()=>void)=>{skipTransition:()=>void;finished:Promise<void>}};
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!doc.startViewTransition){update();return}
 document.querySelectorAll('[data-transition-cover]').forEach(el=>{(el as HTMLElement).style.removeProperty('view-transition-name');el.removeAttribute('data-transition-cover')});
 const source=document.querySelector<SVGElement>(`[data-file-number="${94+index}"] image`)||Array.from(document.querySelectorAll<HTMLImageElement>('.research-sidebar img')).find(img=>img.getAttribute('src')===cover);
 if(source){source.style.setProperty('view-transition-name','archive-cover');source.setAttribute('data-transition-cover','')}
 const transition=doc.startViewTransition(()=>{
  flushSync(update);
  const target=document.querySelector<HTMLElement>('.dossier-intro figure img');
  if(target){target.style.setProperty('view-transition-name','archive-cover');target.setAttribute('data-transition-cover','')}
 });
 activeTransition=transition;
 transition.finished.catch(()=>{}).finally(()=>{if(activeTransition!==transition)return;activeTransition=undefined;document.querySelectorAll('[data-transition-cover]').forEach(el=>{(el as HTMLElement).style.removeProperty('view-transition-name');el.removeAttribute('data-transition-cover')})});
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
