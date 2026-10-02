"use client";
import {useEffect,useRef,useState} from 'react';

// Original generative score: Archive / 96 seconds, six suspended harmonies.
// Synthesized locally; no external recordings or music services.
export default function BackgroundMusic(){
 const engine=useRef<{context:AudioContext;master:GainNode;timer:number;next:number;bar:number}|null>(null);
 const [playing,setPlaying]=useState(false),[volume,setVolume]=useState(25),[error,setError]=useState('');
 const busy=useRef(false);
 function stop(){const e=engine.current;if(e){e.master.gain.cancelScheduledValues(e.context.currentTime);e.master.gain.setTargetAtTime(0,e.context.currentTime,.15);window.clearInterval(e.timer);engine.current=null;window.setTimeout(()=>void e.context.close(),700)}setPlaying(false)}
 async function start(){
  if(busy.current)return;busy.current=true;setError('');
  let context:AudioContext|undefined;
  try{
   context=new AudioContext();await context.resume();
   const ctx=context,master=ctx.createGain(),filter=ctx.createBiquadFilter(),room=ctx.createConvolver(),wet=ctx.createGain();
   master.gain.value=0;master.connect(ctx.destination);filter.type='lowpass';filter.frequency.value=2600;filter.Q.value=.2;filter.connect(master);
   const impulse=ctx.createBuffer(2,ctx.sampleRate*4,ctx.sampleRate);let seed=91;
   for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741823.5-1)*Math.pow(1-i/data.length,3)*.3}}
   room.buffer=impulse;wet.gain.value=.3;filter.connect(room);room.connect(wet);wet.connect(master);
   const chords=[[45,52,59,64],[41,48,55,64],[48,55,62,67],[43,50,57,62],[45,52,60,67],[40,47,55,62]];
   const e={context:ctx,master,timer:0,next:ctx.currentTime+.1,bar:0};engine.current=e;
   function note(midi:number,time:number,duration:number,level:number,pad:boolean,pan:number){
    const voice=ctx.createGain(),position=ctx.createStereoPanner();position.pan.value=pan;voice.connect(position);position.connect(filter);
    voice.gain.setValueAtTime(0,time);voice.gain.linearRampToValueAtTime(level,time+(pad?3:.018));voice.gain.exponentialRampToValueAtTime(.0001,time+duration);
    const partials=pad?[1,2]:[1,2,3,4];partials.forEach((partial,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12)*partial;osc.detune.value=pad?(i?3:-3):0;gain.gain.value=pad?(i?.12:1):[1,.2,.065,.015][i];osc.connect(gain);gain.connect(voice);osc.start(time);osc.stop(time+duration+.1);osc.onended=()=>{osc.disconnect();gain.disconnect()}});
    window.setTimeout(()=>{voice.disconnect();position.disconnect()},Math.max(0,(time+duration-ctx.currentTime+.5)*1000));
   }
   function schedule(){while(e.next<ctx.currentTime+2){const chord=chords[e.bar%chords.length],t=e.next;chord.forEach((m,i)=>note(m,t,20,.022,true,(i-1.5)*.22));const melody=[chord[2]+12,chord[3]+12,chord[1]+12,chord[2]+12];[1,5.5,9,13].forEach((offset,i)=>note(melody[(i+e.bar)%4],t+offset,7,.07,false,i%2?.25:-.25));e.next+=16;e.bar++}}
   schedule();e.timer=window.setInterval(schedule,500);master.gain.setTargetAtTime(volume/100,ctx.currentTime,1.4);setPlaying(true);
  }catch{if(context)void context.close();engine.current=null;setPlaying(false);setError('暂时无法播放，请再试一次')}finally{busy.current=false}
 }
 useEffect(()=>{const pauseForVideo=(event:Event)=>{if(event.target instanceof HTMLVideoElement)stop()};document.addEventListener('play',pauseForVideo,true);return()=>{document.removeEventListener('play',pauseForVideo,true);const e=engine.current;if(e){window.clearInterval(e.timer);void e.context.close()}}},[]);
 useEffect(()=>{const e=engine.current;if(e)e.master.gain.setTargetAtTime(volume/100,e.context.currentTime,.2)},[volume]);
 return <div className="background-music" role="region" aria-label="背景音乐"><button type="button" aria-label={playing?'暂停背景音乐':'播放背景音乐'} aria-pressed={playing} onClick={()=>playing?stop():void start()}><span aria-hidden="true">{playing?'Ⅱ':'▷'}</span> {playing?'静谧档案 · 播放中':'背景音乐'}</button><label><span className="music-volume-label">音量</span><input aria-label="背景音乐音量" type="range" min="0" max="60" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>{error&&<span role="status">{error}</span>}</div>
}
