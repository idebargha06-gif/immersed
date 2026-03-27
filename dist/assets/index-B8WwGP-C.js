import{initializeApp as Nt}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import{getAuth as Et,GoogleAuthProvider as Ft,signInWithPopup as Ot,signOut as Ut,onAuthStateChanged as Ht}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";import{getFirestore as Gt,doc as B,getDoc as J,setDoc as N,getDocs as yt,collection as I,query as W,orderBy as q,limit as z,deleteDoc as Vt,addDoc as rt,onSnapshot as F}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function o(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=o(n);fetch(n.href,i)}})();const jt={apiKey:"AIzaSyB9wLp_Z2PzCQgtdTjwoQZGw2tSC8tgNNY",authDomain:"focus-app-3c749.firebaseapp.com",projectId:"focus-app-3c749",storageBucket:"focus-app-3c749.appspot.com",messagingSenderId:"583246239661",appId:"1:583246239661:web:7117c22d10842171ff7324"},vt=Nt(jt),X=Et(vt),P=Gt(vt),Wt=new Ft,qt="FocusFlow",V=60,zt=88,lt=2*Math.PI*zt,Jt=120*1e3,Yt=30*1e3,Kt=300*1e3,Qt=300*1e3,Zt=250,Xt=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],te="5su9hgizJVQ4yMHm9zHkdLvYw293",ee=20,oe=[{label:"5m",seconds:300},{label:"10m",seconds:600},{label:"25m",seconds:1500},{label:"1h",seconds:3600},{label:"2h",seconds:7200},{label:"3h",seconds:10800}],j={normal:{id:"normal",label:"Study",penalty:20,description:"Balanced scoring for everyday focus blocks."},deep:{id:"deep",label:"Deep",penalty:35,description:"Stricter distraction penalties for high-intent work."},sprint:{id:"sprint",label:"Sprint",penalty:10,description:"Lighter penalties for fast, short bursts of work."}},dt=[{name:"Beginner",min:0,next:60},{name:"Deep Worker",min:60,next:300},{name:"Flow State",min:300,next:600},{name:"Legend",min:600,next:Number.POSITIVE_INFINITY}],ae=[{id:"first_session",label:"First Session",check:t=>t.totalSessions>=1},{id:"five_sessions",label:"Getting Started",check:t=>t.totalSessions>=5},{id:"ten_sessions",label:"Consistent",check:t=>t.totalSessions>=10},{id:"twenty_five_sessions",label:"Focused Mind",check:t=>t.totalSessions>=25},{id:"fifty_sessions",label:"Deep Work Master",check:t=>t.totalSessions>=50},{id:"clean_focus",label:"Clean Focus",check:t=>t.lastDistractions===0&&t.totalSessions>=1},{id:"streak_three",label:"Nice Start",check:t=>t.streak>=3},{id:"streak_seven",label:"Seven Day Streak",check:t=>t.streak>=7},{id:"streak_fourteen",label:"Strong Habit",check:t=>t.streak>=14},{id:"streak_thirty",label:"Elite Focus",check:t=>t.streak>=30},{id:"hour_focused",label:"One Hour Focused",check:t=>t.totalMinutes>=60},{id:"night_owl",label:"Night Owl",check:t=>t.nightSession===!0},{id:"legend",label:"Legend",check:t=>t.totalMinutes>=600}],ct=["Deep work is the ability to focus without distraction. - Cal Newport","Either you run the day or the day runs you. - Jim Rohn","Focus is deciding what not to do. - John Carmack","Do not watch the clock. Do what it does. Keep going. - Sam Levenson","A little progress each day adds up to big results. - Satya Nani","Progress grows out of consistency. - FocusFlow"];function tt(t=""){const e=ct.filter(o=>o!==t);return e.length?e[Math.floor(Math.random()*e.length)]:ct[0]}const ne={clean:["Exceptional focus. That session stayed clean from start to finish.","Locked in. No distractions, no drift, just deliberate work.","That was a sharp session. Keep repeating that rhythm."],steady:["Solid work. A few slips, but you recovered well.","Good momentum. Tighten the edges and the next one gets even better.","You stayed in the work more often than not. That still counts."],rough:["The session felt noisy. Try a shorter block and reset cleanly.","Attention drifted. Reduce tabs, shorten the timer, and go again.","Not your cleanest round, but it still created signal for the next one."]};function U(t=new Date){const e=t instanceof Date?t:new Date(t);if(Number.isNaN(e.getTime()))return null;const o=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${o}-${a}-${n}`}function se(t=new Date){const e=t instanceof Date?t:new Date(t);return Number.isNaN(e.getTime())?"":e.toDateString()}function wt(t){if(!t||typeof t!="string")return null;if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const e=new Date(t);return Number.isNaN(e.getTime())?null:U(e)}function St(t=[]){return[...new Set(t.map(wt).filter(Boolean))].sort()}function ie(t){const e=new Date;return e.setDate(e.getDate()+t),U(e)}function re(){return U(new Date)}function _t(t){const e=t instanceof Date?t:new Date(t);return Number.isNaN(e.getTime())?"":e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}function Y(t=new Date){const e=t instanceof Date?t:new Date(t);return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}`}function et(t){if(!/^\d{4}-\d{2}$/.test(t)){const a=new Date;return{year:a.getFullYear(),month:a.getMonth()}}const[e,o]=t.split("-").map(Number);return{year:e,month:o-1}}function le(t,e){const{year:o,month:a}=et(t),n=new Date(o,a+e,1);return Y(n)}function ut(t,e){const{year:o,month:a}=et(t);return new Date(o,a,1).toLocaleDateString(e,{month:"long",year:"numeric"})}function de(t,e){const{year:o,month:a}=et(t),n=new Date(o,a,1),i=new Date(o,a+1,0).getDate(),d=n.getDay(),b=[];for(let g=0;g<d;g+=1)b.push({type:"empty",id:`empty-${t}-${g}`});for(let g=1;g<=i;g+=1){const _=new Date(o,a,g);b.push({type:"day",date:_,iso:U(_),dayNumber:g,weekdayLabel:_.toLocaleDateString(e,{weekday:"short"})})}return b}function ce(t,e=0,o=1){const a=j[t]||j.normal,n=Math.floor(Math.max(0,e)/5),i=o>3?2:1;return(a.penalty+n)*i}function ue(t,e){return Math.max(0,Math.floor(t)-Math.floor(e))}function Lt(t,e){return t<=0?100:Math.max(0,Math.round((t-e)/t*100))}function kt(t){return[...dt].reverse().find(e=>t>=e.min)||dt[0]}function Mt(t){return ae.filter(e=>e.check(t)).map(e=>e.id)}function me(t){return t===0?"clean":t<=3?"steady":"rough"}const E=new Map;function pe(){return{totalScore:0,totalSessions:0,totalMinutes:0,streak:0,longestStreak:0,weekData:[0,0,0,0,0,0,0],todayMinutes:0,lastDistractions:0,lastSessionDay:null,nightSession:!1,badges:[],activityDays:[]}}function Ct(t={}){const e=pe(),o=St([...Array.isArray(t.activityDays)?t.activityDays:[],...Array.isArray(t.sessionDates)?t.sessionDates:[]]),a=wt(t.lastSessionDay||t.lastSessionDate),n=U(new Date);return{totalScore:t.total||0,totalSessions:t.totalSessions||0,totalMinutes:t.totalMinutes||0,streak:t.streak||0,longestStreak:t.longestStreak||0,weekData:Array.isArray(t.weekData)&&t.weekData.length===7?t.weekData:e.weekData,todayMinutes:a===n&&t.todayMinutes||0,lastDistractions:t.lastDistractions||0,lastSessionDay:a,nightSession:t.nightSession||!1,badges:Array.isArray(t.badges)?t.badges:[],activityDays:o}}function ge(t){const e=t.data();return{id:t.id,goal:e.goal||"Untitled session",dateLabel:e.date||_t(e.timestamp||Date.now()),timeSpent:e.timeSpent||0,distractions:e.distractions||0,score:e.score||0,penaltyTotal:e.penaltyTotal||0,focusPercentage:e.focusPercentage??100,sessionMode:e.mode||"normal",createdAt:e.timestamp||Date.now()}}function Tt(t){const e=t.data();return{id:t.id,uid:e.uid||t.id,name:e.name||"Anonymous",photoURL:e.photoURL||e.avatar||"",active:e.active!==!1,joinedAt:e.joinedAt||0,lastSeenAt:e.lastSeenAt||0,focusing:!!e.focusing,sessionStarted:e.sessionStarted||0,distractedAt:e.distractedAt||0,distractionCount:e.distractionCount||0,awayDuration:e.awayDuration||0,leftAt:e.leftAt||0}}function he(t){return Ht(X,t)}function be(){return Ot(X,Wt)}function fe(){return Ut(X)}function ye(t){const e=W(I(P,"users"),q("total","desc"),z(5));return F(e,o=>{const a=o.docs.map((n,i)=>({id:n.id,rank:i+1,name:n.data().name||"Anonymous",score:n.data().total||0,photoURL:n.data().photoURL||""}));t(a)})}async function ve(){const t=await yt(I(P,"users"));let e=0,o=0;return t.forEach(a=>{e+=a.data().totalMinutes||0,o+=a.data().totalSessions||0}),{totalMinutes:e,totalSessions:o,totalUsers:t.size}}function we(t){const e=W(I(P,"users"),q("total","desc"),z(10));return F(e,o=>{const a=o.docs.map((n,i)=>({id:n.id,rank:i+1,name:n.data().name||"Anonymous",score:n.data().total||0,photoURL:n.data().photoURL||""}));t(a)})}function Se(t,e){const o=W(I(P,"rooms",t,"scores"),q("value","desc"),z(10));return F(o,a=>{const n=a.docs.map((i,d)=>({id:i.id,rank:d+1,name:i.data().name||"Anonymous",uid:i.data().uid||"",score:i.data().value||0,photoURL:i.data().photoURL||""}));e(n)})}function _e(t,e){return F(I(P,"rooms",t,"presence"),o=>{const a=Date.now(),n=o.docs.map(Tt).filter(i=>i.active&&!i.leftAt&&a-i.lastSeenAt<=Jt).sort((i,d)=>i.name.localeCompare(d.name));e(n)})}function Le(t,e){return F(I(P,"rooms",t,"presence"),o=>{const a=o.docs.map(Tt).sort((n,i)=>(i.joinedAt||0)-(n.joinedAt||0));e(a)})}async function ke({roomId:t,user:e}){const o=B(P,"rooms",t),a=await J(o),n=Date.now();if(!a.exists()){const d={ownerUid:(e==null?void 0:e.uid)||"",ownerName:(e==null?void 0:e.displayName)||(e==null?void 0:e.email)||"Anonymous",createdAt:n,updatedAt:n,sessionControl:{status:"idle",revision:0,updatedAt:n}};return await N(o,d,{merge:!0}),d}const i=a.data();return!i.ownerUid&&e?(await N(o,{ownerUid:e.uid,ownerName:e.displayName||e.email||"Anonymous",updatedAt:n},{merge:!0}),{...i,ownerUid:e.uid,ownerName:e.displayName||e.email||"Anonymous"}):i}function Me(t,e){return F(B(P,"rooms",t),o=>{const a=o.exists()?o.data():{};e({ownerUid:a.ownerUid||"",ownerName:a.ownerName||"",sessionControl:a.sessionControl||null})})}async function Ce({roomId:t,user:e,control:o}){var _;const a=B(P,"rooms",t),n=await J(a),i=n.exists()?n.data():{},d=(((_=i.sessionControl)==null?void 0:_.revision)||0)+1,b=Date.now(),g={...i.sessionControl,...o,revision:d,updatedAt:b,initiatedBy:(e==null?void 0:e.uid)||(o==null?void 0:o.initiatedBy)||""};return await N(a,{ownerUid:i.ownerUid||(e==null?void 0:e.uid)||"",ownerName:i.ownerName||(e==null?void 0:e.displayName)||(e==null?void 0:e.email)||"Anonymous",updatedAt:b,sessionControl:g},{merge:!0}),g}async function Te({roomId:t,user:e}){!t||!(e!=null&&e.uid)||await N(B(P,"activeRooms",t),{name:t,lastActive:Date.now(),createdBy:e.uid,ownerName:e.displayName||e.email||"Anonymous"},{merge:!0})}function De(t){const e=W(I(P,"activeRooms"),q("lastActive","desc"),z(ee));return F(e,o=>{t(o.docs.map(a=>({id:a.id,name:a.data().name||a.id,lastActive:a.data().lastActive||0,createdBy:a.data().createdBy||""})))})}async function Ae({roomId:t,user:e}){const o=B(P,"rooms",t,"presence",e.uid),a=Date.now(),n=`${t}:${e.uid}`;return E.has(n)&&(window.clearTimeout(E.get(n)),E.delete(n)),await N(o,{uid:e.uid,name:e.displayName||e.email||"Anonymous",photoURL:e.photoURL||"",active:!0,joinedAt:a,lastSeenAt:a,focusing:!1,sessionStarted:0,distractedAt:0,distractionCount:0,awayDuration:0,leftAt:0},{merge:!0}),o}async function Re(t,e,o={}){!t||!e||await N(B(P,"rooms",t,"presence",e),{...o,lastSeenAt:o.lastSeenAt??Date.now()},{merge:!0})}async function Pe(t,e){if(!t||!e)return;const o=B(P,"rooms",t,"presence",e);await N(o,{active:!1,focusing:!1,leftAt:Date.now()},{merge:!0});const a=`${t}:${e}`;E.has(a)&&window.clearTimeout(E.get(a)),E.set(a,window.setTimeout(()=>{Vt(o).catch(()=>{}),E.delete(a)},Kt))}async function Dt(t){const e=B(P,"users",t),o=W(I(P,"users",t,"sessions"),q("timestamp","desc"),z(10)),[a,n]=await Promise.all([J(e),yt(o)]);return{stats:Ct(a.exists()?a.data():{}),history:n.docs.map(ge)}}async function xe({user:t,sessionResult:e,roomId:o}){const a=B(P,"users",t.uid),n=await J(a),i=Ct(n.exists()?n.data():{}),d=new Date,b=d.getTime(),g=U(d),_=se(d),f=ie(-1),y=Math.floor(e.timeSpent/60),C=i.lastSessionDay,D=C===g?i.streak:C===f?i.streak+1:1,w=[...i.weekData];w[d.getDay()]+=y;const v=C===g?i.todayMinutes+y:y,u=St([...i.activityDays,g]),k=d.getHours()>=23||d.getHours()<4,L={totalScore:i.totalScore+e.score,totalSessions:i.totalSessions+1,totalMinutes:i.totalMinutes+y,streak:D,longestStreak:Math.max(i.longestStreak,D),weekData:w,todayMinutes:v,lastDistractions:e.distractions,lastSessionDay:g,nightSession:k,activityDays:u};L.badges=Mt(L);const A=[rt(I(P,"users",t.uid,"sessions"),{goal:e.goal||"Untitled session",score:e.score,penaltyTotal:e.penaltyTotal||0,focusPercentage:e.focusPercentage??100,timeSpent:e.timeSpent,distractions:e.distractions,mode:e.sessionMode,timestamp:b,date:_t(d)}),N(a,{total:L.totalScore,totalSessions:L.totalSessions,totalMinutes:L.totalMinutes,streak:L.streak,longestStreak:L.longestStreak,weekData:L.weekData,todayMinutes:L.todayMinutes,lastDistractions:L.lastDistractions,lastSessionDate:_,lastSessionDay:L.lastSessionDay,nightSession:L.nightSession,badges:L.badges,name:t.displayName||t.email||"Anonymous",photoURL:t.photoURL||"",sessionDates:L.activityDays,activityDays:L.activityDays,updatedAt:b},{merge:!0})];return o&&A.push(rt(I(P,"rooms",o,"scores"),{uid:t.uid,name:t.displayName||t.email||"Anonymous",photoURL:t.photoURL||"",value:e.score,timestamp:b})),await Promise.all(A),Dt(t.uid)}const O=Object.freeze(Object.defineProperty({__proto__:null,ensureRoom:ke,fetchPublicStats:ve,loadWorkspace:Dt,removeRoomPresence:Pe,saveSession:xe,signInWithGoogle:be,signOutUser:fe,subscribeActiveRooms:De,subscribeAuth:he,subscribeGlobalLeaderboard:we,subscribeLandingLeaderboard:ye,subscribeOwnerRoomPresence:Le,subscribeRoom:Me,subscribeRoomLeaderboard:Se,subscribeRoomPresence:_e,touchActiveRoom:Te,updateRoomPresence:Re,upsertRoomPresence:Ae,upsertRoomSessionControl:Ce},Symbol.toStringTag,{value:"Module"}));function Ie({store:t,repository:e,stats:o,leaderboards:a,rooms:n,profile:i,feedback:d}){let b=null;function g(){t.setState(u=>({...u,route:{view:"app"}}))}function _(){t.setState(u=>({...u,route:{view:"landing"}}))}async function f(u){t.setState(k=>({...k,auth:{user:u,loading:!1}})),_(),await o.refreshWorkspace(u.uid),a.startGlobal(),await a.refreshPublicStats(),await n.hydrateFromUrl()}async function y(){await n.stopPresence(),i.closeProfile(),t.setState(u=>({...u,auth:{user:null,loading:!1},stats:{...u.stats,totalScore:0,totalSessions:0,totalMinutes:0,streak:0,longestStreak:0,weekData:[0,0,0,0,0,0,0],todayMinutes:0,lastDistractions:0,lastSessionDay:null,nightSession:!1,badges:[],activityDays:[]},history:[],session:{...u.session,lastResult:null,saveState:"idle"},leaderboards:{...u.leaderboards,room:[]},room:{...u.room,currentRoomId:"",participants:[],activeCount:0,ownerUid:"",ownerName:"",sessionControl:null,syncRevision:0,joinCode:""},owner:{rooms:[],selectedRoomId:"",participants:[],eventLog:[],summary:{total:0,focusing:0,distracted:0,left:0}},ui:{...u.ui,quote:"",banner:null,profileOpen:!1,ownerDashboardOpen:!1,highlightedBadgeId:""}})),_(),a.startGlobal(),await a.refreshPublicStats(),t.setState(u=>({...u,ui:{...u.ui,quote:tt()}}))}function C(){b=e.subscribeAuth(u=>{if(u){f(u).catch(()=>{d.notify({type:"error",title:"Workspace load failed",message:"Auth succeeded, but some saved data could not be loaded."})});return}y().catch(()=>{})})}async function D(){try{await e.signInWithGoogle()}catch(u){if((u==null?void 0:u.code)==="auth/popup-closed-by-user")return;d.notify({type:"error",title:"Sign-in failed",message:(u==null?void 0:u.message)||"The Google sign-in flow could not complete."})}}async function w(){if(t.getState().timer.running){d.notify({type:"warning",title:"Session still running",message:"Stop the current session before signing out."});return}await n.stopPresence(),await e.signOutUser()}function v(){b==null||b()}return{init:C,signIn:D,signOut:w,openAppRoute:g,openLandingRoute:_,destroy:v}}class Be{constructor(e){this.onStateChange=e,this.category="",this.index=0,this.audio=null,this.volume=.4,this.busy=!1,this.playToken=0}getTrackUrl(e,o){return`/sounds/${e}/${e}${o}.mp3`}getNextIndex(){const e=Math.floor(Math.random()*5)+1;return e===this.index?e%5+1:e}sync(){this.onStateChange({playing:!!this.category,trackLabel:this.category?`${this.category} ${this.index}`:""})}play(e){this.stop(!1),this.category=e,this.index=this.getNextIndex(),this.busy=!1,this.playToken+=1,this.start(this.getTrackUrl(e,this.index),this.playToken),this.sync()}start(e,o){const a=new Audio(e);a.preload="none",a.volume=this.volume,this.audio=a,a.onended=()=>{!this.category||o!==this.playToken||(this.index=this.getNextIndex(),this.start(this.getTrackUrl(this.category,this.index),o),this.sync())},a.onerror=()=>{this.busy||o!==this.playToken||(this.busy=!0,this.index=this.getNextIndex(),window.setTimeout(()=>{this.category&&o===this.playToken&&(this.start(this.getTrackUrl(this.category,this.index),o),this.sync())},250))},a.play().catch(()=>{})}stop(e=!0){this.category="",this.playToken+=1,this.audio&&(this.audio.onended=null,this.audio.onerror=null,this.audio.pause(),this.audio.src=""),this.audio=null,e&&this.sync()}setVolume(e){this.volume=e,this.audio&&(this.audio.volume=e)}playBell(){try{const e=new(window.AudioContext||window.webkitAudioContext),o=e.createOscillator(),a=e.createGain();o.connect(a),a.connect(e.destination),o.frequency.value=880,o.type="sine",a.gain.setValueAtTime(.2,e.currentTime),a.gain.exponentialRampToValueAtTime(.001,e.currentTime+1.1),o.start(e.currentTime),o.stop(e.currentTime+1.1)}catch{}}}function $e({store:t,feedback:e}){const o=new Be(({playing:b,trackLabel:g})=>{t.setState(_=>({..._,audio:{..._.audio,playing:b,trackLabel:g}}))});o.setVolume(t.getState().audio.volume/100);function a(b){const _=t.getState().audio.selectedCategory===b?"":b;if(localStorage.setItem("ff_sound",_),t.setState(f=>({...f,audio:{...f.audio,selectedCategory:_}})),!_){o.stop();return}t.getState().timer.running?o.play(_):e.notify({type:"info",title:"Sound selected",message:`${b} will start with the next session.`})}function n(b){localStorage.setItem("ff_volume",String(b)),o.setVolume(b/100),t.setState(g=>({...g,audio:{...g.audio,volume:b}}))}function i(){const b=t.getState().audio.selectedCategory;b&&o.play(b)}function d(){o.stop()}return{toggleCategory:a,setVolume:n,handleSessionStart:i,handleSessionStop:d,playBell:()=>o.playBell()}}let Ne=0;function Ee({store:t}){const e=new Map;let o=null;function a({type:f="info",title:y,message:C,duration:D=3200}){const w=`toast-${Ne+=1}`;t.setState(u=>({...u,ui:{...u.ui,toasts:[...u.ui.toasts,{id:w,type:f,title:y,message:C}]}}));const v=window.setTimeout(()=>n(w),D);return e.set(w,v),w}function n(f){e.has(f)&&(window.clearTimeout(e.get(f)),e.delete(f)),t.setState(y=>({...y,ui:{...y.ui,toasts:y.ui.toasts.filter(C=>C.id!==f)}}))}function i(f="",y="neutral",C=0){o&&(window.clearTimeout(o),o=null),t.setState(D=>({...D,ui:{...D.ui,banner:f?{message:f,type:y}:null}})),f&&C>0&&(o=window.setTimeout(()=>i(""),C))}function d(f){t.setState(y=>({...y,ui:{...y.ui,distractionModal:{message:f}}}))}function b(){t.setState(f=>({...f,ui:{...f.ui,distractionModal:null}}))}function g(f,y){t.setState(C=>({...C,ui:{...C.ui,badgeModal:{title:f,message:y}}}))}function _(){t.setState(f=>({...f,ui:{...f.ui,badgeModal:null}}))}return{notify:a,dismissToast:n,setBanner:i,showDistractionModal:d,hideDistractionModal:b,showBadgeModal:g,hideBadgeModal:_}}function Fe({store:t,repository:e}){let o=null,a=null,n=null;async function i(){const f=await e.fetchPublicStats();t.setState(y=>({...y,publicStats:f}))}function d(){o&&o(),o=e.subscribeLandingLeaderboard(f=>{t.setState(y=>({...y,leaderboards:{...y.leaderboards,landing:f}}))})}function b(){a&&a(),a=e.subscribeGlobalLeaderboard(f=>{t.setState(y=>({...y,leaderboards:{...y.leaderboards,global:f}}))})}function g(f){if(n&&(n(),n=null),!f){t.setState(y=>({...y,leaderboards:{...y.leaderboards,room:[]}}));return}n=e.subscribeRoomLeaderboard(f,y=>{t.setState(C=>({...C,leaderboards:{...C.leaderboards,room:y}}))})}function _(){o==null||o(),a==null||a(),n==null||n(),o=null,a=null,n=null}return{refreshPublicStats:i,startLanding:d,startGlobal:b,startRoom:g,stopAll:_}}function mt(t){return t.leftAt?3:t.distractedAt?0:t.focusing?1:2}function Oe({store:t,repository:e}){let o=null,a=null,n=null,i=new Map;function d(){var w;return((w=t.getState().auth.user)==null?void 0:w.uid)===te}function b(){o==null||o(),a==null||a(),o=null,a=null,i=new Map,n&&(window.clearInterval(n),n=null),t.setState(w=>({...w,ui:{...w.ui,ownerDashboardOpen:!1}}))}function g(w,v="neutral"){t.setState(u=>({...u,owner:{...u.owner,eventLog:[{id:`event-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,timestamp:Date.now(),message:w,type:v},...u.owner.eventLog].slice(0,80)}}))}function _(w){const v=[...w].sort((k,L)=>{const A=mt(k)-mt(L);return A!==0?A:k.name.localeCompare(L.name)}),u={total:w.length,focusing:w.filter(k=>k.focusing&&!k.leftAt&&!k.distractedAt).length,distracted:w.filter(k=>k.distractedAt&&!k.leftAt).length,left:w.filter(k=>k.leftAt).length};t.setState(k=>({...k,owner:{...k.owner,participants:v,summary:u}}))}function f(w){const v=new Map(w.map(u=>[u.uid,u]));v.forEach((u,k)=>{const L=i.get(k);if(!L){g(`${u.name} joined`,"success"),u.focusing&&g(`${u.name} started a session`,"success"),u.distractedAt&&g(`${u.name} got distracted`,"warning");return}!L.focusing&&u.focusing&&g(`${u.name} started a session`,"success"),L.focusing&&!u.focusing&&!u.leftAt&&g(`${u.name} stopped their session`,"neutral"),!L.distractedAt&&u.distractedAt&&g(`${u.name} got distracted`,"warning"),!L.leftAt&&u.leftAt&&g(`${u.name} left the room`,"error")}),i.forEach((u,k)=>{v.has(k)||g(`${u.name} left the room`,"error")}),i=v}function y(w){a==null||a(),a=null,i=new Map,t.setState(v=>({...v,owner:{...v.owner,selectedRoomId:w,participants:[],eventLog:[],summary:{total:0,focusing:0,distracted:0,left:0}}})),w&&(a=e.subscribeOwnerRoomPresence(w,v=>{f(v),_(v)}))}function C(){o==null||o(),o=e.subscribeActiveRooms(w=>{var k;t.setState(L=>({...L,owner:{...L.owner,rooms:w}}));const v=t.getState().owner.selectedRoomId,u=v&&w.some(L=>L.id===v)?v:((k=w[0])==null?void 0:k.id)||"";u!==v&&y(u)})}function D(){d()&&(t.setState(w=>({...w,ui:{...w.ui,ownerDashboardOpen:!0,ownerNow:Date.now()}})),n||(n=window.setInterval(()=>{t.setState(w=>({...w,ui:{...w.ui,ownerNow:Date.now()}}))},1e3)),C())}return{isOwner:d,openDashboard:D,closeDashboard:b,loadOwnerRoom:y}}function Ue({store:t}){function e(){t.setState(i=>{const d=i.ui.theme==="dark"?"light":"dark";return localStorage.setItem("ff_theme",d),{...i,ui:{...i.ui,theme:d}}})}function o(){t.setState(i=>{const d=!i.ui.notificationsEnabled;return localStorage.setItem("ff_notifications",d?"on":"off"),d&&"Notification"in window&&Notification.permission==="default"&&Notification.requestPermission().catch(()=>{}),{...i,ui:{...i.ui,notificationsEnabled:d}}})}function a(){t.setState(i=>({...i,ui:{...i.ui,profileOpen:!i.ui.profileOpen}}))}function n(){t.setState(i=>({...i,ui:{...i.ui,profileOpen:!1}}))}return{toggleTheme:e,toggleNotifications:o,toggleProfile:a,closeProfile:n}}const At=$(new URLSearchParams(window.location.search).get("room")||"");function $(t=""){return t.toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,50)}function He(){return Math.random().toString(36).slice(2,8).toUpperCase()}function Rt(){return At}function pt(t){const e=$(t),o=new URL(window.location.href);e?o.searchParams.set("room",e):o.searchParams.delete("room"),window.history.replaceState({roomId:e},"",o)}function Ge(){const t=new URL(window.location.href);t.searchParams.delete("room"),window.history.replaceState({},"",t)}function gt(t){const e=$(t),o=new URL(window.location.href);return o.search="",e&&o.searchParams.set("room",e),o.toString()}function ht(t=""){return/^[A-Z0-9-]{1,50}$/i.test(t.trim())}function Ve({store:t,repository:e,feedback:o,leaderboards:a}){let n=null,i=null,d=null,b=!1;const g={onRemoteSessionStart:null,onRemoteSessionStop:null};function _(c){Object.assign(g,c)}function f(c={}){t.setState(m=>({...m,room:{...m.room,ownerUid:c.ownerUid||m.room.ownerUid,ownerName:c.ownerName||m.room.ownerName,sessionControl:c.sessionControl||null}}))}async function y(c){if(i==null||i(),i=null,!c){f({ownerUid:"",ownerName:"",sessionControl:null});return}const m=await e.ensureRoom({roomId:c,user:t.getState().auth.user});f(m),i=e.subscribeRoom(c,async p=>{var at,nt,st,it;const M=t.getState(),H=((at=p.sessionControl)==null?void 0:at.revision)||0,Bt=M.room.syncRevision||0;if(t.setState(K=>({...K,room:{...K.room,ownerUid:p.ownerUid||"",ownerName:p.ownerName||"",sessionControl:p.sessionControl||null,syncRevision:Math.max(K.room.syncRevision||0,H)}})),!p.sessionControl||H<=Bt)return;const $t=((nt=M.auth.user)==null?void 0:nt.uid)||"";if(p.sessionControl.initiatedBy!==$t){if(p.sessionControl.status==="running"){await((st=g.onRemoteSessionStart)==null?void 0:st.call(g,p.sessionControl));return}["stopped","completed"].includes(p.sessionControl.status)&&await((it=g.onRemoteSessionStop)==null?void 0:it.call(g,{completed:p.sessionControl.status==="completed"}))}})}function C(c){const m=$(c);t.setState(p=>({...p,room:{...p.room,draftRoomId:m}}))}function D(c){t.setState(m=>({...m,room:{...m.room,joinCode:c}}))}async function w(c={}){var p;const m=t.getState();!((p=m.auth.user)!=null&&p.uid)||!m.room.currentRoomId||(await e.updateRoomPresence(m.room.currentRoomId,m.auth.user.uid,c).catch(()=>{}),m.auth.user&&e.touchActiveRoom({roomId:m.room.currentRoomId,user:m.auth.user}).catch(()=>{}))}async function v(){const c=t.getState();if(!(!c.auth.user||c.room.mode!=="room"||!c.room.currentRoomId)&&(await e.upsertRoomPresence({roomId:c.room.currentRoomId,user:c.auth.user}),await e.touchActiveRoom({roomId:c.room.currentRoomId,user:c.auth.user}).catch(()=>{}),d&&(window.clearInterval(d),d=null),await y(c.room.currentRoomId),n==null||n(),n=e.subscribeRoomPresence(c.room.currentRoomId,m=>{t.setState(p=>({...p,room:{...p.room,participants:m,activeCount:m.filter(M=>M.active!==!1).length}}))}),d=window.setInterval(()=>{const m=t.getState();m.auth.user&&m.room.currentRoomId&&e.updateRoomPresence(m.room.currentRoomId,m.auth.user.uid,{active:!0,lastSeenAt:Date.now(),leftAt:0}).catch(()=>{})},Yt),!b)){const m=()=>{const p=t.getState();p.auth.user&&p.room.currentRoomId&&e.updateRoomPresence(p.room.currentRoomId,p.auth.user.uid,{active:!1,focusing:!1,leftAt:Date.now()}).catch(()=>{})};window.addEventListener("pagehide",m),window.addEventListener("beforeunload",m),b=!0}}async function u(){const c=t.getState();d&&(window.clearInterval(d),d=null),n==null||n(),n=null,i==null||i(),i=null,c.auth.user&&c.room.currentRoomId&&await e.removeRoomPresence(c.room.currentRoomId,c.auth.user.uid).catch(()=>{}),t.setState(m=>({...m,room:{...m.room,participants:[],activeCount:0,ownerUid:"",ownerName:"",sessionControl:null,syncRevision:0}}))}async function k(c,m={}){const p=$(c);if(!p||!ht(p)){o.notify({type:"error",title:"Room code needed",message:"Enter a valid room code before joining."});return}pt(p),t.setState(M=>({...M,room:{...M.room,mode:"room",currentRoomId:p,draftRoomId:p,joinCode:m.clearJoinCode?"":M.room.joinCode},ui:{...M.ui,roomBoard:"room"}})),a.startRoom(p),await v(),m.fromUrl?(Ge(),o.setBanner(`Joined Room: ${p}`,"success",4e3)):m.announce!==!1&&o.notify({type:"success",title:"Room joined",message:`You are now in room ${p}.`})}async function L(c){const m=$(c);if(!m||!ht(m)){o.notify({type:"warning",title:"Invalid code",message:"Room codes can use letters, numbers, and hyphens only."});return}await k(m,{announce:!1,clearJoinCode:!0}),o.setBanner(`Joined Room: ${m}`,"success",4e3)}async function A(){await k(He(),{announce:!1}),o.notify({type:"success",title:"Room created",message:"A fresh room has been created and linked to this workspace."})}async function S(){const c=t.getState().room.currentRoomId||$(t.getState().room.draftRoomId);if(!c){o.notify({type:"error",title:"No room selected",message:"Create or join a room before copying the invite link."});return}try{await navigator.clipboard.writeText(gt(c)),o.notify({type:"success",title:"Invite copied",message:`Room link for ${c} copied to your clipboard.`})}catch{o.notify({type:"error",title:"Clipboard blocked",message:gt(c)})}}async function T(){const c=t.getState().room.currentRoomId||$(t.getState().room.draftRoomId);if(!c){o.notify({type:"warning",title:"No code available",message:"Type or join a room before copying the code."});return}try{await navigator.clipboard.writeText(c),o.notify({type:"success",title:"Code copied",message:"Room code copied!"})}catch{o.notify({type:"error",title:"Copy failed",message:c})}}async function s(c){if(t.getState().timer.running){o.notify({type:"warning",title:"Session is active",message:"Stop the current session before switching mode."});return}const m=t.getState().room.draftRoomId;if(c==="solo"){await u(),pt(""),t.setState(p=>({...p,room:{...p.room,mode:"solo",currentRoomId:"",draftRoomId:m,participants:[],activeCount:0,ownerUid:"",ownerName:"",sessionControl:null,syncRevision:0},ui:{...p.ui,roomBoard:"global"}})),a.startRoom("");return}t.setState(p=>({...p,room:{...p.room,mode:"room",draftRoomId:m},ui:{...p.ui,roomBoard:"room"}})),t.getState().room.currentRoomId&&(await v(),a.startRoom(t.getState().room.currentRoomId))}async function l(){const c=At||Rt();c&&await k(c,{announce:!1,fromUrl:!0})}async function h(c){const m=t.getState();if(!m.auth.user||!m.room.currentRoomId||m.room.ownerUid!==m.auth.user.uid)return null;const p=await e.upsertRoomSessionControl({roomId:m.room.currentRoomId,user:m.auth.user,control:{status:"running",startedAt:Date.now(),totalTime:c.totalTime,selectedDuration:c.selectedDuration,sessionMode:c.sessionMode,pomodoroEnabled:c.pomodoroEnabled,pomodoroPhase:c.pomodoroPhase,pomodoroCycle:c.pomodoroCycle,cumulativeFocusSeconds:c.cumulativeFocusSeconds||0,focusGoal:c.focusGoal||""}});return t.setState(M=>({...M,room:{...M.room,sessionControl:p,syncRevision:p.revision}})),p}async function R({completed:c,focusGoal:m}){const p=t.getState();if(!p.auth.user||!p.room.currentRoomId||p.room.ownerUid!==p.auth.user.uid)return null;const M=await e.upsertRoomSessionControl({roomId:p.room.currentRoomId,user:p.auth.user,control:{status:c?"completed":"stopped",endedAt:Date.now(),focusGoal:m||p.session.focusGoal||""}});return t.setState(H=>({...H,room:{...H.room,sessionControl:M,syncRevision:M.revision}})),M}return{setHandlers:_,syncRoomDraft:C,syncJoinCode:D,setMode:s,joinRoom:k,joinRoomByCode:L,createRoom:A,copyInvite:S,copyRoomCode:T,hydrateFromUrl:l,startPresence:v,stopPresence:u,updatePresence:w,publishTimerStart:h,publishTimerStop:R}}function je({store:t,repository:e,timer:o,stats:a,rooms:n,leaderboards:i,audio:d,feedback:b}){function g(){t.setState(S=>({...S,session:{...S.session,lastResult:null,saveState:"idle"},ui:{...S.ui,highlightedBadgeId:""}}))}function _(){t.setState(S=>({...S,ui:{...S.ui,quote:tt(S.ui.quote)}}))}function f(){t.setState(S=>({...S,ui:{...S.ui,focusPulse:!0}})),window.setTimeout(()=>{t.setState(S=>({...S,ui:{...S.ui,focusPulse:!1}}))},700)}function y(S,T="saving"){t.setState(s=>({...s,session:{...s.session,lastResult:S,saveState:T}}))}async function C(S={}){const T=t.getState(),s=!!S.remoteControl;if(!T.auth.user){b.notify({type:"warning",title:"Sign in required",message:"Use Google sign-in before starting a tracked session."});return}if(!s&&(!T.timer.selectedDuration||T.timer.selectedDuration<=0)){b.notify({type:"warning",title:"Choose a duration",message:"Select a duration or custom minute count before starting."});return}if(T.room.mode==="room"&&T.room.currentRoomId&&T.room.ownerUid&&T.room.ownerUid!==T.auth.user.uid&&!s){b.notify({type:"warning",title:"Room owner controls this timer",message:`${T.room.ownerName||"The room owner"} starts and stops shared room sessions.`});return}if(T.room.mode==="room"&&!T.room.currentRoomId){b.notify({type:"warning",title:"Room missing",message:"Join or create a room before starting a room session."});return}S.remoteControl?(t.setState(l=>({...l,session:{...l.session,focusGoal:S.remoteControl.focusGoal||l.session.focusGoal}})),o.syncRemoteTimer(S.remoteControl)):o.start(),g(),f(),d.handleSessionStart(),b.setBanner("Session in progress. Stay with the work.","neutral"),await n.startPresence(),n.updatePresence({focusing:!0,sessionStarted:Date.now(),distractedAt:0,awayDuration:0,distractionCount:0,leftAt:0,active:!0}).catch(()=>{}),T.room.mode==="room"&&T.room.currentRoomId&&!S.remoteControl&&await n.publishTimerStart({totalTime:t.getState().timer.totalTime,selectedDuration:t.getState().timer.selectedDuration,sessionMode:t.getState().timer.sessionMode,pomodoroEnabled:t.getState().timer.pomodoroEnabled,pomodoroPhase:t.getState().timer.pomodoroPhase,pomodoroCycle:t.getState().timer.pomodoroCycle,cumulativeFocusSeconds:t.getState().timer.cumulativeFocusSeconds,focusGoal:t.getState().session.focusGoal})}async function D(S=!1,T={}){const s=t.getState();if(!s.timer.running&&!S)return;const l=o.getSessionDiagnostics();o.stopRuntime(),o.clearAfterSession(),d.handleSessionStop(),b.setBanner(""),n.updatePresence({focusing:!1,distractedAt:0,awayDuration:0}).catch(()=>{});const h={...l,completed:S,goal:t.getState().session.focusGoal||"Untitled session",score:ue(l.timeSpent,l.penaltyTotal),focusPercentage:Lt(l.timeSpent,l.penaltyTotal)};if(!h.timeSpent){y(null,"idle");return}if(_(),s.ui.notificationsEnabled&&"Notification"in window&&Notification.permission==="granted")try{new Notification("FocusFlow session ready",{body:`${h.score} points earned in ${Math.floor(h.timeSpent/60)}m ${h.timeSpent%60}s.`})}catch{}if(y(h,"saving"),!s.auth.user){y(h,"idle");return}s.room.mode==="room"&&s.room.currentRoomId&&s.room.ownerUid===s.auth.user.uid&&!T.skipRoomSync&&await n.publishTimerStop({completed:S,focusGoal:h.goal});const R=new Set(t.getState().stats.badges);try{const c=await e.saveSession({user:s.auth.user,roomId:s.room.mode==="room"?s.room.currentRoomId:"",sessionResult:h});t.setState(M=>({...M,stats:{...M.stats,...c.stats},history:c.history,session:{...M.session,saveState:"saved",lastResult:h}}));const p=Mt(c.stats).find(M=>!R.has(M));p&&(t.setState(M=>({...M,ui:{...M.ui,highlightedBadgeId:p}})),window.setTimeout(()=>{t.setState(M=>({...M,ui:{...M.ui,highlightedBadgeId:M.ui.highlightedBadgeId===p?"":M.ui.highlightedBadgeId}}))},2200),b.showBadgeModal("New badge",`You unlocked ${p.replaceAll("_"," ")}.`)),await i.refreshPublicStats(),s.room.currentRoomId&&i.startRoom(s.room.currentRoomId),b.notify({type:"success",title:"Session saved",message:`Focus result stored with ${h.score} points.`})}catch{t.setState(m=>({...m,session:{...m.session,saveState:"error",lastResult:h}})),b.notify({type:"error",title:"Save failed",message:"The session summary is still visible, but the backend write did not complete."})}}async function w(){await D(!1)}async function v(){d.playBell(),await D(!0)}async function u(S){await C({remoteControl:S})}async function k({completed:S=!1}={}){await D(S,{skipRoomSync:!0})}async function L(){const S=t.getState().session.lastResult;if(!S)return;const T=["FocusFlow",`Goal: ${t.getState().session.focusGoal||"Deep work"}`,`Time: ${Math.floor(S.timeSpent/60)}m ${S.timeSpent%60}s`,`Distractions: ${S.distractions}`,`Score: ${S.score} pts`].join(`
`);try{navigator.share?await navigator.share({title:"FocusFlow session",text:T}):(await navigator.clipboard.writeText(T),b.notify({type:"success",title:"Summary copied",message:"The session summary was copied to your clipboard."}))}catch{b.notify({type:"warning",title:"Share cancelled",message:"No summary was shared."})}}function A(){if(t.getState().timer.running){w();return}C()}return{startSession:C,stopSession:w,handleTimerCompletion:v,startRemoteSession:u,stopRemoteSession:k,shareLastSession:L,toggleStartStop:A}}function We({store:t,repository:e}){async function o(a){const n=await e.loadWorkspace(a);return t.setState(i=>({...i,stats:{...i.stats,...n.stats},history:n.history})),n}return{refreshWorkspace:o}}function Q(t,e){if(!t)return e;const o=Math.floor((Date.now()-t)/1e3);return Math.max(0,e-o)}function qe(t){return{phase:"work",totalTime:1500,label:"Work"}}function ze(t,e){return t==="work"?{phase:"break",cycle:e+1,totalTime:300,label:`Break ${e+1}`}:{phase:"work",cycle:e,totalTime:1500,label:`Work ${e}`}}function Je({store:t,feedback:e}){let o=null,a=null;const n={onToggleSession:null,onEscape:null,onSessionFinished:null,onDistraction:null,onDistractionCleared:null};function i(s){Object.assign(n,s)}function d(){o&&(window.clearInterval(o),o=null),a&&(window.clearInterval(a),a=null)}function b(){d(),o=window.setInterval(()=>{var h;const s=t.getState();if(!s.timer.running)return;const l=Q(s.timer.phaseStartedAt,s.timer.phaseInitialTime);if(t.setState(R=>({...R,timer:{...R.timer,timeLeft:l}})),l<=0){if(s.timer.pomodoroEnabled){const R=ze(s.timer.pomodoroPhase,s.timer.pomodoroCycle),c=s.timer.pomodoroPhase==="work"?s.timer.cumulativeFocusSeconds+s.timer.phaseInitialTime:s.timer.cumulativeFocusSeconds;t.setState(m=>({...m,timer:{...m.timer,cumulativeFocusSeconds:c,pomodoroPhase:R.phase,pomodoroCycle:R.cycle,totalTime:R.totalTime,timeLeft:R.totalTime,phaseStartedAt:Date.now(),phaseInitialTime:R.totalTime}}));return}C(),(h=n.onSessionFinished)==null||h.call(n,!0)}},Zt),a=window.setInterval(()=>{const s=t.getState();s.timer.running&&Date.now()-s.timer.lastActivityAt>Qt&&(u("Idle",300),t.setState(l=>({...l,timer:{...l.timer,lastActivityAt:Date.now()}})))},3e4)}function g(s){t.getState().timer.running||t.setState(h=>({...h,timer:{...h.timer,selectedDuration:s,totalTime:s,timeLeft:s,phaseStartedAt:null,phaseInitialTime:s,pomodoroEnabled:!1,pomodoroPhase:"work",pomodoroCycle:0,cumulativeFocusSeconds:0}}))}function _(s){const l=Number(s);return!l||l<1?!1:(g(l*60),!0)}function f(){const s=t.getState();if(s.timer.running)return;if(s.timer.pomodoroEnabled){g(s.timer.selectedDuration);return}const l=qe();t.setState(h=>({...h,timer:{...h.timer,pomodoroEnabled:!0,pomodoroPhase:l.phase,pomodoroCycle:0,cumulativeFocusSeconds:0,totalTime:l.totalTime,timeLeft:l.totalTime,phaseInitialTime:l.totalTime,phaseStartedAt:null}}))}function y(){const s=t.getState();if(s.timer.running)return;const l=s.timer.timeLeft>0?s.timer.timeLeft:s.timer.selectedDuration;t.setState(h=>({...h,timer:{...h.timer,running:!0,phaseStartedAt:Date.now(),totalTime:l,timeLeft:l,phaseInitialTime:l,distractionCount:0,distractionPenaltyTotal:0,distractionLog:[],blurStartedAt:null,lastActivityAt:Date.now(),cumulativeFocusSeconds:h.timer.pomodoroEnabled?0:h.timer.cumulativeFocusSeconds,distractionHandled:!1}})),b()}function C(){d(),t.setState(s=>({...s,timer:{...s.timer,running:!1,blurStartedAt:null,distractionHandled:!1}}))}function D(s){if(!(s!=null&&s.startedAt))return;const l=Q(s.startedAt,s.totalTime);d(),t.setState(h=>({...h,timer:{...h.timer,running:s.status==="running",selectedDuration:s.selectedDuration||h.timer.selectedDuration,totalTime:s.totalTime,timeLeft:l,sessionMode:s.sessionMode||h.timer.sessionMode,pomodoroEnabled:!!s.pomodoroEnabled,pomodoroPhase:s.pomodoroPhase||"work",pomodoroCycle:s.pomodoroCycle||0,cumulativeFocusSeconds:s.cumulativeFocusSeconds||0,phaseStartedAt:s.startedAt,phaseInitialTime:s.totalTime,distractionCount:0,distractionPenaltyTotal:0,distractionLog:[],blurStartedAt:null,lastActivityAt:Date.now(),distractionHandled:!1}})),s.status==="running"&&b()}function w(){d(),t.setState(s=>({...s,timer:{...s.timer,running:!1,totalTime:s.timer.selectedDuration,timeLeft:s.timer.selectedDuration,phaseStartedAt:null,phaseInitialTime:s.timer.selectedDuration,distractionCount:0,distractionPenaltyTotal:0,distractionLog:[],blurStartedAt:null,pomodoroEnabled:!1,pomodoroPhase:"work",pomodoroCycle:0,cumulativeFocusSeconds:0,distractionHandled:!1}}))}function v(){d(),t.setState(s=>({...s,timer:{...s.timer,running:!1,totalTime:s.timer.selectedDuration,timeLeft:0,phaseStartedAt:null,phaseInitialTime:s.timer.selectedDuration,distractionCount:0,distractionPenaltyTotal:0,distractionLog:[],blurStartedAt:null,pomodoroEnabled:!1,pomodoroPhase:"work",pomodoroCycle:0,cumulativeFocusSeconds:0,distractionHandled:!1}}))}function u(s,l=0){var p;const h=t.getState();if(!h.timer.running)return;const R=h.timer.distractionLog.filter(M=>M.recordedAt>Date.now()-6e4).length+1,c=ce(h.timer.sessionMode,l,R),m=h.timer.distractionCount+1;t.setState(M=>({...M,timer:{...M.timer,distractionCount:m,distractionPenaltyTotal:M.timer.distractionPenaltyTotal+c,distractionLog:[...M.timer.distractionLog,{reason:s,duration:l,penalty:c,recordedAt:Date.now()}]}})),(p=n.onDistraction)==null||p.call(n,{awaySeconds:l,distractionCount:m})}function k(s=0){var l;t.setState(h=>({...h,timer:{...h.timer,blurStartedAt:null,distractionHandled:!1}})),s>=10&&e.showDistractionModal(`You were away for ${s} seconds.`),(l=n.onDistractionCleared)==null||l.call(n,{awaySeconds:s})}function L(){const s=()=>{t.setState(l=>({...l,timer:{...l.timer,lastActivityAt:Date.now()}}))};["mousemove","keydown","touchstart","pointerdown"].forEach(l=>{window.addEventListener(l,s)}),window.addEventListener("blur",()=>{const l=t.getState();!l.timer.running||l.timer.distractionHandled||(u("Window change",0),t.setState(h=>({...h,timer:{...h.timer,blurStartedAt:Date.now(),distractionHandled:!0}})))}),window.addEventListener("focus",()=>{const l=t.getState();if(!l.timer.running||!l.timer.blurStartedAt)return;const h=Math.round((Date.now()-l.timer.blurStartedAt)/1e3);k(h)}),document.addEventListener("visibilitychange",()=>{const l=t.getState();if(l.timer.running){if(document.hidden){l.timer.distractionHandled||(u("Tab hidden",0),t.setState(h=>({...h,timer:{...h.timer,blurStartedAt:Date.now(),distractionHandled:!0}})));return}if(l.timer.blurStartedAt){const h=Math.round((Date.now()-l.timer.blurStartedAt)/1e3);k(h)}}}),document.addEventListener("keydown",l=>{var h,R;l.target instanceof HTMLElement&&["INPUT","TEXTAREA"].includes(l.target.tagName)||(l.code==="Space"&&(l.preventDefault(),(h=n.onToggleSession)==null||h.call(n)),l.code==="Escape"&&((R=n.onEscape)==null||R.call(n)),l.code==="KeyR"&&!t.getState().timer.running&&w())})}function A(s){!j[s]||t.getState().timer.running||t.setState(l=>({...l,timer:{...l.timer,sessionMode:s}}))}function S(){const s=t.getState(),l=s.timer.phaseStartedAt?Q(s.timer.phaseStartedAt,s.timer.phaseInitialTime):s.timer.timeLeft,h=s.timer.phaseStartedAt&&(!s.timer.pomodoroEnabled||s.timer.pomodoroPhase==="work")?s.timer.phaseInitialTime-l:0;return Math.max(0,s.timer.cumulativeFocusSeconds+h)}function T(){const s=t.getState();return{timeSpent:S(),distractions:s.timer.distractionCount,penaltyTotal:s.timer.distractionPenaltyTotal,distractionLog:s.timer.distractionLog.map(l=>({...l})),sessionMode:s.timer.sessionMode}}return{setHandlers:i,bindAttentionTracking:L,setDuration:g,applyCustomMinutes:_,togglePomodoro:f,start:y,stopRuntime:C,syncRemoteTimer:D,reset:w,clearAfterSession:v,setSessionMode:A,getSessionDiagnostics:T}}function Ye(t){let e=t;const o=new Set;function a(){return e}function n(d){return e=typeof d=="function"?d(e):d,o.forEach(g=>g(e)),e}function i(d){return o.add(d),()=>o.delete(d)}return{getState:a,setState:n,subscribe:i}}function Ke(){return{totalScore:0,totalSessions:0,totalMinutes:0,streak:0,longestStreak:0,weekData:[0,0,0,0,0,0,0],todayMinutes:0,lastDistractions:0,lastSessionDay:null,nightSession:!1,badges:[],activityDays:[],dailyGoalMinutes:V}}function Qe(){const t=Rt(),e=oe[2].seconds,o=localStorage.getItem("ff_theme")==="light"?"light":"dark",a=localStorage.getItem("ff_notifications")!=="off",n=localStorage.getItem("ff_sound")||"",i=Number(localStorage.getItem("ff_volume")||"40");return{auth:{user:null,loading:!0},route:{view:"landing"},ui:{theme:o,notificationsEnabled:a,profileOpen:!1,roomBoard:"global",sections:{progress:!0,history:!0,leaderboard:!0,calendar:!1},quote:tt(),toasts:[],distractionModal:null,badgeModal:null,banner:null,reducedMotion:window.matchMedia("(prefers-reduced-motion: reduce)").matches,calendarViewMonth:Y(),highlightedBadgeId:"",focusPulse:!1,expandedHistoryIds:[],ownerDashboardOpen:!1,ownerNow:Date.now()},timer:{selectedDuration:e,totalTime:e,timeLeft:e,running:!1,sessionMode:"normal",pomodoroEnabled:!1,pomodoroPhase:"work",pomodoroCycle:0,cumulativeFocusSeconds:0,phaseStartedAt:null,phaseInitialTime:e,distractionCount:0,distractionPenaltyTotal:0,distractionLog:[],blurStartedAt:null,lastActivityAt:Date.now(),distractionHandled:!1},session:{focusGoal:"",customMinutes:"",lastResult:null,saveState:"idle"},room:{mode:t?"room":"solo",currentRoomId:t,draftRoomId:t,joinCode:"",participants:[],activeCount:0,ownerUid:"",ownerName:"",sessionControl:null,syncRevision:0},stats:Ke(),history:[],leaderboards:{landing:[],global:[],room:[]},owner:{rooms:[],selectedRoomId:"",participants:[],eventLog:[],summary:{total:0,focusing:0,distracted:0,left:0}},publicStats:{totalMinutes:0,totalSessions:0,totalUsers:0},audio:{selectedCategory:n,volume:Math.max(0,Math.min(i,100)),playing:!1,trackLabel:""}}}function Ze(){return`
    <div class="ff-app">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>
      <div class="ambient ambient-c"></div>

      <div id="authLoader" class="auth-loader">
        <div class="auth-loader__card">
          <div class="auth-loader__mark">FF</div>
          <div class="auth-loader__ring"></div>
          <p>Preparing your workspace...</p>
        </div>
      </div>

      <div id="toastStack" class="toast-stack" aria-live="polite" aria-atomic="true"></div>

      <main class="shell">
        <section id="landingPage" class="page page--landing">
          <header class="topbar">
            <div class="topbar__left">
              <button class="brand brand--button" data-action="go-landing" type="button">
                <img src="/icon-512.png" alt="FocusFlow" class="brand__logo">
                <span class="brand__text">FocusFlow</span>
              </button>

            </div>

            <div class="topbar__right">
              <div id="landingAccountToolbar" class="account-toolbar" hidden>
                <div id="landingStreakBadge" class="streak-chip" hidden>
                  <span class="streak-chip__flame" aria-hidden="true"></span>
                  <div class="streak-chip__content">
                    <span class="streak-chip__label">Streak</span>
                    <strong id="landingStreakValue">0</strong>
                  </div>
                </div>
                <button id="landingProfileButton" class="profile-button profile-button--minimal" data-action="toggle-profile" type="button">
                  <span id="landingUserAvatar" class="avatar avatar--small"></span>
                </button>
              </div>
            </div>
          </header>

          <section id="landingLoggedOut" class="hero hero--marketing">
            <div class="hero__copy">
              <p class="eyebrow">Measured focus for ambitious work</p>
              <h1 class="hero__title">A focus ritual with live momentum, ambient depth, and meaningful progress.</h1>
              <p class="hero__body">
                FocusFlow combines timed sessions, live rooms, leaderboards, streaks, and distraction-aware scoring
                in a calmer workspace that helps the work itself stay central.
              </p>
              <div class="hero__actions">
                <button class="button button--primary" data-action="sign-in" type="button">Start with Google</button>
                <button class="button button--ghost" data-action="scroll-live-board" type="button">See live board</button>
              </div>
              <div class="hero__metrics">
                <div class="metric">
                  <span id="publicMinutesMetric" class="metric__value">-</span>
                  <span class="metric__label">minutes focused</span>
                </div>
                <div class="metric">
                  <span id="publicSessionMetric" class="metric__value">-</span>
                  <span class="metric__label">sessions completed</span>
                </div>
                <div class="metric">
                  <span id="publicUserMetric" class="metric__value">-</span>
                  <span class="metric__label">active accounts</span>
                </div>
              </div>
            </div>

            <div class="hero__preview card">
              <p class="preview__label">Focus preview</p>
              <div class="preview__ring">
                <svg viewBox="0 0 200 200" class="preview__ring-svg" aria-hidden="true">
                  <circle class="preview__ring-track" cx="100" cy="100" r="88"></circle>
                  <circle class="preview__ring-progress" cx="100" cy="100" r="88"></circle>
                </svg>
                <div class="preview__ring-value">25:00</div>
              </div>
              <div class="preview__items">
                <div class="preview__item">
                  <span class="preview__item-label">Mode</span>
                  <strong>Deep work</strong>
                </div>
                <div class="preview__item">
                  <span class="preview__item-label">Signals</span>
                  <strong>Rooms, streaks, live score</strong>
                </div>
                <div class="preview__item">
                  <span class="preview__item-label">Atmosphere</span>
                  <strong>Locally hosted ambient sound</strong>
                </div>
              </div>
            </div>
          </section>

          <section id="landingLoggedIn" class="hero hero--member" hidden>
            <div class="hero__copy">
              <div class="member-identity">
                <span id="landingHeroAvatar" class="avatar avatar--small"></span>
                <div>
                  <p class="eyebrow">Welcome back</p>
                  <h1 id="landingHeroTitle" class="hero__title">Your next clean session is one click away.</h1>
                </div>
              </div>
              <p id="landingMemberMessage" class="hero__body">Your recent progress is ready. Step back into the workspace when you are.</p>
              <div class="hero__actions">
                <button class="button button--primary" data-action="go-app" type="button">Go to Workspace</button>
                <button class="button button--ghost" data-action="scroll-live-board" type="button">See leaderboard</button>
              </div>
            </div>
            <div class="member-summary card">
              <div class="member-summary__header">
                <span class="member-summary__eyebrow">Today</span>
                <strong id="landingGoalProgress">0 / 60 min</strong>
              </div>
              <div class="progress-bar">
                <div id="landingGoalFill" class="progress-bar__fill"></div>
              </div>
              <div class="member-summary__grid">
                <div class="metric-card">
                  <span class="metric-card__label">Today's Min</span>
                  <strong id="landingTodayMinutes">0</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-card__label">Sessions</span>
                  <strong id="landingSessionCount">0</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-card__label">Level</span>
                  <strong id="landingLevelName">Beginner</strong>
                </div>
                <div class="metric-card">
                  <span class="metric-card__label">Points</span>
                  <strong id="landingTotalScore">0</strong>
                </div>
              </div>
            </div>
          </section>

          <section id="features" class="section-grid">
            <article class="feature-card">
              <p class="eyebrow">Timer system</p>
              <h2>Pomodoro, custom sessions, and clean visual feedback.</h2>
              <p>Move between quick blocks, deep sessions, and longer custom runs without losing the feeling of a calm workspace.</p>
            </article>
            <article class="feature-card">
              <p class="eyebrow">Live competition</p>
              <h2>Room invites, global standings, and meaningful score updates.</h2>
              <p>Compete with friends in small rooms or keep an eye on the broader board without breaking concentration.</p>
            </article>
            <article class="feature-card">
              <p class="eyebrow">Ambient support</p>
              <h2>Locally hosted sound, distraction logging, streaks, and badges.</h2>
              <p>Everything reinforces habit-building without turning the interface into a game board first and a focus tool second.</p>
            </article>
          </section>

          <section id="how-it-works" class="section-steps">
            <div class="section-heading">
              <p class="eyebrow">How it works</p>
              <h2>Three simple steps, then stay with the work.</h2>
            </div>
            <div class="steps">
              <article class="step-card">
                <span class="step-card__index">01</span>
                <h3>Authenticate once</h3>
                <p>Sign in with Google and pick up your history, score, streak, and room presence instantly.</p>
              </article>
              <article class="step-card">
                <span class="step-card__index">02</span>
                <h3>Choose the shape of the session</h3>
                <p>Select a duration, mode, and optional room. Add a goal so the timer starts with intent.</p>
              </article>
              <article class="step-card">
                <span class="step-card__index">03</span>
                <h3>Focus and review</h3>
                <p>Let the session run, track distractions, then keep the result across history, leaderboards, and streaks.</p>
              </article>
            </div>
          </section>

          <section id="live-board" class="section-live-board">
            <div class="section-heading">
              <p class="eyebrow">Live board</p>
              <h2>Global standings update in real time.</h2>
            </div>
            <div class="card">
              <ul id="landingLeaderboard" class="board-list board-list--landing"></ul>
            </div>
          </section>
        </section>

        <section id="mainApp" class="page page--app" hidden>
          <header class="workspace-bar">
            <div class="workspace-bar__left">
              <button class="brand brand--button" data-action="go-landing" type="button">
                <img src="/icon-512.png" alt="FocusFlow" class="brand__logo">
                <span class="brand__text">FocusFlow</span>
              </button>
            </div>

            <div class="workspace-bar__right">
              <div id="workspaceStreakBadge" class="streak-chip" hidden>
                <span class="streak-chip__flame" aria-hidden="true"></span>
                <div class="streak-chip__content">
                  <span class="streak-chip__label">Streak</span>
                  <strong id="workspaceStreakValue">0</strong>
                </div>
              </div>
              <button id="profileButton" class="profile-button profile-button--minimal" data-action="toggle-profile" type="button">
                <span id="profileAvatar" class="avatar avatar--small"></span>
              </button>
            </div>
          </header>

          <div id="workspaceBanner" class="workspace-banner" hidden></div>
          <p id="quoteBar" class="quote-bar"></p>

          <div class="workspace-grid">
            <section class="focus-column">
              <div class="card focus-card">
                <div class="focus-card__header">
                  <div>
                    <p class="eyebrow">Current block</p>
                    <h2>Design the session, then disappear into it.</h2>
                  </div>
                  <div class="goal-chip">
                    <span class="goal-chip__label">Today</span>
                    <strong id="dailyGoalLabel">0 / 60 min</strong>
                  </div>
                </div>

                <div class="progress-bar progress-bar--soft">
                  <div id="dailyGoalFill" class="progress-bar__fill"></div>
                </div>

                <label class="field">
                  <span class="field__label">What are you working on?</span>
                  <input id="focusGoalInput" class="field__input" type="text" placeholder="Finish the deck, ship the build, draft the proposal...">
                </label>

                <div class="field">
                  <span class="field__label">Session Type</span>
                </div>

                <div class="session-layout">
                  <div class="session-layout__left">
                    <div class="button-row button-row--compact">
                      <button class="button button--ghost button--small" data-action="set-session-mode" data-session-mode="normal" type="button">Study</button>
                      <button class="button button--ghost button--small" data-action="set-session-mode" data-session-mode="deep" type="button">Deep</button>
                      <button class="button button--ghost button--small" data-action="set-session-mode" data-session-mode="sprint" type="button">Sprint</button>
                    </div>
                    <p id="sessionModeDescription" class="support-text"></p>
                    <div class="button-row button-row--compact">
                      <button class="button button--ghost button--small" data-action="set-mode" data-mode="solo" type="button">Solo</button>
                      <button class="button button--ghost button--small" data-action="set-mode" data-mode="room" type="button">
                        <span>Room</span>
                        <span id="roomModeCountBadge" class="mode-count-badge" hidden>0</span>
                      </button>
                    </div>

                    <div id="roomPanel" class="room-panel" hidden>
                      <div class="room-panel__inputs">
                        <label class="field">
                          <span class="field__label">Room name</span>
                          <input id="roomCodeInput" class="field__input field__input--mono" type="text" placeholder="AB12CD" maxlength="50">
                        </label>
                        <div class="button-row button-row--compact">
                          <button class="button button--secondary button--small" data-action="join-room" type="button">Use room</button>
                          <button class="button button--ghost button--small" data-action="copy-room-code" type="button">Copy code</button>
                          <button class="button button--ghost button--small" data-action="create-room" type="button">Create room</button>
                          <button class="button button--ghost button--small" data-action="copy-invite" type="button">Copy invite</button>
                        </div>
                      </div>

                      <div class="room-join-divider">
                        <span>Or join with a code:</span>
                      </div>
                      <div class="room-join-inline">
                        <input id="roomJoinInput" class="field__input field__input--mono" type="text" placeholder="Enter room code to join..." maxlength="50">
                        <button class="button button--primary button--small" data-action="join-room-code" type="button">Join</button>
                      </div>

                      <div class="room-panel__meta">
                        <div class="room-panel__meta-item">
                          <span class="room-panel__label">Active room</span>
                          <strong id="activeRoomLabel">None</strong>
                        </div>
                        <div class="room-panel__meta-item">
                          <span class="room-panel__label">Presence</span>
                          <strong id="roomPresenceCount">0 people</strong>
                        </div>
                        <div class="room-panel__meta-item">
                          <span class="room-panel__label">Owner</span>
                          <strong id="roomOwnerLabel">Waiting</strong>
                        </div>
                        <div class="room-panel__meta-item">
                          <span class="room-panel__label">Sync</span>
                          <strong id="roomSyncLabel">Idle</strong>
                        </div>
                      </div>

                      <div id="roomPresenceList" class="participant-list"></div>
                    </div>
                  </div>

                  <div class="session-layout__right">
                    <div id="timerRing" class="timer-ring">
                      <svg viewBox="0 0 200 200" class="timer-ring__svg" aria-hidden="true">
                        <defs>
                          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="var(--accent-strong)"></stop>
                            <stop offset="100%" stop-color="var(--accent-soft)"></stop>
                          </linearGradient>
                          <linearGradient id="timerDangerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#c65a42"></stop>
                            <stop offset="100%" stop-color="#f2ae72"></stop>
                          </linearGradient>
                        </defs>
                        <circle class="timer-ring__track" cx="100" cy="100" r="88"></circle>
                        <circle id="timerProgress" class="timer-ring__progress" cx="100" cy="100" r="88"></circle>
                      </svg>
                      <div class="timer-ring__content">
                        <span id="timerPhaseLabel" class="timer-ring__phase">Ready</span>
                        <strong id="timerValue" class="timer-ring__value">25:00</strong>
                        <span id="timerPercentLabel" class="timer-ring__percent">100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="button-row button-row--durations">
                  <button class="button button--ghost button--small" data-action="set-duration" data-duration="300" type="button">5m</button>
                  <button class="button button--ghost button--small" data-action="set-duration" data-duration="600" type="button">10m</button>
                  <button class="button button--ghost button--small" data-action="set-duration" data-duration="1500" type="button">25m</button>
                  <button class="button button--ghost button--small" data-action="set-duration" data-duration="3600" type="button">1h</button>
                  <button class="button button--ghost button--small" data-action="set-duration" data-duration="7200" type="button">2h</button>
                  <button class="button button--ghost button--small" data-action="set-duration" data-duration="10800" type="button">3h</button>
                  <button class="button button--ghost button--small" data-action="toggle-custom-duration" type="button">Custom</button>
                </div>

                <div id="customDurationPanel" class="inline-panel" hidden>
                  <label class="field field--inline">
                    <span class="field__label">Minutes</span>
                    <input id="customMinutesInput" class="field__input field__input--mono" type="number" min="1" max="480" placeholder="90">
                  </label>
                  <button class="button button--secondary button--small" data-action="apply-custom-duration" type="button">Apply</button>
                </div>

                <div class="button-row">
                  <button id="pomodoroButton" class="button button--ghost" data-action="toggle-pomodoro" type="button">Pomodoro</button>
                  <button id="startButton" class="button button--primary" data-action="start-session" type="button">Start session</button>
                  <button id="stopButton" class="button button--secondary" data-action="stop-session" type="button">Stop session</button>
                </div>

                <div class="meta-grid">
                  <article class="meta-card">
                    <span class="meta-card__label">Scoring</span>
                    <strong id="scoreRuleLabel">+1 point per second</strong>
                    <p id="scorePenaltyLabel" class="meta-card__body"></p>
                  </article>
                  <article class="meta-card">
                    <span class="meta-card__label">Ambient sound</span>
                    <strong id="ambientTrackLabel">No track selected</strong>
                    <div class="sound-grid">
                      <button class="sound-chip" data-action="toggle-sound" data-sound="lofi" type="button">Lofi</button>
                      <button class="sound-chip" data-action="toggle-sound" data-sound="rain" type="button">Rain</button>
                      <button class="sound-chip" data-action="toggle-sound" data-sound="cafe" type="button">Cafe</button>
                      <button class="sound-chip" data-action="toggle-sound" data-sound="forest" type="button">Forest</button>
                      <button class="sound-chip" data-action="toggle-sound" data-sound="white" type="button">White noise</button>
                    </div>
                    <label class="range-field">
                      <span>Volume</span>
                      <input id="volumeInput" type="range" min="0" max="100" value="40">
                    </label>
                  </article>
                </div>

                <section id="sessionSummary" class="summary-panel" hidden>
                  <div class="summary-panel__header">
                    <div>
                      <p class="eyebrow">Session summary</p>
                      <h3 id="summaryHeadline">Session complete</h3>
                    </div>
                    <span id="saveStateBadge" class="status-badge">Idle</span>
                  </div>

                  <div class="summary-panel__stats">
                    <div class="metric-card">
                      <span class="metric-card__label">Time</span>
                      <strong id="summaryTimeValue">00:00</strong>
                    </div>
                    <div class="metric-card">
                      <span class="metric-card__label">Distractions</span>
                      <strong id="summaryDistractionValue">0</strong>
                    </div>
                    <div class="metric-card">
                      <span class="metric-card__label">Points</span>
                      <strong id="summaryScoreValue">0</strong>
                    </div>
                    <div class="metric-card">
                      <span class="metric-card__label">Focus</span>
                      <strong id="summaryFocusValue">100%</strong>
                    </div>
                  </div>

                  <p id="sessionFeedback" class="summary-panel__feedback"></p>
                  <div id="distractionLog" class="log-list"></div>

                  <div class="button-row button-row--compact">
                    <button class="button button--ghost button--small" data-action="share-session" type="button">Share result</button>
                  </div>
                </section>
              </div>
            </section>

            <aside class="side-column">
              <section class="card side-card">
                <div class="section-heading section-heading--compact">
                  <div>
                    <p class="eyebrow">Progress</p>
                    <h3>Your account signal</h3>
                  </div>
                  <button class="text-button" data-action="toggle-section" data-section="progress" type="button">Hide</button>
                </div>
                <div id="progressSection">
                  <div class="metric-grid">
                    <div class="metric-card">
                      <span class="metric-card__label">Streak</span>
                      <strong id="statsStreakValue">0</strong>
                    </div>
                    <div class="metric-card">
                      <span class="metric-card__label">Sessions</span>
                      <strong id="statsSessionValue">0</strong>
                    </div>
                    <div class="metric-card">
                      <span class="metric-card__label">Hours</span>
                      <strong id="statsHoursValue">0.0h</strong>
                    </div>
                    <div class="metric-card">
                      <span class="metric-card__label">Level</span>
                      <strong id="statsLevelValue">Beginner</strong>
                    </div>
                  </div>

                  <div class="xp-block">
                    <div class="xp-block__labels">
                      <span id="xpCurrentLabel">0 min</span>
                      <span id="xpNextLabel">Next: 60 min</span>
                    </div>
                    <div class="progress-bar progress-bar--soft">
                      <div id="xpFill" class="progress-bar__fill"></div>
                    </div>
                  </div>

                  <div class="badge-block">
                    <div class="badge-block__header">
                      <span>Badges</span>
                      <strong id="badgeCountLabel">0 / 13</strong>
                    </div>
                    <div id="badgeList" class="badge-list"></div>
                  </div>

                  <div class="calendar-block">
                    <button class="text-button text-button--inline" data-action="toggle-section" data-section="calendar" type="button">
                      <span id="calendarToggleLabel">Streak Calendar</span>
                      <span id="calendarMetaLabel">Best 0 days</span>
                    </button>
                    <div id="calendarSection" hidden>
                      <div class="calendar-toolbar">
                        <button class="icon-button" data-action="calendar-prev" type="button" aria-label="Previous month">&lt;</button>
                        <strong id="calendarMonthLabel">Month</strong>
                        <button id="calendarNextButton" class="icon-button" data-action="calendar-next" type="button" aria-label="Next month">&gt;</button>
                      </div>
                      <div class="calendar-weekdays">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                      </div>
                      <div id="calendarGrid" class="calendar-grid"></div>
                      <div class="calendar-summary-pills">
                        <span id="calendarLongestLabel" class="calendar-summary-pill">Longest: 0d</span>
                        <span id="calendarMonthDaysLabel" class="calendar-summary-pill">This month: 0 days</span>
                      </div>
                    </div>
                  </div>

                  <div class="chart-block">
                    <div class="chart-block__header">
                      <span>This week</span>
                      <strong id="weekConsistencyLabel">0% consistency</strong>
                    </div>
                    <div id="weekChart" class="week-chart"></div>
                  </div>
                </div>
              </section>

              <section class="card side-card">
                <div class="section-heading section-heading--compact">
                  <div>
                    <p class="eyebrow">History</p>
                    <h3>Recent sessions</h3>
                  </div>
                  <button class="text-button" data-action="toggle-section" data-section="history" type="button">Hide</button>
                </div>
                <div id="historySection">
                  <ul id="historyList" class="history-list"></ul>
                </div>
              </section>

              <section class="card side-card">
                <div class="section-heading section-heading--compact">
                  <div>
                    <p class="eyebrow">Leaderboard</p>
                    <h3>See where the focus is landing</h3>
                  </div>
                  <button class="text-button" data-action="toggle-section" data-section="leaderboard" type="button">Hide</button>
                </div>
                <div id="leaderboardSection">
                  <div class="segmented-control segmented-control--small">
                    <button class="segmented-control__button" data-action="switch-board" data-board="global" type="button">Global</button>
                    <button class="segmented-control__button" data-action="switch-board" data-board="room" type="button">Room</button>
                  </div>
                  <ul id="globalLeaderboard" class="board-list"></ul>
                  <ul id="roomLeaderboard" class="board-list" hidden></ul>
                </div>
              </section>
            </aside>
          </div>

          <div id="profilePanel" class="profile-panel" hidden>
            <div class="profile-panel__header">
              <div class="profile-panel__identity">
                <span id="profilePanelAvatar" class="avatar"></span>
                <div>
                  <strong id="profilePanelName">FocusFlow</strong>
                  <p id="profilePanelEmail" class="support-text"></p>
                </div>
              </div>
            </div>

            <div class="profile-panel__menu-label">
              <svg class="profile-menu-item__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.08 7.08 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.22-1.13.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.41 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .49.42h3.8a.5.5 0 0 0 .49-.42l.36-2.54c.58-.22 1.13-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/>
              </svg>
              <span>Settings</span>
            </div>

            <div class="profile-panel__menu">
              <button class="setting-row" data-action="toggle-theme" type="button">
                <svg class="profile-menu-item__icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
                </svg>
                <span>Theme</span>
                <strong id="profileThemeLabel">Dark</strong>
              </button>
              <button class="setting-row" data-action="toggle-notifications" type="button">
                <svg class="profile-menu-item__icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5-6.71V3a2 2 0 1 0-4 0v1.29A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z"/>
                </svg>
                <span>Notifications</span>
                <strong id="notificationLabel">On</strong>
              </button>
              <button class="setting-row setting-row--danger" data-action="sign-out" type="button">
                <svg class="profile-menu-item__icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5v2H6v10h5v2zm7.59-7L15 8.41 16.41 7 22 12.59 16.41 18 15 16.59 18.59 13H9v-2h9.59z"/>
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          </div>

          <div id="ownerDashboard" class="owner-dashboard" hidden>
            <div class="owner-dashboard__panel card">
              <div class="owner-dashboard__header">
                <div class="owner-dashboard__title-wrap">
                  <span class="owner-dashboard__live-dot"></span>
                  <div>
                    <p class="eyebrow">Owner monitor</p>
                    <h3>Live Room Monitor</h3>
                  </div>
                </div>
                <div class="owner-dashboard__controls">
                  <select id="ownerRoomSelect" class="field__input field__input--mono owner-dashboard__select"></select>
                  <button class="button button--ghost button--small" data-action="close-owner-dashboard" type="button">Close</button>
                </div>
              </div>
              <div class="owner-dashboard__stats">
                <div class="metric-card"><span class="metric-card__label">Total Participants</span><strong id="odTotalParticipants">0</strong></div>
                <div class="metric-card"><span class="metric-card__label">Currently Focusing</span><strong id="odFocusingCount">0</strong></div>
                <div class="metric-card"><span class="metric-card__label">Distracted Now</span><strong id="odDistractedCount">0</strong></div>
                <div class="metric-card"><span class="metric-card__label">Left Room</span><strong id="odLeftCount">0</strong></div>
              </div>
              <div id="odParticipants" class="owner-dashboard__grid"></div>
              <div class="owner-dashboard__log card">
                <div class="owner-dashboard__log-header"><span>Event log</span></div>
                <div id="odEventLog" class="owner-dashboard__log-list"></div>
              </div>
            </div>
          </div>
          <div id="distractionModal" class="modal" hidden>
            <div class="modal__surface">
              <p class="eyebrow">Attention shift</p>
              <h3>Focus was interrupted.</h3>
              <p id="distractionModalText" class="modal__body"></p>
              <div class="button-row button-row--compact">
                <button class="button button--primary button--small" data-action="close-distraction-modal" type="button">Back to session</button>
              </div>
            </div>
          </div>

        </div>
      </div>


      <div id="badgeModal" class="modal" hidden>
        <div class="modal__surface">
          <p class="eyebrow">Badge unlocked</p>
          <h3 id="badgeModalTitle">New badge</h3>
          <p id="badgeModalText" class="modal__body"></p>
          <div class="button-row button-row--compact">
            <button class="button button--primary button--small" data-action="close-badge-modal" type="button">Keep going</button>
          </div>
        </div>
      </div>
    </div>
  `}function r(t,e){return t.querySelector(`#${e}`)}function Xe(t){return t.innerHTML=Ze(),{root:t,app:t.querySelector(".ff-app"),loader:r(t,"authLoader"),landingPage:r(t,"landingPage"),mainApp:r(t,"mainApp"),toastStack:r(t,"toastStack"),landingSignInButton:r(t,"landingSignInButton"),landingAccountToolbar:r(t,"landingAccountToolbar"),landingStreakBadge:r(t,"landingStreakBadge"),landingStreakValue:r(t,"landingStreakValue"),landingThemeToggleButton:r(t,"landingThemeToggleButton"),landingThemeButtonLabel:r(t,"landingThemeButtonLabel"),landingProfileButton:r(t,"landingProfileButton"),landingUserAvatar:r(t,"landingUserAvatar"),landingHeroAvatar:r(t,"landingHeroAvatar"),landingUserName:r(t,"landingUserName"),landingHeroTitle:r(t,"landingHeroTitle"),navAppButton:r(t,"navAppButton"),landingLoggedOut:r(t,"landingLoggedOut"),landingLoggedIn:r(t,"landingLoggedIn"),landingMemberMessage:r(t,"landingMemberMessage"),publicMinutesMetric:r(t,"publicMinutesMetric"),publicSessionMetric:r(t,"publicSessionMetric"),publicUserMetric:r(t,"publicUserMetric"),landingGoalProgress:r(t,"landingGoalProgress"),landingGoalFill:r(t,"landingGoalFill"),landingTodayMinutes:r(t,"landingTodayMinutes"),landingSessionCount:r(t,"landingSessionCount"),landingLevelName:r(t,"landingLevelName"),landingTotalScore:r(t,"landingTotalScore"),landingLeaderboard:r(t,"landingLeaderboard"),workspaceBanner:r(t,"workspaceBanner"),quoteBar:r(t,"quoteBar"),workspaceStreakBadge:r(t,"workspaceStreakBadge"),workspaceStreakValue:r(t,"workspaceStreakValue"),roomModeCountBadge:r(t,"roomModeCountBadge"),ownerDashButton:r(t,"ownerDashButton"),themeToggleButton:r(t,"themeToggleButton"),themeToggleThumb:r(t,"themeToggleThumb"),themeButtonLabel:r(t,"themeButtonLabel"),profileButton:r(t,"profileButton"),profileAvatar:r(t,"profileAvatar"),profileButtonName:r(t,"profileButtonName"),profilePanel:r(t,"profilePanel"),profilePanelAvatar:r(t,"profilePanelAvatar"),profilePanelName:r(t,"profilePanelName"),profilePanelEmail:r(t,"profilePanelEmail"),profilePanelLevel:r(t,"profilePanelLevel"),profilePanelStreak:r(t,"profilePanelStreak"),profilePanelSessions:r(t,"profilePanelSessions"),profilePanelHours:r(t,"profilePanelHours"),profilePanelScore:r(t,"profilePanelScore"),profileThemeLabel:r(t,"profileThemeLabel"),notificationLabel:r(t,"notificationLabel"),focusGoalInput:r(t,"focusGoalInput"),roomPanel:r(t,"roomPanel"),roomCodeInput:r(t,"roomCodeInput"),roomJoinInput:r(t,"roomJoinInput"),activeRoomLabel:r(t,"activeRoomLabel"),roomPresenceCount:r(t,"roomPresenceCount"),roomOwnerLabel:r(t,"roomOwnerLabel"),roomSyncLabel:r(t,"roomSyncLabel"),roomPresenceList:r(t,"roomPresenceList"),timerRing:r(t,"timerRing"),timerProgress:r(t,"timerProgress"),timerValue:r(t,"timerValue"),timerPercentLabel:r(t,"timerPercentLabel"),timerPhaseLabel:r(t,"timerPhaseLabel"),customDurationPanel:r(t,"customDurationPanel"),customMinutesInput:r(t,"customMinutesInput"),pomodoroButton:r(t,"pomodoroButton"),startButton:r(t,"startButton"),stopButton:r(t,"stopButton"),scoreRuleLabel:r(t,"scoreRuleLabel"),scorePenaltyLabel:r(t,"scorePenaltyLabel"),sessionModeDescription:r(t,"sessionModeDescription"),ambientTrackLabel:r(t,"ambientTrackLabel"),volumeInput:r(t,"volumeInput"),dailyGoalLabel:r(t,"dailyGoalLabel"),dailyGoalFill:r(t,"dailyGoalFill"),sessionSummary:r(t,"sessionSummary"),summaryHeadline:r(t,"summaryHeadline"),saveStateBadge:r(t,"saveStateBadge"),summaryTimeValue:r(t,"summaryTimeValue"),summaryDistractionValue:r(t,"summaryDistractionValue"),summaryScoreValue:r(t,"summaryScoreValue"),summaryFocusValue:r(t,"summaryFocusValue"),sessionFeedback:r(t,"sessionFeedback"),distractionLog:r(t,"distractionLog"),statsStreakValue:r(t,"statsStreakValue"),statsSessionValue:r(t,"statsSessionValue"),statsHoursValue:r(t,"statsHoursValue"),statsLevelValue:r(t,"statsLevelValue"),xpCurrentLabel:r(t,"xpCurrentLabel"),xpNextLabel:r(t,"xpNextLabel"),xpFill:r(t,"xpFill"),badgeCountLabel:r(t,"badgeCountLabel"),badgeList:r(t,"badgeList"),calendarToggleLabel:r(t,"calendarToggleLabel"),calendarMetaLabel:r(t,"calendarMetaLabel"),calendarSection:r(t,"calendarSection"),calendarMonthLabel:r(t,"calendarMonthLabel"),calendarNextButton:r(t,"calendarNextButton"),calendarLongestLabel:r(t,"calendarLongestLabel"),calendarMonthDaysLabel:r(t,"calendarMonthDaysLabel"),calendarGrid:r(t,"calendarGrid"),weekConsistencyLabel:r(t,"weekConsistencyLabel"),weekChart:r(t,"weekChart"),historySection:r(t,"historySection"),historyList:r(t,"historyList"),progressSection:r(t,"progressSection"),leaderboardSection:r(t,"leaderboardSection"),globalLeaderboard:r(t,"globalLeaderboard"),roomLeaderboard:r(t,"roomLeaderboard"),ownerDashboard:r(t,"ownerDashboard"),ownerRoomSelect:r(t,"ownerRoomSelect"),odTotalParticipants:r(t,"odTotalParticipants"),odFocusingCount:r(t,"odFocusingCount"),odDistractedCount:r(t,"odDistractedCount"),odLeftCount:r(t,"odLeftCount"),odParticipants:r(t,"odParticipants"),odEventLog:r(t,"odEventLog"),distractionModal:r(t,"distractionModal"),distractionModalText:r(t,"distractionModalText"),badgeModal:r(t,"badgeModal"),badgeModalTitle:r(t,"badgeModalTitle"),badgeModalText:r(t,"badgeModalText"),sessionModeButtons:[...t.querySelectorAll("[data-session-mode]")],modeButtons:[...t.querySelectorAll("[data-mode]")],durationButtons:[...t.querySelectorAll("[data-duration]")],soundButtons:[...t.querySelectorAll("[data-sound]")],boardButtons:[...t.querySelectorAll("[data-board]")]}}function ot(t){const e=Math.max(0,Math.floor(t)),o=Math.floor(e/60),a=e%60;return`${String(o).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function to(t){return t>=1e3?`${(t/1e3).toFixed(1)}k`:String(t)}function eo(t){return`${(t/60).toFixed(1)}h`}function oo(t,e){return`${t} ${e}${t===1?"":"s"}`}function Z(t=""){const[e=""]=t.trim().split(/\s+/).filter(Boolean);return e||"Workspace"}function x(t=""){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function ao(t,e=Date.now()){if(!t)return"just now";const o=Math.max(0,Math.floor((e-t)/1e3));if(o<60)return`${o}s ago`;const a=Math.floor(o/60);return a<60?`${a}m ago`:`${Math.floor(a/60)}h ago`}function no(t){const e=Math.max(0,Math.floor(t)),o=Math.floor(e/3600),a=Math.floor(e%3600/60),n=e%60;return o>0?`${o}:${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${a}:${String(n).padStart(2,"0")}`}const bt=["#2f6e57","#6b9f8a","#c17c5d","#5677a4","#8d6cb4","#bd8c2f","#397b7a","#a0576c"];function so(t=""){let e=0;for(let o=0;o<t.length;o+=1)e=(e<<5)-e+t.charCodeAt(o),e|=0;return Math.abs(e)}function Pt(t={}){const e=t.displayName||t.name||t.email||"User",o=t.uid||t.id||t.email||e,a=Z(e).slice(0,1).toUpperCase()||"U",n=bt[so(o)%bt.length];return{name:e,firstName:Z(e),letter:a,background:n,photoURL:t.photoURL||t.avatar||""}}function xt(t,e){const o=t.photoURL?`<img class="avatar__image" data-avatar-image alt="${x(e)}" src="${x(t.photoURL)}">`:"";return`
    <span class="avatar__fallback" aria-hidden="true">${x(t.letter)}</span>
    ${o}
  `}function It(t={},e={}){const o=Pt(t),a=e.sizeClass||"",n=e.extraClass||"",i=e.label||o.name;return`
    <span class="${["avatar",a,n].filter(Boolean).join(" ")}" data-avatar-root="true" style="--avatar-fallback:${o.background}">
      ${xt(o,i)}
    </span>
  `}function G(t,e={},o={}){if(!t)return;const a=Pt(e),n=o.label||a.name;t.style.setProperty("--avatar-fallback",a.background),t.setAttribute("aria-label",n),t.innerHTML=xt(a,n)}function io(t=document){t.querySelectorAll("img[data-avatar-image]").forEach(e=>{if(e.dataset.hydrated==="true")return;const o=()=>{e.dataset.loaded="true"},a=()=>{e.remove()};e.addEventListener("load",o,{once:!0}),e.addEventListener("error",a,{once:!0}),e.complete&&e.naturalWidth>0&&o(),e.dataset.hydrated="true"})}function ro(t,e){e.toastStack.innerHTML=t.map(o=>`
    <article class="toast toast--${o.type}">
      <div>
        <strong>${x(o.title)}</strong>
        <p>${x(o.message)}</p>
      </div>
      <button class="text-button" data-action="dismiss-toast" data-toast-id="${o.id}" type="button">Dismiss</button>
    </article>
  `).join("")}function lo(t,e){const o=!!t.auth.user;if(e.landingLoggedOut.hidden=o,e.landingLoggedIn.hidden=!o,e.landingAccountToolbar.hidden=!o,e.landingStreakBadge.hidden=!o,e.landingStreakValue.textContent=String(t.stats.streak),e.landingStreakBadge.dataset.active=t.stats.streak>0?"true":"false",e.publicMinutesMetric.textContent=to(t.publicStats.totalMinutes),e.publicSessionMetric.textContent=String(t.publicStats.totalSessions),e.publicUserMetric.textContent=String(t.publicStats.totalUsers),e.landingLeaderboard.innerHTML=t.leaderboards.landing.length?t.leaderboards.landing.map(d=>`
      <li>
        <span>#${d.rank}</span>
        <span>${x(d.name)}</span>
        <strong>${d.score} pts</strong>
      </li>
    `).join(""):'<li class="board-list__empty">No public scores yet.</li>',!o){e.profilePanel.hidden=!0;return}const a=Z(t.auth.user.displayName||t.auth.user.email||"Workspace");G(e.landingUserAvatar,t.auth.user,{}),G(e.landingHeroAvatar,t.auth.user,{}),G(e.profilePanelAvatar,t.auth.user),e.landingHeroTitle.textContent=`${a}, your next clean session is one click away.`,e.profilePanelName.textContent=t.auth.user.displayName||"FocusFlow",e.profilePanelEmail.textContent=t.auth.user.email||"",e.profilePanel.hidden=!t.ui.profileOpen;const n=kt(t.stats.totalMinutes),i=Math.min(100,Math.round(t.stats.todayMinutes/V*100));e.landingGoalProgress.textContent=`${t.stats.todayMinutes} / ${V} min`,e.landingGoalFill.style.width=`${i}%`,e.landingTodayMinutes.textContent=String(t.stats.todayMinutes),e.landingSessionCount.textContent=String(t.stats.totalSessions),e.landingLevelName.textContent=n.name,e.landingTotalScore.textContent=String(t.stats.totalScore),e.landingMemberMessage.textContent="Your recent progress is ready. Step back in and make the next session count."}function co(t,e){const o=t.route.view==="app"&&!!t.auth.user;e.mainApp.hidden=!o,e.landingPage.hidden=o,o&&(G(e.profileAvatar,t.auth.user,{}),G(e.profilePanelAvatar,t.auth.user),e.profilePanel.hidden=!t.ui.profileOpen,e.workspaceStreakValue.textContent=String(t.stats.streak),e.workspaceStreakBadge.hidden=!1,e.workspaceStreakBadge.dataset.active=t.stats.streak>0?"true":"false",e.roomModeCountBadge.hidden=t.room.mode!=="room"||t.room.activeCount<=0,e.roomModeCountBadge.textContent=String(t.room.activeCount))}function uo(t,e){var n;const o=t.timer.totalTime>0?t.timer.timeLeft/t.timer.totalTime:0;e.timerValue.textContent=ot(t.timer.timeLeft),e.timerPercentLabel.textContent=t.timer.running?`${Math.round(o*100)}%`:"Ready",e.timerPhaseLabel.textContent=t.timer.pomodoroEnabled?`${t.timer.pomodoroPhase==="work"?"Work":"Break"} phase`:t.timer.running?"In progress":"Ready",e.timerProgress.style.strokeDasharray=`${lt}`,e.timerProgress.style.strokeDashoffset=`${lt*(1-o)}`,e.timerProgress.classList.toggle("timer-ring__progress--danger",t.timer.running&&o<.1),e.timerRing.classList.toggle("session-starting",t.ui.focusPulse);const a=t.room.mode==="room"&&!!t.room.currentRoomId&&!!((n=t.auth.user)!=null&&n.uid)&&!!t.room.ownerUid&&t.room.ownerUid!==t.auth.user.uid;e.startButton.disabled=t.timer.running||a,e.stopButton.disabled=!t.timer.running||a,e.startButton.textContent=a?"Owner starts session":"Start session",e.sessionModeButtons.forEach(i=>{i.classList.toggle("is-active",i.dataset.sessionMode===t.timer.sessionMode)}),e.modeButtons.forEach(i=>{i.classList.toggle("is-active",i.dataset.mode===t.room.mode)}),e.durationButtons.forEach(i=>{i.classList.toggle("is-active",Number(i.dataset.duration)===t.timer.selectedDuration)}),e.pomodoroButton.classList.toggle("is-active",t.timer.pomodoroEnabled),e.scorePenaltyLabel.textContent=`Penalty: -${j[t.timer.sessionMode].penalty} per distraction, minimum score 0.`,e.sessionModeDescription.textContent=j[t.timer.sessionMode].description}function mo(t,e){var a,n;e.roomPanel.hidden=t.room.mode!=="room",e.roomCodeInput.value=t.room.draftRoomId,e.roomJoinInput.value=t.room.joinCode,e.activeRoomLabel.textContent=t.room.currentRoomId||"None",e.roomPresenceCount.textContent=oo(t.room.activeCount,"person"),e.roomOwnerLabel.textContent=t.room.ownerName||"Waiting",e.roomSyncLabel.textContent=(a=t.room.sessionControl)!=null&&a.status?`${t.room.sessionControl.status[0].toUpperCase()}${t.room.sessionControl.status.slice(1)}`:"Idle";const o=(n=t.auth.user)==null?void 0:n.uid;e.roomPresenceList.innerHTML=t.room.participants.length?t.room.participants.map(i=>`
      <div class="participant-pill${i.uid===o?" is-self":""}">
        ${It(i,{sizeClass:"avatar--tiny"})}
        <span>${x(i.name)}${i.uid===o?" (you)":""}</span>
      </div>
    `).join(""):'<p class="empty-copy">Nobody else is in this room yet.</p>'}function po(t,e){e.ambientTrackLabel.textContent=t.audio.trackLabel||"No track selected",e.volumeInput.value=String(t.audio.volume),e.soundButtons.forEach(o=>{o.classList.toggle("is-active",o.dataset.sound===t.audio.selectedCategory)})}function go(t,e){const o=kt(t.stats.totalMinutes),a=Math.min(100,Math.round(t.stats.todayMinutes/V*100)),n=new Set(t.stats.activityDays),i=re(),d=t.ui.calendarViewMonth,b=Y(),g=de(d),_=t.stats.activityDays[0]||null,f=g.filter(v=>v.type==="day"&&n.has(v.iso)).length;e.dailyGoalLabel.textContent=`${t.stats.todayMinutes} / ${V} min`,e.dailyGoalFill.style.width=`${a}%`,e.statsStreakValue.textContent=String(t.stats.streak),e.statsSessionValue.textContent=String(t.stats.totalSessions),e.statsHoursValue.textContent=eo(t.stats.totalMinutes),e.statsLevelValue.textContent=o.name,e.xpCurrentLabel.textContent=`${t.stats.totalMinutes} min`,e.xpNextLabel.textContent=Number.isFinite(o.next)?`Next: ${o.next} min`:"Top tier reached";const y=Number.isFinite(o.next)?o.next-o.min:1,C=Number.isFinite(o.next)?Math.min(100,Math.round((t.stats.totalMinutes-o.min)/y*100)):100;e.xpFill.style.width=`${C}%`,e.badgeCountLabel.textContent=`${t.stats.badges.length} / 13`,e.badgeList.innerHTML=t.stats.badges.length?t.stats.badges.map(v=>`<span class="badge${t.ui.highlightedBadgeId===v?" just-unlocked":""}">${x(v.replaceAll("_"," "))}</span>`).join(""):'<span class="badge badge--muted">No badges yet</span>',e.calendarToggleLabel.textContent=ut(d),e.calendarMetaLabel.textContent=`Best ${t.stats.longestStreak} days`,e.calendarMonthLabel.textContent=ut(d),e.calendarNextButton.disabled=d>=b,e.calendarLongestLabel.textContent=`Longest: ${t.stats.longestStreak}d`,e.calendarMonthDaysLabel.textContent=`This month: ${f} days`,e.calendarGrid.innerHTML=g.map(v=>{if(v.type==="empty")return'<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>';const u=v.iso===i,k=n.has(v.iso),L=v.iso>i,A=_?v.iso<_:!0;return`
      <div class="calendar-day${k?" is-done":""}${!k&&!L&&!A?" is-missed":""}${u?" is-today":""}${L||A?" is-muted":""}">
        <span>${v.dayNumber}</span>
        ${k?"<strong>&check;</strong>":"<strong></strong>"}
      </div>
    `}).join("");const D=Math.max(...t.stats.weekData,1);e.weekChart.innerHTML=t.stats.weekData.map((v,u)=>`
    <div class="week-chart__bar-wrap">
      <div class="week-chart__bar${u===new Date().getDay()?" is-today":""}" style="height:${Math.max(8,v/D*92)}px"></div>
      <span>${Xt[u]}</span>
    </div>
  `).join("");const w=t.stats.weekData.filter(v=>v>0).length;e.weekConsistencyLabel.textContent=`${Math.round(w/7*100)}% consistency`}function ho(t,e){const o=new Set(t.ui.expandedHistoryIds);e.historyList.innerHTML=t.history.length?t.history.map(a=>`
      <li class="history-item${o.has(a.id)?" expanded":""}" data-action="toggle-history-item" data-history-id="${a.id}" tabindex="0">
        <strong class="history-item__goal">${x(a.goal)}</strong>
        <span>${x(a.dateLabel)} - ${ot(a.timeSpent)} - ${a.distractions} distractions - ${a.score} pts</span>
        <div class="history-item__details">
          <span>Mode: ${x(a.sessionMode||"normal")}</span>
          <span>Distractions: ${a.distractions}</span>
          <span>Score: ${a.score} pts</span>
          <span>Penalty: -${a.penaltyTotal||0}</span>
        </div>
      </li>
    `).join(""):'<li class="history-item history-item--empty">No sessions yet. Start one to build history.</li>'}function bo(t,e){e.boardButtons.forEach(o=>{o.classList.toggle("is-active",o.dataset.board===t.ui.roomBoard)}),e.globalLeaderboard.hidden=t.ui.roomBoard!=="global",e.roomLeaderboard.hidden=t.ui.roomBoard!=="room",e.globalLeaderboard.innerHTML=t.leaderboards.global.length?t.leaderboards.global.map(o=>{var a;return`
      <li class="${o.id===((a=t.auth.user)==null?void 0:a.uid)?"is-mine":""}">
        <span>#${o.rank}</span>
        <span>${x(o.name)}</span>
        <strong>${o.score} pts</strong>
      </li>
    `}).join(""):'<li class="board-list__empty">No global entries yet.</li>',e.roomLeaderboard.innerHTML=t.room.currentRoomId?t.leaderboards.room.length?t.leaderboards.room.map(o=>{var a;return`
        <li class="${o.uid===((a=t.auth.user)==null?void 0:a.uid)?"is-mine":""}">
          <span>#${o.rank}</span>
          <span>${x(o.name)}</span>
          <strong>${o.score} pts</strong>
        </li>
      `}).join(""):'<li class="board-list__empty">No room scores yet.</li>':'<li class="board-list__empty">Join or create a room to see room standings.</li>'}function fo(t,e){const o=t.session.lastResult;if(e.sessionSummary.hidden=!o,!o)return;e.summaryHeadline.textContent=o.completed?"Session complete":"Session stopped",e.summaryTimeValue.textContent=ot(o.timeSpent),e.summaryDistractionValue.textContent=String(o.distractions),e.summaryScoreValue.textContent=String(o.score),e.summaryFocusValue.textContent=`${o.focusPercentage??Lt(o.timeSpent,o.penaltyTotal)}%`,e.saveStateBadge.textContent=t.session.saveState,e.saveStateBadge.className=`status-badge status-badge--${t.session.saveState}`;const a=me(o.distractions);e.sessionFeedback.textContent=ne[a][0],e.distractionLog.innerHTML=o.distractionLog.length?o.distractionLog.map(n=>`
      <div class="log-row">
        <span>${x(n.reason)}</span>
        <strong>${n.duration}s / -${n.penalty}</strong>
      </div>
    `).join(""):'<div class="log-row log-row--empty">No distractions recorded.</div>'}function yo(t,e){e.progressSection.hidden=!t.ui.sections.progress,e.historySection.hidden=!t.ui.sections.history,e.leaderboardSection.hidden=!t.ui.sections.leaderboard,e.calendarSection.hidden=!t.ui.sections.calendar}function vo(t,e){var o,a,n,i;e.workspaceBanner.hidden=!t.ui.banner,e.workspaceBanner.textContent=((o=t.ui.banner)==null?void 0:o.message)||"",e.workspaceBanner.className=`workspace-banner${t.ui.banner?` workspace-banner--${t.ui.banner.type}`:""}`,e.distractionModal.hidden=!t.ui.distractionModal,e.distractionModalText.textContent=((a=t.ui.distractionModal)==null?void 0:a.message)||"",e.badgeModal.hidden=!t.ui.badgeModal,e.badgeModalTitle.textContent=((n=t.ui.badgeModal)==null?void 0:n.title)||"Badge unlocked",e.badgeModalText.textContent=((i=t.ui.badgeModal)==null?void 0:i.message)||""}function wo(t,e){e.ownerDashboard.hidden=!t.ui.ownerDashboardOpen,e.ownerRoomSelect.innerHTML=t.owner.rooms.length?t.owner.rooms.map(o=>`<option value="${x(o.id)}"${o.id===t.owner.selectedRoomId?" selected":""}>${x(o.name)}</option>`).join(""):'<option value="">No active rooms</option>',e.odTotalParticipants.textContent=String(t.owner.summary.total),e.odFocusingCount.textContent=String(t.owner.summary.focusing),e.odDistractedCount.textContent=String(t.owner.summary.distracted),e.odLeftCount.textContent=String(t.owner.summary.left),e.odParticipants.innerHTML=t.owner.participants.length?t.owner.participants.map(o=>{const a=o.leftAt?{label:"Left",className:"is-left"}:o.distractedAt?{label:"Distracted",className:"is-distracted"}:o.focusing?{label:"Focusing",className:"is-focusing"}:{label:"Waiting",className:"is-waiting"},n=o.sessionStarted&&o.focusing?Math.max(0,Math.floor((t.ui.ownerNow-o.sessionStarted)/1e3)):0;return`
        <article class="owner-card ${a.className}">
          <div class="owner-card__header">
            ${It(o)}
            <div>
              <strong>${x(o.name)}</strong>
              <span class="owner-status-pill ${a.className}">${a.label}</span>
            </div>
          </div>
          <div class="owner-card__meta">
            <span class="owner-card__badge${o.distractionCount>0?" owner-card__badge--alert":""}">${o.distractionCount} distractions</span>
            <strong>${n?no(n):"00:00"}</strong>
          </div>
          <p class="owner-card__subtext">${o.leftAt?`Left ${ao(o.leftAt,t.ui.ownerNow)}`:o.awayDuration?`Away ${o.awayDuration}s`:"Listening for movement"}</p>
        </article>
      `}).join(""):'<p class="empty-copy">Select an active room to monitor presence.</p>',e.odEventLog.innerHTML=t.owner.eventLog.length?t.owner.eventLog.map(o=>`
      <div class="owner-log-row owner-log-row--${o.type}">
        <strong>${new Date(o.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</strong>
        <span>${x(o.message)}</span>
      </div>
    `).join(""):'<div class="owner-log-row"><span>Events will appear here.</span></div>'}function So(t,e){document.body.dataset.theme=t.ui.theme,e.themeToggleButton&&(e.themeToggleButton.dataset.theme=t.ui.theme),e.landingThemeToggleButton&&(e.landingThemeToggleButton.dataset.theme=t.ui.theme),e.themeButtonLabel&&(e.themeButtonLabel.textContent=t.ui.theme==="dark"?"Dark":"Light"),e.landingThemeButtonLabel&&(e.landingThemeButtonLabel.textContent=t.ui.theme==="dark"?"Dark":"Light"),e.profileThemeLabel&&(e.profileThemeLabel.textContent=t.ui.theme==="dark"?"Dark":"Light"),e.notificationLabel&&(e.notificationLabel.textContent=t.ui.notificationsEnabled?"On":"Off")}function _o(t,e){e.loader.classList.toggle("is-hidden",!t.auth.loading)}function Lo(t){return function(o){return _o(o,t),So(o,t),ro(o.ui.toasts,t),lo(o,t),co(o,t),uo(o,t),mo(o,t),po(o,t),go(o,t),ho(o,t),bo(o,t),fo(o,t),yo(o,t),vo(o,t),wo(o,t),t.quoteBar.textContent=o.ui.quote,document.title=o.route.view==="app"&&o.timer.running?`${t.timerValue.textContent} | ${qt}`:"FocusFlow | Deep work that feels intentional",io(t.root),o}}function ft(){var k;const t=document.querySelector("#app"),e=Xe(t);e.profilePanel&&((k=e.mainApp)!=null&&k.contains(e.profilePanel))&&e.root.appendChild(e.profilePanel);const o=Ye(Qe()),a=Lo(e),n=Ee({store:o}),i=Ue({store:o}),d=Fe({store:o,repository:O}),b=We({store:o,repository:O}),g=$e({store:o,feedback:n}),_=Ve({store:o,repository:O,feedback:n,leaderboards:d}),f=Oe({store:o,repository:O}),y=Je({store:o,feedback:n}),C=je({store:o,repository:O,timer:y,stats:b,rooms:_,leaderboards:d,audio:g,feedback:n}),D=Ie({store:o,repository:O,stats:b,leaderboards:d,rooms:_,profile:i,feedback:n});y.setHandlers({onToggleSession:C.toggleStartStop,onEscape:()=>{n.hideDistractionModal(),n.hideBadgeModal(),i.closeProfile(),f.closeDashboard()},onSessionFinished:C.handleTimerCompletion,onDistraction:({awaySeconds:L,distractionCount:A})=>{_.updatePresence({distractedAt:Date.now(),distractionCount:A,awayDuration:L}).catch(()=>{})},onDistractionCleared:()=>{_.updatePresence({distractedAt:0,awayDuration:0}).catch(()=>{})}}),_.setHandlers({onRemoteSessionStart:C.startRemoteSession,onRemoteSessionStop:C.stopRemoteSession});function w(L){o.setState(A=>{const S=new Set(A.ui.expandedHistoryIds);return S.has(L)?S.delete(L):S.add(L),{...A,ui:{...A.ui,expandedHistoryIds:[...S]}}})}function v(L){const A=o.getState().ui.calendarViewMonth,S=le(A,L),T=Y();S>T||o.setState(s=>({...s,ui:{...s.ui,calendarViewMonth:S}}))}function u(){var A,S,T;t.addEventListener("click",async s=>{var R;const l=s.target.closest("[data-action]");if(!l)return;const{action:h}=l.dataset;switch(h){case"sign-in":D.signIn();break;case"sign-out":D.signOut();break;case"go-app":o.getState().auth.user?D.openAppRoute():D.signIn();break;case"go-landing":if(o.getState().timer.running){n.notify({type:"warning",title:"Session still running",message:"Stop the current session before leaving the workspace."});return}D.openLandingRoute();break;case"scroll-live-board":(R=document.getElementById("live-board"))==null||R.scrollIntoView({behavior:"smooth",block:"start"});break;case"toggle-theme":i.toggleTheme();break;case"toggle-notifications":i.toggleNotifications();break;case"toggle-profile":i.toggleProfile();break;case"set-mode":await _.setMode(l.dataset.mode);break;case"set-session-mode":y.setSessionMode(l.dataset.sessionMode);break;case"set-duration":y.setDuration(Number(l.dataset.duration)),e.customDurationPanel.hidden=!0;break;case"toggle-custom-duration":e.customDurationPanel.hidden=!e.customDurationPanel.hidden;break;case"apply-custom-duration":y.applyCustomMinutes(e.customMinutesInput.value)?e.customDurationPanel.hidden=!0:n.notify({type:"warning",title:"Minutes required",message:"Enter a whole number greater than zero."});break;case"toggle-pomodoro":y.togglePomodoro();break;case"join-room":await _.joinRoom(e.roomCodeInput.value);break;case"join-room-code":await _.joinRoomByCode(e.roomJoinInput.value);break;case"create-room":await _.createRoom();break;case"copy-invite":await _.copyInvite();break;case"copy-room-code":await _.copyRoomCode();break;case"start-session":await C.startSession();break;case"stop-session":await C.stopSession();break;case"share-session":await C.shareLastSession();break;case"switch-board":o.setState(c=>({...c,ui:{...c.ui,roomBoard:l.dataset.board}}));break;case"toggle-section":{const c=l.dataset.section;o.setState(m=>({...m,ui:{...m.ui,sections:{...m.ui.sections,[c]:!m.ui.sections[c]}}}));break}case"calendar-prev":v(-1);break;case"calendar-next":v(1);break;case"toggle-history-item":w(l.dataset.historyId);break;case"open-owner-dashboard":f.openDashboard();break;case"close-owner-dashboard":f.closeDashboard();break;case"dismiss-toast":n.dismissToast(l.dataset.toastId);break;case"close-distraction-modal":n.hideDistractionModal();break;case"close-badge-modal":n.hideBadgeModal();break}}),e.focusGoalInput.addEventListener("input",s=>{o.setState(l=>({...l,session:{...l.session,focusGoal:s.target.value}}))}),e.roomCodeInput.addEventListener("input",s=>{_.syncRoomDraft(s.target.value.toUpperCase())}),e.roomJoinInput.addEventListener("input",s=>{_.syncJoinCode(s.target.value)}),e.roomJoinInput.addEventListener("keydown",async s=>{s.key==="Enter"&&(s.preventDefault(),await _.joinRoomByCode(s.target.value))}),e.ownerRoomSelect.addEventListener("change",s=>{f.loadOwnerRoom(s.target.value)}),e.volumeInput.addEventListener("input",s=>{g.setVolume(Number(s.target.value))}),e.soundButtons.forEach(s=>{s.addEventListener("click",()=>{g.toggleCategory(s.dataset.sound)})});const L=s=>{s.stopPropagation(),i.toggleProfile()};(A=e.profileButton)==null||A.addEventListener("click",L),(S=e.landingProfileButton)==null||S.addEventListener("click",L),(T=e.profilePanelAvatar)==null||T.addEventListener("click",L),document.addEventListener("click",s=>{var m,p,M;const l=(m=e.profileButton)==null?void 0:m.contains(s.target),h=(p=e.landingProfileButton)==null?void 0:p.contains(s.target),R=(M=e.ownerDashButton)==null?void 0:M.contains(s.target),c=s.target===e.ownerDashboard;!e.profilePanel.hidden&&!e.profilePanel.contains(s.target)&&!l&&!h&&i.closeProfile(),!e.ownerDashboard.hidden&&c&&!R&&f.closeDashboard()})}u(),y.bindAttentionTracking(),o.subscribe(a),a(o.getState()),d.startLanding(),d.startGlobal(),d.refreshPublicStats().catch(()=>{}),D.init()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ft,{once:!0}):ft();
