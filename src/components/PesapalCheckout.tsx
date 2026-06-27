import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PesapalCheckoutProps {
  amount: number;
  packageKey?: string;
  currency?: string;
  description?: string;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

type CheckoutState = "loading" | "iframe" | "success" | "error";

export default function PesapalCheckout({
  amount,
  packageKey,
  currency = "UGX",
  description = "Subscription",
  onClose,
  onSuccess,
}: PesapalCheckoutProps) {
  const [state, setState] = useState<CheckoutState>("loading");
  const [iframeUrl, setIframeUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [merchantRef, setMerchantRef] = useState("");
  const [trackingId, setTrackingId] = useState("");

  // Initiate payment
  useEffect(() => {
    const initPayment = async () => {
      try {
        setState("loading");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErrorMsg("Please log in to make a payment.");
          setState("error");
          return;
        }
        if (!packageKey) {
          setErrorMsg("Missing subscription package.");
          setState("error");
          return;
        }

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/pesapal-pay`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              package_key: packageKey,
              currency,
              callback_url: window.location.origin + "/wallet?payment=callback",
            }),
          }
        );

        const data = await res.json();
        if (!res.ok || !data.redirect_url) {
          throw new Error(data.error || "Failed to initiate payment");
        }

        setIframeUrl(data.redirect_url);
        setMerchantRef(data.merchant_reference);
        setTrackingId(data.order_tracking_id);
        setState("iframe");
      } catch (err: any) {
        setErrorMsg(err.message || "Something went wrong");
        setState("error");
      }
    };
    initPayment();
  }, [amount, currency, description, packageKey]);

  // Listen for payment status via realtime
  useEffect(() => {
    if (!trackingId) return;

    const channel = supabase
      .channel(`payment-${trackingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `pesapal_order_tracking_id=eq.${trackingId}`,
        },
        (payload: any) => {
          const status = payload.new?.status;
          if (status === "completed") {
            setState("success");
            // Reduced delay from 2000ms to 500ms for faster response
            setTimeout(() => onSuccess(amount), 500);
          } else if (status === "failed" || status === "reversed") {
            setErrorMsg("Your payment was not completed. Please try again.");
            setState("error");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackingId, amount, onSuccess]);

  // Also listen for iframe postMessage callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data === "string" && e.data.includes("pesapal")) {
        // Pesapal callback received
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <>
      {/* Backdrop - lower z-index to not block interaction */}
      <div
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content - higher z-index and pointer-events-auto */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors pointer-events-auto"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center px-6 pointer-events-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-transparent animate-spin"
                style={{ borderTopColor: "#C9A84C", borderRightColor: "#C9A84C" }} />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent animate-spin"
                style={{ borderBottomColor: "#8B6914", animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "#C9A84C" }}>
              Securing your transaction...
            </p>
            <p className="text-sm text-white/50">Please wait while we connect to the payment gateway</p>
          </div>
        )}

        {state === "iframe" && (
          <div className="w-full h-full max-w-2xl max-h-[90vh] mx-4 flex flex-col rounded-xl overflow-hidden border pointer-events-auto"
            style={{ borderColor: "#C9A84C33", background: "#0D0D0D" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#C9A84C22", background: "linear-gradient(135deg, #1A1A1A, #0D0D0D)" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "#C9A84C" }}>HADZ Payment Gateway</p>
                <p className="text-xs text-white/40">Amount: {amount.toLocaleString()} {currency}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400">Secure</span>
              </div>
            </div>
            {/* Iframe */}
            <iframe
              src={iframeUrl}
              className="flex-1 w-full bg-white"
              allow="payment"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation"
            />
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-4 text-center px-6 animate-in fade-in zoom-in duration-500 pointer-events-auto">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)" }}>
              <CheckCircle className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-white/60">
              <span className="font-semibold text-white">{amount.toLocaleString()} {currency}</span> — {description} activated.
            </p>
            <p className="text-xs text-white/30">Ref: {merchantRef}</p>
            <Button
              onClick={() => onSuccess(amount)}
              className="mt-2 px-8"
              style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)", color: "#000" }}
            >
              Continue
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="max-w-sm mx-4 rounded-xl p-6 border text-center pointer-events-auto"
            style={{ background: "#1A1208", borderColor: "#8B691444" }}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: "#C9A84C" }} />
            <h3 className="text-lg font-semibold text-white mb-2">Payment Issue</h3>
            <p className="text-sm text-white/60 mb-4">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setState("loading");
                  setErrorMsg("");
                  window.location.reload();
                }}
                variant="outline"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
              <Button
                onClick={onClose}
                style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)", color: "#000" }}
              >
                Close
              </Button>
            </div>
            <p className="text-xs text-white/30 mt-4">
              Need help? Contact <span style={{ color: "#C9A84C" }}>support@hadzgroup.cc</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
