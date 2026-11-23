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

   function Karmic_Realm (Brightest : Integer; Poison : Integer) return Integer is
     (if Brightest in 0 .. 5 then Brightest
      elsif Poison = 0 then 5
      elsif Poison = 1 then 4
      elsif Poison = 2 then 3
      else 2);

   function Clamp_Karma (Weight : Integer) return Karma_Weight is
     (if Weight < 0 then 0 elsif Weight > 1_000 then 1_000 else Weight);

   function Karma_Lighten (Weight : Integer) return Karma_Weight is
      W : constant Karma_Weight := Clamp_Karma (Weight);
   begin
      if W < 160 then
         return 0;
      end if;
      return W - 160;
   end Karma_Lighten;

   function Karma_Heavy (Weight : Integer) return Karma_Weight is
      W : constant Karma_Weight := Clamp_Karma (Weight);
   begin
      if W > 840 then
         return 1_000;
      end if;
      return W + 160;
   end Karma_Heavy;

   function Karma_Carry (Weight : Integer) return Karma_Weight is
     ((Clamp_Karma (Weight) + 500) / 2);

   function Karma_Band (Weight : Integer) return Integer is
      W : constant Karma_Weight := Clamp_Karma (Weight);
   begin
      if W <= 333 then
         return 0;
      elsif W >= 667 then
         return 2;
      end if;
      return 1;
   end Karma_Band;

   function Karma_Chance (Weight : Integer) return Integer is
      W : constant Karma_Weight := Clamp_Karma (Weight);
   begin
      if W <= 500 then
         return 1_000;
      end if;
      return 1_000 - ((W - 500) * 900) / 500;
   end Karma_Chance;

   function Fallback_Realm (Weight : Integer) return Integer is
      W : constant Karma_Weight := Clamp_Karma (Weight);
   begin
      if W >= 900 then
         return 5;
      elsif W >= 800 then
         return 4;
      elsif W >= 667 then
         return 3;
      elsif W <= 100 then
         return 0;
      elsif W <= 220 then
         return 1;
      end if;
      return 2;
   end Fallback_Realm;

   function Rebirth_Realm (Brightest : Integer; Weight : Integer) return Integer is
     (if Brightest in 0 .. 5 then Brightest else Fallback_Realm (Weight));

   function Dull_Realm (Book_Day : Integer) return Integer is
     (case Book_Day is
        when 7 => 3,
        when 5 => 1,
        when 4 => 4,
        when 3 => 2,
        when 2 => 5,
        when 1 => 0,
        when others => -1);

   function Dissolve_Clamp (Level : Integer) return Integer is
     (if Level < 0 then 0 elsif Level > 1_000 then 1_000 else Level);

   function Dissolve_Stage (Level : Integer) return Integer is
      L : constant Integer := Dissolve_Clamp (Level);
   begin
      if L = 0 then
         return 0;
      elsif L = 1_000 then
         return 2;
      else
         return 1;
      end if;
   end Dissolve_Stage;

   function Womb_Path
     (From : Integer; Choice : Integer; Brightest : Integer; Weight : Integer)
     return Integer
   is
      Realm : Integer;
   begin
      if From = 0 and then Choice = 0 then
         return 1;
      elsif From = 1 and then Choice = 0 then
         return 2;
      elsif From = 1 and then Choice = 9 then
         return 0;
      elsif From = 2 and then Choice = 0 then
         return 3;
      elsif From = 2 and then Choice = 9 then
         return 1;
      elsif From = 3 and then Choice = 1 then
         return 10;
      elsif From = 3 and then Choice = 2 then
         return 11;
      elsif From = 3 and then Choice = 3 then
         return 12;
      elsif From = 3 and then Choice = 4 then
         Realm := Rebirth_Realm (Brightest, Weight);
         return 20 + Realm;
      elsif From = 3 and then Choice = 9 then
         return 2;
      else
         return -1;
      end if;
   end Womb_Path;

   function Clear_Step (Screen : Integer; Follow : Integer) return Integer is
   begin
      if Follow not in 0 .. 1 then
         return -1;
      end if;
      case Screen is
         when 18 =>
            return (if Follow = 1 then 19 else -1);
         when 19 =>
            return (if Follow = 1 then 20 else 18);
         when 20 =>
            return (if Follow = 1 then 21 else 19);
         when others =>
            return -1;
      end case;
   end Clear_Step;

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
