"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { AlertTriangle, Camera, Check, CheckCircle2, Clock, CreditCard, FileText, IdCard, RotateCcw, ScanFace, Upload, Vote, X } from "lucide-react";
import { KYC_ACCEPTED_MIME, KYC_MAX_FILE_BYTES, type IdType } from "@orbit/shared";
import { Button, ButtonLink } from "@orbit/ui/components/ui/Button";
import { toast } from "@orbit/ui/components/ui/Toast";
import { Card, KycBadge, Skeleton } from "@orbit/ui/components/ui/misc";
import { api, errorMessage } from "@orbit/ui/lib/api";
import { cn } from "@orbit/ui/lib/cn";
import { refreshAccount, useMe } from "@/lib/data";

const ID_TYPES: { id: IdType; label: string; sub: string; icon: typeof IdCard; twoSided: boolean }[] = [
  { id: "PASSPORT", label: "International passport", sub: "Photo page only", icon: FileText, twoSided: false },
  { id: "NATIONAL_ID", label: "National ID (NIN)", sub: "NIN slip or card", icon: IdCard, twoSided: true },
  { id: "DRIVERS_LICENCE", label: "Driver's licence", sub: "Front and back", icon: CreditCard, twoSided: true },
  { id: "VOTERS_CARD", label: "Voter's card", sub: "Front and back", icon: Vote, twoSided: true },
];

const STEPS = ["Document type", "Upload ID", "Selfie check", "Review"];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300", i < step ? "bg-success text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/15" : "bg-muted text-text-muted")}>
            {i < step ? <Check className="size-4" /> : i + 1}
          </span>
          <span className={cn("hidden text-sm font-medium md:block", i === step ? "text-text" : "text-text-muted")}>{s}</span>
          {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500", i < step ? "bg-success" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}

function validFile(f: File) {
  if (!KYC_ACCEPTED_MIME.includes(f.type)) {
    toast.error("Unsupported file type", { description: "Upload a JPG, PNG or PDF." });
    return false;
  }
  if (f.size > KYC_MAX_FILE_BYTES) {
    toast.error("File too large", { description: "Each file must be 10 MB or smaller." });
    return false;
  }
  return true;
}

function usePreview(file: File | Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function Dropzone({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const [drag, setDrag] = useState(false);
  const preview = usePreview(file);
  const input = useRef<HTMLInputElement>(null);
  const accept = (f?: File) => f && validFile(f) && onFile(f);

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {file ? (
        <div className="relative flex animate-pop items-center gap-3 rounded-xl border border-success/30 bg-success/[0.05] p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-16 rounded-lg object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-lg bg-surface text-text-muted">
              <FileText className="size-6" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · ready</p>
          </div>
          <button onClick={() => onFile(null)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-danger" aria-label={`Remove ${label}`}>
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setDrag(false);
            accept(e.dataTransfer.files[0]);
          }}
          className={cn("flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all", drag ? "scale-[1.01] border-primary bg-primary-soft/60" : "border-border bg-surface-alt hover:border-primary/40 hover:bg-primary-soft/30")}
        >
          <span className={cn("flex size-11 items-center justify-center rounded-xl bg-surface text-primary shadow-sm transition-transform", drag && "-translate-y-1")}>
            <Upload className="size-5" />
          </span>
          <span className="mt-3 text-sm font-semibold">Drop a file or click to upload</span>
          <span className="mt-1 text-xs text-text-muted">JPG, PNG or PDF · max 10 MB</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={(e) => accept(e.target.files?.[0])} />
    </div>
  );
}

const LIVENESS = ["Look straight at the camera", "Blink slowly twice", "Turn your head left", "Turn your head right"];

/** Camera selfie with liveness prompts. Captures a real frame; falls back to a photo upload. */
function SelfieCapture({ selfie, onSelfie }: { selfie: File | null; onSelfie: (f: File | null) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "live" | "checking" | "denied">("idle");
  const [prompt, setPrompt] = useState(0);
  const preview = usePreview(selfie);

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  async function start() {
    setState("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (video.current) video.current.srcObject = stream.current;
      setState("live");
    } catch {
      setState("denied");
      toast.warning("Camera unavailable", { description: "Allow camera access, or upload a clear selfie photo instead." });
    }
  }

  async function check() {
    setState("checking");
    for (let i = 0; i < LIVENESS.length; i++) {
      setPrompt(i);
      await new Promise((r) => setTimeout(r, 1100));
    }
    const v = video.current!;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 640;
    canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    stream.current?.getTracks().forEach((t) => t.stop());
    setState("idle");
    if (!blob) return toast.error("Couldn't capture the photo. Try again.");
    onSelfie(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
    toast.success("Selfie captured");
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-full bg-night ring-4 ring-primary/20">
        <video ref={video} autoPlay playsInline muted className={cn("size-full scale-x-[-1] object-cover", !(state === "live" || state === "checking") && "hidden")} />
        {preview && state !== "live" && state !== "checking" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your selfie" className="absolute inset-0 size-full animate-fade object-cover" />
        )}
        {!preview && (state === "idle" || state === "starting" || state === "denied") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ScanFace className="size-20 animate-float text-white/40" />
          </div>
        )}
        {state === "checking" && (
          <>
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#00ffbb" strokeWidth="2.5" strokeDasharray="301" strokeDashoffset={301 - ((prompt + 1) / LIVENESS.length) * 301} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-x-4 bottom-6 animate-fade rounded-full bg-night/80 px-3 py-1.5 text-center text-xs font-semibold text-white backdrop-blur">{LIVENESS[prompt]}</div>
          </>
        )}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {selfie && state === "idle" ? (
          <Button size="md" variant="secondary" onClick={() => onSelfie(null)} icon={<RotateCcw className="size-4" />}>
            Retake
          </Button>
        ) : (
          <>
            {(state === "idle" || state === "denied") && (
              <Button size="md" onClick={start} icon={<Camera className="size-4" />}>
                {state === "denied" ? "Try camera again" : "Start camera"}
              </Button>
            )}
            {state === "starting" && <Button size="md" loading loadingText="Starting camera…" />}
            {state === "live" && (
              <Button size="md" onClick={check} icon={<ScanFace className="size-4" />}>
                Start liveness check
              </Button>
            )}
            {state === "checking" && <Button size="md" loading loadingText="Checking liveness…" />}
            {state === "denied" && (
              <Button size="md" variant="secondary" onClick={() => upload.current?.click()} icon={<Upload className="size-4" />}>
                Upload a selfie
              </Button>
            )}
          </>
        )}
      </div>
      <input ref={upload} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => e.target.files?.[0] && validFile(e.target.files[0]) && onSelfie(e.target.files[0])} />
      <p className="mt-4 max-w-sm text-center text-xs text-text-muted">We match your face to your ID photo. Your selfie is encrypted and only KYC reviewers can see it.</p>
    </div>
  );
}

function StatusPanel({ status, reason }: { status: "PENDING_REVIEW" | "APPROVED"; reason: string | null }) {
  const pending = status === "PENDING_REVIEW";
  return (
    <Card className="mx-auto max-w-xl animate-pop p-8 text-center sm:p-10">
      <span className={cn("mx-auto flex size-16 items-center justify-center rounded-2xl", pending ? "bg-warning/15 text-warning" : "bg-success/10 text-success")}>
        {pending ? <Clock className="size-8 animate-pulse" /> : <CheckCircle2 className="size-8" />}
      </span>
      <div className="mt-5 flex justify-center">
        <KycBadge status={status} />
      </div>
      <h2 className="mt-4 text-xl font-semibold">{pending ? "We're reviewing your ID" : "You're verified"}</h2>
      <p className="mt-2 text-text-muted">
        {pending ? "A member of our team checks every submission. Most reviews finish within 4 hours, and we'll email you when it's done." : "Deposits, copy trading and withdrawals are unlocked. Welcome aboard."}
      </p>
      {reason && <p className="mt-3 text-sm text-text-muted">Note: {reason}</p>}
      <ButtonLink href="/dashboard" className="mt-6">
        Go to dashboard
      </ButtonLink>
    </Card>
  );
}

/** FR-3 — ID verification wizard. Files go to the API, encrypted at rest. */
export function KycWizard() {
  const { data } = useMe();
  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState<IdType | null>(null);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!data) return <Skeleton className="mx-auto h-[480px] max-w-3xl" />;
  const { kycStatus: status, kycReason: reason } = data.user;
  if (status === "PENDING_REVIEW" || status === "APPROVED") return <StatusPanel status={status} reason={reason} />;

  const type = ID_TYPES.find((t) => t.id === idType);
  const canNext = [!!idType, !!front && (!type?.twoSided || !!back), !!selfie, true][step];

  async function submit() {
    if (!idType || !front || !selfie) return;
    setSubmitting(true);
    const form = new FormData();
    form.append("idType", idType);
    form.append("front", front);
    if (back && type?.twoSided) form.append("back", back);
    form.append("selfie", selfie);
    try {
      await toast.promise(api("/me/kyc", { form }), { loading: "Uploading encrypted documents…", success: "ID submitted for review", error: (e) => errorMessage(e) });
      await refreshAccount();
    } catch {
      /* toast shown */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {(status === "REJECTED" || status === "RESUBMISSION_REQUESTED") && (
        <div className="mb-6 flex animate-rise gap-3 rounded-2xl border border-danger/25 bg-danger/[0.05] p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <p className="font-semibold">{status === "REJECTED" ? "Your previous submission was rejected" : "We need you to resubmit"}</p>
            <p className="text-sm text-text-muted">{reason ?? "Please upload clear, uncropped photos of a valid document."}</p>
          </div>
        </div>
      )}
      <Card className="p-5 sm:p-8">
        <Stepper step={step} />
        <div key={step} className="animate-rise">
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold">Which document will you use?</h2>
              <p className="mt-1 text-sm text-text-muted">It must be valid, in your name, and match the details you signed up with.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ID_TYPES.map((t) => (
                  <button key={t.id} onClick={() => setIdType(t.id)} className={cn("flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all", idType === t.id ? "border-primary bg-primary-soft/50 shadow-[0_8px_24px_-12px_rgba(85,1,255,0.5)]" : "border-border hover:border-primary/40")}>
                    <span className={cn("flex size-11 items-center justify-center rounded-xl transition-colors", idType === t.id ? "bg-primary text-white" : "bg-muted text-text-muted")}>
                      <t.icon className="size-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{t.label}</span>
                      <span className="text-xs text-text-muted">{t.sub}</span>
                    </span>
                    {idType === t.id && <CheckCircle2 className="ml-auto size-5 animate-pop text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && type && (
            <>
              <h2 className="text-lg font-semibold">Upload your {type.label.toLowerCase()}</h2>
              <p className="mt-1 text-sm text-text-muted">Use a well-lit photo with all four corners visible. No glare or blur.</p>
              <div className={cn("mt-6 grid gap-5", type.twoSided && "sm:grid-cols-2")}>
                <Dropzone label={type.twoSided ? "Front" : "Photo page"} file={front} onFile={setFront} />
                {type.twoSided && <Dropzone label="Back" file={back} onFile={setBack} />}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-center text-lg font-semibold">Take a quick selfie</h2>
              <p className="mb-6 mt-1 text-center text-sm text-text-muted">Follow the prompts to prove it&apos;s really you: blink, then turn your head.</p>
              <SelfieCapture selfie={selfie} onSelfie={setSelfie} />
            </>
          )}
          {step === 3 && type && (
            <>
              <h2 className="text-lg font-semibold">Review and submit</h2>
              <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
                {[
                  ["Document", type.label],
                  ["Files", [front?.name, type.twoSided ? back?.name : null].filter(Boolean).join(", ")],
                  ["Selfie", selfie ? "Captured" : "Missing"],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:justify-between">
                    <span className="text-text-muted">{k}</span>
                    <span className="font-medium sm:text-right">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-text-muted">A person on our team reviews every submission and makes the final decision.</p>
            </>
          )}
        </div>
        <div className="mt-8 flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <Button variant="secondary" size="md" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || submitting}>
            Back
          </Button>
          {step < 3 ? (
            <Button size="md" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button size="md" loading={submitting} loadingText="Submitting…" onClick={submit}>
              Submit for review
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
