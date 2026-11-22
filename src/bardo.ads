--  Shared types for the one 49-day clock.
--  Times are milli-days: 0 is the moment of death, 49_000 is the end of day 49.
--  The offsets are a model of the source, not a calendar the book prints.

package Bardo is

   Milli_Per_Day    : constant := 1_000;
   Primary_Hours    : constant := 6;
   Primary_End      : constant := Primary_Hours * Milli_Per_Day / 24;
   Three_Point_Five : constant := 3_500;
   Peaceful_Start   : constant := 4 * Milli_Per_Day;
   Wrathful_Start   : constant := 11 * Milli_Per_Day;
   Post_Start       : constant := 18 * Milli_Per_Day;
   Sidpa_Start      : constant := 22 * Milli_Per_Day;
   Clock_End        : constant := 49 * Milli_Per_Day;

   subtype Milli_Time is Natural range 0 .. Clock_End;
   subtype Day_Number is Natural range 0 .. 49;
   subtype Chonyid_Day is Natural range 0 .. 14;
   subtype Thousandth is Natural range 0 .. 1_000;
   subtype Scale is Natural range 0 .. 2_000;

   type Byte is mod 256;
   type Byte_Array is array (Natural range <>) of Byte;

   type Direction_Kind is (Jung_Reverse, Book_Order);
   for Direction_Kind use (Jung_Reverse => 0, Book_Order => 1);

   type Phase_Kind is
     (Chikhai_Primary,
      Chikhai_Secondary,
      Chonyid_Peaceful,
      Chonyid_Wrathful,
      Post_Wrathful,
      Sidpa_Phase);
   for Phase_Kind use
     (Chikhai_Primary   => 0,
      Chikhai_Secondary => 1,
      Chonyid_Peaceful  => 2,
      Chonyid_Wrathful  => 3,
      Post_Wrathful     => 4,
      Sidpa_Phase       => 5);

   --  Day 49 is the Sidpa end of the clock, not the morning of that day.
   function Milli_Of_Day (Day : Day_Number) return Milli_Time with
     Post =>
       (if Day = 49 then Milli_Of_Day'Result = Clock_End
        else Milli_Of_Day'Result =
          Milli_Time (Integer (Day) * Milli_Per_Day));

end Bardo;
