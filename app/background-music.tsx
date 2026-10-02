"use client";
import {useEffect,useRef,useState} from 'react';

// Original generative score: Air / 200 seconds, ten composed phrases with breathing spaces.
// Synthesized locally; no external recordings or music services.
export default function BackgroundMusic(){
 const engine=useRef<{context:AudioContext;master:GainNode;timer:number;next:number;bar:number}|null>(null);
 const [playing,setPlaying]=useState(false),[volume,setVolume]=useState(22),[error,setError]=useState('');
 const busy=useRef(false);
 function stop(){const e=engine.current;if(e){e.master.gain.cancelScheduledValues(e.context.currentTime);e.master.gain.setTargetAtTime(0,e.context.currentTime,.15);window.clearInterval(e.timer);engine.current=null;window.setTimeout(()=>void e.context.close(),700)}setPlaying(false)}
 async function start(){
  if(busy.current)return;busy.current=true;setError('');
  let context:AudioContext|undefined;
  try{
   context=new AudioContext();await context.resume();
   const ctx=context,master=ctx.createGain(),filter=ctx.createBiquadFilter(),room=ctx.createConvolver(),wet=ctx.createGain();
   master.gain.value=0;master.connect(ctx.destination);filter.type='lowpass';filter.frequency.value=3800;filter.Q.value=.2;filter.connect(master);
   const impulse=ctx.createBuffer(2,ctx.sampleRate*7,ctx.sampleRate);let seed=91;
   for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741823.5-1)*Math.pow(1-i/data.length,2.4)*.22}}
   room.buffer=impulse;wet.gain.value=.65;filter.connect(room);room.connect(wet);wet.connect(master);
   // D-major / B-minor colours, with a different contour and rhythm in each phrase.
   const chords=[[50,57,64,66],[47,54,61,66],[43,50,57,62],[45,52,59,64],[50,57,61,66],[47,54,62,69],[43,50,59,66],[52,59,66,69],[45,52,62,66],[50,57,64,69]];
   const phrases:[number,number,number,number][][]=[
    [[1,78,8,.052],[4.7,81,9,.041],[7.1,76,8,.046],[11.6,74,10,.035]],
    [[.6,73,7,.039],[3.4,78,10,.048],[8.8,81,8,.037],[11,78,9,.031],[14.8,76,10,.026]],
    [[2.4,74,9,.045],[6,78,9,.039],[9.2,83,11,.034],[15,81,10,.025]],
    [[.8,81,9,.041],[4.1,76,9,.043],[7.8,73,8,.032],[10.2,71,10,.03]],
    [[1.5,74,10,.045],[5.4,76,8,.033],[7.3,78,10,.045],[12.7,85,12,.027],[16.5,81,9,.021]],
    [[2.2,83,10,.041],[6.5,81,8,.036],[9.4,78,10,.042],[15.1,74,10,.027]],
    [[1,78,10,.033],[5,74,10,.039],[10.8,71,12,.032]],
    [[2,76,10,.04],[6.2,78,9,.033],[8.6,83,11,.031],[14.3,81,10,.025]],
    [[.9,78,9,.036],[4.5,76,9,.04],[8.3,74,10,.032],[13.6,73,11,.024]],
    [[1.8,74,13,.044],[7.4,81,12,.028],[12.8,78,13,.023]],
   ];
   const echo=ctx.createDelay(3),echoGain=ctx.createGain();echo.delayTime.value=1.65;echoGain.gain.value=.16;filter.connect(echo);echo.connect(echoGain);echoGain.connect(room);
   const e={context:ctx,master,timer:0,next:ctx.currentTime+.1,bar:0};engine.current=e;
   function note(midi:number,time:number,duration:number,level:number,pad:boolean,pan:number){
    const voice=ctx.createGain(),position=ctx.createStereoPanner();position.pan.value=pan;voice.connect(position);position.connect(filter);
    voice.gain.setValueAtTime(0,time);voice.gain.linearRampToValueAtTime(level,time+(pad?5:.09));voice.gain.exponentialRampToValueAtTime(.0001,time+duration);
    const partials=pad?[1,1.0018,2]:[1,2,3,4];partials.forEach((partial,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12)*partial;osc.detune.value=pad?(i?3:-3):0;gain.gain.value=pad?[.65,.35,.035][i]:[1,.09,.025,.008][i];osc.connect(gain);gain.connect(voice);osc.start(time);osc.stop(time+duration+.1);osc.onended=()=>{osc.disconnect();gain.disconnect()}});
    window.setTimeout(()=>{voice.disconnect();position.disconnect()},Math.max(0,(time+duration-ctx.currentTime+.5)*1000));
   }
   function schedule(){while(e.next<ctx.currentTime+2){
    const phrase=e.bar%phrases.length,chord=chords[phrase],t=e.next;
    chord.forEach((m,i)=>note(m,t+i*.42,27,.012,true,(i-1.5)*.3));
    phrases[phrase].forEach(([offset,midi,duration,level],i)=>note(midi,t+offset,duration,level,false,Math.sin(i*1.7+phrase)*.38));
    // A distant answering voice appears only at two peaks of the long arc.
    if(phrase===2||phrase===7)note(phrases[phrase][2][1]+12,t+12.2,13,.011,false,-.5);
    e.next+=20;e.bar++;
   }}
   schedule();e.timer=window.setInterval(schedule,500);master.gain.setTargetAtTime(volume/100,ctx.currentTime,1.4);setPlaying(true);
  }catch{if(context)void context.close();engine.current=null;setPlaying(false);setError('暂时无法播放，请再试一次')}finally{busy.current=false}
 }
 useEffect(()=>{const pauseForVideo=(event:Event)=>{if(event.target instanceof HTMLVideoElement)stop()};document.addEventListener('play',pauseForVideo,true);return()=>{document.removeEventListener('play',pauseForVideo,true);const e=engine.current;if(e){window.clearInterval(e.timer);void e.context.close()}}},[]);
 useEffect(()=>{const e=engine.current;if(e)e.master.gain.setTargetAtTime(volume/100,e.context.currentTime,.2)},[volume]);
 return <div className="background-music" role="region" aria-label="背景音乐"><button type="button" aria-label={playing?'暂停背景音乐':'播放背景音乐'} aria-pressed={playing} onClick={()=>playing?stop():void start()}><span aria-hidden="true">{playing?'Ⅱ':'▷'}</span> {playing?'浮光 · 播放中':'背景音乐'}</button><label><span className="music-volume-label">音量</span><input aria-label="背景音乐音量" type="range" min="0" max="60" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>{error&&<span role="status">{error}</span>}</div>
}
