package dev.goatclient.ui;

import dev.goatclient.GoatClient;
import net.minecraft.command.CommandBase;
import net.minecraft.command.ICommandSender;
import net.minecraft.command.CommandException;
import net.minecraft.client.Minecraft;

public final class GoatCommand extends CommandBase {
    private final GoatClient client;
    public GoatCommand(GoatClient client){this.client=client;}
    public String getCommandName(){return "goat";}
    public String getCommandUsage(ICommandSender sender){return "/goat gui | profile save/load NAME | reset | waypoint add/remove NAME | waypoint list";}
    public int getRequiredPermissionLevel(){return 0;}
    public void processCommand(ICommandSender sender,String[] args)throws CommandException{
        try{
            if(args.length==0||args[0].equals("gui")){Minecraft.getMinecraft().addScheduledTask(()->Minecraft.getMinecraft().displayGuiScreen(new ClickGui(client)));return;}
            if(args[0].equals("reset")){client.profiles.reset();client.save();client.message("Defaults restored.");return;}
            if(args.length==3&&args[0].equals("profile")){
                if(args[1].equals("save")){client.profiles.save(args[2]);client.activeProfile=args[2];}
                else if(args[1].equals("load")){client.profiles.load(args[2]);client.activeProfile=args[2];}
                else throw new IllegalArgumentException("Use profile save/load NAME");
                client.message("Profile "+args[2]+" "+args[1]+" complete.");return;
            }
            if(args[0].equals("waypoint")&&args.length>=2){
                if(args[1].equals("list")){client.message(client.waypoints.keySet().toString());return;}
                if(args.length!=3||!args[2].matches("[a-zA-Z0-9_-]{1,48}"))throw new IllegalArgumentException("Use a 1-48 character waypoint name: letters, numbers, _ or -");
                if(args[1].equals("add")){net.minecraft.client.entity.EntityPlayerSP p=Minecraft.getMinecraft().thePlayer;client.waypoints.put(args[2],p.dimension+","+p.posX+","+p.posY+","+p.posZ);}
                else if(args[1].equals("remove"))client.waypoints.remove(args[2]);
                else throw new IllegalArgumentException("Use waypoint add/remove NAME");
                client.saveWaypoints();client.message("Waypoint saved.");return;
            }
            client.message(getCommandUsage(sender));
        }catch(Exception e){throw new CommandException("GoatClient: "+e.getMessage());}
    }
}
