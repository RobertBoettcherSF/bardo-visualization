--  Sidpa choices. A light simulation: Ada reports what the text says
--  follows, with no score. Closing methods only advance in order.

package Bardo.Sidpa is

   type Scene_Kind is (None, Womb, Lights, Judgement, Wish_Body);
   for Scene_Kind use
     (None => 0, Womb => 1, Lights => 2, Judgement => 3, Wish_Body => 4);

   --  0 none, 1 door closed, 2 Amitabha, 3 Tusita, 4 enter allowed,
   --  5 enter refused, 6 liberated, 7 not recognised, 8 out of order,
   --  9 abyss named.
   subtype Outcome_Code is Natural range 0 .. 9;

   --  0 none, 1 apply method, 2 transfer, 3 enter sign, 4 choose light,
   --  5 recognise, 6 do not recognise, 7 name abyss.
   subtype Action_Code is Natural range 0 .. 7;

   --  Continents 0..3: east Lüpah, south Jambu, west Balang-Tschöd,
   --  north Daminyan. Realm signs are 10 + realm index.
   function Entry_Allowed (Sign : Natural) return Boolean with
     Post =>
       Entry_Allowed'Result =
         (Sign = 1 or else Sign = 10 or else Sign = 12);

   function Apply_Method (Done : Natural; Method : Natural) return Natural with
     Pre => Done <= 5,
     Post =>
       Apply_Method'Result <= 5
       and then Apply_Method'Result >= Done
       and then (if Done < 5 and then Method = Done + 1
                 then Apply_Method'Result = Done + 1
                 else Apply_Method'Result = Done);

   function Scene_Of (Day : Day_Number) return Scene_Kind with
     Post =>
       (if Day < 22 then Scene_Of'Result = None
        elsif Day <= 28 then Scene_Of'Result = Wish_Body
        elsif Day <= 35 then Scene_Of'Result = Judgement
        elsif Day <= 42 then Scene_Of'Result = Lights
        else Scene_Of'Result = Womb);

   function Anchor_Day (Scene : Scene_Kind) return Day_Number with
     Post =>
       (if Scene = Wish_Body then Anchor_Day'Result = 22
        elsif Scene = Judgement then Anchor_Day'Result = 32
        elsif Scene = Lights then Anchor_Day'Result = 39
        elsif Scene = Womb then Anchor_Day'Result = 49
        else Anchor_Day'Result = 0);

   function Neighbour
     (Direction : Direction_Kind;
      Scene     : Scene_Kind;
      Step      : Integer) return Scene_Kind with
     Pre => Step in -1 .. 1;

   --  0 anger, 1 desire, 2 ignorance. White, black, red in that order.
   function Poison (Abyss : Natural) return Integer with
     Post =>
       (if Abyss <= 2 then Poison'Result = Integer (Abyss)
        else Poison'Result = -1);

   --  Realm of a karmic rebirth. A chosen light wins. Otherwise anger,
   --  desire, and ignorance fall to hell, preta, and animal. With no
   --  sign, the human light is the one the text says is easily entered.
   --  This is not the precious human birth chosen at the womb door.
   function Karmic_Realm (Brightest : Integer; Poison : Integer) return Integer with
     Post => Karmic_Realm'Result in 0 .. 5;

   --  Hidden karma weight. 0 is light, 1000 is heavy. Not a score.
   subtype Karma_Weight is Integer range 0 .. 1_000;

   function Karma_Start return Karma_Weight is (500);

   function Karma_Lighten (Weight : Integer) return Karma_Weight;
   function Karma_Heavy (Weight : Integer) return Karma_Weight;
   --  Halfway back towards the middle, so a portion of this life remains.
   function Karma_Carry (Weight : Integer) return Karma_Weight;
   --  0 light, 1 even, 2 heavy.
   function Karma_Band (Weight : Integer) return Integer with
     Post => Karma_Band'Result in 0 .. 2;
   --  Thousandths. Certain while the weight is even or light, then falls.
   function Karma_Chance (Weight : Integer) return Integer with
     Post => Karma_Chance'Result in 0 .. 1_000;
   --  Fallback when no light was chosen. Light leans to the gods,
   --  heavy leans to animal, hungry ghost, and hell.
   function Fallback_Realm (Weight : Integer) return Integer with
     Post => Fallback_Realm'Result in 0 .. 5;
   function Rebirth_Realm (Brightest : Integer; Weight : Integer) return Integer with
     Post => Rebirth_Realm'Result in 0 .. 5;

   --  Dull light of a peaceful day. 7 animal, 5 asura, 4 preta, 3 human,
   --  2 hell, 1 deva. Day 6 is chosen by karma, so the result is -1.
   function Dull_Realm (Book_Day : Integer) return Integer with
     Post => Dull_Realm'Result in -1 .. 5;

   function Wind_Force (Time : Milli_Time) return Thousandth;

   function Wander_X (Tick : Natural) return Thousandth;
   function Wander_Y (Tick : Natural) return Thousandth;

   type Result is record
      Scene      : Scene_Kind;
      Outcome    : Outcome_Code;
      Methods    : Natural range 0 .. 5;
      Brightest  : Integer range -1 .. 5;
      Instruct   : Natural range 0 .. 2;
      Allow      : Integer range -1 .. 1;
      Poison     : Integer range -1 .. 2;
      Wind       : Thousandth;
      X          : Thousandth;
      Y          : Thousandth;
      White      : Natural range 0 .. 1;
      Black      : Natural range 0 .. 1;
      Anchor     : Day_Number;
      Next_Scene : Integer range -1 .. 4;
      Prev_Scene : Integer range -1 .. 4;
      Closed     : Natural range 0 .. 1;
   end record;

   procedure Evaluate
     (Time        : Milli_Time;
      Direction   : Direction_Kind;
      Action      : Natural;
      Arg         : Integer;
      Methods_Done : Natural;
      Destination : Integer;
      Tick        : Natural;
      Value       : out Result) with
     Pre => Methods_Done <= 5;

end Bardo.Sidpa;
