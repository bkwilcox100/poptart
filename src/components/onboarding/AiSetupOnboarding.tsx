import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { commands, events } from "@/bindings";
import PoptartLogo from "../icons/PoptartLogo";

interface AiSetupOnboardingProps {
  onComplete: () => void;
}

type Stage = "checking" | "idle" | "binary" | "server" | "model" | "error";

/**
 * One-click local AI setup: downloads a managed Ollama binary, starts the
 * server, and pulls the default model. Auto-skips when an AI is already
 * reachable (existing Ollama install).
 */
const AiSetupOnboarding: React.FC<AiSetupOnboardingProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("checking");
  const [progress, setProgress] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const completed = useRef(false);

  const finish = () => {
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      unlisten = await events.aiSetupProgress.listen((event) => {
        const { stage: s, progress: p } = event.payload;
        if (s === "done") {
          finish();
        } else if (s === "binary" || s === "server" || s === "model") {
          setStage(s);
          setProgress(p);
        }
      });
      const status = await commands.checkAiStatus();
      if (status.server_running && status.model_ready) {
        finish(); // AI already set up (e.g. existing Ollama) — nothing to do
      } else {
        setStage("idle");
      }
    })();
    return () => unlisten?.();
  }, []);

  const handleSetup = async () => {
    setError(null);
    setStage("binary");
    setProgress(-1);
    const result = await commands.setupLocalAi();
    if (result.status === "error") {
      setStage("error");
      setError(result.error);
    } else {
      finish();
    }
  };

  const busy = stage === "binary" || stage === "server" || stage === "model";
  const stageLabel =
    stage === "binary"
      ? t("onboarding.aiSetup.stageBinary")
      : stage === "server"
        ? t("onboarding.aiSetup.stageServer")
        : t("onboarding.aiSetup.stageModel");

  if (stage === "checking") {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-6 gap-6">
      <PoptartLogo width={200} />
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-lg font-semibold">
          {t("onboarding.aiSetup.title")}
        </h2>
        <p className="text-text/70 text-sm">
          {t("onboarding.aiSetup.description")}
        </p>

        {busy ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{stageLabel}</p>
            <div className="w-full h-2 rounded-full bg-text/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-logo-primary transition-all ${
                  progress < 0 ? "w-full animate-pulse" : ""
                }`}
                style={
                  progress >= 0
                    ? { width: `${Math.round(progress * 100)}%` }
                    : undefined
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {stage === "error" && error && (
              <p className="text-sm text-red-500 break-words">
                {t("onboarding.aiSetup.error", { error })}
              </p>
            )}
            <button
              type="button"
              onClick={handleSetup}
              className="px-6 py-2 rounded-lg bg-logo-primary text-white font-medium hover:opacity-90 transition-opacity"
            >
              {stage === "error"
                ? t("onboarding.aiSetup.retry")
                : t("onboarding.aiSetup.setupButton")}
            </button>
            <div>
              <button
                type="button"
                onClick={finish}
                className="text-sm text-text/50 hover:text-text/80 transition-colors"
              >
                {t("onboarding.aiSetup.skip")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSetupOnboarding;
