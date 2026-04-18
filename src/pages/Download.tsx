import { Smartphone, Download as DownloadIcon, Apple, Github, Terminal, CheckCircle2 } from "lucide-react";

export default function Download() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-yellow-500 mb-4">
            <Smartphone className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-display text-3xl md:text-5xl mb-3">Get the App</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Install Cinematic Lens on your phone — Android APK or iOS.
          </p>
        </div>

        {/* Quick install: PWA */}
        <div className="bg-card border border-border rounded-lg p-5 md:p-6 mb-6">
          <h2 className="text-foreground text-lg md:text-xl font-semibold mb-2 flex items-center gap-2">
            <DownloadIcon className="w-5 h-5 text-primary" /> Install instantly (no APK needed)
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            On Android Chrome: tap the <span className="text-foreground font-medium">⋮ menu</span> →{" "}
            <span className="text-foreground font-medium">Install app</span>.
            <br />
            On iPhone Safari: tap <span className="text-foreground font-medium">Share</span> →{" "}
            <span className="text-foreground font-medium">Add to Home Screen</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            Works offline, opens fullscreen, and feels just like a native app.
          </p>
        </div>

        {/* Build APK */}
        <div className="bg-card border border-border rounded-lg p-5 md:p-6 mb-6">
          <h2 className="text-foreground text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Build the Android APK
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Your project is already wired up with Capacitor. Follow these steps on your computer to
            generate a real <span className="text-foreground font-medium">.apk</span> file you can
            install on any Android phone or publish to Google Play.
          </p>

          <ol className="space-y-3 text-sm">
            {[
              {
                title: "Export to GitHub",
                body: "Click the GitHub button (top-right of Lovable) → Export to GitHub. Then git clone the repo on your computer.",
              },
              {
                title: "Install dependencies",
                body: "Run npm install inside the project folder.",
              },
              {
                title: "Add the Android platform",
                body: "Run: npx cap add android",
              },
              {
                title: "Build the web bundle",
                body: "Run: npm run build",
              },
              {
                title: "Sync to native project",
                body: "Run: npx cap sync android",
              },
              {
                title: "Open Android Studio & build APK",
                body: "Run: npx cap open android — then in Android Studio choose Build → Build Bundle(s) / APK(s) → Build APK(s). The .apk file appears under android/app/build/outputs/apk/debug/.",
              },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-foreground font-medium">{i + 1}. {s.title}</div>
                  <div className="text-muted-foreground">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 bg-secondary/50 border border-border rounded-md p-3 text-xs text-muted-foreground flex gap-2">
            <Terminal className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <div>
              Requires <span className="text-foreground">Android Studio</span> installed. For iOS,
              run <span className="text-foreground">npx cap add ios</span> on a Mac with Xcode.
            </div>
          </div>
        </div>

        {/* Helpful links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://capacitorjs.com/docs/android"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border rounded-lg p-4 hover:border-primary transition flex items-center gap-3"
          >
            <Smartphone className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground text-sm font-semibold">Android setup guide</div>
              <div className="text-muted-foreground text-xs">capacitorjs.com/docs/android</div>
            </div>
          </a>
          <a
            href="https://capacitorjs.com/docs/ios"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border rounded-lg p-4 hover:border-primary transition flex items-center gap-3"
          >
            <Apple className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground text-sm font-semibold">iOS setup guide</div>
              <div className="text-muted-foreground text-xs">capacitorjs.com/docs/ios</div>
            </div>
          </a>
          <a
            href="https://lovable.dev/blog/mobile-development-with-capacitor"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border rounded-lg p-4 hover:border-primary transition flex items-center gap-3 md:col-span-2"
          >
            <Github className="w-5 h-5 text-primary" />
            <div>
              <div className="text-foreground text-sm font-semibold">Lovable + Capacitor blog post</div>
              <div className="text-muted-foreground text-xs">Step-by-step walkthrough</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
