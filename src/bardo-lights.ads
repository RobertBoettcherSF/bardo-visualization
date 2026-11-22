--  The six dull realm lights of Sidpa. The destination light is the
--  brightest. Colour indexes are our palette, not numbers from the book.

package Bardo.Lights is

   type Realm is (Deva, Asura, Human, Animal, Preta, Hell);
   for Realm use
     (Deva => 0, Asura => 1, Human => 2, Animal => 3, Preta => 4, Hell => 5);

   --  0 dull white, 1 dull green, 2 dull yellow, 3 dull blue,
   --  4 dull red, 5 smoky. Outside the source: our own choice.
   function Colour_Index (Item : Realm) return Natural with
     Post => Colour_Index'Result = Realm'Pos (Item);

   function Brightest (Destination : Realm) return Realm is (Destination);

   function Is_Bright (Destination, Light : Realm) return Boolean is
     (Destination = Light);

   --  0 none chosen, 2 both instructions: see the light as the
   --  Compassionate One, or dissolve into Clear Light.
   function Instruction (Destination : Integer) return Natural with
     Post =>
       (if Destination in 0 .. 5 then Instruction'Result = 2
        else Instruction'Result = 0);

end Bardo.Lights;
