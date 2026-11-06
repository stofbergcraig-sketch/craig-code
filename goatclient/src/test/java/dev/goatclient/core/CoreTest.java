package dev.goatclient.core;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public final class CoreTest {
    static final class Probe extends Module {
        final Setting speed = setting("speed", 1, 0.1, 5);
        int ticks, starts, stops;
        boolean broken, failEnable;
        Probe(String id) { super(id, Category.MOVEMENT); }
        protected void onEnable() { starts++; if (failEnable) throw new IllegalStateException("enable failure"); }
        protected void onDisable() { stops++; }
        public void onTick() { ticks++; if (broken) throw new IllegalStateException("tick failure"); }
    }
    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
    public static void main(String[] args) throws Exception {
        List<RuntimeException> errors = new ArrayList<>();
        ModuleManager manager = new ModuleManager((module, failure) -> errors.add(failure));
        Probe first = new Probe("first"), second = new Probe("second");
        manager.register(first); manager.register(second);
        try { manager.register(new Probe("first")); throw new AssertionError("duplicate accepted"); }
        catch (IllegalArgumentException expected) { }
        System.out.println("PASS duplicate registration rejected");

        first.bind(20);
        manager.key(20, true, false, () -> {}); manager.key(20, true, false, () -> {});
        check(first.enabled() && first.starts == 1, "repeat toggled module");
        manager.key(20, false, false, () -> {}); manager.key(20, true, false, () -> {});
        check(!first.enabled() && first.stops == 1, "release/repress failed");
        manager.key(20, false, false, () -> {}); manager.key(20, true, true, () -> {});
        check(!first.enabled(), "GUI typing toggled module");
        int[] gui = {0};
        manager.key(54, true, false, () -> gui[0]++); manager.key(54, true, false, () -> gui[0]++);
        check(gui[0] == 1, "Right Shift edge handling failed");
        System.out.println("PASS key edges, typing suppression and Right Shift action");

        first.setEnabled(true); second.setEnabled(true); first.broken = true;
        manager.tick();
        check(!first.enabled() && second.ticks == 1 && errors.size() == 1, "failure isolation failed");
        manager.disconnect(); check(!second.enabled() && second.stops == 1, "disconnect leaked state");
        first.broken = false; first.failEnable = true;
        int stops = first.stops;
        try { first.setEnabled(true); throw new AssertionError("enable failure hidden"); }
        catch (IllegalStateException expected) { }
        check(!first.enabled() && first.stops == stops + 1, "enable rollback failed");
        first.failEnable = false;
        System.out.println("PASS fault isolation, failed-enable cleanup and disconnect cleanup");

        Path directory = Files.createTempDirectory("goat-profile-test-");
        try {
            Profiles profiles = new Profiles(directory, manager);
            first.speed.set(3); first.bind(30); first.setEnabled(true); profiles.save("local");
            profiles.reset();
            check(!first.enabled() && first.key() == 0 && first.speed.get() == 1, "defaults failed");
            ModuleManager fresh = new ModuleManager((module, failure) -> { throw failure; });
            Probe restored = new Probe("first"); fresh.register(restored); fresh.register(new Probe("second"));
            Profiles reopened = new Profiles(directory, fresh);
            check(reopened.loadPrevious(), "previous profile missing after restart");
            check(restored.enabled() && restored.key() == 30 && restored.speed.get() == 3, "restart persistence failed");
            restored.speed.set(2); reopened.save("alternate"); reopened.load("local");
            check(restored.speed.get() == 3, "profiles overwrote one another");
            System.out.println("PASS multiple profiles, defaults and fresh-manager restart persistence");

            Files.write(directory.resolve("broken.properties"),
                "schema=1\nfirst.enabled=false\nfirst.key=40\nfirst.setting.speed=NaN\n".getBytes(StandardCharsets.ISO_8859_1));
            try { reopened.load("broken"); throw new AssertionError("invalid profile accepted"); }
            catch (IOException expected) { }
            check(restored.enabled() && restored.key() == 30 && restored.speed.get() == 3, "invalid profile changed live state");
            try { reopened.save("../escape"); throw new AssertionError("path traversal accepted"); }
            catch (IllegalArgumentException expected) { }
            try { restored.speed.set(Double.POSITIVE_INFINITY); throw new AssertionError("non-finite setting accepted"); }
            catch (IllegalArgumentException expected) { }
            System.out.println("PASS malformed profile preserves state, profile traversal rejected, numeric validation");
        } finally {
            try (java.util.stream.Stream<Path> paths = Files.walk(directory)) {
                for (Path path : (Iterable<Path>) paths.sorted(java.util.Comparator.reverseOrder())::iterator)
                    Files.delete(path);
            }
        }
    }
}
