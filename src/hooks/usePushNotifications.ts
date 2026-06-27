import { useEffect, useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

export function usePushNotifications(userId: string | null) {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const registerToken = useCallback(async (token: string, platform: string) => {
    if (!userId) return;
    await supabase.from("device_tokens" as any).upsert(
      { user_id: userId, token, platform },
      { onConflict: "user_id,token" }
    );
  }, [userId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    let cleanup = () => {};

    const setup = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") return;
        setPermissionGranted(true);

        // Register with APNs / FCM
        await PushNotifications.register();

        // Save token
        const regListener = await PushNotifications.addListener("registration", (token) => {
          const platform = Capacitor.getPlatform(); // 'ios' | 'android'
          registerToken(token.value, platform);
        });

        const errListener = await PushNotifications.addListener("registrationError", (err) => {
          console.error("Push registration error:", err.error);
        });

        // Handle received notifications (foreground)
        const receivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("Push received in foreground:", notification);
          }
        );

        // Handle notification taps
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("Push action performed:", action);
            // Navigate based on notification data
            const data = action.notification.data;
            if (data?.route) {
              window.location.href = data.route;
            }
          }
        );

        cleanup = () => {
          regListener.remove();
          errListener.remove();
          receivedListener.remove();
          actionListener.remove();
        };
      } catch (e) {
        console.log("Push notifications not available:", e);
      }
    };

    setup();
    return () => cleanup();
  }, [userId, registerToken]);

  return { permissionGranted };
}
