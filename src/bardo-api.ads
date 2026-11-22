--  Integer host ABI. The page writes Input, calls Compute, and reads
--  Output. Grapheme bytes go into Glyph; no string crosses this boundary.

with System;

package Bardo.API is

   Input  : array (0 .. 7) of Integer := [others => 0];
   Output : array (0 .. 15) of Integer := [others => 0];
   Glyph  : Byte_Array (0 .. 31) := [others => 0];

   --  Input:  0 time in milli-days, 1 direction (0 Jung, 1 book).
   --  Output: 0 status (0 ok, 1 bad time, 2 bad direction,
   --                    3 bad mantra, 4 bad grapheme index),
   --          1 phase, 2 calendar day, 3 Chonyid day,
   --          4 clarity, 5 intensity, 6 complexity, 7 direction,
   --          8 mantra, 9 speed scale, 10 alpha scale, 11 stride,
   --          12 glyph length, 13 last-chance line, 14 tick,
   --          15 start time for this direction.

   function Input_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_input";
   function Output_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_output";
   function Glyph_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_glyph";

   procedure Compute with
     Export, Convention => C, External_Name => "bardo_compute";
   procedure Tick with
     Export, Convention => C, External_Name => "bardo_tick";
   procedure Mantra_Glyph (Mantra : Integer; Index : Integer) with
     Export, Convention => C, External_Name => "bardo_mantra_glyph";

   function Start_Milli (Direction : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_start",
     Post => Start_Milli'Result = -1
       or else Start_Milli'Result in 0 .. Clock_End;

   function Milli_Of_Day_Host (Day : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_milli_of_day",
     Post => Milli_Of_Day_Host'Result = -1
       or else Milli_Of_Day_Host'Result in 0 .. Clock_End;

   function Walk_Host (Time : Integer; Direction : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_walk",
     Post => Walk_Host'Result = -1
       or else Walk_Host'Result in 0 .. Clock_End;

end Bardo.API;
