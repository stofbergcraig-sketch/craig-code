package dev.goatclient;

import dev.goatclient.core.Module;
import dev.goatclient.core.ModuleManager;
import dev.goatclient.core.Profiles;
import dev.goatclient.game.GameModule;
import dev.goatclient.game.MovementModules;
import dev.goatclient.ui.ClickGui;
import net.minecraft.client.Minecraft;
import net.minecraft.util.ChatComponentText;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.common.gameevent.InputEvent;
import net.minecraftforge.fml.common.gameevent.TickEvent;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.client.event.RenderGameOverlayEvent;
import net.minecraftforge.client.event.RenderWorldLastEvent;
import net.minecraftforge.event.world.WorldEvent;
import org.lwjgl.input.Keyboard;
import org.lwjgl.opengl.Display;
import java.io.IOException;

@Mod(modid="goatclient", name="GoatClient", version="0.1.0", clientSideOnly=true, acceptedMinecraftVersions="[1.8.9]")
public final class GoatClient {
    public static GoatClient instance;
    public final ModuleManager modules = new ModuleManager((module,error)-> {
        System.err.println("GoatClient disabled " + module.id()); error.printStackTrace();
    });
    public Profiles profiles;
    private boolean pendingLoad;
    private int saveClock;
    private boolean profileLoaded;
    public String activeProfile="default";
    public final java.util.Map<String,String> waypoints=new java.util.TreeMap<>();
    @Mod.EventHandler public void init(FMLInitializationEvent event) {
        instance=this;
        profiles=new Profiles(Minecraft.getMinecraft().mcDataDir.toPath().resolve("goatclient/profiles"),modules);
        MovementModules.register(modules);
        dev.goatclient.game.CombatModules.register(modules);
        dev.goatclient.game.PlayerModules.register(modules);
        dev.goatclient.game.VisualModules.register(modules);
        dev.goatclient.game.WorldModules.register(modules);
        dev.goatclient.game.AdvancedModules.register(modules);
        net.minecraftforge.client.ClientCommandHandler.instance.registerCommand(new dev.goatclient.ui.GoatCommand(this));
        loadWaypoints();
        if(Boolean.getBoolean("goat.smoke")){try{Class.forName("dev.goatclient.smoke.RuntimeSmoke").newInstance();}catch(Exception e){throw new IllegalStateException(e);}}
        MinecraftForge.EVENT_BUS.register(this);
        net.minecraftforge.fml.common.FMLCommonHandler.instance().bus().register(this);
        Display.setTitle("GoatClient 0.1.0 | Minecraft 1.8.9");
        Runtime.getRuntime().addShutdownHook(new Thread(()->save(),"GoatClient configuration"));
    }
    public void save() { if(!profileLoaded)return;try { profiles.save(activeProfile); } catch(IOException e) { e.printStackTrace(); } }
    public void saveWaypoints(){java.util.Properties p=new java.util.Properties();p.putAll(waypoints);java.nio.file.Path path=Minecraft.getMinecraft().mcDataDir.toPath().resolve("goatclient/waypoints.properties");try{java.nio.file.Files.createDirectories(path.getParent());try(java.io.OutputStream out=java.nio.file.Files.newOutputStream(path)){p.store(out,"GoatClient waypoints");}}catch(IOException e){message("Could not save waypoints: "+e.getMessage());}}
    private void loadWaypoints(){java.nio.file.Path path=Minecraft.getMinecraft().mcDataDir.toPath().resolve("goatclient/waypoints.properties");if(!java.nio.file.Files.exists(path))return;try(java.io.InputStream in=java.nio.file.Files.newInputStream(path)){java.util.Properties p=new java.util.Properties();p.load(in);for(String name:p.stringPropertyNames())waypoints.put(name,p.getProperty(name));}catch(IOException e){e.printStackTrace();}}
    public void message(String text) { if(Minecraft.getMinecraft().thePlayer!=null) Minecraft.getMinecraft().thePlayer.addChatMessage(new ChatComponentText("\u00a7cGoatClient \u00a77"+text)); }
    @SubscribeEvent public void key(InputEvent.KeyInputEvent event) {
        Minecraft mc=Minecraft.getMinecraft();
        modules.key(Keyboard.getEventKey(),Keyboard.getEventKeyState(),mc.currentScreen!=null,()->mc.displayGuiScreen(new ClickGui(this)));
        if(Keyboard.getEventKeyState()) save();
    }
    @SubscribeEvent public void tick(TickEvent.ClientTickEvent event) {
        if(event.phase!=TickEvent.Phase.END) return;
        Minecraft mc=Minecraft.getMinecraft();
        if(mc.theWorld==null || mc.thePlayer==null) return;
        if(pendingLoad) { pendingLoad=false; try { activeProfile=profiles.selectedName();profiles.loadPrevious();profileLoaded=true; } catch(Exception e) { profileLoaded=false;message("Profile could not load: "+e.getMessage()); } }
        modules.tick();
        if(++saveClock%200==0)save();
    }
    @SubscribeEvent public void load(WorldEvent.Load event) { if(event.world.isRemote) pendingLoad=true; }
    @SubscribeEvent public void unload(WorldEvent.Unload event) {
        if(event.world.isRemote) { save();profileLoaded=false; modules.disconnect(); }
    }
    @SubscribeEvent public void overlay(RenderGameOverlayEvent.Post event) {
        if(event.type!=RenderGameOverlayEvent.ElementType.ALL) return;
        for(Module module:modules.all())if(module.enabled())((GameModule)module).overlay(event.resolution.getScaledWidth(),event.resolution.getScaledHeight());
    }
    @SubscribeEvent public void world(RenderWorldLastEvent event) {
        for(Module module:modules.all())if(module.enabled())((GameModule)module).world(event);
    }
    @SubscribeEvent public void open(net.minecraftforge.client.event.GuiOpenEvent event){if(event.gui instanceof net.minecraft.client.gui.GuiMainMenu)event.gui=new dev.goatclient.ui.GoatMenu();}
}
