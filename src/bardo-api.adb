with Bardo.Calendar;
with Bardo.Curves;
with Bardo.Rain;
with Bardo.Sidpa;

package body Bardo.API is

   procedure Host_Trap (File : System.Address; Line : Integer) with
     Import, Convention => C, External_Name => "bardo_host_trap";

   procedure Last_Chance (File : System.Address; Line : Integer) with
     Export, Convention => C,
     External_Name => "__gnat_last_chance_handler";

   procedure Last_Chance (File : System.Address; Line : Integer) is
   begin
      Output (13) := Line;
      Host_Trap (File, Line);
   end Last_Chance;

   function Input_Address return System.Address is (Input'Address);
   function Output_Address return System.Address is (Output'Address);
   function Glyph_Address return System.Address is (Glyph'Address);
   function Sidpa_Address return System.Address is (Sidpa'Address);

   function Direction_Of (Code : Integer) return Direction_Kind is
     (if Code = 0 then Jung_Reverse else Book_Order);

   procedure Compute is
      Time_Code : constant Integer := Input (0);
      Dir_Code  : constant Integer := Input (1);
      Time      : Milli_Time;
      Dir       : Direction_Kind;
      Scales    : Bardo.Rain.Params;
   begin
      if Time_Code < 0 or else Time_Code > Clock_End then
         Output (0) := 1;
         return;
      end if;
      if Dir_Code /= 0 and then Dir_Code /= 1 then
         Output (0) := 2;
         return;
      end if;
      if Input (2) not in 0 .. 7
        or else Input (4) not in 0 .. 5
        or else Input (6) < 0
      then
         Output (0) := 5;
         return;
      end if;
      Time := Milli_Time (Time_Code);
      Dir := Direction_Of (Dir_Code);
      Scales := Bardo.Rain.Parameters (Time);
      Output (0) := 0;
      Output (1) := Phase_Kind'Pos (Bardo.Calendar.Phase (Time));
      Output (2) := Integer (Bardo.Calendar.Calendar_Day (Time));
      Output (3) := Integer (Bardo.Calendar.Named_Day (Time));
      Output (4) := Integer (Bardo.Curves.Clarity (Time));
      Output (5) := Integer (Bardo.Curves.Intensity (Time));
      Output (6) := Integer (Bardo.Curves.Complexity (Time));
      Output (7) := Dir_Code;
      Output (8) := Integer (Scales.Mantra);
      Output (9) := Scales.Speed;
      Output (10) := Scales.Alpha;
      Output (11) := Scales.Stride;
      Output (15) := Integer (Bardo.Calendar.Start_Time (Dir));
      declare
         Value : Bardo.Sidpa.Result;
      begin
         Bardo.Sidpa.Evaluate
           (Time, Dir, Input (2), Input (3), Input (4), Input (5), Input (6),
            Value);
         Sidpa (0) := Bardo.Sidpa.Scene_Kind'Pos (Value.Scene);
         Sidpa (1) := Value.Outcome;
         Sidpa (2) := Value.Methods;
         Sidpa (3) := Value.Brightest;
         Sidpa (4) := Value.Instruct;
         Sidpa (5) := Value.Allow;
         Sidpa (6) := Value.Poison;
         Sidpa (7) := Value.Wind;
         Sidpa (8) := Value.X;
         Sidpa (9) := Value.Y;
         Sidpa (10) := Value.White;
         Sidpa (11) := Value.Black;
         Sidpa (12) := Integer (Value.Anchor);
         Sidpa (13) := Value.Next_Scene;
         Sidpa (14) := Value.Prev_Scene;
         Sidpa (15) := Value.Closed;
      end;
   end Compute;

   Tick_Count : Integer := 0;

   procedure Tick is
   begin
      if Tick_Count < Integer'Last then
         Tick_Count := Tick_Count + 1;
      end if;
      Output (14) := Tick_Count;
   end Tick;

   procedure Mantra_Glyph (Mantra : Integer; Index : Integer) is
      Id  : Bardo.Rain.Mantra_Id;
      Len : Natural;
   begin
      if Mantra not in 1 .. 3 then
         Output (0) := 3;
         Output (12) := 0;
         return;
      end if;
      Id := Bardo.Rain.Mantra_Id (Mantra);
      if Index < 0 or else Index >= Bardo.Rain.Count (Id) then
         Output (0) := 4;
         Output (12) := 0;
         return;
      end if;
      Bardo.Rain.Write_Grapheme (Id, Index, Glyph, Len);
      Output (12) := Len;
      Output (0) := 0;
   end Mantra_Glyph;

   function Start_Milli (Direction : Integer) return Integer is
     (if Direction /= 0 and then Direction /= 1 then -1
      else Integer (Bardo.Calendar.Start_Time (Direction_Of (Direction))));

   function Milli_Of_Day_Host (Day : Integer) return Integer is
     (if Day not in 0 .. 49 then -1
      else Integer (Milli_Of_Day (Day_Number (Day))));

   function Walk_Host (Time : Integer; Direction : Integer) return Integer is
     (if Time not in 0 .. Clock_End
        or else (Direction /= 0 and then Direction /= 1)
      then -1
      else Integer
        (Bardo.Calendar.Walk (Milli_Time (Time), Direction_Of (Direction))));

   function Anchor_Host (Scene : Integer) return Integer is
     (if Scene not in 0 .. 4 then -1
      else Integer
        (Bardo.Sidpa.Anchor_Day (Bardo.Sidpa.Scene_Kind'Val (Scene))));

   function First_Host (Direction : Integer) return Integer is
     (if Direction = 0 then 1
      elsif Direction = 1 then 4
      else -1);

   function Realm_Host (Brightest : Integer; Poison : Integer) return Integer is
     (Bardo.Sidpa.Karmic_Realm (Brightest, Poison));

   function Karma_Start_Host return Integer is (Bardo.Sidpa.Karma_Start);
   function Karma_Lighten_Host (Weight : Integer) return Integer is
     (Bardo.Sidpa.Karma_Lighten (Weight));
   function Karma_Heavy_Host (Weight : Integer) return Integer is
     (Bardo.Sidpa.Karma_Heavy (Weight));
   function Karma_Carry_Host (Weight : Integer) return Integer is
     (Bardo.Sidpa.Karma_Carry (Weight));
   function Karma_Band_Host (Weight : Integer) return Integer is
     (Bardo.Sidpa.Karma_Band (Weight));
   function Karma_Chance_Host (Weight : Integer) return Integer is
     (Bardo.Sidpa.Karma_Chance (Weight));
   function Karma_Realm_Host (Weight : Integer) return Integer is
     (Bardo.Sidpa.Fallback_Realm (Weight));
   function Rebirth_Host (Brightest : Integer; Weight : Integer) return Integer is
     (Bardo.Sidpa.Rebirth_Realm (Brightest, Weight));

   function Dull_Host (Book_Day : Integer) return Integer is
     (Bardo.Sidpa.Dull_Realm (Book_Day));

end Bardo.API;
