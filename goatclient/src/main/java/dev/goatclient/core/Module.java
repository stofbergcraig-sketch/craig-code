package dev.goatclient.core;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** A module owns the state it changes and must restore it in onDisable. */
public abstract class Module {
    public enum Category { COMBAT, MOVEMENT, PLAYER, RENDER, WORLD }
    private final String id;
    private final Category category;
    private final Map<String, Setting> settings = new LinkedHashMap<>();
    private boolean enabled;
    private int key;

    protected Module(String id, Category category) {
        if (!id.matches("[a-z][a-z0-9-]*")) throw new IllegalArgumentException("Invalid module id");
        this.id = id;
        this.category = java.util.Objects.requireNonNull(category);
    }
    protected final Setting setting(String id, double initial, double min, double max) {
        if (!id.matches("[a-z][a-z0-9-]*") || settings.containsKey(id))
            throw new IllegalArgumentException("Invalid or duplicate setting");
        Setting value = new Setting(initial, min, max);
        settings.put(id, value);
        return value;
    }
    public final String id() { return id; }
    public final Category category() { return category; }
    public final boolean enabled() { return enabled; }
    public final int key() { return key; }
    public final void bind(int key) {
        if (key < 0 || key > 255) throw new IllegalArgumentException("Invalid LWJGL key");
        this.key = key;
    }
    public final Map<String, Setting> settings() { return Collections.unmodifiableMap(settings); }
    public final void setEnabled(boolean value) {
        if (enabled == value) return;
        if (value) {
            try { onEnable(); enabled = true; }
            catch (RuntimeException failure) {
                try { onDisable(); } catch (RuntimeException cleanup) { failure.addSuppressed(cleanup); }
                throw failure;
            }
        } else {
            enabled = false;
            onDisable();
        }
    }
    protected void onEnable() {}
    protected void onDisable() {}
    public abstract void onTick();

    public static final class Setting {
        private final double initial, min, max;
        private double value;
        private Setting(double initial, double min, double max) {
            if (!Double.isFinite(min) || !Double.isFinite(max) || min > max)
                throw new IllegalArgumentException("Invalid bounds");
            this.initial = initial; this.min = min; this.max = max; set(initial);
        }
        public double get() { return value; }
        public double initial() { return initial; }
        public double min() { return min; }
        public double max() { return max; }
        public void validate(double value) {
            if (!Double.isFinite(value) || value < min || value > max)
                throw new IllegalArgumentException("Setting outside bounds");
        }
        public void set(double value) { validate(value); this.value = value; }
    }
}
