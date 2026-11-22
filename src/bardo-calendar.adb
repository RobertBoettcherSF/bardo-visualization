package body Bardo.Calendar is

   function Phase (Time : Milli_Time) return Phase_Kind is
     (if Time < Primary_End then Chikhai_Primary
      elsif Time < Peaceful_Start then Chikhai_Secondary
      elsif Time < Wrathful_Start then Chonyid_Peaceful
      elsif Time < Post_Start then Chonyid_Wrathful
      elsif Time < Sidpa_Start then Post_Wrathful
      else Sidpa);

   function Named_Day (Time : Milli_Time) return Chonyid_Day is
     (if Time in Peaceful_Start .. Wrathful_Start - 1 then
        Chonyid_Day (1 + (Integer (Time) - Peaceful_Start) / Milli_Per_Day)
      elsif Time in Wrathful_Start .. Post_Start - 1 then
        Chonyid_Day (8 + (Integer (Time) - Wrathful_Start) / Milli_Per_Day)
      else 0);

   function Calendar_Day (Time : Milli_Time) return Day_Number is
     (Day_Number (Integer (Time) / Milli_Per_Day));

   function Start_Time (Direction : Direction_Kind) return Milli_Time is
     (if Direction = Jung_Reverse then Clock_End else 0);

   function Step_Milli (Direction : Direction_Kind) return Integer is
     (if Direction = Jung_Reverse then -Milli_Per_Day else Milli_Per_Day);

   function Walk
     (Time : Milli_Time; Direction : Direction_Kind) return Milli_Time
   is
      Next : constant Integer := Integer (Time) + Step_Milli (Direction);
   begin
      if Next < 0 then
         return 0;
      elsif Next > Clock_End then
         return Clock_End;
      else
         return Milli_Time (Next);
      end if;
   end Walk;

end Bardo.Calendar;
