import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

class EventRegistry {
    private static class Event {
        final int capacity;
        final Set<String> users = new LinkedHashSet<>();

        Event(int capacity) {
            this.capacity = capacity;
        }
    }

    private final Map<String, Event> events = new HashMap<>();

    EventRegistry() {
    }

    void addEvent(String eventId, int capacity) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be at least 1");
        if (events.putIfAbsent(eventId, new Event(capacity)) != null) {
            throw new IllegalArgumentException("event already exists: " + eventId);
        }
    }

    boolean register(String eventId, String userId) {
        Event event = find(eventId);
        if (event.users.contains(userId) || event.users.size() >= event.capacity) return false;
        return event.users.add(userId);
    }

    boolean cancel(String eventId, String userId) {
        return find(eventId).users.remove(userId);
    }

    List<String> registrations(String eventId) {
        return new ArrayList<>(find(eventId).users);
    }

    private Event find(String eventId) {
        Event event = events.get(eventId);
        if (event == null) throw new IllegalArgumentException("unknown event: " + eventId);
        return event;
    }
}
