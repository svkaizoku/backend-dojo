public class Main {
    public static void main(String[] args) {
        test("registration stops at capacity", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 2, 0);
            check(registry.registerParticipant("talk", "ann", "ann@example.com", 1), "first participant should register");
            check(registry.registerParticipant("talk", "ben", "ben@example.com", 1), "second participant should register");
            check(!registry.registerParticipant("talk", "cat", "cat@example.com", 1), "third participant should be refused when the event is full");
            check(registry.findRegisteredEvents("cat").isEmpty(), "a refused participant should have no events");
        });
        test("a participant cannot register twice", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 5, 0);
            check(registry.registerParticipant("talk", "ann", "ann@example.com", 1), "first registration should succeed");
            check(!registry.registerParticipant("talk", "ann", "ann@example.com", 1), "second registration of the same participant should be refused");
            check(registry.findRegisteredEvents("ann").equals(java.util.List.of("talk")), "talk should appear once");
        });
        test("skill level below the requirements is refused", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("workshop", "WORKSHOP", 5, 3);
            check(!registry.registerParticipant("workshop", "ann", "ann@example.com", 2), "skill 2 should be refused for requirements 3");
            check(registry.registerParticipant("workshop", "ben", "ben@example.com", 3), "skill equal to the requirements should be accepted");
            check(registry.registerParticipant("workshop", "cat", "cat@example.com", 5), "skill above the requirements should be accepted");
        });
        test("cancel frees a seat", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 1, 0);
            registry.registerParticipant("talk", "ann", "ann@example.com", 1);
            check(registry.cancelRegistration("talk", "ann"), "cancel of a registered participant should return true");
            check(registry.findRegisteredEvents("ann").isEmpty(), "ann should have no events after cancelling");
            check(registry.registerParticipant("talk", "ben", "ben@example.com", 1), "the freed seat should be available");
        });
        test("cancel returns false for a participant who is not registered", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 1, 0);
            check(!registry.cancelRegistration("talk", "ann"), "cancel of an unregistered participant should return false");
        });
        test("findRegisteredEvents keeps registration order", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 5, 0);
            registry.addEvent("workshop", "WORKSHOP", 5, 0);
            registry.addEvent("meetup", "MEETUP", 5, 0);
            registry.registerParticipant("workshop", "ann", "ann@example.com", 1);
            registry.registerParticipant("talk", "ann", "ann@example.com", 1);
            registry.registerParticipant("meetup", "ann", "ann@example.com", 1);
            check(registry.findRegisteredEvents("ann").equals(java.util.List.of("workshop", "talk", "meetup")),
                "expected [workshop, talk, meetup], got " + registry.findRegisteredEvents("ann"));
            registry.cancelRegistration("talk", "ann");
            check(registry.findRegisteredEvents("ann").equals(java.util.List.of("workshop", "meetup")),
                "after cancel expected [workshop, meetup], got " + registry.findRegisteredEvents("ann"));
        });
        test("events are independent", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 1, 0);
            registry.addEvent("workshop", "WORKSHOP", 1, 0);
            check(registry.registerParticipant("talk", "ann", "ann@example.com", 1), "ann should register for talk");
            check(registry.registerParticipant("workshop", "ann", "ann@example.com", 1), "ann should also register for workshop");
        });
        test("an unknown participant has no events", () -> {
            check(new EventRegistry().findRegisteredEvents("nobody").isEmpty(), "expected an empty list");
        });
        test("rejects a capacity below 1 and negative requirements", () -> {
            check(throwsIae(() -> new EventRegistry().addEvent("talk", "TALK", 0, 0)), "capacity 0 should throw IllegalArgumentException");
            check(throwsIae(() -> new EventRegistry().addEvent("talk", "TALK", 1, -1)), "requirements -1 should throw IllegalArgumentException");
        });
        test("rejects a duplicate event id", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 1, 0);
            check(throwsIae(() -> registry.addEvent("talk", "TALK", 3, 0)), "adding an existing event id should throw IllegalArgumentException");
        });
        test("unknown event ids throw", () -> {
            EventRegistry registry = new EventRegistry();
            check(throwsIae(() -> registry.registerParticipant("missing", "ann", "ann@example.com", 1)), "register on an unknown event should throw IllegalArgumentException");
            check(throwsIae(() -> registry.cancelRegistration("missing", "ann")), "cancel on an unknown event should throw IllegalArgumentException");
        });
        test("rejects an invalid email", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", "TALK", 5, 0);
            check(throwsIae(() -> registry.registerParticipant("talk", "ann", "not-an-email", 1)), "an email without @ should throw IllegalArgumentException");
            check(registry.findRegisteredEvents("ann").isEmpty(), "an invalid registration should leave no events");
        });
    }

    static boolean throwsIae(Runnable action) {
        try { action.run(); return false; } catch (IllegalArgumentException e) { return true; }
    }

    interface Body { void run() throws Exception; }

    static void test(String name, Body body) {
        try {
            body.run();
            System.out.println("PASS " + name);
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }
    }

    static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
