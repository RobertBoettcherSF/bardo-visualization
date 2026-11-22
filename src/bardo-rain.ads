--  Pre-segmented graphemes for the three mantras, and the rain scales
--  for the current phase. Columns spell whole clusters; a lone virama
--  is not an entry.

package Bardo.Rain is

   type Mantra_Id is range 1 .. 3;

   type Params is record
      Mantra : Mantra_Id;
      Speed  : Scale;
      Alpha  : Scale;
      Stride : Positive range 1 .. 2;
   end record;

   function Count (Id : Mantra_Id) return Positive;

   procedure Write_Grapheme
     (Id     : Mantra_Id;
      Index  : Natural;
      Buffer : out Byte_Array;
      Length : out Natural) with
     Pre =>
       Index < Count (Id)
       and then Buffer'Length >= 18
       and then Buffer'First <= Integer'Last - 18,
     Post => Length in 1 .. 18;

   --  True when the written cluster ends in a virama, which means a
   --  conjunct was split. A lone virama is this case with length 3.
   function Ends_With_Virama
     (Buffer : Byte_Array; Length : Natural) return Boolean with
     Pre => Length <= Buffer'Length;

   function Parameters (Time : Milli_Time) return Params;

end Bardo.Rain;
