import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

class EventRegistry {
    private static class Event {
        final String type;
        final int capacity;
        final int requirements;
        final Set<String> participants = new LinkedHashSet<>();

        Event(String type, int capacity, int requirements) {
            this.type = type;
            this.capacity = capacity;
            this.requirements = requirements;
        }
    }

    private final Map<String, Event> events = new HashMap<>();
    private final Map<String, Set<String>> eventsByParticipant = new HashMap<>();

    EventRegistry() {
    }

    void addEvent(String eventId, String eventType, int capacity, int requirements) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be at least 1");
        if (requirements < 0) throw new IllegalArgumentException("requirements must be 0 or more");
        if (events.putIfAbsent(eventId, new Event(eventType, capacity, requirements)) != null) {
            throw new IllegalArgumentException("event already exists: " + eventId);
        }
    }

    boolean registerParticipant(String eventId, String participantId, String email, int skillLevel) {
        Event event = find(eventId);
        if (email == null || !email.contains("@")) throw new IllegalArgumentException("invalid email: " + email);
        if (skillLevel < event.requirements
                || event.participants.size() >= event.capacity
                || !event.participants.add(participantId)) {
            return false;
        }
        eventsByParticipant.computeIfAbsent(participantId, id -> new LinkedHashSet<>()).add(eventId);
        return true;
    }

    boolean cancelRegistration(String eventId, String participantId) {
        if (!find(eventId).participants.remove(participantId)) return false;
        eventsByParticipant.get(participantId).remove(eventId);
        return true;
    }

    List<String> findRegisteredEvents(String participantId) {
        return new ArrayList<>(eventsByParticipant.getOrDefault(participantId, Set.of()));
    }

    private Event find(String eventId) {
        Event event = events.get(eventId);
        if (event == null) throw new IllegalArgumentException("unknown event: " + eventId);
        return event;
    }
}
