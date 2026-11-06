package dev.goatclient.core;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;

/** Main-thread dispatcher. The Forge adapter must call tick only at END phase. */
public final class ModuleManager {
    public static final int CLICK_GUI_KEY = 54; // LWJGL 2 KEY_RSHIFT
    private final Map<String, Module> modules = new LinkedHashMap<>();
    private final Set<Integer> held = new HashSet<>();
    private final BiConsumer<Module, RuntimeException> errors;
    public ModuleManager(BiConsumer<Module, RuntimeException> errors) {
        this.errors = java.util.Objects.requireNonNull(errors);
    }
    public void register(Module module) {
        if (modules.containsKey(module.id())) throw new IllegalArgumentException("Duplicate module");
        modules.put(module.id(), module);
    }
    public Collection<Module> all() { return Collections.unmodifiableCollection(modules.values()); }
    public void key(int key, boolean down, boolean screenOpen, Runnable openGui) {
        if (!down) { held.remove(key); return; }
        if (key <= 0 || !held.add(key) || screenOpen) return;
        if (key == CLICK_GUI_KEY) { openGui.run(); return; }
        for (Module module : new ArrayList<>(modules.values())) {
            if (module.key() == key) {
                try { module.setEnabled(!module.enabled()); }
                catch (RuntimeException failure) { errors.accept(module, failure); }
            }
        }
    }
    public void tick() {
        for (Module module : new ArrayList<>(modules.values())) {
            if (!module.enabled()) continue;
            try { module.onTick(); }
            catch (RuntimeException failure) {
                try { module.setEnabled(false); }
                catch (RuntimeException cleanup) { failure.addSuppressed(cleanup); }
                errors.accept(module, failure);
            }
        }
    }
    /** Disconnect/world replacement releases all owned game state. */
    public void disconnect() {
        held.clear();
        for (Module module : modules.values()) {
            try { module.setEnabled(false); }
            catch (RuntimeException failure) { errors.accept(module, failure); }
        }
    }
}
