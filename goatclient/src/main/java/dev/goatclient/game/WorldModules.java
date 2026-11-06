package dev.goatclient.game;

import dev.goatclient.core.Module.Category;
import dev.goatclient.core.ModuleManager;
import net.minecraft.util.BlockPos;
import net.minecraft.util.EnumFacing;
import net.minecraft.util.AxisAlignedBB;
import net.minecraft.util.MovingObjectPosition;
import net.minecraft.init.Blocks;
import net.minecraft.item.ItemBlock;
import net.minecraft.item.ItemStack;
import net.minecraftforge.client.event.RenderWorldLastEvent;
import java.util.ArrayList;
import java.util.List;

public final class WorldModules {
    public static void register(ModuleManager manager){
        manager.register(new GameModule("ore-prospector",Category.WORLD,"X-Ray alternative: wireframe detected ore blocks in a 12-block radius. Does not hide terrain.",true){
            final List<BlockPos> ores=new ArrayList<>();
            protected void tick(){if(clock%40!=0)return;ores.clear();BlockPos center=new BlockPos(mc.thePlayer);for(int x=-12;x<=12;x++)for(int y=-12;y<=12;y++)for(int z=-12;z<=12;z++){BlockPos p=center.add(x,y,z);net.minecraft.block.Block b=mc.theWorld.getBlockState(p).getBlock();if(b==Blocks.diamond_ore||b==Blocks.emerald_ore||b==Blocks.gold_ore||b==Blocks.iron_ore)ores.add(p);}}
            public void world(RenderWorldLastEvent event){for(BlockPos p:ores)VisualModules.box(mc,new AxisAlignedBB(p,p.add(1,1,1)),.4f,.9f,1);}
            protected void onDisable(){ores.clear();}
        });
        manager.register(new GameModule("nuker",Category.WORLD,"Mine nearby blocks one at a time with ordinary controller damage. Singleplayer; never instant break.",true){
            BlockPos current;final Setting radius=option("radius",2,1,3);
            protected void tick(){if(current==null||mc.theWorld.isAirBlock(current)||mc.thePlayer.getDistanceSqToCenter(current)>16){current=null;BlockPos center=new BlockPos(mc.thePlayer);int r=(int)radius.get();outer:for(int y=r;y>=0;y--)for(int x=-r;x<=r;x++)for(int z=-r;z<=r;z++){BlockPos p=center.add(x,y,z);net.minecraft.block.state.IBlockState state=mc.theWorld.getBlockState(p);if(!state.getBlock().isAir(mc.theWorld,p)&&state.getBlock().getBlockHardness(mc.theWorld,p)>=0&&mc.thePlayer.getDistanceSqToCenter(p)<=16){current=p;break outer;}}}if(current!=null){net.minecraft.util.Vec3 eye=mc.thePlayer.getPositionEyes(1);net.minecraft.util.Vec3 end=new net.minecraft.util.Vec3(current.getX()+.5,current.getY()+.5,current.getZ()+.5);MovingObjectPosition hit=mc.theWorld.rayTraceBlocks(eye,end);if(hit!=null&&current.equals(hit.getBlockPos())){mc.playerController.onPlayerDamageBlock(current,hit.sideHit);mc.thePlayer.swingItem();}else current=null;}}
            protected void onDisable(){mc.playerController.resetBlockRemoving();current=null;}
        });
        manager.register(new GameModule("scaffold-preview",Category.WORLD,"Outline the placement location of the held block at the crosshair; never auto-places.",false){
            protected void tick(){}
            public void world(RenderWorldLastEvent event){ItemStack held=mc.thePlayer.getHeldItem();if(held==null||!(held.getItem() instanceof ItemBlock)||mc.objectMouseOver==null||mc.objectMouseOver.typeOfHit!=MovingObjectPosition.MovingObjectType.BLOCK)return;BlockPos target=mc.objectMouseOver.getBlockPos();BlockPos p=mc.theWorld.getBlockState(target).getBlock().isReplaceable(mc.theWorld,target)?target:target.offset(mc.objectMouseOver.sideHit);boolean valid=((ItemBlock)held.getItem()).canPlaceBlockOnSide(mc.theWorld,target,mc.objectMouseOver.sideHit,mc.thePlayer,held);VisualModules.box(mc,new AxisAlignedBB(p,p.add(1,1,1)),valid?.3f:1,valid?1:.2f,.4f);}
        });
        manager.register(new GameModule("timer-display",Category.WORLD,"Display FPS and measured client tick frequency; not remote-server TPS.",false){
            long start=System.nanoTime();int count;double rate;
            protected void tick(){count++;long now=System.nanoTime();if(now-start>=1000000000L){rate=count*1e9/(now-start);count=0;start=now;}}
            public void overlay(int w,int h){mc.fontRendererObj.drawStringWithShadow(String.format(java.util.Locale.ROOT,"%d FPS | %.1f client ticks/s",net.minecraft.client.Minecraft.getDebugFPS(),rate),8,h-34,0xffeeeeee);}
        });
        manager.register(new GameModule("auto-mine",Category.WORLD,"Continuously mine the block under the crosshair using normal controller rules.",false){
            protected void tick(){if(mc.objectMouseOver!=null&&mc.objectMouseOver.typeOfHit==MovingObjectPosition.MovingObjectType.BLOCK){mc.playerController.onPlayerDamageBlock(mc.objectMouseOver.getBlockPos(),mc.objectMouseOver.sideHit);mc.thePlayer.swingItem();}}
            protected void onDisable(){mc.playerController.resetBlockRemoving();}
        });
        manager.register(new GameModule("waypoints",Category.WORLD,"Named, persistent world markers. /goat waypoint add NAME, remove NAME, list.",false){
            protected void tick(){}
            public void world(RenderWorldLastEvent event){for(java.util.Map.Entry<String,String> entry:dev.goatclient.GoatClient.instance.waypoints.entrySet()){try{String[] data=entry.getValue().split(",");if(Integer.parseInt(data[0])!=mc.thePlayer.dimension)continue;double x=Double.parseDouble(data[1]),y=Double.parseDouble(data[2]),z=Double.parseDouble(data[3]);VisualModules.label(mc,entry.getKey()+" "+(int)Math.sqrt(mc.thePlayer.getDistanceSq(x,y,z))+"m",x,y+1,z);}catch(RuntimeException ignored){}}}
        });
    }
}
