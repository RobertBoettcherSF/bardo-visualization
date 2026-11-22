with Bardo.Calendar;

package body Bardo.Rain is

   Max_Glyph_Bytes : constant := 18;
   Virama_0 : constant Byte := 16#E0#;
   Virama_1 : constant Byte := 16#A5#;
   Virama_2 : constant Byte := 16#8D#;

   type Span is record
      Start : Natural;
      Len   : Natural range 1 .. Max_Glyph_Bytes;
   end record;

   type Span_Array is array (Natural range <>) of Span;

   Flat : constant Byte_Array (0 .. 152) := [
      16#E0#, 16#A5#, 16#90#, 16#E0#, 16#A4#, 16#AE#, 16#E0#, 16#A4#,
      16#A3#, 16#E0#, 16#A4#, 16#BF#, 16#E0#, 16#A4#, 16#AA#, 16#E0#,
      16#A4#, 16#A6#, 16#E0#, 16#A5#, 16#8D#, 16#E0#, 16#A4#, 16#AE#,
      16#E0#, 16#A5#, 16#87#, 16#E0#, 16#A4#, 16#B9#, 16#E0#, 16#A5#,
      16#82#, 16#E0#, 16#A4#, 16#81#, 16#E0#, 16#A5#, 16#90#, 16#E0#,
      16#A4#, 16#85#, 16#E0#, 16#A4#, 16#AE#, 16#E0#, 16#A4#, 16#BF#,
      16#E0#, 16#A4#, 16#A4#, 16#E0#, 16#A4#, 16#BE#, 16#E0#, 16#A4#,
      16#AD#, 16#E0#, 16#A4#, 16#B9#, 16#E0#, 16#A5#, 16#8D#, 16#E0#,
      16#A4#, 16#B0#, 16#E0#, 16#A5#, 16#80#, 16#E0#, 16#A4#, 16#83#,
      16#E0#, 16#A5#, 16#90#, 16#E0#, 16#A4#, 16#86#, 16#E0#, 16#A4#,
      16#83#, 16#E0#, 16#A4#, 16#B9#, 16#E0#, 16#A5#, 16#82#, 16#E0#,
      16#A4#, 16#81#, 16#E0#, 16#A4#, 16#B5#, 16#E0#, 16#A4#, 16#9C#,
      16#E0#, 16#A5#, 16#8D#, 16#E0#, 16#A4#, 16#B0#, 16#E0#, 16#A4#,
      16#97#, 16#E0#, 16#A5#, 16#81#, 16#E0#, 16#A4#, 16#B0#, 16#E0#,
      16#A5#, 16#81#, 16#E0#, 16#A4#, 16#AA#, 16#E0#, 16#A4#, 16#A6#,
      16#E0#, 16#A5#, 16#8D#, 16#E0#, 16#A4#, 16#AE#, 16#E0#, 16#A4#,
      16#B8#, 16#E0#, 16#A4#, 16#BF#, 16#E0#, 16#A4#, 16#A6#, 16#E0#,
      16#A5#, 16#8D#, 16#E0#, 16#A4#, 16#A7#, 16#E0#, 16#A4#, 16#BF#,
      16#E0#, 16#A4#, 16#B9#, 16#E0#, 16#A5#, 16#82#, 16#E0#, 16#A4#,
      16#81#
   ];

   M1 : constant Span_Array (0 .. 5) := [
      (Start => 0, Len => 3),
      (Start => 3, Len => 3),
      (Start => 6, Len => 6),
      (Start => 12, Len => 3),
      (Start => 15, Len => 12),
      (Start => 27, Len => 9)
   ];

   M2 : constant Span_Array (0 .. 5) := [
      (Start => 36, Len => 3),
      (Start => 39, Len => 3),
      (Start => 42, Len => 6),
      (Start => 48, Len => 6),
      (Start => 54, Len => 3),
      (Start => 57, Len => 15)
   ];

   M3 : constant Span_Array (0 .. 11) := [
      (Start => 72, Len => 3),
      (Start => 75, Len => 6),
      (Start => 81, Len => 9),
      (Start => 90, Len => 3),
      (Start => 93, Len => 9),
      (Start => 102, Len => 6),
      (Start => 108, Len => 6),
      (Start => 114, Len => 3),
      (Start => 117, Len => 9),
      (Start => 126, Len => 6),
      (Start => 132, Len => 12),
      (Start => 144, Len => 9)
   ];

   function Count (Id : Mantra_Id) return Positive is
     (case Id is
        when 1 => 6,
        when 2 => 6,
        when 3 => 12);

   function Span_Of (Id : Mantra_Id; Index : Natural) return Span is
     (case Id is
        when 1 => M1 (Index),
        when 2 => M2 (Index),
        when 3 => M3 (Index))
   with Pre => Index < Count (Id);

   procedure Write_Grapheme
     (Id     : Mantra_Id;
      Index  : Natural;
      Buffer : out Byte_Array;
      Length : out Natural)
   is
      S : constant Span := Span_Of (Id, Index);
   begin
      Buffer := [others => 0];
      for J in 0 .. S.Len - 1 loop
         Buffer (Buffer'First + J) := Flat (S.Start + J);
      end loop;
      Length := S.Len;
   end Write_Grapheme;

   function Ends_With_Virama
     (Buffer : Byte_Array; Length : Natural) return Boolean
   is
   begin
      if Length < 3 then
         return False;
      end if;
      return Buffer (Buffer'First + Length - 3) = Virama_0
        and then Buffer (Buffer'First + Length - 2) = Virama_1
        and then Buffer (Buffer'First + Length - 1) = Virama_2;
   end Ends_With_Virama;

   function Parameters (Time : Milli_Time) return Params is
      P : constant Phase_Kind := Bardo.Calendar.Phase (Time);
      D : constant Chonyid_Day := Bardo.Calendar.Named_Day (Time);
   begin
      case P is
         when Chikhai_Primary =>
            return (Mantra => 3, Speed => 450, Alpha => 350, Stride => 2);
         when Chikhai_Secondary =>
            return (Mantra => 3, Speed => 600, Alpha => 500, Stride => 2);
         when Chonyid_Peaceful =>
            if D = 4 then
               return (Mantra => 2, Speed => 1_000, Alpha => 1_000, Stride => 1);
            end if;
            return (Mantra => 3, Speed => 1_000, Alpha => 1_000, Stride => 1);
         when Chonyid_Wrathful =>
            return (Mantra => 3, Speed => 1_450, Alpha => 1_200, Stride => 1);
         when Post_Wrathful =>
            return (Mantra => 3, Speed => 700, Alpha => 600, Stride => 1);
         when Sidpa =>
            return (Mantra => 1, Speed => 850, Alpha => 700, Stride => 1);
      end case;
   end Parameters;

end Bardo.Rain;
