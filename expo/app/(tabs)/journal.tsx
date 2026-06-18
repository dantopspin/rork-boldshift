import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, Check, ChevronDown, Frown, Heart, Meh, Smile } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Alert, InputAccessoryView, Modal, ScrollView, Text, TextInput, TouchableWithoutFeedback, View, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "@/components/AppButton";
import GlassCard from "@/components/GlassCard";
import PressableScale from "@/components/PressableScale";
import { ACCENT, FONT, PATH_THEME } from "@/constants/theme";
import { getChallengesForPath } from "@/data/challenges";
import { triggerHaptic } from "@/lib/haptics";
import { useProgress } from "@/providers/ProgressProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Mood } from "@/types";

type MoodFilter = "all" | Mood;

const MOOD_CONFIG: Record<Mood, { icon: typeof Smile; color: string; label: string }> = {
  great: { icon: Heart, color: "#EC4899", label: "Great" },
  good: { icon: Smile, color: ACCENT.success, label: "Good" },
  okay: { icon: Meh, color: ACCENT.milestone, label: "Okay" },
  hard: { icon: Frown, color: "#E0483D", label: "Hard" },
};

export default function Journal() {
  const { colors } = useTheme();
  const { progress, isLoaded, updateReflection, deleteReflection } = useProgress();
  const [filter, setFilter] = useState<MoodFilter>("all");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  const challenges = useMemo(
    () => (progress.selectedPath ? getChallengesForPath(progress.selectedPath) : []),
    [progress.selectedPath],
  );

  const entries = useMemo(
    () =>
      Object.entries(progress.reflections)
        .map(([dayStr, reflection]) => {
          const day = parseInt(dayStr, 10);
          return { day, reflection, challenge: challenges.find((c) => c.day === day) };
        })
        .filter((r) => filter === "all" || r.reflection.mood === filter)
        .sort((a, b) => b.day - a.day),
    [progress.reflections, challenges, filter],
  );

  const total = Object.keys(progress.reflections).length;
  const path = progress.selectedPath;
  const pathColor = path ? PATH_THEME[path].color : colors.primary;

  const handleLongPress = (day: number): void => {
    triggerHaptic("medium");
    const entry = progress.reflections[day];
    if (!entry) return;
    Alert.alert("Reflection", `What would you like to do with your Day ${day} reflection?`, [
      {
        text: "Edit",
        onPress: () => {
          setEditText(entry.text);
          setEditDay(day);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete Reflection?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteReflection(day),
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveEdit = (): void => {
    if (editDay !== null) {
      updateReflection(editDay, editText.trim());
      setEditDay(null);
      setEditText("");
    }
  };

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={colors.backgroundGradient} style={{ position: "absolute", inset: 0 }} />
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <BookOpen size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 20 }}>Journal</Text>
            </View>
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 12 }}>
              {total} reflection{total !== 1 ? "s" : ""} recorded
            </Text>
          </View>
          <View>
            <PressableScale
              onPress={() => {
                setMenuOpen((v) => !v);
              }}
              innerStyle={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13 }}>
                {filter === "all" ? "All" : MOOD_CONFIG[filter].label}
              </Text>
              <ChevronDown size={14} color={colors.mutedForeground} />
            </PressableScale>
            {menuOpen && (
              <View style={{ position: "absolute", top: 42, right: 0, backgroundColor: colors.cardSolid, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 6, width: 140, zIndex: 50, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 }}>
                <FilterItem label="All moods" active={filter === "all"} onPress={() => { setFilter("all"); setMenuOpen(false); }} />
                {(Object.keys(MOOD_CONFIG) as Mood[]).map((m) => {
                  const Icon = MOOD_CONFIG[m].icon;
                  return (
                    <PressableScale key={m} onPress={() => { setFilter(m); setMenuOpen(false); }} innerStyle={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Icon size={16} color={MOOD_CONFIG[m].color} />
                      <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13 }}>{MOOD_CONFIG[m].label}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 12 }} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <BookOpen size={28} color={colors.mutedForeground} />
            </View>
            <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 16, marginBottom: 6 }}>
              {filter === "all" ? "No reflections yet" : `No "${MOOD_CONFIG[filter as Mood].label}" reflections`}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 14, textAlign: "center", maxWidth: 260 }}>
              {filter === "all" ? "Complete challenges and write reflections to see them here." : "Try a different filter to see more reflections."}
            </Text>
          </View>
        ) : (
          entries.map(({ day, reflection, challenge }) => {
            const MoodIcon = MOOD_CONFIG[reflection.mood].icon;
            const date = new Date(reflection.timestamp);
            return (
              <PressableScale
                key={day}
                onLongPress={() => handleLongPress(day)}
                haptic={false}
                scale={1}
                innerStyle={{ padding: 0 }}
              >
                <GlassCard style={{ padding: 14 }} borderColor={pathColor + "33"}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ backgroundColor: pathColor + "26", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: pathColor, fontFamily: FONT.bold, fontSize: 11 }}>Day {day}</Text>
                        </View>
                        <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 11 }}>
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                      </View>
                      {challenge && <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 14, marginTop: 6 }}>{challenge.title}</Text>}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: MOOD_CONFIG[reflection.mood].color + "1A" }}>
                      <MoodIcon size={13} color={MOOD_CONFIG[reflection.mood].color} />
                      <Text style={{ color: MOOD_CONFIG[reflection.mood].color, fontFamily: FONT.medium, fontSize: 11 }}>{MOOD_CONFIG[reflection.mood].label}</Text>
                    </View>
                  </View>
                  {reflection.text.length > 0 && (
                    <Text style={{ color: colors.foreground, fontFamily: FONT.regular, fontSize: 14, lineHeight: 21, marginTop: 10, fontStyle: "italic" }}>
                      "{reflection.text}"
                    </Text>
                  )}
                </GlassCard>
              </PressableScale>
            );
          })
        )}
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editDay !== null} transparent animationType="fade" onRequestClose={() => setEditDay(null)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)", padding: 24 }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: colors.cardSolid, borderRadius: 20, padding: 22, gap: 14 }}>
                <Text style={{ color: colors.foreground, fontFamily: FONT.bold, fontSize: 18 }}>Edit Reflection</Text>
                <Text style={{ color: colors.mutedForeground, fontFamily: FONT.regular, fontSize: 13 }}>
                  Day {editDay}
                </Text>
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="Write your reflection..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit={true}
                  inputAccessoryViewID="journalEditInput"
                  style={{
                    minHeight: 100,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.secondary,
                    padding: 14,
                    color: colors.foreground,
                    fontFamily: FONT.regular,
                    fontSize: 15,
                    textAlignVertical: "top",
                  }}
                />
                <InputAccessoryView nativeID="journalEditInput">
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.cardSolid, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <PressableScale onPress={() => Keyboard.dismiss()} innerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                      <Text style={{ color: colors.primary, fontFamily: FONT.bold, fontSize: 14 }}>Done</Text>
                    </PressableScale>
                  </View>
                </InputAccessoryView>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <PressableScale
                    onPress={() => { setEditDay(null); setEditText(""); }}
                    innerStyle={{ flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.mutedForeground, fontFamily: FONT.bold, fontSize: 15 }}>Cancel</Text>
                  </PressableScale>
                  <PressableScale
                    onPress={handleSaveEdit}
                    innerStyle={{ flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary }}
                  >
                    <Text style={{ color: "#FFF", fontFamily: FONT.bold, fontSize: 15 }}>Save</Text>
                  </PressableScale>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

function FilterItem({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} innerStyle={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ color: colors.foreground, fontFamily: FONT.medium, fontSize: 13 }}>{label}</Text>
      {active && <Check size={14} color={colors.primary} />}
    </PressableScale>
  );
}
