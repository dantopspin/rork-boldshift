import React from "react";
import LegalPage from "@/components/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="BoldShift is built to be private by design. Your journey, reflections, streaks, and progress are stored only on your device. We do not collect, transmit, or sell any personal data."
      sections={[
        { heading: "Data We Store", body: "All of your data — completed challenges, reflections, streaks, achievements, and settings — lives locally on your device. Nothing is uploaded to a server or shared with third parties." },
        { heading: "No Accounts", body: "BoldShift does not require an account, email, or login. There is no profile to create and no credentials to manage." },
        { heading: "Notifications", body: "If you enable daily reminders, they are scheduled locally on your device. We do not send push notifications from a server." },
        { heading: "Your Control", body: "You can reset all of your data at any time from the Profile screen. Resetting permanently deletes everything stored on your device." },
        { heading: "Contact", body: "If you have any questions about privacy, reach out through the app store listing for BoldShift." },
      ]}
    />
  );
}
