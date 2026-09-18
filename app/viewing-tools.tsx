"use client";
import {useEffect,useRef,useState} from 'react';

export default function ViewingTools(){
 const [pageZoom,setPageZoom]=useState(100);
 const [photo,setPhoto]=useState<{src:string;title:string;original:string}|null>(null);
 const [scale,setScale]=useState(1),[position,setPosition]=useState({x:0,y:0});
 const points=useRef(new Map<number,{x:number;y:number}>());
 const close=useRef<HTMLButtonElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 const limit=(n:number)=>Math.min(8,Math.max(.15,n));
 useEffect(()=>{const main=document.querySelector('main');if(main)main.style.setProperty('zoom',String(pageZoom/100));return()=>{main?.style.removeProperty('zoom')}},[pageZoom]);
 useEffect(()=>{
  function open(e:MouseEvent){
   const clicked=e.target as Element;
   const target=e.type==='dblclick'?(clicked.closest('.book-page')?.querySelector('img')||clicked):clicked;
   if(!(target instanceof HTMLImageElement)||target.closest('.image-inspector'))return;
   const book=target.closest('.book-spread');
   if(e.type==='click'&&(book||target.closest('button')||!target.closest('.project-view')))return;
   e.preventDefault();e.stopPropagation();
   previousFocus.current=document.activeElement as HTMLElement;
   const link=target.closest('a');
   setPhoto({src:target.currentSrc||target.src,title:target.alt||'作品图片',original:link?.href||target.src});
   setScale(1);setPosition({x:0,y:0});
  }
  document.addEventListener('click',open,true);document.addEventListener('dblclick',open,true);
  return()=>{document.removeEventListener('click',open,true);document.removeEventListener('dblclick',open,true)};
 },[]);
 useEffect(()=>{
  if(!photo)return;
  close.current?.focus();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  function key(e:KeyboardEvent){
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();setPhoto(null)}
   if(e.key==='Tab'){
    const buttons=Array.from(document.querySelectorAll<HTMLElement>('.image-inspector button,.image-inspector a'));
    const index=buttons.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();
   }
  }
  document.addEventListener('keydown',key,true);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key,true);points.current.clear();previousFocus.current?.focus()};
 },[photo]);
 return <><div className="page-zoom-controls" aria-label="页面缩放">
 <span>页面</span><button aria-label="缩小整个页面" disabled={pageZoom<=50} onClick={()=>setPageZoom(v=>Math.max(50,v-10))}>−</button>
 <button aria-label="恢复页面原始大小" onClick={()=>setPageZoom(100)}>{pageZoom}%</button>
 <button aria-label="放大整个页面" disabled={pageZoom>=200} onClick={()=>setPageZoom(v=>Math.min(200,v+10))}>＋</button>
 </div>{photo&&<div className="image-inspector" role="dialog" aria-modal="true" aria-label="图片查看器">
 <div className="inspector-toolbar"><span>{photo.title}</span><button aria-label="缩小图片" onClick={()=>setScale(s=>limit(s/1.2))}>−</button><button aria-label="重置图片位置与大小" onClick={()=>{setScale(1);setPosition({x:0,y:0})}}>{Math.round(scale*100)}% · 复位</button><button aria-label="放大图片" onClick={()=>setScale(s=>limit(s*1.2))}>＋</button><a href={photo.original} target="_blank" rel="noreferrer">原文件 ↗</a><button ref={close} aria-label="关闭图片查看器" onClick={()=>setPhoto(null)}>关闭 ×</button></div>
 <div className="inspector-canvas" onWheel={e=>{setScale(s=>limit(s*Math.exp(-e.deltaY*.002)))}}
 onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY})}}
 onPointerMove={e=>{const prev=points.current.get(e.pointerId);if(!prev)return;const other=Array.from(points.current.entries()).find(([id])=>id!==e.pointerId)?.[1];if(other){const before=Math.hypot(prev.x-other.x,prev.y-other.y);const after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>0)setScale(s=>limit(s*after/before))}else setPosition(p=>({x:p.x+e.clientX-prev.x,y:p.y+e.clientY-prev.y}));points.current.set(e.pointerId,{x:e.clientX,y:e.clientY})}}
 onPointerUp={e=>points.current.delete(e.pointerId)} onPointerCancel={e=>points.current.delete(e.pointerId)}>
 <img src={photo.src} alt={photo.title} draggable={false} style={{transform:`translate(${position.x}px,${position.y}px) scale(${scale})`}}/>
 </div><p className="inspector-help">拖拽移动 · 滚轮 / 双指缩放 · 复位恢复 · Esc 关闭</p></div>}</>;
}
