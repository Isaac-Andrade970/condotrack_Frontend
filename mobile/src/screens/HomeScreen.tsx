
import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
} from 'react-native';

import {useAuth} from '../context/AuthContext';

export default function HomeScreen() {
  const {user, logout} = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        CondoTrack
      </Text>

      <Text style={styles.welcome}>
        Bienvenido, {user?.nombre ?? user?.email ?? 'usuario'}
      </Text>

      <Text style={styles.description}>
        Aquí se mostrará el listado de reportes.
      </Text>

      <Button
        title="Cerrar sesión"
        onPress={() => {
          logout();
        }}
        color="#c0392b"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 18,
    marginBottom: 20,
  },
  description: {
    marginBottom: 24,
    color: '#555555',
  },
});
