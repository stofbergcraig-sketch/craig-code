package dev.goatclient.core;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

/** Versioned profiles; parse and validate the entire profile before touching state. */
public final class Profiles {
    private final Path directory;
    private final ModuleManager manager;
    public Profiles(Path directory, ModuleManager manager) {
        this.directory = directory; this.manager = manager;
    }
    private Path file(String name) {
        if (name == null || !name.matches("[a-zA-Z0-9_-]{1,48}"))
            throw new IllegalArgumentException("Invalid profile name");
        return directory.resolve(name + ".properties");
    }
    public void save(String name) throws IOException {
        Path target = file(name);
        Properties data = new Properties();
        data.setProperty("schema", "1");
        for (Module module : manager.all()) {
            String prefix = module.id() + ".";
            data.setProperty(prefix + "enabled", Boolean.toString(module.enabled()));
            data.setProperty(prefix + "key", Integer.toString(module.key()));
            for (Map.Entry<String, Module.Setting> entry : module.settings().entrySet())
                data.setProperty(prefix + "setting." + entry.getKey(), Double.toString(entry.getValue().get()));
        }
        write(target, data);
        Properties selected = new Properties(); selected.setProperty("profile", name);
        write(directory.resolve("selected.properties"), selected);
    }
    public boolean loadPrevious() throws IOException {
        Path selected = directory.resolve("selected.properties");
        if (!Files.exists(selected)) return false;
        load(read(selected).getProperty("profile")); return true;
    }
    public String selectedName() throws IOException {
        Path selected=directory.resolve("selected.properties");
        if(!Files.exists(selected))return "default";
        String name=read(selected).getProperty("profile");file(name);return name;
    }
    public void load(String name) throws IOException {
        Properties data = read(file(name));
        if (!"1".equals(data.getProperty("schema"))) throw new IOException("Unsupported profile schema");
        Map<Module, Integer> keys = new LinkedHashMap<>();
        Map<Module, Boolean> enabled = new LinkedHashMap<>();
        Map<Module.Setting, Double> settings = new LinkedHashMap<>();
        try {
            for (Module module : manager.all()) {
                String prefix = module.id() + ".";
                int key = Integer.parseInt(data.getProperty(prefix + "key", "0"));
                if (key < 0 || key > 255) throw new IllegalArgumentException("Invalid key");
                String active = data.getProperty(prefix + "enabled", "false");
                if (!active.equals("true") && !active.equals("false")) throw new IllegalArgumentException("Invalid enabled state");
                keys.put(module, key); enabled.put(module, Boolean.parseBoolean(active));
                for (Map.Entry<String, Module.Setting> entry : module.settings().entrySet()) {
                    Module.Setting setting = entry.getValue();
                    double value = Double.parseDouble(data.getProperty(prefix + "setting." + entry.getKey(), Double.toString(setting.initial())));
                    setting.validate(value); settings.put(setting, value);
                }
            }
        } catch (IllegalArgumentException failure) { throw new IOException("Invalid profile", failure); }
        // Disable before changing settings so cleanup uses the old configuration.
        manager.disconnect();
        settings.forEach(Module.Setting::set);
        keys.forEach(Module::bind);
        enabled.forEach(Module::setEnabled);
        Properties selected = new Properties(); selected.setProperty("profile", name);
        write(directory.resolve("selected.properties"), selected);
    }
    public void reset() {
        manager.disconnect();
        for (Module module : manager.all()) {
            module.bind(0);
            module.settings().values().forEach(setting -> setting.set(setting.initial()));
        }
    }
    private static Properties read(Path path) throws IOException {
        Properties data = new Properties();
        try (InputStream input = Files.newInputStream(path)) { data.load(input); }
        catch (IllegalArgumentException failure) { throw new IOException("Malformed properties", failure); }
        return data;
    }
    private void write(Path path, Properties data) throws IOException {
        Files.createDirectories(directory);
        Path temp = Files.createTempFile(directory, ".goat-", ".tmp");
        try {
            try (OutputStream output = Files.newOutputStream(temp)) { data.store(output, "GoatClient profile"); }
            try { Files.move(temp, path, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); }
            catch (AtomicMoveNotSupportedException failure) { Files.move(temp, path, StandardCopyOption.REPLACE_EXISTING); }
        } finally { Files.deleteIfExists(temp); }
    }
}
