import React from 'react';
import { View, ActivityIndicator, Button, StyleSheet } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import {
  ReporteDetalleScreen,
  ReporteFormularioScreen,
  ReportesScreen,
} from './pantallasReportes';
import { RootStackParamList } from './tipos';

const Stack = createNativeStackNavigator<RootStackParamList>();

function BotonCerrarSesion() {
  const { logout } = useAuth();

  return (
    <Button
      title="Cerrar sesión"
      color="#c0392b"
      onPress={() => {
        logout();
      }}
    />
  );
}

export default function AppNavigator() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen
              name="Reportes"
              component={ReportesScreen}
              options={{ title: 'CondoTrack', headerRight: BotonCerrarSesion }}
            />
            <Stack.Screen
              name="ReporteDetalle"
              component={ReporteDetalleScreen}
              options={{ title: 'Detalle del reporte' }}
            />
            <Stack.Screen
              name="ReporteForm"
              component={ReporteFormularioScreen}
              options={{ title: 'Reporte' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
