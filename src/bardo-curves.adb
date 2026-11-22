with Bardo.Calendar;

package body Bardo.Curves is

   function Clarity (Time : Milli_Time) return Thousandth is
     (Thousandth (1_000 - Integer (Time) * 1_000 / Clock_End));

   function Intensity (Time : Milli_Time) return Thousandth is
      P : constant Phase_Kind := Bardo.Calendar.Phase (Time);
      D : constant Chonyid_Day := Bardo.Calendar.Named_Day (Time);
   begin
      case P is
         when Chikhai_Primary =>
            return 60;
         when Chikhai_Secondary =>
            declare
               Span : constant Integer := Peaceful_Start - Primary_End;
               Into : constant Integer := Integer (Time) - Primary_End;
            begin
               return Thousandth (100 + Into * 140 / Span);
            end;
         when Chonyid_Peaceful =>
            return Thousandth (300 + (Integer (D) - 1) * 36);
         when Chonyid_Wrathful =>
            return Thousandth (620 + (Integer (D) - 8) * 48);
         when Post_Wrathful =>
            return 340;
         when Sidpa =>
            return 580;
      end case;
   end Intensity;

   function Complexity (Time : Milli_Time) return Thousandth is
      P : constant Phase_Kind := Bardo.Calendar.Phase (Time);
      D : constant Chonyid_Day := Bardo.Calendar.Named_Day (Time);
   begin
      case P is
         when Chikhai_Primary =>
            return 40;
         when Chikhai_Secondary =>
            return 90;
         when Chonyid_Peaceful =>
            return Thousandth (180 + (Integer (D) - 1) * 40);
         when Chonyid_Wrathful =>
            return Thousandth (640 + (Integer (D) - 8) * 46);
         when Post_Wrathful =>
            return 160;
         when Sidpa =>
            return 220;
      end case;
   end Complexity;

end Bardo.Curves;
