with Bardo.Calendar;
with Bardo.Lights;

package body Bardo.Sidpa is

   function Entry_Allowed (Sign : Natural) return Boolean is
     (Sign = 1 or else Sign = 10 or else Sign = 12);

   function Apply_Method (Done : Natural; Method : Natural) return Natural is
     (if Done < 5 and then Method = Done + 1 then Done + 1 else Done);

   function Scene_Of (Day : Day_Number) return Scene_Kind is
     (if Day < 22 then None
      elsif Day <= 28 then Wish_Body
      elsif Day <= 35 then Judgement
      elsif Day <= 42 then Lights
      else Womb);

   function Anchor_Day (Scene : Scene_Kind) return Day_Number is
     (case Scene is
        when None => 0,
        when Wish_Body => 22,
        when Judgement => 32,
        when Lights => 39,
        when Womb => 49);

   function Scene_Index
     (Direction : Direction_Kind; Scene : Scene_Kind) return Integer
   is
   begin
      if Scene = None then
         return -1;
      end if;
      if Direction = Jung_Reverse then
         case Scene is
            when Womb => return 0;
            when Lights => return 1;
            when Judgement => return 2;
            when Wish_Body => return 3;
            when None => return -1;
         end case;
      end if;
      case Scene is
         when Wish_Body => return 0;
         when Judgement => return 1;
         when Lights => return 2;
         when Womb => return 3;
         when None => return -1;
      end case;
   end Scene_Index;

   function Scene_At
     (Direction : Direction_Kind; Index : Natural) return Scene_Kind
   is
   begin
      if Direction = Jung_Reverse then
         case Index is
            when 0 => return Womb;
            when 1 => return Lights;
            when 2 => return Judgement;
            when others => return Wish_Body;
         end case;
      end if;
      case Index is
         when 0 => return Wish_Body;
         when 1 => return Judgement;
         when 2 => return Lights;
         when others => return Womb;
      end case;
   end Scene_At;

   function Neighbour
     (Direction : Direction_Kind;
      Scene     : Scene_Kind;
      Step      : Integer) return Scene_Kind
   is
      Index : Integer;
   begin
      if Scene = None or else Step = 0 then
         return Scene;
      end if;
      Index := Scene_Index (Direction, Scene) + Step;
      if Index < 0 or else Index > 3 then
         return Scene;
      end if;
      return Scene_At (Direction, Index);
   end Neighbour;

   function Poison (Abyss : Natural) return Integer is
     (if Abyss <= 2 then Integer (Abyss) else -1);

   function Wind_Force (Time : Milli_Time) return Thousandth is
      Day : constant Day_Number := Bardo.Calendar.Calendar_Day (Time);
   begin
      if Day < 22 then
         return 0;
      end if;
      return Thousandth (640 + (Integer (Day) - 22) * 10);
   end Wind_Force;

   function Wander_X (Tick : Natural) return Thousandth is
     (Thousandth (200 + (Tick * 7) mod 600));

   function Wander_Y (Tick : Natural) return Thousandth is
     (Thousandth (180 + (Tick * 5) mod 520));

   function First_Scene (Direction : Direction_Kind) return Scene_Kind is
     (if Direction = Jung_Reverse then Womb else Wish_Body);

   procedure Evaluate
     (Time         : Milli_Time;
      Direction    : Direction_Kind;
      Action       : Natural;
      Arg          : Integer;
      Methods_Done : Natural;
      Destination  : Integer;
      Tick         : Natural;
      Value        : out Result)
   is
      Day     : constant Day_Number := Bardo.Calendar.Calendar_Day (Time);
      Scene   : constant Scene_Kind := Scene_Of (Day);
      Methods : Natural := Methods_Done;
      Outcome : Outcome_Code := 0;
      Dest    : Integer := -1;
      Allow   : Integer := -1;
      Poison_Code : Integer := -1;
      Next_S  : Scene_Kind;
      Prev_S  : Scene_Kind;
   begin
      if Destination in 0 .. 5 then
         Dest := Destination;
      end if;
      if Action = 1 and then Scene = Womb and then Arg >= 0 then
         if Arg = Integer (Methods) + 1 and then Methods < 5 then
            Methods := Apply_Method (Methods, Natural (Arg));
            if Methods = 5 then
               Outcome := 1;
            end if;
         else
            Outcome := 8;
         end if;
      elsif Action = 2 and then Scene = Womb then
         if Arg = 0 then
            Outcome := 2;
         elsif Arg = 1 then
            Outcome := 3;
         end if;
      elsif Action = 3 and then Scene = Womb and then Arg >= 0 then
         if Entry_Allowed (Natural (Arg)) then
            Outcome := 4;
            Allow := 1;
         else
            Outcome := 5;
            Allow := 0;
         end if;
      elsif Action = 4 and then Scene = Lights and then Arg in 0 .. 5 then
         Dest := Arg;
      elsif Action = 5 and then Scene = Judgement then
         Outcome := 6;
      elsif Action = 6 and then Scene = Judgement then
         Outcome := 7;
      elsif Action = 7 and then Scene = Wish_Body and then Arg in 0 .. 2 then
         Poison_Code := Poison (Natural (Arg));
         Outcome := 9;
      end if;
      Next_S := Neighbour (Direction, Scene, 1);
      Prev_S := Neighbour (Direction, Scene, -1);
      Value :=
        (Scene => Scene,
         Outcome => Outcome,
         Methods => Methods,
         Brightest => Dest,
         Instruct => Bardo.Lights.Instruction (Dest),
         Allow => Allow,
         Poison => Poison_Code,
         Wind => Wind_Force (Time),
         X => Wander_X (Tick),
         Y => Wander_Y (Tick),
         White => 1,
         Black => 1,
         Anchor => Anchor_Day (Scene),
         Next_Scene =>
           (if Scene = None then Scene_Kind'Pos (First_Scene (Direction))
            elsif Next_S = Scene then -1
            else Scene_Kind'Pos (Next_S)),
         Prev_Scene =>
           (if Scene = None or else Prev_S = Scene then -1
            else Scene_Kind'Pos (Prev_S)),
         Closed => (if Methods = 5 then 1 else 0));
   end Evaluate;

end Bardo.Sidpa;
