package body Bardo is

   function Milli_Of_Day (Day : Day_Number) return Milli_Time is
     (if Day = 49 then Clock_End
      else Milli_Time (Integer (Day) * Milli_Per_Day));

end Bardo;
