package body Bardo.Version is

   Stamp : constant String := "v0.9 b20261123-1648 aa2b3f1";

   procedure Copy (Buffer : out String; Length : out Natural) is
   begin
      Buffer := [others => ' '];
      Length := Stamp'Length;
      Buffer (Buffer'First .. Buffer'First + Length - 1) := Stamp;
   end Copy;

end Bardo.Version;
