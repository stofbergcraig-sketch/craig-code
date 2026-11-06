package dev.goatclient.ui;

import dev.goatclient.GoatClient;
import dev.goatclient.core.Module;
import dev.goatclient.game.GameModule;
import net.minecraft.client.gui.GuiScreen;
import net.minecraft.client.gui.GuiTextField;
import org.lwjgl.input.Keyboard;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public final class ClickGui extends GuiScreen {
    private final GoatClient client;
    private GuiTextField search;
    private Module.Category category=Module.Category.MOVEMENT;
    private GameModule selected;
    private boolean binding;
    private int x=10,y=10,scroll,dragX,dragY;
    private boolean dragging;
    private Module.Setting activeSlider;
    private int detailScroll;
    private String sliderName;
    public ClickGui(GoatClient client){this.client=client;}
    public void initGui(){Keyboard.enableRepeatEvents(true);search=new GuiTextField(1,fontRendererObj,x+12,y+35,200,18);search.setMaxStringLength(80);}
    private int listWidth(){return Math.min(220,Math.min(620,width-x-10)/2-4);}
    private int detailOffset(){return listWidth()+16;}
    private void setSlider(int mx){if(activeSlider==null)return;double fraction=Math.max(0,Math.min(1,(mx-(x+detailOffset()))/(double)(Math.min(620,width-x-10)-detailOffset()-12)));double value=activeSlider.min()+fraction*(activeSlider.max()-activeSlider.min());if(sliderName.equals("interval-ticks")||sliderName.contains("ticks")||sliderName.equals("x")||sliderName.equals("y"))value=Math.rint(value);activeSlider.set(value);}
    private List<GameModule> visible(){List<GameModule> list=new ArrayList<>();for(Module module:client.modules.all()){GameModule game=(GameModule)module;if((search.getText().isEmpty()?module.category()==category:true)&&game.label().toLowerCase(java.util.Locale.ROOT).contains(search.getText().toLowerCase(java.util.Locale.ROOT)))list.add(game);}return list;}
    public void drawScreen(int mouseX,int mouseY,float partial){
        drawDefaultBackground();setSlider(mouseX);if(dragging){x=Math.max(0,Math.min(width-260,mouseX-dragX));y=Math.max(0,Math.min(height-120,mouseY-dragY));}
        int w=Math.min(620,width-x-10),h=Math.min(360,height-y-10);drawRect(x,y,x+w,y+h,0xf016171d);drawRect(x,y,x+w,y+3,0xffc84c67);
        fontRendererObj.drawStringWithShadow("GoatClient  /  1.8.9",x+12,y+12,0xffeeeeee);
        search.xPosition=x+12;search.yPosition=y+35;search.drawTextBox();
        for(int i=0;i<Module.Category.values().length;i++){int tab=(w-24)/5;int tx=x+12+i*tab;drawRect(tx,y+62,tx+tab-3,y+82,Module.Category.values()[i]==category?0xff7a3758:0xff262831);fontRendererObj.drawString(new String[]{"Combat","Movement","Player","Render","World"}[i],tx+4,y+68,0xffeeeeee);}
        List<GameModule> list=visible();int rows=Math.max(1,(h-98)/24);scroll=Math.max(0,Math.min(scroll,Math.max(0,list.size()-rows)));
        for(int i=scroll;i<Math.min(list.size(),scroll+rows);i++){GameModule module=list.get(i);int ry=y+92+(i-scroll)*24;boolean hover=mouseX>x+10&&mouseX<x+listWidth()&&mouseY>=ry&&mouseY<ry+22;drawRect(x+10,ry,x+listWidth(),ry+22,hover?0xff383441:0xff22242c);fontRendererObj.drawString(fontRendererObj.trimStringToWidth((module.enabled()?"[ON] ":"[OFF] ")+module.label(),listWidth()-24),x+16,ry+7,module.enabled()?0xffff859d:0xffc8c8d0);}
        if(selected!=null&&w>300){int sx=x+detailOffset(),sy=y+95;fontRendererObj.drawString(selected.label(),sx,sy,0xffff859d);fontRendererObj.drawSplitString(selected.description,sx,sy+20,w-detailOffset()-12,0xffdddddd);sy+=65;fontRendererObj.drawString(binding?"Press key (Esc = unbind)":"Bind: "+Keyboard.getKeyName(selected.key())+" [click]",sx,sy,0xffdddddd);sy+=24;int optionIndex=0;for(java.util.Map.Entry<String,Module.Setting> setting:selected.settings().entrySet()){if(optionIndex++<detailScroll)continue;if(sy+20>y+h)break;fontRendererObj.drawString(setting.getKey()+": "+String.format(java.util.Locale.ROOT,"%.2f",setting.getValue().get()),sx,sy,0xffdddddd);int length=w-detailOffset()-12;drawRect(sx,sy+13,sx+length,sy+16,0xff48404d);int knob=sx+(int)(length*(setting.getValue().get()-setting.getValue().min())/(setting.getValue().max()-setting.getValue().min()));drawRect(sx,sy+13,knob,sy+16,0xffc84c67);drawRect(knob-1,sy+11,knob+2,sy+18,0xffeeeeee);sy+=32;}}
        super.drawScreen(mouseX,mouseY,partial);
    }
    protected void mouseClicked(int mx,int my,int button)throws IOException{
        search.mouseClicked(mx,my,button);
        if(my>=y&&my<y+30&&mx>=x&&mx<x+240){dragging=true;dragX=mx-x;dragY=my-y;return;}
        if(my>=y+62&&my<y+82){int index=(mx-x-12)/((Math.min(620,width-x-10)-24)/5);if(mx>=x+12&&index<5){category=Module.Category.values()[index];scroll=0;selected=null;return;}}
        int row=(my-y-92)/24;if(mx>=x+10&&mx<x+listWidth()&&my>=y+92){List<GameModule> list=visible();int index=scroll+row;if(index<list.size()){GameModule module=list.get(index);selected=module;detailScroll=0;if(button==0){try{module.setEnabled(!module.enabled());}catch(RuntimeException e){client.message(e.getMessage());}client.save();}return;}}
        if(selected!=null&&mx>x+detailOffset()){int dy=my-(y+160);if(dy>=0&&dy<20){binding=true;return;}int index=(my-(y+184))/32;if(my>=y+184&&index<selected.settings().size()){index+=detailScroll;if(index>=selected.settings().size())return;activeSlider=new ArrayList<>(selected.settings().values()).get(index);sliderName=new ArrayList<>(selected.settings().keySet()).get(index);setSlider(mx);client.save();}}
    }
    protected void mouseReleased(int x,int y,int button){dragging=false;activeSlider=null;client.save();}
    public void handleMouseInput()throws IOException{super.handleMouseInput();int wheel=org.lwjgl.input.Mouse.getEventDWheel();if(wheel!=0){if(selected!=null&&org.lwjgl.input.Mouse.getX()*width/mc.displayWidth>x+detailOffset())detailScroll=Math.max(0,Math.min(selected.settings().size()-1,detailScroll+(wheel<0?1:-1)));else scroll+=wheel<0?1:-1;}}
    protected void keyTyped(char typed,int key)throws IOException{if(binding){selected.bind(key==Keyboard.KEY_ESCAPE?0:key);binding=false;client.save();return;}if(key==Keyboard.KEY_RSHIFT){mc.displayGuiScreen(null);return;}if(!search.textboxKeyTyped(typed,key))super.keyTyped(typed,key);}
    public void onGuiClosed(){Keyboard.enableRepeatEvents(false);client.save();}
    public boolean doesGuiPauseGame(){return false;}
}
