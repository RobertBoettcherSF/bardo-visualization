--  Phase lookup on the book clock. Direction does not change the phase.
--  The secondary Clear Light runs through the source's 3.5 days and on
--  to day 4, where the peaceful week of the model begins.

package Bardo.Calendar is

   function Phase (Time : Milli_Time) return Phase_Kind with
     Post =>
       (if Time < Primary_End then Phase'Result = Chikhai_Primary
        elsif Time < Peaceful_Start then Phase'Result = Chikhai_Secondary
        elsif Time < Wrathful_Start then Phase'Result = Chonyid_Peaceful
        elsif Time < Post_Start then Phase'Result = Chonyid_Wrathful
        elsif Time < Sidpa_Start then Phase'Result = Post_Wrathful
        else Phase'Result = Sidpa_Phase);

   function Named_Day (Time : Milli_Time) return Chonyid_Day with
     Post =>
       (if Time in Peaceful_Start .. Wrathful_Start - 1 then
          Named_Day'Result =
            Chonyid_Day
              (1 + (Integer (Time) - Peaceful_Start) / Milli_Per_Day)
        elsif Time in Wrathful_Start .. Post_Start - 1 then
          Named_Day'Result =
            Chonyid_Day
              (8 + (Integer (Time) - Wrathful_Start) / Milli_Per_Day)
        else Named_Day'Result = 0);

   function Calendar_Day (Time : Milli_Time) return Day_Number with
     Post =>
       Calendar_Day'Result = Day_Number (Integer (Time) / Milli_Per_Day);

   function Start_Time (Direction : Direction_Kind) return Milli_Time with
     Post =>
       (if Direction = Jung_Reverse then Start_Time'Result = Clock_End
        else Start_Time'Result = 0);

   function Step_Milli (Direction : Direction_Kind) return Integer with
     Post =>
       (if Direction = Jung_Reverse then Step_Milli'Result = -Milli_Per_Day
        else Step_Milli'Result = Milli_Per_Day);

   function Walk
     (Time : Milli_Time; Direction : Direction_Kind) return Milli_Time;

end Bardo.Calendar;
