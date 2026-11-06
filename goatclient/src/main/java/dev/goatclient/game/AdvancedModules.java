package dev.goatclient.game;

import dev.goatclient.core.Module.Category;
import dev.goatclient.core.ModuleManager;
import dev.goatclient.GoatClient;
import net.minecraft.entity.player.EntityPlayerMP;
import net.minecraft.util.BlockPos;
import net.minecraft.block.material.Material;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.event.entity.living.LivingFallEvent;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import java.util.UUID;
import java.util.function.Consumer;

public final class AdvancedModules {
    static void server(Consumer<EntityPlayerMP> action){net.minecraft.client.Minecraft mc=net.minecraft.client.Minecraft.getMinecraft();if(!mc.isSingleplayer()||mc.thePlayer==null||mc.getIntegratedServer()==null)return;net.minecraft.server.MinecraftServer server=mc.getIntegratedServer();UUID id=mc.thePlayer.getUniqueID();server.addScheduledTask(()->{EntityPlayerMP player=server.getConfigurationManager().getPlayerByUUID(id);if(player!=null)action.accept(player);});}
    public static void register(ModuleManager manager){
        manager.register(new GameModule("force-op",Category.WORLD,"Owner-only integrated-server OP action. Does not grant permissions on remote servers.",true){
            boolean requested;
            protected void tick(){if(requested)return;requested=true;net.minecraft.server.integrated.IntegratedServer host=mc.getIntegratedServer();if(host==null||!mc.thePlayer.getName().equals(host.getServerOwner())){GoatClient.instance.message("OP unavailable: this is not your integrated server.");return;}server(player->{host.getConfigurationManager().addOp(player.getGameProfile());mc.addScheduledTask(()->GoatClient.instance.message("Local OP authorised by the integrated server."));});}
            protected void onDisable(){requested=false;}
            public void overlay(int w,int h){if(mc.isSingleplayer())mc.fontRendererObj.drawStringWithShadow("OP testing: owned integrated server",8,h-48,0xffff859d);}
        });
        manager.register(new GameModule("jesus",Category.MOVEMENT,"Singleplayer water-surface walking; hold sneak to swim normally.",true){
            final Setting speed=option("speed",1,.2,2);
            protected void tick(){if(mc.thePlayer.isSneaking())return;BlockPos feet=new BlockPos(mc.thePlayer.posX,mc.thePlayer.posY-.1,mc.thePlayer.posZ);if(mc.theWorld.getBlockState(feet).getBlock().getMaterial()!=Material.water||mc.theWorld.getBlockState(feet.up()).getBlock().getMaterial()==Material.water)return;double top=feet.getY()+1;if(mc.thePlayer.posY>=top-.4&&mc.thePlayer.motionY<=.1){mc.thePlayer.setPosition(mc.thePlayer.posX,top,mc.thePlayer.posZ);mc.thePlayer.motionY=0;mc.thePlayer.onGround=true;double a=Math.toRadians(mc.thePlayer.rotationYaw),f=mc.thePlayer.moveForward,s=mc.thePlayer.moveStrafing,v=.1*speed.get();mc.thePlayer.motionX=(-Math.sin(a)*f+Math.cos(a)*s)*v;mc.thePlayer.motionZ=(Math.cos(a)*f+Math.sin(a)*s)*v;}}
        });
        manager.register(new GameModule("fly",Category.MOVEMENT,"Vanilla flight when the server grants it; integrated-server flight in owned worlds.",false){
            final Setting speed=option("speed",.05,.01,.2);boolean oldAllow,oldFlying,changed;float oldSpeed;
            protected void tick(){if(!mc.isSingleplayer()&&!mc.thePlayer.capabilities.allowFlying){setEnabled(false);GoatClient.instance.message("Fly disabled: server has not granted flight.");return;}if(!changed){oldAllow=mc.thePlayer.capabilities.allowFlying;oldFlying=mc.thePlayer.capabilities.isFlying;oldSpeed=mc.thePlayer.capabilities.getFlySpeed();changed=true;}if(mc.isSingleplayer())server(p->{if(enabled()){p.capabilities.allowFlying=true;p.capabilities.isFlying=true;p.capabilities.setFlySpeed((float)speed.get());p.sendPlayerAbilities();}});mc.thePlayer.capabilities.allowFlying=true;mc.thePlayer.capabilities.isFlying=true;if(mc.thePlayer.onGround)mc.thePlayer.motionY=.2;mc.thePlayer.capabilities.setFlySpeed((float)speed.get());mc.thePlayer.sendPlayerAbilities();}
            protected void onDisable(){if(changed&&mc.thePlayer!=null){mc.thePlayer.capabilities.allowFlying=oldAllow;mc.thePlayer.capabilities.isFlying=oldFlying;mc.thePlayer.capabilities.setFlySpeed(oldSpeed);mc.thePlayer.sendPlayerAbilities();final boolean allow=oldAllow,flying=oldFlying;server(p->{p.capabilities.allowFlying=allow;p.capabilities.isFlying=flying;p.sendPlayerAbilities();});}changed=false;}
        });
        GameModule noFall=new GameModule("no-fall",Category.PLAYER,"Cancel fall damage on your integrated server; no remote packet spoofing.",true){protected void tick(){}};
        manager.register(noFall);
        MinecraftForge.EVENT_BUS.register(new Object(){@SubscribeEvent public void fall(LivingFallEvent event){net.minecraft.client.Minecraft mc=net.minecraft.client.Minecraft.getMinecraft();if(noFall.enabled()&&mc.isSingleplayer()&&mc.thePlayer!=null&&event.entityLiving.getUniqueID().equals(mc.thePlayer.getUniqueID())){event.distance=0;event.damageMultiplier=0;}}});
        manager.register(new GameModule("spider",Category.MOVEMENT,"Climb a contacted wall in singleplayer while moving forwards.",true){
            final Setting speed=option("climb-speed",.2,.05,.4);
            protected void tick(){if(mc.thePlayer.isCollidedHorizontally&&mc.thePlayer.moveForward>0&&!mc.thePlayer.isSneaking()){mc.thePlayer.motionY=speed.get();mc.thePlayer.fallDistance=0;}}
        });
    }
}
