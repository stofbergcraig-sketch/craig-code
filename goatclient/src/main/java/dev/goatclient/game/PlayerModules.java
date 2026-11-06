package dev.goatclient.game;

import dev.goatclient.core.Module.Category;
import dev.goatclient.core.ModuleManager;
import net.minecraft.client.gui.inventory.GuiChest;
import net.minecraft.client.settings.KeyBinding;
import net.minecraft.inventory.ContainerChest;
import net.minecraft.item.*;
import net.minecraft.init.Items;
import net.minecraft.util.MovingObjectPosition;
import net.minecraft.util.BlockPos;
import org.lwjgl.input.Mouse;

public final class PlayerModules {
    public static void register(ModuleManager manager){
        manager.register(new GameModule("auto-tool",Category.PLAYER,"Select the fastest hotbar tool for the block being mined.",false){
            protected void tick(){if(!Mouse.isButtonDown(0)||mc.objectMouseOver==null||mc.objectMouseOver.typeOfHit!=MovingObjectPosition.MovingObjectType.BLOCK)return;net.minecraft.block.Block block=mc.theWorld.getBlockState(mc.objectMouseOver.getBlockPos()).getBlock();float best=1;int slot=-1;for(int i=0;i<9;i++){ItemStack stack=mc.thePlayer.inventory.getStackInSlot(i);float speed=stack==null?1:stack.getStrVsBlock(block);if(speed>best){best=speed;slot=i;}}if(slot>=0)mc.thePlayer.inventory.currentItem=slot;}
        });
        manager.register(new GameModule("fast-place",Category.PLAYER,"Repeat ordinary placement attempts up to once per tick while right mouse is held. Singleplayer only.",true){
            protected void tick(){if(!Mouse.isButtonDown(1)||mc.objectMouseOver==null||mc.objectMouseOver.typeOfHit!=MovingObjectPosition.MovingObjectType.BLOCK)return;ItemStack held=mc.thePlayer.getHeldItem();if(held!=null&&held.getItem() instanceof ItemBlock&&mc.playerController.onPlayerRightClick(mc.thePlayer,mc.theWorld,held,mc.objectMouseOver.getBlockPos(),mc.objectMouseOver.sideHit,mc.objectMouseOver.hitVec))mc.thePlayer.swingItem();}
        });
        manager.register(new GameModule("auto-eat",Category.PLAYER,"Use food from the hotbar below the hunger threshold; restore selected slot.",false){
            final Setting hunger=option("hunger-threshold",16,1,19);boolean eating;int old;
            protected void tick(){if(mc.thePlayer.getFoodStats().getFoodLevel()>=hunger.get()){release();return;}if(!eating){int slot=-1;for(int i=0;i<9;i++){ItemStack stack=mc.thePlayer.inventory.getStackInSlot(i);if(stack!=null&&stack.getItem() instanceof ItemFood){slot=i;break;}}if(slot<0)return;old=mc.thePlayer.inventory.currentItem;mc.thePlayer.inventory.currentItem=slot;eating=true;}if(mc.thePlayer.getHeldItem()==null){release();return;}KeyBinding.setKeyBindState(mc.gameSettings.keyBindUseItem.getKeyCode(),true);if(!mc.thePlayer.isUsingItem())mc.playerController.sendUseItem(mc.thePlayer,mc.theWorld,mc.thePlayer.getHeldItem());}
            void release(){if(eating){KeyBinding.setKeyBindState(mc.gameSettings.keyBindUseItem.getKeyCode(),Mouse.isButtonDown(1));if(mc.thePlayer!=null){mc.playerController.onStoppedUsingItem(mc.thePlayer);mc.thePlayer.inventory.currentItem=old;}}eating=false;}
            protected void onDisable(){release();}
        });
        manager.register(new GameModule("auto-fish",Category.PLAYER,"Reel on a bobber bite-like downward motion and recast. Requires a held fishing rod.",false){
            int wait;
            protected void tick(){ItemStack held=mc.thePlayer.getHeldItem();if(held==null||!(held.getItem() instanceof ItemFishingRod))return;if(wait>0){wait--;return;}if(mc.thePlayer.fishEntity==null){mc.playerController.sendUseItem(mc.thePlayer,mc.theWorld,held);wait=30;}else if(mc.thePlayer.fishEntity.ticksExisted>30&&mc.thePlayer.fishEntity.isInWater()&&mc.thePlayer.fishEntity.motionY<-.04){mc.playerController.sendUseItem(mc.thePlayer,mc.theWorld,held);wait=20;}}
        });
        manager.register(new GameModule("auto-respawn",Category.PLAYER,"Respawn normally after death.",false){
            protected boolean screensAllowed(){return true;}
            protected void tick(){if(mc.thePlayer.isDead&&mc.thePlayer.deathTime>=20)mc.thePlayer.respawnPlayer();}
        });
        manager.register(new GameModule("inventory-cleaner",Category.PLAYER,"Drop rotten flesh from the main inventory. Enable deliberately; dropped items leave inventory.",false){
            protected void tick(){if(clock%20!=0||mc.thePlayer.openContainer!=mc.thePlayer.inventoryContainer||mc.thePlayer.inventory.getItemStack()!=null)return;for(int i=9;i<36;i++){ItemStack stack=mc.thePlayer.inventory.getStackInSlot(i);if(stack!=null&&stack.getItem()==Items.rotten_flesh){mc.playerController.windowClick(0,i,1,4,mc.thePlayer);return;}}}
        });
        manager.register(new GameModule("chest-sorter",Category.PLAYER,"Alphabetically order an open chest using normal slot swaps, one swap per second.",false){
            protected boolean screensAllowed(){return mc.currentScreen instanceof GuiChest;}
            protected void tick(){if(clock%20!=0||!(mc.thePlayer.openContainer instanceof ContainerChest)||mc.thePlayer.inventory.getItemStack()!=null)return;ContainerChest chest=(ContainerChest)mc.thePlayer.openContainer;int size=chest.getLowerChestInventory().getSizeInventory();for(int i=0;i<size-1;i++){ItemStack a=chest.getSlot(i).getStack();int best=i;for(int j=i+1;j<size;j++){ItemStack b=chest.getSlot(j).getStack();ItemStack c=chest.getSlot(best).getStack();if(b!=null&&(c==null||b.getDisplayName().compareToIgnoreCase(c.getDisplayName())<0))best=j;}if(best!=i){mc.playerController.windowClick(chest.windowId,best,0,0,mc.thePlayer);mc.playerController.windowClick(chest.windowId,i,0,0,mc.thePlayer);if(a!=null)mc.playerController.windowClick(chest.windowId,best,0,0,mc.thePlayer);return;}}}
        });
        manager.register(new GameModule("auto-armor",Category.PLAYER,"Equip armour with higher base protection from inventory. Leaves enchanted-quality choices to you.",false){
            protected void tick(){if(clock%10!=0||mc.thePlayer.openContainer!=mc.thePlayer.inventoryContainer||mc.thePlayer.inventory.getItemStack()!=null)return;for(int i=9;i<45;i++){ItemStack stack=mc.thePlayer.inventoryContainer.getSlot(i).getStack();if(stack==null||!(stack.getItem() instanceof ItemArmor))continue;ItemArmor armor=(ItemArmor)stack.getItem();int target=5+armor.armorType;ItemStack worn=mc.thePlayer.inventoryContainer.getSlot(target).getStack();if(worn==null){mc.playerController.windowClick(0,i,0,1,mc.thePlayer);return;}if(worn.getItem() instanceof ItemArmor&&armor.damageReduceAmount>((ItemArmor)worn.getItem()).damageReduceAmount&&mc.thePlayer.inventory.getFirstEmptyStack()>=0){mc.playerController.windowClick(0,target,0,1,mc.thePlayer);return;}}}
        });
    }
}
