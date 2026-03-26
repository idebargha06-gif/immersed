import { OWNER_UID } from "../../utils/constants.js";

function getParticipantRank(participant) {
  if (participant.leftAt) {
    return 3;
  }
  if (participant.distractedAt) {
    return 0;
  }
  if (participant.focusing) {
    return 1;
  }
  return 2;
}

export function createOwnerController({ store, repository }) {
  let roomsUnsubscribe = null;
  let roomPresenceUnsubscribe = null;
  let tickId = null;
  let previousPresenceState = new Map();

  function isOwner() {
    return store.getState().auth.user?.uid === OWNER_UID;
  }

  function closeDashboard() {
    roomsUnsubscribe?.();
    roomPresenceUnsubscribe?.();
    roomsUnsubscribe = null;
    roomPresenceUnsubscribe = null;
    previousPresenceState = new Map();
    if (tickId) {
      window.clearInterval(tickId);
      tickId = null;
    }
    store.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        ownerDashboardOpen: false
      }
    }));
  }

  function pushEvent(message, type = "neutral") {
    store.setState((state) => ({
      ...state,
      owner: {
        ...state.owner,
        eventLog: [{
          id: `event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          timestamp: Date.now(),
          message,
          type
        }, ...state.owner.eventLog].slice(0, 80)
      }
    }));
  }

  function renderOwnerParticipants(participants) {
    const sorted = [...participants].sort((left, right) => {
      const rankDiff = getParticipantRank(left) - getParticipantRank(right);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return left.name.localeCompare(right.name);
    });

    const summary = {
      total: participants.length,
      focusing: participants.filter((participant) => participant.focusing && !participant.leftAt && !participant.distractedAt).length,
      distracted: participants.filter((participant) => participant.distractedAt && !participant.leftAt).length,
      left: participants.filter((participant) => participant.leftAt).length
    };

    store.setState((state) => ({
      ...state,
      owner: {
        ...state.owner,
        participants: sorted,
        summary
      }
    }));
  }

  function processPresenceEvents(participants) {
    const nextMap = new Map(participants.map((participant) => [participant.uid, participant]));

    nextMap.forEach((participant, uid) => {
      const previous = previousPresenceState.get(uid);
      if (!previous) {
        pushEvent(`${participant.name} joined`, "success");
        if (participant.focusing) {
          pushEvent(`${participant.name} started a session`, "success");
        }
        if (participant.distractedAt) {
          pushEvent(`${participant.name} got distracted`, "warning");
        }
        return;
      }

      if (!previous.focusing && participant.focusing) {
        pushEvent(`${participant.name} started a session`, "success");
      }
      if (previous.focusing && !participant.focusing && !participant.leftAt) {
        pushEvent(`${participant.name} stopped their session`, "neutral");
      }
      if (!previous.distractedAt && participant.distractedAt) {
        pushEvent(`${participant.name} got distracted`, "warning");
      }
      if (!previous.leftAt && participant.leftAt) {
        pushEvent(`${participant.name} left the room`, "error");
      }
    });

    previousPresenceState.forEach((participant, uid) => {
      if (!nextMap.has(uid)) {
        pushEvent(`${participant.name} left the room`, "error");
      }
    });

    previousPresenceState = nextMap;
  }

  function loadOwnerRoom(roomId) {
    roomPresenceUnsubscribe?.();
    roomPresenceUnsubscribe = null;
    previousPresenceState = new Map();

    store.setState((state) => ({
      ...state,
      owner: {
        ...state.owner,
        selectedRoomId: roomId,
        participants: [],
        eventLog: [],
        summary: {
          total: 0,
          focusing: 0,
          distracted: 0,
          left: 0
        }
      }
    }));

    if (!roomId) {
      return;
    }

    roomPresenceUnsubscribe = repository.subscribeOwnerRoomPresence(roomId, (participants) => {
      processPresenceEvents(participants);
      renderOwnerParticipants(participants);
    });
  }

  function loadOwnerRooms() {
    roomsUnsubscribe?.();
    roomsUnsubscribe = repository.subscribeActiveRooms((rooms) => {
      store.setState((state) => ({
        ...state,
        owner: {
          ...state.owner,
          rooms
        }
      }));

      const selected = store.getState().owner.selectedRoomId;
      const nextRoomId = selected && rooms.some((room) => room.id === selected)
        ? selected
        : rooms[0]?.id || "";

      if (nextRoomId !== selected) {
        loadOwnerRoom(nextRoomId);
      }
    });
  }

  function openDashboard() {
    if (!isOwner()) {
      return;
    }

    store.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        ownerDashboardOpen: true,
        ownerNow: Date.now()
      }
    }));

    if (!tickId) {
      tickId = window.setInterval(() => {
        store.setState((state) => ({
          ...state,
          ui: {
            ...state.ui,
            ownerNow: Date.now()
          }
        }));
      }, 1000);
    }

    loadOwnerRooms();
  }

  return {
    isOwner,
    openDashboard,
    closeDashboard,
    loadOwnerRoom
  };
}
