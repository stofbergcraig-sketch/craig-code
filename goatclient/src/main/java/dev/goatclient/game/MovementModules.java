package dev.goatclient.game;

import dev.goatclient.core.ModuleManager;
import dev.goatclient.core.Module.Category;
import net.minecraft.client.settings.KeyBinding;
import net.minecraft.util.BlockPos;
import org.lwjgl.input.Keyboard;

public final class MovementModules {
    public static void register(ModuleManager manager) {
        manager.register(new GameModule("sprint",Category.MOVEMENT,"Sprint forwards when food and movement permit.",false) {
            protected void tick(){if(mc.thePlayer.moveForward>0 && !mc.thePlayer.isSneaking() && mc.thePlayer.getFoodStats().getFoodLevel()>6)mc.thePlayer.setSprinting(true);}
            protected void onDisable(){if(mc.thePlayer!=null)mc.thePlayer.setSprinting(false);}
        });
        manager.register(new GameModule("sneak",Category.MOVEMENT,"Hold sneak until disabled.",false) {
            protected void tick(){KeyBinding.setKeyBindState(mc.gameSettings.keyBindSneak.getKeyCode(),true);}
            protected void onDisable(){KeyBinding.setKeyBindState(mc.gameSettings.keyBindSneak.getKeyCode(),physical(mc.gameSettings.keyBindSneak));}
        });
        manager.register(new GameModule("auto-walk",Category.MOVEMENT,"Hold forward until disabled.",false) {
            protected void tick(){KeyBinding.setKeyBindState(mc.gameSettings.keyBindForward.getKeyCode(),true);}
            protected void onDisable(){KeyBinding.setKeyBindState(mc.gameSettings.keyBindForward.getKeyCode(),physical(mc.gameSettings.keyBindForward));}
        });
        manager.register(new GameModule("step",Category.MOVEMENT,"Higher step height in singleplayer only.",true) {
            final Setting height=option("height",1,0.6,2); float old; boolean changed;
            protected void tick(){if(!changed){old=mc.thePlayer.stepHeight;changed=true;}mc.thePlayer.stepHeight=(float)height.get();}
            protected void onDisable(){if(changed&&mc.thePlayer!=null)mc.thePlayer.stepHeight=old;changed=false;}
        });
        manager.register(new GameModule("safe-walk",Category.MOVEMENT,"Sneak at edges; restore physical sneak elsewhere.",false) {
            protected void tick(){boolean edge=mc.thePlayer.onGround && mc.theWorld.getCollidingBoundingBoxes(mc.thePlayer,mc.thePlayer.getEntityBoundingBox().offset(mc.thePlayer.motionX,-0.6,mc.thePlayer.motionZ)).isEmpty();KeyBinding.setKeyBindState(mc.gameSettings.keyBindSneak.getKeyCode(),edge||physical(mc.gameSettings.keyBindSneak));}
            protected void onDisable(){KeyBinding.setKeyBindState(mc.gameSettings.keyBindSneak.getKeyCode(),physical(mc.gameSettings.keyBindSneak));}
        });
        manager.register(new GameModule("parkour",Category.MOVEMENT,"Jump at an upcoming edge while walking forwards.",false) {
            final Setting look=option("look-ahead",0.7,0.2,1.2);
            protected void tick(){double a=Math.toRadians(mc.thePlayer.rotationYaw),d=look.get();if(mc.thePlayer.onGround&&mc.thePlayer.moveForward>0&&mc.theWorld.isAirBlock(new BlockPos(mc.thePlayer.posX-Math.sin(a)*d,mc.thePlayer.posY-1,mc.thePlayer.posZ+Math.cos(a)*d)))mc.thePlayer.jump();}
        });
        manager.register(new GameModule("bunny-hop",Category.MOVEMENT,"Continuously jump and sprint while moving on the ground.",false) {
            protected void tick(){if(mc.thePlayer.onGround&&(mc.thePlayer.moveForward!=0||mc.thePlayer.moveStrafing!=0)&&!mc.thePlayer.isInWater()){mc.thePlayer.setSprinting(mc.thePlayer.moveForward>0);mc.thePlayer.jump();}}
            protected void onDisable(){if(mc.thePlayer!=null)mc.thePlayer.setSprinting(false);}
        });
        manager.register(new GameModule("auto-jump",Category.MOVEMENT,"Jump when movement meets a horizontal obstacle.",false) {
            protected void tick(){if(mc.thePlayer.onGround&&mc.thePlayer.isCollidedHorizontally&&mc.thePlayer.moveForward!=0)mc.thePlayer.jump();}
        });
    }
    static boolean physical(KeyBinding binding){int code=binding.getKeyCode();return code>0&&code<Keyboard.KEYBOARD_SIZE&&Keyboard.isKeyDown(code);}
}
