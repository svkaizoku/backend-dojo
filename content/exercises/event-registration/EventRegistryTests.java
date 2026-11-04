public class Main {
    public static void main(String[] args) {
        test("register stops at capacity", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 2);
            check(registry.register("talk", "ann"), "first user should register");
            check(registry.register("talk", "ben"), "second user should register");
            check(!registry.register("talk", "cat"), "third user should be refused when the event is full");
            check(registry.registrations("talk").size() == 2, "event should hold 2 users");
        });
        test("a user cannot register twice", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 5);
            check(registry.register("talk", "ann"), "first registration should succeed");
            check(!registry.register("talk", "ann"), "second registration of the same user should be refused");
            check(registry.registrations("talk").equals(java.util.List.of("ann")), "ann should appear once");
        });
        test("cancel frees a seat", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 1);
            registry.register("talk", "ann");
            check(registry.cancel("talk", "ann"), "cancel of a registered user should return true");
            check(registry.register("talk", "ben"), "the freed seat should be available");
        });
        test("cancel returns false for a user who is not registered", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 1);
            check(!registry.cancel("talk", "ann"), "cancel of an unregistered user should return false");
        });
        test("registrations keep registration order", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 5);
            registry.register("talk", "ben");
            registry.register("talk", "ann");
            registry.register("talk", "cat");
            check(registry.registrations("talk").equals(java.util.List.of("ben", "ann", "cat")),
                "expected [ben, ann, cat], got " + registry.registrations("talk"));
            registry.cancel("talk", "ann");
            check(registry.registrations("talk").equals(java.util.List.of("ben", "cat")),
                "after cancel expected [ben, cat], got " + registry.registrations("talk"));
        });
        test("events are independent", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 1);
            registry.addEvent("workshop", 1);
            check(registry.register("talk", "ann"), "ann should register for talk");
            check(registry.register("workshop", "ann"), "ann should also register for workshop");
        });
        test("rejects a capacity below 1", () -> {
            boolean rejected;
            try { new EventRegistry().addEvent("talk", 0); rejected = false; } catch (IllegalArgumentException e) { rejected = true; }
            check(rejected, "capacity 0 should throw IllegalArgumentException");
        });
        test("rejects a duplicate event id", () -> {
            EventRegistry registry = new EventRegistry();
            registry.addEvent("talk", 1);
            boolean rejected;
            try { registry.addEvent("talk", 3); rejected = false; } catch (IllegalArgumentException e) { rejected = true; }
            check(rejected, "adding an existing event id should throw IllegalArgumentException");
        });
        test("unknown event ids throw", () -> {
            EventRegistry registry = new EventRegistry();
            boolean rejected;
            try { registry.register("missing", "ann"); rejected = false; } catch (IllegalArgumentException e) { rejected = true; }
            check(rejected, "register on an unknown event should throw IllegalArgumentException");
        });
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
