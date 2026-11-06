package dev.goatclient.game;

import dev.goatclient.core.Module.Category;
import dev.goatclient.core.ModuleManager;
import net.minecraft.entity.EntityLivingBase;
import net.minecraft.entity.monster.IMob;
import net.minecraft.item.ItemSword;
import net.minecraft.item.ItemBow;
import net.minecraft.item.ItemStack;
import net.minecraft.util.MathHelper;
import org.lwjgl.input.Mouse;

public final class CombatModules {
    static EntityLivingBase target(net.minecraft.client.Minecraft mc,double range) {
        EntityLivingBase best=null;double distance=range;
        for(Object object:mc.theWorld.loadedEntityList)if(object instanceof EntityLivingBase&&object instanceof IMob){EntityLivingBase entity=(EntityLivingBase)object;double d=mc.thePlayer.getDistanceToEntity(entity);if(entity.isEntityAlive()&&d<distance&&mc.thePlayer.canEntityBeSeen(entity)){distance=d;best=entity;}}
        return best;
    }
    public static void register(ModuleManager manager) {
        manager.register(new GameModule("aim-assist",Category.COMBAT,"Smooth aim toward visible hostile mobs while holding attack; 4-block range.",false){
            final Setting strength=option("degrees-per-tick",2,0.1,15);
            protected void tick(){EntityLivingBase e=target(mc,4);if(e==null||!Mouse.isButtonDown(0))return;double dx=e.posX-mc.thePlayer.posX,dz=e.posZ-mc.thePlayer.posZ,dy=e.posY+e.getEyeHeight()-mc.thePlayer.posY-mc.thePlayer.getEyeHeight();float yaw=(float)(Math.toDegrees(Math.atan2(dz,dx))-90),pitch=(float)-Math.toDegrees(Math.atan2(dy,Math.sqrt(dx*dx+dz*dz)));mc.thePlayer.rotationYaw+=MathHelper.clamp_float(MathHelper.wrapAngleTo180_float(yaw-mc.thePlayer.rotationYaw),-(float)strength.get(),(float)strength.get());mc.thePlayer.rotationPitch+=MathHelper.clamp_float(pitch-mc.thePlayer.rotationPitch,-(float)strength.get(),(float)strength.get());}
        });
        manager.register(new GameModule("auto-clicker",Category.COMBAT,"Normal attack clicks while left mouse is held; does not extend reach.",false){
            final Setting cps=option("clicks-per-second",8,1,20); long next;
            protected void tick(){long now=System.nanoTime();if(Mouse.isButtonDown(0)&&now>=next){net.minecraft.client.settings.KeyBinding.onTick(mc.gameSettings.keyBindAttack.getKeyCode());next=now+(long)(1e9/cps.get());}}
        });
        manager.register(new GameModule("trigger-bot",Category.COMBAT,"Attack a hostile mob under the crosshair within normal reach.",false){
            final Setting delay=option("attack-delay-ticks",10,1,40);int last;
            protected void tick(){if(mc.objectMouseOver!=null&&mc.objectMouseOver.entityHit instanceof IMob&&mc.thePlayer.ticksExisted-last>=delay.get()&&mc.thePlayer.getDistanceToEntity(mc.objectMouseOver.entityHit)<=mc.playerController.getBlockReachDistance()){mc.playerController.attackEntity(mc.thePlayer,mc.objectMouseOver.entityHit);mc.thePlayer.swingItem();last=mc.thePlayer.ticksExisted;}}
        });
        manager.register(new GameModule("criticals",Category.COMBAT,"Jump before a held attack; attack a hostile target only while descending. No packet spoofing.",false){
            int last;
            protected void tick(){if(!Mouse.isButtonDown(0)||mc.objectMouseOver==null||!(mc.objectMouseOver.entityHit instanceof IMob))return;if(mc.thePlayer.onGround)mc.thePlayer.jump();else if(mc.thePlayer.fallDistance>0&&mc.thePlayer.ticksExisted-last>10&&mc.thePlayer.getDistanceToEntity(mc.objectMouseOver.entityHit)<3){mc.playerController.attackEntity(mc.thePlayer,mc.objectMouseOver.entityHit);mc.thePlayer.swingItem();last=mc.thePlayer.ticksExisted;}}
        });
        manager.register(new GameModule("auto-sword",Category.COMBAT,"Select the highest base-damage sword in the hotbar near hostile mobs.",false){
            protected void tick(){if(target(mc,4)==null)return;float best=-1;int slot=-1;for(int i=0;i<9;i++){ItemStack stack=mc.thePlayer.inventory.getStackInSlot(i);if(stack!=null&&stack.getItem() instanceof ItemSword){float damage=((ItemSword)stack.getItem()).getDamageVsEntity();if(damage>best){best=damage;slot=i;}}}if(slot>=0)mc.thePlayer.inventory.currentItem=slot;}
        });
        manager.register(new GameModule("bow-assist",Category.COMBAT,"Ballistic aim for a drawn bow toward visible hostile mobs, up to 32 blocks.",false){
            protected void tick(){ItemStack held=mc.thePlayer.getHeldItem();EntityLivingBase e=target(mc,32);if(e==null||held==null||!(held.getItem() instanceof ItemBow)||!mc.thePlayer.isUsingItem())return;double charge=mc.thePlayer.getItemInUseDuration()/20.0,v=Math.min(1,(charge*charge+2*charge)/3)*3;if(v<0.2)return;double dx=e.posX-mc.thePlayer.posX,dz=e.posZ-mc.thePlayer.posZ,d=Math.sqrt(dx*dx+dz*dz),dy=e.posY+e.getEyeHeight()-mc.thePlayer.posY-mc.thePlayer.getEyeHeight(),g=.05,discriminant=v*v*v*v-g*(g*d*d+2*dy*v*v);if(discriminant<0||d<.1)return;mc.thePlayer.rotationYaw=(float)(Math.toDegrees(Math.atan2(dz,dx))-90);mc.thePlayer.rotationPitch=(float)-Math.toDegrees(Math.atan((v*v-Math.sqrt(discriminant))/(g*d)));}
        });
        manager.register(new GameModule("auto-block",Category.COMBAT,"Hold sword block near a hostile mob when attack is released.",false){
            boolean owned;
            protected void tick(){ItemStack held=mc.thePlayer.getHeldItem();boolean block=held!=null&&held.getItem() instanceof ItemSword&&target(mc,3)!=null&&!Mouse.isButtonDown(0);if(block){mc.playerController.sendUseItem(mc.thePlayer,mc.theWorld,held);owned=true;}else if(owned){mc.playerController.onStoppedUsingItem(mc.thePlayer);owned=false;}}
            protected void onDisable(){if(owned&&mc.thePlayer!=null)mc.playerController.onStoppedUsingItem(mc.thePlayer);owned=false;}
        });
        manager.register(new GameModule("reach-display",Category.COMBAT,"Display eye-to-crosshair hit distance; does not modify reach.",false){
            protected void tick(){}
            public void overlay(int w,int h){if(mc.objectMouseOver!=null&&mc.objectMouseOver.hitVec!=null)mc.fontRendererObj.drawStringWithShadow(String.format(java.util.Locale.ROOT,"Reach %.2fm",mc.thePlayer.getPositionEyes(1).distanceTo(mc.objectMouseOver.hitVec)),w/2+12,h/2+12,0xffeeeeee);}
        });
    }
}
