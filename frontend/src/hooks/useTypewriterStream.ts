"use client";

import { useEffect, useRef, useState } from "react";

const BASE_CHARS_PER_FRAME = 3;
const MAX_CHARS_PER_FRAME = 24;
const CATCH_UP_THRESHOLD = 80;

export function useTypewriterStream(targetText: string, isActive: boolean): string {
  const [displayText, setDisplayText] = useState("");
  const displayIndexRef = useRef(0);
  const targetRef = useRef(targetText);
  const isActiveRef = useRef(isActive);

  targetRef.current = targetText;
  isActiveRef.current = isActive;

  useEffect(() => {
    if (!isActive) {
      displayIndexRef.current = targetText.length;
      setDisplayText(targetText);
      return;
    }

    if (targetText.length < displayIndexRef.current) {
      displayIndexRef.current = targetText.length;
      setDisplayText(targetText);
    }

    let frameId = 0;

    const tick = () => {
      const target = targetRef.current;
      const active = isActiveRef.current;
      const lag = target.length - displayIndexRef.current;

      if (!active || lag <= 0) {
        if (!active && displayIndexRef.current !== target.length) {
          displayIndexRef.current = target.length;
          setDisplayText(target);
        }

        return;
      }

      let charsThisFrame = BASE_CHARS_PER_FRAME;

      if (lag > CATCH_UP_THRESHOLD) {
        charsThisFrame = Math.min(MAX_CHARS_PER_FRAME, Math.ceil(lag / 10));
      } else if (lag > 30) {
        charsThisFrame = Math.min(8, BASE_CHARS_PER_FRAME + Math.ceil(lag / 15));
      }

      displayIndexRef.current = Math.min(
        target.length,
        displayIndexRef.current + charsThisFrame,
      );

      setDisplayText(target.slice(0, displayIndexRef.current));
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [targetText, isActive]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    displayIndexRef.current = 0;
    setDisplayText("");
  }, [isActive]);

  return displayText;
}
