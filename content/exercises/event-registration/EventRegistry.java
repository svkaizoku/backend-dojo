/**
 * In-memory event registration. Each event has a type, a capacity and a requirement: the minimum skill level
 * (a whole number, 0 or more) a participant needs.
 * - addEvent creates an event. Capacity must be at least 1, requirements must be 0 or more, and an event id can be
 *   added only once; otherwise throw IllegalArgumentException.
 * - registerParticipant adds a participant to an event. Return true if added. Return false if the event is full,
 *   the participant is already registered, or skillLevel is below the event's requirements.
 *   Throw IllegalArgumentException for an unknown event id or an email that does not contain "@".
 * - cancelRegistration removes a participant's registration. Return true if the participant was registered, false
 *   otherwise. The freed seat can be taken again. Throw IllegalArgumentException for an unknown event id.
 * - findRegisteredEvents returns the ids of the events a participant is registered for, in the order they
 *   registered. A participant with no registrations gets an empty list.
 */
class EventRegistry {

    EventRegistry() {
    }

    void addEvent(String eventId, String eventType, int capacity, int requirements) {
        throw new UnsupportedOperationException("TODO: implement addEvent");
    }

    boolean registerParticipant(String eventId, String participantId, String email, int skillLevel) {
        throw new UnsupportedOperationException("TODO: implement registerParticipant");
    }

    boolean cancelRegistration(String eventId, String participantId) {
        throw new UnsupportedOperationException("TODO: implement cancelRegistration");
    }

    java.util.List<String> findRegisteredEvents(String participantId) {
        throw new UnsupportedOperationException("TODO: implement findRegisteredEvents");
    }
}
