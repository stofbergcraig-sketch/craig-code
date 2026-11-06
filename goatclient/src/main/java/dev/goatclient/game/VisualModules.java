package dev.goatclient.game;

import dev.goatclient.core.Module;
import dev.goatclient.core.Module.Category;
import dev.goatclient.core.ModuleManager;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityLivingBase;
import net.minecraft.client.entity.EntityOtherPlayerMP;
import net.minecraft.tileentity.TileEntity;
import net.minecraft.tileentity.TileEntityChest;
import net.minecraft.util.AxisAlignedBB;
import net.minecraft.client.renderer.RenderGlobal;
import net.minecraftforge.client.event.RenderWorldLastEvent;
import org.lwjgl.opengl.GL11;
import org.lwjgl.input.Keyboard;

public final class VisualModules {
    public static void register(ModuleManager manager){
        manager.register(new GameModule("fullbright",Category.RENDER,"Raise gamma; restore the previous value when disabled.",false){
            float old;boolean changed;
            protected void tick(){if(!changed){old=mc.gameSettings.gammaSetting;changed=true;}mc.gameSettings.gammaSetting=12;}
            protected void onDisable(){if(changed)mc.gameSettings.gammaSetting=old;changed=false;}
        });
        manager.register(new GameModule("freecam",Category.RENDER,"Detached singleplayer inspection camera. WASD, Space and Shift; body remains anchored.",true){
            final Setting speed=option("speed",.5,.1,3);EntityOtherPlayerMP camera;Entity old;double ax,ay,az;
            protected void tick(){if(camera==null){old=mc.getRenderViewEntity();ax=mc.thePlayer.posX;ay=mc.thePlayer.posY;az=mc.thePlayer.posZ;camera=new EntityOtherPlayerMP(mc.theWorld,mc.thePlayer.getGameProfile());camera.copyLocationAndAnglesFrom(mc.thePlayer);camera.noClip=true;mc.setRenderViewEntity(camera);}camera.prevPosX=camera.posX;camera.prevPosY=camera.posY;camera.prevPosZ=camera.posZ;camera.rotationYaw=mc.thePlayer.rotationYaw;camera.rotationPitch=mc.thePlayer.rotationPitch;double f=(Keyboard.isKeyDown(mc.gameSettings.keyBindForward.getKeyCode())?1:0)-(Keyboard.isKeyDown(mc.gameSettings.keyBindBack.getKeyCode())?1:0),s=(Keyboard.isKeyDown(mc.gameSettings.keyBindRight.getKeyCode())?1:0)-(Keyboard.isKeyDown(mc.gameSettings.keyBindLeft.getKeyCode())?1:0),a=Math.toRadians(camera.rotationYaw),v=speed.get();camera.setPosition(camera.posX+(-Math.sin(a)*f+Math.cos(a)*s)*v,camera.posY+(Keyboard.isKeyDown(Keyboard.KEY_SPACE)?v:0)-(Keyboard.isKeyDown(Keyboard.KEY_LSHIFT)?v:0),camera.posZ+(Math.cos(a)*f+Math.sin(a)*s)*v);mc.thePlayer.setPositionAndUpdate(ax,ay,az);mc.thePlayer.motionX=mc.thePlayer.motionY=mc.thePlayer.motionZ=0;}
            protected void onDisable(){if(camera!=null)mc.setRenderViewEntity(old==null?mc.thePlayer:old);camera=null;old=null;}
        });
        manager.register(new GameModule("tracers",Category.RENDER,"Draw lines to loaded living entities within 64 blocks.",false){
            protected void tick(){}
            public void world(RenderWorldLastEvent event){for(Object o:mc.theWorld.loadedEntityList)if(o instanceof EntityLivingBase&&o!=mc.thePlayer&&mc.thePlayer.getDistanceToEntity((Entity)o)<64){Entity e=(Entity)o;line(mc, e.posX,e.posY+e.height*.5,e.posZ);}}
        });
        manager.register(new GameModule("esp",Category.RENDER,"Draw bounding boxes around loaded living entities within 64 blocks.",false){
            protected void tick(){}
            public void world(RenderWorldLastEvent event){for(Object o:mc.theWorld.loadedEntityList)if(o instanceof EntityLivingBase&&o!=mc.thePlayer&&mc.thePlayer.getDistanceToEntity((Entity)o)<64)box(mc,((Entity)o).getEntityBoundingBox(),.9f,.3f,.5f);}
        });
        manager.register(new GameModule("chest-esp",Category.RENDER,"Outline loaded chests within 64 blocks.",false){
            protected void tick(){}
            public void world(RenderWorldLastEvent event){for(TileEntity tile:mc.theWorld.loadedTileEntityList)if(tile instanceof TileEntityChest&&tile.getDistanceSq(mc.thePlayer.posX,mc.thePlayer.posY,mc.thePlayer.posZ)<4096){net.minecraft.util.BlockPos p=tile.getPos();box(mc,new AxisAlignedBB(p.getX(),p.getY(),p.getZ(),p.getX()+1,p.getY()+1,p.getZ()+1),1,.7f,.2f);}}
        });
        manager.register(new GameModule("name-tags",Category.RENDER,"Show names and health above loaded living entities.",false){
            protected void tick(){}
            public void world(RenderWorldLastEvent event){for(Object object:mc.theWorld.loadedEntityList)if(object instanceof EntityLivingBase&&object!=mc.thePlayer&&mc.thePlayer.getDistanceToEntity((Entity)object)<32){EntityLivingBase e=(EntityLivingBase)object;VisualModules.label(mc,e.getName()+" | "+(int)Math.ceil(e.getHealth())+" HP",e.posX,e.posY+e.height+.4,e.posZ);}}
        });
        manager.register(new GameModule("hud",Category.RENDER,"GoatClient watermark and active modules. Position uses scaled pixels.",false){
            final Setting x=option("x",8,0,4000),y=option("y",8,0,4000);
            protected void tick(){}
            public void overlay(int w,int h){int px=Math.min(w-80,(int)x.get()),py=Math.min(h-20,(int)y.get());mc.fontRendererObj.drawStringWithShadow("GoatClient 0.1.0",px,py,0xffff859d);py+=14;for(Module m:manager.all())if(m.enabled()){mc.fontRendererObj.drawStringWithShadow(((GameModule)m).label(),px,py,0xffeeeeee);py+=11;}}
        });
        manager.register(new GameModule("coordinates",Category.RENDER,"Show XYZ and dimension in the lower left.",false){
            protected void tick(){}
            public void overlay(int w,int h){mc.fontRendererObj.drawStringWithShadow(String.format(java.util.Locale.ROOT,"XYZ %.1f / %.1f / %.1f  Dim %d",mc.thePlayer.posX,mc.thePlayer.posY,mc.thePlayer.posZ,mc.thePlayer.dimension),8,h-20,0xffeeeeee);}
        });
        manager.register(new GameModule("zoom",Category.RENDER,"Adjust field of view while enabled; restore original FOV.",false){
            final Setting fov=option("fov",25,10,70);float old;boolean changed;
            protected void tick(){if(!changed){old=mc.gameSettings.fovSetting;changed=true;}mc.gameSettings.fovSetting=(float)fov.get();}
            protected void onDisable(){if(changed)mc.gameSettings.fovSetting=old;changed=false;}
        });
        manager.register(new GameModule("no-hurt-cam",Category.RENDER,"Suppress local hurt animation; does not prevent health damage.",false){
            protected void tick(){mc.thePlayer.hurtTime=0;}
        });
    }
    static void begin(){GL11.glPushAttrib(GL11.GL_ALL_ATTRIB_BITS);GL11.glDisable(GL11.GL_TEXTURE_2D);GL11.glDisable(GL11.GL_DEPTH_TEST);GL11.glDepthMask(false);GL11.glEnable(GL11.GL_BLEND);GL11.glBlendFunc(GL11.GL_SRC_ALPHA,GL11.GL_ONE_MINUS_SRC_ALPHA);GL11.glLineWidth(1.5f);}
    static void box(net.minecraft.client.Minecraft mc,AxisAlignedBB bb,float r,float g,float b){begin();GL11.glColor4f(r,g,b,.8f);RenderGlobal.drawSelectionBoundingBox(bb.offset(-mc.getRenderManager().viewerPosX,-mc.getRenderManager().viewerPosY,-mc.getRenderManager().viewerPosZ));GL11.glPopAttrib();}
    static void line(net.minecraft.client.Minecraft mc,double x,double y,double z){begin();GL11.glColor4f(.9f,.3f,.5f,.7f);GL11.glBegin(GL11.GL_LINES);GL11.glVertex3d(0,mc.thePlayer.getEyeHeight(),0);GL11.glVertex3d(x-mc.getRenderManager().viewerPosX,y-mc.getRenderManager().viewerPosY,z-mc.getRenderManager().viewerPosZ);GL11.glEnd();GL11.glPopAttrib();}
    static void label(net.minecraft.client.Minecraft mc,String text,double x,double y,double z){GL11.glPushMatrix();GL11.glPushAttrib(GL11.GL_ALL_ATTRIB_BITS);GL11.glTranslated(x-mc.getRenderManager().viewerPosX,y-mc.getRenderManager().viewerPosY,z-mc.getRenderManager().viewerPosZ);GL11.glRotatef(-mc.getRenderManager().playerViewY,0,1,0);GL11.glRotatef(mc.getRenderManager().playerViewX,1,0,0);GL11.glScalef(-.025f,-.025f,.025f);GL11.glDisable(GL11.GL_DEPTH_TEST);mc.fontRendererObj.drawStringWithShadow(text,-mc.fontRendererObj.getStringWidth(text)/2,0,0xffeeeeee);GL11.glPopAttrib();GL11.glPopMatrix();}
}
