"use client";

import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

let socket: Socket | null = null;

function resolveSocketUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL?.trim();
  if (explicitUrl) return explicitUrl;

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    return `${protocol}://${window.location.hostname}:4000`;
  }

  return "http://localhost:4000";
}

export function getSocket() {
  if (!socket) {
    socket = io(resolveSocketUrl(), {
      transports: ["websocket"],
    });
  }
  return socket;
}
