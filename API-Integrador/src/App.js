import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const express = require('express');
const cors = require('cors');
const rutasAutenticacion = require('./rutas/autenticacionRutas');
const rutasEvento = require('./rutas/eventoRutas');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/usuario', rutasAutenticacion);
app.use('/api/evento', rutasEvento);

module.exports = app;

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
