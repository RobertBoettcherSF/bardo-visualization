--  The build rewrites the stamp so it matches version.txt.

package Bardo.Version is

   Max : constant := 64;

   procedure Copy (Buffer : out String; Length : out Natural) with
     Pre => Buffer'Length >= Max and then Buffer'First >= 1;

end Bardo.Version;
