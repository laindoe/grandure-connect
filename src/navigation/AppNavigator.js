import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import BrandWorkspaceScreen from '../screens/BrandWorkspaceScreen';
import CurrentPhaseScreen from '../screens/CurrentPhaseScreen';
import OverviewScreen from '../screens/OverviewScreen';
import PlatformStrategyScreen from '../screens/PlatformStrategyScreen';
import SeasonScreen from '../screens/SeasonScreen';
import IdeaVaultScreen from '../screens/IdeaVaultScreen';
import InspirationScreen from '../screens/InspirationScreen';
import IdeaCaptureBar from '../components/IdeaCaptureBar';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000' },
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="BrandWorkspace" component={BrandWorkspaceScreen} />
          <Stack.Screen name="CurrentPhase" component={CurrentPhaseScreen} />
          <Stack.Screen name="Overview" component={OverviewScreen} />
          <Stack.Screen name="PlatformStrategy" component={PlatformStrategyScreen} />
          <Stack.Screen name="Season" component={SeasonScreen} />
          <Stack.Screen name="IdeaVault" component={IdeaVaultScreen} />
          <Stack.Screen name="Inspiration" component={InspirationScreen} />
        </Stack.Navigator>
        <IdeaCaptureBar />
      </View>
    </NavigationContainer>
  );
}
