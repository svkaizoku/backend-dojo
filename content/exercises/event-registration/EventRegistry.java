/**
 * In-memory registrations for events, each with a fixed capacity.
 * - addEvent creates an event. Capacity must be at least 1, and an event id can be added only once;
 *   otherwise throw IllegalArgumentException.
 * - register adds a user to an event. Return true if added, false if the event is full or the user is already registered.
 * - register, cancel and registrations throw IllegalArgumentException for an unknown event id.
 * - cancel removes a user's registration. Return true if the user was registered, false otherwise.
 *   The freed seat can be taken again.
 * - registrations returns the registered user ids in the order they registered.
 */
class EventRegistry {

    EventRegistry() {
    }

    void addEvent(String eventId, int capacity) {
        throw new UnsupportedOperationException("TODO: implement addEvent");
    }

    boolean register(String eventId, String userId) {
        throw new UnsupportedOperationException("TODO: implement register");
    }

    boolean cancel(String eventId, String userId) {
        throw new UnsupportedOperationException("TODO: implement cancel");
    }

    java.util.List<String> registrations(String eventId) {
        throw new UnsupportedOperationException("TODO: implement registrations");
    }
}
