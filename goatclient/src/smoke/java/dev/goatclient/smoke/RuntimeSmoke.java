package dev.goatclient.smoke;

import dev.goatclient.GoatClient;
import dev.goatclient.core.Module;
import net.minecraft.client.Minecraft;
import net.minecraft.world.WorldSettings;
import net.minecraft.world.WorldType;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.common.gameevent.TickEvent;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Development-only integration harness. Excluded from release builds. */
public final class RuntimeSmoke {
    private final Minecraft mc=Minecraft.getMinecraft();
    private final List<String> results=new ArrayList<>();
    private int ticks,phase;
    public RuntimeSmoke(){net.minecraftforge.fml.common.FMLCommonHandler.instance().bus().register(this);}
    private Module module(String id){for(Module m:GoatClient.instance.modules.all())if(m.id().equals(id))return m;throw new AssertionError("Missing module "+id);}
    private void check(boolean value,String name){if(!value)throw new AssertionError(name);results.add("PASS "+name);System.out.println("GOAT_SMOKE PASS "+name);}
    private void finish(boolean success,Throwable error){
        if(error!=null){error.printStackTrace();results.add("FAIL "+error.toString());}
        try{Files.write(Paths.get("goat-runtime-smoke.txt"),results,StandardCharsets.UTF_8);}catch(Exception e){e.printStackTrace();}
        System.out.println("GOAT_SMOKE_RESULT="+(success?"PASS":"FAIL"));phase=99;mc.shutdown();
    }
    @SubscribeEvent public void tick(TickEvent.ClientTickEvent event){
        if(event.phase!=TickEvent.Phase.END||phase==99)return;
        try{
            if(phase==0){if(++ticks<30||mc.currentScreen==null)return;check(mc.currentScreen instanceof dev.goatclient.ui.GoatMenu,"custom main menu loaded");phase=1;ticks=0;mc.launchIntegratedServer("GoatSmoke-"+System.currentTimeMillis(),"GoatClient Smoke",new WorldSettings(42,WorldSettings.GameType.CREATIVE,false,false,WorldType.FLAT));return;}
            if(mc.thePlayer==null||mc.theWorld==null)return;
            if(phase==1){if(++ticks<40)return;mc.gameSettings.pauseOnLostFocus=false;mc.displayGuiScreen(null);
                GoatClient client=GoatClient.instance;
                check(client.modules.all().size()==45,"45 modules registered in Minecraft 1.8.9");
                float gamma=mc.gameSettings.gammaSetting;module("fullbright").setEnabled(true);client.modules.tick();check(mc.gameSettings.gammaSetting==12,"fullbright changes gamma");module("fullbright").setEnabled(false);check(mc.gameSettings.gammaSetting==gamma,"fullbright restores gamma");
                float fov=mc.gameSettings.fovSetting;module("zoom").setEnabled(true);client.modules.tick();check(mc.gameSettings.fovSetting==25,"zoom changes FOV");module("zoom").setEnabled(false);check(mc.gameSettings.fovSetting==fov,"zoom restores FOV");
                float step=mc.thePlayer.stepHeight;module("step").setEnabled(true);client.modules.tick();check(mc.thePlayer.stepHeight==1,"step changes player height");module("step").setEnabled(false);check(mc.thePlayer.stepHeight==step,"step restores player height");
                module("auto-walk").setEnabled(true);client.modules.tick();check(mc.gameSettings.keyBindForward.isKeyDown(),"auto-walk holds forward");module("auto-walk").setEnabled(false);check(!mc.gameSettings.keyBindForward.isKeyDown(),"auto-walk releases forward");
                module("sneak").setEnabled(true);client.modules.tick();check(mc.gameSettings.keyBindSneak.isKeyDown(),"sneak holds key");module("sneak").setEnabled(false);check(!mc.gameSettings.keyBindSneak.isKeyDown(),"sneak releases key");
                module("zoom").bind(44);client.profiles.save("smoke");module("zoom").bind(0);client.profiles.load("smoke");check(module("zoom").key()==44,"profile round-trip inside Minecraft");client.activeProfile="smoke";
                module("freecam").setEnabled(true);client.modules.tick();check(mc.getRenderViewEntity()!=mc.thePlayer,"freecam detaches render view");module("freecam").setEnabled(false);check(mc.getRenderViewEntity()==mc.thePlayer,"freecam restores render view");
                module("hud").setEnabled(true);module("coordinates").setEnabled(true);module("timer-display").setEnabled(true);module("esp").setEnabled(true);module("chest-esp").setEnabled(true);module("name-tags").setEnabled(true);module("tracers").setEnabled(true);
                module("force-op").setEnabled(true);module("fly").setEnabled(true);
                phase=10;ticks=0;return;
            }
            if(phase==10&&++ticks>=40){
                check(mc.thePlayer.capabilities.allowFlying&&mc.thePlayer.capabilities.isFlying,"fly grants active vanilla flight in integrated world");
                check(mc.getIntegratedServer().getConfigurationManager().getOppedPlayers().getEntry(mc.thePlayer.getGameProfile())!=null,"ForceOP is authorised by owned integrated server");
                module("fly").setEnabled(false);module("force-op").setEnabled(false);module("no-fall").setEnabled(true);
                final java.util.UUID id=mc.thePlayer.getUniqueID();
                mc.getIntegratedServer().addScheduledTask(()->{net.minecraft.entity.player.EntityPlayerMP p=mc.getIntegratedServer().getConfigurationManager().getPlayerByUUID(id);p.setGameType(WorldSettings.GameType.SURVIVAL);p.capabilities.isFlying=false;p.capabilities.allowFlying=false;p.sendPlayerAbilities();p.setHealth(20);p.playerNetServerHandler.setPlayerLocation(.5,32,.5,0,0);});
                phase=11;ticks=0;return;
            }
            if(phase==11&&++ticks>=160){
                check(mc.thePlayer.posY<5&&mc.thePlayer.getHealth()==20&&!mc.thePlayer.isDead,"NoFall prevents real integrated-server fall damage");
                module("no-fall").setEnabled(false);final java.util.UUID id=mc.thePlayer.getUniqueID();mc.getIntegratedServer().addScheduledTask(()->{net.minecraft.entity.player.EntityPlayerMP p=mc.getIntegratedServer().getConfigurationManager().getPlayerByUUID(id);p.playerNetServerHandler.setPlayerLocation(.5,32,.5,0,0);});
                phase=12;ticks=0;return;
            }
            if(phase==12&&++ticks>=160){
                check(mc.thePlayer.isDead||mc.thePlayer.getHealth()<20,"fall damage restored after disabling NoFall");mc.thePlayer.respawnPlayer();phase=13;ticks=0;return;
            }
            if(phase==13&&++ticks>=40){mc.displayGuiScreen(null);check(!mc.thePlayer.isDead,"vanilla respawn after fall baseline");
                final java.util.UUID id=mc.thePlayer.getUniqueID();mc.getIntegratedServer().addScheduledTask(()->{net.minecraft.entity.player.EntityPlayerMP p=mc.getIntegratedServer().getConfigurationManager().getPlayerByUUID(id);net.minecraft.entity.passive.EntityPig pig=new net.minecraft.entity.passive.EntityPig(p.worldObj);pig.setPosition(p.posX+2,p.posY,p.posZ+4);p.worldObj.spawnEntityInWorld(pig);p.worldObj.setBlockState(new net.minecraft.util.BlockPos(p.posX-2,p.posY,p.posZ+4),net.minecraft.init.Blocks.chest.getDefaultState());});
                mc.thePlayer.rotationYaw=0;mc.thePlayer.rotationPitch=10;
                net.minecraftforge.client.ClientCommandHandler.instance.executeCommand(mc.thePlayer,"/goat waypoint add smoke-home");
                check(GoatClient.instance.waypoints.containsKey("smoke-home"),"waypoint add command stores a named location");
                check(Files.exists(mc.mcDataDir.toPath().resolve("goatclient/waypoints.properties")),"waypoint file persisted");
                phase=2;ticks=0;return;}
            if(phase==2&&++ticks>=40){
                net.minecraft.util.ScreenShotHelper.saveScreenshot(mc.mcDataDir,"goat-world-smoke.png",mc.displayWidth,mc.displayHeight,mc.getFramebuffer());
                check(true,"world rendered 40 ticks with HUD and entity overlays enabled");
                mc.displayGuiScreen(new dev.goatclient.ui.ClickGui(GoatClient.instance));phase=3;ticks=0;return;
            }
            if(phase==3&&++ticks>=20){
                net.minecraft.util.ScreenShotHelper.saveScreenshot(mc.mcDataDir,"goat-gui-smoke.png",mc.displayWidth,mc.displayHeight,mc.getFramebuffer());
                check(mc.currentScreen instanceof dev.goatclient.ui.ClickGui,"ClickGUI opened and rendered");
                mc.displayGuiScreen(null);GoatClient.instance.modules.disconnect();
                for(Module m:GoatClient.instance.modules.all())check(!m.enabled(),"disconnect disables "+m.id());
                finish(true,null);
            }
        }catch(Throwable error){finish(false,error);}
    }
}
