"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Card, CardContent } from "@/components/ui/card";

const MAX_VISIBLE_STUDENTS = 4;

type ConnectionStateLabel =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

type StudentTile = {
  peerId: string;
  stream: MediaStream | null;
  connectionState: ConnectionStateLabel;
  debug: string;
};

type PeerConnectionEntry = {
  pc: RTCPeerConnection;
  stream: MediaStream | null;
};

type PeerJoinedPayload = {
  role?: "teacher" | "student";
  socketId?: string;
};

type OfferPayload = {
  sdp?: RTCSessionDescriptionInit;
  from?: string;
};

type IceCandidatePayload = {
  candidate?: RTCIceCandidateInit;
  from?: string;
};

type PeerLeftPayload = {
  role?: "teacher" | "student";
  socketId?: string;
};

type LiveMonitorPanelProps = {
  roomId?: string;
};

function StudentStreamTile({
  tile,
  slotIndex,
}: {
  tile: StudentTile | null;
  slotIndex: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!tile?.stream) {
      video.srcObject = null;
      return;
    }

    video.srcObject = tile.stream;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch (error) {
        console.error("video play error:", error);
      }
    };

    void tryPlay();
  }, [tile?.stream]);

  const title = tile
    ? `Student ${slotIndex + 1}`
    : `Waiting student ${slotIndex + 1}`;
  const subtitle = tile
    ? `${tile.connectionState} - ${tile.peerId.slice(0, 8)}`
    : "No stream yet";

  return (
    <div className="rounded-xl border border-[var(--monitoring-dark-border)] bg-black/95 p-2">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <p className="truncate font-medium text-white/90">{title}</p>
        <p
          className={`truncate ${
            tile?.connectionState === "connected"
              ? "text-emerald-300"
              : "text-white/60"
          }`}
        >
          {subtitle}
        </p>
      </div>

      <div className="relative aspect-video rounded-lg bg-black">
        {tile?.stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            controls={false}
            className="h-full w-full rounded-lg bg-black object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
            Student camera is waiting...
          </div>
        )}
      </div>

      <p className="mt-2 truncate text-[11px] text-white/50">
        {tile?.debug ?? "No signaling event yet"}
      </p>
    </div>
  );
}

export function LiveMonitorPanel({
  roomId = "exam-room-1",
}: LiveMonitorPanelProps) {
  const peersRef = useRef<Map<string, PeerConnectionEntry>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [tiles, setTiles] = useState<StudentTile[]>([]);
  const [status, setStatus] = useState("Waiting for students...");
  const [panelDebug, setPanelDebug] = useState("No signaling event yet");

  useEffect(() => {
    const socket = getSocket();

    const upsertTile = (peerId: string, patch: Partial<StudentTile>) => {
      setTiles((prev) => {
        const index = prev.findIndex((tile) => tile.peerId === peerId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...patch };
          return next;
        }

        if (prev.length >= MAX_VISIBLE_STUDENTS) {
          return prev;
        }

        return [
          ...prev,
          {
            peerId,
            stream: null,
            connectionState: "new",
            debug: "peer discovered",
            ...patch,
          },
        ];
      });
    };

    const removePeer = (peerId: string) => {
      const entry = peersRef.current.get(peerId);
      if (entry) {
        entry.pc.close();
        peersRef.current.delete(peerId);
      }
      pendingIceRef.current.delete(peerId);
      setTiles((prev) => prev.filter((tile) => tile.peerId !== peerId));
    };

    const getOrCreatePeerConnection = (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing.pc;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pc.ontrack = (event) => {
        const stream =
          event.streams[0] ??
          (() => {
            const manualStream = new MediaStream();
            manualStream.addTrack(event.track);
            return manualStream;
          })();

        const entry = peersRef.current.get(peerId);
        if (entry) {
          entry.stream = stream;
        }

        upsertTile(peerId, {
          stream,
          debug: `track received: ${event.track.kind}`,
        });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
          to: peerId,
        });
      };

      pc.onconnectionstatechange = () => {
        upsertTile(peerId, {
          connectionState: pc.connectionState,
          debug: `connection ${pc.connectionState}`,
        });
      };

      peersRef.current.set(peerId, { pc, stream: null });
      upsertTile(peerId, {
        connectionState: "new",
        debug: "peer connection created",
      });

      return pc;
    };

    const flushPendingIce = async (peerId: string) => {
      const pending = pendingIceRef.current.get(peerId);
      if (!pending || pending.length === 0) return;
      const entry = peersRef.current.get(peerId);
      if (!entry) return;

      for (const candidate of pending) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error applying queued ICE candidate:", error);
        }
      }

      pendingIceRef.current.delete(peerId);
    };

    socket.emit("join-room", {
      roomId,
      role: "teacher",
    });

    socket.on("peer-joined", ({ role, socketId }: PeerJoinedPayload) => {
      if (role === "student" && socketId) {
        setStatus("Student joined. Waiting for offer...");
        setPanelDebug("Student joined and offer requested");
        socket.emit("request-offer", { roomId, to: socketId });
      }
    });

    socket.on("offer", async ({ sdp, from }: OfferPayload) => {
      if (!sdp || !from) return;

      if (
        peersRef.current.size >= MAX_VISIBLE_STUDENTS &&
        !peersRef.current.has(from)
      ) {
        setPanelDebug("Skipped extra stream. Visible limit reached (4).");
        return;
      }

      try {
        const pc = getOrCreatePeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          roomId,
          sdp: answer,
          to: from,
        });

        upsertTile(from, {
          connectionState: "connecting",
          debug: "offer accepted and answer sent",
        });
        setStatus("Connecting student streams...");
        setPanelDebug("Offer handled successfully");
      } catch (error) {
        console.error("offer handling error:", error);
        upsertTile(from, {
          connectionState: "failed",
          debug: "offer handling failed",
        });
        setPanelDebug("Offer handling failed");
      }
    });

    socket.on("ice-candidate", async ({ candidate, from }: IceCandidatePayload) => {
      if (!candidate || !from) return;

      const entry = peersRef.current.get(from);
      if (!entry || !entry.pc.remoteDescription) {
        const queued = pendingIceRef.current.get(from) ?? [];
        queued.push(candidate);
        pendingIceRef.current.set(from, queued);
        upsertTile(from, {
          debug: `queued ICE candidate (${queued.length})`,
        });
        return;
      }

      try {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("peer-left", ({ role, socketId }: PeerLeftPayload) => {
      if (role === "student") {
        if (socketId) {
          removePeer(socketId);
        }
        setStatus("Student disconnected");
        setPanelDebug("A student left the room");
      }
    });

    return () => {
      socket.off("peer-joined");
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("peer-left");

      for (const [, entry] of peersRef.current) {
        entry.pc.close();
      }
      peersRef.current.clear();
      pendingIceRef.current.clear();
    };
  }, [roomId]);

  const connectedCount = useMemo(
    () =>
      tiles.filter((tile) => tile.connectionState === "connected").length,
    [tiles],
  );

  const visibleTiles: Array<StudentTile | null> = useMemo(() => {
    const current: Array<StudentTile | null> = [
      ...tiles.slice(0, MAX_VISIBLE_STUDENTS),
    ];
    while (current.length < MAX_VISIBLE_STUDENTS) {
      current.push(null);
    }
    return current;
  }, [tiles]);

  return (
    <Card className="rounded-2xl border-[var(--monitoring-dark-border)] bg-white shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-[var(--monitoring-dark)]">
          Live camera monitoring (4 students)
        </h2>
        <p className="mt-1 text-sm text-[var(--monitoring-muted)]">
          {status} - connected {connectedCount}/{MAX_VISIBLE_STUDENTS} - room{" "}
          {roomId}
        </p>
        <p className="mb-4 text-xs text-[var(--monitoring-muted)]/80">
          {panelDebug}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleTiles.map((tile, index) => (
            <StudentStreamTile
              key={tile?.peerId ?? `waiting-slot-${index}`}
              tile={tile}
              slotIndex={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
