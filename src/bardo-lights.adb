package body Bardo.Lights is

   function Colour_Index (Item : Realm) return Natural is
     (Realm'Pos (Item));

   function Instruction (Destination : Integer) return Natural is
     (if Destination in 0 .. 5 then 2 else 0);

end Bardo.Lights;
