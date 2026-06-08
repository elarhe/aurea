import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { CarritoProvider } from "./src/context/CarritoContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CarritoProvider>
          <AppNavigator />
        </CarritoProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}