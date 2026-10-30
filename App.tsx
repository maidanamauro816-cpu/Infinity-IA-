import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#090711" />
      <View style={styles.container}>
        <Text style={styles.brand}>SIXSEVEN</Text>
        <Text style={styles.title}>MUSIC</Text>
        <Text style={styles.subtitle}>Tu voz. Tu música. Tu estudio.</Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Crear una canción</Text>
          <Text style={styles.description}>
            Próximamente: transforma una idea en una canción y utiliza tu propia voz.
          </Text>
          <View style={styles.record}>
            <Text style={styles.recordText}>●  Grabar mi voz</Text>
          </View>
        </View>
        <Text style={styles.footer}>ESTUDIO MUSICAL CON INTELIGENCIA ARTIFICIAL</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#090711" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  brand: { color: "#B9A4FF", fontSize: 15, letterSpacing: 7, fontWeight: "700", textAlign: "center" },
  title: { color: "#FFFFFF", fontSize: 42, fontWeight: "900", letterSpacing: 5, textAlign: "center", marginTop: 5 },
  subtitle: { color: "#B8B2C9", fontSize: 15, textAlign: "center", marginTop: 10, marginBottom: 42 },
  panel: { backgroundColor: "#171323", borderColor: "#49366F", borderWidth: 1, borderRadius: 24, padding: 24 },
  panelTitle: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" },
  description: { color: "#B8B2C9", fontSize: 14, lineHeight: 21, marginTop: 12 },
  record: { marginTop: 28, backgroundColor: "#8B5CF6", padding: 17, borderRadius: 16, alignItems: "center" },
  recordText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  footer: { color: "#777083", fontSize: 10, letterSpacing: 2, textAlign: "center", marginTop: 35 }
});