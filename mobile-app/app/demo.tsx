import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function DemoScreen() {
  const router = useRouter();
  const [counter, setCounter] = useState(0);
  const [selectedColor, setSelectedColor] = useState("#FF6B35");
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const colors = [
    "#FF6B35", // Sunset Orange
    "#8E44AD", // Purple
    "#3498DB", // Blue
    "#2ECC71", // Green
    "#E74C3C", // Red
    "#F39C12", // Orange
  ];

  const features = [
    {
      title: "File-based Routing",
      description:
        "This screen was created using Expo Router file-based routing system.",
      icon: "📁",
    },
    {
      title: "Navigation",
      description: "Seamless navigation between screens using useRouter hook.",
      icon: "🧭",
    },
    {
      title: "Animations",
      description: "Smooth animations using React Native Animated API.",
      icon: "✨",
    },
    {
      title: "State Management",
      description:
        "Interactive counter and color picker demonstrating local state.",
      icon: "🔄",
    },
    {
      title: "Responsive Design",
      description: "Adaptive layout that works on different screen sizes.",
      icon: "📱",
    },
  ];

  const handleCounterPress = () => {
    setCounter((prev) => prev + 1);

    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    // Continuous rotation animation
    const rotate = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => rotate());
    };
    rotate();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: selectedColor }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Demo Screen</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Animated Logo */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[styles.logo, { transform: [{ rotate: spin }] }]}
          >
            <Text style={styles.logoText}>🚀</Text>
          </Animated.View>
          <Text style={styles.subtitle}>Expo Router Demo</Text>
        </View>

        {/* Interactive Counter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Counter</Text>
          <TouchableOpacity
            style={styles.counterContainer}
            onPress={handleCounterPress}
          >
            <Animated.Text
              style={[
                styles.counterText,
                { transform: [{ scale: bounceAnim }] },
              ]}
            >
              {counter}
            </Animated.Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>Tap the number to increment!</Text>
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme Selector</Text>
          <View style={styles.colorPicker}>
            {colors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
          <Text style={styles.helperText}>
            Tap a color to change the theme!
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Screen Width: {width.toFixed(0)}px
            </Text>
            <Text style={styles.infoText}>
              Screen Height: {height.toFixed(0)}px
            </Text>
            <Text style={styles.infoText}>Counter Value: {counter}</Text>
            <Text style={styles.infoText}>Selected Theme: {selectedColor}</Text>
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  placeholder: {
    width: 60,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logoText: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    fontWeight: "300",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    marginBottom: 15,
    textAlign: "center",
  },
  counterContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  counterText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  helperText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontStyle: "italic",
  },
  colorPicker: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 10,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "white",
    borderWidth: 4,
  },
  featureCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 15,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
    fontFamily: "monospace",
  },
});
