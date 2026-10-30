import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const app = express();
const PORT = Number(process.env.PORT || 8080);
const DATA = process.env.DATA_DIR || "./data";
const INPUTS = path.join(DATA, "inputs");
const OUTPUTS = path.join(DATA, "outputs");
const VOICES = path.join(DATA, "voice-samples");
await Promise.all([mkdir(INPUTS,{recursive:true}),mkdir(OUTPUTS,{recursive:true}),mkdir(VOICES,{recursive:true})]);
app.use(helmet({crossOriginResourcePolicy:{policy:"cross-origin"}}));
app.use(cors({origin:process.env.CORS_ORIGIN?.split(",") || true}));
app.use(express.json({limit:"1mb"}));
const upload = multer({dest:INPUTS,limits:{fileSize:150*1024*1024},fileFilter(_req,file,cb){cb(null,/^audio\//i.test(file.mimetype) || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file.originalname));}});
const tracks = new Map();
const jobs = new Map();
const safeName = s => String(s||"audio").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,90);
function run(bin,args){return new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:["ignore","ignore","pipe"]});let err="";p.stderr.on("data",d=>err+=d.toString());p.on("error",reject);p.on("close",code=>code===0?resolve():reject(new Error(err.slice(-1800)||bin+" exit "+code)));});}
function jobStart(id){jobs.set(id,{id,status:"running",createdAt:new Date().toISOString()});}
function jobDone(id,output){jobs.set(id,{...jobs.get(id),status:"succeeded",outputUrl:output,finishedAt:new Date().toISOString()});}
function jobFail(id,error){jobs.set(id,{...jobs.get(id),status:"failed",error:String(error).slice(0,500),finishedAt:new Date().toISOString()});}
const EFFECTS = {
 "Afinación vocal": "rubberband=pitch=1.0:formant=preserved",
 "EQ paramétrico": "equalizer=f=180:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1:g=2",
 "Compresor": "acompressor=threshold=0.12:ratio=3:attack=15:release=180:makeup=1.5",
 "Compresión multibanda": "mcompand=attacks=0.01:decays=0.2:points=-80/-80|-18/-12|0/-2",
 "De-esser": "deesser=i=0.55:m=0.5:f=0.5",
 "Gate / Expander": "agate=threshold=0.015:ratio=2:attack=10:release=150",
 "Reverb de placa": "aecho=0.82:0.72:35|65|95|125:0.22|0.18|0.13|0.09",
 "Reverb de sala": "aecho=0.85:0.68:22|38|57|78:0.24|0.18|0.12|0.08",
 "Reverb Hall": "aecho=0.82:0.76:48|83|121|170|225:0.28|0.22|0.16|0.12|0.08",
 "Reverb Catedral": "aecho=0.8:0.82:75|130|195|270|360|470:0.30|0.25|0.21|0.17|0.13|0.09",
 "Echo Slapback": "aecho=0.85:0.45:95:0.32",
 "Echo Ping-pong": "aecho=0.8:0.68:180|360|540:0.36|0.22|0.12",
 "Delay estéreo": "aecho=0.85:0.55:220|440:0.32|0.18",
 "Chorus": "chorus=0.7:0.9:55:0.4:0.25:2",
 "Flanger": "flanger=delay=3:depth=5:regen=25:width=70:speed=0.25",
 "Phaser": "aphaser=in_gain=0.7:out_gain=0.8:delay=3:decay=0.4:speed=0.35",
 "Saturación analógica": "asoftclip=type=atan:threshold=0.8:output=0.95",
 "Distorsión armónica": "asoftclip=type=hard:threshold=0.65:output=0.85",
 "Exciter": "treble=g=2:f=6500:w=0.7",
 "Doblador vocal": "chorus=0.6:0.8:45:0.25:0.3:2",
 "Reducción de ruido": "afftdn=nf=-25",
 "Limitador": "alimiter=limit=0.92:attack=5:release=50",
 "Stereo widener": "stereowiden=delay=15:feedback=0.25:crossfeed=0.25:drymix=0.8",
 "Control de transientes": "acompressor=threshold=0.18:ratio=2:attack=5:release=90"
};
const PRESETS = {
 "Lead vocal": ["Afinación vocal","EQ paramétrico","Compresor","De-esser","Reverb de sala","Limitador"],
 "Rap / Trap": ["Afinación vocal","EQ paramétrico","Compresor","De-esser","Delay estéreo","Stereo widener","Limitador"],
 "Cumbia potente": ["EQ paramétrico","Compresor","De-esser","Reverb de placa","Echo Slapback","Limitador"],
 "Reggaetón moderno": ["Afinación vocal","EQ paramétrico","Compresor","De-esser","Delay estéreo","Reverb de placa","Limitador"],
 "Pop brillante": ["EQ paramétrico","Compresor","De-esser","Chorus","Reverb Hall","Exciter","Limitador"],
 "Rock agresivo": ["EQ paramétrico","Compresión multibanda","Saturación analógica","Stereo widener","Limitador"],
 "Voz cálida": ["EQ paramétrico","Compresor","Reverb de sala","Exciter","Limitador"],
 "Balada íntima": ["EQ paramétrico","Compresor","Reverb Hall","Delay estéreo","Limitador"],
 "Voz aireada": ["EQ paramétrico","De-esser","Chorus","Reverb de placa","Exciter"],
 "Radio / Broadcast": ["Gate / Expander","EQ paramétrico","Compresor","De-esser","Limitador"],
 "Doblaje ancho": ["EQ paramétrico","Compresor","Doblador vocal","Stereo widener","Reverb de sala"],
 "Vocoder creativo": ["Chorus","Phaser","Delay estéreo","Stereo widener"]
};
app.get("/health",(_req,res)=>res.json({ok:true,engine:"ffmpeg-dsp",effects:Object.keys(EFFECTS),presets:Object.keys(PRESETS)}));
app.post("/v1/voice-samples",upload.single("audio"),async(req,res)=>{if(!req.file)return res.status(400).json({error:"Falta el archivo de voz."});if(req.body?.consent!=="true"){return res.status(400).json({error:"Se requiere consentimiento explícito para guardar la muestra vocal."});}const id=randomUUID();const dest=path.join(VOICES,id+"-"+safeName(req.file.originalname));await writeFile(dest,await readFile(req.file.path));res.status(201).json({id,status:"stored_private"});});
app.post("/v1/studio/tracks",upload.single("audio"),async(req,res)=>{if(!req.file)return res.status(400).json({error:"Falta el audio."});const id=randomUUID();const dest=path.join(INPUTS,id+"-"+safeName(req.file.originalname));await writeFile(dest,await readFile(req.file.path));tracks.set(id,{id,path:dest,name:safeName(req.file.originalname)});res.status(201).json({id,status:"uploaded"});});
app.post("/v1/studio/vocal-effects",async(req,res)=>{const {trackId,effects=[],preset="Lead vocal"}=req.body||{};const track=tracks.get(trackId);if(!track)return res.status(404).json({error:"Pista no encontrada."});const selected=Array.isArray(effects)&&effects.length?effects:(PRESETS[preset]||PRESETS["Lead vocal"]);const unknown=selected.filter(x=>!EFFECTS[x]);if(unknown.length)return res.status(422).json({error:"Efectos sin motor configurado: "+unknown.join(", ")});const id=randomUUID();jobStart(id);res.status(202).json({id,status:"running"});(async()=>{try{const out=path.join(OUTPUTS,id+".wav");const filters=selected.map(x=>EFFECTS[x]);filters.push("loudnorm=I=-16:TP=-1.5:LRA=11");await run(process.env.FFMPEG_PATH||"ffmpeg",["-y","-i",track.path,"-vn","-af",filters.join(","),"-ar","48000","-c:a","pcm_s24le",out]);jobDone(id,"/v1/jobs/"+id+"/download");}catch(e){jobFail(id,e.message);}})();});
app.post("/v1/studio/separate",async(req,res)=>{const {trackId}=req.body||{};const track=tracks.get(trackId);if(!track)return res.status(404).json({error:"Pista no encontrada."});if(!process.env.SEPARATOR_API_URL||!process.env.SEPARATOR_API_KEY)return res.status(503).json({error:"Falta configurar un proveedor de separación de stems. El motor DSP local sí está disponible."});return res.status(501).json({error:"El adaptador de separación requiere configurar almacenamiento HTTPS público y el contrato del proveedor elegido."});});
app.get("/v1/jobs/:id", (req,res)=>{const job=jobs.get(req.params.id);if(!job)return res.status(404).json({error:"Trabajo no encontrado."});res.json(job);});
app.get("/v1/jobs/:id/download",async(req,res)=>{const file=path.join(OUTPUTS,req.params.id+".wav");try{await stat(file);res.download(file,req.params.id+".wav");}catch{res.status(404).json({error:"El audio procesado todavía no está disponible."});}});
app.post("/v1/songs",async(req,res)=>{if(!process.env.ELEVENLABS_API_KEY)return res.status(503).json({error:"Falta ELEVENLABS_API_KEY en el servidor. La generación musical todavía no está activada."});const {prompt="",lyrics="",genre="Pop",language="Español",instrumental=false}=req.body||{};if(!prompt.trim()&&!lyrics.trim())return res.status(400).json({error:"Escribí una descripción o letra."});const id=randomUUID();const composed=[prompt,genre,language,lyrics?("Letra que debe orientar la canción: "+lyrics):""].filter(Boolean).join(". ");const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",{method:"POST",headers:{"xi-api-key":process.env.ELEVENLABS_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({prompt:composed,model_id:process.env.ELEVENLABS_MUSIC_MODEL||"music_v2_5",music_length_ms:180000,force_instrumental:Boolean(instrumental)})});if(!response.ok)return res.status(502).json({error:"El proveedor musical respondió "+response.status+": "+(await response.text()).slice(0,500)});const bytes=Buffer.from(await response.arrayBuffer());const out=path.join(OUTPUTS,id+".mp3");await writeFile(out,bytes);res.status(201).json({id,title:"Nueva canción",status:"succeeded",audioUrl:"/v1/songs/"+id+"/download"});});
app.get("/v1/songs/:id/download",async(req,res)=>{const file=path.join(OUTPUTS,req.params.id+".mp3");try{await stat(file);res.download(file,req.params.id+".mp3");}catch{res.status(404).json({error:"Canción no encontrada."});}});
app.listen(PORT,()=>console.log("SixSeven Music audio backend listening on "+PORT));
