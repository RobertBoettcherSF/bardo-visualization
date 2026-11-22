--  Native smoke. Contracts are on (-gnata). One run calls every unit.

with Ada.Text_IO;
with Bardo.API;
with Host_Stub;
with Bardo.Calendar;
with Bardo.Curves;
with Bardo.Rain;
with Bardo.Version;
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
      pragma Assert (Bardo.Calendar.Phase (22_000) = Bardo.Sidpa);
      pragma Assert (Bardo.Calendar.Phase (49_000) = Bardo.Sidpa);
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
      pragma Assert (Bardo.API.Output (1) = Bardo.Phase_Kind'Pos (Bardo.Sidpa));
      pragma Assert (Bardo.API.Output (2) = 49);
      pragma Assert (Bardo.API.Output (4) = 0);
      pragma Assert (Bardo.API.Output (15) = 49_000);

      Bardo.API.Input (1) := 1;
      Bardo.API.Compute;
      pragma Assert (Bardo.API.Output (1) = Bardo.Phase_Kind'Pos (Bardo.Sidpa));
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
   end Check_API;

begin
   pragma Assert (Host_Stub.Ready);
   Check_Calendar;
   Check_Curves;
   Check_Rain;
   Check_All_Graphemes;
   Check_API;
   Ada.Text_IO.Put_Line ("smoke ok");
end Smoke;
