--  Native smoke. Contracts are on (-gnata). One run calls every unit.

with Ada.Text_IO;
with Bardo.API;
with Host_Stub;
with Bardo.Calendar;
with Bardo.Curves;
with Bardo.Lights;
with Bardo.Rain;
with Bardo.Sidpa;
with Bardo.Version;
use type Bardo.Sidpa.Scene_Kind;
use type Bardo.Lights.Realm;
use type Bardo.Byte;
use type Bardo.Phase_Kind;
use type Bardo.Rain.Mantra_Id;

procedure Smoke is

   procedure Fail (Message : String) is
   begin
      Ada.Text_IO.Put_Line ("FAIL: " & Message);
      raise Program_Error with Message;
   end Fail;

   procedure Check_Grapheme
     (Id : Bardo.Rain.Mantra_Id; Index : Natural; Expect : Bardo.Byte_Array)
   is
      Buf : Bardo.Byte_Array (0 .. 31) := [others => 0];
      Len : Natural;
   begin
      Bardo.Rain.Write_Grapheme (Id, Index, Buf, Len);
      if Len /= Expect'Length then
         Fail ("grapheme length");
      end if;
      if Bardo.Rain.Ends_With_Virama (Buf, Len) then
         Fail ("cluster ends in a virama");
      end if;
      if Len = 3
        and then Buf (0) = 16#E0#
        and then Buf (1) = 16#A5#
        and then Buf (2) = 16#8D#
      then
         Fail ("lone virama");
      end if;
      for J in Expect'Range loop
         if Buf (J - Expect'First) /= Expect (J) then
            Fail ("conjunct bytes");
         end if;
      end loop;
   end Check_Grapheme;

   procedure Check_All_Graphemes is
      Buf : Bardo.Byte_Array (0 .. 31) := [others => 0];
      Len : Natural;
   begin
      for Id in Bardo.Rain.Mantra_Id loop
         for Index in 0 .. Bardo.Rain.Count (Id) - 1 loop
            Bardo.Rain.Write_Grapheme (Id, Index, Buf, Len);
            if Len < 1 then
               Fail ("empty grapheme");
            end if;
            if Bardo.Rain.Ends_With_Virama (Buf, Len) then
               Fail ("split conjunct");
            end if;
         end loop;
      end loop;
      Check_Grapheme
        (1, 4,
         [16#E0#, 16#A4#, 16#A6#, 16#E0#, 16#A5#, 16#8D#,
          16#E0#, 16#A4#, 16#AE#, 16#E0#, 16#A5#, 16#87#]);
      Check_Grapheme
        (2, 5,
         [16#E0#, 16#A4#, 16#B9#, 16#E0#, 16#A5#, 16#8D#, 16#E0#, 16#A4#,
          16#B0#, 16#E0#, 16#A5#, 16#80#, 16#E0#, 16#A4#, 16#83#]);
      Check_Grapheme
        (3, 4, [16#E0#, 16#A4#, 16#9C#, 16#E0#, 16#A5#, 16#8D#, 16#E0#, 16#A4#, 16#B0#]);
      Check_Grapheme
        (3, 8, [16#E0#, 16#A4#, 16#A6#, 16#E0#, 16#A5#, 16#8D#, 16#E0#, 16#A4#, 16#AE#]);
      Check_Grapheme
        (3, 10,
         [16#E0#, 16#A4#, 16#A6#, 16#E0#, 16#A5#, 16#8D#,
          16#E0#, 16#A4#, 16#A7#, 16#E0#, 16#A4#, 16#BF#]);
   end Check_All_Graphemes;

   procedure Check_Calendar is
   begin
      pragma Assert (Bardo.Calendar.Phase (0) = Bardo.Chikhai_Primary);
      pragma Assert (Bardo.Calendar.Phase (249) = Bardo.Chikhai_Primary);
      pragma Assert (Bardo.Calendar.Phase (250) = Bardo.Chikhai_Secondary);
      pragma Assert (Bardo.Calendar.Phase (Bardo.Three_Point_Five) = Bardo.Chikhai_Secondary);
      pragma Assert (Bardo.Calendar.Phase (3_999) = Bardo.Chikhai_Secondary);
      pragma Assert (Bardo.Calendar.Phase (4_000) = Bardo.Chonyid_Peaceful);
      pragma Assert (Bardo.Calendar.Named_Day (4_000) = 1);
      pragma Assert (Bardo.Calendar.Named_Day (10_999) = 7);
      pragma Assert (Bardo.Calendar.Phase (11_000) = Bardo.Chonyid_Wrathful);
      pragma Assert (Bardo.Calendar.Named_Day (11_000) = 8);
      pragma Assert (Bardo.Calendar.Named_Day (17_999) = 14);
      pragma Assert (Bardo.Calendar.Phase (18_000) = Bardo.Post_Wrathful);
      pragma Assert (Bardo.Calendar.Phase (21_999) = Bardo.Post_Wrathful);
      pragma Assert (Bardo.Calendar.Named_Day (18_000) = 0);
      pragma Assert (Bardo.Calendar.Phase (22_000) = Bardo.Sidpa_Phase);
      pragma Assert (Bardo.Calendar.Phase (49_000) = Bardo.Sidpa_Phase);
      pragma Assert (Bardo.Calendar.Calendar_Day (0) = 0);
      pragma Assert (Bardo.Calendar.Calendar_Day (3_500) = 3);
      pragma Assert (Bardo.Calendar.Calendar_Day (49_000) = 49);
      pragma Assert (Bardo.Calendar.Start_Time (Bardo.Jung_Reverse) = 49_000);
      pragma Assert (Bardo.Calendar.Start_Time (Bardo.Book_Order) = 0);
      pragma Assert (Bardo.Calendar.Step_Milli (Bardo.Jung_Reverse) = -1_000);
      pragma Assert (Bardo.Calendar.Step_Milli (Bardo.Book_Order) = 1_000);
      pragma Assert (Bardo.Calendar.Walk (49_000, Bardo.Jung_Reverse) = 48_000);
      pragma Assert (Bardo.Calendar.Walk (0, Bardo.Jung_Reverse) = 0);
      pragma Assert (Bardo.Calendar.Walk (0, Bardo.Book_Order) = 1_000);
      pragma Assert (Bardo.Calendar.Walk (49_000, Bardo.Book_Order) = 49_000);
      pragma Assert (Bardo.Milli_Of_Day (0) = 0);
      pragma Assert (Bardo.Milli_Of_Day (7) = 7_000);
      pragma Assert (Bardo.Milli_Of_Day (49) = 49_000);
   end Check_Calendar;

   procedure Check_Curves is
      Previous : Bardo.Thousandth := Bardo.Curves.Clarity (0);
   begin
      pragma Assert (Bardo.Curves.Clarity (0) = 1_000);
      pragma Assert (Bardo.Curves.Clarity (49_000) = 0);
      for Time in 1 .. Bardo.Clock_End loop
         declare
            Next : constant Bardo.Thousandth := Bardo.Curves.Clarity (Time);
         begin
            pragma Assert (Next <= Previous);
            Previous := Next;
         end;
      end loop;
      pragma Assert (Bardo.Curves.Intensity (4_000) = Bardo.Curves.Intensity (4_999));
      pragma Assert (Bardo.Curves.Intensity (5_000) > Bardo.Curves.Intensity (4_000));
      pragma Assert (Bardo.Curves.Intensity (17_000) > Bardo.Curves.Intensity (10_000));
      pragma Assert (Bardo.Curves.Intensity (17_000) > Bardo.Curves.Intensity (22_000));
      pragma Assert (Bardo.Curves.Complexity (4_500) = Bardo.Curves.Complexity (4_000));
      pragma Assert (Bardo.Curves.Complexity (5_000) > Bardo.Curves.Complexity (4_000));
      pragma Assert (Bardo.Curves.Complexity (22_000) < Bardo.Curves.Complexity (17_000));
      pragma Assert (Bardo.Curves.Complexity (17_000) > Bardo.Curves.Complexity (10_999));
   end Check_Curves;

   procedure Check_Rain is
      Primary : constant Bardo.Rain.Params := Bardo.Rain.Parameters (0);
      Day_4   : constant Bardo.Rain.Params := Bardo.Rain.Parameters (7_000);
      Day_1   : constant Bardo.Rain.Params := Bardo.Rain.Parameters (4_000);
      Wrath   : constant Bardo.Rain.Params := Bardo.Rain.Parameters (17_000);
      Sidpa   : constant Bardo.Rain.Params := Bardo.Rain.Parameters (49_000);
   begin
      pragma Assert (Primary.Stride = 2);
      pragma Assert (Primary.Speed = 450);
      pragma Assert (Day_4.Mantra = 2);
      pragma Assert (Day_1.Mantra = 3);
      pragma Assert (Day_1.Speed = 1_000);
      pragma Assert (Wrath.Speed > Day_1.Speed);
      pragma Assert (Wrath.Alpha > Day_1.Alpha);
      pragma Assert (Sidpa.Mantra = 1);
      pragma Assert (Sidpa.Stride = 1);
      pragma Assert (Bardo.Calendar.Named_Day (7_000) = 4);
   end Check_Rain;

   procedure Check_API is
      Buf : String (1 .. Bardo.Version.Max) := [others => ' '];
      Len : Natural;
   begin
      Bardo.Version.Copy (Buf, Len);
      pragma Assert (Len > 8);
      Ada.Text_IO.Put_Line (Buf (1 .. Len));

      Bardo.API.Input (0) := 49_000;
      Bardo.API.Input (1) := 0;
      Bardo.API.Compute;
      pragma Assert (Bardo.API.Output (0) = 0);
      pragma Assert (Bardo.API.Output (1) = Bardo.Phase_Kind'Pos (Bardo.Sidpa_Phase));
      pragma Assert (Bardo.API.Output (2) = 49);
      pragma Assert (Bardo.API.Output (4) = 0);
      pragma Assert (Bardo.API.Output (15) = 49_000);

      Bardo.API.Input (1) := 1;
      Bardo.API.Compute;
      pragma Assert (Bardo.API.Output (1) = Bardo.Phase_Kind'Pos (Bardo.Sidpa_Phase));
      pragma Assert (Bardo.API.Output (4) = 0);
      pragma Assert (Bardo.API.Output (15) = 0);

      Bardo.API.Input (0) := 0;
      Bardo.API.Input (1) := 1;
      Bardo.API.Compute;
      pragma Assert (Bardo.API.Output (1) = Bardo.Phase_Kind'Pos (Bardo.Chikhai_Primary));
      pragma Assert (Bardo.API.Output (4) = 1_000);
      pragma Assert (Bardo.API.Output (2) = 0);

      Bardo.API.Input (0) := 49_001;
      Bardo.API.Compute;
      pragma Assert (Bardo.API.Output (0) = 1);

      Bardo.API.Input (0) := 0;
      Bardo.API.Input (1) := 9;
      Bardo.API.Compute;
      pragma Assert (Bardo.API.Output (0) = 2);

      Bardo.API.Mantra_Glyph (1, 4);
      pragma Assert (Bardo.API.Output (0) = 0);
      pragma Assert (Bardo.API.Output (12) = 12);
      pragma Assert (not Bardo.Rain.Ends_With_Virama (Bardo.API.Glyph, 12));

      Bardo.API.Mantra_Glyph (9, 0);
      pragma Assert (Bardo.API.Output (0) = 3);
      Bardo.API.Mantra_Glyph (1, 99);
      pragma Assert (Bardo.API.Output (0) = 4);

      Bardo.API.Tick;
      pragma Assert (Bardo.API.Output (14) = 1);
      pragma Assert (Bardo.API.Start_Milli (0) = 49_000);
      pragma Assert (Bardo.API.Start_Milli (1) = 0);
      pragma Assert (Bardo.API.Start_Milli (4) = -1);
      pragma Assert (Bardo.API.Milli_Of_Day_Host (49) = 49_000);
      pragma Assert (Bardo.API.Milli_Of_Day_Host (3) = 3_000);
      pragma Assert (Bardo.API.Milli_Of_Day_Host (50) = -1);
      pragma Assert (Bardo.API.Walk_Host (49_000, 0) = 48_000);
      pragma Assert (Bardo.API.Walk_Host (0, 0) = 0);
      pragma Assert (Bardo.API.Walk_Host (-1, 0) = -1);
      pragma Assert (Bardo.API.Anchor_Host (1) = 49);
      pragma Assert (Bardo.API.Anchor_Host (4) = 22);
      pragma Assert (Bardo.API.First_Host (0) = 1);
      pragma Assert (Bardo.API.First_Host (1) = 4);
      pragma Assert (Bardo.API.First_Host (3) = -1);
   end Check_API;

   procedure Check_Sidpa is
      Value : Bardo.Sidpa.Result;
   begin
      pragma Assert (Bardo.Sidpa.Scene_Of (21) = Bardo.Sidpa.None);
      pragma Assert (Bardo.Sidpa.Scene_Of (22) = Bardo.Sidpa.Wish_Body);
      pragma Assert (Bardo.Sidpa.Scene_Of (28) = Bardo.Sidpa.Wish_Body);
      pragma Assert (Bardo.Sidpa.Scene_Of (29) = Bardo.Sidpa.Judgement);
      pragma Assert (Bardo.Sidpa.Scene_Of (35) = Bardo.Sidpa.Judgement);
      pragma Assert (Bardo.Sidpa.Scene_Of (36) = Bardo.Sidpa.Lights);
      pragma Assert (Bardo.Sidpa.Scene_Of (42) = Bardo.Sidpa.Lights);
      pragma Assert (Bardo.Sidpa.Scene_Of (43) = Bardo.Sidpa.Womb);
      pragma Assert (Bardo.Sidpa.Scene_Of (49) = Bardo.Sidpa.Womb);
      pragma Assert (Bardo.Sidpa.Anchor_Day (Bardo.Sidpa.Womb) = 49);
      pragma Assert (Bardo.Sidpa.Anchor_Day (Bardo.Sidpa.Wish_Body) = 22);
      pragma Assert
        (Bardo.Sidpa.Neighbour (Bardo.Jung_Reverse, Bardo.Sidpa.Womb, 1) =
           Bardo.Sidpa.Lights);
      pragma Assert
        (Bardo.Sidpa.Neighbour (Bardo.Book_Order, Bardo.Sidpa.Wish_Body, 1) =
           Bardo.Sidpa.Judgement);
      pragma Assert
        (Bardo.Sidpa.Neighbour (Bardo.Jung_Reverse, Bardo.Sidpa.Wish_Body, 1) =
           Bardo.Sidpa.Wish_Body);
      pragma Assert (Bardo.Sidpa.Apply_Method (0, 1) = 1);
      pragma Assert (Bardo.Sidpa.Apply_Method (0, 3) = 0);
      pragma Assert (Bardo.Sidpa.Apply_Method (4, 5) = 5);
      pragma Assert (Bardo.Sidpa.Apply_Method (5, 1) = 5);
      pragma Assert (Bardo.Sidpa.Entry_Allowed (1));
      pragma Assert (Bardo.Sidpa.Entry_Allowed (10));
      pragma Assert (Bardo.Sidpa.Entry_Allowed (12));
      pragma Assert (not Bardo.Sidpa.Entry_Allowed (0));
      pragma Assert (not Bardo.Sidpa.Entry_Allowed (11));
      pragma Assert (not Bardo.Sidpa.Entry_Allowed (15));
      pragma Assert (Bardo.Sidpa.Poison (0) = 0);
      pragma Assert (Bardo.Sidpa.Poison (1) = 1);
      pragma Assert (Bardo.Sidpa.Poison (2) = 2);
      pragma Assert (Bardo.Sidpa.Poison (3) = -1);
      pragma Assert (Bardo.Sidpa.Karmic_Realm (4, -1) = 4);
      pragma Assert (Bardo.Sidpa.Karmic_Realm (-1, 0) = 5);
      pragma Assert (Bardo.Sidpa.Karmic_Realm (-1, 1) = 4);
      pragma Assert (Bardo.Sidpa.Karmic_Realm (-1, 2) = 3);
      pragma Assert (Bardo.Sidpa.Karmic_Realm (-1, -1) = 2);
      pragma Assert (Bardo.API.Realm_Host (1, 0) = 1);
      pragma Assert (Bardo.API.Realm_Host (-1, 2) = 3);
      pragma Assert (Bardo.Sidpa.Wind_Force (0) = 0);
      pragma Assert (Bardo.Sidpa.Wind_Force (22_000) = 640);
      pragma Assert (Bardo.Sidpa.Wind_Force (49_000) > Bardo.Sidpa.Wind_Force (22_000));
      pragma Assert
        (Bardo.Lights.Brightest (Bardo.Lights.Hell) = Bardo.Lights.Hell);
      pragma Assert
        (Bardo.Lights.Is_Bright (Bardo.Lights.Human, Bardo.Lights.Human));
      pragma Assert
        (not Bardo.Lights.Is_Bright (Bardo.Lights.Human, Bardo.Lights.Deva));
      pragma Assert (Bardo.Lights.Colour_Index (Bardo.Lights.Preta) = 4);
      pragma Assert (Bardo.Lights.Instruction (-1) = 0);
      pragma Assert (Bardo.Lights.Instruction (2) = 2);
      Bardo.Sidpa.Evaluate
        (49_000, Bardo.Jung_Reverse, 1, 1, 0, -1, 0, Value);
      pragma Assert (Value.Scene = Bardo.Sidpa.Womb);
      pragma Assert (Value.Methods = 1);
      pragma Assert (Value.Outcome = 0);
      Bardo.Sidpa.Evaluate
        (49_000, Bardo.Jung_Reverse, 1, 5, 4, -1, 0, Value);
      pragma Assert (Value.Methods = 5);
      pragma Assert (Value.Outcome = 1);
      pragma Assert (Value.Closed = 1);
      Bardo.Sidpa.Evaluate
        (49_000, Bardo.Jung_Reverse, 1, 4, 0, -1, 0, Value);
      pragma Assert (Value.Outcome = 8);
      pragma Assert (Value.Methods = 0);
      Bardo.Sidpa.Evaluate
        (49_000, Bardo.Jung_Reverse, 3, 1, 0, -1, 0, Value);
      pragma Assert (Value.Outcome = 4);
      Bardo.Sidpa.Evaluate
        (49_000, Bardo.Jung_Reverse, 3, 0, 0, -1, 0, Value);
      pragma Assert (Value.Outcome = 5);
      Bardo.Sidpa.Evaluate
        (49_000, Bardo.Jung_Reverse, 2, 0, 0, -1, 0, Value);
      pragma Assert (Value.Outcome = 2);
      Bardo.Sidpa.Evaluate
        (39_000, Bardo.Jung_Reverse, 4, 4, 0, -1, 0, Value);
      pragma Assert (Value.Scene = Bardo.Sidpa.Lights);
      pragma Assert (Value.Brightest = 4);
      pragma Assert (Value.Instruct = 2);
      Bardo.Sidpa.Evaluate
        (32_000, Bardo.Book_Order, 5, 0, 0, -1, 0, Value);
      pragma Assert (Value.Scene = Bardo.Sidpa.Judgement);
      pragma Assert (Value.Outcome = 6);
      pragma Assert (Value.White = 1 and then Value.Black = 1);
      Bardo.Sidpa.Evaluate
        (22_000, Bardo.Book_Order, 7, 0, 0, -1, 3, Value);
      pragma Assert (Value.Scene = Bardo.Sidpa.Wish_Body);
      pragma Assert (Value.Outcome = 9);
      pragma Assert (Value.Poison = 0);
      pragma Assert (Value.Wind = 640);
      pragma Assert (Bardo.Sidpa.Scene_Of (0) = Bardo.Sidpa.None);
   end Check_Sidpa;

begin
   pragma Assert (Host_Stub.Ready);
   Check_Calendar;
   Check_Curves;
   Check_Rain;
   Check_All_Graphemes;
   Check_Sidpa;
   Check_API;
   Ada.Text_IO.Put_Line ("smoke ok");
end Smoke;
