--  Clarity, intensity and complexity as thousandths of the book clock.
--  Clarity falls steadily. Intensity and complexity step up through the
--  peaceful days and peak in the wrathful week. Sidpa stays windy and
--  simpler than that peak.

package Bardo.Curves is

   function Clarity (Time : Milli_Time) return Thousandth with
     Post =>
       Clarity'Result =
         Thousandth (1_000 - Integer (Time) * 1_000 / Clock_End);

   function Intensity (Time : Milli_Time) return Thousandth;

   function Complexity (Time : Milli_Time) return Thousandth;

end Bardo.Curves;
