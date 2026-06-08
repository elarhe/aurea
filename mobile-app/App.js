import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { CarritoProvider } from "./src/context/CarritoContext";
import { IdiomaProvider } from "./src/i18n/IdiomaContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <IdiomaProvider>
          <CarritoProvider>
            <AppNavigator />
          </CarritoProvider>
        </IdiomaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}