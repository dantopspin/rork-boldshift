import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export default function ModalScreen() {
  const { isDark, colors } = useTheme();

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={() => router.back()}>
      <Pressable style={styles.backdrop} onPress={() => router.back()}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? "dark" : "light"} />
      </Pressable>

      <View style={styles.wrapper} pointerEvents="box-none">
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            <Text style={[styles.title, { color: colors.foreground }]}>Modal</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              This is an example modal with slide animation. You can edit it in app/modal.tsx.
            </Text>

            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </View>

      <StatusBar style={isDark ? "light" : "dark"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    minWidth: 300,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#CCC",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
