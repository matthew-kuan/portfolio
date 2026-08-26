"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Launcher page for the hand-tracking robotic arm demo.
 *
 * The MediaPipe pipeline is a local Python service (it needs a webcam and a
 * serial connection to the Braccio arm), so there is nothing to host. This page
 * probes for that service on localhost and either embeds it or explains how to
 * run it, so the link is useful both when demoing live and when a visitor
 * just wants to understand the project.
 */

const SERVICE_URL = "http://localhost:8000";
const REPO = "https://github.com/s3raphsembrace/mediapipe-braccio-control";

type Status = "checking" | "online" | "offline";

export default function BraccioDemoPage() {
  const [status, setStatus] = useState<Status>("checking");

  const probe = useCallback(async () => {
    setStatus("checking");
    try {
      // no-cors gives an opaque response, but a *resolved* fetch still proves
      // something is listening; a refused connection rejects instead.
      await fetch(SERVICE_URL, { mode: "no-cors", cache: "no-store" });
      setStatus("online");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#171717] text-slate-800 dark:text-neutral-200">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <a
          href="/#projects"
          className="text-sm text-slate-500 dark:text-neutral-400 hover:text-accent transition-colors"
        >
          ← Back to portfolio
        </a>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-neutral-50 mt-6 mb-2 tracking-tight">
          Hand-Tracking Robotic Arm: Live Demo
        </h1>
        <p className="text-slate-600 dark:text-neutral-300 mb-8 leading-relaxed">
          A Python + MediaPipe pipeline reads your webcam, extracts hand landmarks,
          and maps them to six joint angles on an Arduino-driven Braccio arm, right
          hand steers the arm, left hand opens and closes the gripper.
        </p>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span
            className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border ${
              status === "online"
                ? "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40"
                : status === "checking"
                ? "text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-700"
                : "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40"
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full ${
                status === "online"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "checking"
                  ? "bg-slate-400"
                  : "bg-amber-500"
              }`}
            />
            {status === "online"
              ? "Local service detected"
              : status === "checking"
              ? "Looking for local service…"
              : "Local service not running"}
          </span>
          <button
            onClick={probe}
            className="text-sm font-medium text-accent border border-accent/40 px-3 py-1.5 rounded-full hover:bg-accent hover:text-white dark:hover:text-neutral-900 transition-colors"
          >
            Re-check
          </button>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-accent transition-colors"
          >
            View source ↗
          </a>
        </div>

        {status === "online" ? (
          <div className="rounded-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden">
            <iframe
              src={SERVICE_URL}
              title="Hand-tracking robotic arm control service"
              className="w-full h-[540px] bg-black"
              allow="camera"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 p-6">
            <h2 className="text-slate-900 dark:text-neutral-50 font-bold mb-2">
              Run it yourself
            </h2>
            <p className="text-slate-600 dark:text-neutral-300 text-sm mb-5 leading-relaxed">
              This demo drives real hardware, so it runs on your machine rather than a
              server. It needs a webcam; the Arduino and Braccio arm are optional, and without
              them the vision pipeline still runs and prints the joint angles it would send.
            </p>
            <ol className="space-y-3 text-sm">
              {[
                { label: "Clone the repository", cmd: `git clone ${REPO}.git\ncd mediapipe-braccio-control` },
                { label: "Install dependencies", cmd: "pip install -r requirements.txt" },
                { label: "Start the service", cmd: "python app.py" },
              ].map((s, i) => (
                <li key={s.label} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-accent text-white dark:text-neutral-900 grid place-items-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 dark:text-neutral-300 font-medium mb-1.5">{s.label}</p>
                    <pre className="bg-slate-900 dark:bg-black text-slate-100 text-xs rounded-lg p-3 overflow-x-auto">
                      <code>{s.cmd}</code>
                    </pre>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-slate-500 dark:text-neutral-400 text-xs mt-5">
              Once it&apos;s listening on <code className="font-mono">localhost:8000</code>,
              hit <span className="font-medium">Re-check</span> above and the live view will
              load here.
            </p>
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-slate-900 dark:text-neutral-50 font-bold mb-3">How it works</h2>
          <ul className="space-y-2">
            {[
              "MediaPipe extracts 21 hand landmarks per frame from the webcam stream.",
              "Right-hand pose maps to six Braccio joint angles; left-hand pinch drives the gripper.",
              "Only changed values are transmitted over serial, which cuts jitter from frame-to-frame noise.",
              "Arduino firmware validates every incoming angle against a safety table and steps in 3° increments to avoid mechanical strain.",
              "Both hands open flat triggers a reset to the calibrated safe position.",
            ].map((t) => (
              <li key={t} className="text-slate-600 dark:text-neutral-300 text-sm flex gap-2.5">
                <span aria-hidden="true" className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-accent" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
