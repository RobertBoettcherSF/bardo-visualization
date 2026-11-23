--  Integer host ABI. The page writes Input, calls Compute, and reads
--  Output. Grapheme bytes go into Glyph; no string crosses this boundary.

with System;

package Bardo.API is

   Input  : array (0 .. 7) of Integer := [others => 0];
   Output : array (0 .. 15) of Integer := [others => 0];
   Glyph  : Byte_Array (0 .. 31) := [others => 0];
   Sidpa  : array (0 .. 15) of Integer := [others => 0];

   --  Input:  0 time in milli-days, 1 direction (0 Jung, 1 book).
   --  Output: 0 status (0 ok, 1 bad time, 2 bad direction,
   --                    3 bad mantra, 4 bad grapheme index),
   --          1 phase, 2 calendar day, 3 Chonyid day,
   --          4 clarity, 5 intensity, 6 complexity, 7 direction,
   --          8 mantra, 9 speed scale, 10 alpha scale, 11 stride,
   --          12 glyph length, 13 last-chance line, 14 tick,
   --          15 start time for this direction.
   --  Input 2 action, 3 argument, 4 closing methods already done,
   --        5 realm destination or -1, 6 wander tick.
   --  Sidpa: 0 scene, 1 outcome, 2 methods, 3 brightest, 4 instruction,
   --         5 allow, 6 poison, 7 wind, 8 x, 9 y, 10 white, 11 black,
   --         12 anchor day, 13 next scene, 14 previous scene, 15 closed.

   function Input_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_input";
   function Output_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_output";
   function Glyph_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_glyph";
   function Sidpa_Address return System.Address with
     Export, Convention => C, External_Name => "bardo_sidpa";

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

   function Anchor_Host (Scene : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_anchor",
     Post => Anchor_Host'Result in -1 .. 49;

   function First_Host (Direction : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_first",
     Post => First_Host'Result = -1
       or else First_Host'Result in 1 .. 4;

   function Realm_Host (Brightest : Integer; Poison : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_realm",
     Post => Realm_Host'Result in 0 .. 5;

   function Karma_Start_Host return Integer with
     Export, Convention => C, External_Name => "bardo_karma_start",
     Post => Karma_Start_Host'Result in 0 .. 1_000;
   function Karma_Lighten_Host (Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_karma_lighten",
     Post => Karma_Lighten_Host'Result in 0 .. 1_000;
   function Karma_Heavy_Host (Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_karma_heavy",
     Post => Karma_Heavy_Host'Result in 0 .. 1_000;
   function Karma_Carry_Host (Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_karma_carry",
     Post => Karma_Carry_Host'Result in 0 .. 1_000;
   function Karma_Band_Host (Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_karma_band",
     Post => Karma_Band_Host'Result in 0 .. 2;
   function Karma_Chance_Host (Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_karma_chance",
     Post => Karma_Chance_Host'Result in 0 .. 1_000;
   function Karma_Realm_Host (Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_karma_realm",
     Post => Karma_Realm_Host'Result in 0 .. 5;
   function Rebirth_Host (Brightest : Integer; Weight : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_rebirth",
     Post => Rebirth_Host'Result in 0 .. 5;

   function Dull_Host (Book_Day : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_dull_realm",
     Post => Dull_Host'Result in -1 .. 5;

   function Dissolve_Clamp_Host (Level : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_dissolve_clamp",
     Post => Dissolve_Clamp_Host'Result in 0 .. 1_000;
   function Dissolve_Stage_Host (Level : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_dissolve_stage",
     Post => Dissolve_Stage_Host'Result in 0 .. 2;
   function Clear_Step_Host (Screen : Integer; Follow : Integer) return Integer with
     Export, Convention => C, External_Name => "bardo_clear_step",
     Post => Clear_Step_Host'Result in -1 .. 21;
   function Womb_Path_Host
     (From : Integer; Choice : Integer; Brightest : Integer; Weight : Integer)
     return Integer with
     Export, Convention => C, External_Name => "bardo_womb_path",
     Post => Womb_Path_Host'Result in -1 .. 25;

end Bardo.API;
