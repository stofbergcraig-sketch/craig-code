package dev.goatclient.ui;

import net.minecraft.client.gui.*;
import java.io.IOException;

public final class GoatMenu extends GuiScreen {
    public void initGui(){int x=width/2-100,y=height/2;buttonList.add(new GuiButton(1,x,y,200,20,"Singleplayer"));buttonList.add(new GuiButton(2,x,y+24,200,20,"Multiplayer"));buttonList.add(new GuiButton(3,x,y+48,98,20,"Options"));buttonList.add(new GuiButton(4,x+102,y+48,98,20,"Mods"));buttonList.add(new GuiButton(5,x,y+72,200,20,"Quit"));}
    public void drawScreen(int mx,int my,float partial){drawGradientRect(0,0,width,height,0xff101116,0xff251a25);int cx=width/2,cy=height/2-65;drawRect(cx-16,cy-15,cx-9,cy+3,0xffc84c67);drawRect(cx+9,cy-15,cx+16,cy+3,0xffc84c67);drawRect(cx-12,cy-3,cx+12,cy+18,0xffeeeeee);drawRect(cx-6,cy+18,cx+6,cy+24,0xffeeeeee);drawRect(cx-8,cy+3,cx-4,cy+7,0xff101116);drawRect(cx+4,cy+3,cx+8,cy+7,0xff101116);drawCenteredString(fontRendererObj,"GoatClient",cx,cy+32,0xffeeeeee);drawCenteredString(fontRendererObj,"0.1.0  |  Minecraft 1.8.9  |  Forge",cx,height-30,0xff9999a8);drawCenteredString(fontRendererObj,"Development build — see verification report",cx,height-17,0xffb47b90);super.drawScreen(mx,my,partial);}
    protected void actionPerformed(GuiButton button)throws IOException{if(button.id==1)mc.displayGuiScreen(new GuiSelectWorld(this));if(button.id==2)mc.displayGuiScreen(new GuiMultiplayer(this));if(button.id==3)mc.displayGuiScreen(new GuiOptions(this,mc.gameSettings));if(button.id==4)mc.displayGuiScreen(new net.minecraftforge.fml.client.GuiModList(this));if(button.id==5)mc.shutdown();}
}
