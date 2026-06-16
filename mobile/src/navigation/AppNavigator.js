//navegación principal de la app
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PerfilScreen from '../screens/PerfilScreen';
import HijosQRScreen from '../screens/HijosQRScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import NotificacionesConductorScreen from '../screens/NotificacionesConductorScreen';
import AvisosPadreScreen from '../screens/AvisosPadreScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import PreviaRutaConductor from '../screens/PreviaRutaConductor';
import PreviaRutaPadre from '../screens/PreviaRutaPadre';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="HijosQR" component={HijosQRScreen} />
        <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
        <Stack.Screen name="Notificaciones" component={NotificacionesConductorScreen} />
        <Stack.Screen name="Avisos" component={AvisosPadreScreen} />
        <Stack.Screen name="Pagos" component={PaymentsScreen} />
        <Stack.Screen name="PreviaRutaConductor" component={PreviaRutaConductor} />
        <Stack.Screen name="PreviaRutaPadre" component={PreviaRutaPadre} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}