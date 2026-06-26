import React from "react";
import LegalPage from "@/components/LegalPage";

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="Welcome to BoldShift. By using this app, you agree to these terms. BoldShift is a self-guided confidence-building tool and is not a substitute for professional advice."
      sections={[
        { heading: "Use of the App", body: "BoldShift provides daily confidence challenges for personal growth. You are responsible for choosing challenges that are safe and appropriate for your situation." },
        { heading: "Not Medical Advice", body: "BoldShift is for personal development only. It does not provide medical, psychological, or therapeutic advice. If you are experiencing significant anxiety or distress, please consult a qualified professional." },
        { heading: "Subscriptions", body: "BoldShift Pro unlocks the full 60-day journey and additional features. Subscription status is stored locally on your device." },
        { heading: "Your Responsibility", body: "You agree to use BoldShift responsibly and to respect others while completing social challenges. You complete all challenges at your own discretion." },
        { heading: "Changes", body: "We may update these terms from time to time. Continued use of the app means you accept the latest version." },
        { heading: "Standard EULA", body: "This app is licensed under Apple's Standard End User License Agreement, available at https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" },
      ]}
    />
  );
}
