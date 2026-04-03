"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ConnectionStateLabel =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

type StudentTile = {
  peerId: string;
  roomId: string;
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
  roomId?: string;
};

type OfferPayload = {
  sdp?: RTCSessionDescriptionInit;
  from?: string;
  roomId?: string;
};

type IceCandidatePayload = {
  candidate?: RTCIceCandidateInit;
  from?: string;
  roomId?: string;
};

type PeerLeftPayload = {
  role?: "teacher" | "student";
  socketId?: string;
  roomId?: string;
};

type LiveMonitorPanelProps = {
  roomIds?: string[];
};

function StudentStreamTile({
  tile,
}: {
  tile: StudentTile;
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

  const title = `Student ${tile.peerId.slice(0, 6)}`;
  const subtitle = `${tile.connectionState} - ${tile.roomId.replace("exam-room-", "")}`;

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
        {tile.stream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            controls={false}
            className="h-full w-full rounded-lg bg-black object-contain"
          />
        ) : (
          <div className="h-full w-full p-3">
            <Skeleton className="h-full w-full rounded-md bg-white/10" />
          </div>
        )}
      </div>

      <p className="mt-2 truncate text-[11px] text-white/50">
        {tile.debug ?? "No signaling event yet"}
      </p>
    </div>
  );
}

export function LiveMonitorPanel({
  roomIds,
}: LiveMonitorPanelProps) {
  const peersRef = useRef<Map<string, PeerConnectionEntry>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const peerRoomRef = useRef<Map<string, string>>(new Map());
  const [tiles, setTiles] = useState<StudentTile[]>([]);
  const [status, setStatus] = useState("Waiting for students...");
  const [panelDebug, setPanelDebug] = useState("No signaling event yet");
  const normalizedRoomIds = useMemo(() => {
    const raw = roomIds ?? [];
    return Array.from(new Set(raw.filter(Boolean)));
  }, [roomIds]);

  useEffect(() => {
    setTiles([]);

    if (normalizedRoomIds.length === 0) {
      setStatus("No live exam rooms");
      setPanelDebug("No room selected");
      return;
    }

    const socket = getSocket();

    const upsertTile = (
      peerId: string,
      fallbackRoomId: string,
      patch: Partial<StudentTile>,
    ) => {
      setTiles((prev) => {
        const index = prev.findIndex((tile) => tile.peerId === peerId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...patch };
          return next;
        }

        return [
          ...prev,
          {
            peerId,
            roomId: fallbackRoomId,
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
      peerRoomRef.current.delete(peerId);
      pendingIceRef.current.delete(peerId);
      setTiles((prev) => prev.filter((tile) => tile.peerId !== peerId));
    };

    const getOrCreatePeerConnection = (peerId: string, nextRoomId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing.pc;

      peerRoomRef.current.set(peerId, nextRoomId);
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

        upsertTile(peerId, nextRoomId, {
          stream,
          debug: `track received: ${event.track.kind}`,
        });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const signalRoomId = peerRoomRef.current.get(peerId) ?? nextRoomId;
        socket.emit("ice-candidate", {
          roomId: signalRoomId,
          candidate: event.candidate,
          to: peerId,
        });
      };

      pc.onconnectionstatechange = () => {
        upsertTile(peerId, nextRoomId, {
          connectionState: pc.connectionState,
          debug: `connection ${pc.connectionState}`,
        });
      };

      peersRef.current.set(peerId, { pc, stream: null });
      upsertTile(peerId, nextRoomId, {
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

    for (const nextRoomId of normalizedRoomIds) {
      socket.emit("join-room", {
        roomId: nextRoomId,
        role: "teacher",
      });
    }

    socket.on("peer-joined", ({ role, socketId, roomId: joinedRoomId }: PeerJoinedPayload) => {
      if (role === "student" && socketId && joinedRoomId) {
        if (!normalizedRoomIds.includes(joinedRoomId)) return;
        peerRoomRef.current.set(socketId, joinedRoomId);
        setStatus("Student joined. Waiting for offer...");
        setPanelDebug("Student joined and offer requested");
        socket.emit("request-offer", { roomId: joinedRoomId, to: socketId });
      }
    });

    socket.on("offer", async ({ sdp, from, roomId: offeredRoomId }: OfferPayload) => {
      if (!sdp || !from) return;
      const resolvedRoomId =
        offeredRoomId ??
        peerRoomRef.current.get(from) ??
        normalizedRoomIds[0];
      if (!resolvedRoomId || !normalizedRoomIds.includes(resolvedRoomId)) return;
      peerRoomRef.current.set(from, resolvedRoomId);

      try {
        const pc = getOrCreatePeerConnection(from, resolvedRoomId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", {
          roomId: resolvedRoomId,
          sdp: answer,
          to: from,
        });

        upsertTile(from, resolvedRoomId, {
          connectionState: "connecting",
          debug: "offer accepted and answer sent",
        });
        setStatus("Connecting student streams...");
        setPanelDebug("Offer handled successfully");
      } catch (error) {
        console.error("offer handling error:", error);
        upsertTile(from, resolvedRoomId, {
          connectionState: "failed",
          debug: "offer handling failed",
        });
        setPanelDebug("Offer handling failed");
      }
    });

    socket.on("ice-candidate", async ({ candidate, from, roomId: candidateRoomId }: IceCandidatePayload) => {
      if (!candidate || !from) return;
      const resolvedRoomId =
        candidateRoomId ??
        peerRoomRef.current.get(from) ??
        normalizedRoomIds[0];
      if (!resolvedRoomId || !normalizedRoomIds.includes(resolvedRoomId)) return;
      peerRoomRef.current.set(from, resolvedRoomId);

      const entry = peersRef.current.get(from);
      if (!entry || !entry.pc.remoteDescription) {
        const queued = pendingIceRef.current.get(from) ?? [];
        queued.push(candidate);
        pendingIceRef.current.set(from, queued);
        upsertTile(from, resolvedRoomId, {
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

    socket.on("peer-left", ({ role, socketId, roomId: leftRoomId }: PeerLeftPayload) => {
      if (role === "student") {
        if (leftRoomId && !normalizedRoomIds.includes(leftRoomId)) return;
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
      peerRoomRef.current.clear();
      pendingIceRef.current.clear();
      setTiles([]);
    };
  }, [normalizedRoomIds]);

  const connectedCount = useMemo(
    () =>
      tiles.filter((tile) => tile.connectionState === "connected").length,
    [tiles],
  );

  const visibleTiles = useMemo(() => {
    return [...tiles].sort((a, b) => a.roomId.localeCompare(b.roomId));
  }, [tiles]);

  return (
    <Card className="rounded-2xl border-[var(--monitoring-dark-border)] bg-white shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-[var(--monitoring-dark)]">
          Live camera monitoring
        </h2>
        <p className="mt-1 text-sm text-[var(--monitoring-muted)]">
          {status} - connected {connectedCount}/{visibleTiles.length || 0} - rooms{" "}
          {normalizedRoomIds.length}
        </p>
        <p className="mb-4 text-xs text-[var(--monitoring-muted)]/80">
          {panelDebug}
        </p>

        {visibleTiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--monitoring-dark-border)] bg-[var(--monitoring-primary-surface)] px-4 py-6 text-center text-sm text-[var(--monitoring-muted)]">
            Одоогоор live stream холбогдоогүй байна.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleTiles.map((tile) => (
              <StudentStreamTile key={tile.peerId} tile={tile} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
