with Bardo.Calendar;
with Bardo.Curves;
with Bardo.Rain;

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

end Bardo.API;
