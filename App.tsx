import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View
} from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { createSong, uploadVoiceSample, uploadStudioTrack, separateStems, processVocal, getStudioJob, type SongRequest } from "./src/services/api";

type Tab = "create" | "voice" | "studio" | "library";
type Song = { id: string; title: string; style: string; status: string; audioUrl?: string };

const PURPLE = "#A78BFA";
const muted = "#AAA3BB";

export default function App() {
  const [tab, setTab] = useState<Tab>("create");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [language, setLanguage] = useState("Español");
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [studioTrack, setStudioTrack] = useState<{uri:string;name:string;mimeType?:string}|null>(null);
  const [studioBusy, setStudioBusy] = useState(false);
  const [effects, setEffects] = useState<string[]>(["EQ paramétrico", "Compresor"]);
  const [preset, setPreset] = useState("Lead vocal");
  const [message, setMessage] = useState("Tu estudio musical está listo para empezar.");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso de micrófono", "Necesitamos permiso para grabar tu propia voz.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: true, playThroughEarpieceAndroid: false });
      const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = result.recording;
      setRecording(result.recording);
      setSeconds(0);
      setMessage("Grabando tu voz. Busca un lugar silencioso y canta o habla con naturalidad.");
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed += 1;
        setSeconds(Math.min(elapsed, 60));
        if (elapsed >= 60) void stopRecording();
      }, 1000);
    } catch (error) {
      Alert.alert("No se pudo iniciar", error instanceof Error ? error.message : "Error al acceder al micrófono.");
    }
  };

  const stopRecording = async () => {
    const current = recordingRef.current;
    if (!current) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    try {
      await current.stopAndUnloadAsync();
      const uri = current.getURI();
      if (uri) setVoiceUri(uri);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsIn silentModeIOS: true });
      setRecording(null);
      recordingRef.current = null;
      setMessage(uri ? "Muestra de voz guardada en este dispositivo. Todavía no se ha enviado a ningún servidor." : "No se pudo guardar la grabación.");
    } catch (error) {
      setRecording(null);
      recordingRef.current = null;
      Alert.alert("Error al guardar", error instanceof Error ? error.message : "No se pudo finalizar la grabación.");
    }
  };

  const sendVoiceSample = async () => {
    if (!voiceUri) return;
    setUploadBusy(true);
    try {
      await uploadVoiceSample(voiceUri);
      setMessage("La muestra fue enviada al servidor configurado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo enviar la muestra. Configurá el backend.");
    } finally {
      setUploadBusy(false);
    }
  };

  const pickStudioTrack = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["audio/*"], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setStudioTrack({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setMessage("Audio seleccionado: " + asset.name);
    } catch (error) {
      Alert.alert("No se pudo abrir el audio", error instanceof Error ? error.message : "Error al seleccionar el archivo.");
    }
  };

  const runStudioAction = async (action: "separate" | "effect") => {
    if (!studioTrack) {
      Alert.alert("Elegí un audio", "Primero importá una canción o una grabación desde tu teléfono.");
      return;
    }
    setStudioBusy(true);
    try {
      const uploaded = await uploadStudioTrack(studioTrack.uri, studioTrack.name, studioTrack.mimeType);
      if (action === "separate") {
        const result = await separateStems(uploaded.id);
        setMessage("Separación solicitada. Trabajo: " + (result.status || "en cola"));
      } else {
        const result = await processVocal(uploaded.id, { effects, preset });
        if (!result.id) throw new Error("El servidor no devolvió un identificador de trabajo.");
        setMessage("Procesando tu cadena profesional de efectos…");
        let completed = false;
        for (let attempt = 0; attempt < 90; attempt += 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const job = await getStudioJob(result.id);
          if (job.status === "succeeded") {
            setMessage("¡Procesamiento terminado! Tu WAV está disponible en: " + (job.outputUrl || "la biblioteca del servidor"));
            completed = true;
            break;
          }
          if (job.status === "failed") throw new Error(job.error || "El motor DSP no pudo procesar este audio.");
        }
        if (!completed) setMessage("El procesamiento sigue en curso. Podés consultar el trabajo " + result.id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo procesar el audio. Revisá la conexión del backend.");
    } finally {
      setStudioBusy(false);
    }
  };

  const generate = async () => {
    if (!prompt.trim() && !lyrics.trim()) {
      Alert.alert("Falta tu idea", "Escribí una descripción musical o una letra para empezar.");
      return;
    }
    const request: SongRequest = { prompt: prompt.trim(), lyrics: lyrics.trim(), genre, language, voiceSampleAvailable: Boolean(voiceUri) };
    setBusy(true);
    setMessage("Enviando tu proyecto al motor musical…");
    try {
      const result = await createSong(request);
      const item: Song = { id: result.id, title: result.title || "Mi nueva canción", style: genre, status: result.status || "En proceso", audioUrl: result.audioUrl };
      setSongs(current => [item, ...current]);
      setMessage("Solicitud recibida. Estado: " + item.status);
      setTab("library");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo conectar con el motor musical.");
    } finally {
      setBusy(false);
    }
  };

  const NavButton = ({ id, label, icon }: { id: Tab; label: string; icon: string }) => (
    <Pressable onPress={() => setTab(id)} style={styles.navItem}>
      <Text style={[styles.navIcon, tab === id && styles.navActive]}>{icon}</Text>
      <Text style={[styles.navLabel, tab === id && styles.navActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#090711" />
      <View style={styles.header}>
        <View><Text style={styles.brand}>SIXSEVEN</Text><Text style={styles.brandSub}>MUSIC STUDIO</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>♪</Text></View>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {tab === "create" && <>
            <Text style={styles.eyebrow}>TU ESTUDIO CREATIVO</Text>
            <Text style={styles.heading}>Convertí una idea{"\n"}en una canción.</Text>
            <Text style={styles.subheading}>Describí el sonido que imaginás. SixSeven Music prepara tu proyecto.</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>¿QUÉ QUERÉS CREAR?</Text>
              <TextInput value={prompt} onChangeText={setPrompt} placeholder="Ej.: una balada pop emotiva, con piano y guitarra…" placeholderTextColor="#756D85" multiline style={styles.textArea} />
              <Text style={styles.fieldLabel}>ESTILO MUSICAL</Text>
              <View style={styles.chips}>{["Pop", "Rock", "Cumbia", "Trap", "Reggaetón", "Balada"].map(x => <Pressable key={x} onPress={() => setGenre(x)} style={[styles.chip, genre === x && styles.chipSelected]}><Text style={[styles.chipText, genre === x && styles.chipTextSelected]}>{x}</Text></Pressable>)}</View>
              <Text style={styles.fieldLabel}>IDIOMA</Text>
              <View style={styles.chips}>{["Español", "Inglés", "Portugués"].map(x => <Pressable key={x} onPress={() => setLanguage(x)} style={[styles.chip, language === x && styles.chipSelected]}><Text style={[styles.chipText, language === x && styles.chipTextSelected]}>{x}</Text></Pressable>)}</View>
              <Text style={styles.fieldLabel}>LETRA (OPCIONAL)</Text>
              <TextInput value={lyrics} onChangeText={setLyrics} placeholder="Escribí tu letra o pegá una que hayas creado…" placeholderTextColor="#756D85" multiline style={[styles.textArea, styles.lyrics]} />
              <Pressable disabled={busy} onPress={generate} style={[styles.primaryButton, busy && styles.disabled]}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>✦  CREAR CANCIÓN</Text>}
              </Pressable>
              <Text style={styles.hint}>La generación se activa al configurar un proveedor musical en el backend.</Text>
            </View>
            <Pressable onPress={() => setTab("voice")} style={styles.voiceBanner}>
              <View style={styles.voiceOrb}><Text style={styles.voiceOrbText}>♫</Text></View>
              <View style={styles.flex}><Text style={styles.bannerTitle}>Mi voz, mi identidad</Text><Text style={styles.bannerSub}>Grabá una muestra de hasta 60 segundos</Text></View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          </>}

          {tab === "voice" && <>
            <Text style={styles.eyebrow}>PERFIL VOCAL</Text>
            <Text style={styles.heading}>Tu voz es{"\n"}única.</Text>
            <Text style={styles.subheading}>Grabá una muestra limpia para preparar un perfil vocal propio. Solo se utilizará con tu autorización.</Text>
            <View style={styles.recordCard}>
              <View style={[styles.micCircle, recording && styles.micRecording]}><Text style={styles.mic}>🎙</Text></View>
              <Text style={styles.recordTime}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</Text>
              <Text style={styles.recordCaption}>{recording ? "GRABACIÓN EN CURSO" : voiceUri ? "MUESTRA GRABADA EN ESTE DISPOSITIVO" : "MÁXIMO 60 SEGUNDOS"}</Text>
              <Pressable onPress={recording ? stopRecording : startRecording} style={[styles.primaryButton, recording && styles.stopButton]}>
                <Text style={styles.primaryText}>{recording ? "■  DETENER GRABACIÓN" : voiceUri ? "↻  GRABAR OTRA VEZ" : "●  COMENZAR A GRABAR"}</Text>
              </Pressable>
              {voiceUri && !recording && <Pressable disabled={uploadBusy} onPress={sendVoiceSample} style={styles.secondaryButton}>{uploadBusy ? <ActivityIndicator color={PURPLE}/> : <Text style={styles.secondaryText}>↑  ENVIAR MUESTRA AL BACKEND</Text>}</Pressable>}
            </View>
            <View style={styles.notice}><Text style={styles.noticeTitle}>Privacidad de tu voz</Text><Text style={styles.noticeText}>La grabación queda primero en tu teléfono. No se crea un clon automáticamente. El envío requiere que vos lo solicites y un backend seguro configurado. Usá únicamente tu voz o una voz con autorización.</Text></View>
          </>}

          {tab === "studio" && <>
            <Text style={styles.eyebrow}>ESTUDIO DE AUDIO</Text>
            <Text style={styles.heading}>Dale forma a{"\n"}tu sonido.</Text>
            <Text style={styles.subheading}>Importá una pista para trabajar la voz, separar instrumental y voz, y preparar una mezcla con efectos.</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>TU ARCHIVO DE AUDIO</Text>
              <Pressable onPress={pickStudioTrack} style={styles.importButton}>
                <Text style={styles.importIcon}>＋</Text>
                <Text style={styles.importTitle}>{studioTrack ? "Cambiar archivo" : "Importar audio del teléfono"}</Text>
                <Text style={styles.importSub}>MP3, WAV, M4A y formatos compatibles</Text>
              </Pressable>
              {studioTrack && <View style={styles.selectedTrack}><Text style={styles.trackIcon}>♫</Text><View style={styles.flex}><Text numberOfLines={1} style={styles.songTitle}>{studioTrack.name}</Text><Text style={styles.songMeta}>Archivo seleccionado en este dispositivo</Text></View></View>}
            </View>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>SEPARACIÓN DE PISTAS</Text>
              <Text style={styles.toolTitle}>Voz + instrumental</Text>
              <Text style={styles.toolDescription}>Separá una canción en pistas independientes para trabajar la voz o quedarte con la base instrumental. Requiere un servicio de separación de stems conectado.</Text>
              <Pressable disabled={studioBusy} onPress={() => runStudioAction("separate")} style={[styles.primaryButton,studioBusy && styles.disabled]}>{studioBusy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.primaryText}>⇄  SEPARAR VOZ E INSTRUMENTAL</Text>}</Pressable>
            </View>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>PROCESAMIENTO VOCAL</Text>
              <Text style={styles.toolTitle}>Efectos de estudio</Text>
              <Text style={styles.toolDescription}>Elegí un efecto principal y un preset de mezcla. La cadena se aplica con filtros DSP reales del motor FFmpeg del servidor. Afinación automática avanzada, armonizador y vocoder requieren módulos especializados adicionales.</Text>
              <Text style={styles.fieldLabel}>CADENA PROFESIONAL · SELECCIONÁ VARIOS</Text>
              <Text style={styles.toolDescription}>Activá los módulos que quieras combinar. El orden y los parámetros definitivos los aplica el procesador del servidor.</Text>
              <View style={styles.chips}>{["EQ paramétrico","Compresor","De-esser","Gate / Expander","Reverb de placa","Reverb de sala","Reverb Hall","Reverb Catedral","Echo Slapback","Echo Ping-pong","Delay estéreo","Chorus","Flanger","Phaser","Saturación analógica","Distorsión armónica","Exciter","Doblador vocal","Reducción de ruido","Limitador","Compresión multibanda","Stereo widener","Control de transientes"].map(x => <Pressable key={x} onPress={() => setEffects(current => current.includes(x) ? current.filter(v => v !== x) : [...current, x])} style={[styles.chip,effects.includes(x) && styles.chipSelected]}><Text style={[styles.chipText,effects.includes(x) && styles.chipTextSelected]}>{effects.includes(x) ? "✓ " : "+ "}{x}</Text></Pressable>)}</View>
              <Text style={styles.fieldLabel}>PRESET / CADENA INICIAL</Text>
              <View style={styles.chips}>{["Lead vocal","Rap / Trap","Cumbia potente","Reggaetón moderno","Pop brillante","Rock agresivo","Voz cálida","Balada íntima","Voz aireada","Radio / Broadcast","Doblaje ancho","Vocoder creativo"].map(x => <Pressable key={x} onPress={() => setPreset(x)} style={[styles.chip,preset===x && styles.chipSelected]}><Text style={[styles.chipText,preset===x && styles.chipTextSelected]}>{x}</Text></Pressable>)}</View>
              <Text style={styles.hint}>{effects.length} módulos seleccionados · {preset}</Text>
              <Pressable disabled={studioBusy || effects.length===0} onPress={() => runStudioAction("effect")} style={[styles.primaryButton,(studioBusy || effects.length===0) && styles.disabled]}>{studioBusy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.primaryText}>✦  PROCESAR CADENA VOCAL</Text>}</Pressable>
            </View>
            <View style={styles.notice}><Text style={styles.noticeTitle}>Herramientas incluidas en el diseño</Text><Text style={styles.noticeText}>Afinación vocal, EQ paramétrico, compresión multibanda, de-esser, gate, reverbs, delays estéreo, modulación, saturación, exciter, armonizador, vocoder, reducción de ruido, limitador, expansión estéreo y separación de stems. Los nombres describen funciones de audio habituales; no se copian marcas, interfaces ni efectos propietarios de Voloco.</Text></View>
          </>}

          {tab === "library" && <>
            <Text style={styles.eyebrow}>TU COLECCIÓN</Text>
            <Text style={styles.heading}>Mis canciones.</Text>
            <Text style={styles.subheading}>Tus proyectos y generaciones aparecerán acá.</Text>
            {songs.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>♫</Text><Text style={styles.emptyTitle}>Todavía no hay canciones</Text><Text style={styles.emptySub}>Cuando conectemos el motor musical, tus creaciones aparecerán en esta biblioteca.</Text><Pressable onPress={() => setTab("create")} style={styles.secondaryButton}><Text style={styles.secondaryText}>＋  CREAR MI PRIMERA CANCIÓN</Text></Pressable></View> : songs.map(song => <View key={song.id} style={styles.songRow}><View style={styles.songIcon}><Text style={styles.songIconText}>♫</Text></View><View style={styles.flex}><Text style={styles.songTitle}>{song.title}</Text><Text style={styles.songMeta}>{song.style} · {song.status}</Text></View></View>)}
          </>}
          <View style={styles.statusBox}><View style={styles.statusDot}/><Text style={styles.statusText}>{message}</Text></View>
          <Text style={styles.footer}>SIXSEVEN MUSIC · TU VOZ, TU MÚSICA</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.bottomNav}>
        <NavButton id="create" label="Crear" icon="✦" />
        <NavButton id="voice" label="Mi voz" icon="◉" />
        <NavButton id="studio" label="Estudio" icon="♫" />
        <NavButton id="library" label="Biblioteca" icon="♫" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#090711"},flex:{flex:1},
  importButton:{minHeight:112,borderWidth:1,borderStyle:"dashed",borderColor:"#7656A8",borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:"#100D18",padding:15},importIcon:{color:PURPLE,fontSize:28},importTitle:{color:"#FFFFFF",fontSize:14,fontWeight:"800",marginTop:5},importSub:{color:muted,fontSize:10,marginTop:5},selectedTrack:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#211832",borderRadius:13,padding:12,marginTop:12},trackIcon:{fontSize:25,color:PURPLE},toolTitle:{color:"#FFFFFF",fontSize:18,fontWeight:"900"},toolDescription:{color:muted,fontSize:12,lineHeight:19,marginTop:7},
  header:{height:68,paddingHorizontal:22,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"#211B30"},
  brand:{color:"#FFFFFF",fontSize:17,fontWeight:"900",letterSpacing:3},brandSub:{color:PURPLE,fontSize:9,letterSpacing:3,marginTop:2,fontWeight:"800"},
  avatar:{width:38,height:38,borderRadius:14,backgroundColor:"#211832",borderWidth:1,borderColor:"#51406F",alignItems:"center",justifyContent:"center"},avatarText:{color:PURPLE,fontSize:22},
  content:{padding:22,paddingBottom:28},eyebrow:{color:PURPLE,fontSize:10,fontWeight:"900",letterSpacing:2,marginTop:10},
  heading:{color:"#FFFFFF",fontSize:34,fontWeight:"900",lineHeight:39,marginTop:12},subheading:{color:muted,fontSize:14,lineHeight:21,marginTop:12,marginBottom:22},
  card:{backgroundColor:"#15111F",borderWidth:1,borderColor:"#302640",borderRadius:22,padding:18},
  fieldLabel:{color:"#B8A9D4",fontSize:10,fontWeight:"900",letterSpacing:1.5,marginTop:15,marginBottom:10},
  textArea:{minHeight:86,textAlignVertical:"top",borderRadius:13,backgroundColor:"#0D0A14",borderWidth:1,borderColor:"#342A45",padding:13,color:"#FFFFFF",fontSize:14,lineHeight:21},
  lyrics:{minHeight:112},chips:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{borderRadius:20,borderWidth:1,borderColor:"#3B304D",paddingHorizontal:13,paddingVertical:9,backgroundColor:"#100D18"},
  chipSelected:{backgroundColor:"#38245E",borderColor:PURPLE},chipText:{color:"#B9B1C6",fontSize:12,fontWeight:"600"},chipTextSelected:{color:"#FFFFFF"},
  primaryButton:{minHeight:52,backgroundColor:"#8054D8",borderRadius:15,alignItems:"center",justifyContent:"center",marginTop:22,paddingHorizontal:12},primaryText:{color:"#FFFFFF",fontSize:13,fontWeight:"900",letterSpacing:1},
  disabled:{opacity:0.55},hint:{color:"#7F778C",fontSize:10,lineHeight:15,textAlign:"center",marginTop:11},
  voiceBanner:{marginTop:16,padding:15,borderRadius:18,backgroundColor:"#191326",borderWidth:1,borderColor:"#49366B",flexDirection:"row",alignItems:"center",gap:13},
  voiceOrb:{width:44,height:44,borderRadius:15,backgroundColor:"#3A2860",alignItems:"center",justifyContent:"center"},voiceOrbText:{color:"#D8C7FF",fontSize:23},
  bannerTitle:{color:"#FFFFFF",fontSize:14,fontWeight:"800"},bannerSub:{color:muted,fontSize:11,marginTop:4},arrow:{color:PURPLE,fontSize:28},
  recordCard:{backgroundColor:"#15111F",borderWidth:1,borderColor:"#49366B",borderRadius:24,padding:24,alignItems:"center",marginTop:8},
  micCircle:{width:116,height:116,borderRadius:58,backgroundColor:"#2A1D43",borderWidth:1,borderColor:"#8660CB",alignItems:"center",justifyContent:"center"},micRecording:{backgroundColor:"#51223F",borderColor:"#FF6B9C"},mic:{fontSize:42},
  recordTime:{color:"#FFFFFF",fontSize:40,fontWeight:"800",fontVariant:["tabular-nums"],marginTop:20},recordCaption:{color:PURPLE,fontSize:10,fontWeight:"900",letterSpacing:1.5,marginTop:5,marginBottom:12},
  stopButton:{backgroundColor:"#A43F6A",width:"100%"},secondaryButton:{minHeight:48,borderWidth:1,borderColor:"#7656A8",borderRadius:14,alignItems:"center",justifyContent:"center",paddingHorizontal:12,marginTop:12,width:"100%"},
  secondaryText:{color:"#D4C1FF",fontSize:12,fontWeight:"800",letterSpacing:0.5},
  notice:{backgroundColor:"#15111F",borderRadius:16,padding:16,marginTop:16,borderLeftWidth:3,borderLeftColor:PURPLE},noticeTitle:{color:"#FFFFFF",fontSize:13,fontWeight:"800"},noticeText:{color:muted,fontSize:12,lineHeight:19,marginTop:7},
  empty:{backgroundColor:"#15111F",borderRadius:22,padding:24,alignItems:"center",marginTop:10,borderWidth:1,borderColor:"#302640"},emptyIcon:{fontSize:42,color:PURPLE},emptyTitle:{color:"#FFFFFF",fontSize:17,fontWeight:"800",marginTop:10},emptySub:{color:muted,fontSize:12,lineHeight:19,textAlign:"center",marginTop:8},songRow:{flexDirection:"row",alignItems:"center",gap:12,padding:14,backgroundColor:"#15111F",borderRadius:15,marginBottom:10},
  songIcon:{width:44,height:44,borderRadius:13,backgroundColor:"#352451",alignItems:"center",justifyContent:"center"},songIconText:{color:"#D4C1FF",fontSize:22},songTitle:{color:"#FFFFFF",fontWeight:"800",fontSize:14},songMeta:{color:muted,fontSize:11,marginTop:4},
  statusBox:{flexDirection:"row",gap:9,alignItems:"center",padding:12,backgroundColor:"#12101A",borderRadius:12,marginTop:20},statusDot:{width:7,height:7,borderRadius:4,backgroundColor:"#9B7CE0"},statusText:{color:"#AAA2B8",fontSize:11,flex:1,lineHeight:16},
  footer:{color:"#625A70",fontSize:9,letterSpacing:2,textAlign:"center",marginTop:22},bottomNav:{height:68,borderTopWidth:1,borderTopColor:"#211B30",backgroundColor:"#0E0B16",flexDirection:"row",justifyContent:"space-around",alignItems:"center"},
  navItem:{alignItems:"center",justifyContent:"center",minWidth:85,gap:3},navIcon:{color:"#777083",fontSize:20},navLabel:{color:"#777083",fontSize:10,fontWeight:"700"},navActive:{color:PURPLE}
});