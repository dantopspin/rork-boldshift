import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONT } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

export interface Section {
  heading: string;
  body: string;
}

interface Props {
  title: string;
  intro: string;
  sections: Section[];
}

export default function LegalPage({ title, intro, sections }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />
      <SafeAreaView edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
            <ChevronLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 18 }}>{title}</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 15, lineHeight: 23, marginBottom: 20 }}>{intro}</Text>
        {sections.map((s, i) => (
          <View key={i} style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 16, marginBottom: 8 }}>{s.heading}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, lineHeight: 22 }}>{s.body}</Text>
          </View>
        ))}
        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12, marginTop: 8 }}>Last updated: June 2026</Text>
      </ScrollView>
    </View>
  );
}
