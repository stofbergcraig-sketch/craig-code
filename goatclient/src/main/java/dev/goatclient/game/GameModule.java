package dev.goatclient.game;

import dev.goatclient.core.Module;
import net.minecraft.client.Minecraft;
import net.minecraftforge.client.event.RenderWorldLastEvent;

public abstract class GameModule extends Module {
    protected final Minecraft mc = Minecraft.getMinecraft();
    public final String description;
    public final boolean localOnly;
    public final Setting interval;
    protected int clock;
    protected GameModule(String id, Category category, String description, boolean localOnly) {
        super(id, category);
        this.description = description; this.localOnly = localOnly;
        boolean renderOnly = java.util.Arrays.asList("reach-display","tracers","esp","chest-esp","name-tags","hud","coordinates","scaffold-preview","waypoints","no-fall").contains(id);
        interval = renderOnly ? null : setting("interval-ticks", 1, 1, 100);
    }
    public final void onTick() {
        if (mc.thePlayer == null || mc.theWorld == null || (mc.currentScreen != null && !screensAllowed())) return;
        if (localOnly && !mc.isSingleplayer()) { setEnabled(false); return; }
        ++clock;
        if (interval == null || clock % (int) interval.get() == 0) tick();
    }
    protected abstract void tick();
    protected boolean screensAllowed() { return false; }
    public void overlay(int width, int height) {}
    public void world(RenderWorldLastEvent event) {}
    public final Setting option(String id, double value, double min, double max) { return setting(id,value,min,max); }
    public String label() {
        StringBuilder out = new StringBuilder();
        for (String part : id().split("-")) { if (out.length()>0) out.append(' '); out.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1)); }
        return out.toString();
    }
}
